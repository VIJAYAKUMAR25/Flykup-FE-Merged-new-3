import React, { useState, useEffect, useRef } from "react"; 
import { uploadToAzure } from "../../../utils/azureHelpers";
import { toast } from "react-toastify";
import { predefinedTags, indianLanguages } from "../../../utils/constants";
import { GET_CATEGORIES, UPDATE_SHOW, BASIC_SHOW_INFO, AZURE_SAS_ENDPOINT } from "../../api/apiDetails";
import axiosInstance from "../../../utils/axiosInstance";
import { X, Loader2, Check, Image as ImageIcon, Video as VideoIcon } from "lucide-react"; 
import { getLocalStringsFromUtcIso, getUtcIsoStringFromLocal } from "../../../utils/dateUtils";

const EditLiveStreamModal = ({ isOpen, onClose, streamId }) => {
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]); 


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

  // Combined formData state
  const [formData, setFormData] = useState({
    title: "",
    date: "", 
    time: "", 
    category: "",
    subCategory: "",
    tags: [], // This will be populated from fetch, but UI might use selectedTags
    thumbnailImage: "", // Blob name
    previewVideo: "", // Blob name (optional)
    thumbnailImageURL: "", // Azure URL
    previewVideoURL: "", // Azure URL (optional)
    language: "",
  });

  // Fetch data effect (mostly from new code, ensures all fields are populated)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // Start loading
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
          tags: showData.tags || [], // Populate formData.tags as well
          thumbnailImage: showData.thumbnailImage || "",
          thumbnailImageURL: showData.thumbnailImageURL || "",
          previewVideo: showData.previewVideo || "",
          previewVideoURL: showData.previewVideoURL || "",
          language: showData.language || "",
        });

        setSelectedTags(showData.tags || []); // Populate selectedTags for UI
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load stream details.");
        onClose(); // Close modal on fetch error
      } finally {
        setIsLoading(false); // Finish loading
      }
    };

    if (isOpen && streamId) {
      fetchData();
    } else {
      // Reset state if modal is closed or streamId is missing
      setIsLoading(true);
      setIsLoading(true);
      setFormData({
          title: "", date: "", time: "", category: "", subCategory: "",
          tags: [], thumbnailImage: "", previewVideo: "",
          thumbnailImageURL: "", previewVideoURL: "", language: ""
      });
      setSelectedTags([]);
      setCategories([]);
      setErrors({});
      resetImageState();
      resetVideoState();
    }
  }, [isOpen, streamId, onClose]);

  // --- Azure Image Upload Handler --- (from new code)
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid image type. Please upload JPG, PNG, or WEBP.");
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error(`Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`);
      return;
    }

    setErrors(prev => ({ ...prev, thumbnailImage: undefined })); // Clear previous error
    setImageUploadProgress(0); // Reset progress

    try {
      setLoadingStates(prev => ({ ...prev, imageSAS: true }));
      const sasResponse = await axiosInstance.post(AZURE_SAS_ENDPOINT, {
        originalFilename: file.name,
        contentType: file.type, // Send content type for accurate SAS generation
      });

      const { sasUrl, blobName, azureUrl } = sasResponse.data;
      if (!sasUrl || !blobName || !azureUrl) {
        throw new Error("Invalid SAS response from server.");
      }

      setLoadingStates(prev => ({ ...prev, imageSAS: false, imageUpload: true }));
      await uploadToAzure(sasUrl, file, setImageUploadProgress);

      setFormData(prev => ({
        ...prev,
        thumbnailImage: blobName,
        thumbnailImageURL: azureUrl,
      }));
      toast.success("Thumbnail uploaded successfully!");
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error(`Image upload failed: ${error.message || "Unknown error"}`);
      resetImageState(); // Reset on failure
    } finally {
      setLoadingStates(prev => ({ ...prev, imageSAS: false, imageUpload: false }));
      if (imageInputRef.current) imageInputRef.current.value = ""; // Clear file input
    }
  };

  // --- Azure Video Upload Handler --- (from new code)
  const handleVideoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["video/mp4"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid video type. Please upload MP4.");
      return;
    }
    
    const maxVideoSize = 50 * 1024 * 1024; // Example: 50MB
    if (file.size > maxVideoSize) {
      toast.error(`Video too large. Max ${maxVideoSize / 1024 / 1024}MB.`);
      return;
    }

    setVideoUploadProgress(0); // Reset progress

    try {
      setLoadingStates(prev => ({ ...prev, videoSAS: true }));
      // Assuming same SAS URL endpoint for videos, adjust if different
      const sasResponse = await axiosInstance.post(AZURE_SAS_ENDPOINT, { // CHANGE ENDPOINT IF NEEDED
        originalFilename: file.name,
        contentType: file.type,
      });

      const { sasUrl, blobName, azureUrl } = sasResponse.data;
      if (!sasUrl || !blobName || !azureUrl) {
        throw new Error("Invalid SAS response from server.");
      }

      setLoadingStates(prev => ({ ...prev, videoSAS: false, videoUpload: true }));
      await uploadToAzure(sasUrl, file, setVideoUploadProgress);

      setFormData(prev => ({
        ...prev,
        previewVideo: blobName,
        previewVideoURL: azureUrl,
      }));
      toast.success("Preview video uploaded successfully!");
    } catch (error) {
      console.error("Video upload failed:", error);
      toast.error(`Video upload failed: ${error.message || "Unknown error"}`);
      resetVideoState(); // Reset on failure
    } finally {
      setLoadingStates(prev => ({ ...prev, videoSAS: false, videoUpload: false }));
      if (videoInputRef.current) videoInputRef.current.value = ""; // Clear file input
    }
  };

  // --- Reset Handlers --- (from new code)
  const resetImageState = () => {
    setFormData(prev => ({
      ...prev,
      thumbnailImage: "", // Clear blob name
      thumbnailImageURL: "", // Clear URL
    }));
    setImageUploadProgress(0);
    if (imageInputRef.current) imageInputRef.current.value = ""; // Ensure input is cleared
  };

  const resetVideoState = () => {
    setFormData(prev => ({
      ...prev,
      previewVideo: "", // Clear blob name
      previewVideoURL: "", // Clear URL
    }));
    setVideoUploadProgress(0);
    if (videoInputRef.current) videoInputRef.current.value = ""; // Ensure input is cleared
  };

  // Handle regular form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error for this field
    if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    // Reset subcategory if category changes
    if (name === 'category') {
        setFormData(prev => ({ ...prev, subCategory: '' }));
    }
  };

  // Handle Tag Selection/Deselection (Updates selectedTags state)
  const handleTagToggle = (tag) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag]
    );
  };

  // --- Validation --- (from new code, ensure all fields are checked)
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title?.trim()) newErrors.title = "Title is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.time) newErrors.time = "Time is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.subCategory) newErrors.subCategory = "Subcategory is required";
    if (!formData.language) newErrors.language = "Language is required";
    // Check for thumbnailImage *blob name*, not URL, as URL might exist from initial load
    if (!formData.thumbnailImage) newErrors.thumbnailImage = "Thumbnail image is required";
    // Add validation for date/time being in the future if necessary

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Submission --- (from new code, uses selectedTags)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
        toast.error("Please fill in all required fields.");
        return;
    }

    setIsSubmitting(true);
    try {
      // Combine local date and time and convert to ISO string
      const scheduledAtUTC = getUtcIsoStringFromLocal(
        formData.date,
        formData.time
      );

      // Add check if conversion failed
      if (!scheduledAtUTC) {
          toast.error("Invalid date or time selected.");
          setIsSubmitting(false);
          return; // Stop submission
      }

      const payload = {
        title: formData.title,
        scheduledAt: scheduledAtUTC,
        category: formData.category,
        subCategory: formData.subCategory,
        language: formData.language,
        tags: selectedTags, // Send the selectedTags array
        thumbnailImage: formData.thumbnailImage, // Send blob name
        previewVideo: formData.previewVideo, // Send blob name (or null/undefined if not set)
        thumbnailImageURL: formData.thumbnailImageURL,
        previewVideoURL: formData.previewVideoURL
      };

      // Remove empty optional fields like previewVideo if necessary for the API
      if (!payload.previewVideo) {
          delete payload.previewVideo;
          delete payload.previewVideoURL;
      }


      const res = await axiosInstance.put(`${UPDATE_SHOW}/${streamId}`, payload);

      if (res.data.status) { // Check based on your API response structure
        toast.success("Show details updated successfully!");
        onClose(true); // Pass true to indicate success/refresh needed
      } else {
          toast.error(res.data.message || "Failed to update show details.");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(`Update failed: ${error.response?.data?.message || error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentCategory = categories.find(c => c.categoryName === formData.category);
  const subcategories = currentCategory?.subcategories || [];

  return (
    <>
      {/* Style from old code */}
      <style jsx>{`
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          opacity: 1 !important;
          cursor: pointer !important;
          filter: brightness(0.2) !important;
        }
      `}</style>

      <div className={`modal modal-open`}> {/* Simplified modal class */}
        <div className="modal-box w-11/12 max-w-5xl bg-white shadow-xl relative"> {/* Added relative */}
          {/* Close Button from old code */}
          <button
            type="button"
            onClick={() => onClose()} // Simple close, no argument needed unless specified
            className="btn btn-circle btn-sm absolute right-3 top-3 bg-red-500 hover:bg-red-600 border-none text-white z-20" // Added z-index
            disabled={isSubmitting}
          >
            <X size={18} /> {/* Using Lucide icon */}
          </button>

          {/* Loading State from old code */}
          {isLoading ? (
            <div className="flex justify-center items-center h-96"> {/* Increased height */}
              <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
          ) : (
            /* Form structure */
            <form onSubmit={handleSubmit} noValidate>
              {/* Title from old code */}
              <h3 className="text-xl font-bold mb-6 text-slate-800">
                Edit Show Details
              </h3>

              {/* Title Input from old code - adapted styling */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text text-slate-700 font-medium">
                    Title *
                  </span>
                </label>
                <input
                  type="text"
                  name="title" // Added name attribute
                  placeholder="Enter title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`input input-bordered w-full bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:bg-white ${
                    errors.title
                      ? "input-error border-red-400"
                      : "border-slate-300 focus:border-indigo-500"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                )}
              </div>

              {/* Date and Time from old code - adapted styling */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-slate-700 font-medium">
                      Date *
                    </span>
                  </label>
                  <input
                    type="date"
                    name="date" // Added name attribute
                    value={formData.date}
                    onChange={handleInputChange}
                    className={`input input-bordered w-full bg-slate-50 text-slate-800 focus:bg-white ${
                      errors.date
                        ? "input-error border-red-400"
                        : "border-slate-300 focus:border-indigo-500"
                    }`}
                    min={new Date().toISOString().split("T")[0]} // Prevent past dates
                    disabled={isSubmitting}
                  />
                  {errors.date && (
                    <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                  )}
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-slate-700 font-medium">
                      Time *
                    </span>
                  </label>
                  <input
                    type="time"
                    name="time" // Added name attribute
                    value={formData.time}
                    onChange={handleInputChange}
                    className={`input input-bordered w-full bg-slate-50 text-slate-800 focus:bg-white ${
                      errors.time
                        ? "input-error border-red-400"
                        : "border-slate-300 focus:border-indigo-500"
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.time && (
                    <p className="text-red-500 text-xs mt-1">{errors.time}</p>
                  )}
                </div>
              </div>

              {/* Category and Subcategory from old code - adapted styling */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-slate-700 font-medium">
                      Category *
                    </span>
                  </label>
                  <select
                    name="category" // Added name attribute
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`select select-bordered w-full bg-slate-50 text-slate-800 focus:bg-white ${
                      errors.category
                        ? "select-error border-red-400"
                        : "border-slate-300 focus:border-indigo-500"
                    }`}
                    disabled={isSubmitting}
                  >
                    <option disabled value="" className="text-slate-500">
                      Select Category
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id || cat.categoryName} value={cat.categoryName} className="text-slate-800">
                        {cat.categoryName}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                  )}
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-slate-700 font-medium">
                      Subcategory *
                    </span>
                  </label>
                  <select
                    name="subCategory" // Added name attribute
                    value={formData.subCategory}
                    onChange={handleInputChange}
                    className={`select select-bordered w-full bg-slate-50 text-slate-800 focus:bg-white ${
                      errors.subCategory
                        ? "select-error border-red-400"
                        : "border-slate-300 focus:border-indigo-500"
                    }`}
                    disabled={!formData.category || isSubmitting || subcategories.length === 0}
                  >
                    <option disabled value="" className="text-slate-500">
                      Select Subcategory
                    </option>
                    {subcategories.map((sub) => (
                       <option key={sub.id || sub.name} value={sub.name} className="text-slate-800">
                         {sub.name}
                       </option>
                     ))}
                  </select>
                  {errors.subCategory && (
                    <p className="text-red-500 text-xs mt-1">{errors.subCategory}</p>
                  )}
                   {!formData.category && <p className="text-xs text-slate-400 mt-1">Select a category first</p>}
                   {formData.category && subcategories.length === 0 && <p className="text-xs text-slate-400 mt-1">No subcategories available</p>}
                </div>
              </div>

              {/* Language from old code - adapted styling */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text text-slate-700 font-medium">
                    Language *
                  </span>
                </label>
                <select
                  name="language" // Added name attribute
                  value={formData.language}
                  onChange={handleInputChange}
                  className={`select select-bordered w-full bg-slate-50 text-slate-800 focus:bg-white ${
                    errors.language
                      ? "select-error border-red-400"
                      : "border-slate-300 focus:border-indigo-500"
                  }`}
                  disabled={isSubmitting}
                >
                  <option disabled value="" className="text-slate-500">
                    Select Language
                  </option>
                  {indianLanguages.map((lang) => (
                    <option key={lang.value} value={lang.value} className="text-slate-800"> {/* Use value */}
                      {lang.label}
                    </option>
                  ))}
                </select>
                {errors.language && (
                  <p className="text-red-500 text-xs mt-1">{errors.language}</p>
                )}
              </div>

              {/* Tags section from old code - adapted for selectedTags state */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text text-slate-700 font-medium">
                    Tags (Optional)
                  </span>
                </label>
                <div className="flex flex-col gap-3">
                   {/* Selected tags display */}
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg min-h-[50px] border border-slate-300">
                    {selectedTags.length > 0 ? (
                      selectedTags.map((tag, index) => (
                      <div
                        key={index}
                        className="badge bg-indigo-100 text-indigo-800 border border-indigo-300 gap-1.5 px-2.5 py-3 text-sm font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className="ml-1 text-indigo-500 hover:text-red-600 focus:outline-none"
                          disabled={isSubmitting}
                          aria-label={`Remove ${tag} tag`}
                        >
                         <X size={14} strokeWidth={2.5}/>
                        </button>
                      </div>
                      ))
                    ) : (
                      <span className="text-slate-400 text-sm italic px-1">
                        No tags selected
                      </span>
                    )}
                  </div>

                   {/* Available tags section */}
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-slate-600">
                       Add Tags:
                    </p>
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-100 rounded-lg max-h-32 overflow-y-auto border border-slate-200">
                      {predefinedTags
                        .filter((tag) => !selectedTags.includes(tag)) // Filter based on selectedTags
                        .map((tag) => (
                          <button
                            key={tag}
                            type="button" // Important: prevent form submission
                            onClick={() => handleTagToggle(tag)} // Use toggle handler
                            className="btn btn-xs bg-white hover:bg-indigo-500 hover:text-white text-slate-700 border-slate-300 font-normal"
                            disabled={isSubmitting}
                          >
                            + {tag}
                          </button>
                        ))}
                      {predefinedTags.filter((tag) => !selectedTags.includes(tag)).length === 0 && (
                         <span className="text-slate-500 text-xs italic px-1">
                           All available tags selected
                         </span>
                       )}
                    </div>
                  </div>
                </div>
              </div>


              {/* --- Thumbnail Section --- (from new code) */}
              <div className="form-control mt-6 mb-4"> {/* Added margin */}
                 <label className="label">
                   <span className="label-text text-slate-700 font-medium">
                     Thumbnail Image *
                   </span>
                 </label>
                 <div className={`border-2 border-dashed rounded-xl p-4 min-h-[220px] flex flex-col justify-center items-center relative group ${errors.thumbnailImage ? 'border-red-400' : 'border-indigo-300'} ${loadingStates.imageUpload ? 'bg-slate-50' : 'bg-white hover:bg-indigo-50/50 transition-colors'}`}>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={isSubmitting || loadingStates.imageUpload || loadingStates.imageSAS}
                  />

                  {formData.thumbnailImageURL ? (
                    // Display Existing/Uploaded Image
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={formData.thumbnailImageURL}
                        alt="Thumbnail preview"
                        className="max-h-[180px] max-w-full object-contain rounded-lg shadow-md"
                      />
                      <button
                        type="button"
                        onClick={resetImageState}
                        className="btn btn-circle btn-xs bg-red-500 hover:bg-red-600 text-white absolute -top-2 -right-2 shadow-lg z-20"
                        disabled={isSubmitting || loadingStates.imageUpload || loadingStates.imageSAS}
                        aria-label="Remove thumbnail image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    // Display Upload Placeholder or Progress
                    <>
                      {(loadingStates.imageSAS || loadingStates.imageUpload) ? (
                        // Loading / Uploading State
                        <div className="flex flex-col items-center text-center px-4">
                           <Loader2 className="animate-spin text-indigo-500 mb-3" size={32} />
                           <p className="text-sm font-medium text-slate-700">
                             {loadingStates.imageSAS ? "Preparing upload..." : `Uploading thumbnail...`}
                           </p>
                           {loadingStates.imageUpload && (
                                <progress className="progress progress-primary w-3/4 mt-2" value={imageUploadProgress} max="100"></progress>
                            )}
                           <p className="text-xs text-gray-500 mt-1">{loadingStates.imageUpload ? `${imageUploadProgress}% complete` : 'Please wait'}</p>
                         </div>
                      ) : (
                        // Initial Placeholder State
                        <div className="text-center">
                          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                             <ImageIcon className="w-6 h-6 text-indigo-500" />
                          </div>
                          <p className="text-sm text-indigo-700 font-medium group-hover:underline">Click or Drag to upload</p>
                          <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP (Max 5MB)</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {errors.thumbnailImage && !formData.thumbnailImageURL && ( // Show error only if no image is set
                  <p className="text-red-500 text-xs mt-1">{errors.thumbnailImage}</p>
                )}
              </div>

              {/* --- Preview Video Section --- (from new code) */}
               <div className="form-control mt-6 mb-4"> {/* Added margin */}
                 <label className="label">
                   <span className="label-text text-slate-700 font-medium">
                     Preview Video (Optional)
                   </span>
                 </label>
                 <div className={`border-2 border-dashed border-indigo-300 rounded-xl p-4 min-h-[220px] flex flex-col justify-center items-center relative group ${loadingStates.videoUpload ? 'bg-slate-50' : 'bg-white hover:bg-indigo-50/50 transition-colors'}`}>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4"
                    onChange={handleVideoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={isSubmitting || loadingStates.videoUpload || loadingStates.videoSAS}
                  />

                  {formData.previewVideoURL ? (
                    // Display Existing/Uploaded Video
                    <div className="relative w-full h-full flex items-center justify-center z-30">
                      <video
                        controls
                        className="max-h-[180px] max-w-full object-contain rounded-lg shadow-md"
                        src={formData.previewVideoURL}
                        // Add a key to force re-render if URL changes, preventing stale previews
                        key={formData.previewVideoURL}
                      />
                      <button
                        type="button"
                        onClick={resetVideoState}
                        className="btn btn-circle btn-xs bg-red-500 hover:bg-red-600 text-white absolute -top-2 -right-2 shadow-lg z-20"
                        disabled={isSubmitting || loadingStates.videoUpload || loadingStates.videoSAS}
                        aria-label="Remove preview video"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                     // Display Upload Placeholder or Progress
                    <>
                      {(loadingStates.videoSAS || loadingStates.videoUpload) ? (
                        // Loading / Uploading State
                         <div className="flex flex-col items-center text-center px-4">
                           <Loader2 className="animate-spin text-indigo-500 mb-3" size={32} />
                           <p className="text-sm font-medium text-slate-700">
                             {loadingStates.videoSAS ? "Preparing upload..." : `Uploading preview...`}
                           </p>
                            {loadingStates.videoUpload && (
                                <progress className="progress progress-primary w-3/4 mt-2" value={videoUploadProgress} max="100"></progress>
                            )}
                            <p className="text-xs text-gray-500 mt-1">{loadingStates.videoUpload ? `${videoUploadProgress}% complete` : 'Please wait'}</p>
                         </div>
                      ) : (
                         // Initial Placeholder State
                         <div className="text-center">
                           <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                              <VideoIcon className="w-6 h-6 text-indigo-500" />
                           </div>
                           <p className="text-sm text-indigo-700 font-medium group-hover:underline">Click or Drag to upload</p>
                           <p className="text-xs text-gray-500 mt-1">MP4 (e.g., Max 30s, 50MB)</p> {/* Specify limits */}
                         </div>
                      )}
                    </>
                  )}
                </div>
                {/* No specific error display for optional video needed unless required */}
              </div>

              {/* Submit Button from old code - adapted */}
              <div className="modal-action mt-8 flex justify-center"> {/* Use modal-action for spacing */}
                 <button
                   type="submit"
                   className="btn btn-primary min-w-48 text-base" // Larger button
                   disabled={isSubmitting || isLoading || loadingStates.imageUpload || loadingStates.videoUpload || loadingStates.imageSAS || loadingStates.videoSAS}
                 >
                   {isSubmitting ? (
                     <>
                       <Loader2 className="animate-spin mr-2" size={20} />
                       Saving Changes...
                     </>
                   ) : (
                     "Save Changes"
                   )}
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