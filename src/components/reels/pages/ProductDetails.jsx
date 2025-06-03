import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { AddressSelection } from '../components/AddressSelection';
import { OrderSummary } from '../components/OrderSummary';
import CashfreePaymentGateway from '../components/CashfreePaymentGateway';
import PaymentSuccess from '../components/PaymentSuccess';
import PaymentFailed from '../components/PaymentFailed';
import { generateSignedUrl } from '../../../utils/aws';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import PayUPaymentGateway from '../../products/PayUPaymentGateway';
import { useAlert } from '../../Alerts/useAlert';


const ProductsDetailsPage = ({ products, onClose }) => {
  const { user } = useAuth();
  const { addProduct } = useCart();
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [signedProducts, setSignedProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
 const CDN_BASE_URL = import.meta.env.VITE_AWS_CDN_URL;
  const navigate = useNavigate();
  const { positive, negative } = useAlert()

  useEffect(() => {
    const signProductImages = async () => {
      const updated = await Promise.all(
        products.map(async (prod) => {
          if (prod.images && prod.images.length > 0) {
            const signedImages = await Promise.all(
              prod.images.map(async (imgUrl) => {
                try {
                  return await generateSignedUrl(imgUrl);
                } catch (err) {
                  console.error("Error generating signed URL:", err);
                  return imgUrl;
                }
              })
            );
            return { ...prod, signedImages };
          }
          return prod;
        })
      );
      setSignedProducts(updated);
    };

    signProductImages();
  }, [products]);

  const renderProductList = () => {
    return (
      <div className="min-h-screen p-6  text-white">
        {/* <h1 className="md:text-xl text-md font-extrabold mb-10 text-center text-yellow-400 drop-shadow-md">
          🛍️ Available Products
        </h1> */}

        <div className="grid grid-cols-1  gap-8">
          {signedProducts.length > 0 ? (
            signedProducts.map((prod) => {
              const productQuantity = quantities[prod._id] || 1;
              return (
                <div
                  key={prod._id}
                  className="bg-stone-800 rounded-2xl shadow-lg hover:shadow-2xl border border-stone-700 transition-transform transform hover:-translate-y-1 duration-300 p-5 flex flex-col"
                >
                  {/* Product Image */}
                  <div className="relative w-full h-52 overflow-hidden rounded-xl bg-stone-700">
                  <img
                      src={ `${CDN_BASE_URL}${prod.images[0]?.key} `|| '/placeholder.svg'}
                      alt={prod.title}
                      className="w-full md:h-full h-[1/2] object-cover"
                    />

                    {/* Quantity Control */}
                    <div className="absolute bottom-3 right-3 bg-yellow-400/70 text-black font-bold rounded-full px-3 py-1 flex items-center gap-2 shadow-md">
                      <button
                        onClick={() =>
                          setQuantities({
                            ...quantities,
                            [prod._id]: Math.max(1, productQuantity - 1)
                          })
                        }
                        className="text-lg hover:text-red-600 transition"
                      >
                        –
                      </button>
                      <span>{productQuantity}</span>
                      <button
                        onClick={() =>
                          setQuantities({
                            ...quantities,
                            [prod._id]: productQuantity + 1
                          })
                        }
                        className="text-lg hover:text-green-700 transition"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="mt-4 flex-grow">
                    <h2 className="text-xl font-semibold text-yellow-300 truncate">
                      {prod.title}
                    </h2>
                    <p className="text-sm text-stone-400 mt-2 line-clamp-2">
                      {prod.description || "No description available."}
                    </p>
                    <div className="mt-3 text-lg font-bold text-green-400 flex justify-end items-center gap-1 ">
                      ₹{prod.productPrice.toLocaleString("en-IN")}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                      onClick={() => {
                        setSelectedProduct(prod);
                        setSelectedQuantity(productQuantity);
                        setCheckoutStep(1);
                      }}
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 rounded-full shadow transition-all"
                    >
                      Buy Now
                    </button>

                    <button
                      onClick={() => {
                        addProduct(prod, productQuantity);
                        positive("Added to cart!");
                      }}
                      className="w-full bg-stone-700 hover:bg-stone-600 text-white font-semibold py-2 rounded-full border border-stone-600 shadow-sm transition-all"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center col-span-full text-stone-400 text-lg">
              Loading products...
            </div>
          )}
        </div>
      </div>

    );
  };

  // Step 1: Address selection
  if (checkoutStep === 1) {
    return (
      <AddressSelection
        selectedAddress={selectedAddress}
        onSelectAddress={(address) => setSelectedAddress(address)}
        onNext={() => {
          if (!selectedAddress) {
            toast.error("Please select an address");
            return;
          }
          setCheckoutStep(2);
        }}
        onBack={() => setCheckoutStep(0)}
      />
    );
  }

  // Step 2: Order summary
  if (checkoutStep === 2) {
    return (
      <OrderSummary
        product={selectedProduct}
        quantity={selectedQuantity}
        selectedAddress={selectedAddress}
        onPlaceOrder={(details) => {
          setOrderDetails(details);
          setCheckoutStep(3);
        }}
        onBack={() => setCheckoutStep(1)}
        isOrderPlaced={isOrderPlaced}
      />
    );
  }

  // Step 3: Payment gateway
  if (checkoutStep === 3) {
    return (
      <CashfreePaymentGateway
        amount={
          orderDetails
            ? orderDetails.amount
            : selectedProduct.productPrice * selectedQuantity
        }
        selectedAddress={selectedAddress}
        product={selectedProduct}
        quantity={selectedQuantity}
        customer={user}
        onSuccess={() => {
          toast.success("Payment successful");
          setIsOrderPlaced(true);
          setCheckoutStep(4);
        }}
        onCancel={() => {
          toast.error("Payment cancelled");
          setCheckoutStep(5);
        }}
        onError={() => {
          toast.error("Payment error");
          setCheckoutStep(5);
        }}
        isOrderPlaced={isOrderPlaced}
      />
    );
  }

  // Step 4: Payment success
  if (checkoutStep === 4) {
    return (
      <PaymentSuccess
        product={selectedProduct}
        amount={selectedProduct.productPrice * selectedQuantity}
        quantity={selectedQuantity}
        isOrderPlaced={isOrderPlaced}
        onClose={onClose || (() => navigate('/'))}
      />
    );
  }

  // Step 5: Payment failed
  if (checkoutStep === 5) {
    return (
      <PaymentFailed
        product={selectedProduct}
        amount={selectedProduct.productPrice * selectedQuantity}
        quantity={selectedQuantity}
        isOrderPlaced={isOrderPlaced}
        onRetry={() => setCheckoutStep(3)}
        onClose={onClose || (() => navigate('/'))}
      />
    );
  }

  return renderProductList();
};

export default ProductsDetailsPage;
