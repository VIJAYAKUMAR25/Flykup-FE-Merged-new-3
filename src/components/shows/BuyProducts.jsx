// import { IndianRupee } from 'lucide-react';
// import { useState } from 'react';
// import io from 'socket.io-client';
// import CashfreePaymentGateway from './CashfreePaymentGateway';
// import PaymentSuccess from './PaymentSuccess';
// import PaymentFailed from './PaymentFailed';
// import { AddressSelection } from './AddressSelection';
// import { OrderSummary } from './OrderSummary'; // Import OrderSummary component
// // import { SOCKET_URL } from '../api/apiDetails';
// import { useAuth } from '../../context/AuthContext';
// import { useCart } from '../../context/CartContext';
// import { toast } from 'react-toastify';
// import { useAlert } from '../Alerts/useAlert';
// import { socketurl } from '../../../config';

// const socket = io.connect(socketurl, {
//   transports: ['websocket'], // Force WebSocket transport
// });

// const BuyProducts = ({ showId, streamId, product, signedUrls, fetchShow, currentAuction }) => {
//   const { user } = useAuth();
//   const { cart, addProduct } = useCart()
//   const [showPayment, setShowPayment] = useState(false);
//   const [paymentAmount, setPaymentAmount] = useState(0);
//   const [paymentStatus, setPaymentStatus] = useState(null);
//   const [paymentDetails, setPaymentDetails] = useState(null);
//   const [paymentError, setPaymentError] = useState(null);
//   const [selectedAddress, setSelectedAddress] = useState(null);
//   const [checkoutStep, setCheckoutStep] = useState(null);
//   const [selectedQuantity, setSelectedQuantity] = useState(1);
//   const { positive, negative } = useAlert()


//   const handleBuy = () => {
//     const totalAmount = product?.productPrice * selectedQuantity;
//     setPaymentAmount(totalAmount);
//     setShowPayment(true);
//     setCheckoutStep('address');
//     setPaymentStatus(null);
//     setPaymentError(null);
//     setPaymentDetails(null);
//   };

//   const handleAddToCart = () => {
//     addProduct(product.productId, selectedQuantity)
//     positive("Added to cart!");
//   }

//   const handlePaymentSuccess = (paymentDetails) => {
//     setPaymentDetails(paymentDetails);
//     setPaymentStatus('success');
//   };

//   const handlePaymentCancel = () => {
//     setPaymentError("Payment cancelled by user");
//     setPaymentStatus('failure');
//   };

//   const handlePaymentError = (error) => {
//     setPaymentError(error);
//     setPaymentStatus('failure');
//   };

//   const handleClosePaymentModal = () => {
//     setShowPayment(false);
//     setCheckoutStep(null);
//     setSelectedAddress(null);
//     setPaymentStatus(null);
//     setPaymentError(null);
//     setPaymentDetails(null);
//   };

//   const handleRetryPayment = () => {
//     setPaymentStatus(null);
//     setPaymentError(null);
//     setPaymentDetails(null);
//   };

//   const handleNumericAmnt = (amount) => {
//     const numericAmount = parseInt(amount, 10);
//     return numericAmount.toLocaleString('en-IN');
//   };

//   return (
//     <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 p-6 rounded-3xl shadow-2xl max-w-3xl mx-auto mt-10 text-white">
//       <div className="flex flex-col md:flex-row gap-6">
//         {/* Product Image + Quantity */}
//         <div className="relative w-full md:w-1/3">
//           <img
//             src={signedUrls[product.productId._id] || "/placeholder.svg"}
//             className="w-full md:h-60 h-36 object-cover rounded-xl shadow-md"
//             alt={product.productId.title}
//           />
//           {/* Quantity Control */}
//           <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 backdrop-blur-md px-4 py-1 rounded-full flex items-center gap-3 text-white font-semibold text-sm shadow-lg">
//             <button
//               onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
//               className="hover:text-red-400 transition"
//             >
//               -
//             </button>
//             <span className="min-w-[20px] text-center">{selectedQuantity}</span>
//             <button
//               onClick={() => setSelectedQuantity(selectedQuantity + 1)}
//               className="hover:text-green-400 transition"
//             >
//               +
//             </button>
//           </div>
//         </div>

//         {/* Product Info */}
//         <div className="w-full md:w-2/3 flex flex-col justify-between space-y-6">
//           <div className="space-y-3">
//             <h2 className="md:text-2xl text-md font-bold text-white">{product.productId.title}</h2>
//             <p className="md:text-sm text-xs text-stone-300 leading-relaxed">
//               {product.productId.description}
//             </p>
//           </div>

//           {/* Price and Actions */}
//           <div className="flex flex-col justify-between items-end gap-4">
//             {/* Price */}
//             <span className="md:text-xl text-md text-right font-semibold flex items-center gap-1 text-green-400">
//               <IndianRupee size={20} />
//               {handleNumericAmnt(product?.productPrice * selectedQuantity)}
//             </span>

