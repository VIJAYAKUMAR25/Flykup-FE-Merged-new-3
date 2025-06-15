// GiveawayUsers.jsx
import React, { useEffect, useState } from "react";
// import io from "socket.io-client"; // REMOVE THIS LINE
import config from "../api/config";
// import Confetti from "react-confetti"; // Confetti is in ShowDetailsPage now
import AnimatedRollingDisplay from "./AnimatedRollingDisplay";
import { toast } from "react-toastify";

// REMOVE the global socket instance here
// const socket = io.connect(config.backendUrl, {
//     transports: ['websocket'],
//   });

// Accept 'socket' as a prop
const GiveawayUsers = ({ onWinner, socket }) => { 
    const [giveaway, setGiveaway] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [rollingWinner, setRollingWinner] = useState(null);
    const [showTermsModal, setShowTermsModal] = useState(false); 
    const [showPackageDetails, setShowPackageDetails] = useState(false); 

    const storedUser = localStorage.getItem("userData");
    const user = storedUser ? JSON.parse(storedUser) : null;
    // console.log("user:", user);

    if (user) {
        user.id = user._id; // Ensure user has an 'id' property consistent with _id
        // console.log("Updated user:", user);
    }

    // On mount, fetch the active giveaway from the API
    useEffect(() => {
        fetch(`${config.backendUrl}/api/giveaway/active`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("No active giveaway found");
                }
                return res.json();
            })
            .then((data) => {
                console.log("Fetched active giveaway:", data);
                setGiveaway(data);
            })
            .catch((error) => {
                console.log("Error fetching active giveaway:", error.message);
            });
    }, []);

    useEffect(() => {
        // Only attach listeners if the socket instance is available
        if (!socket) {
            console.log("GiveawayUsers: Socket not available for listeners.");
            return;
        }

        const handleGiveawayStarted = (data) => {
            console.log("Giveaway started:", data);
            setGiveaway(data);
        };

        const handleApplicantsUpdated = (data) => {
            console.log("Applicants updated:", data);
            // This assumes 'data' is the full giveaway object, adjust if it's just applicants
            setGiveaway(data); 
        };

        const handleGiveawayWinner = (data) => {
            console.log("Giveaway winner event received:", data);
            if (data.applicants && data.applicants.length > 0) {
                setIsRolling(true);
                const intervalId = setInterval(() => {
                    const randomIndex = Math.floor(Math.random() * data.applicants.length);
                    const randomApplicant = data.applicants[randomIndex];
                    setRollingWinner(randomApplicant);
                }, 100);

                setTimeout(() => {
                    clearInterval(intervalId);
                    setIsRolling(false);
                    setRollingWinner(null);
                    setGiveaway(data); // Finally reveal the actual winner
                    const currentWinner = data.winner;
                    if (currentWinner && user && (currentWinner.id === user.id || currentWinner._id === user.id)) {
                        onWinner(true); // Notify parent (ShowDetailsPage) for confetti
                    }
                }, 7000);
            } else {
                setGiveaway(data);
                if (data.winner && user && (data.winner.id === user.id || data.winner._id === user.id)) {
                    onWinner(true);
                }
            }
        };

        const handleClearGiveawaySuccess = (data) => {
            toast.success(data.message);
            setGiveaway(null);
            onWinner(false); // Clear winner state in parent
        };

        socket.on("giveawayStarted", handleGiveawayStarted);
        socket.on("giveawayApplicantsUpdated", handleApplicantsUpdated);
        socket.on("giveawayWinner", handleGiveawayWinner);
        socket.on("clearGiveawaySuccess", handleClearGiveawaySuccess);

        // Cleanup function for socket listeners
        return () => {
            socket.off("giveawayStarted", handleGiveawayStarted);
            socket.off("giveawayApplicantsUpdated", handleApplicantsUpdated);
            socket.off("giveawayWinner", handleGiveawayWinner);
            socket.off("clearGiveawaySuccess", handleClearGiveawaySuccess);
        };
    }, [socket, onWinner, user]); // Add 'socket' to dependencies

    const handleJoinGiveaway = () => {
        if (!giveaway || !user) {
            console.log("No giveaway or user found.");
            toast.error("Please log in or wait for an active giveaway.");
            return;
        }
        
        // Ensure that `giveaway.applicants` is an array of objects with _id or id
        const alreadyJoined =
            giveaway.applicants &&
            giveaway.applicants.some(
                (applicant) => applicant === user.id || (applicant && applicant._id === user.id) // check for populated object or just ID string
            );
        
        if (alreadyJoined) {
            toast.info("You have already joined this giveaway.");
            return;
        }
        setShowTermsModal(true);
    };

    const handleAcceptTerms = () => {
        setShowTermsModal(false);
        if (!socket) {
            toast.error("Socket not connected. Cannot join giveaway.");
            return;
        }
        console.log("Emitting applyGiveaway with user:", user);
        socket.emit("applyGiveaway", { user });
        toast.success("You have successfully joined the giveaway.");
    };

    const handleDeclineTerms = () => {
        setShowTermsModal(false);
        toast.info("You must accept the terms and conditions to join the giveaway.");
    };

    const isWinner =
        giveaway &&
        giveaway.winner &&
        user &&
        (giveaway.winner.id === user.id || giveaway.winner._id === user.id);

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-center mb-6">Active Giveaway</h1>
            {giveaway ? (
                <div className="card w-full bg-gray-950/60 rounded-b-3xl backdrop-blur-sm shadow-xl relative">
                    <div className="card-body">
                        <h2 className="card-title">
                            {giveaway.productTitle ||
                                (giveaway.product && giveaway.product.title)}
                        </h2>
                        <p className="text-lg">
                            {giveaway.applicants ? giveaway.applicants.length : 0} members applied!!!
                        </p>
                        {giveaway.winner || isRolling ? (
                            <AnimatedRollingDisplay
                                isRolling={isRolling}
                                rollingWinner={rollingWinner}
                                isWinner={isWinner}
                                winner={giveaway.winner}
                            />
                        ) : null}
                        {!giveaway.winner &&
                            <div className="card-actions justify-end">
                                <button
                                    className="btn btn-success"
                                    onClick={handleJoinGiveaway}
                                    disabled={
                                        !user || // Disable if no user logged in
                                        (giveaway.applicants &&
                                            giveaway.applicants.some(
                                                (applicant) => applicant === user.id || (applicant && applicant._id === user.id)
                                            ))
                                    }
                                >
                                    {(giveaway.applicants &&
                                        giveaway.applicants.some(
                                            (applicant) => applicant === user.id || (applicant && applicant._id === user.id)
                                        ))
                                        ? "Joined"
                                        : "Join Giveaway"}
                                </button>
                            </div>}
                    </div>
                </div>
            ) : (
                <p className="text-center text-gray-500">
                    No active giveaway at the moment.
                </p>
            )}

            {giveaway &&
                <div className="text-center mt-4">
                    <span
                        className="text-blue-500 cursor-pointer underline"
                        onClick={() => setShowPackageDetails(true)}
                    >
                        Click here for Details Of Package
                    </span>
                </div>}

            {showTermsModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full ">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Terms and Conditions</h2>
                        <p className="mb-4 text-gray-800 max-h-[70vh] overflow-y-auto"
                            style={{ scrollbarWidth: "thin" }}
                        >
                            Exclusive Giveaway! Win a 3-Day Kerala (Varkala) Tour Package!
                            <br /><br />
                            <strong>Terms & Conditions</strong>
                            <br /><br />
                            <strong>1. Eligibility:</strong>
                            <br />
                            Open to all students attending the event where <span className="font-semibold">Mr.Ma Ka Pa Anand</span> is the chief guest.
                            <br />
                            Must register on <span className="font-semibold hover:text-blue-500 cursor-pointer"
                                onClick={() =>
                                    window.open("https://flykup.in/", "_blank", "noopener,noreferrer")
                                }
                            >
                                Flykup
                            </span>{" "}
                            and join the giveaway.
                            <br /><br />
                            <strong>2. Giveaway Details:</strong>
                            <br />
                            1 Winner will be selected, and they can take 2 additional people (friends/family).
                            <br />
                            The package includes:
                            <br />
                            Round-trip flight (Chennai-Kerala-Chennai)
                            <br />
                            2-night luxury hotel stay
                            <br />
                            All meals (breakfast, lunch, dinner)
                            <br />
                            Sightseeing with a private cab
                            <br />
                            The winner can avail the trip within 30 days by contacting Delta Holidays to book their preferred dates.
                            <br /><br />
                            <strong>3. Winner Selection & Announcement:</strong>
                            <br />
                            The winner will be chosen randomly from registered participants.
                            <br />
                            The announcement will be made on 15/03/2025 at 5:00 PM on Flykup’s official social media & website.
                            <br />
                            The winner must share a screenshot of the giveaway announcement with the college students' chairman for confirmation.
                            <br /><br />
                            <strong>4. Other Conditions:</strong>
                            <br />
                            The giveaway cannot be exchanged for cash or transferred to another person.
                            <br />
                            The winner must confirm acceptance within 24 hours after the announcement.
                            <br />
                            If the winner does not respond, another winner will be selected.
                            <br />
                            Flykup & Delta Holidays reserve the right to modify or cancel the giveaway at any time.
                        </p>

                        <div className="flex justify-end space-x-4">
                            <button
                                className="btn btn-error"
                                onClick={handleDeclineTerms}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={handleAcceptTerms}
                            >
                                I Agree
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPackageDetails && (
                <div
                    onClick={() => setShowPackageDetails(false)}
                    className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[70vh] overflow-y-auto"
                    >
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Package Details</h2>
                        <p className="mb-4 text-gray-800">
                            Exclusive Giveaway! Win a 3-Day Kerala (Varkala) Tour Package!
                            <br /><br />
                            <strong>Terms & Conditions</strong>
                            <br /><br />
                            <strong>1. Eligibility:</strong>
                            <br />
                            Open to all students attending the event where <span className="font-semibold">Mr.Ma Ka Pa Anand</span> is the chief guest.
                            <br />
                            Must register on{" "}
                            <span
                                className="font-semibold hover:text-blue-500 cursor-pointer"
                                onClick={() =>
                                    window.open("https://flykup.in/", "_blank", "noopener,noreferrer")
                                }
                            >
                                Flykup
                            </span>{" "}
                            and join the giveaway.
                            <br /><br />
                            <strong>2. Giveaway Details:</strong>
                            <br />
                            1 Winner will be selected, and they can take 2 additional people (friends/family).
                            <br />
                            The package includes:
                            <br />
                            Round-trip flight (Chennai-Kerala-Chennai)
                            <br />
                            2-night luxury hotel stay
                            <br />
                            All meals (breakfast, lunch, dinner)
                            <br />
                            Sightseeing with a private cab
                            <br />
                            The winner can avail the trip within 30 days by contacting Delta Holidays to book their preferred dates.
                            <br /><br />
                            <strong>3. Winner Selection & Announcement:</strong>
                            <br />
                            The winner will be chosen randomly from registered participants.
                            <br />
                            The announcement will be made on 15/03/2025 at 5:00 PM on Flykup’s official social media & website.
                            <br />
                            The winner must share a screenshot of the giveaway announcement with the college students' chairman for confirmation.
                            <br /><br />
                            <strong>4. Other Conditions:</strong>
                            <br />
                            The giveaway cannot be exchanged for cash or transferred to another person.
                            <br />
                            The winner must confirm acceptance within 24 hours after the announcement.
                            <br />
                            If the winner does not respond, another winner will be selected.
                            <br />
                            Flykup & Delta Holidays reserve the right to modify or cancel the giveaway at any time.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GiveawayUsers;