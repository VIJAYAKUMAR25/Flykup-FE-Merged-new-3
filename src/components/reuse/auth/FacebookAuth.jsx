import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// No longer need direct import of axios if only using axiosInstance
// import axios from "axios";
import { FACEBOOK_AUTH, GET_USER_DETAILS_BY_ID } from "../../api/apiDetails";
import axiosInstance from "../../../utils/axiosInstance"; // Import your axiosInstance

const FacebookAuth = () => {
  const [error, setError] = useState("");
  const [isSDKLoaded, setSDKLoaded] = useState(false);
  const [FB, setFB] = useState(null);
  const navigate = useNavigate();

  // Function to load Facebook SDK
  const loadFacebookSDK = () => {
    return new Promise((resolve, reject) => {
      // Remove any existing FB SDK script to prevent re-initialization issues
      const existingScript = document.getElementById("facebook-jssdk");
      if (existingScript) {
        existingScript.remove();
      }

      window.fbAsyncInit = function () {
        window.FB.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: "v18.0", // Use a recent version
        });
        console.log("Facebook SDK initialized and ready.");
        setFB(window.FB);
        setSDKLoaded(true); // Set SDK loaded to true after initialization
        resolve(window.FB);
      };

      // Load the SDK script
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.error("Failed to load Facebook SDK script.");
        reject(new Error("Failed to load Facebook SDK"));
      };
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    // Check for HTTPS in development and production
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      setError(
        "Facebook Login requires HTTPS. Please enable HTTPS on your server or use localhost for development."
      );
      return;
    }

    // Load SDK only once when component mounts
    const init = async () => {
      try {
        await loadFacebookSDK();
      } catch (err) {
        setError("Failed to load Facebook SDK. Please refresh the page.");
        console.error("SDK Load Error in useEffect:", err);
        // Do not retry indefinitely, better to show an error and let user refresh
      }
    };

    if (!isSDKLoaded) {
      // Only call init if SDK hasn't been loaded yet
      init();
    }

    // Cleanup function: remove the Facebook SDK script when the component unmounts
    return () => {
      const script = document.getElementById("facebook-jssdk");
      if (script) {
        script.remove();
        // Reset state when component unmounts
        setSDKLoaded(false);
        setFB(null);
      }
    };
  }, []); // Empty dependency array means this runs only once on mount

  const handleFacebookLogin = async () => {
    setError("");

    if (!isSDKLoaded || !FB) {
      setError(
        "Facebook SDK is not loaded yet. Please wait a moment and try again."
      );
      console.warn("Attempted Facebook login before SDK was ready.");
      return;
    }

    try {
      const response = await new Promise((resolve, reject) => {
        FB.login(
          (loginResponse) => {
            if (loginResponse.authResponse) {
              resolve(loginResponse);
            } else {
              // User cancelled login or did not authorize
              reject(new Error("Facebook login cancelled or failed."));
            }
          },
          {
            scope: "email,public_profile",
            return_scopes: true,
          }
        );
      });

      console.log("Facebook Login Success:", response);

      // Get user information
      const userInfo = await new Promise((resolve, reject) => {
        FB.api("/me", { fields: "id,name,email,picture" }, (apiResponse) => {
          if (apiResponse && !apiResponse.error) {
            resolve(apiResponse);
          } else {
            console.error("Error fetching user info:", apiResponse.error);
            reject(new Error("Failed to fetch user information from Facebook."));
          }
        });
      });

      console.log("User Info:", userInfo);

      // --- Use axiosInstance for the backend authentication call ---
      const backendResponse = await axiosInstance.post(FACEBOOK_AUTH, {
        emailId: userInfo.email,
        name: userInfo.name,
        profileURL: userInfo.picture.data.url,
        accessToken: response.authResponse.accessToken,
      });

      const data = backendResponse.data; // Axios puts the response body in .data

      // Axios throws an error for non-2xx status codes, so no need to check backendResponse.ok
      // If we reach here, it means the request was successful (2xx status)
      console.log("Login/Signup Successful with Backend:", data);

      // Store user data in localStorage
      localStorage.setItem("userData", JSON.stringify(data.user));

      // Check if sellerInfo exists and fetch updated user data if needed
      if (data.user.sellerInfo) {
        try {
          // --- Use axiosInstance for fetching user details ---
          const updatedResponse = await axiosInstance.get(
            GET_USER_DETAILS_BY_ID
          );
          // withCredentials is typically configured on axiosInstance itself,
          // but you can add it here if it's an exception or not global
          // { withCredentials: true } is usually part of axiosInstance config

          if (updatedResponse.data && updatedResponse.data.status) {
            const updatedUserData = updatedResponse.data.data;
            localStorage.setItem("userData", JSON.stringify(updatedUserData));
            console.log("Updated user data from backend:", updatedUserData);
          } else {
            console.warn(
              "Failed to fetch updated user data after initial login:",
              updatedResponse.data
            );
          }
        } catch (error) {
          console.error("Error fetching updated user data:", error.message);
          // This is a non-critical error, proceed with existing userData
        }
      }

      // Navigate to the profile page
      navigate("/profile");
    } catch (error) {
      // Axios errors have a 'response' property with details from the server
      if (error.response) {
        setError(
          error.response.data.data ||
            error.response.data.message ||
            "Authentication failed on the server."
        );
        console.error("Backend error response:", error.response.data);
      } else {
        setError(error.message || "Facebook login failed. Please try again.");
        console.error("Full Facebook Login Process Error:", error);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="w-full rounded-3xl">
        <button
          onClick={handleFacebookLogin}
          className={`flex items-center rounded-3xl justify-between px-4 w-full py-2 border border-gray-300
                     bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2
                     focus:ring-offset-2 focus:ring-blue-500 transition-colors
                     ${!isSDKLoaded ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={!isSDKLoaded} // Disable button if SDK is not loaded
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          {isSDKLoaded ? "Continue with Facebook" : "Loading Facebook..."}
          <div></div> {/* Placeholder for alignment */}
        </button>
      </div>
    </div>
  );
};

export default FacebookAuth;