//             {/* Buttons */}
//             <div className="flex flex-col gap-3 w-full">
//               <button
//                 onClick={handleBuy}
//                 className="w-full px-6 py-2 bg-yellow-400 hover:bg-yellow-600 text-black rounded-full font-semibold shadow transition-all"
//               >
//                 Buy Now
//               </button>
//               <button
//                 onClick={handleAddToCart}
//                 className="w-full  px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-black rounded-full font-semibold shadow transition-all"
//               >
//                 Add to Cart
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>


//       {showPayment && (
//         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
//           <div className="bg-stone-900 w-full max-w-lg rounded-2xl relative">
//             <button
//               onClick={handleClosePaymentModal}
//               className="absolute top-4 right-4 text-white hover:text-red-400"
//             >
//               ✕
//             </button>

//             {checkoutStep === 'address' && (
//               <AddressSelection
//                 selectedAddress={selectedAddress}
//                 onSelectAddress={setSelectedAddress}
//                 onNext={() => {
//                   if (!selectedAddress) {
//                     alert("Please select or add an address before proceeding.");
//                     return;
//                   }
//                   // Move to Order Summary step instead of directly to payment
//                   setCheckoutStep('orderSummary');
//                 }}
//                 onBack={handleClosePaymentModal}
//               />
//             )}

//             {checkoutStep === 'orderSummary' && (
//               <OrderSummary
//                 product={{
//                   ...product.productId,
//                   name: product.productId.title,
//                   signedImages: [signedUrls[product.productId._id]],
//                   productPrice: product.productPrice // Pass the product price properly
//                 }}
//                 quantity={selectedQuantity}
//                 selectedAddress={selectedAddress}
//                 onPlaceOrder={(orderDetails) => {
//                   // Update the payment amount if needed based on order summary calculation
//                   setPaymentAmount(orderDetails.amount);
//                   // Proceed to the payment gateway step
//                   setCheckoutStep('payment');
//                 }}
//                 onBack={() => setCheckoutStep('address')}
//               />
//             )}

//             {checkoutStep === 'payment' && (
//               <>
//                 {paymentStatus === null && (
//                   <CashfreePaymentGateway
//                     amount={paymentAmount}
//                     quantity={selectedQuantity}
//                     selectedAddress={selectedAddress}
//                     product={product.productId}
//                     customer={user}
//                     onSuccess={handlePaymentSuccess}
//                     onCancel={handlePaymentCancel}
//                     onError={handlePaymentError}
//                   />
//                 )}

//                 {paymentStatus === 'success' && (
//                   <PaymentSuccess
//                     product={product.productId}
//                     amount={paymentAmount}
//                     isOrderPlaced={true}
//                     onClose={handleClosePaymentModal}
//                   />
//                 )}

//                 {paymentStatus === 'failure' && (
//                   <PaymentFailed
//                     error={paymentError}
//                     amount={paymentAmount}
//                     onRetry={handleRetryPayment}
//                     onClose={handleClosePaymentModal}
//                   />
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default BuyProducts;


import { IndianRupee } from 'lucide-react';
import { useState } from 'react';
import io from 'socket.io-client';
import CashfreePaymentGateway from './CashfreePaymentGateway';
import PaymentSuccess from './PaymentSuccess';
import PaymentFailed from './PaymentFailed';
import { AddressSelection } from './AddressSelection';
import { OrderSummary } from './OrderSummary';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-toastify';
import { useAlert } from '../Alerts/useAlert';
import { socketurl } from '../../../config';

const socket = io.connect(socketurl, {
  transports: ['websocket'],
});

