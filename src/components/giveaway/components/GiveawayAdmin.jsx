import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import config from "../api/config";
import { toast } from "react-toastify";
import AnimatedRollingDisplay from "./AnimatedRollingDisplay";

const socket = io.connect(config.backendUrl, {
  transports: ['websocket'], // Force WebSocket transport
});

const GiveawayAdmin = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [productTitle, setProductTitle] = useState("");
  const [giveaway, setGiveaway] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollingWinner, setRollingWinner] = useState(null);

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

  // Listen for giveaway events from the server
  useEffect(() => {
    socket.on("giveawayStarted", (data) => {
      console.log("Giveaway started:", data);
      setGiveaway(data);
    });

    socket.on("giveawayApplicantsUpdated", (data) => {
      // Update state if the giveawayKey matches the current giveaway
      if (giveaway && data.giveawayKey === giveaway.giveawayKey) {
        setGiveaway((prev) => ({ ...prev, applicants: data.applicants }));
      }
    });

    socket.on("giveawayWinner", (data) => {
      if (giveaway && data.giveawayKey === giveaway.giveawayKey) {
        // If there are applicants, start the rolling effect for 7 seconds
        if (data.applicants && data.applicants.length > 0) {
          setIsRolling(true);
          const intervalId = setInterval(() => {
            const randomIndex = Math.floor(
              Math.random() * data.applicants.length
            );
            const randomApplicant = data.applicants[randomIndex];
            setRollingWinner(randomApplicant);
          }, 100);

          setTimeout(() => {
            clearInterval(intervalId);
            setIsRolling(false);
            setRollingWinner(null);
            // Finally reveal the winner and update the giveaway state
            setGiveaway((prev) => ({
              ...prev,
              winner: data.winner,
              isActive: false,
            }));
          }, 7000);
        } else {
          setGiveaway((prev) => ({
            ...prev,
            winner: data.winner,
            isActive: false,
          }));
        }
      }
    });

    // Listen for clear giveaway success event
    socket.on("clearGiveawaySuccess", (data) => {
      toast.success(data.message);
      // Clear the giveaway state or update it accordingly
      setGiveaway(null);
    });

    // Listen for any giveaway errors
    socket.on("giveawayError", (data) => {
      toast.error(data.message);
    });

    return () => {
      socket.off("giveawayStarted");
      socket.off("giveawayApplicantsUpdated");
      socket.off("giveawayWinner");
      socket.off("clearGiveawaySuccess");
      socket.off("giveawayError");
    };
  }, [giveaway]);

  // Handler to start a giveaway.
  // A unique productId is generated using Date.now()
  const handleStartGiveaway = (e) => {
    e.preventDefault();
    const productId = Date.now().toString();
    socket.emit("startGiveaway", { productId, productTitle });
    toast.success("Giveaway started successfully!");
    setModalOpen(false);
    setProductTitle("");
  };

  // Handler to roll and select the winner.
  const handleRollWinner = () => {
    if (!giveaway) return;
    socket.emit("rollAndSelectGiveaway");
  };

  // Handler for confirming the clear giveaway action
  const handleClearGiveawayYes = () => {
    socket.emit("clearExistingGiveaway");
    setClearModalOpen(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Giveaway Admin</h1>
      <div className="flex justify-center mb-6">
        <button
          className="btn btn-warning shadow-lg hover:shadow-2xl transition duration-300 mr-4"
          onClick={() => setModalOpen(true)}
        >
          Start Giveaway
        </button>
        <button
          className="btn btn-outline text-white shadow-lg hover:shadow-2xl transition duration-300"
          onClick={() => setClearModalOpen(true)}
        >
          Clear Giveaway
        </button>
      </div>

      {/* Modal for starting a giveaway */}
      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box relative">
            <button
              className="btn btn-sm btn-circle absolute right-2 top-2"
              onClick={() => setModalOpen(false)}
            >
              ✕
            </button>
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              Start Giveaway
            </h3>
            <form onSubmit={handleStartGiveaway} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Product Title</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Product Title"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  className="input input-bordered text-gray-900"
                  required
                />
              </div>
              <div className="modal-action">
                <button
                  type="submit"
                  className="btn btn-ghost bg-success hover:bg-success/80"
                >
                  Start Now!
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for clearing giveaway */}
      {clearModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box relative">
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              Clear Giveaway
            </h3>
            <p className="mb-4 text-gray-900">
              Are you sure you want to clear all active giveaways?
            </p>
            <div className="modal-action">
              <button className="btn btn-success" onClick={handleClearGiveawayYes}>
                Yes
              </button>
              <button
                className="btn btn-error"
                onClick={() => setClearModalOpen(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Display Giveaway Details */}
      {giveaway ? (
        <div className="card w-full bg-gray-950/60 rounded-b-3xl backdrop-blur-lg shadow-xl mt-6">
          <div className="card-body">
            <h2 className="card-title">Product: {giveaway.productTitle}</h2>
            <p className="text-lg">
              {giveaway.applicants ? giveaway.applicants.length : 0} members applied
            </p>
            {giveaway.winner || isRolling ? (
              <AnimatedRollingDisplay
                isRolling={isRolling}
                rollingWinner={rollingWinner}
                winner={giveaway.winner}
              />
            ) : null}
            {!giveaway.winner && (
              <div className="card-actions justify-end">
                <button
                  className="btn btn-primary"
                  onClick={handleRollWinner}
                  disabled={isRolling}
                >
                  Roll & Select Winner
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">
          No active giveaway at the moment.
        </p>
      )}
    </div>
  );
};

export default GiveawayAdmin;
