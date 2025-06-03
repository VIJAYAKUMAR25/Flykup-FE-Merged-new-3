import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Access environment variables prefixed with "VITE_"
const AWS_REGION = import.meta.env.VITE_AWS_REGION;
const AWS_ACCESSKEYID = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
const AWS_SECRETACCESSKEY = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
const AWS_BUCKET = import.meta.env.VITE_AWS_BUCKET;

// Create an S3 client optimized for browser compatibility
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESSKEYID,
    secretAccessKey: AWS_SECRETACCESSKEY,
  },
  // Browser-specific configuration
  requestHandler: {
    requestTimeout: 900000, // 15 minutes timeout
  },
  // Disable problematic features for browser compatibility
  useAcceleration: false,
  forcePathStyle: false,
});

// Upload function for images (keeping original)
export const uploadImageToS3 = async (image, path) => {
  try {
    // Validate that the image is a Blob or File
    if (!(image instanceof Blob || image instanceof File)) {
      throw new Error("Invalid image format. Expected a File or Blob.");
    }

    // Generate a unique key for the file
    const key = `${path}/${uuidv4()}_${image.name}`;

    // Convert File/Blob to an ArrayBuffer (or Uint8Array)
    const arrayBuffer = await image.arrayBuffer();

    // Create a command for S3 upload
    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET,
      Key: key,
      Body: arrayBuffer,
      ContentType: image.type,
    });

    // Send the command using the S3 client
    await s3Client.send(command);

    console.log("Image uploaded successfully:", key);
    return key;
  } catch (error) {
    console.error("Error uploading to S3:", error.message || error);
    throw new Error("Failed to upload image to S3. Please try again.");
  }
};

// Browser-compatible video upload using direct S3 commands with better progress
export const uploadVideoToS3 = async (video, path, onProgress, options = {}) => {
  try {
    const key = `${path}/${uuidv4()}_${video.name}`;
    
    console.log(`Starting upload for file: ${video.name}, size: ${video.size} bytes, type: ${video.type}`);

    // Validate video file type
    const supportedTypes = [
      'video/mp4',
      'video/mov',
      'video/webm',
      'video/x-matroska',   // .mkv
      'video/x-msvideo',    // .avi
      'video/x-m4v',        // .m4v
      'video/quicktime',    // Alternative MIME type for .mov
      'video/avi',          // Alternative MIME type for .avi
    ];

    if (!supportedTypes.includes(video.type) && !video.name.match(/\.(mp4|mov|webm|mkv|avi|m4v)$/i)) {
      throw new Error(`Unsupported video format. Supported formats: MP4, MOV, WEBM, MKV, AVI, M4V`);
    }

    const { signal = null } = options;

    // Ensure we have a proper File/Blob object
    if (!(video instanceof File) && !(video instanceof Blob)) {
      throw new Error('Invalid video file format. Expected File or Blob object.');
    }

    // Determine the correct content type
    let contentType = video.type || 'video/mp4';
    
    // Map file extensions to proper MIME types if type is missing or generic
    if (!video.type || video.type === 'application/octet-stream') {
      const extension = video.name.split('.').pop()?.toLowerCase();
      const mimeMap = {
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'webm': 'video/webm',
        'mkv': 'video/x-matroska',
        'avi': 'video/x-msvideo',
        'm4v': 'video/x-m4v'
      };
      contentType = mimeMap[extension] || 'video/mp4';
    }

    console.log(`Using content type: ${contentType}`);

    // Better progress tracking with realistic simulation
    let currentProgress = 0;
    const updateProgress = (progress) => {
      currentProgress = progress;
      if (typeof onProgress === "function") {
        onProgress(Math.round(progress));
      }
    };

    updateProgress(5); // Initial progress

    // Handle abort signal
    if (signal) {
      if (signal.aborted) {
        throw new Error('Upload was cancelled');
      }
    }

    // Convert File to ArrayBuffer with progress tracking
    const arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        updateProgress(35); // File reading complete
        resolve(event.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      // Track file reading progress
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          // Progress from 5% to 35% during file reading
          const readProgress = 5 + (event.loaded / event.total) * 30;
          updateProgress(readProgress);
        }
      };

      reader.readAsArrayBuffer(video);
    });

    // Check abort after file reading
    if (signal && signal.aborted) {
      throw new Error('Upload was cancelled');
    }

    updateProgress(40); // Preparation complete

    // Create the upload command
    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET,
      Key: key,
      Body: arrayBuffer,
      ContentType: contentType,
      ContentLength: video.size,
    });

    updateProgress(45); // Command prepared

    // Realistic progress simulation during upload
    const startTime = Date.now();
    // Estimate upload time based on file size (very rough estimate)
    const estimatedUploadTime = Math.max(3000, (video.size / (1024 * 1024)) * 1000); // ~1 second per MB minimum 3 seconds
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(elapsed / estimatedUploadTime, 0.95); // Cap at 95%
      const simulatedProgress = 45 + (progressRatio * 50); // From 45% to 95%
      
      if (currentProgress < simulatedProgress) {
        updateProgress(simulatedProgress);
      }
    }, 500); // Update every 500ms

    try {
      // Execute the upload
      const result = await s3Client.send(command);
      
      // Clear progress simulation and complete
      clearInterval(progressInterval);
      updateProgress(100);

      console.log(`Video uploaded successfully to: ${key}`, result);
      return key;
      
    } catch (uploadError) {
      clearInterval(progressInterval);
      throw uploadError;
    }
    
  } catch (error) {
    console.error("Detailed upload error:", error);
    
    // Handle abort errors gracefully
    if (error.name === 'AbortError' || error.message?.includes('aborted') || error.message?.includes('canceled')) {
      throw new Error('Upload was cancelled');
    }

    // Handle file reading errors
    if (error.message?.includes('Failed to read file')) {
      throw new Error('Could not read the video file. Please try again.');
    }

    // Handle file format errors
    if (error.message?.includes('Unsupported video format')) {
      throw error; // Re-throw our custom format error
    }

    // Handle memory errors (file too large for ArrayBuffer conversion)
    if (error.message?.includes('Invalid array buffer length') || 
        error.message?.includes('Maximum call stack size exceeded') ||
        error.name === 'RangeError') {
      throw new Error('File is too large to process in browser. Please try a smaller file or use a different device.');
    }

    // Enhanced error handling for browser compatibility issues
    if (error.message?.includes('CORS') || error.message?.includes('Access-Control-Allow-Origin')) {
      throw new Error('CORS configuration issue. Please check your S3 bucket CORS settings.');
    }
    
    if (error.message?.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }

    if (error.message?.includes('NetworkingError')) {
      throw new Error('Network connectivity issue. Please check your internet connection.');
    }

    // AWS specific errors
    if (error.Code === 'NoSuchBucket') {
      throw new Error('S3 bucket not found. Please check your configuration.');
    }

    if (error.Code === 'AccessDenied') {
      throw new Error('Access denied. Please check your AWS credentials and permissions.');
    }

    if (error.Code === 'EntityTooLarge') {
      throw new Error('File is too large for upload. Please use a smaller file.');
    }

    // Request timeout errors
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      throw new Error('Upload timed out. Please check your internet connection and try again.');
    }

    // Log detailed error information for debugging
    if (error.$metadata) {
      console.error("AWS Error metadata:", error.$metadata);
    }
    if (error.Code) {
      console.error("AWS Error Code:", error.Code);
    }
    if (error.Message) {
      console.error("AWS Error Message:", error.Message);
    }
    
    // Provide user-friendly error message
    const userMessage = error.message || 'Failed to upload video. Please try again.';
    throw new Error(userMessage);
  }
};

