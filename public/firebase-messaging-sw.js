importScripts(
  "https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js"
);

// Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
  apiKey: "AIzaSyB_vpzgfGpG_8NedTIE8U0ToKsIF3VtquE",
  authDomain: "flykup-512cc-e6db9.firebaseapp.com",
  projectId: "flykup-512cc-e6db9",
  storageBucket: "flykup-512cc-e6db9.firebasestorage.app",
  messagingSenderId: "638262178713",
  appId: "1:638262178713:web:232a0247836321e212d908",
  measurementId: "G-LP2Y1HJDF3"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

//Handle background messages (System notifications)
messaging.onBackgroundMessage((payload) => {
  // Customize notification here
  const notificationTitle =
    payload.data?.notificationTitle || "Background Notification";
  const notificationBody =
    payload.data?.notificationBody || "Something Happened!";
  const iconUrl = "./Flykup_logo_Black.svg"; // replace it with standard small icon

  // Extract custom data
  const customData = payload.data || {};

  // get image from payload
  const imageUrl = customData.imageUrl;

  // base notification options
  const notificationOptions = {
    body: notificationBody,
    icon: iconUrl,
    data: customData,
  };

  // conditionally add image (if exists)
  if (imageUrl && typeof imageUrl === "string" && imageUrl.trim() !== "") {
    notificationOptions.image = imageUrl;
  }

  // Display the notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

//Handle notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // Close the notification

  // Example: Focus or open a specific window/tab based on data
  const urlToOpen = event.notification.data?.url || "/"; // Get URL from data payload or default

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          const clientPath = new URL(client.url).pathname;
          const targetPath = new URL(urlToOpen, self.location.origin).pathname;

          if (clientPath === targetPath && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          const absoluteUrlToOpen = new URL(urlToOpen, self.location.origin)
            .href;
          return clients.openWindow(absoluteUrlToOpen);
        }
      })
  );
});
