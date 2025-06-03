import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { predefinedTags, indianLanguages } from "../../../utils/constants";
import { GET_CATEGORIES, UPDATE_SHOW, BASIC_SHOW_INFO } from "../../api/apiDetails"; 
import axiosInstance from "../../../utils/axiosInstance";
import { X, Loader2, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { getLocalStringsFromUtcIso, getUtcIsoStringFromLocal } from "../../../utils/dateUtils";
import { uploadImageToS3, uploadVideoToS3, deleteObjectFromS3 } from "../../../utils/aws";

const EditLiveStreamModal = ({ isOpen, onClose, streamId }) => {
  const CDN_BASE_URL = import.meta.env.VITE_AWS_CDN_URL;
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  const [loadingStates, setLoadingStates] = useState({
    imageUpload: false,
    videoUpload: false,
  });

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const initialFormState = {
    title: "",
    date: "",
    time: "",
    category: "",
    subCategory: "",
    tags: [],
    thumbnailImage: "",
    previewVideo: "",
    language: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [showRes, categoriesRes] = await Promise.all([
          axiosInstance.get(`${BASIC_SHOW_INFO}/${streamId}`),
          axiosInstance.get(GET_CATEGORIES),
        ]);

        const showData = showRes.data.data;
        const categoriesData = categoriesRes.data;
        const localDateTime = getLocalStringsFromUtcIso(showData.scheduledAt);

        setFormData({
          title: showData.title || "",
          date: localDateTime.date,
          time: localDateTime.time,
          category: showData.category || "",
          subCategory: showData.subCategory || "",
          tags: showData.tags || [],
          thumbnailImage: showData.thumbnailImage || "",
          previewVideo: showData.previewVideo || "",
          language: showData.language || "",
        });
        setSelectedTags(showData.tags || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load stream details.");
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && streamId) {
      fetchData();
    } else if (!isOpen) {
      setIsLoading(true);
      setFormData(initialFormState);
      setSelectedTags([]);
      setErrors({});
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      setImageUploadProgress(0);
      setVideoUploadProgress(0);
    }
  }, [isOpen, streamId, onClose]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid image type. Please upload JPG, PNG, or WEBP.");
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`);
      return;
    }

    setErrors(prev => ({ ...prev, thumbnailImage: undefined }));
    setImageUploadProgress(0);
    setLoadingStates(prev => ({ ...prev, imageUpload: true }));

    const oldImageKey = formData.thumbnailImage;

    try {
      const s3ObjectKey = await uploadImageToS3(
        file,
        "show-thumbnails",
        setImageUploadProgress
      );

      if (!s3ObjectKey) throw new Error("S3 upload failed");

      setFormData(prev => ({
        ...prev,
        thumbnailImage: s3ObjectKey,
      }));
      toast.success("Thumbnail uploaded!");

      if (oldImageKey && oldImageKey !== s3ObjectKey) {
        try {
          await deleteObjectFromS3(oldImageKey);
        } catch (deleteError) {
          console.error("Error deleting old thumbnail:", deleteError);
        }
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Image upload failed");
      if (imageInputRef.current) imageInputRef.current.value = "";
    } finally {
      setLoadingStates(prev => ({ ...prev, imageUpload: false }));
    }
  };

  const handleVideoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["video/mp4"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid video type. Please upload MP4.");
      return;
    }
    const maxVideoSize = 50 * 1024 * 1024;
    if (file.size > maxVideoSize) {
      toast.error(`Video too large. Max ${maxVideoSize / 1024 / 1024}MB.`);
      return;
    }

    setVideoUploadProgress(0);
    setLoadingStates(prev => ({ ...prev, videoUpload: true }));

    const oldVideoKey = formData.previewVideo;

    try {
      const s3ObjectKey = await uploadVideoToS3(
        file,
        "show-previews",
        setVideoUploadProgress
      );

      if (!s3ObjectKey) throw new Error("S3 upload failed");

      setFormData(prev => ({
        ...prev,
        previewVideo: s3ObjectKey,
      }));
      toast.success("Preview video uploaded!");

      if (oldVideoKey && oldVideoKey !== s3ObjectKey) {
        try {
          await deleteObjectFromS3(oldVideoKey);
        } catch (deleteError) {
          console.error("Error deleting old video:", deleteError);
        }
      }
    } catch (error) {
      console.error("Video upload failed:", error);
      toast.error("Video upload failed");
      if (videoInputRef.current) videoInputRef.current.value = "";
    } finally {
      setLoadingStates(prev => ({ ...prev, videoUpload: false }));
    }
  };

  const resetImageState = async () => {
    const imageKeyToDelete = formData.thumbnailImage;
    if (imageKeyToDelete) {
      setLoadingStates(prev => ({ ...prev, imageUpload: true }));
      try {
        await deleteObjectFromS3(imageKeyToDelete);
        toast.success("Thumbnail removed");
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Failed to remove thumbnail");
      } finally {
        setLoadingStates(prev => ({ ...prev, imageUpload: false }));
      }
    }
    setFormData(prev => ({
      ...prev,
      thumbnailImage: "",
    }));
    setImageUploadProgress(0);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const resetVideoState = async () => {
    const videoKeyToDelete = formData.previewVideo;
    if (videoKeyToDelete) {
      setLoadingStates(prev => ({ ...prev, videoUpload: true }));
      try {
        await deleteObjectFromS3(videoKeyToDelete);
        toast.success("Preview video removed");
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Failed to remove video");
      } finally {
        setLoadingStates(prev => ({ ...prev, videoUpload: false }));
      }
    }
    setFormData(prev => ({
      ...prev,
      previewVideo: "",
    }));
    setVideoUploadProgress(0);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  // ... (keep other handlers like handleInputChange, handleTagToggle, validateForm the same)

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix form errors");
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledAtUTC = getUtcIsoStringFromLocal(formData.date, formData.time);
      if (!scheduledAtUTC) throw new Error("Invalid date/time");

      const payload = {
        title: formData.title,
        scheduledAt: scheduledAtUTC,
        category: formData.category,
        subCategory: formData.subCategory,
        language: formData.language,
        tags: selectedTags,
        thumbnailImage: formData.thumbnailImage,
        previewVideo: formData.previewVideo || null,
      };

      const res = await axiosInstance.put(`${UPDATE_SHOW}/${streamId}`, payload);
      if (res.data.status) {
        toast.success("Show updated!");
        onClose(true);
      } else {
        throw new Error(res.data.message || "Update failed");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (name === 'category') {
      setFormData(prev => ({ ...prev, subCategory: '' }));
    }
  };

  const handleTagToggle = (tag) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag]
    );
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title?.trim()) newErrors.title = "Title is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.time) newErrors.time = "Time is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.subCategory) newErrors.subCategory = "Subcategory is required";
    if (!formData.language) newErrors.language = "Language is required";
    if (!formData.thumbnailImage) newErrors.thumbnailImage = "Thumbnail image is required"; // Validates S3 key presence

    // You might want to add a date/time validation to ensure it's in the future
    // For example:
    const scheduledDateTime = new Date(`${formData.date}T${formData.time}`);
    if (scheduledDateTime <= new Date()) {
        newErrors.date = "Scheduled date and time must be in the future.";
        newErrors.time = "Scheduled date and time must be in the future.";
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 

  if (!isOpen) return null;

  const currentCategory = categories.find(c => c.categoryName === formData.category);
  const subcategories = currentCategory?.subcategories || [];

  return (
    <>
      <style jsx>{`
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          opacity: 1 !important;
          cursor: pointer !important;
          filter: brightness(0.2) !important;
        }
      `}</style>

      <div className={`modal modal-open`}>
        <div className="modal-box w-11/12 max-w-5xl bg-white shadow-xl relative">
          <button
            type="button"
            onClick={() => onClose()}
            className="btn btn-circle btn-sm absolute right-3 top-3 bg-red-500 hover:bg-red-600 border-none text-white z-20"
            disabled={isSubmitting || loadingStates.imageUpload || loadingStates.videoUpload} // Disable if any upload in progress
          >
            <X size={18} />
          </button>

          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h3 className="text-xl font-bold mb-6 text-slate-800">
                Edit Show Details
              </h3>

              {/* Title Input */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text text-slate-700 font-medium">Title *</span>
                </label>
                <input
                  type="text" name="title" placeholder="Enter title"
                  value={formData.title} onChange={handleInputChange}
                  className={`input input-bordered w-full bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:bg-white ${errors.title ? "input-error border-red-400" : "border-slate-300 focus:border-indigo-500"}`}
                  disabled={isSubmitting}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label"><span className="label-text text-slate-700 font-medium">Date *</span></label>
                  <input
                    type="date" name="date" value={formData.date} onChange={handleInputChange}
                    className={`input input-bordered w-full bg-slate-50 text-slate-800 focus:bg-white ${errors.date ? "input-error border-red-400" : "border-slate-300 focus:border-indigo-500"}`}
                    min={new Date().toISOString().split("T")[0]}
                    disabled={isSubmitting}
                  />
                  {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-slate-700 font-medium">Time *</span></label>
                  <input
                    type="time" name="time" value={formData.time} onChange={handleInputChange}
                    className={`input input-bordered w-full bg-slate-50 text-slate-800 focus:bg-white ${errors.time ? "input-error border-red-400" : "border-slate-300 focus:border-indigo-500"}`}
                    disabled={isSubmitting}
                  />
                  {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
                </div>
              </div>

              {/* Category and Subcategory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label"><span className="label-text text-slate-700 font-medium">Category *</span></label>
                  <select
                    name="category" value={formData.category} onChange={handleInputChange}
                    className={`select select-bordered w-full bg-slate-50 text-slate-800 focus:bg-white ${errors.category ? "select-error border-red-400" : "border-slate-300 focus:border-indigo-500"}`}
                    disabled={isSubmitting}
                  >
                    <option disabled value="" className="text-slate-500">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id || cat.id || cat.categoryName} value={cat.categoryName} className="text-slate-800">{cat.categoryName}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-slate-700 font-medium">Subcategory *</span></label>
                  <select
                    name="subCategory" value={formData.subCategory} onChange={handleInputChange}
                    className={`select select-bordered w-full bg-slate-50 text-slate-800 focus:bg-white ${errors.subCategory ? "select-error border-red-400" : "border-slate-300 focus:border-indigo-500"}`}
                    disabled={!formData.category || isSubmitting || subcategories.length === 0}
                  >
                    <option disabled value="" className="text-slate-500">Select Subcategory</option>
                    {subcategories.map((sub) => (
                      <option key={sub._id || sub.id || sub.name} value={sub.name} className="text-slate-800">{sub.name}</option>
                    ))}
                  </select>
                  {errors.subCategory && <p className="text-red-500 text-xs mt-1">{errors.subCategory}</p>}
                  {!formData.category && <p className="text-xs text-slate-400 mt-1">Select a category first</p>}
                  {formData.category && subcategories.length === 0 && !isLoading && <p className="text-xs text-slate-400 mt-1">No subcategories available</p>}
                </div>
              </div>

              {/* Language */}
              <div className="form-control mb-4">
                <label className="label"><span className="label-text text-slate-700 font-medium">Language *</span></label>
                <select
                  name="language" value={formData.language} onChange={handleInputChange}
                  className={`select select-bordered w-full bg-slate-50 text-slate-800 focus:bg-white ${errors.language ? "select-error border-red-400" : "border-slate-300 focus:border-indigo-500"}`}
                  disabled={isSubmitting}
                >
                  <option disabled value="" className="text-slate-500">Select Language</option>
                  {indianLanguages.map((lang) => (
                    <option key={lang.value} value={lang.value} className="text-slate-800">{lang.label}</option>
                  ))}
                </select>
                {errors.language && <p className="text-red-500 text-xs mt-1">{errors.language}</p>}
              </div>

              {/* Tags section */}
              <div className="form-control mb-4">
                <label className="label"><span className="label-text text-slate-700 font-medium">Tags (Optional)</span></label>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg min-h-[50px] border border-slate-300">
                    {selectedTags.length > 0 ? (
                      selectedTags.map((tag, index) => (
                        <div key={index} className="badge bg-indigo-100 text-indigo-800 border border-indigo-300 gap-1.5 px-2.5 py-3 text-sm font-medium">
                          {tag}
                          <button type="button" onClick={() => handleTagToggle(tag)} className="ml-1 text-indigo-500 hover:text-red-600 focus:outline-none" disabled={isSubmitting} aria-label={`Remove ${tag} tag`}>
                            <X size={14} strokeWidth={2.5}/>
                          </button>
                        </div>
                      ))
                    ) : <span className="text-slate-400 text-sm italic px-1">No tags selected</span>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-slate-600">Add Tags:</p>
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-100 rounded-lg max-h-32 overflow-y-auto border border-slate-200">
                      {predefinedTags.filter((tag) => !selectedTags.includes(tag)).map((tag) => (
                        <button key={tag} type="button" onClick={() => handleTagToggle(tag)} className="btn btn-xs bg-white hover:bg-indigo-500 hover:text-white text-slate-700 border-slate-300 font-normal" disabled={isSubmitting}>
                          + {tag}
                        </button>
                      ))}
                      {predefinedTags.filter((tag) => !selectedTags.includes(tag)).length === 0 && <span className="text-slate-500 text-xs italic px-1">All available tags selected</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Thumbnail Section (S3) --- */}
              <div className="form-control mt-6 mb-4">
                <label className="label"><span className="label-text text-slate-700 font-medium">Thumbnail Image *</span></label>
                <div className={`border-2 border-dashed rounded-xl p-4 min-h-[220px] flex flex-col justify-center items-center relative group ${errors.thumbnailImage ? 'border-red-400' : 'border-indigo-300'} ${loadingStates.imageUpload ? 'bg-slate-50' : 'bg-white hover:bg-indigo-50/50 transition-colors'}`}>
                  <input
                    ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={isSubmitting || loadingStates.imageUpload}
                  />
                  {formData.thumbnailImage ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                       <img 
                          src={`${CDN_BASE_URL}${formData.thumbnailImage}`}
                          alt="Thumbnail preview" 
                          className="max-h-[180px] max-w-full object-contain rounded-lg shadow-md" 
                        />

                      <button type="button" onClick={resetImageState} className="btn btn-circle btn-xs bg-red-500 hover:bg-red-600 text-white absolute -top-2 -right-2 shadow-lg z-20" disabled={isSubmitting || loadingStates.imageUpload} aria-label="Remove thumbnail image">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      {loadingStates.imageUpload ? (
                        <div className="flex flex-col items-center text-center px-4">
                          <Loader2 className="animate-spin text-indigo-500 mb-3" size={32} />
                          <p className="text-sm font-medium text-slate-700">Uploading thumbnail...</p>
                          <progress className="progress progress-primary w-3/4 mt-2" value={imageUploadProgress} max="100"></progress>
                          <p className="text-xs text-gray-500 mt-1">{`${imageUploadProgress}% complete`}</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3 mx-auto"><ImageIcon className="w-6 h-6 text-indigo-500" /></div>
                          <p className="text-sm text-indigo-700 font-medium group-hover:underline">Click or Drag to upload</p>
                          <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP (Max 5MB)</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {errors.thumbnailImage && <p className="text-red-500 text-xs mt-1">{errors.thumbnailImage}</p>}
              </div>

              {/* --- Preview Video Section (S3) --- */}
              <div className="form-control mt-6 mb-4">
                <label className="label"><span className="label-text text-slate-700 font-medium">Preview Video (Optional)</span></label>
                <div className={`border-2 border-dashed border-indigo-300 rounded-xl p-4 min-h-[220px] flex flex-col justify-center items-center relative group ${loadingStates.videoUpload ? 'bg-slate-50' : 'bg-white hover:bg-indigo-50/50 transition-colors'}`}>
                  <input
                    ref={videoInputRef} type="file" accept="video/mp4"
                    onChange={handleVideoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={isSubmitting || loadingStates.videoUpload}
                  />
                  {formData.previewVideo ? (
                    <div className="relative w-full h-full flex items-center justify-center z-30"> {/* z-index was 30, check if needed over X button's 20 */}
                      <video 
                        controls 
                        className="max-h-[180px] max-w-full object-contain rounded-lg shadow-md" 
                        src={`${CDN_BASE_URL}${formData.previewVideo}`}
                        key={formData.previewVideo}
                      />
                      <button type="button" onClick={resetVideoState} className="btn btn-circle btn-xs bg-red-500 hover:bg-red-600 text-white absolute -top-2 -right-2 shadow-lg z-20" disabled={isSubmitting || loadingStates.videoUpload} aria-label="Remove preview video">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      {loadingStates.videoUpload ? (
                        <div className="flex flex-col items-center text-center px-4">
                          <Loader2 className="animate-spin text-indigo-500 mb-3" size={32} />
                          <p className="text-sm font-medium text-slate-700">Uploading preview...</p>
                          <progress className="progress progress-primary w-3/4 mt-2" value={videoUploadProgress} max="100"></progress>
                          <p className="text-xs text-gray-500 mt-1">{`${videoUploadProgress}% complete`}</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3 mx-auto"><VideoIcon className="w-6 h-6 text-indigo-500" /></div>
                          <p className="text-sm text-indigo-700 font-medium group-hover:underline">Click or Drag to upload</p>
                          <p className="text-xs text-gray-500 mt-1">MP4 (e.g., Max 30s, 50MB)</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="modal-action mt-8 flex justify-center">
                <button
                  type="submit"
                  className="btn btn-primary min-w-48 text-base" // DaisyUI btn-primary
                  disabled={isSubmitting || isLoading || loadingStates.imageUpload || loadingStates.videoUpload}
                >
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin mr-2" size={20} />Saving Changes...</>
                  ) : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default EditLiveStreamModal;