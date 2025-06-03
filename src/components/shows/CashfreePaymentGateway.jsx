import React, { useEffect, useState } from "react";
import { CreditCard, Shield, ArrowRight } from "lucide-react";
import ConfettiExplosion from "react-confetti-explosion";
import { toast } from "react-toastify";
import { RiVisaFill } from "react-icons/ri";
import config from "../../components/reels/api/config";
import { backendurl, socketurl } from "../../../config";
import { useAlert } from "../Alerts/useAlert";

const CashfreePaymentGateway = ({ amount, onSuccess, onCancel, onError, isOrderPlaced, selectedAddress, product, quantity = 1, customer }) => {
    const numericAmount = parseInt(amount, 10);
    const [isSDKLoaded, setIsSDKLoaded] = useState(false); // Track SDK loading status
    const { positive, negative } = useAlert()

    console.log(selectedAddress, product, customer);

    // Load Cashfree SDK dynamically
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
        script.async = true;

        // Add a load event listener to track when the SDK is fully loaded
        script.onload = () => {
            console.log("Cashfree SDK loaded successfully");
            setIsSDKLoaded(true); // Set SDK loaded status to true
        };

        script.onerror = () => {
            console.error("Failed to load Cashfree SDK");
            setIsSDKLoaded(false); // Set SDK loaded status to false
        };

        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handlePayment = async () => {
        if (!amount || isNaN(amount)) {
            alert("Please enter a valid amount");
            return;
        }

        // Check if the SDK is loaded
        if (!isSDKLoaded) {
            alert("Cashfree SDK is still loading. Please try again in a moment.");
            return;
        }

        try {
            // **Step 0: Create Order in Backend**
            const createOrderResponse = await fetch(`${socketurl}/api/order/create-order`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ amount: numericAmount, selectedAddress, products: [{ product: product, quantity }], customer }),
            });

            const createOrderData = await createOrderResponse.json();

            if (!createOrderResponse.ok) {
                console.error("Error creating order:", createOrderData.error);
                // toast.error(createOrderData.error || "Failed to create order. Please try again.");
                negative(createOrderData.error || "Failed to create order. Please try again.");
                if (onError) onError(createOrderData.error);
                return;
            }

            const { order } = createOrderData;
            console.log("Order created in BE", order);


            // Step 1: Create order (get payment session and orderId)
            const createResponse = await fetch(`${socketurl}/api/cashfree/create-order`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ amount: numericAmount, selectedAddress, products: [{ product: product, quantity }], customer, backendOrderId: order._id }),
            });

            const { paymentSessionId, cashfree_orderId } = await createResponse.json();

            const checkoutOptions = {
                paymentSessionId,
                cashfree_orderId,
                mode: "TEST",
                redirectTarget: "_modal", // Open payment UI in a modal
            };

            const cashfree = new window.Cashfree();

            // Step 2: Trigger Cashfree checkout modal
            const result = await cashfree.checkout(checkoutOptions);

            if (result.error) {
                console.error("Payment error:", result.error);
                toast.error("Payment error occurred. Please try again.");
                if (onError) onError(result.error);
                return;
            }

            if (result.paymentDetails) {
                console.log("Payment details received:", result.paymentDetails);

                // **Step 3: Verify Order** ✅
                const verifyResponse = await fetch(`${socketurl}/api/cashfree/verify-order`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ cashfree_orderId }),
                });

                const { orderStatus, paymentLink } = await verifyResponse.json();

                if (orderStatus === "PAID") {
                    console.log("Payment successfully verified!");
                    // **Step 4: Update Backend Order Status to PLACED**
                    const updateOrderResponse = await fetch(`${socketurl}/api/order/update-placed`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ orderId: order._id, status: "PLACED", paymentStatus: "PAID" }),
                    });
                    toast.success("Payment successful!");

                    // Trigger success handler
                    if (onSuccess) onSuccess(result.paymentDetails);

                    // Continue with your order processing logic here
                } else if (orderStatus === "PENDING") {
                    toast.info("Payment is pending. We will confirm shortly.");
                    console.warn("Payment pending:", paymentLink);
                } else {
                    toast.error("Payment failed or incomplete. Please retry.");
                    console.error("Payment verification failed:", orderStatus);
                }
            } else if (result.redirect) {
                console.log("Payment redirection occurred");
                toast.info("Payment redirected. Check status later.");
            }
        } catch (error) {
            console.error("Error initiating/verifying payment:", error);
            toast.error("Error initiating payment. Please try again.");
            if (onError) onError(error);
        }
    };

    return (
        <div className="flex justify-center items-center max-h-screen bg-stone-900 rounded-3xl mt-6">
            <div className="card w-full max-w-md rounded-2xl overflow-hidden bg-stone-900 text-white">
                {/* Header Section */}
                <div className="px-6 py-5 rounded-t-2xl">
                    <div className="flex flex-col items-center justify-center text-yellow-400">
                        <Shield className="w-6 h-6 mb-1" />
                        <h2 className="text-lg font-semibold">Secure Payment</h2>
                        <span className="text-xs text-yellow-300">Protected by Cashfree</span>
                    </div>
                </div>

                {/* Card Body */}
                <div className="card-body space-y-6">
                    {/* Amount Block */}
                    <div className="bg-stone-700 rounded-xl p-6 text-center shadow">
                        <p className="text-sm text-yellow-200 mb-2">Amount to Pay</p>
                        <div className="flex justify-center items-baseline gap-2">
                            <span className="text-3xl font-bold text-yellow-400">
                                ₹{numericAmount.toLocaleString("en-IN")}
                            </span>
                            <span className="text-sm text-stone-300">INR</span>
                        </div>
                    </div>

                    {/* Payment Features */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-yellow-300">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>Secure Gateway</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            <span>All Methods</span>
                        </div>
                    </div>

                    {/* Pay Button */}
                    <button
                        onClick={handlePayment}
                        disabled={!isSDKLoaded}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-bold shadow-xl transition-all text-black
                ${isSDKLoaded
                                ? "bg-yellow-400 hover:bg-yellow-600 hover:scale-[1.02]"
                                : "bg-gray-400 cursor-not-allowed"
                            }`}
                    >
                        Pay Securely
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    {/* Terms Info */}
                    <p className="text-xs text-stone-400 text-center mt-2">
                        By proceeding, you agree to our Terms & Conditions.
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 mt-2 border-t border-stone-700">
                    <div className="flex justify-center items-center gap-3 opacity-90">
                        <img src="/visa.svg" alt="Visa" className="h-5 object-contain" />
                        <img src="/mastercard.svg" alt="Mastercard" className="h-5 object-contain" />
                        <img src="/upi-ar21.svg" alt="UPI" className="h-5 object-contain" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashfreePaymentGateway;