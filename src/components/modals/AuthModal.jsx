import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Login from '../reuse/auth/login';
import Register from '../reuse/auth/register';
import OtpVerification from '../reuse/auth/OtpVerification';
import ForgotPassword from '../reuse/auth/ForgotPassword';
import AuthContainer from '../reuse/auth/AuthContainer';
import { useAuth } from '../../context/AuthContext';

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('login');
  const [inputData, setInputData] = useState({
    name: "", 
    email: "", 
    password: "", 
    mobile_number: "",
  });

  // Reset view when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentView('login');
      setInputData({
        name: "", 
        email: "", 
        password: "", 
        mobile_number: "",
      });
    }
  }, [isOpen]);

  // Handle successful authentication
  useEffect(() => {
    if (user && isOpen) {
      onSuccess(user);
    }
  }, [user, isOpen, onSuccess]);

  // Handle view changes
  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  // Handle modal close
  const handleClose = () => {
    setCurrentView('login');
    setInputData({
      name: "", 
      email: "", 
      password: "", 
      mobile_number: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (currentView) {
      case 'login': return 'Login Required';
      case 'register': return 'Create Account';
      case 'otp': return 'Verify Account';
      case 'forgot': return 'Reset Password';
      case 'reset': return 'Set New Password';
      default: return 'Authentication';
    }
  };

  const getSubtitle = () => {
    switch (currentView) {
      case 'login': return 'Please login to continue with this action.';
      case 'register': return 'Create an account to get started.';
      case 'otp': return "We've sent a verification code to your email.";
      case 'forgot': return 'Enter your email to reset your password.';
      case 'reset': return 'Create a new password for your account.';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-blackDark rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-whiteLight">
            {getTitle()}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Subtitle */}
          <p className="text-gray-300 mb-4 text-sm">
            {getSubtitle()}
          </p>

          {/* Login View */}
          {currentView === 'login' && (
            <div>
              <Login 
                inputData={inputData} 
                setInputData={setInputData}
                onViewChange={handleViewChange}
                isModal={true}
              />
              
              {/* Social Auth */}
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-blackDark px-2 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="mt-3">
                  <AuthContainer isModal={true} />
                </div>
              </div>
            </div>
          )}

          {/* Register View */}
          {currentView === 'register' && (
            <div>
              <Register 
                inputData={inputData} 
                setInputData={setInputData}
                onViewChange={handleViewChange}
                isModal={true}
              />
              
              {/* Social Auth for Register */}
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-blackDark px-2 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="mt-3">
                  <AuthContainer isModal={true} />
                </div>
              </div>
            </div>
          )}

          {/* OTP Verification View */}
          {currentView === 'otp' && (
            <OtpVerification 
              phone={inputData?.mobile_number} 
              email={inputData?.email}
              onViewChange={handleViewChange}
              isModal={true}
            />
          )}

          {/* Forgot Password View */}
          {currentView === 'forgot' && (
            <ForgotPassword 
              onViewChange={handleViewChange}
              isModal={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;