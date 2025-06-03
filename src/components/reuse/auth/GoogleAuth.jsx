import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { GOOGLE_AUTH } from "../../api/apiDetails";
import axiosInstance from "../../../utils/axiosInstance";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";

const GoogleAuth = () => {
  const [error, setError] = useState("");
  // Removed loading state as GoogleLogin handles its own visual loading
  const { setUser } = useAuth();

  const navigate = useNavigate();

  const handleSuccess = (credentialResponse) => {
    setError("");
    try {
      const userDetails = parseJwt(credentialResponse.credential);

      // Send the user data to the backend
      sendDataToBackend(userDetails, navigate);
    } catch (error) {
      setError("Failed to process login response");
      console.error(error);
    }
  };

  const handleError = () => {
    console.error("Google Login Failed");
    setError("Authentication failed. Please try again.");
    toast.error("Google Login Failed. Please try again."); // Added toast for error
  };

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (error) {
      console.error("Error decoding token:", error);
      throw new Error("Invalid token format");
    }
  };

  const sendDataToBackend = async (userDetails, navigate) => {
    try {
      // Step 1: Send user details to the backend for authentication
      const response = await axiosInstance.post(GOOGLE_AUTH, {
        name: userDetails.name,
        emailId: userDetails.email,
        profileURL: userDetails.picture,
      });

      const data = response.data;

      console.log("Google login success:", data);

      if (data.status) {
        setUser(data.data); // Set user before navigating
        navigate("/profile");
        toast.success("Login successful!"); // Success toast
      } else {
        toast.error(data.message || "Login failed. Please try again."); // Handle backend specific error messages
      }
    } catch (error) {
      console.error("Google login failed:", error);
      toast.error("Login failed. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center w-full"> {/* Ensure parent div is full width */}
      <div className="relative w-full"> {/* Make this div full width too */}
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap
          text="signin_with"
          shape="pill"
          theme="outline" // Dark theme
          size="large" // Large size for better visibility
          className="rounded-xl w-full" // Apply w-full directly to the button
          width="auto" // Set width to auto, then control with CSS (className)
          // Removed onClick and onRequest as they interfere with Google's internal loading
        />
        {/* You can add error display here if needed */}
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
      </div>
    </div>
  );
};

export default GoogleAuth;


//     <div className="w-full item-center min-w-[240px] max-w-full">
//   <div className="!w-full [&>div]:!w-full [&>div>div]:!w-full [&>div>div>div]:!w-full [&>div>div>div>div]:!w-full [&>div>div>div>div>div]:!w-full">
//     <GoogleLogin
//       onSuccess={handleSuccess}
//       onError={handleError}
//       useOneTap
//       text="signin_with"
//       shape="pill"
//       theme="filled_blue"
//       size="large"
//       className="rounded-xl !w-full"
//       width="100%"
//       style={{ width: '100%' }}
//     />
//   </div>
// </div>
