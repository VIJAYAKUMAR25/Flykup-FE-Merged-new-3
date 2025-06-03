import React from 'react';

const PaymentFailed = ({ error, amount, onRetry, onClose }) => {
    const errorMessage =
        error && typeof error === 'object'
            ? error.message || JSON.stringify(error)
            : error;

    return (
        <div className= "flex items-center justify-center">
            <div className="card max-w-xl w-full bg-stone-800 text-white rounded-2xl shadow-2xl">
                <div className="card-body p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:text-red-400"
                    >✕</button>
                    {/* Header */}
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="rounded-full bg-red-600/20 p-4">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-12 h-12 text-red-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-red-400">Payment Failed!</h2>
                        <p className="mt-2 text-stone-300">
                            We couldn't process your payment. Please try again.
                        </p>
                    </div>

                    <div className="space-y-6 mt-6">
                        {/* Transaction Details */}
                        <div className="bg-stone-700 p-5 rounded-xl shadow-inner">
                            <h3 className="font-semibold text-yellow-400 text-lg mb-4">Transaction Details</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span>Status</span>
                                    <span className="font-medium text-red-400">Failed</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Amount</span>
                                    <span className="font-medium">₹{amount?.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Date</span>
                                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                                </div>
                                <div className="border-t border-stone-600 my-2"></div>
                                <div className="bg-red-600/10 p-3 rounded-lg">
                                    <p className="text-red-400 text-sm font-medium">
                                        {errorMessage || "Transaction was declined. Please check your payment details and try again."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Troubleshooting */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-yellow-400 text-lg">Troubleshooting Steps</h3>
                            <div className="space-y-2 text-sm text-stone-300">
                                <div className="flex items-start gap-3">
                                    <div className="badge bg-red-500 text-white font-bold px-2 py-1 rounded-full">1</div>
                                    <p>Verify that your card has sufficient funds and isn't expired.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="badge bg-red-500 text-white font-bold px-2 py-1 rounded-full">2</div>
                                    <p>Check if your card allows online or international transactions.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="badge bg-red-500 text-white font-bold px-2 py-1 rounded-full">3</div>
                                    <p>Ensure all payment details were entered correctly.</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-center justify-center sm:flex-row gap-3">
                            <button
                                onClick={onRetry}
                                className="w-full sm:w-auto btn bg-red-500 hover:bg-red-600 border-0 text-white font-semibold rounded-full"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full sm:w-auto btn border border-yellow-400 text-yellow-400 hover:bg-yellow-500 hover:text-black font-semibold rounded-full"
                            >
                                Contact Support
                            </button>
                        </div>

                        {/* Footer Note */}
                        <p className="text-center text-sm text-stone-400 mt-2">
                            Need help? Our support team is available 24/7.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailed;