// For very large files, we can implement a chunked upload approach
export const uploadLargeVideoToS3 = async (video, path, onProgress, options = {}) => {
  try {
    // This is a fallback for extremely large files
    // We'll break them into smaller chunks and upload sequentially
    const chunkSize = 50 * 1024 * 1024; // 50MB chunks
    const totalChunks = Math.ceil(video.size / chunkSize);
    
    if (totalChunks === 1) {
      // If only one chunk, use regular upload
      return await uploadVideoToS3(video, path, onProgress, options);
    }

    const key = `${path}/${uuidv4()}_${video.name}`;
    
    // For now, we'll still use the regular upload but with better error handling
    // In a production environment, you might want to implement proper multipart upload
    // using signed URLs from your backend
    return await uploadVideoToS3(video, path, onProgress, options);
    
  } catch (error) {
    console.error("Large file upload error:", error);
    throw error;
  }
};

// Generate Signed URL Function
export const generateSignedUrl = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: AWS_BUCKET,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 900 seconds = 15 minutes 
    return signedUrl;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return null;
  }
};

export const deleteObjectFromS3 = async (key) => {
  try {
    if (!key) throw new Error('No key provided for deletion');

    const command = new DeleteObjectCommand({
      Bucket: AWS_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`Object deleted successfully: ${key}`);
    return true;
  } catch (error) {
    console.error("S3 Delete Error:", error);
    throw new Error(`Failed to delete object: ${error.message}`);
  }
};

// Generate Signed Video URL Function
export const generateSignedVideoUrl = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: AWS_BUCKET,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 300 seconds = 5 minutes
    return signedUrl;
  } catch (error) {
    console.error("Error generating signed video URL:", error);
    return null;
  }
};