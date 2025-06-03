import axios from 'axios';
import { useState } from 'react';
import axiosInstance from './axiosInstance';
// Custom hook for Azure file upload handling
export const useAzureUpload = (generateSasEndpoint) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const uploadFileToAzure = async (file, additionalPayload = {}) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Get SAS URL from your backend
      const sasResponse = await axiosInstance.post(generateSasEndpoint, {
        originalFilename: file.name,
        ...additionalPayload
      });

      const { sasUrl, blobName } = sasResponse.data;

      // Upload to Azure Blob Storage
      const uploadConfig = {
        headers: {
          'Content-Type': file.type,
          'x-ms-blob-type': 'BlockBlob',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        },
      };

      await axios.put(sasUrl, file, uploadConfig);

      return {
        success: true,
        blobName,
        sasUrl,
        size: file.size,
        mimeType: file.type
      };
    } catch (error) {
      setUploadError(error.response?.data?.error || error.message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFileToAzure, uploadProgress, isUploading, uploadError };
};

// Reusable file change handler with upload capability
export const createAzureFileHandler = ({
  setFormData,
  setFilePreviews,
  generateSasEndpoint,
  onUploadSuccess,
  onUploadError
}) => {
  const { uploadFileToAzure } = useAzureUpload(generateSasEndpoint);

  return async (e) => {
    const { name, files } = e.target;
    if (!files?.[0]) return;

    const file = files[0];
    const previewURL = URL.createObjectURL(file);

    // Update preview immediately
    setFilePreviews(prev => ({ ...prev, [name]: previewURL }));

    try {
      // Start upload process
      const uploadResult = await uploadFileToAzure(file);

      // Update form data with blobName
      setFormData(prev => ({
        ...prev,
        [name]: uploadResult.blobName // Store blobName in the original field
      }));

      onUploadSuccess?.(uploadResult, name);
    } catch (error) {
      // Reset on error
      setFilePreviews(prev => ({ ...prev, [name]: null }));
      onUploadError?.(error);
    }
  };
};