const BuyProducts = ({ showId, streamId, product, signedUrls, fetchShow, currentAuction }) => {
  const { user } = useAuth();
  
  // Add error handling for useCart
  const cartContext = useCart();
  if (!cartContext) {
    console.error('useCart must be used within a CartProvider');
    // Provide fallback values
    var cart = [];
    var addProduct = () => {
      console.warn('Cart functionality not available - CartProvider missing');
      toast.error('Cart functionality not available');
    };
  } else {
    var { cart, addProduct } = cartContext;
  }

  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const { positive, negative } = useAlert();

  const handleBuy = () => {
    const totalAmount = product?.productPrice * selectedQuantity;
    setPaymentAmount(totalAmount);
    setShowPayment(true);
    setCheckoutStep('address');
    setPaymentStatus(null);
    setPaymentError(null);
    setPaymentDetails(null);
  };

  const handleAddToCart = () => {
    try {
      addProduct(product.productId, selectedQuantity);
      positive("Added to cart!");
    } catch (error) {
      console.error('Error adding to cart:', error);
      negative("Failed to add to cart");
    }
  };

  const handlePaymentSuccess = (paymentDetails) => {
    setPaymentDetails(paymentDetails);
    setPaymentStatus('success');
  };

  const handlePaymentCancel = () => {
    setPaymentError("Payment cancelled by user");
    setPaymentStatus('failure');
  };

  const handlePaymentError = (error) => {
    setPaymentError(error);
    setPaymentStatus('failure');
  };

  const handleClosePaymentModal = () => {
    setShowPayment(false);
    setCheckoutStep(null);
    setSelectedAddress(null);
    setPaymentStatus(null);
    setPaymentError(null);
    setPaymentDetails(null);
  };

  const handleRetryPayment = () => {
    setPaymentStatus(null);
    setPaymentError(null);
    setPaymentDetails(null);
  };

  const handleNumericAmnt = (amount) => {
    const numericAmount = parseInt(amount, 10);
    return numericAmount.toLocaleString('en-IN');
  };

  return (
    <div className="mx-auto text-white">
      <div className="w-full max-w-[320px] mx-auto bg-stone-900 rounded-lg shadow-sm border border-stone-800 overflow-hidden">
        <div className="flex h-28 rounded-lg overflow-hidden shadow-lg">
          {/* Product Image - Left Side */}
          <div className="relative w-28 h-28 flex-shrink-0">
            <img
              src={signedUrls[product.productId._id] || "https://media.istockphoto.com/id/1495664030/photo/sneakers-on-dark-gray-concrete-background-texture-of-the-old-dark-stone-or-broken-brick-the.jpg?s=612x612&w=0&k=20&c=o2yWDPIHm6pTUw5MKhGQ0X83cfGM2RUuO7RGCCrrsU8="}
              className="w-full h-full object-cover"
              alt={product.productId.title}
            />
          </div>
          
          {/* Product Info - Right Side */}
          <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
            {/* Top Section - Title and Description */}
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-white truncate">
                {product.productId.title}
              </h2>
              <p className="text-xs text-gray-300 leading-tight line-clamp-2">
                {product.productId.description}
              </p>
            </div>
                          
            {/* Bottom Section - Price and Action */}
            <div className="flex items-center justify-between mt-2">
              {/* Price */}
              <div className="flex items-center gap-1">
                <IndianRupee size={14} className="text-green-400" />
                <span className="text-sm font-bold text-green-400">
                  {handleNumericAmnt(product?.productPrice * selectedQuantity)}
                </span>
              </div>
              
              {/* Quantity Control - Uncomment if needed */}
              {/* <div className="bg-black bg-opacity-70 backdrop-blur-sm px-1 py-1 rounded-full flex items-center gap-1.5 text-white font-semibold text-[10px]">
                <button
                  onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                  className="hover:text-red-400 transition text-[10px] w-4 h-4 flex items-center justify-center"
                >
                  -
                </button>
                <span className="min-w-[10px] text-center text-[10px]">{selectedQuantity}</span>
                <button
                  onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                  className="hover:text-green-400 transition text-[10px] w-4 h-4 flex items-center justify-center"
                >
                  +
                </button>
              </div> */}
              
              {/* Buy Button */}
              <button 
                onClick={handleBuy}
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-2 py-1 rounded-full text-[10px] font-semibold transition-colors duration-200 shadow-sm"
              >
                Buy Now
              </button>
              
              {/* Add to Cart Button - Uncomment if needed */}
              {/* <button
                onClick={handleAddToCart}
                className="w-full px-3 py-[5px] sm:py-1.5 bg-gradient-to-r from-emerald-500 to-green-500 text-black rounded-full text-[10px] sm:text-xs font-semibold shadow-sm"
              >
                Add to Cart
              </button> */}
            </div>
          </div>
        </div>
      </div>

      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-stone-900 w-full max-w-lg rounded-2xl relative">
            <button
              onClick={handleClosePaymentModal}
              className="absolute top-4 right-4 text-white hover:text-red-400"
            >
              ✕
            </button>

            {checkoutStep === 'address' && (
              <AddressSelection
                selectedAddress={selectedAddress}
                onSelectAddress={setSelectedAddress}
                onNext={() => {
                  if (!selectedAddress) {
                    alert("Please select or add an address before proceeding.");
                    return;
                  }
                  setCheckoutStep('orderSummary');
                }}
                onBack={handleClosePaymentModal}
              />
            )}

            {checkoutStep === 'orderSummary' && (
              <OrderSummary
                product={{
                  ...product.productId,
                  name: product.productId.title,
                  signedImages: [signedUrls[product.productId._id]],
                  productPrice: product.productPrice
                }}
                quantity={selectedQuantity}
                selectedAddress={selectedAddress}
                onPlaceOrder={(orderDetails) => {
                  setPaymentAmount(orderDetails.amount);
                  setCheckoutStep('payment');
                }}
                onBack={() => setCheckoutStep('address')}
              />
            )}

            {checkoutStep === 'payment' && (
              <>
                {paymentStatus === null && (
                  <CashfreePaymentGateway
                    amount={paymentAmount}
                    quantity={selectedQuantity}
                    selectedAddress={selectedAddress}
                    product={product.productId}
                    customer={user}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                    onError={handlePaymentError}
                  />
                )}

                {paymentStatus === 'success' && (
                  <PaymentSuccess
                    product={product.productId}
                    amount={paymentAmount}
                    isOrderPlaced={true}
                    onClose={handleClosePaymentModal}
                  />
                )}

                {paymentStatus === 'failure' && (
                  <PaymentFailed
                    error={paymentError}
                    amount={paymentAmount}
                    onRetry={handleRetryPayment}
                    onClose={handleClosePaymentModal}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyProducts;