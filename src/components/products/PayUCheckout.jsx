import React, { useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { socketurl } from '../../../config';

const PayUCheckout = ({ customer, selectedAddress, products, amount, onCloseModal }) => {
  // Inject Bolt DOM elements once
  useEffect(() => {
    if (!document.getElementById("bolt-container")) {
      const boltOverlay = document.createElement("div");
      boltOverlay.id = "bolt-overlay";
      boltOverlay.style.display = "block";
      document.body.appendChild(boltOverlay);

      const boltContainer = document.createElement("div");
      boltContainer.id = "bolt-container";
      boltContainer.style.display = "block";
      document.body.appendChild(boltContainer);
    }
  }, []);

  const initiatePayment = async () => {
    try {
      const res = await axios.post(`${socketurl}/api/payu/create-order`, {
        customer,
        selectedAddress,
        products,
        amount,
      });

      const { paymentData } = res.data;

      if (!paymentData.hash) {
        toast.error("Missing hash from backend!");
        return;
      }

      if (onCloseModal) onCloseModal();

      if (window.bolt) {
        window.bolt.launch(
          {
            ...paymentData,
            mode: 'dropout',
          },
          {
            responseHandler: function (response) {
              if (response.response.status === "success") {
                toast.success("Payment successful!");
                window.location.href = "/payment-success";
              } else {
                toast.error("Payment failed");
                window.location.href = "/payment-failure";
              }
            },
            catchException: function (error) {
              console.error("Bolt Exception: ", error);
              toast.error("Error: " + error.message);
            },
          }
        );
      } else {
        toast.error("Bolt SDK not loaded");
      }

    } catch (error) {
      console.error("Error initiating payment:", error);
      toast.error("Something went wrong. Try again.");
    }
  };

  return (
    <button
      onClick={initiatePayment}
      className="bg-yellow-500 text-white px-4 py-2 rounded-xl shadow-md hover:bg-yellow-600 transition-all duration-300"
    >
      Pay with PayU
    </button>
  );
};

export default PayUCheckout;
