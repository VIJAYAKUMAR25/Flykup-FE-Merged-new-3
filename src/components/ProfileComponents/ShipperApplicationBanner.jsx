import { useState, useEffect } from "react"
import {
    Briefcase,
    Phone,
    Mail,
    MapPin,
    Home,
    Banknote,
    Hash,
    UserCircle,
    Landmark,
    ChevronRight,
    Loader2,
    CheckCircle,
    Clock,
    X,
    ArrowRight,
} from "lucide-react"
import axiosInstance from "../../utils/axiosInstance"
import { SHIPPER_APPLY, SHIPPER_STATUS } from "../api/apiDetails"
import { toast } from "react-toastify"
import { useAuth } from "../../context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"

const ShipperApplicationBanner = () => {
    const [showModal, setShowModal] = useState(false)
    const { user } = useAuth()
    const [applicationStatus, setApplicationStatus] = useState("NEW") // NEW, pending, approved
    const [loading, setLoading] = useState(true)
    const [activeStep, setActiveStep] = useState(1)

    const [formData, setFormData] = useState({
        businessName: "",
        mobileNumber: user?.mobile || "",
        email: user?.emailId || "",
        address: {
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            pincode: "",
        },
        bankDetails: {
            accountHolderName: user?.name || "",
            accountNumber: "",
            ifscCode: "",
            bankName: "",
        },
    })
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Fetch application status when component mounts
    useEffect(() => {
        const fetchApplicationStatus = async () => {
            if (user) {
                try {
                    setLoading(true)
                    const response = await axiosInstance.get(`${SHIPPER_STATUS}`)
                    console.log("Response data:", response.data)
                    if (response.data && response.data.status) {
                        setApplicationStatus(response.data.data.status || "NEW")
                        // If application exists, could optionally populate form with existing data
                        if (response.data.data.applicationDetails) {
                            setFormData((prevData) => ({
                                ...prevData,
                                ...response.data.data.applicationDetails,
                            }))
                        }
                    }
                } catch (error) {
                    console.error("Error fetching application status:", error)
                    // If API fails, assume NEW to allow application
                    setApplicationStatus("NEW")
                } finally {
                    setLoading(false)
                }
            } else {
                setLoading(false)
            }
        }

        fetchApplicationStatus()
    }, [user])

    // Reset form and errors when modal opens/closes
    useEffect(() => {
        if (showModal && applicationStatus === "NEW") {
            setFormData({
                businessName: "",
                mobileNumber: user?.mobile || "",
                email: user?.emailId || "",
                address: { addressLine1: "", addressLine2: "", city: "", state: "", pincode: "" },
                bankDetails: { accountHolderName: user?.name || "", accountNumber: "", ifscCode: "", bankName: "" },
            })
            setErrors({})
            setActiveStep(1)
        }
    }, [showModal, user, applicationStatus])

    // Generic input handler
    const handleChange = (e, group = null) => {
        const { name, value } = e.target
        const currentErrors = { ...errors }

        if (group) {
            setFormData((prev) => ({
                ...prev,
                [group]: { ...prev[group], [name]: value },
            }))
            delete currentErrors[`${group}.${name}`]
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }))
            delete currentErrors[name]
        }
        setErrors(currentErrors)
    }

    // Form validation
    const validateForm = (step = null) => {
        const newErrors = {}

        if (step === 1 || step === null) {
            // Business details validation
            if (!formData.businessName?.trim()) newErrors.businessName = "Business name is required"
            if (!formData.mobileNumber?.trim()) newErrors.mobileNumber = "Mobile number is required"
            else if (!/^\d{10,15}$/.test(formData.mobileNumber)) newErrors.mobileNumber = "Enter a valid mobile number"
            if (!formData.email?.trim()) newErrors.email = "Email is required"
            else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Enter a valid email address"
        }

        if (step === 2 || step === null) {
            // Address validation
            if (!formData.address.addressLine1?.trim()) newErrors["address.addressLine1"] = "Address Line 1 is required"
            if (!formData.address.city?.trim()) newErrors["address.city"] = "City is required"
            if (!formData.address.state?.trim()) newErrors["address.state"] = "State is required"
            if (!formData.address.pincode?.trim()) newErrors["address.pincode"] = "Pincode is required"
            else if (!/^\d{6}$/.test(formData.address.pincode)) newErrors["address.pincode"] = "Enter a valid 6-digit pincode"
        }

        if (step === 3 || step === null) {
            // Bank details validation
            if (!formData.bankDetails.accountHolderName?.trim())
                newErrors["bankDetails.accountHolderName"] = "Account holder name is required"
            if (!formData.bankDetails.accountNumber?.trim())
                newErrors["bankDetails.accountNumber"] = "Account number is required"
            if (!formData.bankDetails.ifscCode?.trim()) newErrors["bankDetails.ifscCode"] = "IFSC code is required"
            else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.bankDetails.ifscCode))
                newErrors["bankDetails.ifscCode"] = "Enter a valid IFSC code"
            if (!formData.bankDetails.bankName?.trim()) newErrors["bankDetails.bankName"] = "Bank name is required"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNextStep = () => {
        if (validateForm(activeStep)) {
            setActiveStep((prev) => prev + 1)
        } else {
            toast.warn("Please fill in all required fields correctly")
        }
    }

    const handlePrevStep = () => {
        setActiveStep((prev) => prev - 1)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) {
            toast.warn("Please fill in all required fields correctly")
            return
        }

        setIsSubmitting(true)
        try {
            const response = await axiosInstance.post(SHIPPER_APPLY, formData)

            if (response.data) {
                toast.success(response.data.message || "Application submitted successfully! Awaiting approval.")
                setApplicationStatus("pending")
                setShowModal(false)
            } else {
                toast.error(response.data.message || "Submission failed. Please try again.")
            }
        } catch (err) {
            console.error("Submission error:", err)
            toast.error(
                err.response?.data?.message || "Failed to submit application. Please check your details and try again.",
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    // Helper function to get nested errors
    const getError = (field) => {
        return errors[field]
    }

    // Render banner based on application status
    const renderBanner = () => {
        if (loading) {
            return (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-base-200 rounded-xl shadow-sm flex items-center justify-center p-6"
                >
                    <Loader2 className="animate-spin mr-2 text-primary" size={20} />
                    <span className="text-base-content">Loading application status...</span>
                </motion.div>
            )
        }

        switch (applicationStatus) {
            case "pending":
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-warning/10 border border-warning/30 rounded-xl shadow-md flex flex-col md:flex-row md:justify-between md:items-center p-6"
                    >
                        <div className="flex items-start md:items-center">
                            <div className="bg-warning/20 p-2 rounded-full mr-3">
                                <Clock size={24} className="text-warning" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-warning-content">Application Under Review</h2>
                                <p className="text-sm text-base-content/80 mt-1">
                                    Your dropshipper application is being processed. We'll notify you once it's approved.
                                </p>
                            </div>
                        </div>
                        <button className="btn btn-warning btn-sm mt-4 md:mt-0 md:ml-4" onClick={() => setShowModal(true)}>
                            View Details
                        </button>
                    </motion.div>
                )

            case "approved":
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-success/10 border border-success/30 rounded-xl shadow-md flex flex-col md:flex-row md:justify-between md:items-center p-6"
                    >
                        <div className="flex items-start md:items-center">
                            <div className="bg-success/20 p-2 rounded-full mr-3">
                                <CheckCircle size={24} className="text-success" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-success-content">You're a Dropshipper!</h2>
                                <p className="text-sm text-base-content/80 mt-1">
                                    Your application has been approved. Visit your Dropshipper Dashboard to start selling.
                                </p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn btn-success btn-sm mt-4 md:mt-0 md:ml-4 gap-2"
                            onClick={() => (window.location.href = "/shipper")}
                        >
                            Go to Dashboard <ChevronRight size={16} />
                        </motion.button>
                    </motion.div>
                )

            default: // NEW
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-gradient-to-r from-indigo-700 to-indigo-500 rounded-xl shadow-xl flex flex-col md:flex-row md:justify-between md:items-center p-6"
                    >
                        <div className="mb-4 md:mb-0 md:mr-4">
                            <div className="flex items-center justify-center md:justify-start">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, repeatDelay: 5 }}
                                >
                                    <Briefcase size={20} className="mr-2 text-primary-content" />
                                </motion.div>
                                <h2 className="text-xl font-bold text-primary-content">Become a Dropshipper</h2>
                            </div>
                            <p className="opacity-90 mt-2 text-sm md:text-base text-center md:text-left text-primary-content">
                                Join our network and earn commission on every sale without inventory hassles 🚀
                            </p>
                            <div className="hidden md:flex mt-3 gap-2">
                                <motion.span
                                    whileHover={{ scale: 1.05 }}
                                    className="badge badge-primary badge-outline text-primary-content text-xs px-2 py-1"
                                >
                                    No Inventory
                                </motion.span>
                                <motion.span
                                    whileHover={{ scale: 1.05 }}
                                    className="badge badge-primary badge-outline text-primary-content text-xs px-2 py-1"
                                >
                                    Fast Payouts
                                </motion.span>
                                <motion.span
                                    whileHover={{ scale: 1.05 }}
                                    className="badge badge-primary badge-outline text-primary-content text-xs px-2 py-1"
                                >
                                    Dedicated Support
                                </motion.span>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn btn-soft btn-md rounded-full shadow-md font-semibold transition duration-200 shrink-0"
                            onClick={() => setShowModal(true)}
                        >
                            Get started
                        </motion.button>
                    </motion.div>
                )
        }
    }

    // Render form steps
    const renderFormStep = () => {
        switch (activeStep) {
            case 1:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <h3 className="text-lg font-medium text-center mb-4">Business Information</h3>
                        <div className="form-control">
                            <label className="label" htmlFor="businessName">
                                <span className="label-text flex items-center">
                                    <Briefcase size={14} className="mr-1" /> Business Name *
                                </span>
                            </label>
                            <input
                                type="text"
                                id="businessName"
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleChange}
                                placeholder="Your Brand/Shop Name"
                                className={`input input-bordered w-full ${getError("businessName") ? "input-error" : ""}`}
                            />
                            {getError("businessName") && <p className="text-error text-xs mt-1">{getError("businessName")}</p>}
                        </div>
                        <div className="form-control">
                            <label className="label" htmlFor="mobileNumber">
                                <span className="label-text flex items-center">
                                    <Phone size={14} className="mr-1" /> Mobile Number *
                                </span>
                            </label>
                            <input
                                type="tel"
                                id="mobileNumber"
                                name="mobileNumber"
                                value={formData.mobileNumber}
                                onChange={handleChange}
                                placeholder="10-digit mobile number"
                                className={`input input-bordered w-full ${getError("mobileNumber") ? "input-error" : ""}`}
                            />
                            {getError("mobileNumber") && <p className="text-error text-xs mt-1">{getError("mobileNumber")}</p>}
                        </div>
                        <div className="form-control">
                            <label className="label" htmlFor="email">
                                <span className="label-text flex items-center">
                                    <Mail size={14} className="mr-1" /> Email Address *
                                </span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="your.email@example.com"
                                className={`input input-bordered w-full ${getError("email") ? "input-error" : ""}`}
                            />
                            {getError("email") && <p className="text-error text-xs mt-1">{getError("email")}</p>}
                        </div>
                        <div className="flex justify-end mt-6">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                className="btn btn-primary gap-2"
                                onClick={handleNextStep}
                            >
                                Next Step <ArrowRight size={16} />
                            </motion.button>
                        </div>
                    </motion.div>
                )
            case 2:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <h3 className="text-lg font-medium text-center mb-4">Address Details</h3>
                        <div className="form-control">
                            <label className="label" htmlFor="addressLine1">
                                <span className="label-text flex items-center">
                                    <Home size={14} className="mr-1" /> Address Line 1 *
                                </span>
                            </label>
                            <input
                                type="text"
                                id="addressLine1"
                                name="addressLine1"
                                value={formData.address.addressLine1}
                                onChange={(e) => handleChange(e, "address")}
                                placeholder="Street address, P.O. box, company name"
                                className={`input input-bordered w-full ${getError("address.addressLine1") ? "input-error" : ""}`}
                            />
                            {getError("address.addressLine1") && (
                                <p className="text-error text-xs mt-1">{getError("address.addressLine1")}</p>
                            )}
                        </div>
                        <div className="form-control">
                            <label className="label" htmlFor="addressLine2">
                                <span className="label-text flex items-center">
                                    <Home size={14} className="mr-1" /> Address Line 2 (Optional)
                                </span>
                            </label>
                            <input
                                type="text"
                                id="addressLine2"
                                name="addressLine2"
                                value={formData.address.addressLine2}
                                onChange={(e) => handleChange(e, "address")}
                                placeholder="Apartment, suite, unit, building, floor, etc."
                                className="input input-bordered w-full"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label" htmlFor="city">
                                    <span className="label-text flex items-center">
                                        <MapPin size={14} className="mr-1" /> City *
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={formData.address.city}
                                    onChange={(e) => handleChange(e, "address")}
                                    placeholder="City"
                                    className={`input input-bordered w-full ${getError("address.city") ? "input-error" : ""}`}
                                />
                                {getError("address.city") && <p className="text-error text-xs mt-1">{getError("address.city")}</p>}
                            </div>
                            <div className="form-control">
                                <label className="label" htmlFor="state">
                                    <span className="label-text flex items-center">
                                        <MapPin size={14} className="mr-1" /> State *
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    id="state"
                                    name="state"
                                    value={formData.address.state}
                                    onChange={(e) => handleChange(e, "address")}
                                    placeholder="State / Province / Region"
                                    className={`input input-bordered w-full ${getError("address.state") ? "input-error" : ""}`}
                                />
                                {getError("address.state") && <p className="text-error text-xs mt-1">{getError("address.state")}</p>}
                            </div>
                        </div>
                        <div className="form-control">
                            <label className="label" htmlFor="pincode">
                                <span className="label-text flex items-center">
                                    <MapPin size={14} className="mr-1" /> Pincode *
                                </span>
                            </label>
                            <input
                                type="text"
                                id="pincode"
                                inputMode="numeric"
                                maxLength="6"
                                name="pincode"
                                value={formData.address.pincode}
                                onChange={(e) => handleChange(e, "address")}
                                placeholder="6-digit Pincode"
                                className={`input input-bordered w-full ${getError("address.pincode") ? "input-error" : ""}`}
                            />
                            {getError("address.pincode") && <p className="text-error text-xs mt-1">{getError("address.pincode")}</p>}
                        </div>
                        <div className="flex justify-between mt-6">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                className="btn btn-outline"
                                onClick={handlePrevStep}
                            >
                                Back
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                className="btn btn-primary gap-2"
                                onClick={handleNextStep}
                            >
                                Next Step <ArrowRight size={16} />
                            </motion.button>
                        </div>
                    </motion.div>
                )
            case 3:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <h3 className="text-lg font-medium text-center mb-4">Bank Details</h3>
                        <div className="form-control">
                            <label className="label" htmlFor="accountHolderName">
                                <span className="label-text flex items-center">
                                    <UserCircle size={14} className="mr-1" /> Account Holder Name *
                                </span>
                            </label>
                            <input
                                type="text"
                                id="accountHolderName"
                                name="accountHolderName"
                                value={formData.bankDetails.accountHolderName}
                                onChange={(e) => handleChange(e, "bankDetails")}
                                placeholder="Name as per bank records"
                                className={`input input-bordered w-full ${getError("bankDetails.accountHolderName") ? "input-error" : ""}`}
                            />
                            {getError("bankDetails.accountHolderName") && (
                                <p className="text-error text-xs mt-1">{getError("bankDetails.accountHolderName")}</p>
                            )}
                        </div>
                        <div className="form-control">
                            <label className="label" htmlFor="accountNumber">
                                <span className="label-text flex items-center">
                                    <Banknote size={14} className="mr-1" /> Account Number *
                                </span>
                            </label>
                            <input
                                type="text"
                                id="accountNumber"
                                name="accountNumber"
                                value={formData.bankDetails.accountNumber}
                                onChange={(e) => handleChange(e, "bankDetails")}
                                placeholder="Bank Account Number"
                                className={`input input-bordered w-full ${getError("bankDetails.accountNumber") ? "input-error" : ""}`}
                            />
                            {getError("bankDetails.accountNumber") && (
                                <p className="text-error text-xs mt-1">{getError("bankDetails.accountNumber")}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label" htmlFor="ifscCode">
                                    <span className="label-text flex items-center">
                                        <Hash size={14} className="mr-1" /> IFSC Code *
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    id="ifscCode"
                                    name="ifscCode"
                                    value={formData.bankDetails.ifscCode}
                                    onChange={(e) => handleChange(e, "bankDetails")}
                                    placeholder="Bank IFSC Code"
                                    className={`input input-bordered w-full ${getError("bankDetails.ifscCode") ? "input-error" : ""}`}
                                />
                                {getError("bankDetails.ifscCode") && (
                                    <p className="text-error text-xs mt-1">{getError("bankDetails.ifscCode")}</p>
                                )}
                            </div>
                            <div className="form-control">
                                <label className="label" htmlFor="bankName">
                                    <span className="label-text flex items-center">
                                        <Landmark size={14} className="mr-1" /> Bank Name *
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    id="bankName"
                                    name="bankName"
                                    value={formData.bankDetails.bankName}
                                    onChange={(e) => handleChange(e, "bankDetails")}
                                    placeholder="Name of the Bank"
                                    className={`input input-bordered w-full ${getError("bankDetails.bankName") ? "input-error" : ""}`}
                                />
                                {getError("bankDetails.bankName") && (
                                    <p className="text-error text-xs mt-1">{getError("bankDetails.bankName")}</p>
                                )}
                            </div>
                        </div>
                        <div className="form-control mt-4">
                            <label className="label cursor-pointer justify-start">
                                <input type="checkbox" className="checkbox checkbox-primary mr-2" required />
                                <span className="label-text text-sm">
                                    I agree to the{" "}
                                    <a href="/terms" className="text-primary hover:underline">
                                        Terms of Service
                                    </a>{" "}
                                    and{" "}
                                    <a href="/privacy" className="text-primary hover:underline">
                                        Privacy Policy
                                    </a>
                                </span>
                            </label>
                        </div>
                        <div className="flex justify-between mt-6">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                className="btn btn-outline"
                                onClick={handlePrevStep}
                            >
                                Back
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                className="btn btn-primary gap-2"
                                disabled={isSubmitting}
                                onClick={handleSubmit}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={16} className="mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Submit Application"
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                )
            default:
                return null
        }
    }

    return (
        <>
            {/* Responsive container with proper spacing */}
            <div className="md:px-6 mx-4 md:mx-8 mb-6">{renderBanner()}</div>

            {/* Modal dialog */}
            {showModal && (
                <div className="modal modal-open">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden"
                    >
                        {/* Modal header with status color coding */}
                        <div
                            className={`px-6 py-4 ${applicationStatus === "pending"
                                    ? "bg-warning/10 border-b border-warning/30"
                                    : applicationStatus === "approved"
                                        ? "bg-success/10 border-b border-success/30"
                                        : "bg-gradient-to-r from-indigo-500 to-indigo-700 text-primary-content"
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <h3 className={`text-xl font-bold ${applicationStatus !== "NEW" ? "text-base-content" : ""}`}>
                                    {applicationStatus === "pending" && "Application Status: Under Review"}
                                    {applicationStatus === "approved" && "Application Status: approved"}
                                    {applicationStatus === "NEW" && "Dropshipper Application"}
                                </h3>
                                <button
                                    className={`btn btn-sm btn-circle ${applicationStatus !== "NEW" ? "btn-ghost" : "btn-ghost text-primary-content hover:bg-primary-focus hover:text-secondary"}`}
                                    onClick={() => setShowModal(false)}
                                    type="button"
                                    aria-label="Close"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            {applicationStatus === "NEW" && (
                                <p className="text-sm text-primary-content/80 mt-1">
                                    Complete the form to join our dropshipping network
                                </p>
                            )}
                        </div>

                        <div className="p-6">
                            {/* Different content based on application status */}
                            {applicationStatus === "pending" ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="flex flex-col items-center text-center p-4"
                                >
                                    <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mb-4">
                                        <Clock size={32} className="text-warning" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-base-content mb-2">Your Application is Being Reviewed</h3>
                                    <p className="text-base-content/70 mb-4">
                                        Thank you for applying to become a dropshipper. Our team is currently reviewing your application.
                                        This process typically takes 1-2 business days.
                                    </p>
                                    <div className="bg-warning/10 border border-warning/30 p-4 rounded-lg w-full">
                                        <h4 className="font-medium text-warning-content mb-2">What happens next?</h4>
                                        <ul className="text-sm text-left list-disc ml-5 text-base-content/70">
                                            <li>We'll verify your submitted information</li>
                                            <li>You'll receive an email notification when your application is approved</li>
                                            <li>Once approved, you can start listing products immediately</li>
                                        </ul>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="btn btn-outline btn-warning mt-6"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Check Back Later
                                    </motion.button>
                                </motion.div>
                            ) : applicationStatus === "approved" ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="flex flex-col items-center text-center p-4"
                                >
                                    <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle size={32} className="text-success" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-base-content mb-2">
                                        Congratulations! You're a Dropshipper
                                    </h3>
                                    <p className="text-base-content/70 mb-4">
                                        Your application has been approved. You can now start selling products and earning commissions.
                                    </p>
                                    <div className="bg-success/10 border border-success/30 p-4 rounded-lg w-full">
                                        <h4 className="font-medium text-success-content mb-2">Next Steps:</h4>
                                        <ul className="text-sm text-left list-disc ml-5 text-base-content/70">
                                            <li>Visit your dropshipper dashboard</li>
                                            <li>Browse our product catalog and select items to sell</li>
                                            <li>Set up your store profile and payment preferences</li>
                                            <li>Start marketing products to your audience</li>
                                        </ul>
                                    </div>
                                    <div className="flex gap-3 mt-6">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="btn btn-outline"
                                            onClick={() => setShowModal(false)}
                                        >
                                            Close
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="btn btn-success"
                                            onClick={() => (window.location.href = "/dashboard/dropshipper")}
                                        >
                                            Go to Dashboard
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ) : (
                                // NEW - Application Form with steps
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Progress steps */}
                                    <div className="w-full">
                                        <ul className="steps steps-horizontal w-full">
                                            <li className={`step ${activeStep >= 1 ? "step-primary" : ""}`}>Business</li>
                                            <li className={`step ${activeStep >= 2 ? "step-primary" : ""}`}>Address</li>
                                            <li className={`step ${activeStep >= 3 ? "step-primary" : ""}`}>Banking</li>
                                        </ul>
                                    </div>

                                    {/* Form steps */}
                                    <AnimatePresence mode="wait">{renderFormStep()}</AnimatePresence>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    )
}

export default ShipperApplicationBanner
