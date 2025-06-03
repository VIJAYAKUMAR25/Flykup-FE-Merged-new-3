import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Upload, ShoppingBag, Film, Video, Type, Camera, FileVideo, Hash, Save, RotateCcw, ArrowLeft, X, Loader2, AlertCircle
} from "lucide-react";
import ProductTabShopaAble from "./ShipperProductTab.jsx";
import { CREATE_SHOPPABLE_VIDEO, AZURE_SAS_ENDPOINT, GENERATE_VIDEO_SAS_URL } from "../../api/apiDetails.js";
import axiosInstance from "../../../utils/axiosInstance.js";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";

// --- Helper Function for Azure Upload ---
const uploadToAzure = async (sasUrl, file, onProgress) => {
  try {
    const response = await axios.put(sasUrl, file, {
      headers: {
        "Content-Type": file.type,
        "x-ms-blob-type": "BlockBlob",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        } else {
          onProgress(0);
        }
      },
    });
    return response;
  } catch (error) {
    console.error("Azure upload failed:", error);
    let errorMessage = "Azure upload failed.";
    if (error.response) {
      // Try to parse Azure XML error
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(error.response.data, "text/xml");
        const azureError = xmlDoc.getElementsByTagName("Message")[0]?.textContent;
        if (azureError) errorMessage = `Azure Error: ${azureError}`;
        else errorMessage = `Azure Error: HTTP ${error.response.status} - ${error.response.statusText}`;
      } catch (parseError) {
        errorMessage = `Azure Error: HTTP ${error.response.status} - ${error.response.statusText}`;
      }
    } else if (error.request) {
      errorMessage = "Azure Upload Error: No response received from Azure.";
    } else {
      errorMessage = `Azure Upload Error: ${error.message}`;
    }
    throw new Error(errorMessage); // Rethrow a more informative error
  }
};
// --- End Helper Function ---


