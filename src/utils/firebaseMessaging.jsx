import { messaging } from "../firebase.config";
import { getToken, onMessage } from "firebase/messaging";
import axiosInstance from "./axiosInstance";
import { toast } from "react-toastify";

// Endpoint for sending the token to your backend
const UPDATE_FCM_TOKEN_ENDPOINT = "user/me/update-fcm-token";
const vapidKey =
  "BPR3wu_PdKGYdk3OO79-9jc223wTeVwkBOjrstH1Ise270CfdpqULGO5dUh-8scNvPj7hi_Rf2-F293lwucGa3U";

const sendTokenToBackend = async (token) => {
  if (!token) {
    console.warn("No FCM token to send to backend.");
    return;
  }
  console.log("Attempting to send FCM token to backend:", token);
  try {
    const response = await axiosInstance.post(UPDATE_FCM_TOKEN_ENDPOINT, {
      fcmToken: token,
    });
    console.log("FCM token sent to backend successfully:", response.data);
  } catch (error) {
    console.error(
      "Error sending FCM token to backend:",
      error.response ? error.response.data : error.message
    );
  }
};

export const requestPermissionAndGetToken = async () => {
  console.log("Requesting notification permission...");
  try {
    // 1. Request Permission
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("Notification permission granted.");

      // 2. Get Token
      console.log("Getting FCM token...");
      // **** 'YOUR_PUBLIC_VAPID_KEY_FROM_FIREBASE'****
      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey,
      });

      if (currentToken) {
        console.log("FCM Token received:", currentToken);
        // 3. Send Token to Backend
        await sendTokenToBackend(currentToken);
      } else {
        console.log(
          "No registration token available. Permission might be granted, but token generation failed."
        );
      }
    } else {
      console.log("Notification permission denied.");
    }
  } catch (err) {
    console.error("An error occurred during FCM setup: ", err);
  }
};

export const setupForegroundMessageHandler = () => {
  const unsubscribe = onMessage(messaging, (payload) => {
    // --- Display the notification ---

    // Display title & body
    const notificationTitle = payload.data?.notificationTitle || "Background Notification";
    const notificationBody = payload.data?.notificationBody || "Something Happened";

    //Display image if exists 
    const imageUrl = payload.data?.imageUrl;

    const hasValidImage = imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== "";

    toast.success(
      <div>
        <strong>{notificationTitle}</strong>
        {notificationBody && <p style={{ margin: '5px 0'}}>{notificationBody}</p>}

        {/* conditionally render image */}
        {
          hasValidImage && (
            <img src={imageUrl} alt={ notificationTitle || "Notification Image"} 
            style={{
              maxWidth: '100%',   
              maxHeight: '150px', 
              marginTop: '10px',  
              display: 'block',  
              marginLeft: 'auto', 
              marginRight: 'auto'
            }}
            />
          )
        }

      </div>,
      {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      }
    );
  });

  console.log("Foreground message handler set up.");
  return unsubscribe;
};
