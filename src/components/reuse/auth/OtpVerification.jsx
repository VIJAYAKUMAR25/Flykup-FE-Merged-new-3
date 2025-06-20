// import React, { useState, useEffect } from 'react';
// import { IoMdCloseCircleOutline } from "react-icons/io";
// import { Link, useNavigate } from 'react-router-dom';
// import { RESEND_OTP, VERIFY_OTP } from '../../api/apiDetails';
// import axiosInstance from '../../../utils/axiosInstance';
// import { useAuth } from '../../../context/AuthContext';

// const OtpVerification = ({ phone, email }) => {
//   const [otp, setOtp] = useState(['', '', '', '', '', '']);
//   const [error, setError] = useState('');
//   const [timer, setTimer] = useState(60);
//   const navigate = useNavigate();
//   const { setUser } = useAuth();

//   useEffect(() => {
//     const countdown = timer > 0 && setInterval(() => setTimer(timer - 1), 1000);
//     return () => clearInterval(countdown);
//   }, [timer]);

//   const handleOtpChange = (index, value) => {
//     // Handle pasted content
//     if (value.length > 1) {
//       const pastedData = value.slice(0, 6).split('');
//       const newOtp = [...otp];

//       // Always fill from the first box (index 0)
//       pastedData.forEach((digit, i) => {
//         if (i < 6 && !isNaN(digit)) {
//           newOtp[i] = digit;
//         }
//       });

//       setOtp(newOtp);

//       // Focus the next empty input after the last filled box
//       const nextEmptyIndex = newOtp.findIndex(digit => !digit);
//       if (nextEmptyIndex !== -1) {
//         document.getElementById(`otp-${nextEmptyIndex}`)?.focus();
//       } else {
//         document.getElementById(`otp-5`)?.focus();
//       }
//       return;
//     }

//     // Handle single digit input
//     if (isNaN(value) && value !== '') return;

//     const newOtp = [...otp];
//     newOtp[index] = value;

//     // If entering a digit and there are empty previous boxes
//     if (value !== '') {
//       const emptyPreviousIndex = newOtp.findIndex((digit, i) => i < index && !digit);
//       if (emptyPreviousIndex !== -1) {
//         newOtp[emptyPreviousIndex] = value;
//         newOtp[index] = '';
//         document.getElementById(`otp-${emptyPreviousIndex + 1}`)?.focus();
//         setOtp(newOtp);
//         return;
//       }
//     }

//     setOtp(newOtp);

//     // Auto-focus next input
//     if (value !== '' && index < 5) {
//       document.getElementById(`otp-${index + 1}`)?.focus();
//     }
//   };

//   const handleKeyDown = (index, e) => {
//     // Handle backspace
//     if (e.key === 'Backspace') {
//       e.preventDefault();
//       const newOtp = [...otp];

//       if (!newOtp[index]) {
//         // If current box is empty, clear and focus previous box
//         if (index > 0) {
//           newOtp[index - 1] = '';
//           document.getElementById(`otp-${index - 1}`)?.focus();
//         }
//       } else {
//         // Clear current box
//         newOtp[index] = '';
//       }

//       setOtp(newOtp);
//     }

//     // Handle left arrow
//     if (e.key === 'ArrowLeft' && index > 0) {
//       document.getElementById(`otp-${index - 1}`)?.focus();
//     }

//     // Handle right arrow
//     if (e.key === 'ArrowRight' && index < 5) {
//       document.getElementById(`otp-${index + 1}`)?.focus();
//     }
//   };

//   // Handle focus on input
//   const handleFocus = (index, e) => {
//     // If there are empty previous boxes, focus the first empty box
//     const emptyPreviousIndex = otp.findIndex((digit, i) => i < index && !digit);
//     if (emptyPreviousIndex !== -1) {
//       document.getElementById(`otp-${emptyPreviousIndex}`)?.focus();
//     }

//     // Select the content of the input when focused
//     e.target.select();
//   };

//   const handleResendOTP = async () => {
//     if (timer === 0) {
//       try {
//         // Add your resend OTP API call here
//         const { data } = await axiosInstance.post(RESEND_OTP,{
//           emailId: email
//         })

//           setTimer(60);
//           setError('');

