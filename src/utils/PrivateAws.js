import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { Upload } from "@aws-sdk/lib-storage";

// Access environment variables prefixed with "VITE_"
const AWS_REGION = import.meta.env.VITE_AWS_REGION;
const AWS_ACCESSKEYID = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
const AWS_SECRETACCESSKEY = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
const AWS_BUCKET = import.meta.env.VITE_AWS_BUCKET_PRIVATE;

// Create an S3 client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESSKEYID,
    secretAccessKey: AWS_SECRETACCESSKEY,
  },
});

// Upload function
export const uploadImageToS3 = async (image, path) => {
  try {
    // Validate that the image is a Blob or File
     // Ensure the image is a valid File or Blob
     if (!(image instanceof Blob || image instanceof File)) {
      throw new Error("Invalid image format. Expected a File or Blob.");
    }

    // Generate a unique key for the file
    const key = `${path}/${uuidv4()}_${image.name}`;

    // Convert File/Blob to an ArrayBuffer (or Uint8Array)
    const arrayBuffer = await image.arrayBuffer();

    // Create a command for S3 upload
    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET, // Your S3 bucket
      Key: key,
      Body: arrayBuffer, // Pass ArrayBuffer for compatibility
      ContentType: image.type, // Use the correct MIME type
      // ACL: "private", // Modify ACL if needed (e.g., "public-read")
     
    });

    // Send the command using the S3 client
    await s3Client.send(command);

    console.log("Image uploaded successfully:", key);
    return key; // Return the key of the uploaded image
  } catch (error) {
    console.error("Error uploading to S3:", error.message || error);
    throw new Error("Failed to upload image to S3. Please try again.");
  }
};

// Upload Video Function
// export const uploadVideoToS3 = async (video, path, onProgress) => {
//   // try {
//   //   const key = `${path}/${uuidv4()}_${video.name}`;
//   //    console.log(`uploadVideoToS3: Starting upload for key: ${key}, video size: ${video.size}`); 
//   //   const upload = new Upload({
//   //     client: s3Client,
//   //     params: {
//   //       Bucket: AWS_BUCKET,
//   //       Key: key,
//   //       Body: video,
//   //       ContentType: video.type || "video/mp4",
//   //     },
//   //   });

// try {
//     const key = `${path}/${uuidv4()}_${video.name}`;
//     const upload = new Upload({
//       client: s3Client,
//       params: {
//         Bucket: AWS_BUCKET,
//         Key: key,
//         Body: video,
//         ContentType: video.type || "video/mp4",
//         ChecksumAlgorithm: 'CRC32', 
//       },
//       queueSize: 3,
//       partSize: 10 * 1024 * 1024, // 10MB
//       leavePartsOnError: false
//     });

//     upload.on("httpUploadProgress", (progress) => {
//       if (progress.total && typeof onProgress === "function") {
//         const percent = Math.round((progress.loaded / progress.total) * 100);
//         onProgress(percent);
//       }
//     });

//     await upload.done();
//     return key;
//   } catch (error) {
//     console.error("Upload failed:", error);
//     throw error;
//   }
// };


export const uploadVideoToS3 = async (video, path, onProgress) => {
  try {
    const key = `${path}/${uuidv4()}_${video.name}`;
  const upload = new Upload({
  client: s3Client,
  params: {
    Bucket: AWS_BUCKET,
    Key: key,
    Body: video,
    ContentType: video.type || "video/mp4",
  },
  queueSize:4,
  partSize: 15 * 1024 * 1024,
  leavePartsOnError: false,
});

    upload.on("httpUploadProgress", (progress) => {
      if (progress.total && typeof onProgress === "function") {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        onProgress(percent);
      }
    });

    await upload.done();
    console.log(`Video uploaded successfully to: ${key}`);
    return key;
  } catch (error) {
    console.error("Upload failed:", error);
    // Log the full error for more details, especially if it's an S3 error object
    if (error.$metadata) {
      console.error("Error metadata:", error.$metadata);
    }
    if (error.Code) {
        console.error("S3 Error Code:", error.Code);
    }
    if (error.Message) {
        console.error("S3 Error Message:", error.Message);
    }
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
      Bucket: import.meta.env.VITE_AWS_BUCKET_PRIVATE,
      Key: key,
    });

    await s3Client.send(command);
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
