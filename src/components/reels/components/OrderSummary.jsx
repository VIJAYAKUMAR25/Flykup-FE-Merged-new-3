import { ArrowLeft } from 'lucide-react';

// Order Summary Component
export const OrderSummary = ({ product, quantity, selectedAddress, onPlaceOrder, onBack }) => {
  const subtotal = parseFloat(product.productPrice) * quantity;
  const shipping = subtotal > 999 ? 0 : 49;
  const tax = Math.round(subtotal * 0.18);
  const total = parseFloat((subtotal + shipping + tax).toFixed(2));

  product.total = total;

  return (
    <div className="min-h-screen max-h-screen p-7 bg-stone-900 text-white">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center mb-6 gap-2">
          <button className="btn btn-ghost rounded-full text-yellow-400" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="md:text-2xl text-xl font-bold text-yellow-400">Order Summary</h2>
        </div>

        <div className="bg-stone-800 p-6 rounded-xl shadow-lg space-y-6">
          {/* Product Info */}
          <div className="flex space-x-4">
            <img
              src={
                product.signedImages && product.signedImages[0]
                  ? product.signedImages[0]
                  : 'https://via.placeholder.com/150'
              }
              alt={product.name}
              className="w-20 h-20 object-cover rounded"
            />
            <div>
              <h3 className="font-semibold text-yellow-300">{product.name}</h3>
              <p className="text-sm text-stone-400">Quantity: {quantity}</p>
              <p className="text-sm text-stone-300">Unit Price: ₹{product.productPrice}</p>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-3 border-t border-stone-700 pt-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-stone-700 pt-3 text-yellow-300">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Address */}
          <div className="border-t border-stone-700 pt-3">
            <h3 className="font-medium text-yellow-400 mb-2">Delivery Address</h3>
            <div className="text-sm space-y-1 text-stone-300">
              <p>{selectedAddress.name}</p>
              <p>{selectedAddress.address}</p>
              <p>
                {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
              </p>
              <p>Phone: {selectedAddress.mobile}</p>
            </div>
          </div>
        </div>

        {/* Pay Now Button */}
        <button
          className="w-full mt-6 py-3 rounded-full bg-yellow-400 hover:bg-amber-500 text-black font-semibold transition-all"
          onClick={() =>
            onPlaceOrder({
              product,
              quantity,
              address: selectedAddress,
              amount: total,
            })
          }
        >
          Pay Now ₹{total.toFixed(2)}
        </button>
      </div>
    </div>
  );
};
