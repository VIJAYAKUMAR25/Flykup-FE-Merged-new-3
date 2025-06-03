import React from "react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  MinusCircle,
  PlusCircle,
  IndianRupee,
  XCircle,
  Package,
  Weight,
  Trash2
} from "lucide-react";

const MyCart = ({ onClose }) => {
  const { cart, updateProduct, removeProduct } = useCart();
  const navigate = useNavigate();

  const handleIncrement = (productId, currentQuantity) => {
    updateProduct(productId, currentQuantity + 1);
  };

  const handleDecrement = (productId, currentQuantity) => {
    if (currentQuantity > 1) {
      updateProduct(productId, currentQuantity - 1);
    } else {
      removeProduct(productId);
    }
  };

  const handleCheckout = () => {
    navigate("/profile/checkout", {
      state: { products: cart.products, isFromMyCart: true },
    });
    onClose();
  };

  const handleProductView = (id) => {
    window.open(`/profile/product/${id}`, "_blank");
  };

  if (!cart || !cart.products || cart.products.length === 0) {
    return (
      <div className=" text-center p-10 rounded-xl shadow-md">
        <ShoppingBag size={48} className="mx-auto text-stone-400 mb-4" />
        <h2 className="text-xl font-semibold text-white">Your Cart is Empty</h2>
        <p className="text-sm text-stone-400 mt-2">Start adding your favorite products!</p>
      </div>
    );
  }

  const totalAmount = cart.products.reduce(
    (acc, item) => acc + (item.product?.productPrice * item.quantity || 0),
    0
  );

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="w-full px-4 py-2 rounded-2xl shadow-xl max-h-[60vh] overflow-y-auto custom-scrollbar">
      <div className="space-y-6">
        {cart.products.map((item, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center p-4 bg-gradient-to-r from-[#2A2A2A] via-[#1A1A1A] to-[#0F0F0F] border border-stone-700 rounded-2xl shadow hover:shadow-xl transition-all group cursor-pointer"
            onClick={() => handleProductView(item.product._id)}
          >
            {/* Image */}
            <div className="w-24 h-24 bg-stone-700 rounded-xl overflow-hidden flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
              {item.product?.images?.[0] ? (
                <img
                  src={item.product.images[0]}
                  alt={item.product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400">
                  <Package size={28} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-white w-full sm:w-auto flex flex-col">
              <h3 className="text-lg font-semibold break-words whitespace-normal mb-1 flex items-center gap-2 w-full">
                <Package size={18} /> {item.product?.title}
              </h3>


              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400">
                <span className="bg-stone-800 px-2 py-1 rounded-full flex items-center gap-1">
                  <PlusCircle size={12} /> Qty: {item.quantity}
                </span>
                {item.product?.weight && (
                  <span className="flex items-center gap-1">
                    <Weight size={12} /> {item.product.weight}
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center gap-1 text-lg text-green-400 font-bold">
                <IndianRupee size={18} />
                {(item.product.productPrice * item.quantity).toLocaleString("en-IN")}
              </div>

              {item.product.MRP > item.product.productPrice && (
                <p className="text-xs text-stone-500 line-through mt-1">
                  MRP: ₹{(item.product.MRP * item.quantity).toLocaleString("en-IN")}
                </p>
              )}
            </div>

            {/* Quantity Controls */}
            <div
              className="flex items-center justify-center gap-3 mt-4 sm:mt-0 sm:ml-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleDecrement(item.product._id, item.quantity)}
                className="p-2 rounded-full bg-red-200 hover:bg-red-300 text-red-700 transition"
              >
                <MinusCircle size={20} />
              </button>
              <span className="text-base font-semibold text-white">{item.quantity}</span>
              <button
                onClick={() => handleIncrement(item.product._id, item.quantity)}
                className="p-2 rounded-full bg-green-200 hover:bg-green-300 text-green-700 transition"
              >
                <PlusCircle size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Total Section */}
      <div className="mt-10 bg-gradient-to-r from-[#2A2A2A] via-[#1A1A1A] to-[#0F0F0F] border border-stone-600 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center shadow-md">
        <div className="text-lg font-semibold text-white mb-2 sm:mb-0">Total</div>
        <div className="flex items-center gap-1 text-2xl font-bold text-green-400">
          <IndianRupee size={20} />
          {totalAmount.toLocaleString("en-IN")}
        </div>
      </div>

      <p className="text-xs text-stone-400 mt-2 text-right">
        * Delivery charges not included
      </p>

      {/* Checkout */}
      <div className="mt-6 text-right">
        <button
          onClick={handleCheckout}
          className="px-6 py-3 bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-black font-semibold rounded-full shadow-md hover:shadow-xl transition-all"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>

  );
};

export default MyCart;