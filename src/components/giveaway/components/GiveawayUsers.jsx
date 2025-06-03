import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import config from "../api/config";
import Confetti from "react-confetti";
import AnimatedRollingDisplay from "./AnimatedRollingDisplay";
import { toast } from "react-toastify";

const socket = io.connect(config.backendUrl, {
    transports: ['websocket'], // Force WebSocket transport
  });
const GiveawayUsers = ({ onWinner }) => {
    const [giveaway, setGiveaway] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [rollingWinner, setRollingWinner] = useState(null);
    const [showTermsModal, setShowTermsModal] = useState(false); // New state for Terms Modal
    const [showPackageDetails, setShowPackageDetails] = useState(false); // For package details modal

    // Retrieve the current user from localStorage
    const storedUser = localStorage.getItem("userData");
    const user = storedUser ? JSON.parse(storedUser) : null;
    console.log("user:", user);

    if (user) {
        // Set the id property to be the value of _id
        user.id = user._id;
        console.log("Updated user:", user);
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
        const handleGiveawayStarted = (data) => {
            console.log("Giveaway started:", data);
            setGiveaway(data);
        };

        const handleApplicantsUpdated = (data) => {
            console.log("Applicants updated:", data);
            setGiveaway(data);
        };

        const handleGiveawayWinner = (data) => {
            console.log("Giveaway winner event received:", data);
            // Start rolling effect for 7 seconds
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
                    // Now reveal the actual winner
                    setGiveaway(data);
                    const currentWinner = data.winner;
                    if (
                        currentWinner &&
                        user &&
                        (currentWinner.id === user.id || currentWinner._id === user.id)
                    ) {
                        onWinner(true);
                    }
                }, 7000);
            } else {
                setGiveaway(data);
                if (
                    data.winner &&
                    user &&
                    (data.winner.id === user.id || data.winner._id === user.id)
                ) {
                    onWinner(true);
                }
            }
        };

        socket.on("giveawayStarted", handleGiveawayStarted);
        socket.on("giveawayApplicantsUpdated", handleApplicantsUpdated);
        socket.on("giveawayWinner", handleGiveawayWinner);
        // Listen for clear giveaway success event
        socket.on("clearGiveawaySuccess", (data) => {
            toast.success(data.message);
            // Clear the giveaway state or update it accordingly
            setGiveaway(null);
            onWinner(false);
        });

        return () => {
            socket.off("giveawayStarted", handleGiveawayStarted);
            socket.off("giveawayApplicantsUpdated", handleApplicantsUpdated);
            socket.off("clearGiveawaySuccess");
            socket.off("giveawayWinner", handleGiveawayWinner);
        };
    }, [onWinner, user]);

    // Handler for when a user clicks "Join Giveaway"
    const handleJoinGiveaway = () => {
        if (!giveaway || !user) {
            console.log("No giveaway or user found.");
            return;
        }
        // Check if the user has already joined (check both id and _id)
        const alreadyJoined =
            giveaway.applicants &&
            giveaway.applicants.some(
                (app) => app?.id === user.id || app?._id === user.id
            );
        if (alreadyJoined) {
            alert("You have already joined this giveaway.");
            return;
        }
        // Open terms and conditions modal before joining
        setShowTermsModal(true);
    };

    // Handler for accepting the terms and conditions
    const handleAcceptTerms = () => {
        setShowTermsModal(false);
        // Emit join giveaway event after accepting terms
        console.log("Emitting applyGiveaway with user:", user);
        socket.emit("applyGiveaway", { user });
        toast.success("You have successfully joined the giveaway.");
    };

    // Handler for declining the terms and conditions
    const handleDeclineTerms = () => {
        setShowTermsModal(false);
        toast.info("You must accept the terms and conditions to join the giveaway.");
    };

    // Check if the current user is the winner.
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
                                        !user ||
                                        (giveaway.applicants &&
                                            giveaway.applicants.some(
                                                (app) =>
                                                    app?.toString() === user.id || app?._id === user.id
                                            ))
                                    }
                                >
                                    {(giveaway.applicants &&
                                        giveaway.applicants.some(
                                            (app) =>
                                                app?.toString() === user.id || app?._id === user.id
                                        ))
                                        ? "Joined"
                                        : "Join Giveaway"}
                                </button>
                            </div>}
                    </div>
                    {/* {isWinner && <Confetti width={width} height={height} />} */}
                </div>
            ) : (
                <p className="text-center text-gray-500">
                    No active giveaway at the moment.
                </p>
            )}

            {/* Clickable text for Package Details */}
            {giveaway &&
                <div className="text-center mt-4">
                    <span
                        className="text-blue-500 cursor-pointer underline"
                        onClick={() => setShowPackageDetails(true)}
                    >
                        Click here for Details Of Package
                    </span>
                </div>}

            {/* Terms and Conditions Modal */}
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
                                }>Flykup</span> and join the giveaway.
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

            {/* Package Details Modal (without Accept button, closes on outside click) */}
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
