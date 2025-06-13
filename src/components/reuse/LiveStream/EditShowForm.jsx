import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useParams, useNavigate, Link } from "react-router-dom";
import { indianLanguages } from "../../../utils/constants";
import { GET_CATEGORIES, UPDATE_SHOW, BASIC_SHOW_INFO } from "../../api/apiDetails";
import axiosInstance from "../../../utils/axiosInstance";
import {
  X,
  Loader2,
  Camera,
  FileVideo,
  ArrowLeft,
  Save,
  RotateCcw,
  Type,
  Calendar,
  Clock,
  Globe,
} from "lucide-react";
import { getLocalStringsFromUtcIso, getUtcIsoStringFromLocal } from "../../../utils/dateUtils";
import {
    uploadImageToS3,
    uploadVideoToS3,
    deleteObjectFromS3,
    generateSignedVideoUrl
} from "../../../utils/aws";
import CohostSelector from "./CohostSelector";

const EditLiveStreamPage = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const cdnURL = import.meta.env.VITE_AWS_CDN_URL;

  const [initialData, setInitialData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState({
    page: true,
    submit: false,
    imageUpload: false,
    videoUpload: false,
  });

  const [signedVideoUrl, setSignedVideoUrl] = useState('');

  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Effect to generate signed URL for the initial video
  useEffect(() => {
    const getSignedUrlForVideo = async () => {
        if (formData?.previewVideo && !formData.previewVideo.startsWith('blob:')) {
            const url = await generateSignedVideoUrl(formData.previewVideo);
            if(url) {
                setSignedVideoUrl(url);
            } else {
                toast.error("Could not load preview video.");
            }
        }
    };
    getSignedUrlForVideo();
  }, [formData?.previewVideo]);


  const fetchAndSetData = useCallback(async () => {
    setLoading(prev => ({ ...prev, page: true }));
    try {
      const [showRes, categoriesRes] = await Promise.all([
        axiosInstance.get(`${BASIC_SHOW_INFO}/${streamId}`),
        axiosInstance.get(GET_CATEGORIES),
      ]);

      const showData = showRes.data.data;
      console.log("Fetched show data:", showData);
      const localDateTime = getLocalStringsFromUtcIso(showData.scheduledAt);

      const formattedData = {
        title: showData.title || "",
        date: localDateTime.date,
        time: localDateTime.time,
        category: showData.category || "",
        subCategory: showData.subCategory || "",
        tags: showData.tags || [],
        thumbnailImage: showData.thumbnailImage || null,
        previewVideo: showData.previewVideo || null,
        language: showData.language || "",
        hasCoHost: showData.hasCoHost || false,
        coHost: showData.coHost || null,
      };

      setInitialData(formattedData);
      setFormData(formattedData);
      setCategories(categoriesRes.data || []);
      setThumbnailPreview(formattedData.thumbnailImage);
      setVideoPreview(formattedData.previewVideo); // This holds the key

    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load stream details.");
      navigate('/seller/allshows');
    } finally {
      setLoading(prev => ({ ...prev, page: false }));
    }
  }, [streamId, navigate]);

  useEffect(() => {
    fetchAndSetData();
  }, [fetchAndSetData]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
        if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
            URL.revokeObjectURL(thumbnailPreview);
        }
        if (videoPreview && videoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(videoPreview);
        }
    };
  }, [thumbnailPreview, videoPreview]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
        ...prev,
        [name]: value,
        ...(name === "category" && { subCategory: "" }),
    }));
  };
  
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type.");
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Image is too large (Max 5MB).`);
      return;
    }
    
    const localPreviewUrl = URL.createObjectURL(file);
    if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailPreview(localPreviewUrl);
    setLoading(prev => ({ ...prev, imageUpload: true }));

    try {
        const newImageKey = await uploadImageToS3(file, "show-thumbnails");
        
        // After new image is uploaded, delete the old one if it was different from the initial one
        if(formData.thumbnailImage && formData.thumbnailImage !== initialData.thumbnailImage) {
            await deleteObjectFromS3(formData.thumbnailImage);
        }

        setFormData(prev => ({ ...prev, thumbnailImage: newImageKey }));
        setThumbnailPreview(newImageKey); // Update preview to use the key
        URL.revokeObjectURL(localPreviewUrl);
        toast.success("New thumbnail uploaded!");
    } catch (error) {
        console.error("Image upload failed:", error);
        toast.error("Image upload failed.");
        URL.revokeObjectURL(localPreviewUrl);
        setThumbnailPreview(formData.thumbnailImage); // Revert to old image preview on failure
    } finally {
        setLoading(prev => ({ ...prev, imageUpload: false }));
    }
  };

  const handleVideoChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.type !== "video/mp4") {
          toast.error("Please upload MP4 videos.");
          return;
      }

      const localPreviewUrl = URL.createObjectURL(file);
      if (videoPreview && videoPreview.startsWith('blob:')) {
          URL.revokeObjectURL(videoPreview);
      }
      setVideoPreview(localPreviewUrl);
      setSignedVideoUrl(localPreviewUrl); // Show local preview immediately
      setLoading(prev => ({ ...prev, videoUpload: true }));

      try {
          const newVideoKey = await uploadVideoToS3(file, "show-previews");
          
          // After new video is uploaded, delete the old one if it was different
          if(formData.previewVideo && formData.previewVideo !== initialData.previewVideo) {
              await deleteObjectFromS3(formData.previewVideo);
          }
          
          setFormData(prev => ({ ...prev, previewVideo: newVideoKey }));
          setVideoPreview(newVideoKey); // Update preview state to hold the key

          const signedUrlForNewVideo = await generateSignedVideoUrl(newVideoKey);
          setSignedVideoUrl(signedUrlForNewVideo || ''); // Set the signed URL for the new video

          URL.revokeObjectURL(localPreviewUrl);
          toast.success("New preview video uploaded!");

      } catch (error) {
          console.error("Video upload failed:", error);
          toast.error("Video upload failed.");
          URL.revokeObjectURL(localPreviewUrl);
          setVideoPreview(formData.previewVideo); // Revert to old video key
          // Regenerate signed URL for the old video
          const oldSignedUrl = await generateSignedVideoUrl(formData.previewVideo);
          setSignedVideoUrl(oldSignedUrl || '');
      } finally {
          setLoading(prev => ({ ...prev, videoUpload: false }));
      }
  };

  const getDisplayableImageSrc = (previewState) => {
      if (!previewState) return '';
      if (previewState.startsWith('blob:')) {
          return previewState;
      }
      return `${cdnURL}${previewState}`;
  };

  const handleCoHostSelected = (coHostData) => {
    setFormData((prev) => ({ ...prev, hasCoHost: true, coHost: coHostData }));
  };

  const handleClearCoHost = () => {
    setFormData((prev) => ({ ...prev, hasCoHost: false, coHost: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({...prev, submit: true}));
    try {
      const scheduledAtUTC = getUtcIsoStringFromLocal(formData.date, formData.time);
      if (!scheduledAtUTC) throw new Error("Invalid date or time format.");

      const payload = { ...formData, scheduledAt: scheduledAtUTC, coHost: formData.coHost?._id || null, };

      const res = await axiosInstance.put(`${UPDATE_SHOW}/${streamId}`, payload);
      if (res.data.status) {
        toast.success("Show updated successfully!");
        navigate('/seller/allshows');
      } else {
        throw new Error(res.data.message || "An unknown error occurred.");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update show.");
    } finally {
        setLoading(prev => ({...prev, submit: false}));
    }
  };


  if (loading.page || !formData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-blackLight text-whiteLight p-4">
        <div className="flex items-center space-x-4">
          <Loader2 className="w-16 h-16 text-newYellow animate-spin" strokeWidth={1.5} />
          <div>
            <h3 className="text-2xl font-semibold text-newYellow animate-pulse">Loading Show Details...</h3>
            <p className="text-whiteHalf">Please wait, we are preparing the editor.</p>
          </div>
        </div>
      </div>
    );
  }

  const isAnyLoading = loading.submit || loading.imageUpload || loading.videoUpload;
  const currentCategoryObj = categories.find(c => c.categoryName === formData.category);

  return (
    <div className="bg-blackLight min-h-screen py-6">
      <div className="w-full mx-auto p-6 px-3 lg:px-12 rounded-xl shadow-xl">
        <div className="sticky top-0 bg-blackLight z-20 flex items-center justify-between mb-3 pb-2 border-b border-greyLight pt-20 px-2 lg:px-6">
          <Link to="/seller/allshows" className="inline-flex items-center gap-2 px-1 py-1 rounded-full bg-newYellow shadow-sm border border-yellow-200 text-gray-800 hover:bg-white hover:shadow transition-all duration-200 group">
            <ArrowLeft size={24} className="text-blackDark group-hover:transform group-hover:-translate-x-1 transition-transform" />
          </Link>
          <h1 className="text-newYellow text-2xl lg:text-3xl font-bold text-center">
            Edit Live Show
          </h1>
          <div></div>
        </div>

        <div className="p-3 lg:p-8 pt-0 overflow-y-auto flex-grow">
          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="form-control">
                   <label className="label mb-2">
                     <span className="label-text text-base font-medium text-whiteLight">Category</span>
                   </label>
                   <select 
                     name="category" value={formData.category} onChange={handleInputChange}
                     className={`select select-bordered w-full bg-blackDark ${formData.category ? 'text-whiteLight' : 'text-whiteHalf'}`} 
                     disabled={isAnyLoading}
                   >
                     <option value="" disabled>Select Category</option>
                     {categories.map((cat) => (
                       <option key={cat._id} value={cat.categoryName}>{cat.categoryName}</option>
                     ))}
                   </select>
                 </div>
                 
                 <div className="form-control">
                   <label className="label mb-2">
                     <span className="label-text text-base font-medium text-whiteLight">Subcategory</span>
                   </label>
                   <select 
                     name="subCategory" value={formData.subCategory} onChange={handleInputChange}
                     className={`select select-bordered w-full bg-blackDark ${formData.subCategory ? 'text-whiteLight' : 'text-whiteHalf'}`} 
                     disabled={!formData.category || isAnyLoading}
                   >
                     <option value="" disabled>Select Subcategory</option>
                     {currentCategoryObj?.subcategories?.map((sub) => (
                       <option key={sub._id} value={sub.name}>{sub.name}</option>
                     ))}
                     {!formData.category && <option value="" disabled>Select a category first</option>}
                   </select>
                 </div>
            </div>
            <div className="form-control">
              <label className="label mb-2"><span className="label-text text-base font-medium text-whiteLight flex items-center gap-2"><Type className="text-newYellow" /> Show Title</span></label>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange}
                className="input input-bordered text-whiteLight w-full focus:border-newYellow bg-blackDark" disabled={isAnyLoading} />
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label mb-2">
                <span className="label-text text-base font-medium text-whiteLight flex items-center gap-2">
                  <Calendar className="text-newYellow"  /> Date
                </span>
              </label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleInputChange}
                className="input input-bordered text-whiteLight w-full focus:border-newYellow bg-blackDark [color-scheme:dark] focus:ring-1 focus:ring-newYellow transition-all duration-200" 
                disabled={isAnyLoading} 
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="form-control">
              <label className="label mb-2">
                <span className="label-text text-base font-medium text-whiteLight flex items-center gap-2">
                  <Clock className="text-newYellow" /> Time
                </span>
              </label>
              <input 
                type="time" 
                name="time" 
                value={formData.time} 
                onChange={handleInputChange}
                className="input input-bordered text-whiteLight w-full focus:border-newYellow bg-blackDark [color-scheme:dark] focus:ring-1 focus:ring-newYellow transition-all duration-200" 
                disabled={isAnyLoading} 
              />
            </div>
          </div>

           

            <div className="form-control">
                <label className="label mb-2"><span className="label-text text-base font-medium text-whiteLight flex items-center gap-2"><Globe className="text-newYellow" /> Language</span></label>
                <select name="language" value={formData.language} onChange={handleInputChange} className={`select select-bordered w-full bg-blackDark ${formData.language ? 'text-whiteLight' : 'text-whiteHalf'}`} disabled={isAnyLoading}>
                    <option disabled value="">Select Language</option>
                    {indianLanguages.map(lang => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
                </select>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="form-control">
                      <label className="label"><span className="label-text text-base font-medium text-whiteLight flex items-center gap-2"><Camera className="text-newYellow" /> Thumbnail</span></label>
                      <div className="flex flex-col items-center justify-center bg-yellowHalf border-2 border-dashed border-newYellow rounded-lg p-4 min-h-[220px]">
                          <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={isAnyLoading}/>
                          {thumbnailPreview ? (
                              <div className="relative">
                                  <img src={getDisplayableImageSrc(thumbnailPreview)} alt="Thumbnail Preview" className="max-h-48 object-contain rounded-md shadow-lg"/>
                                  {loading.imageUpload && <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-md"><Loader2 className="animate-spin text-newYellow" size={32}/></div>}
                                  <button type="button" onClick={() => imageInputRef.current?.click()} className="btn btn-circle btn-xs bg-newYellow hover:bg-yellow-300 text-black absolute -top-2 -right-2 shadow-lg" disabled={isAnyLoading} aria-label="Change thumbnail">
                                      <RotateCcw size={14} />
                                  </button>
                              </div>
                          ) : (
                              <button type="button" className="btn btn-sm bg-blackDark rounded-full text-newYellow" onClick={() => imageInputRef.current?.click()} disabled={isAnyLoading}>Upload Thumbnail</button>
                          )}
                      </div>
                  </div>

                  <div className="form-control">
                      <label className="label"><span className="label-text text-base font-medium text-whiteLight flex items-center gap-2"><FileVideo className="text-newYellow" /> Preview Video</span></label>
                      <div className="flex flex-col items-center justify-center bg-yellowHalf border-2 border-dashed border-newYellow rounded-lg p-4 min-h-[220px]">
                          <input ref={videoInputRef} type="file" accept="video/mp4" onChange={handleVideoChange} className="hidden" disabled={isAnyLoading}/>
                          {videoPreview ? (
                              <div className="relative">
                                  {signedVideoUrl ?
                                      <video controls controlsList="nodownload" src={signedVideoUrl} key={signedVideoUrl} className="max-h-48 object-contain rounded-md shadow-lg" /> :
                                      <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-newYellow" size={32}/></div>
                                  }
                                  {loading.videoUpload && <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-md"><Loader2 className="animate-spin text-newYellow" size={32}/></div>}
                                  <button type="button" onClick={() => videoInputRef.current?.click()} className="btn btn-circle btn-xs bg-newYellow hover:bg-yellow-300 text-black absolute -top-2 -right-2 shadow-lg" disabled={isAnyLoading} aria-label="Change video">
                                      <RotateCcw size={14} />
                                  </button>
                              </div>
                          ) : (
                              <button type="button" className="btn btn-sm bg-blackDark rounded-full text-newYellow" onClick={() => videoInputRef.current?.click()} disabled={isAnyLoading}>Upload Video (Optional)</button>
                          )}
                      </div>
                  </div>
            </div>

             <CohostSelector
              onCoHostSelect={handleCoHostSelected}
              onClearCoHost={handleClearCoHost}
              isSubmitting={loading.submit}
              isUploading={isAnyLoading}
              initialHasCoHost={formData.hasCoHost}
              initialCoHost={formData.coHost}
            />

            <div className="divider my-4"></div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 w-full px-4 sm:px-0 py-4">
              <Link to="/seller/allshows" className="w-full sm:w-auto btn btn-ghost rounded-full bg-greyLight/20 text-whiteLight">
                <ArrowLeft size={20} /> Cancel
              </Link>
              <button type="submit" className="w-full sm:w-auto btn bg-green-600 hover:bg-green-500 text-white rounded-full flex items-center gap-2" disabled={isAnyLoading}>
                {loading.submit ? <Loader2 className="animate-spin" /> : <Save />}
                {loading.submit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditLiveStreamPage;