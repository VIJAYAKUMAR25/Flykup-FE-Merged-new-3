import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Upload, ShoppingBag, Film, Video, Type, Camera, FileVideo, Hash, Save, RotateCcw, ArrowLeft, X, Loader2, AlertCircle
} from "lucide-react";
import ProductTabShopaAble from "./ProductTab.jsx";
import { CREATE_SHOPPABLE_VIDEO } from "../../api/apiDetails.js"; 
import axiosInstance from "../../../utils/axiosInstance.js";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";
import Hls from 'hls.js';
import { deleteObjectFromS3, uploadImageToS3, uploadVideoToS3 } from "../../../utils/aws.js";

const ShopableForm = ({ initialData, onSubmit, isEditMode = false }) => {
  const { categories } = useAuth();
  const navigate = useNavigate();
  const cdnURL = import.meta.env.VITE_AWS_CDN_URL;


  const OPTIMIZE_URL = import.meta.env.VITE_VIDEO_OPTIMIZE_URL;


  const [formData, setFormData] = useState({
    videoTitle: initialData?.title || "",
    description: initialData?.description || "",
    hashtags: initialData?.hashTags || [],
    hashtagInput: "",
    category: initialData?.category || "",
    subcategory: initialData?.subcategory || "",
    originalVideoBlobName: initialData?.originalVideoBlobName || null,
    thumbnailBlobName: initialData?.thumbnailBlobName || null,
    videoId: initialData?.videoId || null,
  });

  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);

  const [thumbnailPreview, setThumbnailPreview] = useState(initialData?.thumbnailBlobName || null);
  const [videoPreview, setVideoPreview] = useState(null);

  const [uploadData, setUploadData] = useState({
    thumbnailBlobName: initialData?.thumbnailBlobName || null,
    originalFileSize: initialData?.originalFileSize || null,
  });

  const [uploadProgress, setUploadProgress] = useState({ image: 0, video: 0 });

  const [productsListed, setProductsListed] = useState(initialData?.productsListed || []);

  const [errors, setErrors] = useState({});

  const hashtagInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState({
    imageUpload: false,
    videoUpload: false,
    submit: false,
  });
  
useEffect(() => {
  if (isEditMode && initialData?.masterPlaylistKey && videoRef.current) {
    const video = videoRef.current;
    const masterPlaylistUrl = `${cdnURL}${initialData.masterPlaylistKey}`;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(masterPlaylistUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => console.warn("Autoplay prevented for HLS video."));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = masterPlaylistUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => console.warn("Autoplay prevented for native HLS video."));
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }
}, [isEditMode, initialData?.masterPlaylistKey]); 

  useEffect(() => {
    let imageObjectURL = null;
    let videoObjectURL = null;

    if (selectedImageFile && thumbnailPreview?.startsWith('blob:')) imageObjectURL = thumbnailPreview;
    if (selectedVideoFile && videoPreview?.startsWith('blob:')) videoObjectURL = videoPreview;

    return () => {
      if (imageObjectURL) URL.revokeObjectURL(imageObjectURL);
      if (videoObjectURL) URL.revokeObjectURL(videoObjectURL);
    };
  }, [thumbnailPreview, videoPreview, selectedImageFile, selectedVideoFile]);

  useEffect(() => {
    if (errors.products && productsListed.length > 0) {
      setErrors(prev => ({ ...prev, products: undefined }));
    }
  }, [productsListed, errors.products]);


  const selectedCategoryObj = categories.find(cat => cat.categoryName === formData.category);
  const isAnyLoading = loading.imageUpload || loading.videoUpload || loading.submit;


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleCategoryChange = (e) => {
    const selectedVal = e.target.value;
    setFormData(prev => ({ ...prev, category: selectedVal, subcategory: "" }));
    setErrors(prev => ({ ...prev, category: undefined, subcategory: undefined }));
  };

