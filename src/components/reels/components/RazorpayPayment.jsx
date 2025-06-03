import React from "react";
import { CreditCard, Shield, ArrowRight } from "lucide-react";
import ConfettiExplosion from "react-confetti-explosion";

const RazorpayPayment = ({ amount, onSuccess, onCancel, onError, isOrderPlaced }) => {
  // const numericAmount = Number(amount.replace("Rs.", "").trim());

  const numericAmount = parseInt(amount, 10);
  console.log(numericAmount);
  
  const handlePayment = async () => {
    if (!amount || isNaN(amount)) {
      alert("Please enter a valid amount");
      return;
    }
  
    if (!window.Razorpay) {
      alert("Razorpay SDK failed to load. Please check your internet connection.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:6969/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: numericAmount.toLocaleString('en-IN') }),
      });
  
      const { orderId } = await response.json();
  
      const options = {
        key: "rzp_test_9tcqU5ebtrZSgC", // Replace with your Razorpay key
        amount: numericAmount.toLocaleString('en-IN') * 100, // Convert to paise
        currency: "INR",
        name: "Your Company Name",
        description: "Test Transaction",
        image: "https://your-logo-url.com/logo.png", // Optional logo
        order_id: orderId, // Order ID from backend
        handler: function (response) {
          alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
          if (onSuccess) onSuccess(response);
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        notes: {
          address: "Your Company Address",
        },
        theme: {
          color: "#3399cc",
        },
      };
  
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        alert(
          `Payment failed! Error: ${response.error.code} | ${response.error.description}`
        );
        if (onError) onError(response);
      });
  
      rzp.open();
    } catch (error) {
      alert("Error initiating payment. Please try again.");
      if (onError) onError(error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-base-100 to-base-200 mt-6">
      <div className="card w-full max-w-md bg-slate-200 shadow-2xl rounded-2xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-info/15 to-info/30 p-6 text-white">
          <h2 className="text-2xl font-bold text-center mb-4">Secure Payment</h2>
          <div className="flex justify-center items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm opacity-90">Protected by Razorpay</span>
          </div>
        </div>

        <div className="card-body p-6">
          {/* Amount Display */}
          <div className="bg-base-100 rounded-xl p-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-base-content/60 mb-2">Amount to Pay</p>
              <div className="flex justify-center items-center gap-2">
                <span className="text-4xl font-bold text-primary">₹{numericAmount.toLocaleString('en-IN')}</span>
                <span className="text-base-content/60">INR</span>
              </div>
            </div>
          </div>

          {/* Payment Features */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <Shield className="w-4 h-4" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <CreditCard className="w-4 h-4" />
              <span>Multiple Options</span>
            </div>
          </div>

          {/* Pay Button */}
          <button 
            className="btn btn-primary w-full rounded-full text-lg py-3 hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
            onClick={handlePayment}
          >
            <span>Pay Securely</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>

          {/* Footer Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-base-content/60">
              By proceeding, you agree to our Terms and Conditions
            </p>
          </div>
        </div>

        {/* Payment Methods Footer */}
        <div className="px-6 pb-6">
          <div className="flex justify-center items-center gap-3 opacity-50">
            <img src="/api/placeholder/32/20" alt="Visa" className="h-5 object-contain" />
            <img src="/api/placeholder/32/20" alt="Mastercard" className="h-5 object-contain" />
            <img src="/api/placeholder/32/20" alt="UPI" className="h-5 object-contain" />
          </div>
        </div>

         {isOrderPlaced && <ConfettiExplosion
                force={0.7}
                duration={5000}
                particleCount={500}
                width={1600}
            />}
      </div>
    </div>
  );
};

export default RazorpayPayment;