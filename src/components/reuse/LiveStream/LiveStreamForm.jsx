import React, { useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { AZURE_SAS_ENDPOINT, CREATE_SHOW } from "../../api/apiDetails";
import axiosInstance from "../../../utils/axiosInstance";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Video,
  Image as ImageIcon,
  Globe,
  Layout,
  Layers,
  Type,
  AlertCircle,
  X,
  Tag,
  Check,
  ShoppingCart,
  Upload,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { predefinedTags, indianLanguages } from "../../../utils/constants";
import ProductTab from "./ProductTab4Shows";
import { IoArrowBackSharp } from "react-icons/io5";
import { uploadToAzure } from "../../../utils/azureHelpers";
import { getUtcIsoStringFromLocal } from "../../../utils/dateUtils";
import {
  deleteObjectFromS3,
  uploadImageToS3,
  uploadVideoToS3,
} from "../../../utils/aws.js";
const LiveStreamForm = () => {
  const { categories } = useAuth();
  const navigate = useNavigate();
const cdnURL = import.meta.env.VITE_AWS_CDN_URL;
  // --- State ---
  const initialFormData = {
    title: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    category: "",
    subCategory: "",
    tags: [],
    thumbnailImage: "",
    previewVideo: "",
    thumbnailImageURL: null,
    previewVideoURL: null,
    language: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload State
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState(null);
  const [selectedPreviewVideoFile, setSelectedPreviewVideoFile] =
    useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [previewVideoPreview, setPreviewVideoPreview] = useState(null);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  const [loadingStates, setLoadingStates] = useState({
    imageSAS: false,
    imageUpload: false,
    videoSAS: false,
    videoUpload: false,
  });

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({
    buyNow: [],
    auction: [],
    giveaway: [],
  });

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid image type. Please upload JPG, PNG, or WEBP.");
      // Call resetThumbnailState() only if you want to clear previous valid uploads.
      // If it's just a validation fail on a new file, clearing the input might be enough.
      if (imageInputRef.current) imageInputRef.current.value = ""; // Clear the file input
      setSelectedThumbnailFile(null); // Clear selected file state
      setThumbnailPreview(null); // Clear preview
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(
        `Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`
      );
      if (imageInputRef.current) imageInputRef.current.value = "";
      setSelectedThumbnailFile(null);
      setThumbnailPreview(null);
      return;
    }

    // If there's an old image associated, reset its state before uploading a new one.
    // This reset function attempts to delete from S3.
    if (formData.thumbnailImage) {
      await resetThumbnailState(); // Make it async if deleteObjectFromS3 is async
    }

    setSelectedThumbnailFile(file); // Set the new file
    setLoadingStates((prev) => ({ ...prev, imageUpload: true }));
    setImageUploadProgress(0);
    setErrors((prev) => ({ ...prev, thumbnailImage: undefined }));
    setThumbnailPreview(null); // Clear previous preview immediately

    try {
      // AWS S3 Upload - Assuming uploadImageToS3 returns ONLY the string key
      const s3ObjectKey = await uploadImageToS3(
        file,
        "live-stream-thumbnails", // path in S3
        (progress) => setImageUploadProgress(progress) // Note: Progress might not work if helper doesn't support it
      );

      if (!s3ObjectKey || typeof s3ObjectKey !== "string") {
        throw new Error("Image upload failed to return a valid S3 key.");
      }

      // --- Construct the URL in the frontend ---
     const constructedUrl = `${cdnURL}${s3ObjectKey}`;

      setFormData((prev) => ({
        ...prev,
        thumbnailImage: s3ObjectKey, // Store the S3 object key
        thumbnailImageURL: constructedUrl, // Store the constructed S3 URL
      }));
      setThumbnailPreview(constructedUrl); // Use the constructed URL for preview
      toast.success("Thumbnail uploaded successfully!");
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error(`Image upload failed: ${error.message || "Unknown error"}`);
      // Reset states related to the failed upload attempt
      if (imageInputRef.current) imageInputRef.current.value = "";
      setSelectedThumbnailFile(null);
      setThumbnailPreview(null);
      setFormData((prev) => ({
        ...prev,
        thumbnailImage: "",
        thumbnailImageURL: null,
      })); // Clear from form data too
      setErrors((prev) => ({
        ...prev,
        thumbnailImage: "Upload failed. Please try again.",
      }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, imageUpload: false }));
    }
  };

  const handleVideoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["video/mp4"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid video type. Please upload MP4.");
      if (videoInputRef.current) videoInputRef.current.value = "";
      setSelectedPreviewVideoFile(null);
      setPreviewVideoPreview(null);
      return;
    }

    // If there's an old video associated, reset its state.
    if (formData.previewVideo) {
      await resetPreviewVideoState(); // Make it async if deleteObjectFromS3 is async
    }

    setSelectedPreviewVideoFile(file); // Set the new file
    setLoadingStates((prev) => ({ ...prev, videoUpload: true }));
    setVideoUploadProgress(0);
    setErrors((prev) => ({ ...prev, previewVideo: undefined }));
    setPreviewVideoPreview(null);

    try {
      const duration = await getVideoDuration(file);
      const maxDuration = 30;
      if (duration > maxDuration) {
        toast.error(
          `Preview video too long (${duration.toFixed(
            1
          )}s). Max ${maxDuration} seconds.`
        );
        if (videoInputRef.current) videoInputRef.current.value = "";
        setSelectedPreviewVideoFile(null);
        setPreviewVideoPreview(null);

        return;
      }

      const s3ObjectKey = await uploadVideoToS3(
        file,
        "live-stream-previews", // path in S3
        (progress) => setVideoUploadProgress(progress)
      );

      if (!s3ObjectKey || typeof s3ObjectKey !== "string") {
        throw new Error("Video upload failed to return a valid S3 key.");
      }

     const constructedUrl = `${cdnURL}${s3ObjectKey}`;
      setFormData((prev) => ({
        ...prev,
        previewVideo: s3ObjectKey,
        previewVideoURL: constructedUrl,
      }));
      setPreviewVideoPreview(constructedUrl);
      toast.success("Preview video uploaded successfully!");
    } catch (error) {
      console.error("Video upload failed:", error);
      toast.error(`Video upload failed: ${error.message || "Unknown error"}`);
      if (videoInputRef.current) videoInputRef.current.value = "";
      setSelectedPreviewVideoFile(null);
      setPreviewVideoPreview(null);
      setFormData((prev) => ({
        ...prev,
        previewVideo: "",
        previewVideoURL: null,
      }));
      setErrors((prev) => ({
        ...prev,
        previewVideo: "Upload failed. Please try again.",
      }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, videoUpload: false }));
    }
  };

  const resetThumbnailState = useCallback(async () => {
    if (formData.thumbnailImage) {
      try {
        await deleteObjectFromS3(formData.thumbnailImage);
      } catch (error) {
        console.error("Error deleting previous thumbnail from S3:", error);
      }
    }
    setFormData((prev) => ({
      ...prev,
      thumbnailImage: "",
      thumbnailImageURL: null,
    }));
    setSelectedThumbnailFile(null);
    setThumbnailPreview(null);
    setImageUploadProgress(0);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }, [formData.thumbnailImage]);

  const resetPreviewVideoState = useCallback(async () => {
    if (formData.previewVideo) {
      try {
        await deleteObjectFromS3(formData.previewVideo);
      } catch (error) {
        console.error("Error deleting previous video from S3:", error);
      }
    }
    setFormData((prev) => ({
      ...prev,
      previewVideo: "",
      previewVideoURL: null,
    }));
    setSelectedPreviewVideoFile(null);
    setPreviewVideoPreview(null);
    setVideoUploadProgress(0);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  }, [formData.previewVideo]);

  // --- Video Duration Helper ---
  const getVideoDuration = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject("Could not load video metadata.");
      };
      video.src = URL.createObjectURL(file);
    });
  };

  // --- Tag Management ---
  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleTagSelectionComplete = () => {
    setFormData((prev) => ({ ...prev, tags: selectedTags }));
    setShowTagModal(false);
  };

  // --- Product Selection ---
  const handleProductsSelected = (products) => {
    setSelectedProducts(products);
    // Clear product error when products are selected
    if (
      errors.products &&
      (products.buyNow.length > 0 ||
        products.auction.length > 0 ||
        products.giveaway.length > 0)
    ) {
      setErrors((prev) => ({ ...prev, products: undefined }));
    }
  };

  // --- Form Input Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "category" && { subCategory: "" }), // Reset subcategory on category change
    }));
    // Clear specific error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    // Clear dateTime error if date or time changes
    if ((name === "date" || name === "time") && errors.dateTime) {
      setErrors((prev) => ({ ...prev, dateTime: "" }));
    }
  };

  const currentCategory = categories.find(
    (c) => c.categoryName === formData.category
  );

  // --- Azure Image Upload Handler ---

  // --- Form Validation ---
  const validateForm = () => {
    const newErrors = {};
    const trimmedTitle = formData.title.trim();

    if (!trimmedTitle) newErrors.title = "Title is required";
    else if (trimmedTitle.length < 10)
      newErrors.title = "Title must be at least 10 characters";
    else if (trimmedTitle.length > 100)
      newErrors.title = "Title cannot exceed 100 characters";

    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.subCategory)
      newErrors.subCategory = "Subcategory is required";
    if (!formData.language) newErrors.language = "Language is required";

    // ** Thumbnail is mandatory - check if BLOB NAME exists **
    if (!formData.thumbnailImage) {
      newErrors.thumbnailImage = "Thumbnail image is required";
    } else if (loadingStates.imageSAS || loadingStates.imageUpload) {
      newErrors.thumbnailImage = "Thumbnail upload in progress";
    }

    // Check if optional video upload is in progress
    if (loadingStates.videoSAS || loadingStates.videoUpload) {
      newErrors.previewVideo = "Preview video upload in progress"; // Add a non-blocking error message
    }

    // Date/time validation
    try {
      const selectedDate = new Date(formData.date);
      const [hours, minutes] = formData.time.split(":").map(Number);
      const selectedDateTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        hours,
        minutes
      );
      const now = new Date();
      // Add a small buffer (e.g., 1 minute) to prevent race conditions
      const minDateTime = new Date(now.getTime() + 60 * 1000);

      if (isNaN(selectedDateTime.getTime())) {
        newErrors.dateTime = "Invalid date or time selected";
      } else if (selectedDateTime <= minDateTime) {
        newErrors.dateTime =
          "Scheduled date and time must be at least 1 minute in the future";
      }
    } catch (dateError) {
      newErrors.dateTime = "Invalid date or time format";
    }

    // Product Validation
    const hasAtLeastOneProduct =
      (selectedProducts.buyNow && selectedProducts.buyNow.length > 0) ||
      (selectedProducts.auction && selectedProducts.auction.length > 0) ||
      (selectedProducts.giveaway && selectedProducts.giveaway.length > 0);

    if (!hasAtLeastOneProduct) {
      newErrors.products =
        "At least one product must be added to go live. Please confirm selection in the 'Tag products' section.";
    }

    setErrors(newErrors); // Update errors state
    return Object.keys(newErrors).length === 0;
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form.");
      // Scroll to the first error? (Optional enhancement)
      const firstErrorKey = Object.keys(errors).find((key) => errors[key]);
      if (firstErrorKey) {
        const errorElement =
          document.querySelector(`[name="${firstErrorKey}"]`) ||
          document.getElementById(`${firstErrorKey}-error`); // Adjust selector as needed
        errorElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduledAtUTC = getUtcIsoStringFromLocal(
        formData.date,
        formData.time
      );

      if (!scheduledAtUTC) {
        toast.error("Failed to format the scheduled date/time");
        setIsSubmitting(false);
        return;
      }

      // Construct payload with blob names and URLs
      const payload = {
        title: formData.title.trim(),
        scheduledAt: scheduledAtUTC,
        category: formData.category,
        subCategory: formData.subCategory,
        tags: formData.tags,
        language: formData.language,
        thumbnailImage: formData.thumbnailImage, // blob name
        previewVideo: formData.previewVideo || null, // blob name (or null if optional and not provided)
        buyNowProducts: selectedProducts.buyNow,
        auctionProducts: selectedProducts.auction,
        giveawayProducts: selectedProducts.giveaway,
      };

      console.log("Submitting Payload:", payload); // For debugging

      const response = await axiosInstance.post(CREATE_SHOW, payload);

      if (response.status === 201) {
        // Accept 200 OK too
        console.log("Submission successful:", response.data);
        toast.success("Live show scheduled successfully!");
        setFormData(initialFormData); // Reset form state
        setSelectedTags([]); // Reset local tag selection state
        resetThumbnailState(); // Reset file states
        resetPreviewVideoState();
        setErrors({}); // Clear errors
        navigate("/seller/allshows"); // Navigate on success
      } else {
        // Should be caught by axios error handling, but as a fallback
        toast.error(`Submission failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error(
        `Submission failed: ${
          error?.response?.data?.message || error.message || "Please try again."
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Determine if any upload is active ---
  const isUploading =
    loadingStates.imageSAS ||
    loadingStates.imageUpload ||
    loadingStates.videoSAS ||
    loadingStates.videoUpload;

  return (
    <div className=" mx-auto p-5 bg-white rounded-xl shadow-2xl">
      <div className="space-y-3">
        <Link
          to="/seller/allshows"
          className="flex items-center gap-2 text-blue-700 hover:text-blue-900 mb-4"
        >
          <IoArrowBackSharp size={22} />
          <div className="font-semibold">Back</div>
        </Link>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primaryBlack flex items-center justify-center gap-2">
            <Video className="w-8 h-8 text-amber-300" />
            Schedule Live Show
          </h1>
          <p className="text-base-content/60 text-neutral-700 mt-2">
            Fill in the details to set up your live stream
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 lg:mx-24 md:mx-12 sm:mx-8 xs:mx-4" // Reduced vertical space
        >
          {/* Title Input */}
          <div className="form-control">
            <label className="label">
              <span className="text-gray-800 font-medium flex items-center text-md gap-2">
                <Type className="w-4 h-4 text-indigo-500" />
                Show Title *
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`input w-full pl-5 py-3 border-2 rounded-lg transition-all duration-200 ${
                  errors.title
                    ? "border-red-300 focus:border-red-400 focus:bg-red-50"
                    : "border-indigo-200 focus:border-indigo-400 focus:bg-indigo-50"
                } bg-white text-gray-800 placeholder:text-gray-400`}
                placeholder="Enter engaging title for show"
                disabled={isSubmitting || isUploading}
                maxLength={100}
              />
              {errors.title && (
                <AlertCircle className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none" />
              )}
            </div>
            {errors.title && (
              <label className="label" id="title-error">
                <span className="label-text-alt text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title}
                </span>
              </label>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label">
                <span className=" font-medium flex items-center text-primaryBlack gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  Show Date *
                </span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`input w-full border-2 rounded-lg transition-all duration-200 ${
                    errors.dateTime
                      ? "border-red-300 focus:border-red-400 focus:bg-red-50"
                      : "border-indigo-200 focus:border-indigo-400 focus:bg-indigo-50"
                  } bg-white text-gray-800 placeholder:text-gray-400 pl-5`}
                  min={new Date().toISOString().split("T")[0]}
                  disabled={isSubmitting || isUploading}
                />
                {/* Removed icon inside input for standard date picker */}
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className=" font-medium text-primaryBlack flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Show Time *
                </span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={`input w-full border-2 rounded-lg transition-all duration-200 ${
                    errors.dateTime
                      ? "border-red-300 focus:border-red-400 focus:bg-red-50"
                      : "border-indigo-200 focus:border-indigo-400 focus:bg-indigo-50"
                  } bg-white text-gray-800 placeholder:text-gray-400 pl-5`}
                  disabled={isSubmitting || isUploading}
                />
                {/* Removed icon inside input for standard time picker */}
              </div>
            </div>
          </div>
          {errors.dateTime && (
            <div className="col-span-2">
              <label className="label" id="dateTime-error">
                <span className="label-text-alt text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.dateTime}
                </span>
              </label>
            </div>
          )}

          {/* Category and Subcategory */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label">
                <span className="font-medium flex items-center text-primaryBlack gap-2">
                  <Layout className="w-4 h-4 text-blue-600" />
                  Category *
                </span>
              </label>
              <div className="relative">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`select select-bordered w-full bg-white text-gray-800 border-2 ${
                    errors.category
                      ? "border-red-300 focus:border-red-400"
                      : "border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-200"
                  } focus:ring focus:ring-opacity-50 pl-10`}
                  disabled={isSubmitting || isUploading}
                >
                  <option disabled value="" className="text-slate-500">
                    Select Category
                  </option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.categoryName}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
                <Layout className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
              </div>
              {errors.category && (
                <label className="label" id="category-error">
                  <span className="label-text-alt text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.category}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="text-primaryBlack font-medium flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Subcategory *
                </span>
              </label>
              <div className="relative">
                <select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className={`select select-bordered w-full bg-white text-gray-800 border-2 ${
                    errors.subCategory
                      ? "border-red-300 focus:border-red-400"
                      : "border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-200"
                  } focus:ring focus:ring-opacity-50 pl-10`}
                  disabled={!formData.category || isSubmitting || isUploading}
                >
                  <option disabled value="" className="text-slate-500">
                    {formData.category
                      ? "Select Subcategory"
                      : "Select Category First"}
                  </option>
                  {currentCategory?.subcategories?.map((sub) => (
                    <option key={sub._id} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                <Layers className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
              </div>
              {errors.subCategory && (
                <label className="label" id="subCategory-error">
                  <span className="label-text-alt text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.subCategory}
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Tags Input */}
          <div className="form-control">
            <label className="label">
              <span className="text-primaryBlack font-medium flex items-center text-md gap-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                Tags (Optional)
              </span>
            </label>
            <div className="flex flex-wrap gap-2 items-center bg-indigo-50 rounded-md border py-2 px-3 border-indigo-200 min-h-[50px]">
              <button
                type="button"
                onClick={() => setShowTagModal(true)}
                className="btn btn-outline btn-sm border-indigo-500 text-indigo-600 hover:bg-indigo-100 flex items-center gap-1"
                disabled={isSubmitting || isUploading}
              >
                <span className="text-lg">+</span> Add Tags
              </button>

              {/* Selected Tags */}
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="badge badge-lg bg-indigo-200 text-indigo-800 font-medium border-none shadow-sm py-3 px-3 flex items-center gap-2 transition-all hover:bg-indigo-300"
                >
                  {tag}
                  <button
                    type="button" // Important: prevent form submission
                    className="w-5 h-5 rounded-full bg-indigo-800/10 flex items-center justify-center hover:bg-indigo-800/20 transition-colors"
                    onClick={() => {
                      if (isSubmitting || isUploading) return; // Prevent removal during submit/upload
                      setFormData((prev) => ({
                        ...prev,
                        tags: prev.tags.filter((t) => t !== tag),
                      }));
                      // Also update the local state for the modal if it's open
                      setSelectedTags((prevSelected) =>
                        prevSelected.filter((t) => t !== tag)
                      );
                    }}
                    disabled={isSubmitting || isUploading}
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="w-3 h-3 text-indigo-800/70" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Product Tab Section */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-gray-700">
              <ShoppingCart className="w-5 h-5 text-indigo-500" />
              Tag products in this show *
            </h2>
            <ProductTab onSelectProducts={handleProductsSelected} />
            {errors.products && (
              <label className="label mt-1" id="products-error">
                <span className="label-text-alt text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.products}
                </span>
              </label>
            )}
          </div>

          {/* Language Selection */}
          <div className="form-control">
            <label className="label">
              <span className=" font-medium text-primaryBlack flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-500" />
                Streaming Language *
              </span>
            </label>
            <div className="relative">
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className={`select select-bordered w-full bg-white text-gray-800 border-2 ${
                  errors.language
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-200"
                } focus:ring focus:ring-opacity-50`}
                disabled={isSubmitting || isUploading}
              >
                <option disabled value="" className="text-slate-500">
                  Select Language
                </option>
                {indianLanguages.map((lang) => (
                  <option
                    key={lang.value}
                    value={lang.value}
                    className="text-slate-800"
                  >
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.language && (
              <label className="label" id="language-error">
                <span className="label-text-alt text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.language}
                </span>
              </label>
            )}
          </div>

          {/* --- Updated File Upload Sections --- */}
          <div className="grid md:grid-cols-2 gap-6 pt-4">
            {/* Thumbnail Upload */}
            <div className="form-control">
              <label className="label">
                <span className="font-medium flex text-primaryBlack items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-500" />
                  Thumbnail Image *{" "}
                  <span className="text-xs text-gray-500">
                    (e.g., 9:16 or 11:17)
                  </span>
                </span>
                {loadingStates.imageSAS && (
                  <span className="label-text-alt text-info flex items-center gap-1">
                    <Loader2 size={14} className="animate-spin" /> Preparing...
                  </span>
                )}
              </label>
              <div
                className={`relative border-2 ${
                  errors.thumbnailImage && !loadingStates.imageUpload
                    ? "border-red-400"
                    : "border-indigo-300"
                } border-dashed rounded-xl p-4 min-h-[220px] flex flex-col justify-center items-center text-center group transition-colors duration-200 ${
                  !thumbnailPreview &&
                  !loadingStates.imageSAS &&
                  !loadingStates.imageUpload
                    ? "hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer"
                    : "bg-gray-50"
                }`}
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isSubmitting || isUploading}
                  name="thumbnailImageInput" // name for querySelector
                />

                {!(
                  loadingStates.imageSAS ||
                  loadingStates.imageUpload ||
                  thumbnailPreview
                ) && (
                  <>
                    <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                      <ImageIcon className="w-6 h-6 text-indigo-500" />
                    </div>
                    <p className="text-sm text-indigo-700 font-medium">
                      Click or drag to upload
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG, WEBP (Max 5MB)
                    </p>
                  </>
                )}

                {(loadingStates.imageSAS || loadingStates.imageUpload) && (
                  <div className="flex flex-col items-center justify-center text-center w-full">
                    <Loader2
                      size={32}
                      className="animate-spin text-indigo-500 mb-3"
                    />
                    <p className="text-sm text-gray-600">
                      {loadingStates.imageSAS
                        ? "Preparing secure link..."
                        : `Uploading...`}
                    </p>
                  </div>
                )}

                {thumbnailPreview && !loadingStates.imageUpload && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="max-h-[180px] max-w-full object-contain rounded-lg shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.thumbnailImage) {
                          deleteObjectFromS3(formData.thumbnailImage)
                            .then(() =>
                              toast.success("Thumbnail removed from S3")
                            )
                            .catch(() =>
                              toast.error("Failed to remove thumbnail")
                            );
                        }
                        resetThumbnailState();
                      }}
                      className="btn btn-circle btn-xs bg-red-500 hover:bg-red-600 text-white absolute -top-1 -right-1 shadow-lg z-20"
                      aria-label="Remove thumbnail"
                      disabled={isSubmitting || isUploading}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              {errors.thumbnailImage && !loadingStates.imageUpload && (
                <label className="label" id="thumbnailImage-error">
                  <span className="label-text-alt text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.thumbnailImage}
                  </span>
                </label>
              )}
            </div>

            {/* Preview Video Upload */}
            <div className="form-control">
              <label className="label">
                <span className="font-medium flex text-primaryBlack items-center gap-2">
                  <Video className="w-4 h-4 text-indigo-500" />
                  Preview Video{" "}
                  <span className="text-xs text-gray-500">
                    (Optional, 9:16, Max 30s)
                  </span>
                </span>
                {loadingStates.videoSAS && (
                  <span className="label-text-alt text-info flex items-center gap-1">
                    <Loader2 size={14} className="animate-spin" /> Preparing...
                  </span>
                )}
                {/* {loadingStates.videoUpload && (
                  <span className="label-text-alt text-info flex items-center gap-1">
                    <Loader2 size={14} className="animate-spin" />{" "}
                    {videoUploadProgress}%
                  </span>
                )} */}
              </label>
              <div
                className={`relative border-2 border-indigo-300 border-dashed rounded-xl p-4 min-h-[220px] flex flex-col justify-center items-center text-center group transition-colors duration-200 ${
                  !previewVideoPreview &&
                  !loadingStates.videoSAS &&
                  !loadingStates.videoUpload
                    ? "hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer"
                    : "bg-gray-50"
                } ${errors.previewVideo ? "border-red-400" : ""}`}
              >
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4"
                  onChange={handleVideoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isSubmitting || isUploading}
                  name="previewVideoInput"
                />

                {!(
                  loadingStates.videoSAS ||
                  loadingStates.videoUpload ||
                  previewVideoPreview
                ) && (
                  <>
                    <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                      <Video className="w-6 h-6 text-indigo-500" />
                    </div>
                    <p className="text-sm text-indigo-700 font-medium">
                      Click or drag to upload
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      MP4 only (Max 30s)
                    </p>
                  </>
                )}

                {(loadingStates.videoSAS || loadingStates.videoUpload) && (
                  <div className="flex flex-col items-center justify-center text-center w-full">
                    <Loader2
                      size={32}
                      className="animate-spin text-indigo-500 mb-3"
                    />
                    <p className="text-sm text-gray-600">
                      {loadingStates.videoSAS
                        ? "Preparing secure link..."
                        : "Uploading..."}
                    </p>
                    <progress
                      className="progress progress-info w-3/4 mt-2"
                      value={videoUploadProgress}
                      max="100"
                    ></progress>
                    <p className="text-xs font-semibold mt-1">
                      {videoUploadProgress}%
                    </p>
                  </div>
                )}

                {previewVideoPreview && !loadingStates.videoUpload && (
                  <div className="relative w-full h-full flex items-center justify-center z-20">
                    <video
                      controls
                      controlsList="nodownload"
                      className="max-h-[180px] max-w-full object-contain rounded-lg shadow-md"
                      src={previewVideoPreview}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.previewVideo) {
                          deleteObjectFromS3(formData.previewVideo)
                            .then(() =>
                              toast.success("Preview video removed from S3")
                            )
                            .catch(() =>
                              toast.error("Failed to remove preview video")
                            );
                        }
                        resetPreviewVideoState();
                      }}
                      className="btn btn-circle btn-xs bg-red-500 hover:bg-red-600 text-white absolute -top-1 -right-1 shadow-lg z-30"
                      aria-label="Remove preview video"
                      disabled={isSubmitting || isUploading}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              {/* Display non-blocking error if upload is in progress */}
              {errors.previewVideo && (
                <label className="label" id="previewVideo-error">
                  <span className="label-text-alt text-orange-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.previewVideo}
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center pt-8 pb-4">
            <button
              type="submit"
              className="btn btn-lg bg-primaryYellow hover:bg-amber-400 text-primaryBlack font-bold px-8"
              disabled={isSubmitting || isUploading} // Disable if submitting OR any upload is active
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scheduling...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Schedule Show
                </span>
              )}
            </button>
            {isUploading && (
              <p className="text-sm text-blue-600 mt-2">
                Please wait for uploads to complete...
              </p>
            )}
          </div>
        </form>

        {/* Add Tag Modal (Keep existing structure) */}
        {showTagModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm max-h-screen flex items-center justify-center p-4 z-50">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 relative bg-white rounded-xl shadow-xl w-full max-w-xl mx-auto">
              <div className="flex flex-col max-h-[80vh] h-full">
                {/* Header */}
                <div className="py-3 px-4 border-b flex items-center justify-between flex-shrink-0">
                  <h3 className="text-xl font-semibold text-slate-700 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-indigo-500" />
                    Select Tags
                  </h3>
                  <button
                    onClick={() => setShowTagModal(false)}
                    className="btn btn-circle btn-ghost btn-sm"
                    aria-label="Close tag selection modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {/* Instructions */}
                <p className="px-4 pt-2 text-sm text-gray-500">
                  Choose tags relevant to your show content.
                </p>
                {/* Tags Grid - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {predefinedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`
                                                    group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left
                                                    transition-all duration-200 border text-sm
                                                    ${
                                                      selectedTags.includes(tag)
                                                        ? "bg-indigo-100 border-indigo-400 text-indigo-800 font-medium ring-2 ring-indigo-200"
                                                        : "bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700"
                                                    }
                                                `}
                      >
                        <span className="flex-1">{tag}</span>
                        <span
                          className={`
                                                        flex items-center justify-center w-5 h-5 rounded-full transition-all duration-200 border
                                                        ${
                                                          selectedTags.includes(
                                                            tag
                                                          )
                                                            ? "bg-indigo-500 border-indigo-500 text-white"
                                                            : "bg-white border-gray-300 group-hover:border-gray-400"
                                                        }
                                                    `}
                        >
                          <Check
                            className={`w-3 h-3 transition-opacity duration-200 ${
                              selectedTags.includes(tag)
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                            strokeWidth={3}
                          />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Footer */}
                <div className="p-4 border-t flex flex-col sm:flex-row gap-3 justify-end flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowTagModal(false)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleTagSelectionComplete}
                    className="btn bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={selectedTags.length === 0}
                  >
                    Add {selectedTags.length} Selected Tag
                    {selectedTags.length !== 1 ? "s" : ""}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveStreamForm;
