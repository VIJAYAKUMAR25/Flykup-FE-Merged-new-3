// CashfreeVerification.js
import CashfreePayments from '@cashfreepayments/cashfree-js';

export const initializeCashfree = async (clientId) => {
  try {
    const cashfree = new CashfreePayments(clientId);
    return cashfree;
  } catch (error) {
    console.error('Cashfree initialization failed:', error);
    throw error;
  }
};

// GST Verification
export const verifyGST = async (clientId, gstNumber) => {
  try {
    const cashfree = await initializeCashfree(clientId);
    return await cashfree.verifyGST({ gstin: gstNumber });
  } catch (error) {
    console.error('GST verification failed:', error);
    throw error;
  }
};

// Aadhar Verification
export const initiateAadharVerification = async (clientId, aadharNumber) => {
  try {
    const cashfree = await initializeCashfree(clientId);
    return await cashfree.aadhaarVerification.initiate({ 
      aadhaarNumber: aadharNumber 
    });
  } catch (error) {
    console.error('Aadhar verification initiation failed:', error);
    throw error;
  }
};

export const verifyAadharOTP = async (clientId, verificationId, otp) => {
  try {
    const cashfree = await initializeCashfree(clientId);
    return await cashfree.aadhaarVerification.confirm({
      verificationId,
      otp
    });
  } catch (error) {
    console.error('Aadhar OTP verification failed:', error);
    throw error;
  }
};