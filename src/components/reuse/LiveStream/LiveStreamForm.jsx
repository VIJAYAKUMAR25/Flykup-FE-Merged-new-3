import React, { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { CREATE_SHOW } from "../../api/apiDetails";
import axiosInstance from "../../../utils/axiosInstance";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Video,
  Type,
  AlertCircle,
  X,
  Globe,
  Layout,
  Layers,
  ShoppingCart,
  Upload,
  RotateCcw,
  Loader2,
  ArrowLeft,
  Save,
  Camera,
  FileVideo,
  Hash,
} from "lucide-react";
import { indianLanguages } from "../../../utils/constants";
import ProductTab from "./ProductTab4Shows";
import { getUtcIsoStringFromLocal } from "../../../utils/dateUtils";
import {
  deleteObjectFromS3,
  uploadImageToS3,
  uploadVideoToS3,
} from "../../../utils/aws.js";
import CohostSelector from "./CohostSelector.jsx";

const LiveStreamForm = () => {
  const { categories } = useAuth();
  const navigate = useNavigate();
  const cdnURL = import.meta.env.VITE_AWS_CDN_URL;

  const initialFormData = {
    title: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    category: "",
    subCategory: "",
    tags: [],
    thumbnailImage: null,
    previewVideo: null,
    language: "",
    hasCoHost: false,
    coHost: null,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  // Unified Loading State
  const [loading, setLoading] = useState({
    imageUpload: false,
    videoUpload: false,
    submit: false,
  });

  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState(null);
  const [selectedPreviewVideoFile, setSelectedPreviewVideoFile] = useState(null);

  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const [uploadProgress, setUploadProgress] = useState({ image: 0, video: 0 });

  const [selectedProducts, setSelectedProducts] = useState({
    buyNow: [],
    auction: [],
    giveaway: [],
  });

  const [showResetModal, setShowResetModal] = useState(false);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Revoke Object URLs to prevent memory leaks
  useEffect(() => {
    let imageObjectURL = null;
    let videoObjectURL = null;

    if (selectedThumbnailFile && thumbnailPreview?.startsWith('blob:')) imageObjectURL = thumbnailPreview;
    if (selectedPreviewVideoFile && videoPreview?.startsWith('blob:')) videoObjectURL = videoPreview;

    return () => {
      if (imageObjectURL) URL.revokeObjectURL(imageObjectURL);
      if (videoObjectURL) URL.revokeObjectURL(videoObjectURL);
    };
  }, [thumbnailPreview, videoPreview, selectedThumbnailFile, selectedPreviewVideoFile]);

  // Clear product error when a product is added
  useEffect(() => {
    const hasProducts = selectedProducts.buyNow.length > 0 || selectedProducts.auction.length > 0 || selectedProducts.giveaway.length > 0;
    if (errors.products && hasProducts) {
      setErrors(prev => ({ ...prev, products: undefined }));
    }
  }, [selectedProducts, errors.products]);

  const currentCategoryObj = categories.find(
    (c) => c.categoryName === formData.category
  );

  const isAnyLoading = loading.imageUpload || loading.videoUpload || loading.submit;

  const handleCoHostSelected = (coHostData) => {
    setFormData((prev) => ({
      ...prev,
      hasCoHost: true,
      coHost: coHostData, // coHostData now holds { userId, userName, role, profileURL, companyName, sellerType }
    }));
    if (errors.coHost) {
      setErrors((prev) => ({ ...prev, coHost: "" }));
    }
  };

  const handleClearCoHost = () => {
    setFormData((prev) => ({
      ...prev,
      hasCoHost: false,
      coHost: null,
    }));
  };

  const resetThumbnailState = useCallback(async () => {
    if (formData.thumbnailImage) {
      try {
        await deleteObjectFromS3(formData.thumbnailImage);
      } catch (error) {
        console.error("S3 deletion error:", error);
        toast.error('Failed to remove image from storage');
      }
    }

    if (thumbnailPreview?.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    setFormData(prev => ({ ...prev, thumbnailImage: null }));
    setSelectedThumbnailFile(null);
    setUploadProgress(prev => ({ ...prev, image: 0 }));
    setLoading(prev => ({ ...prev, imageUpload: false }));
    setErrors(prev => ({ ...prev, thumbnail: undefined }));
    if (imageInputRef.current) imageInputRef.current.value = "";
  }, [formData.thumbnailImage, thumbnailPreview]);

  const resetPreviewVideoState = useCallback(async () => {
    if (formData.previewVideo) {
      try {
        await deleteObjectFromS3(formData.previewVideo);
      } catch (error) {
        console.error("S3 deletion error:", error);
        toast.error('Failed to remove video from storage');
      }
    }

    if (videoPreview?.startsWith('blob:')) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    setFormData(prev => ({ ...prev, previewVideo: null }));
    setSelectedPreviewVideoFile(null);
    setUploadProgress(prev => ({ ...prev, video: 0 }));
    setLoading(prev => ({ ...prev, videoUpload: false }));
    setErrors(prev => ({ ...prev, videoFile: undefined }));
    if (videoInputRef.current) videoInputRef.current.value = "";
  }, [formData.previewVideo, videoPreview]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type. Please select an image.");
      await resetThumbnailState(); return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Image is too large (Max 5MB).`);
      await resetThumbnailState(); return;
    }

    try {
      await resetThumbnailState();
      setSelectedThumbnailFile(file);
      const localPreviewUrl = URL.createObjectURL(file);
      setThumbnailPreview(localPreviewUrl);
      setLoading(prev => ({ ...prev, imageUpload: true }));
      setErrors(prev => ({ ...prev, thumbnail: undefined }));

      const key = await uploadImageToS3(file, "live-stream-thumbnails");

      setThumbnailPreview(key); // After upload, preview state holds the key
      setFormData(prev => ({ ...prev, thumbnailImage: key }));

      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error(`Image upload failed: ${error.message || "Unknown error"}`);
      await resetThumbnailState();
    } finally {
      setLoading(prev => ({ ...prev, imageUpload: false }));
    }
  };

  const getVideoDuration = (file) =>
    new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = (err) => {
        URL.revokeObjectURL(video.src);
        reject("Could not read video metadata.");
      };
      video.src = URL.createObjectURL(file);
    });

  const handleVideoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("video/mp4")) {
      toast.error("Unsupported video format. Please use MP4.");
      await resetPreviewVideoState(); return;
    }

    try {
      const duration = await getVideoDuration(file);
      if (duration > 30) {
        toast.error(`Video duration exceeds 30 seconds. Yours is ${Math.round(duration)}s.`);
        await resetPreviewVideoState(); return;
      }

      await resetPreviewVideoState();
      const localPreviewUrl = URL.createObjectURL(file);
      setVideoPreview(localPreviewUrl);
      setSelectedPreviewVideoFile(file);
      setLoading(prev => ({ ...prev, videoUpload: true }));
      setErrors(prev => ({ ...prev, videoFile: undefined }));

      const key = await uploadVideoToS3(
        file,
        "live-stream-previews",
        (percent) => setUploadProgress(prev => ({ ...prev, video: percent }))
      );

      setUploadProgress(prev => ({ ...prev, video: 100 }));
      setFormData(prev => ({ ...prev, previewVideo: key }));

      toast.success("Preview video uploaded successfully!");
    } catch (error) {
      console.error("Video upload failed:", error);
      toast.error(`Upload failed: ${error.message}`);
      await resetPreviewVideoState();
    } finally {
      setLoading(prev => ({ ...prev, videoUpload: false }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "category" && { subCategory: "" }),
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if ((name === "date" || name === "time") && errors.dateTime) {
      setErrors((prev) => ({ ...prev, dateTime: undefined }));
    }
  };

  const handleProductsSelected = (products) => {
    setSelectedProducts(products);
  };

  const getDisplayableSrc = (previewState, blobName) => {
    if (previewState) {
      if (previewState.startsWith('blob:')) {
        return previewState;
      }
      if (cdnURL && blobName) {
        return `${cdnURL}${blobName}?ts=${Date.now()}`;
      }
    }
    return "";
  };


  const resetForm = async (fromModal = false) => {
    await resetThumbnailState();
    await resetPreviewVideoState();
    setFormData(initialFormData);
    setSelectedProducts({ buyNow: [], auction: [], giveaway: [] });
    setErrors({});
    if (fromModal) setShowResetModal(false);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim() || formData.title.trim().length < 10)
      newErrors.title = "Title is required and must be at least 10 characters";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.subCategory) newErrors.subCategory = "Subcategory is required";
    if (!formData.language) newErrors.language = "Language is required";
    if (!formData.thumbnailImage) newErrors.thumbnail = "Thumbnail image is required";
    if (loading.imageUpload) newErrors.thumbnail = "Thumbnail upload in progress";
    if (loading.videoUpload) newErrors.videoFile = "Video upload in progress";

    const hasAtLeastOneProduct =
      selectedProducts.buyNow.length > 0 ||
      selectedProducts.auction.length > 0 ||
      selectedProducts.giveaway.length > 0;
    if (!hasAtLeastOneProduct) {
      newErrors.products = "At least one product must be selected";
    }

    try {
      const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
      const minDateTime = new Date(new Date().getTime() + 60 * 1000); // 1 minute from now
      if (isNaN(selectedDateTime.getTime())) {
        newErrors.dateTime = "Invalid date or time";
      } else if (selectedDateTime <= minDateTime) {
        newErrors.dateTime = "Show time must be at least 1 minute in the future";
      }
    } catch {
      newErrors.dateTime = "Invalid date or time format";
    }

    if (formData.hasCoHost && !formData.coHost) {
      newErrors.coHost = "Please select a co-host or disable the option.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting.");
        const firstErrorKey = Object.keys(errors).find(key => errors[key]);
      if (firstErrorKey) {
        const errorElement = document.querySelector(`[name="${firstErrorKey}"]`) || document.getElementById(`${firstErrorKey}-error`);
        errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(prev => ({ ...prev, submit: true }));

    try {
      const scheduledAtUTC = getUtcIsoStringFromLocal(formData.date, formData.time);
      if (!scheduledAtUTC) throw new Error("Invalid date/time for UTC conversion.");

      const payload = {
        title: formData.title.trim(),
        scheduledAt: scheduledAtUTC,
        category: formData.category,
        subCategory: formData.subCategory,
        tags: formData.tags, // Assuming tags are handled elsewhere now
        language: formData.language,
        thumbnailImage: formData.thumbnailImage,
        previewVideo: formData.previewVideo || null,
        buyNowProducts: selectedProducts.buyNow,
        auctionProducts: selectedProducts.auction,
        giveawayProducts: selectedProducts.giveaway,
        hasCoHost: formData.hasCoHost,
        // *** CRITICAL CHANGE HERE: Send the full coHost object if hasCoHost is true ***
        coHost: formData.hasCoHost && formData.coHost ? {
            userId: formData.coHost.userId,
            userName: formData.coHost.userName,
            role: formData.coHost.role,
            profileURL: formData.coHost.profileURL,
            companyName: formData.coHost.companyName,
            sellerType: formData.coHost.sellerType,
        } : null,
      };

      const response = await axiosInstance.post(CREATE_SHOW, payload);

      if (response.status === 201 || response.status === 200) {
        toast.success("Live show scheduled successfully!");
        await resetForm();
        navigate("/seller/allshows");
      } else {
        throw new Error(`Submission failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error(
        `Submission failed: ${error?.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  return (
    <div className="bg-blackLight min-h-screen py-6">
      <div className="w-full mx-auto  lg:px-8 rounded-xl shadow-xl">
        <div className="sticky top-0 bg-blackLight z-20 flex items-center justify-between mb-3 pb-2 border-b border-greyLight pt-20 px-2 lg:px-6">
          <Link
            to="/seller/allshows"
            className="inline-flex items-center gap-2 px-1 py-1 rounded-full bg-newYellow shadow-sm border border-yellow-200 text-gray-800 hover:bg-white hover:shadow transition-all duration-200 group"
          >
            <ArrowLeft size={24} className="text-blackDark group-hover:transform group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div className="flex justify-center items-center">
            <h1 className="text-newYellow text-2xl lg:text-3xl md:text-3xl font-bold text-center">
              Schedule Live Show
            </h1>
          </div>
          <button type="button" className="btn btn-ghost btn-sm bg-whiteLight hover:bg-gray-300 rounded-full text-newBlack flex items-center gap-2"
            onClick={() => setShowResetModal(true)} disabled={isAnyLoading}>
            <RotateCcw className="h-4 w-4 font-bold" />
          </button>
        </div>
        <div className="p-3 lg:p-8 pt-0 overflow-y-auto flex-grow">
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Category and Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label mb-2">
                  <span className="label-text text-base font-medium text-whiteLight">Category</span>
                </label>
                <select
                  name="category" value={formData.category} onChange={handleChange}
                  className={`select select-bordered focus:select-focus w-full bg-blackDark ${formData.category ? 'text-whiteLight' : 'text-whiteHalf'} ${errors.category ? 'select-error' : ''}`}
                  disabled={isAnyLoading}
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.categoryName}>{cat.categoryName}</option>
                  ))}
                </select>
                {errors.category && <p id="category-error" className="text-red-600 text-sm mt-1">{errors.category}</p>}
              </div>

              <div className="form-control">
                <label className="label mb-2">
                  <span className="label-text text-base font-medium text-whiteLight">Subcategory</span>
                </label>
                <select
                  name="subCategory" value={formData.subCategory} onChange={handleChange}
                  className={`select select-bordered focus:select-focus w-full bg-blackDark ${formData.subCategory ? 'text-whiteLight' : 'text-whiteHalf'} ${errors.subCategory ? 'select-error' : ''}`}
                  disabled={!formData.category || isAnyLoading}
                >
                  <option value="" disabled>Select Subcategory</option>
                  {currentCategoryObj?.subcategories?.map((sub) => (
                    <option key={sub._id} value={sub.name}>{sub.name}</option>
                  ))}
                  {!formData.category && <option value="" disabled>Select a category first</option>}
                </select>
                {errors.subCategory && <p id="subCategory-error" className="text-red-600 text-sm mt-1">{errors.subCategory}</p>}
              </div>
            </div>
            {/* Title */}
            <div className="form-control">
              <label className="label mb-2">
                <span className="label-text text-base font-medium text-whiteLight flex items-center gap-2">
                  <Type className="h-5 w-5 text-newYellow" /> Show Title
                </span>
              </label>
              <input
                type="text" name="title" value={formData.title} onChange={handleChange}
                className={`input input-bordered text-whiteLight w-full focus:border-newYellow bg-blackDark focus:ring-1 focus:ring-newYellow transition-all duration-200 ${errors.title ? 'input-error' : ''}`}
                placeholder="Enter an engaging title for your show" disabled={isAnyLoading}
                maxLength={100}
              />
              {errors.title && <p id="title-error" className="text-red-600 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label mb-2">
                  <span className="label-text text-base font-medium text-whiteLight flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-newYellow" /> Show Date
                  </span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`input input-bordered text-whiteLight w-full focus:border-newYellow bg-blackDark focus:ring-1 focus:ring-newYellow transition-all duration-200
                    [color-scheme:dark]
                    placeholder:text-gray-400
                    ${errors.dateTime ? 'input-error' : ''}`}
                  min={new Date().toISOString().split("T")[0]}
                  disabled={isAnyLoading}
                />
              </div>
              <div className="form-control">
                <label className="label mb-2">
                  <span className="label-text text-base font-medium text-whiteLight flex items-center gap-2">
                    <Clock className="h-5 w-5 text-newYellow" /> Show Time
                  </span>
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={`input input-bordered text-whiteLight w-full focus:border-newYellow bg-blackDark focus:ring-1 focus:ring-newYellow transition-all duration-200
                    [color-scheme:dark]
                    placeholder:text-gray-400
                    ${errors.dateTime ? 'input-error' : ''}`}
                  disabled={isAnyLoading}
                />

              </div>
            </div>
            {errors.dateTime && <p id="dateTime-error" className="text-red-600 text-sm mt-1 -mt-1 col-span-2">{errors.dateTime}</p>}


            {/* Upload Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thumbnail Upload */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base font-medium text-whiteLight flex items-center gap-2">
                    <Camera className="h-5 w-5 text-newYellow" /> Thumbnail Image *
                  </span>
                </label>
                <div className={`flex flex-col items-center justify-center bg-yellowHalf border-2 ${errors.thumbnail ? 'border-red-500' : 'border-dashed border-newYellow'} rounded-lg p-4 transition-all min-h-[220px] ${!thumbnailPreview && !loading.imageUpload ? 'hover:border-whiteLight cursor-pointer' : ''}`}>
                  {thumbnailPreview ? (
                    <div className="relative w-full h-48 flex items-center justify-center">
                      <img
                        src={getDisplayableSrc(thumbnailPreview, formData.thumbnailImage)}
                        alt="Thumbnail preview"
                        className="max-w-full max-h-48 object-contain rounded-lg shadow-md"
                      />
                      {loading.imageUpload && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                          <Loader2 className="animate-spin text-newYellow" size={24} />
                        </div>
                      )}
                      <button
                        type="button" onClick={resetThumbnailState}
                        className="btn btn-circle z-10 btn-xs bg-red-500 hover:bg-red-600 text-white absolute -top-2 -right-2 shadow-lg"
                        disabled={isAnyLoading}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Camera className="h-12 w-12 text-whiteLight mb-2" />
                      <p className="text-center text-whiteLight text-sm mb-3">Click or drag to upload (JPG, PNG, WEBP)</p>
                      <button type="button" className="btn btn-sm bg-blackDark rounded-full text-newYellow hover:bg-whiteLight hover:text-blackDark shadow-md border-none"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isAnyLoading}>
                        Select Image
                      </button>
                    </>
                  )}
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={isAnyLoading} name="thumbnail" />
                {errors.thumbnail && <p id="thumbnail-error" className="text-red-600 text-sm mt-1">{errors.thumbnail}</p>}
              </div>

              {/* Preview Video Upload */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base font-medium text-whiteLight flex items-center gap-2">
                    <FileVideo className="h-5 w-5 text-newYellow" /> Preview Video (Optional)
                  </span>
                </label>
                <div className={`flex flex-col items-center justify-center bg-yellowHalf border-2 ${errors.videoFile ? 'border-red-500' : 'border-dashed border-newYellow'} rounded-lg p-4 transition-all min-h-[220px] ${!videoPreview && !loading.videoUpload ? 'hover:border-whiteLight cursor-pointer' : ''}`}>
                  {videoPreview ? (
                    <div className="relative w-full h-48 flex items-center justify-center">
                      <video
                        controls controlsList="nodownload"
                        className="max-w-full max-h-48 object-contain rounded-lg shadow-md"
                        src={videoPreview.startsWith('blob:') ? videoPreview : `${cdnURL}${formData.previewVideo}`}
                      />
                      <button
                        type="button" onClick={resetPreviewVideoState}
                        className="btn btn-circle z-10 btn-xs bg-red-500 hover:bg-red-600 text-white absolute -top-2 -right-2 shadow-lg"
                      >
                        <X size={14} />
                      </button>
                      {loading.videoUpload && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                          <div className="radial-progress text-white text-lg mb-2" style={{ "--value": uploadProgress.video }}>
                            {uploadProgress.video}%
                          </div>
                          <p className="text-white text-sm">Uploading...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <FileVideo className="h-12 w-12 text-whiteLight mb-2" />
                      <p className="text-center text-whiteLight text-sm mb-3">Upload MP4 (Max 30s)</p>
                      <button type="button" className="btn btn-sm bg-blackDark text-newYellow hover:bg-whiteLight hover:text-blackDark rounded-full shadow-md border-none" onClick={() => videoInputRef.current?.click()} disabled={isAnyLoading}>Select Video</button>
                    </>
                  )}
                </div>
                <input ref={videoInputRef} type="file" accept="video/mp4" onChange={handleVideoChange} className="hidden" disabled={isAnyLoading} name="videoFile" />
                {errors.videoFile && <p id="videoFile-error" className="text-red-600 text-sm mt-1">{errors.videoFile}</p>}
              </div>
            </div>

            {/* Language Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-base font-medium text-whiteLight flex items-center gap-2">
                  <Globe className="h-5 w-5 text-newYellow" /> Streaming Language
                </span>
              </label>
              <select
                name="language" value={formData.language} onChange={handleChange}
                className={`select select-bordered focus:select-focus w-full bg-blackDark ${formData.language ? 'text-whiteLight' : 'text-whiteHalf'} ${errors.language ? 'select-error' : ''}`}
                disabled={isAnyLoading}>
                <option value="" disabled>Select Language</option>
                {indianLanguages.map((lang) => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
              {errors.language && <p id="language-error" className="text-red-600 text-sm mt-1">{errors.language}</p>}
            </div>

            {/* Product Tab Section */}
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-whiteLight">
                <ShoppingCart className="w-5 h-5 text-newYellow" />
                Tag Products in this Show *
              </h2>
              <ProductTab onSelectProducts={handleProductsSelected} selectedCategory={formData.category} />
              {errors.products && <p id="products-error" className="text-red-600 text-sm mt-1">{errors.products}</p>}
            </div>

            {/* Co-host Selector */}
            <CohostSelector
              onCoHostSelect={handleCoHostSelected}
              onClearCoHost={handleClearCoHost}
              isSubmitting={loading.submit}
              isUploading={loading.imageUpload || loading.videoUpload}
            />
            {errors.coHost && (
              <p id="coHost-error" className="text-red-600 text-sm mt-1">{errors.coHost}</p>
            )}

            <div className="divider my-4"></div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 w-full px-4 sm:px-0 py-4">
              <Link
                to="/seller/allshows"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gray-200 text-center shadow-sm border border-gray-300 text-gray-700 hover:bg-gray-300 hover:shadow-md transition-all duration-200 group"
              >
                <ArrowLeft size={20} className="text-gray-600 group-hover:transform group-hover:-translate-x-1 transition-transform" />
                Cancel
              </Link>
              <button
                type="submit"
                className={`w-full sm:w-auto btn bg-newYellow hover:bg-blackDark hover:text-newYellow text-blackDark flex items-center justify-center gap-2 px-4 py-3 rounded-full shadow-sm hover:shadow-md transition-all duration-200 ${loading.submit ? "opacity-70 cursor-not-allowed" : ""}`}
                disabled={isAnyLoading}
              >
                {loading.submit ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Schedule Show
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {showResetModal && (
          <div className="modal modal-open shadow-xl" role="dialog">
            <div className="modal-box bg-blackLight text-gray-800">
              <h3 className="font-bold text-lg text-whiteLight flex items-center gap-2"><AlertCircle className="text-red-500" />Confirm Reset</h3>
              <p className="py-4 text-whiteHalf">Are you sure? All entered data and uploads will be cleared.</p>
              <div className="modal-action">
                <button className="btn btn-ghost bg-white/30 rounded-full" onClick={() => setShowResetModal(false)}>Cancel</button>
                <button className="btn btn-error rounded-full text-whiteLight" onClick={() => resetForm(true)}>Reset Form</button>
              </div>
            </div>
            <div className="modal-backdrop bg-black bg-opacity-30" onClick={() => setShowResetModal(false)}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveStreamForm;