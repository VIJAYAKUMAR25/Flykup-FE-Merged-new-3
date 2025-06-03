import React, { useEffect } from "react";
import { Shield, CreditCard, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import { socketurl } from "../../../config";

const PayUPaymentGateway = ({ amount, selectedAddress, product, quantity, customer, onSuccess }) => {
  const numericAmount = parseFloat(amount).toFixed(2);

  const initiatePayment = async () => {
    try {
      const response = await fetch(`${socketurl}/api/payu/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          selectedAddress,
          products: [{ product, quantity }],
          customer,
        }),
      });

      const { payuUrl, paymentData, error, serverCalculatedAmount } = await response.json();

      if (error) {
        toast.error(error);
        console.error("Server calculated amount:", serverCalculatedAmount);
        return;
      }

      // Dynamically create and submit form to PayU
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
      form.submit();
    } catch (err) {
      toast.error("Failed to initiate payment");
      console.error("Payment initiation error:", err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("status");
    if (paymentStatus === "success") {
      toast.success("Payment successful!");
      if (onSuccess) onSuccess();
    } else if (paymentStatus === "failure") {
      toast.error("Payment failed or canceled.");
    }
  }, []);

  return (
    <div className="flex justify-center items-center max-h-screen bg-stone-900 rounded-3xl mt-6">
      <div className="card w-full max-w-md rounded-2xl overflow-hidden bg-stone-900 text-white">
        <div className="px-6 py-5 rounded-t-2xl text-center">
          <Shield className="w-6 h-6 mb-1 text-yellow-400 mx-auto" />
          <h2 className="text-lg font-semibold text-yellow-400">Secure Payment via PayU</h2>
        </div>

        <div className="card-body space-y-6">
          <div className="bg-stone-700 rounded-xl p-6 text-center shadow">
            <p className="text-sm text-yellow-200 mb-2">Amount to Pay</p>
            <div className="text-3xl font-bold text-yellow-400">₹{numericAmount}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-yellow-300">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Secure Gateway
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Multiple Options
            </div>
          </div>

          <button
            onClick={initiatePayment}
            className="w-full py-3 rounded-full bg-yellow-400 text-black font-bold flex items-center justify-center gap-2 transition-all hover:scale-105"
          >
            Pay Now <ArrowRight />
          </button>

          <p className="text-xs text-stone-400 text-center">
            By proceeding, you agree to our Terms & Conditions.
          </p>
        </div>

        <div className="px-6 pb-5 border-t border-stone-700">
          <div className="flex justify-center gap-3 opacity-90">
            <img src="/visa.svg" alt="Visa" className="h-5" />
            <img src="/mastercard.svg" alt="Mastercard" className="h-5" />
            <img src="/upi-ar21.svg" alt="UPI" className="h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayUPaymentGateway;
