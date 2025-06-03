import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { FaSpinner } from 'react-icons/fa';
import { FORGOT_PASSWORD_REQUEST, RESET_PASSWORD, VERIFY_FORGOT_PASSWORD_OTP } from '../../api/apiDetails';
import { IoEye, IoEyeOff } from 'react-icons/io5';
import { CheckCircle, ArrowRight, LockKeyhole, Shield } from 'lucide-react';
import axiosInstance from '../../../utils/axiosInstance';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let intervalId;
    if (step === 2 && !canResend) {
      intervalId = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [step, canResend]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleBack = () => {
    setStep(step - 1);
    setCanResend(false);
    setCountdown(60);
  };

  const sendOtpRequest = async () => {
    const response = await axiosInstance.post(FORGOT_PASSWORD_REQUEST, { emailId: email });
    return response;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setIsSendingOtp(true);
    try {
      await sendOtpRequest();
      setStep(2);
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    if (!canResend || !validateEmail(email)) return;

    setIsSendingOtp(true);
    try {
      await sendOtpRequest();
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const response = await axiosInstance.post(VERIFY_FORGOT_PASSWORD_OTP, { emailId: email, otp });
      if (response.status === 200) {
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsResettingPassword(true);
    try {
      const response = await axiosInstance.post(RESET_PASSWORD, { emailId: email, newPassword: password, confirmPassword });
      if (response.status === 200) {
        setStep(4);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center  ">
      <div className="w-full max-w-md space-y-1 bg-blackLight rounded-xl shadow-xl p-2">
        <div className="flex justify-between items-center">
          {step === 1 && (
            <button 
              onClick={() => navigate('/auth/login-email')} 
              className="group flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <IoArrowBackCircleOutline className="h-8 w-8 group-hover:text-blue-100 text-newYellow  transition-colors" /> 
              
            </button>
          )}
          {step > 1 && step !== 4 && (
            <button 
              onClick={handleBack} 
              className="group flex items-center gap-2 px-2  text-gray-600 hover:text-gray-800 transition-colors"
            >
              <IoArrowBackCircleOutline className="h-8 w-8 text-newYellow group-hover:text-whiteLight transition-colors" /> 
            </button>
          )}
        </div>

        <div className="text-center">
           <div className="text-center pb-3">
            <h1 className="text-2xl font-thin text-whiteLight tracking-wide mb-2 relative">
              RESET<span className="font-black text-newYellow"> PASSWORD</span>
            </h1>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-newYellow to-transparent mx-auto"></div>
          </div>
          <p className="text-whiteHalf">Step <span className='text-greenLight'>{step}</span> of 4</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 px-4 py-2 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className="peer w-full px-4 py-3 border-2 rounded-lg bg-blackDark
                  backdrop-blur-sm placeholder-transparent text-whiteLight font-bold
                  border-gray-500 focus:border-amber-300 focus:outline-none 
                  focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
              />
              <label
                className="absolute left-2 -top-2.5 px-2 text-sm font-medium bg-whiteLight rounded-xl
                    text-gray-600 transition-all duration-200
                    peer-placeholder-shown:text-base peer-placeholder-shown:text-blackDark
                    peer-placeholder-shown:top-3 peer-placeholder-shown:left-4
                    peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm
                    peer-focus:text-blackDark"
                >
                Email Address
              </label>
            </div>
            <button
              type="submit"
              disabled={isSendingOtp}
               className="w-full font-semibold bg-newYellow text-blackDark py-3 px-4 rounded-md hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20 focus:ring-offset-2 transition-all duration-200 disabled:bg-amber-100 disabled:cursor-not-allowed hover:tracking-wider hover:font-blackLight tracking-tight"
            >
              {isSendingOtp ? (
                <span className="flex items-center justify-center">
                  <FaSpinner className="animate-spin mr-2" /> 
                  Sending OTP...
                </span>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>
        )}

        {step === 2 && (
         <form onSubmit={handleVerifyOtp} className="space-y-3">
         <div className="flex flex-col items-center justify-center p-2 space-y-2">
           {/* Email SVG Icon */}
           <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              className="w-12 h-12 text-blue-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 8l-3-3H6L3 8m18 0l-9 6.5L3 8m18 0v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8m2-3v3h14V5" />
              <path className="text-blue-400" d="M7 15l5 3 5-3" opacity="0.5" />
            </svg>
       
           <div className="text-center space-y-1">
             <h1 className="text-xl font-bold text-whiteLight">Check your inbox</h1>
             <p className="text-gray-200 max-w-sm text-sm">
               We've sent a 6-digit OTP to your email address. 
               Please check your inbox and enter the code below.
             </p>
           </div>
       
           {/* Animated dots */}
           <div className="flex space-x-3">
             <span className="w-2 h-2 bg-newYellow rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
             <span className="w-2 h-2 bg-newYellow rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
             <span className="w-2 h-2 bg-newYellow rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
             <span className="w-2 h-2 bg-newYellow rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></span>
             <span className="w-2 h-2 bg-newYellow rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></span>
             <span className="w-2 h-2 bg-newYellow rounded-full animate-bounce" style={{ animationDelay: '750ms' }}></span>
           </div>
       
           <div className="relative w-full">
             <input
               type="text"
               value={otp}
               onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
               placeholder=" "
               maxLength={6}
               className="peer w-full px-4 py-2 border-2 text-whiteLight rounded-lg bg-blackDark 
                 backdrop-blur-sm placeholder-transparent text-center tracking-wider
                 border-gray-200 focus:border-amber-300 focus:outline-none 
                 focus:ring-2 focus:ring-blue-300/20 transition-all duration-200"
             />
             <label
                className="absolute left-2 -top-2.5 px-2 text-sm font-medium bg-whiteLight rounded-xl
                    text-gray-600 transition-all duration-200
                    peer-placeholder-shown:text-base peer-placeholder-shown:text-blackDark
                    peer-placeholder-shown:top-3 peer-placeholder-shown:left-4
                    peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm
                    peer-focus:text-blackDark"
             >
               Enter 6-digit OTP
             </label>
           </div>
       
           <button
             type="submit"
             disabled={isVerifyingOtp}
              className="w-full font-semibold bg-newYellow text-blackDark py-2 px-4 rounded-md hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20 focus:ring-offset-2 transition-all duration-200 disabled:bg-amber-100 disabled:cursor-not-allowed hover:tracking-wider hover:font-blackLight tracking-tight"
           >
             {isVerifyingOtp ? (
               <span className="flex items-center justify-center">
                 <FaSpinner className="animate-spin mr-2" /> 
                 Verifying OTP...
               </span>
             ) : (
               'Verify OTP'
             )}
           </button>
       
           <div className="text-center">
             <p className="text-sm text-gray-200">
               Didn't receive the OTP?{' '}
               <button
                 type="button"
                 onClick={handleResendOtp}
                 disabled={!canResend || isSendingOtp}
                 className={`font-medium ${
                   canResend ? 'text-green-400 hover:text-blue-500' : 'text-gray-300 cursor-not-allowed'
                 }`}
               >
                 {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                 {!canResend && ` (${countdown}s)`}
               </button>
             </p>
           </div>
         </div>
       </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-6 pt-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className="peer w-full px-4 py-3 border-2 text-whiteLight rounded-lg bg-blackDark 
                  backdrop-blur-sm placeholder-transparent
                  border-gray-600 focus:border-amber-300 focus:outline-none 
                  focus:ring-2 focus:ring-amber-300/20 transition-all duration-200"
              />
              <label
                 className="absolute left-2 -top-2.5 px-2 text-sm font-medium bg-whiteLight rounded-xl
                    text-gray-600 transition-all duration-200
                    peer-placeholder-shown:text-base peer-placeholder-shown:text-blackDark
                    peer-placeholder-shown:top-3 peer-placeholder-shown:left-4
                    peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm
                    peer-focus:text-blackDark"
              >
                New Password
              </label>
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <IoEyeOff className="w-5 h-5 text-newYellow" /> : <IoEye className="w-5 h-5 text-newYellow" />}
              </button>
            </div>
            
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder=" "
                className="peer w-full px-4 py-3 border-2 text-whiteLight rounded-lg bg-blackDark 
                  backdrop-blur-sm placeholder-transparent
                  border-gray-600 focus:border-amber-300 focus:outline-none 
                  focus:ring-2 focus:ring-amber-300/20 transition-all duration-200"
              />
              <label
                 className="absolute left-2 -top-2.5 px-2 text-sm font-medium bg-whiteLight rounded-xl
                    text-gray-600 transition-all duration-200
                    peer-placeholder-shown:text-base peer-placeholder-shown:text-blackDark
                    peer-placeholder-shown:top-3 peer-placeholder-shown:left-4
                    peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm
                    peer-focus:text-blackDark"
              >
                Confirm Password
              </label>
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <IoEyeOff className="w-5 h-5 text-amber-300" /> : <IoEye className="w-5 h-5 text-amber-300" />}
              </button>
            </div>
          
            <button
              type="submit"
              disabled={isResettingPassword}
              className="w-full font-semibold bg-newYellow text-blackDark py-2 px-4 rounded-md hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20 focus:ring-offset-2 transition-all duration-200 disabled:bg-amber-100 disabled:cursor-not-allowed hover:tracking-wider hover:font-blackLight tracking-tight"
            >
              {isResettingPassword ? (
                <span className="flex items-center justify-center">
                  <FaSpinner className="animate-spin mr-2" /> 
                  Resetting Password...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        {step === 4 && (
           <div className="min-h-[300px] flex items-center justify-center ">
           <div className="w-full max-w-md">
             {/* Success Animation Container */}
             <div className="relative">
               {/* Background Circles */}
               {/* <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-32 h-32 bg-grey-200 rounded-full animate-pulse"></div>
                 <div className="absolute w-48 h-48 bg-green-100/30 rounded-full animate-pulse delay-75"></div>
                 <div className="absolute w-64 h-64 bg-green-50/30 rounded-full animate-pulse delay-150"></div>
               </div> */}
     
               {/* Main Content */}
               <div className="relative text-center space-y-2">
                 {/* Success Icon */}
                 <div className="transform transition-all duration-500 hover:scale-110">
                   <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                     <CheckCircle className="h-10 w-10 text-white animate-bounce" />
                   </div>
                 </div>
     
                 {/* Text Content */}
                 <div className="">
                   <h3 className="text-2xl font-bold bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent">
                     Password Reset Successful
                   </h3>
                 </div>
     
                 {/* Security Features */}
                 <div className="flex justify-center space-x-4 py-1">
                   <div className="flex items-center space-x-2 text-gray-200">
                     <LockKeyhole className="w-5 h-5 text-green-500" />
                     <span className="text-sm ">Encrypted</span>
                   </div>
                   <div className="flex items-center space-x-2 text-gray-200">
                     <Shield className="w-5 h-5 text-green-500" />
                     <span className="text-sm">Protected</span>
                   </div>
                 </div>
     
                 {/* Action Button */}
                 <div className="">
                   <button
                     onClick={() => navigate('/auth/login-email')}
                      className="w-full font-semibold bg-newYellow text-blackDark py-2 px-4 rounded-md hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20 focus:ring-offset-2 transition-all duration-200 disabled:bg-amber-100 disabled:cursor-not-allowed hover:tracking-wider hover:font-blackLight tracking-tight"
                   >
                     <span className="flex items-center justify-center space-x-2">
                       <span>Continue to Login</span>
                       <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                     </span>
                   </button>
                 </div>
     
                 {/* Additional Message */}
                 <p className="text-sm text-gray-200 pt-2">
                   For enhanced security, please make sure to remember your new password
                 </p>
               </div>
             </div>
           </div>
         </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;