const validateVideoFile = (file) => {
  if (!file) return false;

  const supportedMimeTypes = [
    'video/mp4',
    'video/mov',       
    'video/webm',
    'video/x-matroska',
    'video/x-msvideo', 
    'video/x-m4v',     
    'video/quicktime',  
      
  ];

  const supportedExtensions = ['mp4', 'mov', 'webm', 'mkv', 'm4v'];

  const fileName = file.name || '';
  const fileMimeType = file.type || ''; 

  const fileExtension = fileName.split('.').pop()?.toLowerCase();

  if (fileMimeType && supportedMimeTypes.includes(fileMimeType)) {
    return true;
  }

  if (fileExtension && supportedExtensions.includes(fileExtension)) {

    if (!fileMimeType || fileMimeType === 'application/octet-stream') {
      return true;
    }

    return true;
  }

  return false;
};



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value, }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const resetImageState = useCallback(async () => {

    if (uploadData.thumbnailBlobName &&
      (!initialData || uploadData.thumbnailBlobName !== initialData.thumbnailBlobName)) {
      try {
        await deleteObjectFromS3(uploadData.thumbnailBlobName);
        console.log('Deleted thumbnail from S3');
      } catch (error) {
        console.error('S3 deletion error:', error);
        toast.error('Failed to remove image from storage');
      }
    }

    if (thumbnailPreview?.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(initialData?.thumbnailBlobName || null); // Reset preview to S3 key or null
    setFormData(prev => ({ ...prev, thumbnailBlobName: initialData?.thumbnailBlobName || null }));
    setUploadData(prev => ({ ...prev, thumbnailBlobName: initialData?.thumbnailBlobName || null }));
    setSelectedImageFile(null);
    setUploadProgress(prev => ({ ...prev, image: 0 }));
    setLoading(prev => ({ ...prev, imageUpload: false }));
    setErrors(prev => ({ ...prev, thumbnail: undefined }));
    if (imageInputRef.current) imageInputRef.current.value = "";
  }, [initialData, uploadData.thumbnailBlobName, thumbnailPreview]);

  const resetVideoState = useCallback(async () => {
    if (formData.originalVideoBlobName &&
      (!initialData || formData.originalVideoBlobName !== initialData.originalVideoBlobName)) {
      try {
        await deleteObjectFromS3(formData.originalVideoBlobName);
        console.log('Deleted video from S3');
      } catch (error) {
        console.error('S3 deletion error:', error);
        toast.error('Failed to remove video from storage');
      }
    }

    if (videoPreview?.startsWith('blob:')) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    setFormData(prev => ({ ...prev, originalVideoBlobName: initialData?.originalVideoBlobName || null }));
    setUploadData(prev => ({ ...prev, originalFileSize: initialData?.originalFileSize || null }));
    setSelectedVideoFile(null);
    setUploadProgress(prev => ({ ...prev, video: 0 }));
    setLoading(prev => ({ ...prev, videoUpload: false }));
    setErrors(prev => ({ ...prev, videoFile: undefined }));
    if (videoInputRef.current) videoInputRef.current.value = "";
  }, [initialData, formData.originalVideoBlobName, videoPreview]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type. Please select an image.");
      await resetImageState(); return; // Ensure resetImageState is awaited if it becomes async
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Image is too large (Max 5MB).`);
      await resetImageState(); return;
    }

    try {
      await resetImageState();
    setSelectedImageFile(file);
    const localPreviewUrl = URL.createObjectURL(file);
    setThumbnailPreview(localPreviewUrl); // Temporary local preview
    setLoading(prev => ({ ...prev, imageUpload: true }));

    const key = await uploadImageToS3(file, "thumbnails");

    // After upload, update thumbnailPreview to the S3 key
    setThumbnailPreview(key);
    setFormData(prev => ({
      ...prev,
      thumbnailBlobName: key
    }));
    setUploadData(prev => ({
      ...prev,
      thumbnailBlobName: key
    }));

    toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error(`Image upload failed: ${error.message || "Unknown error"}`);
      await resetImageState(); // Reset on failure
    } finally {
      setLoading(prev => ({ ...prev, imageUpload: false }));
    }
  };




const handleVideoUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!validateVideoFile(file)) {
    toast.error("Unsupported video format. Please use MP4, MOV, WEBM, MKV, AVI, or M4V.");
    await resetVideoState();
    if (videoInputRef.current) videoInputRef.current.value = "";
    return;
  }

  const maxSize = 1 * 1024 * 1024 * 1024;
  if (file.size > maxSize) {
    toast.error(`Video is too large (Max 1GB).`);
    await resetVideoState();
    if (videoInputRef.current) videoInputRef.current.value = "";
    return;
  }

  const localPreviewUrlForDurationCheck = URL.createObjectURL(file);
  const videoElement = document.createElement('video');
  videoElement.preload = 'metadata';
  videoElement.src = localPreviewUrlForDurationCheck;

  videoElement.onloadedmetadata = async () => {
    URL.revokeObjectURL(localPreviewUrlForDurationCheck);
    const duration = videoElement.duration;
    const maxDuration = 90;

    if (duration > maxDuration) {
      toast.error(`Video duration exceeds ${maxDuration} seconds (Max 1 min 30 sec). Your video is ${Math.round(duration)} seconds.`);
      await resetVideoState();
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }

    try {
      await resetVideoState();
      const localPreviewUrl = URL.createObjectURL(file);
      setVideoPreview(localPreviewUrl);
      setSelectedVideoFile(file);

      setLoading(prev => ({ ...prev, videoUpload: true }));
      const key = await uploadVideoToS3(
        file,
        "videos",
        (percent) => setUploadProgress(prev => ({ ...prev, video: percent }))
      );

      setUploadProgress(prev => ({ ...prev, video: 100 }));

      setFormData(prev => ({
        ...prev,
        originalVideoBlobName: key
      }));
      setUploadData(prev => ({
        ...prev,
        originalFileSize: file.size
      }));

      toast.success("Video uploaded successfully!");
    } catch (error) {
      console.error("Video upload failed:", error);
      toast.error(`Upload failed: ${error.message}`);
      await resetVideoState();
    } finally {
      setLoading(prev => ({ ...prev, videoUpload: false }));
    }
  };

  videoElement.onerror = async () => {
    URL.revokeObjectURL(localPreviewUrlForDurationCheck);
    toast.error("Could not read video metadata. Please try a different video.");
    await resetVideoState();
    if (videoInputRef.current) videoInputRef.current.value = "";
  };
};

  const addHashtag = () => {
    const tag = formData.hashtagInput.trim().replace(/[^a-zA-Z0-9]/g, "");
    if (tag && !formData.hashtags.includes(`#${tag}`)) {
      setFormData(prev => ({ ...prev, hashtags: [...prev.hashtags, `#${tag}`], hashtagInput: "" }));
    } else if (tag) {
      toast.info(`Hashtag "${tag}" already added.`);
      setFormData(prev => ({ ...prev, hashtagInput: "" }));
    } else {
      setFormData(prev => ({ ...prev, hashtagInput: "" }));
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
    setFormData(prev => ({ ...prev, hashtags: prev.hashtags.filter((_, i) => i !== index) }));
  };

  const getDisplayableThumbnailSrc = () => {
  if (thumbnailPreview) {
    if (thumbnailPreview.startsWith('blob:')) {
      return thumbnailPreview;
    }
    if (cdnURL) {
      return `${cdnURL}${thumbnailPreview}?ts=${Date.now()}`;
    }
    return "";
  }
  return "";
};

  const resetForm = async (fromModal = false) => {
    // Await async reset operations if they exist
    // await resetImageState();
    // await resetVideoState();

    setFormData({
      videoTitle: "", description: "",
      // thumbnailBlobName should be reset to null, matching thumbnailPreview logic
      thumbnailBlobName: null,
      originalVideoBlobName: null,
      hashtags: [], hashtagInput: "", category: "", subcategory: "",
    });
    setUploadData({ thumbnailBlobName: null, originalFileSize: null });
    setProductsListed([]);
    setErrors({});
    if (fromModal) setShowResetModal(false);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.videoTitle.trim()) newErrors.videoTitle = "Video title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
if (productsListed.length === 0) newErrors.products = "At least one product must be selected";
    if (!uploadData.thumbnailBlobName && !selectedImageFile) {
        if (isEditMode && !initialData?.thumbnailBlobName) { 
            newErrors.thumbnail = "Thumbnail image is required";
        } else if (!isEditMode) { 
             newErrors.thumbnail = "Thumbnail image is required";
        }
    }


    if (!isEditMode) {
      if (!formData.originalVideoBlobName) newErrors.videoFile = "Video file is required";
    } else {
      if (!formData.originalVideoBlobName && !initialData?.originalVideoBlobName) newErrors.videoFile = "Video file is required";
    }

    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.subcategory) newErrors.subcategory = "Subcategory is required";
    if (productsListed.length === 0) newErrors.products = "At least one product must be selected";

    //  if (!formData.videoId) {
    //   newErrors.videoFile = "Video processing failed - please reupload";
    // }
    if (loading.imageUpload) newErrors.thumbnail = "Thumbnail upload in progress";
    if (loading.videoUpload) newErrors.videoFile = "Video upload in progress";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createPayload = () => ({
    title: formData.videoTitle.trim(),
    description: formData.description.trim(),
    category: formData.category,
    subcategory: formData.subcategory,
    productsListed,
    hashTags: formData.hashtags,
    thumbnailBlobName: uploadData.thumbnailBlobName, 
    originalVideoBlobName: formData.originalVideoBlobName,
    originalFileSize: uploadData.originalFileSize,
    videoId: formData.videoId,

  });

 // Add useEffect to update form data when initialData changes
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        videoTitle: initialData.title || "",
        description: initialData.description || "",
        hashtags: initialData.hashTags || [],
        hashtagInput: "",
        category: initialData.category || "",
        subcategory: initialData.subcategory || "",
        originalVideoBlobName: initialData.originalVideoBlobName || null,
        thumbnailBlobName: initialData.thumbnailBlobName || null,
        videoId: initialData.videoId || null,
      });
      setUploadData({
        thumbnailBlobName: initialData.thumbnailBlobName || null,
        originalFileSize: initialData.originalFileSize || null,
      });
      setThumbnailPreview(initialData.thumbnailBlobName || null);
      setProductsListed(initialData.productsListed || []);
    }
  }, [isEditMode, initialData]);

  const handleMainSubmit = async () => {
  setLoading(prev => ({ ...prev, submit: true }));
  
  try {
    // Validate form inputs first
    if (!validateForm()) {
      toast.error("Please fix errors before submitting.");
      return;
    }


    
    if (!isEditMode) {
      const optimizeResponse = await fetch(`${OPTIMIZE_URL}api/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: formData.originalVideoBlobName }),
      });

      if (!optimizeResponse.ok) {
        throw new Error(`Optimization failed: ${optimizeResponse.statusText}`);
      }

      const optimizeResult = await optimizeResponse.json();
      
      if (!optimizeResult?.data?.videoId) {
        throw new Error("No video ID received from optimization API");
      }

      // Create final payload with the optimized video ID
      const payload = {
        title: formData.videoTitle.trim(),
        description: formData.description.trim(),
        category: formData.category,
        subcategory: formData.subcategory,
        productsListed,
        hashTags: formData.hashtags,
        thumbnailBlobName: uploadData.thumbnailBlobName,
        originalVideoBlobName: formData.originalVideoBlobName,
        originalFileSize: uploadData.originalFileSize,
        videoId: optimizeResult.data.videoId,
      };

      // Submit new video
      const response = await axiosInstance.post(
        CREATE_SHOPPABLE_VIDEO,
        payload
      );

      if (response.status === 201 || response.status === 200) {
        toast.success("Shoppable video submitted successfully!");
        await resetForm();
        navigate("/seller/viewvideo");
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } else {
      // Handle edit mode without video optimization
      const payload = {
        title: formData.videoTitle.trim(),
        description: formData.description.trim(),
        category: formData.category,
        subcategory: formData.subcategory,
        productsListed,
        hashTags: formData.hashtags,
        thumbnailBlobName: uploadData.thumbnailBlobName,
        originalVideoBlobName: formData.originalVideoBlobName,
        originalFileSize: uploadData.originalFileSize,
        videoId: formData.videoId,
      };

      if (typeof onSubmit === "function") {
        await onSubmit(payload);
        toast.success("Video details updated successfully!");
        navigate("/seller/viewvideo");
      }
    }
  } catch (error) {
    console.error("Submission failed:", error);
    toast.error(`Submission failed: ${error.message || "Unknown error"}`);
    
    // Cleanup on failure if new upload
    if (!isEditMode) {
      await resetVideoState();
      await resetImageState();
    }
  } finally {
    setLoading(prev => ({ ...prev, submit: false }));
  }
};
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix errors before submitting.");
      const firstErrorKey = Object.keys(errors).find(key => errors[key]);
      if (firstErrorKey) {
        const errorElement = document.querySelector(`[name="${firstErrorKey}"]`) || document.getElementById(`${firstErrorKey}-error`);
        errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    if (isEditMode) {
      handleMainSubmit();
    } else {
      setShowSubmitModal(true);
    }
  };

  const confirmAndSubmit = () => {
    setShowSubmitModal(false);
    handleMainSubmit();
  };

useEffect(() => {
  return () => {
    if (thumbnailPreview?.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreview);
    if (videoPreview?.startsWith('blob:')) URL.revokeObjectURL(videoPreview);
  };
}, [thumbnailPreview, videoPreview]);

  return (
    <div className="bg-blackLight min-h-screen py-6">
      <div className="w-full mx-auto p-6 px-3 lg:px-12 rounded-xl shadow-xl">
        <div className="sticky top-0 bg-blackLight z-20 flex items-center justify-between mb-3 pb-2 border-b border-greyLight pt-20 px-2 lg:px-6"> {/* Added pt-6 px-6 to match padding */}
          <Link
            to="/seller/viewvideo"
            className="inline-flex items-center gap-2 px-1 py-1 rounded-full bg-newYellow shadow-sm border border-yellow-200 text-gray-800 hover:bg-white hover:shadow transition-all duration-200 group"
          >
            <ArrowLeft size={24} className="text-blackDark group-hover:transform group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div className="flex justify-center items-center ">
            <h1 className="text-newYellow text-2xl lg:text-3xl md:text-3xl  font-bold text-center">
            Create Shoppable Video
            </h1>
          </div>
           {!isEditMode && (
              <button type="button" className="btn btn-ghost btn-sm bg-whiteLight hover:bg-gray-300 rounded-full text-newBlack flex items-center gap-2"
                onClick={() => setShowResetModal(true)} disabled={isAnyLoading}>
                <RotateCcw className="h-4 w-4 font-bold" /> 
              </button>
            )}
             {isEditMode && (
              <div></div >
            )}
        </div>
        <div className="p-3 lg:p-8 pt-0 overflow-y-auto flex-grow"> 
          <form onSubmit={handleSubmit} className="space-y-2">


           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label mb-2">
                  <span className="label-text text-base font-medium text-newYellow">Category</span>
                </label>
                <select 
                  name="category" 
                  value={formData.category} 
                  onChange={handleCategoryChange}
                  className={`select select-bordered focus:select-focus w-full bg-blackDark ${
                    formData.category ? 'text-whiteLight' : 'text-whiteHalf'
                  } ${errors.category ? 'select-error' : ''}`} 
                  disabled={isAnyLoading}
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.categoryName}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p id="category-error" className="text-red-600 text-sm mt-1">
                    {errors.category}
                  </p>
                )}
              </div>
              
              <div className="form-control gap-2">
                <label className="label mb-2">
                  <span className="label-text text-base font-medium text-newYellow">Subcategory</span>
                </label>
                <select 
                  name="subcategory" 
                  value={formData.subcategory} 
                  onChange={handleChange}
                className={`select select-bordered focus:select-focus w-full bg-blackDark ${
                    formData.subcategory ? 'text-whiteLight' : 'text-whiteHalf'
                  } ${errors.subcategory ? 'select-error' : ''}`} 
                  disabled={!formData.category || isAnyLoading}
                >
                  <option value="" disabled>Select Subcategory</option>
                  {selectedCategoryObj?.subcategories?.map((sub) => (
                    <option key={sub._id} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                  {!formData.category && (
                    <option value="" disabled>Select a category first</option>
                  )}
                </select>
                {errors.subcategory && (
                  <p id="subcategory-error" className="text-red-600 text-sm mt-1">
                    {errors.subcategory}
                  </p>
                )}
              </div>
            </div>
            {/* Video Title */}
            <div className="form-control">
              <label className="label mb-2">
                <span className="label-text text-base font-medium text-newYellow flex items-center gap-2">
                  <Film className="h-5 w-5 text-whiteLight" /> Video Title
                </span>
              </label>
              <div className="relative">
                <input
                  type="text" name="videoTitle" value={formData.videoTitle} onChange={handleInputChange}
                  className={`input input-bordered text-whiteLight  w-full pl-10 focus:border-newYellow bg-blackDark focus:ring-1 focus:ring-newYellow transition-all duration-200 ${errors.videoTitle ? 'input-error' : ''}`}
                  placeholder="Enter an engaging title for your video" disabled={isAnyLoading}
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
                <span className="label-text text-base font-medium text-newYellow flex items-center gap-2">
                  <Type className="h-5 w-5 text-whiteLight" /> Description
                </span>
              </label>
              <textarea
                name="description" value={formData.description} onChange={handleInputChange}
                className={`textarea textarea-bordered bg-blackDark text-whiteLight h-32 w-full focus:border-newYellow focus:ring-1 focus:ring-newYellow transition-all duration-200 ${errors.description ? 'textarea-error' : ''}`}
                placeholder="Describe your product,Sizes, benefits, and key features..." disabled={isAnyLoading}
              />
              {errors.description && <p id="description-error" className="text-red-600 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Upload Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-base font-medium text-newYellow flex items-center gap-2">
                      <Camera className="h-5 w-5 text-whiteLight" /> Thumbnail Image
                    </span>
                  </label>
                  <div className={`flex flex-col items-center justify-center bg-yellowHalf border-2 ${errors.thumbnail ? 'border-red-500' : 'border-dashed border-newYellow'} rounded-lg p-4 transition-all min-h-[200px] ${!thumbnailPreview && !loading.imageUpload ? 'hover:border-whiteLight cursor-pointer' : ''}`}>
                    {thumbnailPreview ? (
                      <div className="relative w-full h-48 flex items-center justify-center">
                        <img
                          src={ getDisplayableThumbnailSrc() }
                          alt="Thumbnail preview"
                          className="max-w-full max-h-48 object-contain rounded-lg shadow-md"
                        />
                        {/* Progress Overlay */}
                        {loading.imageUpload && (
                          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin text-newYellow mb-2" size={24} />
                            <div className="radial-progress text-white text-sm mb-1" 
                                style={{ "--value": uploadProgress.image }}>
                              {uploadProgress.image}%
                            </div>
                            <p className="text-white text-xs">
                              Uploading {selectedImageFile && 
                                `(${Math.round(selectedImageFile.size / 1024)} KB)`
                              }
                            </p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={resetImageState}
                          className="btn btn-circle z-50 btn-xs bg-red-500 hover:bg-red-600 text-white absolute -top-2 -right-2 shadow-lg"
                          disabled={isAnyLoading}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : loading.imageUpload ? (
                      <div className="flex flex-col items-center justify-center text-center">
                        <Loader2 size={40} className="animate-spin text-newYellow mb-3" />
                        <p className="text-sm text-gray-600">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <Camera className="h-12 w-12 text-whiteLight mb-2" />
                        <p className="text-center text-whiteLight text-sm mb-3">Click or drag to upload (JPG, PNG, WEBP, max 5MB)</p>
                        <button type="button" className="btn btn-sm bg-blackDark rounded-full text-newYellow hover:bg-whiteLight hover:text-blackDark shadow-md border-none" 
                          onClick={() => imageInputRef.current?.click()} 
                          disabled={isAnyLoading}>
                          Select Image
                        </button>
                      </>
                    )}
                  </div>
                  <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} 
                    className="hidden" disabled={isAnyLoading} />
                  {errors.thumbnail && <p className="text-red-600 text-sm mt-1">{errors.thumbnail}</p>}
                </div>

              {/* Video Upload */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base font-medium text-newYellow flex items-center gap-2">
                    <FileVideo className="h-5 w-5 text-whiteLight" /> Shoppable Video
                  </span>
                </label>
                <div className={`flex flex-col items-center justify-center bg-yellowHalf border-2 ${errors.videoFile ? 'border-red-500' : 'border-dashed border-newYellow'} rounded-lg p-4 transition-all min-h-[200px] ${!videoPreview && !loading.videoUpload && !(isEditMode && initialData?.hlsMasterPlaylistUrl) ? 'hover:border-whiteLight cursor-pointer' : ''}`}>
                  {isEditMode && initialData?.masterPlaylistKey && !selectedVideoFile ? (
                    <div className="relative w-full">
                      <video
                        ref={videoRef}
                        controls
                        controlsList="nodownload"
                        className="w-full h-48 rounded-lg bg-black object-contain shadow-md"
                      />
                      <div className="absolute bottom-1.5 left-1.5 text-white bg-black/70 px-2 py-1 rounded text-xs">
                        Current Video (Cannot be changed)
                      </div>
                    </div>
                  ) : (
                    <>
                      {!videoPreview && !loading.videoUpload && (
                        <>
                          <FileVideo className="h-12 w-12 text-whiteLight mb-2" />
                        <p className="text-center text-whiteLight text-base font-medium mb-1">
                            Drop your video here or click to select
                          </p>
                          <p className="text-center text-whiteLight text-xs mb-3">
                            Supports: MP4, MOV, WEBM, MKV, AVI, M4V (Max 1GB, 90s)
                          </p>
                          <button type="button" className="btn btn-sm bg-blackDark text-newYellow hover:bg-whiteLight hover:text-blackDark  rounded-full shadow-md border-none" onClick={() => videoInputRef.current?.click()} disabled={isAnyLoading || (isEditMode && !!initialData?.originalVideoBlobName)}>Select Video</button>
                        </>
                      )}
                      {videoPreview && (
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
                            className="btn btn-circle z-50 btn-xs bg-red-500 hover:bg-red-600 text-white absolute -top-2 -right-2 shadow-lg"
                          >
                            <X size={14} />
                          </button>
                          
                          {loading.videoUpload && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                              <div className="radial-progress text-white text-lg mb-2" 
                                  style={{ "--value": uploadProgress.video }}>
                                {uploadProgress.video}%
                              </div>
                              <p className="text-white text-sm">
                                Uploading {selectedVideoFile && 
                                  `(${Math.round(selectedVideoFile.size / 1024 / 1024)} MB)`
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/mov,video/quicktime,video/webm,video/x-matroska,video/x-msvideo,video/avi,video/x-m4v,.mp4,.mov,.webm,.mkv,.avi,.m4v"
                onChange={handleVideoUpload}
                className="hidden"
                disabled={isAnyLoading || (isEditMode && !!initialData?.originalVideoBlobName && !selectedVideoFile)}
                name="videoFileInput"
              />
                {errors.videoFile && <p id="videoFile-error" className="text-red-600 text-sm mt-1">{errors.videoFile}</p>}
              </div>
            </div>

            <div className="mt-6">
                <ProductTabShopaAble
                initialSelected={productsListed}
                onSelectProducts={setProductsListed}
                selectedCategory={formData.category}
              />
            </div>
            {errors.products && <p id="products-error" className="text-red-600 text-sm mt-1">{errors.products}</p>}

            

            <div className="form-control">
              <label className="label">
                <span className="label-text text-base font-medium text-newYellow flex items-center gap-2">
                  <Hash className="h-5 w-5 text-whiteLight" /> Hashtags (Optional)
                </span>
              </label>
              <div className="bg-blackDark  p-4 rounded-lg ">
                <div className="flex flex-wrap gap-2 mb-3 min-h-[2rem]">
                  {formData.hashtags.length === 0 && (<span className="text-whiteHalf text-sm italic self-center">Add tags (e.g., #fashion)</span>)}
                  {formData.hashtags.map((tag, index) => (
                    <div key={index} className="inline-flex items-center bg-gradient-to-r from-slate-100 to-slate-50 hover:from-slate-200 hover:to-slate-100 border border-slate-200 rounded-full px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md group">
                      <span className="text-slate-700 font-medium text-sm mr-2">
                        {tag}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => removeHashtag(index)} 
                        className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-300 hover:bg-red-400 text-slate-600 hover:text-white transition-all duration-200 opacity-70 group-hover:opacity-100" 
                        aria-label={`Remove hashtag ${tag}`} 
                        disabled={isAnyLoading}
                      >
                        <X size={12} strokeWidth={2} />
                      </button>
                    </div>
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
                    disabled={isAnyLoading} 
                  />
                  <button 
                    type="button" 
                    onClick={addHashtag} 
                    className="btn btn-ghost bg-newYellow text-blackDark hover:bg-blackDark hover:text-newYellow join-item rounded-r-full shadow-md border-none cursor-pointer" 
                    disabled={!formData.hashtagInput.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="divider my-4"></div>



            


          <div class="flex flex-col sm:flex-row sm:justify-end gap-3 w-full px-4 sm:px-0 py-4">
                <Link
                    to="/seller/viewvideo"
                    class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gray-200 text-center shadow-sm border border-gray-300 text-gray-700 hover:bg-gray-300 hover:shadow-md transition-all duration-200 group"
                >
                    <ArrowLeft size={20} class="text-gray-600 group-hover:transform group-hover:-translate-x-1 transition-transform" />
                    Cancel
                </Link>

                <button
                    type="submit"
                    class={`w-full sm:w-auto btn ${isEditMode ? 'bg-greenLight hover:bg-green-600 hover:text-whiteLight' : 'bg-newYellow hover:bg-blackDark hover:text-newYellow'} text-blackDark  flex items-center justify-center gap-2 px-4 py-3 rounded-full shadow-sm hover:shadow-md transition-all duration-200 ${loading.submit ? "opacity-70 cursor-not-allowed" : ""}`}
                    disabled={isAnyLoading || loading.submit}
                >
                    {loading.submit ? (
                        <>
                            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isEditMode ? "Saving..." : "Submitting..."}
                        </>
                    ) : (
                        <>
                            <Save class="h-5 w-5" />
                            {isEditMode ? "Save Changes" : "Submit "}
                        </>
                    )}
                </button>
            </div>
          </form>
        </div>
      </div>

      {showResetModal && (
        <div className="modal modal-open shadow-xl" role="dialog">
          <div className="modal-box bg-blackLight text-gray-800">
            <h3 className="font-bold text-lg text-whiteLight flex items-center gap-2 "><AlertCircle className="text-red-500" />Confirm Reset</h3>
            <p className="py-4 text-whiteHalf">Are you sure you want to reset the form? All entered data and uploads will be cleared.</p>
            <div className="modal-action">
              <button className="btn btn-ghost bg-white/30 rounded-full" onClick={() => setShowResetModal(false)}>Cancel</button>
              <button className="btn btn-error rounded-full text-whiteLight" onClick={() => resetForm(true)}>Reset Form</button>
            </div>
          </div>
          <div className="modal-backdrop bg-black bg-opacity-30" onClick={() => setShowResetModal(false)}></div>
        </div>
      )}

      {showSubmitModal && (
        <div className="modal modal-open" role="dialog">
          <div className="modal-box bg-white text-gray-800">
            <h3 className="font-bold text-lg text-green-600 flex items-center gap-2"><Upload />Confirm Submission</h3>
            <p className="py-4">Are you sure you want to submit this shoppable video?</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowSubmitModal(false)}>Cancel</button>
              <button className="btn bg-green-600 hover:bg-green-700 text-white" onClick={confirmAndSubmit} disabled={loading.submit}>
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

export default ShopableForm;