//       } catch (error) {
//         setError( error.response?.data?.message || 'Failed to resend OTP. Please try again.');
//       }
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if(!email){
//       console.log("Email not found");
//       return;
//     }

//     const otpValue = otp.join('');

//     if (otpValue.length !== 6) {
//       setError('Please enter a valid 6-digit OTP');
//       return;
//     }

//     try {
//       const { data } = await axiosInstance.post(VERIFY_OTP,{
//         otp: otpValue,
//         emailId: email
//       });

//       if (data.status) {
//         setUser(data.data);
//         navigate('/profile');
//       }
//     } catch (error) {
//       console.warn("Error in OTP Verification:", error)
//       setError( error.response?.data?.message || "Failed to verify OTP. Try again later.");
//     }
//   };

//   return (
//     <div className=" mt-5 p-1">
//       <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
//         <div className='flex justify-between'>
//           <h2 className="text-2xl font-bold text-center mb-6 text-primaryNavy">Verify OTP</h2>
//           <Link className="text-black" to={"/"}>
//             <IoMdCloseCircleOutline className="w-7 h-7 bg-slate-200 rounded-full transform hover:rotate-90 transition duration-300" />
//           </Link>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="text-center space-y-2">
//             <p className="text-sm text-gray-600">
//               Enter the verification code we sent to
//             </p>
//             <p className="font-medium">{phone || email}</p>
//           </div>

//           <div className="flex justify-center space-x-1">
//             {otp.map((digit, index) => (
//               <input
//                 key={index}
//                 id={`otp-${index}`}
//                 type="text"
//                 inputMode="numeric"
//                 value={digit}
//                 onChange={(e) => handleOtpChange(index, e.target.value)}
//                 onKeyDown={(e) => handleKeyDown(index, e)}
//                 onFocus={(e) => handleFocus(index, e)}
//                 className="w-12 h-12 text-center border bg-inputYellow text-primaryBlack font-bold border-gray-300 rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 maxLength={6}
//               />
//             ))}
//           </div>

//           {error && (
//             <p className="text-center text-sm text-red-600">{error}</p>
//           )}

//           <button
//             type="submit"
//             className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
//           >
//             Verify
//           </button>

//           <div className="text-center space-y-2">
//             <p className="text-sm text-gray-600">
//               Didn't receive the code?{' '}
//               <button
//                 type="button"
//                 onClick={handleResendOTP}
//                 className={`font-bold ${timer === 0 ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 cursor-not-allowed'}`}
//                 disabled={timer > 0}
//               >
//                 Resend
//               </button>
//             </p>
//             {timer > 0 && (
//               <p className="text-sm text-gray-500">
//                 Resend code in {timer} seconds
//               </p>
//             )}
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default OtpVerification;
import React, { useState, useEffect } from "react";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { Link, useNavigate } from "react-router-dom";
import { RESEND_OTP, VERIFY_OTP } from "../../api/apiDetails";
import axiosInstance from "../../../utils/axiosInstance";
import { useAuth } from "../../../context/AuthContext";

const OtpVerification = ({ phone, email, onViewChange, isModal = false }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);
  const navigate = useNavigate();
  const { setUser, saveTokens } = useAuth();

  useEffect(() => {
    const countdown = timer > 0 && setInterval(() => setTimer(timer - 1), 1000);
    return () => clearInterval(countdown);
  }, [timer]);

  const handleOtpChange = (index, value) => {
    // Handle pasted content
    if (value.length > 1) {
      const pastedData = value.slice(0, 6).split("");
      const newOtp = [...otp]; // Always fill from the first box (index 0)
      pastedData.forEach((digit, i) => {
        if (i < 6 && !isNaN(digit)) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp); // Focus the next empty input after the last filled box

      const nextEmptyIndex = newOtp.findIndex((digit) => !digit);
      if (nextEmptyIndex !== -1) {
        document.getElementById(`otp-${nextEmptyIndex}`)?.focus();
      } else {
        document.getElementById(`otp-5`)?.focus();
      }
      return;
    } // Handle single digit input

    if (isNaN(value) && value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = value; // If entering a digit and there are empty previous boxes

    if (value !== "") {
      const emptyPreviousIndex = newOtp.findIndex(
        (digit, i) => i < index && !digit
      );
      if (emptyPreviousIndex !== -1) {
        newOtp[emptyPreviousIndex] = value;
        newOtp[index] = "";
        document.getElementById(`otp-${emptyPreviousIndex + 1}`)?.focus();
        setOtp(newOtp);
        return;
      }
    }

    setOtp(newOtp); // Auto-focus next input

    if (value !== "" && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];
      if (!newOtp[index]) {
        // If current box is empty, clear and focus previous box
        if (index > 0) {
          newOtp[index - 1] = "";
          document.getElementById(`otp-${index - 1}`)?.focus();
        }
      } else {
        // Clear current box
        newOtp[index] = "";
      }
      setOtp(newOtp);
    } // Handle left arrow
    if (e.key === "ArrowLeft" && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    } // Handle right arrow
    if (e.key === "ArrowRight" && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }; // Handle focus on input

  const handleFocus = (index, e) => {
    // If there are empty previous boxes, focus the first empty box
    const emptyPreviousIndex = otp.findIndex((digit, i) => i < index && !digit);
    if (emptyPreviousIndex !== -1) {
      document.getElementById(`otp-${emptyPreviousIndex}`)?.focus();
    } // Select the content of the input when focused
    e.target.select();
  };

  const handleResendOTP = async () => {
    if (timer === 0) {
      try {
        const { data } = await axiosInstance.post(RESEND_OTP, {
          emailId: email,
        });

        setTimer(60);
        setError("");
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to resend OTP. Please try again."
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      console.log("Email not found");
      return;
    }
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    try {
      const { data } = await axiosInstance.post(VERIFY_OTP, {
        otp: otpValue,
        emailId: email,
      });
      if (data.status) {
        // Save tokens to localStorage
        saveTokens(data.accessToken, data.refreshToken);
        setUser(data.data);
        if (!isModal) {
          navigate("/user");
        } // If modal, the parent component will handle the success and user stays on current page
      }
    } catch (error) {
      console.warn("Error in OTP Verification:", error);
      setError(
        error.response?.data?.message ||
          "Failed to verify OTP. Try again later."
      );
    }
  };

  const handleBackToLogin = () => {
    if (isModal && onViewChange) {
      onViewChange("login");
    } else {
      navigate("/auth/login-email");
    }
  };

  return (
    <div className={`${isModal ? "w-full" : "mt-5 p-1"}`}>
           {" "}
      <div
        className={`w-full max-w-md ${
          isModal ? "bg-transparent" : "bg-white"
        } rounded-lg ${!isModal ? "shadow-md" : ""} ${isModal ? "p-0" : "p-6"}`}
      >
               {" "}
        {!isModal && (
          <div className="flex justify-between">
                       {" "}
            <h2 className="text-2xl font-bold text-center mb-6 text-primaryNavy">
              Verify OTP
            </h2>
                       {" "}
            <Link className="text-black" to={"/"}>
                           {" "}
              <IoMdCloseCircleOutline className="w-7 h-7 bg-slate-200 rounded-full transform hover:rotate-90 transition duration-300" />
                         {" "}
            </Link>
                     {" "}
          </div>
        )}
               {" "}
        <form onSubmit={handleSubmit} className="space-y-6">
                   {" "}
          <div className="text-center space-y-2">
                       {" "}
            <p
              className={`text-sm ${
                isModal ? "text-gray-300" : "text-gray-600"
              }`}
            >
                            Enter the verification code we sent to            {" "}
            </p>
                       {" "}
            <p
              className={`font-medium ${
                isModal ? "text-whiteLight" : "text-gray-800"
              }`}
            >
              {phone || email}
            </p>
                     {" "}
          </div>
                   {" "}
          <div className="flex justify-center space-x-1">
                       {" "}
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={(e) => handleFocus(index, e)}
                className={`w-12 h-12 text-center border ${
                  isModal
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-inputYellow text-primaryBlack border-gray-300"
                } font-bold rounded-md text-lg focus:outline-none focus:ring-2 ${
                  isModal ? "focus:ring-amber-300" : "focus:ring-blue-500"
                }`}
                maxLength={6}
              />
            ))}
                     {" "}
          </div>
                   {" "}
          {error && (
            <p
              className={`text-center text-sm ${
                isModal ? "text-red-400" : "text-red-600"
              }`}
            >
              {error}
            </p>
          )}
                   {" "}
          <button
            type="submit"
            className={`w-full ${
              isModal
                ? "bg-newYellow text-blackDark hover:bg-amber-300"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } py-2 px-4 rounded-md focus:outline-none focus:ring-2 ${
              isModal ? "focus:ring-amber-300" : "focus:ring-blue-500"
            } focus:ring-offset-2 transition-colors`}
          >
            Verify {" "}
          </button>
        {" "}
          <div className="text-center space-y-2">
            {" "}
            <p
              className={`text-sm ${
                isModal ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Didn't receive the code?{" "}
              <button
                type="button"
                onClick={handleResendOTP}
                className={`font-bold ${
                  timer === 0
                    ? isModal
                      ? "text-green-400 hover:text-green-300"
                      : "text-blue-600 hover:text-blue-800"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                disabled={timer > 0}
              >
                Resend{" "}
              </button>
              {timer > 0 && ` (${timer}s)`}{" "}
              {/* Changed !canResend to timer > 0 */}{" "}
            </p>{" "}
            {isModal && (
              <p className="text-sm text-gray-300">
                Want to try a different email?{" "}
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-newYellow hover:text-amber-300"
                >
                  Back to Login {" "}
                </button>
                {" "}
              </p>
            )}
            {" "}
          </div>
          {" "}
        </form>
        {" "}
      </div>
      {" "}
    </div>
  );
};

export default OtpVerification;