const ShipperShopableForm = ({ initialData, onSubmit, isEditMode = false }) => {
  const { categories } = useAuth();
  const navigate = useNavigate();





  // --- State ---
  const [formData, setFormData] = useState({
    videoTitle: initialData?.title || "",
    description: initialData?.description || "",
    hashtags: initialData?.hashTags || [],
    hashtagInput: "",
    category: initialData?.category || "",
    subcategory: initialData?.subcategory || "",
    thumbnailURL: initialData?.thumbnailURL || null,
    originalVideoBlobName: initialData?.originalVideoBlobName || null,
  });

  console.log("Initial Data:", initialData); // Debugging line  



  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);

  const [thumbnailPreview, setThumbnailPreview] = useState(initialData?.thumbnailURL || null); // Use initial URL directly
  const [videoPreview, setVideoPreview] = useState(null); // Local preview only for NEW uploads

  const [uploadData, setUploadData] = useState({
    thumbnailBlobName: initialData?.thumbnailBlobName || null,
    originalFileSize: initialData?.originalFileSize || null,
  });

  const [uploadProgress, setUploadProgress] = useState({
    image: 0,
    video: 0,
  });

  const [loading, setLoading] = useState({
    imageSAS: false,
    videoSAS: false,
    imageUpload: false,
    videoUpload: false,
    submit: false,
  });

  const hashtagInputRef = useRef(null);
  const imageInputRef = useRef(null); // Ref for file input
  const videoInputRef = useRef(null); // Ref for file input
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [productsListed, setProductsListed] = useState(initialData?.productsListed || []);
  const [errors, setErrors] = useState({});

  // --- Effects ---

  // Cleanup Object URLs on unmount or when preview changes
  useEffect(() => {
    let imageObjectURL = null;
    let videoObjectURL = null;

    if (selectedImageFile && thumbnailPreview?.startsWith('blob:')) {
      imageObjectURL = thumbnailPreview;
    }
    if (selectedVideoFile && videoPreview?.startsWith('blob:')) {
      videoObjectURL = videoPreview;
    }

    return () => {
      if (imageObjectURL) {
        URL.revokeObjectURL(imageObjectURL);
        console.log("Revoked Image URL:", imageObjectURL);
      }
      if (videoObjectURL) {
        URL.revokeObjectURL(videoObjectURL);
        console.log("Revoked Video URL:", videoObjectURL);
      }
    };
  }, [thumbnailPreview, videoPreview, selectedImageFile, selectedVideoFile]);






  // Clear product errors when products are added
  useEffect(() => {
    if (productsListed.length > 0 && errors.products) {
      setErrors((prev) => ({ ...prev, products: undefined }));
    }
  }, [productsListed, errors.products]);


  // --- Computed Values ---
  const selectedCategoryObj = categories.find(
    (cat) => cat.categoryName === formData.category
  );

  const isLoading = loading.imageSAS || loading.videoSAS || loading.imageUpload || loading.videoUpload || loading.submit;

  // --- Handlers ---
  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setFormData((prev) => ({
      ...prev,
      category: selectedCategory,
      subcategory: "", // Reset subcategory
    }));
    setErrors((prev) => ({
      ...prev,
      category: undefined,
      subcategory: undefined,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const resetImageState = useCallback(() => {
    setFormData(prev => ({ ...prev, thumbnailURL: initialData?.thumbnailURL || null }));
    setUploadData(prev => ({ ...prev, thumbnailBlobName: initialData?.thumbnailBlobName || null }));
    setSelectedImageFile(null);
    if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailPreview(initialData?.thumbnailURL || null);
    setUploadProgress(prev => ({ ...prev, image: 0 }));
    setLoading(prev => ({ ...prev, imageSAS: false, imageUpload: false }));
    setErrors(prev => ({ ...prev, thumbnail: undefined }));
    if (imageInputRef.current) imageInputRef.current.value = "";
  }, [initialData?.thumbnailURL, initialData?.thumbnailBlobName, thumbnailPreview]);

  const resetVideoState = useCallback(() => {
    setFormData(prev => ({ ...prev, originalVideoBlobName: initialData?.originalVideoBlobName || null }));
    setUploadData(prev => ({ ...prev, originalFileSize: initialData?.originalFileSize || null }));
    setSelectedVideoFile(null);
    if (videoPreview && videoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(null);
    setUploadProgress(prev => ({ ...prev, video: 0 }));
    setLoading(prev => ({ ...prev, videoSAS: false, videoUpload: false }));
    setErrors(prev => ({ ...prev, videoFile: undefined }));
    if (videoInputRef.current) videoInputRef.current.value = "";
  }, [initialData?.originalVideoBlobName, initialData?.originalFileSize, videoPreview]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Basic Validation
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type. Please select an image.");
      resetImageState();
      return;
    }
    //size validation
    const maxSize = 5 * 1024 * 1024; // 5MB 
    if (file.size > maxSize) {
      toast.error(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.`);
      resetImageState();
      return;
    }

    resetImageState();
    setSelectedImageFile(file);
    const localPreviewUrl = URL.createObjectURL(file);
    setThumbnailPreview(localPreviewUrl);
    setLoading(prev => ({ ...prev, imageSAS: true, imageUpload: false }));
    setUploadProgress(prev => ({ ...prev, image: 0 }));
    setErrors(prev => ({ ...prev, thumbnail: undefined }));

    try {
      toast.info("Preparing image upload...");
      const sasResponse = await axiosInstance.post(AZURE_SAS_ENDPOINT, {
        originalFilename: file.name,
      });

      const { sasUrl, blobName, azureUrl } = sasResponse.data;

      if (!sasUrl || !blobName || !azureUrl) {
        throw new Error("Invalid SAS response from server.");
      }

      setLoading(prev => ({ ...prev, imageSAS: false, imageUpload: true }));
      toast.info("Uploading image...");

      await uploadToAzure(sasUrl, file, (progress) => {
        setUploadProgress(prev => ({ ...prev, image: progress }));
      });

      setFormData(prev => ({ ...prev, thumbnailURL: azureUrl }));
      setUploadData(prev => ({ ...prev, thumbnailBlobName: blobName }));
      toast.success("Thumbnail uploaded successfully!");
      setLoading(prev => ({ ...prev, imageUpload: false }));

    } catch (error) {
      console.error("Image upload process failed:", error);
      toast.error(`Image upload failed: ${error.message || "Unknown error"}`);
      resetImageState();
    } finally {

      setLoading(prev => ({ ...prev, imageSAS: false, imageUpload: false }));
    }
  };


  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Invalid file type. Please select a video.");
      resetVideoState();
      return;
    }
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Video is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 500MB.`);
      resetVideoState();
      return;
    }


    resetVideoState();
    setSelectedVideoFile(file);
    const localPreviewUrl = URL.createObjectURL(file);
    setVideoPreview(localPreviewUrl); // Show local preview
    setLoading(prev => ({ ...prev, videoSAS: true, videoUpload: false }));
    setUploadProgress(prev => ({ ...prev, video: 0 }));
    setErrors(prev => ({ ...prev, videoFile: undefined }));

    try {
      // 1. Get SAS URL from backend
      toast.info("Preparing video upload...");
      const sasResponse = await axiosInstance.post(GENERATE_VIDEO_SAS_URL, {
        originalFilename: file.name,
      });

      const { sasUrl, blobName } = sasResponse.data;

      if (!sasUrl || !blobName) {
        throw new Error("Invalid SAS response from server.");
      }

      setLoading(prev => ({ ...prev, videoSAS: false, videoUpload: true }));
      toast.info("Uploading video... (this may take a while)");

      // 2. Upload file to Azure using SAS URL
      await uploadToAzure(sasUrl, file, (progress) => {
        setUploadProgress(prev => ({ ...prev, video: progress }));
      });

      // 3. Success: Update state with final data
      setFormData(prev => ({ ...prev, originalVideoBlobName: blobName })); // Store blob name
      setUploadData(prev => ({ ...prev, originalFileSize: file.size })); // Store file size
      toast.success("Video uploaded successfully! Ready for processing.");
      setLoading(prev => ({ ...prev, videoUpload: false }));

    } catch (error) {
      console.error("Video upload process failed:", error);
      toast.error(`Video upload failed: ${error.message || "Unknown error"}`);
      resetVideoState(); // Reset on failure
    } finally {
      setLoading(prev => ({ ...prev, videoSAS: false, videoUpload: false }));
    }
  };


  // Hashtag Handlers (Unchanged)
  const addHashtag = () => {
    const tag = formData.hashtagInput.trim().replace(/[^a-zA-Z0-9]/g, "");
    if (tag && !formData.hashtags.includes(`#${tag}`)) { // Prevent duplicates
      setFormData((prev) => ({
        ...prev,
        hashtags: [...prev.hashtags, `#${tag}`],
        hashtagInput: "",
      }));
    } else if (!tag) {
      setFormData(prev => ({ ...prev, hashtagInput: "" })); // Clear input if only whitespace
    } else {
      toast.info(`Hashtag "${tag}" already added.`); // Inform user about duplicates
      setFormData(prev => ({ ...prev, hashtagInput: "" })); // Clear input
    }
    hashtagInputRef.current?.focus();
  };

  const handleHashtagKeyDown = (e) => {
    if ([" ", ",", "Enter"].includes(e.key)) {
      e.preventDefault();
      addHashtag();
    }
  };

  const removeHashtag = (index) => {
    setFormData((prev) => ({
      ...prev,
      hashtags: prev.hashtags.filter((_, i) => i !== index),
    }));
  };

  // Form Reset
  const resetForm = () => {
    setFormData({
      videoTitle: "",
      description: "",
      thumbnailURL: null,
      originalVideoBlobName: null,
      hashtags: [],
      hashtagInput: "",
      category: "",
      subcategory: "",
    });
    setUploadData({
      thumbnailBlobName: null,
      originalFileSize: null,
    });
    setProductsListed([]);
    resetImageState(); // Use helper to reset image specifics
    resetVideoState(); // Use helper to reset video specifics
    setErrors({});
    setShowResetModal(false);
    toast.info("Form reset.");
  };

  // --- Form Submission ---
  const validateForm = () => {
    const newErrors = {};
    if (!formData.videoTitle.trim()) newErrors.videoTitle = "Video title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.thumbnailURL) newErrors.thumbnail = "Thumbnail image is required (upload must complete)"; // Check for final URL
    if (!formData.originalVideoBlobName) newErrors.videoFile = "Video file is required (upload must complete)"; // Check for final blob name
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.subcategory) newErrors.subcategory = "Subcategory is required";
    if (productsListed.length === 0) newErrors.products = "At least one product must be selected";

    // Check if uploads are still in progress
    if (loading.imageSAS || loading.imageUpload) newErrors.thumbnail = "Thumbnail upload is still in progress.";
    if (loading.videoSAS || loading.videoUpload) newErrors.videoFile = "Video upload is still in progress.";

    if (!isEditMode) {
      if (!formData.thumbnailURL) newErrors.thumbnail = "Thumbnail image is required";
      if (!formData.originalVideoBlobName) newErrors.videoFile = "Video file is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting.");
      // Scroll to the first error? (Optional enhancement)
      const firstErrorKey = Object.keys(errors).find(key => errors[key]);
      if (firstErrorKey) {
        const errorElement = document.querySelector(`[name="${firstErrorKey}"]`) || document.getElementById(`${firstErrorKey}-error`); // Adjust selector as needed
        errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }


    if (isEditMode) {
      handleEditSubmit(); // Directly call edit submit if valid
    } else {
      setShowSubmitModal(true); // Show confirmation for new uploads
    }
  };


  // Consolidated Payload Creation
  const createPayload = () => ({
    title: formData.videoTitle.trim(),
    description: formData.description.trim(),
    category: formData.category,
    subcategory: formData.subcategory,
    productsListed, // Array of ObjectIds
    hashTags: formData.hashtags,
    // Data from Azure uploads
    thumbnailURL: formData.thumbnailURL,           // The public Azure URL for the image
    thumbnailBlobName: uploadData.thumbnailBlobName, // The blob name for the image
    originalVideoBlobName: formData.originalVideoBlobName, // The blob name for the video
    originalFileSize: uploadData.originalFileSize,     // The size of the uploaded video
  });


  const handleEditSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving changes.");
      return;
    }

    setLoading((prev) => ({ ...prev, submit: true }));
    try {
      const payload = createPayload();

      if (typeof onSubmit === "function") {
        await onSubmit(payload); // Call the onSubmit prop passed for editing
        toast.success("Video details updated successfully!"); // Assuming onSubmit handles API call and potential errors
        navigate("/shipper/viewvideo"); // Navigate back after successful update
      } else {
        console.warn("onSubmit prop is not defined for edit mode.");
        toast.warn("Configuration error: Cannot save changes."); // Or handle API call directly here if needed
      }

    } catch (error) {
      console.error("Update failed:", error);
      toast.error(`Failed to update video: ${error?.response?.data?.message || error.message || 'Please try again.'}`);
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  const confirmSubmit = async () => {
    if (!validateForm()) {
      setShowSubmitModal(false);
      toast.error("Submission cancelled due to errors.");
      return;
    }

    setLoading((prev) => ({ ...prev, submit: true }));
    setShowSubmitModal(false);

    try {
      const payload = createPayload();
      if (!isEditMode) {
        console.log("Submitting Payload:", payload);
        const response = await axiosInstance.post(
          CREATE_SHOPPABLE_VIDEO,
          payload
        );

        if (response.status === 201 || response.status === 200) {
          toast.success("Shoppable video submitted successfully and is processing!");
          resetForm();
          navigate("/shipper/viewvideo");
        } else {
          toast.error(`Submission failed with status: ${response.status}`);
        }
      }
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error(`Submission failed: ${error?.response?.data?.message || error.message || 'Please try again.'}`);
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };


  // --- JSX ---
  return (
    <div className="bg-newYellow min-h-screen py-6">
      <div className="w-full mx-auto p-6 px-3 lg:px-12 bg-black/10 rounded-xl shadow-xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/shipper/viewvideo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm border border-yellow-200 text-gray-800 hover:bg-white hover:shadow transition-all duration-200 group"
          >
            <ArrowLeft size={18} className="text-yellow-600 group-hover:transform group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Videos</span>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white text-gray-900 rounded-lg shadow-md w-full mb-2">
          {/* Icon and Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Upload className="h-8 w-8 text-gray-800" strokeWidth={2} />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow">
                <ShoppingBag className="h-4 w-4 text-green-500" strokeWidth={2} />
              </div>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              {isEditMode ? "Edit" : "Upload"} Shoppable <span className="text-newYellow">Video</span>
            </h1>
          </div>
          {/* Steps - Desktop */}
          <div className="hidden sm:flex items-center gap-4 mt-3 sm:mt-0 text-gray-600 text-xs">
            {[1, 2, 3].map((step, index) => (
              <React.Fragment key={step}>
                {index > 0 && <span className="text-gray-400">→</span>}
                <div className="flex items-center">
                  <span className="bg-newYellow rounded-full h-5 w-5 flex items-center justify-center mr-2 shadow-sm">
                    <span className="text-newBlack font-bold text-xs">{step}</span>
                  </span>
                  <span>{["Upload", "Tag", "Share"][index]}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
          {/* Steps - Mobile */}
          <div className="flex sm:hidden items-center gap-2 mt-3 text-gray-600 text-xs">
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">1. Upload</span>
            <span className="text-gray-400">→</span>
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">2. Tag</span>
            <span className="text-gray-400">→</span>
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">3. Share</span>
          </div>
        </div>


        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-2">

          {/* Video Title */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-base font-medium text-newBlack flex items-center gap-2">
                <Film className="h-5 w-5 text-gray-600" /> Video Title
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="videoTitle"
                value={formData.videoTitle}
                onChange={handleInputChange}
                className={`input input-bordered text-newBlack bg-white w-full pl-10 focus:border-newYellow focus:ring-1 focus:ring-newYellow transition-all duration-200 ${errors.videoTitle ? 'input-error' : ''}`}
                placeholder="Enter an engaging title for your video"
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Video className="h-5 w-5" />
              </div>
            </div>
            {errors.videoTitle && <p id="videoTitle-error" className="text-red-600 text-sm mt-1">{errors.videoTitle}</p>}
          </div>

          {/* Description */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-base font-medium text-newBlack flex items-center gap-2">
                <Type className="h-5 w-5 text-gray-600" /> Description
              </span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`textarea textarea-bordered bg-white text-newBlack h-32 w-full focus:border-newYellow focus:ring-1 focus:ring-newYellow transition-all duration-200 ${errors.description ? 'textarea-error' : ''}`}
              placeholder="Describe your product, benefits, and key features..."
              disabled={isLoading}
            />
            {errors.description && <p id="description-error" className="text-red-600 text-sm mt-1">{errors.description}</p>}
          </div>


          {/* Upload Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Thumbnail Upload */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-base font-medium text-newBlack flex items-center gap-2">
                  <Camera className="h-5 w-5 text-gray-600" /> Thumbnail Image
                </span>
                {loading.imageSAS && <span className="label-text-alt text-info flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Preparing...</span>}
                {loading.imageUpload && <span className="label-text-alt text-info flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Uploading {uploadProgress.image}%</span>}
              </label>
              <div className={`flex flex-col items-center justify-center bg-white border-2 ${errors.thumbnail ? 'border-red-500' : 'border-dashed border-gray-300'} rounded-lg p-4 transition-all min-h-[200px] ${!thumbnailPreview && !loading.imageSAS && !loading.imageUpload ? 'hover:border-newYellow cursor-pointer' : ''}`}>

                {isEditMode ? (
                  <div className="relative w-full h-48 flex items-center justify-center">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="max-w-full max-h-48 object-contain rounded-lg shadow-md"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white px-3 py-1 rounded text-sm">
                      Thumbnail cannot be changed
                    </div>
                  </div>
                ) : (
                  <>
                    {!thumbnailPreview && !loading.imageSAS && !loading.imageUpload && (
                      <>
                        <Camera className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-center text-gray-500 text-sm mb-3">
                          Click or drag to upload (JPG, PNG, WEBP)
                        </p>
                        <button
                          type="button"
                          className="btn btn-sm bg-newYellow text-black hover:bg-amber-400"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={isLoading}
                        >
                          Select Image
                        </button>
                      </>
                    )}

                    {(loading.imageSAS || loading.imageUpload) && (
                      <div className="flex flex-col items-center justify-center text-center">
                        <Loader2 size={40} className="animate-spin text-newYellow mb-3" />
                        <p className="text-sm text-gray-600">
                          {loading.imageSAS ? 'Preparing secure link...' : `Uploading... ${uploadProgress.image}%`}
                        </p>
                        <progress
                          className="progress progress-warning w-full mt-2"
                          value={uploadProgress.image}
                          max="100"
                        ></progress>
                      </div>
                    )}

                    {thumbnailPreview && !loading.imageSAS && !loading.imageUpload && (
                      <div className="relative w-full h-48 flex items-center justify-center">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="max-w-full max-h-48 object-contain rounded-lg shadow-md"
                        />
                        {/* Allow removing only if not currently uploading/saving */}
                        <button
                          type="button"
                          onClick={resetImageState}
                          className="btn btn-circle btn-xs bg-red-500 hover:bg-red-600 text-white absolute -top-2 -right-2 shadow-lg"
                          aria-label="Remove thumbnail"
                          disabled={isLoading}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}




              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isLoading || isEditMode}
                name="thumbnailInput"
              />
              {errors.thumbnail && <p id="thumbnail-error" className="text-red-600 text-sm mt-1">{errors.thumbnail}</p>}
            </div>


            {/* Video Upload */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-base font-medium text-newBlack flex items-center gap-2">
                  <FileVideo className="h-5 w-5 text-gray-600" /> Shoppable Video
                </span>
                {loading.videoSAS && <span className="label-text-alt text-info flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Preparing...</span>}
                {loading.videoUpload && <span className="label-text-alt text-info flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Uploading {uploadProgress.video}%</span>}
              </label>
              <div className={`flex flex-col items-center justify-center bg-white border-2 ${errors.videoFile ? 'border-red-500' : 'border-dashed border-gray-300'} rounded-lg p-4 transition-all min-h-[200px] ${!videoPreview && !loading.videoSAS && !loading.videoUpload ? 'hover:border-newYellow cursor-pointer' : ''}`}>

                {isEditMode ? (
                  <div className="relative w-full h-48 flex items-center justify-center">
                    <video
                      controls
                      controlsList="nodownload"
                      className="max-w-full max-h-48 object-contain rounded-lg shadow-md"
                      src={formData.hlsMasterPlaylistUrl}
                    />
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white px-3 py-1 rounded text-sm">
                      Video cannot be changed
                    </div>
                  </div>
                ) : (
                  <>
                    {!videoPreview && !loading.videoSAS && !loading.videoUpload && (
                      <>
                        <FileVideo className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-center text-gray-500 text-sm mb-3">
                          Click or drag to upload (MP4, MOV, WEBM - Max 500MB)
                        </p>
                        <button type="button" className="btn btn-sm bg-newYellow text-black hover:bg-amber-400" onClick={() => videoInputRef.current?.click()} disabled={isLoading}>
                          Select Video
                        </button>
                      </>
                    )}
                    {(loading.videoSAS || loading.videoUpload) && (
                      <div className="flex flex-col items-center justify-center text-center">
                        <Loader2 size={40} className="animate-spin text-newYellow mb-3" />
                        <p className="text-sm text-gray-600">{loading.videoSAS ? 'Preparing secure link...' : `Uploading... ${uploadProgress.video}%`}</p>
                        <progress className="progress progress-warning w-full mt-2" value={uploadProgress.video} max="100"></progress>
                      </div>
                    )}
                    {videoPreview && !loading.videoSAS && !loading.videoUpload && (
                      <div className="relative w-full h-48 flex items-center justify-center">
                        <video
                          controls
                          controlsList="nodownload"
                          className="max-w-full max-h-48 object-contain rounded-lg shadow-md"
                          src={videoPreview}
                        />
                        <button
                          type="button"
                          onClick={resetVideoState}
                          className="btn btn-circle btn-xs bg-red-500 hover:bg-red-600 text-white absolute -top-2 -right-2 shadow-lg"
                          aria-label="Remove video"
                          disabled={isLoading}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleVideoUpload}
                className="hidden"
                disabled={isLoading || isEditMode}
                name="videoFileInput"
              />
              {errors.videoFile && <p id="videoFile-error" className="text-red-600 text-sm mt-1">{errors.videoFile}</p>}
            </div>
          </div>

          {/* Product Tab */}
          <ProductTabShopaAble
            initialSelected={initialData?.productsListed || []}
            onSelectProducts={setProductsListed}
          />
          {errors.products && <p id="products-error" className="text-red-600 text-sm mt-1">{errors.products}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-base font-medium text-newBlack">Category</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
                className={`select select-bordered w-full bg-white ${errors.category ? 'select-error' : ''}`}
                disabled={isLoading}
              >
                <option value="" disabled>Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.categoryName}>{cat.categoryName}</option>
                ))}
              </select>
              {errors.category && <p id="category-error" className="text-red-600 text-sm mt-1">{errors.category}</p>}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-base font-medium text-newBlack">Subcategory</span>
              </label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange} // Use generic handleChange
                className={`select select-bordered w-full bg-white ${errors.subcategory ? 'select-error' : ''}`}
                disabled={!formData.category || isLoading}
              >
                <option value="" disabled>Select Subcategory</option>
                {selectedCategoryObj?.subcategories?.map((sub) => (
                  <option key={sub._id} value={sub.name}>{sub.name}</option>
                ))}
                {!formData.category && <option value="" disabled>Select a category first</option>}
              </select>
              {errors.subcategory && <p id="subcategory-error" className="text-red-600 text-sm mt-1">{errors.subcategory}</p>}
            </div>
          </div>


          {/* Hashtags */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-base font-medium text-newBlack flex items-center gap-2">
                <Hash className="h-5 w-5 text-gray-600" /> Hashtags (Optional)
              </span>
            </label>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex flex-wrap gap-2 mb-3 min-h-[2rem]">
                {formData.hashtags.length === 0 && (
                  <span className="text-gray-500 text-sm italic self-center">Add hashtags to increase visibility (e.g., #fashion)</span>
                )}
                {formData.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="badge badge-lg bg-newYellow text-newBlack font-medium gap-1 pl-3 pr-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeHashtag(index)}
                      className="btn btn-ghost btn-xs btn-circle text-black/60 hover:bg-black/10"
                      aria-label={`Remove hashtag ${tag}`}
                      disabled={isLoading}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="join w-full">
                <input
                  ref={hashtagInputRef}
                  type="text"
                  value={formData.hashtagInput}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hashtagInput: e.target.value }))}
                  onKeyDown={handleHashtagKeyDown}
                  placeholder="Type tag and press Enter or Space..."
                  className="input input-bordered bg-white text-newBlack join-item w-full focus:border-newYellow focus:ring-1 focus:ring-newYellow"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={addHashtag}
                  className="btn bg-newYellow text-newBlack hover:bg-amber-400 join-item"
                  disabled={!formData.hashtagInput.trim() || isLoading}
                >
                  Add
                </button>
              </div>
              {/* Optional: Suggest popular tags */}
              {/* <div className="text-xs mt-2 text-gray-600">
                    Popular: <button type="button" className="link link-hover link-primary ml-1">#fashion</button> ...
                </div> */}
            </div>
          </div>

          <div className="divider my-4"></div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              className="btn btn-ghost bg-gray-200 hover:bg-gray-300 text-newBlack flex items-center gap-2"
              onClick={() => setShowResetModal(true)}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4" />
              Reset Form
            </button>
            <button
              type="submit"
              className={`btn ${isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white flex items-center gap-2 ${loading.submit ? "loading" : ""}`}
              disabled={isLoading}
            >
              {loading.submit ? (
                isEditMode ? "Saving..." : "Submitting..."
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditMode ? "Save Changes" : "Submit Shoppable Video"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modals (Unchanged in structure, potentially adjust colors) */}
      {showResetModal && (
        <div className="modal modal-open">
          <div className="modal-box bg-white text-gray-800">
            <h3 className="font-bold text-lg text-red-600 flex items-center gap-2"><AlertCircle />Confirm Reset</h3>
            <p className="py-4">Are you sure you want to reset the form? All entered data and uploads will be cleared.</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowResetModal(false)}>Cancel</button>
              <button className="btn btn-error text-white" onClick={resetForm}>Reset Form</button>
            </div>
          </div>
          <div className="modal-backdrop bg-black bg-opacity-30" onClick={() => setShowResetModal(false)}></div>
        </div>
      )}

      {showSubmitModal && (
        <div className="modal modal-open">
          <div className="modal-box bg-white text-gray-800">
            <h3 className="font-bold text-lg text-green-600 flex items-center gap-2"><Upload />Confirm Submission</h3>
            <p className="py-4">Are you sure you want to submit this shoppable video?</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowSubmitModal(false)}>Cancel</button>
              <button className="btn bg-green-600 hover:bg-green-700 text-white" onClick={confirmSubmit} disabled={loading.submit}>
                {loading.submit ? <Loader2 className="animate-spin" /> : "Confirm & Submit"}
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black bg-opacity-30" onClick={() => setShowSubmitModal(false)}></div>
        </div>
      )}
    </div>
  );
};

export default ShipperShopableForm;