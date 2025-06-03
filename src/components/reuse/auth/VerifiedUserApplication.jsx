import { motion, AnimatePresence } from "framer-motion";
import {
  FaCheck,
  FaArrowRight,
  FaLock,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaMapMarkedAlt,
  FaSpinner, // For loading indicators
  FaShieldAlt, // For Aadhaar step
  FaRegAddressCard, // For Aadhaar step
} from "react-icons/fa";
import { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { GET_VERIFICATION_STATUS, INITIATE_AADHAAR_OTP, VERIFY_AADHAAR_OTP, SELECT_ADDRESS, INITIATE_PAYU_MANDATE, GET_ADDRESS, ADD_ADDRESS, UPDATE_ADDRESS, DELETE_ADDRESS } from "../../api/apiDetails";

// Utility function to redirect to PayU
const redirectToPayU = (actionUrl, params) => {
  const form = document.createElement('form');
  form.setAttribute('method', 'post');
  form.setAttribute('action', actionUrl);
  form.style.display = 'none';

  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const hiddenField = document.createElement('input');
      hiddenField.setAttribute('type', 'hidden');
      hiddenField.setAttribute('name', key);
      hiddenField.setAttribute('value', params[key]);
      form.appendChild(hiddenField);
    }
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};


const UserVerificationFlow = () => {
  const [uiStep, setUiStep] = useState(0); // 0: loading, 1: Aadhaar, 2: Address, 3: Payment, 4: Completed
  const [serverVerificationStatus, setServerVerificationStatus] = useState(null);
  
  // Aadhaar Step State
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpReference, setOtpReference] = useState(""); // From initiate OTP response
  const [aadhaarLoading, setAadhaarLoading] = useState(false);
  const [aadhaarError, setAadhaarError] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Address Step State (from your original code)
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  const initialAddressFormData = {
    name: "", mobile: "", line1: "", line2: "", city: "", state: "", pincode: "", alternateMobile: "",
  };
  const [addressFormData, setAddressFormData] = useState(initialAddressFormData);

  // General State
  const [loading, setLoading] = useState(false); // For address/payment API calls (Aadhaar has its own)
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(""); // General error for steps 2 & 3
  const [isVerificationComplete, setIsVerificationComplete] = useState(false);

  // --- Development/Simulation Helper ---
  // IMPORTANT: Remove or disable this for production
  const IS_DEV_MODE = process.env.NODE_ENV === 'development'; // Or some other flag

  const fetchUserVerificationStatus = useCallback(async (showActionLoader = false) => {
    if (showActionLoader) setLoading(true); else setPageLoading(true);
    setError(""); setAadhaarError(""); // Clear errors on status fetch
    try {
      const { data } = await axiosInstance.get(GET_VERIFICATION_STATUS);
      if (data.success && data.status) {
        setServerVerificationStatus(data.status.verificationFlowStatus);
        // Reset Aadhaar specific UI states if moving away from it
        if (data.status.verificationFlowStatus !== 'pending_aadhaar') {
            setOtpSent(false); setAadhaarNumber(""); setOtp(""); setOtpReference("");
        }

        if (data.status.verificationFlowStatus === 'completed') {
          setIsVerificationComplete(true);
          setUiStep(4);
        } else if (data.status.verificationFlowStatus === 'pending_aadhaar') {
          setUiStep(1);
        } else if (data.status.verificationFlowStatus === 'pending_address') {
          setUiStep(2);
        } else if (data.status.verificationFlowStatus === 'pending_payment_setup') {
          setUiStep(3);
        } else {
          setUiStep(1); // Default to first step if status is unknown
        }
      } else {
        setError(data.message || "Could not fetch verification status.");
        setUiStep(0);
      }
    } catch (err) {
      setError(`Failed to load verification status. ${err.response?.data?.message || err.message}`);
      setUiStep(0);
      console.error("Fetch verification status error:", err);
    } finally {
      if (showActionLoader) setLoading(false); else setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserVerificationStatus();
  }, [fetchUserVerificationStatus]);

  // --- Aadhaar Step Logic ---
  const handleInitiateAadhaarOTP = async () => {
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      setAadhaarError("Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    setAadhaarLoading(true); setAadhaarError("");
    try {
      // const response = await axiosInstance.post(INITIATE_AADHAAR_OTP, { aadhaarNumber });
      // Simulate API Call for now as AuthBridge is pending
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      const mockOtpReference = `mock_otp_ref_${Date.now()}`;
      console.log("Simulated OTP Sent for Aadhaar:", aadhaarNumber, "Ref:", mockOtpReference);
      
      // setOtpReference(response.data.otpReference); // Use this with actual API
      setOtpReference(mockOtpReference); // For simulation
      setOtpSent(true);
      setAadhaarError(""); // Clear previous errors
    } catch (err) {
      setAadhaarError(err.response?.data?.message || "Failed to send OTP. Please try again.");
      console.error("Initiate Aadhaar OTP error:", err);
    } finally {
      setAadhaarLoading(false);
    }
  };

  const handleVerifyAadhaarOTP = async () => {
    if (!/^\d{6}$/.test(otp)) { // Assuming 6-digit OTP
      setAadhaarError("Please enter a valid OTP.");
      return;
    }
    setAadhaarLoading(true); setAadhaarError("");
    try {
      // await axiosInstance.post(VERIFY_AADHAAR_OTP, { otp, otpReference });
      // Simulate API Call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (otp === "123456") { // Simulate successful OTP for "123456"
        console.log("Simulated OTP Verified for Aadhaar:", aadhaarNumber);
        setAadhaarError("");
        await fetchUserVerificationStatus(true); // Refresh status, backend should now be 'pending_address'
      } else {
        throw new Error("Invalid OTP (simulated).");
      }
    } catch (err) {
      setAadhaarError(err.response?.data?.message || err.message || "OTP verification failed.");
      console.error("Verify Aadhaar OTP error:", err);
    } finally {
      setAadhaarLoading(false);
    }
  };

  // DEV ONLY: Simulate Aadhaar Success
  const simulateAadhaarSuccess = async () => {
    console.log("DEV: Simulating Aadhaar Success...");
    setAadhaarLoading(true);
    // In a real dev scenario, you might call a specific dev backend endpoint
    // that updates the user's status to 'pending_address'.
    // For this frontend-only simulation, we'll mimic the state change
    // and then refresh status (which would ideally reflect the change if backend was hit).
    setServerVerificationStatus('pending_address'); // Optimistic update
    setUiStep(2); // Manually advance UI
    setAadhaarLoading(false);
    // If you have a backend dev route:
    // try {
    //   await axiosInstance.post("/api/dev/simulate-aadhaar-verified");
    //   await fetchUserVerificationStatus(true);
    // } catch (devErr) {
    //   setAadhaarError("Dev simulation failed: " + devErr.message);
    //   setAadhaarLoading(false);
    // }
  };


  // --- Address Step Logic (largely from your original) ---
  const fetchAddresses = useCallback(async (isInitialCall = false) => {
    setLoading(true); setError("");
    try {
      const { data } = await axiosInstance.get(GET_ADDRESS);
      const fetchedAddresses = data.data || [];
      setAddresses(fetchedAddresses);
      if (fetchedAddresses.length === 0 && isInitialCall && !showAddressModal) {
        setShowAddressModal(true); setCurrentAddress(null); setAddressFormData(initialAddressFormData); setSelectedAddress(null);
      } else if (fetchedAddresses.length === 0) {
        setSelectedAddress(null);
      }
    } catch (err) {
      setError(`Failed to load addresses. ${err.response?.data?.message || err.message}`);
      console.error("Fetch addresses error:", err);
    } finally {
      setLoading(false);
    }
  }, [showAddressModal]); // Dependency to avoid re-triggering auto-open

  useEffect(() => {
    if (uiStep === 2 && serverVerificationStatus === 'pending_address') {
      fetchAddresses(true);
    }
  }, [uiStep, serverVerificationStatus, fetchAddresses]);

  const handleAddressFormChange = (e) => {
    const { name, value } = e.target;
    setAddressFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAddress = async () => {
    if (!addressFormData.name || !addressFormData.mobile || !addressFormData.line1 || !addressFormData.city || !addressFormData.state || !addressFormData.pincode) {
      setError("Please fill in all required fields: Name, Mobile, Line 1, City, State, and Pincode."); return;
    }
    if (!/^\d{10}$/.test(addressFormData.mobile)) { setError("Please enter a valid 10-digit mobile number."); return; }
    if (addressFormData.alternateMobile && !/^\d{10}$/.test(addressFormData.alternateMobile)) { setError("Please enter a valid 10-digit alternate mobile number or leave it empty."); return; }
    if (!/^\d{6}$/.test(addressFormData.pincode)) { setError("Please enter a valid 6-digit pincode."); return; }

    setLoading(true); setError("");
    try {
      const payload = { ...addressFormData, line2: addressFormData.line2 || "", alternateMobile: addressFormData.alternateMobile || null };
      if (currentAddress && currentAddress._id) {
        await axiosInstance.put(UPDATE_ADDRESS.replace(":id", currentAddress._id), payload);
      } else {
        await axiosInstance.post(ADD_ADDRESS, payload);
      }
      setShowAddressModal(false); setCurrentAddress(null); setAddressFormData(initialAddressFormData);
      await fetchAddresses(); setSelectedAddress(null);
    } catch (err) {
      setError(`Failed to save address. ${err.response?.data?.message || err.message}`);
      console.error("Save address error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    setLoading(true); setError("");
    try {
      await axiosInstance.delete(DELETE_ADDRESS.replace(":id", addressId));
      await fetchAddresses();
      if (selectedAddress && selectedAddress._id === addressId) setSelectedAddress(null);
    } catch (err) {
      setError(`Failed to delete address. ${err.response?.data?.message || err.message}`);
      console.error("Delete address error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddAddressModal = () => {
    setCurrentAddress(null); setAddressFormData(initialAddressFormData); setShowAddressModal(true); setError("");
  };

  const openEditAddressModal = (address) => {
    setCurrentAddress(address);
    setAddressFormData({
      name: address.name || "", mobile: address.mobile || "", line1: address.line1 || "", line2: address.line2 || "",
      city: address.city || "", state: address.state || "", pincode: address.pincode || "", alternateMobile: address.alternateMobile || "",
    });
    setShowAddressModal(true); setError("");
  };

  const handleConfirmAddress = async () => { // Renamed from your 'completeVerification'
    if (!selectedAddress) { setError("Please select an address to continue."); return; }
    // setLoading(true); // fetchUserVerificationStatus will handle loader
    setError("");
    try {
      await axiosInstance.post(SELECT_ADDRESS, { addressId: selectedAddress._id }); // API constant changed
      await fetchUserVerificationStatus(true); // Refresh status, backend should now be 'pending_payment_setup'
    } catch (err) {
      setError(`Address selection failed. ${err.response?.data?.message || err.message}`);
      console.error("Confirm address error:", err);
      setLoading(false); // Ensure loader stops on error if fetchUserVerificationStatus doesn't
    }
  };


  // --- Payment Step Logic ---
  const handleInitiatePayUMandate = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await axiosInstance.post(INITIATE_PAYU_MANDATE);
      if (data.success && data.paymentData && data.payuActionUrl) {
        redirectToPayU(data.payuActionUrl, data.paymentData);
      } else {
        setError(data.message || "Failed to initiate payment setup. Invalid response from server.");
        setLoading(false);
      }
    } catch (err) {
      setError(`Failed to initiate payment setup. ${err.response?.data?.message || err.message}`);
      console.error("Initiate PayU Mandate error:", err);
      setLoading(false);
    }
  };

  // --- Framer Motion Variants ---
  const listContainerVariants = {
    hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const listItemVariants = {
    hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
  };
  const cardTransition = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 }
  };


  // --- Render Logic ---
  if (pageLoading && uiStep === 0) {
    return (
      <div className="container mx-auto p-8 max-w-3xl text-center flex flex-col justify-center items-center min-h-[70vh]">
        <FaSpinner className="animate-spin text-4xl text-primary mx-auto mb-4" />
        <p className="text-lg text-gray-600">Loading verification status...</p>
      </div>
    );
  }

  if (isVerificationComplete || uiStep === 4) {
    return (
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-3xl">
        <div className="steps steps-vertical lg:steps-horizontal mb-10 w-full">
          <div className="step step-primary" data-content="✓">Aadhaar Verification</div>
          <div className="step step-primary" data-content="✓">Address Selection</div>
          <div className="step step-primary" data-content="✓">Payment Setup</div>
        </div>
        <motion.div {...cardTransition} className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center p-6 sm:p-10">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 150, damping: 15 }} className="p-4 bg-success/10 rounded-full inline-block mb-5 shadow-sm">
              <FaCheck className="text-5xl text-success" />
            </motion.div>
            <h2 className="card-title text-2xl sm:text-3xl font-bold text-gray-800 mb-3">Verification Complete!</h2>
            <p className="text-gray-600 max-w-md mx-auto">Congratulations! Your account is now fully verified.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Step content determination for DaisyUI steps
  let aadhaarStepContent = "1";
  let addressStepContent = "2";
  let paymentStepContent = "3";

  if (serverVerificationStatus === 'pending_address' || serverVerificationStatus === 'pending_payment_setup' || serverVerificationStatus === 'completed') {
    aadhaarStepContent = "✓";
  }
  if (serverVerificationStatus === 'pending_payment_setup' || serverVerificationStatus === 'completed') {
    addressStepContent = "✓";
  }
  if (serverVerificationStatus === 'completed') { // Though 'completed' state has its own full screen UI
    paymentStepContent = "✓";
  }


  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-3xl">
      <div className="steps steps-vertical lg:steps-horizontal mb-10 w-full">
        <div className={`step ${aadhaarStepContent === "✓" || (uiStep === 1 && serverVerificationStatus === 'pending_aadhaar') ? "step-primary" : ""}`}
             data-content={aadhaarStepContent}>
          Aadhaar Verification
        </div>
        <div className={`step ${addressStepContent === "✓" || (uiStep === 2 && serverVerificationStatus === 'pending_address') ? "step-primary" : ""}`}
             data-content={addressStepContent}>
          Address Selection
        </div>
        <div className={`step ${paymentStepContent === "✓" || (uiStep === 3 && serverVerificationStatus === 'pending_payment_setup') ? "step-primary" : ""}`}
             data-content={paymentStepContent}>
          Payment Setup
        </div>
      </div>

      <AnimatePresence>
        {error && !showAddressModal && uiStep !== 1 && ( // General errors for step 2/3
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }} className="alert alert-error shadow-lg mb-6">
            <div><svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{error}</span></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- STEP 1: Aadhaar Verification UI --- */}
      {uiStep === 1 && serverVerificationStatus === 'pending_aadhaar' && (
        <motion.div {...cardTransition} className="card bg-base-100 shadow-xl">
          <div className="card-body p-5 sm:p-7">
            <div className="flex items-center mb-6">
                <FaRegAddressCard className="text-3xl text-primary mr-3" />
                <h2 className="text-2xl font-bold text-gray-800">Aadhaar Verification</h2>
            </div>

            {aadhaarError && (
                <div className="alert alert-warning text-sm py-2.5 px-4 mb-4 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span>{aadhaarError}</span>
                </div>
            )}

            {!otpSent ? (
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text text-gray-700">Aadhaar Number</span></label>
                  <input type="text" placeholder="Enter 12-digit Aadhaar" className="input input-bordered w-full focus:input-primary" value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value)} maxLength={12} disabled={aadhaarLoading} />
                </div>
                <button className="btn btn-primary w-full" onClick={handleInitiateAadhaarOTP} disabled={aadhaarLoading || !aadhaarNumber}>
                  {aadhaarLoading ? <span className="loading loading-spinner loading-sm"></span> : "Send OTP"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">OTP sent to the mobile number linked with Aadhaar <strong>ending in ****{aadhaarNumber.slice(-4)}</strong>. (Simulated)</p>
                <div className="form-control">
                  <label className="label"><span className="label-text text-gray-700">Enter OTP</span></label>
                  <input type="text" placeholder="Enter 6-digit OTP" className="input input-bordered w-full focus:input-primary" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} disabled={aadhaarLoading}/>
                </div>
                <div className="flex gap-2 flex-col sm:flex-row">
                    <button className="btn btn-outline btn-primary flex-1" onClick={handleInitiateAadhaarOTP} disabled={aadhaarLoading}>
                        {aadhaarLoading && otpSent ? <span className="loading loading-spinner loading-sm"></span> : "Resend OTP"}
                    </button>
                    <button className="btn btn-primary flex-1" onClick={handleVerifyAadhaarOTP} disabled={aadhaarLoading || !otp}>
                        {aadhaarLoading && !otpSent ? <span className="loading loading-spinner loading-sm"></span> : "Verify OTP"}
                    </button>
                </div>
                 <button className="btn btn-sm btn-ghost text-gray-500 mt-2" onClick={() => {setOtpSent(false); setAadhaarError(''); setOtp(''); /* setAadhaarNumber(''); */ }}>Enter different Aadhaar?</button>
              </div>
            )}
            {IS_DEV_MODE && (
                <div className="mt-6 border-t pt-4">
                    <p className="text-xs text-center text-gray-500 mb-2">For Development Only:</p>
                    <button className="btn btn-accent btn-sm w-full" onClick={simulateAadhaarSuccess} disabled={aadhaarLoading}>
                        Dev: Simulate Aadhaar Success & Proceed to Address
                    </button>
                </div>
            )}
          </div>
        </motion.div>
      )}


      {/* --- STEP 2: Address Selection UI --- */}
      {uiStep === 2 && serverVerificationStatus === 'pending_address' && (
        <motion.div {...cardTransition} className="card bg-base-100 shadow-xl">
          <div className="card-body p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-gray-800">Manage Your Delivery Addresses</h2>
              <button className="btn btn-primary btn-md sm:btn-sm w-full sm:w-auto" onClick={openAddAddressModal}><FaPlus className="mr-2" /> Add New Address</button>
            </div>
            {loading && addresses.length === 0 && !showAddressModal && ( /* Initial address list loading */
              <div className="text-center my-10"><span className="loading loading-spinner loading-lg text-primary"></span><p className="text-lg mt-2 text-gray-600">Loading your addresses...</p></div>
            )}
            {loading && addresses.length === 0 && showAddressModal && ( /* Loading inside modal context while fetching */
              <div className="text-center py-10"><span className="loading loading-dots loading-lg text-primary"></span><p className="mt-3 text-gray-500">Fetching addresses...</p></div>
            )}
            {!loading && addresses.length === 0 && !showAddressModal && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-10 px-4 rounded-lg bg-base-200/60">
                <FaMapMarkedAlt className="text-7xl text-primary/50 mx-auto mb-5" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Addresses Yet</h3>
                <p className="mb-6 text-gray-500 max-w-sm mx-auto">It looks like you haven't added any delivery addresses. Add one to proceed.</p>
                <button className="btn btn-primary btn-wide" onClick={openAddAddressModal}><FaPlus className="mr-2" /> Add Your First Address</button>
              </motion.div>
            )}
            <AnimatePresence>
              {addresses.length > 0 && (
                <motion.div className="space-y-4 mb-6" variants={listContainerVariants} initial="hidden" animate="visible">
                  {addresses.map((address) => (
                    <motion.div key={address._id} variants={listItemVariants} layout className={`card card-compact bordered transition-all duration-300 ease-in-out cursor-pointer ${selectedAddress?._id === address._id ? "border-primary ring-2 ring-primary shadow-lg bg-primary/10" : "border-base-300 hover:shadow-md hover:border-neutral-300 bg-base-100"}`} onClick={() => setSelectedAddress(address)}>
                      <div className="card-body p-4 sm:p-5">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-grow">
                            <p className="font-semibold text-lg text-gray-800">{address.name}</p>
                            <p className="text-sm text-gray-600 mb-1">{address.mobile}{address.alternateMobile && (<span className="text-xs text-gray-500"> / {address.alternateMobile}</span>)}</p>
                            <p className="text-gray-700 leading-relaxed text-sm">{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
                            <p className="text-gray-700 leading-relaxed text-sm">{address.city}, {address.state} - {address.pincode}</p>
                          </div>
                          <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mt-1 sm:mt-0">
                            <button className="btn btn-ghost btn-sm btn-square text-info hover:bg-info/10 tooltip tooltip-left" data-tip="Edit" onClick={(e) => { e.stopPropagation(); openEditAddressModal(address); }} aria-label="Edit address"><FaEdit className="h-5 w-5" /></button>
                            <button className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10 tooltip tooltip-left" data-tip="Delete" onClick={(e) => { e.stopPropagation(); handleDeleteAddress(address._id); }} disabled={loading} aria-label="Delete address"><FaTrash className="h-5 w-5" /></button>
                          </div>
                        </div>
                        {selectedAddress?._id === address._id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto", marginTop: "12px", paddingTop: "12px" }} className="border-t border-dashed border-primary/30">
                            <div className="flex items-center text-sm text-success font-medium"><FaCheck className="mr-2 h-4 w-4" /> Selected for verification</div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            {addresses.length > 0 && (
              <button className="btn btn-primary w-full mt-8 text-base py-3 h-auto disabled:bg-opacity-70" onClick={handleConfirmAddress} disabled={!selectedAddress || loading}>
                {loading && selectedAddress ? (<><span className="loading loading-spinner loading-sm mr-2"></span>Processing...</>) : ("Confirm Address & Continue")}
                {(!loading || (loading && !selectedAddress)) && <FaArrowRight className="ml-2" />}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* --- Address Modal --- */}
      <AnimatePresence>
        {showAddressModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 pt-20 z-50" onClick={() => { setShowAddressModal(false); setError(""); }}>
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.2 } }} transition={{ type: "spring", stiffness: 260, damping: 25 }} className="card bg-base-100 shadow-2xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="card-body p-5 sm:p-7 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold text-gray-800">{currentAddress?._id ? "Edit Delivery Address" : "Add New Delivery Address"}</h3>
                  <button className="btn btn-sm btn-circle btn-ghost text-gray-500 hover:bg-gray-200/70" onClick={() => { setShowAddressModal(false); setError(""); }} aria-label="Close modal"><FaTimes className="h-5 w-5" /></button>
                </div>
                {error && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="alert alert-warning text-sm py-2.5 px-4 mb-4 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span>{error}</span>
                </motion.div>)}
                <div className="space-y-3.5">
                  {/* Form fields from your original snippet */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3.5">
                    <div className="form-control"><label className="label pb-1"><span className="label-text text-gray-700">Contact Name <span className="text-error">*</span></span></label><input type="text" name="name" placeholder="Full Name" className="input input-bordered w-full focus:input-primary text-sm sm:text-base" value={addressFormData.name} onChange={handleAddressFormChange} maxLength={50} /></div>
                    <div className="form-control"><label className="label pb-1"><span className="label-text text-gray-700">Mobile Number <span className="text-error">*</span></span></label><input type="tel" name="mobile" placeholder="10-digit Mobile" className="input input-bordered w-full focus:input-primary text-sm sm:text-base" value={addressFormData.mobile} onChange={handleAddressFormChange} maxLength={10} /></div>
                  </div>
                  <div className="form-control"><label className="label pb-1"><span className="label-text text-gray-700">Address Line 1 <span className="text-error">*</span></span></label><input type="text" name="line1" placeholder="House No, Building, Street, Area" className="input input-bordered w-full focus:input-primary text-sm sm:text-base" value={addressFormData.line1} onChange={handleAddressFormChange} maxLength={100} /></div>
                  <div className="form-control"><label className="label pb-1"><span className="label-text text-gray-700">Address Line 2 <span className="text-xs text-gray-500">(Optional)</span></span></label><input type="text" name="line2" placeholder="Landmark, Apt, Suite, etc." className="input input-bordered w-full focus:input-primary text-sm sm:text-base" value={addressFormData.line2} onChange={handleAddressFormChange} maxLength={100} /></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3.5">
                    <div className="form-control"><label className="label pb-1"><span className="label-text text-gray-700">City <span className="text-error">*</span></span></label><input type="text" name="city" placeholder="City" className="input input-bordered w-full focus:input-primary text-sm sm:text-base" value={addressFormData.city} onChange={handleAddressFormChange} maxLength={30} /></div>
                    <div className="form-control"><label className="label pb-1"><span className="label-text text-gray-700">State <span className="text-error">*</span></span></label><input type="text" name="state" placeholder="State" className="input input-bordered w-full focus:input-primary text-sm sm:text-base" value={addressFormData.state} onChange={handleAddressFormChange} maxLength={30} /></div>
                    <div className="form-control"><label className="label pb-1"><span className="label-text text-gray-700">Pincode <span className="text-error">*</span></span></label><input type="text" name="pincode" placeholder="6-digit Pincode" className="input input-bordered w-full focus:input-primary text-sm sm:text-base" value={addressFormData.pincode} onChange={handleAddressFormChange} maxLength={6} /></div>
                  </div>
                  <div className="form-control"><label className="label pb-1"><span className="label-text text-gray-700">Alternate Mobile <span className="text-xs text-gray-500">(Optional, 10-digit)</span></span></label><input type="tel" name="alternateMobile" placeholder="Another 10-digit mobile" className="input input-bordered w-full focus:input-primary text-sm sm:text-base" value={addressFormData.alternateMobile} onChange={handleAddressFormChange} maxLength={10} /></div>
                </div>
                <div className="modal-action mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                  <button className="btn btn-ghost w-full sm:w-auto" onClick={() => { setShowAddressModal(false); setError(""); }}>Cancel</button>
                  <button className="btn btn-primary w-full sm:w-auto sm:min-w-[150px]" onClick={handleSaveAddress} disabled={loading}>{loading ? (<span className="loading loading-spinner loading-sm"></span>) : (currentAddress?._id ? "Save Changes" : "Add Address")}</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- STEP 3: Payment Setup UI --- */}
      {uiStep === 3 && serverVerificationStatus === 'pending_payment_setup' && (
        <motion.div {...cardTransition} className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center p-6 sm:p-10">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 150, damping: 15 }} className="p-4 bg-primary/10 rounded-full inline-block mb-5 shadow-sm">
              <FaLock className="text-5xl text-primary" />
            </motion.div>
            <h2 className="card-title text-2xl sm:text-3xl font-bold text-gray-800 mb-3">Enable Auto Payments</h2>
            <div className="prose prose-sm sm:prose-base mb-6 max-w-md mx-auto text-gray-600">
              <p>Great! Your delivery address is confirmed.</p>
              <p>To complete your setup, please enable secure auto-payments for uninterrupted service. You'll be redirected to PayU.</p>
            </div>
            <button className="btn btn-primary btn-lg min-w-[280px] h-14 text-base shadow hover:shadow-md" onClick={handleInitiatePayUMandate} disabled={loading}>
              {loading ? (<><span className="loading loading-spinner loading-sm mr-2"></span>Redirecting...</>) : ("Proceed to PayU Secure Payments")}
              {!loading && <FaArrowRight className="ml-3" />}
            </button>
            <div className="mt-6 text-sm text-gray-500 flex items-center justify-center"><FaCheck className="inline mr-2 text-success" />Secured with 256-bit SSL encryption</div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UserVerificationFlow;