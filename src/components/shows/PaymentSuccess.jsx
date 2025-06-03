import React from 'react';
import ConfettiExplosion from 'react-confetti-explosion';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess = ({ product, amount, isOrderPlaced, onClose }) => {

    const navigate = useNavigate()
    return (
        <div className=" flex items-center justify-center px-4 relative">
            {isOrderPlaced && (
                <div className="absolute z-60 top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                    <ConfettiExplosion
                        force={0.7}
                        duration={5000}
                        particleCount={500}
                        width={1600}
                    />
                </div>
            )}

            <div className="card max-w-xl w-full  bg-stone-900 text-white rounded-2xl z-10">
                <div className="card-body p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:text-red-400"
                    >✕</button>
                    {/* Header */}
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="rounded-full bg-green-600/20 p-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-green-400">Payment Successful!</h2>
                        <p className="mt-2 text-stone-300">Thank you for your purchase. Your order has been confirmed.</p>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-stone-700 mt-6 p-5 rounded-xl shadow-inner">
                        <h3 className="font-semibold text-yellow-400 text-lg mb-4">Order Summary</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span>Product</span>
                                <span className="font-medium">{product?.name || "Product Name"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-300">Order ID</span>
                                <span className="font-medium">{product?.id || '#' + Math.random().toString(36).substr(2, 9)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-300">Date</span>
                                <span className="font-medium">{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="border-t border-stone-600 my-3"></div>
                            <div className="flex justify-between text-lg font-bold">
                                <span className="text-stone-300">Total</span>
                                <span className="text-yellow-400">₹{amount?.toLocaleString("en-IN")}</span>
                            </div>
                        </div>
                    </div>

                    {/* Next Steps */}
                    <div className="mt-6 space-y-4">
                        <h3 className="font-semibold text-yellow-400 text-lg">What’s Next?</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-3">
                                <div className="badge bg-yellow-400 text-black font-bold rounded-full px-2 py-1">1</div>
                                <p>You will receive an email confirmation with your order details shortly.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="badge bg-yellow-400 text-black font-bold rounded-full px-2 py-1">2</div>
                                <p>Track your order status in your account dashboard.</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-col items-center justify-center sm:flex-row gap-3">
                        <button
                            className="border-0 w-full sm:w-auto btn bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full"
                            onClick={() => window.open('/profile/orders', '_blank')}
                        >
                            View Order Details
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto btn border border-yellow-400 text-yellow-400 hover:bg-yellow-500 hover:text-black font-semibold rounded-full"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
