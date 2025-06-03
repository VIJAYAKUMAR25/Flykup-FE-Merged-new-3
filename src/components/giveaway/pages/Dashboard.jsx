import React, { useEffect, useRef, useState } from "react";
import GiveawayAdmin from "../components/GiveawayAdmin";
import GiveawayUsers from "../components/GiveawayUsers";
import Confetti from "react-confetti";
import ConfettiExplosion from "react-confetti-explosion";
import { FaUser } from "react-icons/fa";
import SponsoredBy from "../components/SponsoredBy";
import { useWindowSize } from "react-use";


export const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const videoRef = useRef(null);
  const { width, height } = useWindowSize();


  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user data from localStorage:", error);
        localStorage.removeItem("userData");
      }
    }
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return <span className="loading loading-lg"></span>;
  }

  return (
    <>
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto" // Start loading the video as soon as possible
        poster="https://flykup.in/path-to-your-poster.jpg" // Optional: a placeholder image
        className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
      >
        <source
          src="https://flykup.in/wp-content/uploads/2025/02/3a49bb548b7c4f08b3a47eb4447beaaa.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>


      {/* Optional overlay gradient for better contrast */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-black/50 to-black/30 rounded-lg" />
      <div className="space-y-6 text-white relative">
        {/* Top right user icon */}
        {user && (
          <div
            className="absolute top-2 right-4 z-50 cursor-pointer"
            onClick={() => setShowUserDetails(!showUserDetails)}
          >
            <FaUser size={24} />
          </div>
        )}
        {/* User details popup */}
        {showUserDetails && user && (
          <div className="absolute top-8 right-4 z-50 bg-gray-800 p-4 rounded-lg shadow-lg">
            <p className="text-md font-semibold">{user.name}</p>
            <p className="text-sm text-gray-300">{user.email || user.emailId}</p>
          </div>
        )}

        <div className="">
          {user?.role === "admin" ? (
            <GiveawayAdmin />
          ) : (
            <GiveawayUsers onWinner={setIsWinner} />
          )}
          {/* Global confetti overlay if the current user is the winner */}
          {isWinner && (
            <div className="fixed inset-0 top-20 flex items-center justify-center pointer-events-none" style={{ zIndex: 9999 }}>
              <Confetti width={width} height={height} numberOfPieces={100} />
              {/* <ConfettiExplosion /> */}
            </div>
          )}
        </div>
      </div>

      {/* Sponsors section */}
      {(user?.role === "user" || user?.role === "seller") && (
        <SponsoredBy />
      )}

    </>
  );
};

export default Dashboard;
