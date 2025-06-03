import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import {
  MapPin,
  Phone,
  User,
  CheckCircle,
  Plus,
  ArrowLeft,
  Truck,
  Clock,
  CreditCard,
  Shield,
  ArrowRight,
  ChevronRight,
  CheckSquare,
  ShoppingBag,
  Home,
  Building,
  Briefcase,
} from "lucide-react"
import { socketurl } from "../../../config"
import { toast } from "react-toastify"
import confetti from "canvas-confetti"
import { motion } from "framer-motion"
import { useCart } from "../../context/CartContext"
import { useAlert } from "../Alerts/useAlert"
import PayUPaymentGateway from "./PayUPaymentGateway"
import PayUCheckout from "./PayUCheckout"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
}

const successVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
    },
  }),
}

/**
 * AddressSelection Component
 */
const AddressSelection = ({ selectedAddress, onSelectAddress }) => {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    alternateMobile: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    addressType: "profile", // Default address type
  })
  const [addresses, setAddresses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const userData = user // or get from localStorage

  // Fetch addresses using your API endpoint
  const fetchAddressesByUserId = async (userId) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`${socketurl}/api/address/${userId}`)
      if (!response.ok) {
        throw new Error(response.status === 404 ? "User not found" : "Failed to fetch addresses")
      }
      const result = await response.json()
      if (result.status && result.data) {
        setAddresses(result.data)
      } else {
        setAddresses([])
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userData?._id) {
      fetchAddressesByUserId(userData._id)
    }
  }, [userData?._id])

  // Handle adding a new address via POST
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${socketurl}/api/address/${userData._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      if (!response.ok) {
        throw new Error("Failed to add address")
      }
      setShowModal(false)
      setFormData({
        name: "",
        mobile: "",
        alternateMobile: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        pincode: "",
        addressType: "profile",
      })
      // Refresh addresses after adding
      await fetchAddressesByUserId(userData._id)
      toast.success("Address added successfully!")
    } catch (error) {
      console.error("Address submission error:", error)
      toast.error("Error saving address. Please try again.")
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const getAddressTypeIcon = (type) => {
    switch (type) {
      case "profile":
        return <Home size={16} className="text-blue-500" />
      case "work":
        return <Briefcase size={16} className="text-purple-500" />
      case "other":
        return <Building size={16} className="text-green-500" />
      default:
        return <MapPin size={16} className="text-gray-500" />
    }
  }

  if (!userData?._id) {
    return (
      <div className="p-7 bg-red-50 text-red-600 text-center rounded-lg shadow-sm">
        User not authenticated. Please log in to continue.
      </div>
    )
  }

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 md:w-auto w-[340px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <MapPin className="mr-2 text-blue-600" size={20} />
          Delivery Address
        </h2>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="flex justify-center items-center p-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            <p className="font-medium">Error loading addresses</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <MapPin className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-600 mb-4">No saved addresses found</p>
            <p className="text-sm text-gray-500 mb-4">Add a new address to continue with your order</p>
          </div>
        ) : (
          <div className="grid gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {addresses.map((addressItem, index) => (
              <motion.div
                key={addressItem._id}
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${selectedAddress?._id === addressItem._id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
                  }`}
                onClick={() => onSelectAddress(addressItem)}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-1">{getAddressTypeIcon(addressItem.addressType || "profile")}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-800">{addressItem.name}</span>
                        {addressItem.addressType && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 uppercase">
                            {addressItem.addressType}
                          </span>
                        )}
                      </div>
                      {selectedAddress?._id === addressItem._id && (
                        <CheckCircle className="text-blue-500 flex-shrink-0" size={20} />
                      )}
                    </div>
                    <p className="text-gray-700 text-sm mb-1">
                      {addressItem.line1}, {addressItem.line2}
                    </p>
                    <p className="text-gray-700 text-sm mb-1">
                      {addressItem.city}, {addressItem.state} - {addressItem.pincode}
                    </p>
                    <div className="flex items-center text-gray-600 text-sm mt-2">
                      <Phone size={14} className="mr-1" />
                      <span>{addressItem.mobile}</span>
                      {addressItem.alternateMobile && (
                        <span className="ml-2 text-gray-500">Alt: {addressItem.alternateMobile}</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add New Address Button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full mt-4 flex items-center justify-center py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
        >
          <Plus size={18} className="mr-2" />
          Add New Address
        </button>
      </div>

      {/* Modal for Adding New Address */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[60vh] overflow-y-auto"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Add New Address</h3>
              <button
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => setShowModal(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Address Type Selection */}
                <div className="grid grid-cols-3 gap-3">
                  <label
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.addressType === "profile" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  >
                    <input
                      type="radio"
                      name="addressType"
                      value="profile"
                      checked={formData.addressType === "profile"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <Home size={20} className={formData.addressType === "profile" ? "text-blue-500" : "text-gray-400"} />
                    <span
                      className={`mt-2 text-sm font-medium ${formData.addressType === "profile" ? "text-blue-600" : "text-gray-600"}`}
                    >
                      Home
                    </span>
                  </label>

                  <label
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.addressType === "work" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  >
                    <input
                      type="radio"
                      name="addressType"
                      value="work"
                      checked={formData.addressType === "work"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <Briefcase
                      size={20}
                      className={formData.addressType === "work" ? "text-blue-500" : "text-gray-400"}
                    />
                    <span
                      className={`mt-2 text-sm font-medium ${formData.addressType === "work" ? "text-blue-600" : "text-gray-600"}`}
                    >
                      Work
                    </span>
                  </label>

                  <label
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.addressType === "other" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  >
                    <input
                      type="radio"
                      name="addressType"
                      value="other"
                      checked={formData.addressType === "other"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <Building
                      size={20}
                      className={formData.addressType === "other" ? "text-blue-500" : "text-gray-400"}
                    />
                    <span
                      className={`mt-2 text-sm font-medium ${formData.addressType === "other" ? "text-blue-600" : "text-gray-600"}`}
                    >
                      Other
                    </span>
                  </label>
                </div>

                {/* Name & Mobile Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className="pl-10 w-full py-2.5 px-4 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="Enter mobile number"
                        className="pl-10 w-full py-2.5 px-4 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        pattern="[0-9]{10}"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Alternate Mobile */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Mobile (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="alternateMobile"
                      value={formData.alternateMobile}
                      onChange={handleChange}
                      placeholder="Enter alternate mobile number"
                      className="pl-10 w-full py-2.5 px-4 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      pattern="[0-9]{10}"
                    />
                  </div>
                </div>

                {/* Address Lines */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="line1"
                      value={formData.line1}
                      onChange={handleChange}
                      placeholder="House No., Building Name"
                      className="pl-10 w-full py-2.5 px-4 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    name="line2"
                    value={formData.line2}
                    onChange={handleChange}
                    placeholder="Road, Area, Colony"
                    className="w-full py-2.5 px-4 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                  />
                </div>

                {/* City, State, Pincode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter city"
                      className="w-full py-2.5 px-4 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Enter state"
                      className="w-full py-2.5 px-4 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="Enter pincode"
                      className="w-full py-2.5 px-4 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      pattern="[0-9]{6}"
                      required
                    />
                  </div>
                </div>

                <div className="sticky bg-white z-10 px-6 py-4 items-center bottom-0 flex justify-end space-x-3 border-t">
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

/**
 * OrderSummary Component
 */
const OrderSummary = ({ products }) => {
  const subtotal = products.reduce((acc, item) => acc + item.product.productPrice * item.quantity, 0)
  const shippingFee = subtotal > 999 ? 0 : 49
  const tax = Math.round(subtotal * 0.18)
  const total = subtotal + shippingFee + tax

  const estimatedDelivery = new Date()
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 3)
  const deliveryDate = estimatedDelivery.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 md:w-auto w-[340px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <ShoppingBag className="mr-2 text-amber-600" size={20} />
          Order Summary
        </h2>
      </div>

      <div className="p-5">
        {/* Delivery Estimate */}
        <div className="mb-6 bg-green-50 rounded-lg p-3 flex items-center">
          <Truck className="text-green-600 mr-3 flex-shrink-0" size={20} />
          <div>
            <p className="text-green-800 font-medium">Estimated Delivery</p>
            <p className="text-green-700 text-sm">{deliveryDate}</p>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-4 mb-6">
          {products.map((item, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 mr-4">
                {item.product?.images && item.product.images[0] ? (
                  <img
                    src={item.product.images[0] || "/placeholder.svg"}
                    alt={item.product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ShoppingBag size={24} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-800 truncate">{item.product?.title}</h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <span className="inline-block px-2 py-0.5 bg-gray-100 rounded-full text-xs mr-2">
                    Qty: {item.quantity}
                  </span>
                  {item.product?.weight && <span className="text-xs text-gray-500">Weight: {item.product.weight}</span>}
                </div>
              </div>

              <div className="text-right ml-4">
                <p className="font-semibold text-gray-800">
                  ₹{(item.product?.productPrice * item.quantity).toLocaleString("en-IN")}
                </p>
                {item.product?.MRP && item.product.MRP > item.product.productPrice && (
                  <p className="text-xs text-gray-500 line-through">
                    ₹{(item.product.MRP * item.quantity).toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Price Details */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-700 mb-3">Price Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping Fee</span>
              <span className={shippingFee === 0 ? "text-green-600" : ""}>
                {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (18% GST)</span>
              <span>₹{tax.toLocaleString("en-IN")}</span>
            </div>
            <div className="border-t border-dashed my-2 pt-2 flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-emerald-600">₹{total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Savings */}
        {products.some((item) => item.product?.MRP && item.product.MRP > item.product.productPrice) && (
          <div className="mt-4 bg-green-50 p-3 rounded-lg">
            <p className="text-green-700 font-medium flex items-center">
              <CheckSquare className="mr-2" size={16} />
              You're saving ₹
              {products
                .reduce((acc, item) => {
                  if (item.product?.MRP && item.product.MRP > item.product.productPrice) {
                    return acc + (item.product.MRP - item.product.productPrice) * item.quantity
                  }
                  return acc
                }, 0)
                .toLocaleString("en-IN")}{" "}
              on this order!
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/**
 * CashfreePaymentGateway Component
 */
const CashfreePaymentGateway = ({ amount, onSuccess, onCancel, onError, selectedAddress, products, customer }) => {
  const numericAmount = Number.parseInt(amount, 10)
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const { positive, negative } = useAlert()


  // Load the Cashfree SDK dynamically
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js"
    script.async = true
    script.onload = () => {
      console.log("Cashfree SDK loaded successfully")
      setIsSDKLoaded(true)
    }
    script.onerror = () => {
      console.error("Failed to load Cashfree SDK")
      setIsSDKLoaded(false)
    }
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handlePayment = async () => {
    if (!amount || isNaN(amount)) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!isSDKLoaded) {
      toast.warning("Payment system is still loading. Please try again shortly.");
      return;
    }

    try {
      // **Step 0: Create Order in Backend**
      const createOrderResponse = await fetch(`${socketurl}/api/order/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: numericAmount, selectedAddress, products, customer }),
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
        body: JSON.stringify({ amount: numericAmount, selectedAddress, products, customer, backendOrderId: order._id }),
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
      toast.error("Payment processing error. Please try again later.");
      if (onError) onError(error);
    }
  };


  return (
    <div className="flex justify-center items-center">
      <div className="w-full max-w-md rounded-2xl overflow-hidden bg-white shadow-xl">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Shield className="w-6 h-6" />
            <h2 className="text-2xl font-bold text-center">Secure Checkout</h2>
          </div>
          <div className="flex justify-center items-center gap-2">
            <span className="text-sm opacity-90">Powered by</span>
            <div className="bg-white rounded-lg px-3 py-1">
              <img src="/Cashfree.svg" alt="Cashfree" className="h-8 object-contain" />
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Amount Display */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center">
            <p className="text-sm text-gray-500 mb-2">Amount to Pay</p>
            <div className="flex justify-center items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-800">₹{numericAmount.toLocaleString("en-IN")}</span>
              <span className="text-gray-500">INR</span>
            </div>
          </div>

          {/* Payment Features */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <CreditCard className="w-4 h-4 text-blue-500" />
              <span>Multiple Options</span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-lg flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handlePayment}
            disabled={!isSDKLoaded}
          >
            <span>Pay Securely</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Footer Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">By proceeding, you agree to our Terms and Conditions</p>
          </div>
        </div>

        {/* Payment Methods Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex justify-center items-center gap-4">
            <img src="/visa.svg" alt="Visa" className="h-6 object-contain" />
            <img src="/mastercard.svg" alt="Mastercard" className="h-6 object-contain" />
            <img src="/upi-ar21.svg" alt="UPI" className="h-6 object-contain" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * CheckoutPage Component
 */
const CheckoutPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { clearCart } = useCart()

  // Retrieve products array from state passed from the ProductPage
  const { products, isFromMyCart } = location.state || {}

  // Calculate the total amount for all products
  const subtotal = products
    ? products.reduce((acc, item) => acc + item.product.productPrice * item.quantity, 0)
    : 0;
  const shippingFee = subtotal > 999 ? 0 : 49;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shippingFee + tax;

  const [selectedAddress, setSelectedAddress] = useState(null)
  const [showPaymentGateway, setShowPaymentGateway] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState("")
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: Address, 2: Review, 3: Payment

  // Parse query parameters on mount (if any exist)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const paymentStatus = params.get("paymentStatus")
    if (paymentStatus) {
      setPaymentMessage(paymentStatus === "success" ? "Payment Successful!" : "Payment Failed. Please try again.")
      if (paymentStatus === "success") setPaymentSuccess(true)
    }
  }, [location.search])

  // When Place Order is clicked, verify address selection then show the payment modal.
  const handlePlaceOrder = () => {
    setCurrentStep(2)
    if (!selectedAddress) {
      toast.warn("Please select a delivery address before placing the order.")
      return
    }
    setShowPaymentGateway(true)
  }

  // Payment callbacks to handle success, error, or cancel
  const handlePaymentSuccess = (paymentDetails) => {
    setPaymentMessage("Payment Successful!")
    setShowPaymentGateway(false)
    setPaymentSuccess(true)
    if (isFromMyCart) {
      // Clear the cart on successful payment
      clearCart()
    }

    // Trigger confetti effect on success
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
    })
  }

  const handlePaymentError = (error) => {
    setPaymentMessage(`Payment Failed: ${error}`)
    setShowPaymentGateway(false)
    toast.error(`Payment Failed: ${error}`)
  }

  const handlePaymentCancel = () => {
    setPaymentMessage("Payment Cancelled")
    setShowPaymentGateway(false)
  }

  if (!products || products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <ShoppingBag className="mx-auto text-gray-400 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Products Found</h2>
          <p className="text-gray-600 mb-6">Your checkout session is empty or has expired.</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50 pb-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button className="p-2 rounded-full hover:bg-gray-100 mr-2" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} className="text-gray-700" />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Checkout</h1>
            </div>
            <div className="text-sm text-gray-500">
              {products.length} {products.length === 1 ? "item" : "items"} | ₹{subtotal.toLocaleString("en-IN")}
            </div>
          </div>

          {/* Checkout Steps */}
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center w-full max-w-2xl">
              {/* Step 1: Address */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${selectedAddress ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}
                >
                  {selectedAddress ? <CheckCircle size={16} /> : "1"}
                </div>
                <span className={`text-xs mt-1 ${selectedAddress ? "text-blue-600" : "text-gray-400"}`}>
                  Address
                </span>
              </div>

              <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? "bg-blue-600" : "bg-gray-200"}`}></div>

              {/* Step 2: Review */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}
                >
                  {currentStep >= 2 ? <CheckCircle size={16} /> : "2"}
                </div>
                <span className={`text-xs mt-1 ${currentStep >= 2 ? "text-blue-600" : "text-gray-400"}`}>
                  Review
                </span>
              </div>

              <div className={`flex-1 h-1 mx-2 ${paymentSuccess ? "bg-blue-600" : "bg-gray-200"}`}></div>

              {/* Step 3: Payment */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${paymentSuccess ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}
                >
                  {paymentSuccess ? <CheckCircle size={16} /> : "3"}
                </div>
                <span className={`text-xs mt-1 ${paymentSuccess ? "text-blue-600" : "text-gray-400"}`}>
                  Payment
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto md:max-w-5xl px-4 pt-6">
        {/* Display error message if payment fails */}
        {paymentMessage && !paymentSuccess && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-red-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {paymentMessage}
          </div>
        )}

        {/* On successful payment, display a success message with a View Orders button */}
        {paymentSuccess && (
          <motion.div
            className="mb-6 p-6 bg-green-50 border border-green-200 text-green-700 rounded-xl flex flex-col items-center"
            variants={successVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-800 mb-2">Payment Successful!</h2>
            <p className="text-green-700 mb-4 text-center">
              Your order has been placed successfully and will be processed soon.
            </p>
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              onClick={() => window.open("/profile/orders", "_blank")}
            >
              View Orders
            </button>
          </motion.div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Step 1: Address Selection */}
            <AddressSelection selectedAddress={selectedAddress} onSelectAddress={setSelectedAddress} />

            {/* Step 2: Order Summary */}
            {products && <OrderSummary products={products} />}
          </div>

          {/* Checkout Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-28">
              <div className="p-5">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Order Total</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className={shippingFee === 0 ? "text-green-600" : ""}>
                      {shippingFee === 0 ? "FREE" : `₹${shippingFee.toLocaleString("en-IN")}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (18% GST)</span>
                    <span>₹{tax.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-emerald-600">
                      ₹{total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-green-400 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={paymentSuccess || !selectedAddress}
                >
                  <span>Place Order</span>
                  <ChevronRight size={20} />
                </button>

                {!selectedAddress && (
                  <p className="text-xs text-red-500 mt-2 text-center">Please select a delivery address</p>
                )}

                {/* Secure Checkout Badge */}
                <div className="mt-6 flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Shield className="text-gray-400" size={16} />
                  <span className="text-xs text-gray-500">Secure Checkout</span>
                </div>

                {/* Delivery Info */}
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-start gap-3 text-sm">
                    <Truck className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="font-medium text-gray-700">Free Delivery</p>
                      <p className="text-gray-500">For orders above ₹999</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm mt-3">
                    <Clock className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="font-medium text-gray-700">Estimated Delivery</p>
                      <p className="text-gray-500">3-5 business days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentGateway && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Complete Payment</h3>
              <button
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => setShowPaymentGateway(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* <PayUCheckout /> // PayUCheckout component using SDK */}
            <PayUPaymentGateway
            // <CashfreePaymentGateway
              amount={total}
              selectedAddress={selectedAddress}
              products={products}
              customer={user}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handlePaymentCancel}
              onCloseModal={() => setShowPaymentGateway(false)} // example
            />
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

export default CheckoutPage


