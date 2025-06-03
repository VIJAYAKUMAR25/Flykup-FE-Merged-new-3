import React, { useState, useEffect, useCallback } from "react"; // Import useEffect
import { Shield, CreditCard, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import { socketurl } from "../../../config"; // Adjust path if needed
import { useNavigate } // Import useNavigate if you need to clear URL params
  from "react-router-dom";

const PayUPaymentGateway = ({
  amount,
  selectedAddress,
  products,
  // quantity prop seems unused
  customer,
  onSuccess, // Callback on successful payment detection
  onError,   // Optional: Callback for verification errors
  onCloseModal // Optional: To close the modal if needed
}) => {
  const numericAmount = parseFloat(amount).toFixed(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate(); // Hook for navigation/URL manipulation

  const initiatePayment = async () => {
    setIsSubmitting(true);

    try {
      // Use fetch or axiosInstance as preferred
      const response = await fetch(`${socketurl}/api/payu/create-order`, { // Ensure endpoint is correct
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          selectedAddress,
          products,
          customer,
        }),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        // Try to get error details from response body
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          // If body isn't JSON, use status text
          errorData = { error: response.statusText }
        }
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      const { payuUrl, paymentData, error } = responseData;

      if (error || !payuUrl || !paymentData) {
        toast.error(error || "Failed to get payment details.");
        setIsSubmitting(false);
        return;
      }

      // Dynamically create a form and submit to redirect to PayU
      const form = document.createElement("form");
      form.action = payuUrl;
      form.method = "POST";

      Object.keys(paymentData).forEach((key) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = paymentData[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit(); // Redirects the entire page to PayU
      // No need to remove form as page navigates away
      // document.body.removeChild(form);

    } catch (err) {
      toast.error(err.message || "Payment initiation failed. Please try again.");
      console.error("Payment initiation error:", err);
      setIsSubmitting(false);
    }
    // Do not set submitting false here, as the page redirects
  };

  // Use useCallback for the verification function to stabilize useEffect dependency
  const verifyPaymentOnServer = useCallback(async (transactionId) => {
    console.log(`Attempting to verify transaction ${transactionId} on server...`);
    try {
      const verifyResponse = await fetch(`${socketurl}/api/payu/verify-payment`, { // Call your new backend endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txnid: transactionId }),
      });

      const verifyData = await verifyResponse.json();
      console.log("Server verification response:", verifyData);

      if (verifyResponse.ok && verifyData.verified && verifyData.status === 'success') {
        toast.success(verifyData.message || `Payment for ${transactionId} verified successfully!`);
        if (onSuccess) {
          onSuccess(transactionId); // Call the main success handler ONLY after server confirmation
        }
      } else {
        // Handle failed or pending verification
        const errorMessage = verifyData.message || `Payment verification failed or status is ${verifyData.status}.`;
        toast.error(errorMessage);
        console.error("Verification Error/Failure:", verifyData);
        if (onError) {
          onError(errorMessage); // Call error handler if verification fails
        }
      }
    } catch (err) {
      console.error("Error calling verification API:", err);
      toast.error("Failed to verify payment status with server. Please contact support.");
      if (onError) {
        onError("Server verification call failed.");
      }
    } finally {
      // Optionally clear URL params here or after onSuccess/onError
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [onSuccess, onError]); // Dependencies for useCallback


  // --- UPDATED useEffect to handle redirect back from PayU ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("status"); // Status from PayU redirect
    const txnid = params.get("txnid");         // Transaction ID from PayU redirect
    const payuHash = params.get("hash");       // PayU might return a hash (optional check, but S2S is primary)
    const errorCode = params.get("error");      // PayU error code if status=failure
    const errorMessage = params.get("error_Message"); // PayU error message if status=failure

    console.log("Redirect Params:", { paymentStatus, txnid, payuHash, errorCode, errorMessage });

    if (txnid && (paymentStatus === "success" || paymentStatus === "failure")) { // Process only if we have txnid and a status
      // Clear params immediately to avoid reprocessing if component re-renders
      window.history.replaceState({}, document.title, window.location.pathname);

      if (paymentStatus === "success") {
        // **Don't assume success yet!** Trigger server-side verification.
        toast.info("Processing payment confirmation..."); // Inform user
        verifyPaymentOnServer(txnid); // Call the verification function
      } else if (paymentStatus === "failure") {
        // Handle explicit failure from PayU redirect
        const msg = errorMessage || `Payment failed (Code: ${errorCode || 'N/A'}).`;
        toast.error(`Payment Failed: ${msg}`);
        console.error("PayU Failure Redirect Details:", { txnid, errorCode, errorMessage });
        if (onError) {
          onError(msg);
        }
      }
    }
    // No 'else', only act if status and txnid params are present from PayU redirect
  }, [verifyPaymentOnServer]); // Add verifyPaymentOnServer as a dependency



  return (
    <div className="flex justify-center items-center rounded-3xl mt-6">
      {/* Card UI remains the same */}
      <div className="card w-full max-w-md rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-white">
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-t-xl text-white text-center">
          <Shield className="w-8 h-8 mb-2 mx-auto opacity-90" />
          <h2 className="text-xl font-semibold">Proceed to Secure Payment</h2>
          <p className="text-xs opacity-80 mt-1">Powered by PayU</p>
        </div>

        <div className="card-body space-y-4 p-6 text-gray-700">
          <div className="text-center border-b pb-4">
            <p className="text-sm text-gray-500 mb-1">Total Amount Payable</p>
            <div className="text-3xl font-bold text-gray-800">₹{numericAmount}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              100% Secure Transaction
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              All Payment Methods
            </div>
          </div>

          <button
            onClick={initiatePayment}
            disabled={isSubmitting}
            className="btn btn-primary w-full btn-lg mt-4 group rounded-xl" // DaisyUI primary button
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                Pay Securely
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center pt-2">
            You’ll be redirected to PayU's secure payment page.
          </p>
        </div>

        <div className="px-6 pb-4 border-t border-gray-100">
          <div className="flex justify-center gap-4 opacity-60 grayscale">
            <img src="/visa.svg" alt="Visa" className="h-4" />
            <img src="/mastercard.svg" alt="Mastercard" className="h-4" />
            <img src="/upi-ar21.svg" alt="UPI" className="h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayUPaymentGateway;