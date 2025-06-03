// import { useState } from "react";
//  import { Route, Routes, Link } from "react-router-dom";
//  import Login from '../components/reuse/auth/login.jsx';
//  import Register from '../components/reuse/auth/register.jsx';
//  import OtpVerification from "../components/reuse/auth/OtpVerification.jsx";
//  import ResetPassword from "../components/reuse/auth/ResetPassword.jsx";
//  import ForgotPassword from "../components/reuse/auth/ForgotPassword.jsx";
//  import Logo from '../assets/images/Logo-Flikup.png';
//  import { Navigate, useLocation } from "react-router-dom";
//  import { Play, ShoppingBag, Heart } from 'lucide-react';
//  import { useEffect, useRef } from "react";
//  import { useAuth } from "../context/AuthContext.jsx";
//  import FlykupLoader from "../components/resources/FlykupLoader.jsx";
//  import AuthImage from "../assets/images/Auth/Register.png"; // This will be the default
//  import RegisterImage from "../assets/images/Auth/RegisterImage.png";
//  import OTPScreen from "../assets/images/Auth/OTPScreen.png";

//  const LogoHeader = () => {
//    return (
//      <nav className="w-full bg-blackDark shadow-lg" style={{ position: 'sticky', top: 0, zIndex: "9999" }}>
//        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[80px]">
//          <Link to="/" className="flex items-center">
//            <img
//              src={Logo}
//              alt="Flikup Logo"
//              className="object-contain w-[120px] sm:w-[180px] md:w-[200px] h-[40px] sm:h-[50px] transition-transform duration-300 hover:scale-105"
//            />
//          </Link>
//        </div>
//      </nav>
//    );
//  };

//  // Modified AuthLayout to accept an `authBgImage` prop
//  const AuthLayout = ({ children, authBgImage }) => {
//    return (
//      <div className="w-full bg-blackDark flex flex-col min-h-screen lg:h-screen lg:overflow-hidden">
//        <LogoHeader />

//        <div className="flex-1 overflow-hidden py-1">
//          <div className="container mx-auto px-4 h-full">
//            <div className="flex flex-col-reverse lg:flex-row h-full max-w-6xl mx-auto bg-blackDark rounded-2xl shadow-lg overflow-hidden">
//              {/* Image Side */}
//              <div className="lg:w-1/2 h-[50vh] lg:h-full">
//                <img
//                  src={authBgImage} 
//                  alt="Welcome To Flykup"
//                  className="w-full h-full object-contain"
//                />
//              </div>
//              {/* Form Side */}
//              <div className="lg:w-1/2 bg-blackLight flex items-center justify-center lg:h-full h-[100vh] p-4 sm:p-6 md:p-8 lg:px-2">
//                <div className="w-full max-w-md">
//                  {children}
//                </div>
//              </div>
//            </div>
//          </div>
//        </div>
//      </div>
//    );
//  };

//  const Auth = ({ inputData, setInputData }) => {
//    const { user, loading } = useAuth();
//    const location = useLocation(); // Get the current location

//    // Determine which image to show based on the current path
//    const getAuthImage = () => {
//      if (location.pathname.includes("register")) {
//        return RegisterImage;
//      } else if (location.pathname.includes("verify-email") || location.pathname.includes("forgot-password")) {
//        return OTPScreen;
//      }
//      return AuthImage; // Default image for login and other paths
//    };

//    if (loading) {
//      return <FlykupLoader text="Checking authentication" />;
//    }

//    if (user) {
//      return <Navigate to="/" replace />;
//    }

//    return (
//      <AuthLayout authBgImage={getAuthImage()}> {/* Pass the determined image to AuthLayout */}
//        <div className="bg-transparent">
//          <Routes>
//            <Route
//              path="login"
//              element={<Login inputData={inputData} setInputData={setInputData} />}
//            />
//            <Route
//              path="register"
//              element={<Register inputData={inputData} setInputData={setInputData} />}
//            />
//            <Route
//              path="verify-email"
//              element={<OtpVerification phone={inputData?.mobile_number} email={inputData?.email} />}
//            />
//            <Route
//              path="reset-password"
//              element={<ResetPassword inputData={inputData} setInputData={setInputData} />}
//            />
//            <Route path="forgot-password" element={<ForgotPassword />} />
//            <Route path="*" element={<Navigate to="login" replace />} />
//          </Routes>
//        </div>
//      </AuthLayout>
//    );
//  };

//  export default Auth;


import { useState } from "react";
import { Route, Routes, Link } from "react-router-dom";
import Login from '../components/reuse/auth/login.jsx'; 
import Register from '../components/reuse/auth/Register.jsx';
import OtpVerification from "../components/reuse/auth/OtpVerification.jsx";
import ResetPassword from "../components/reuse/auth/ResetPassword.jsx";
import ForgotPassword from "../components/reuse/auth/ForgotPassword.jsx";
import WelcomeAuth from '../components/reuse/auth/WelcomeAuth.jsx'; // Import the new WelcomeAuth component
import Logo from '../assets/images/Logo-Flikup.png';
import { Navigate, useLocation } from "react-router-dom";
import { Play, ShoppingBag, Heart } from 'lucide-react';
import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import FlykupLoader from "../components/resources/FlykupLoader.jsx";
import AuthImage from "../assets/images/Auth/Register.png"; // This will be the default
import RegisterImage from "../assets/images/Auth/RegisterImage.png";
import OTPScreen from "../assets/images/Auth/OTPScreen.png";
import ForgotPasswordImage from "../assets/images/Auth/ForgotPassword.png";
const LogoHeader = () => {
   return (
     <nav className="w-full bg-blackDark shadow-lg" style={{ position: 'sticky', top: 0, zIndex: "9997" }}>
       <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[80px]">
         <Link to="/" className="flex items-center">
           <img
             src={Logo}
             alt="Flikup Logo"
             className="object-contain w-[120px] sm:w-[180px] md:w-[200px] h-[40px] sm:h-[50px] transition-transform duration-300 hover:scale-105"
           />
         </Link>
       </div>
     </nav>
   );
};

// Modified AuthLayout to accept an `authBgImage` prop
const AuthLayout = ({ children, authBgImage }) => {
   return (
     <div className="w-full bg-blackDark flex flex-col min-h-screen lg:h-screen lg:overflow-hidden">
       <LogoHeader />

       <div className="flex-1 overflow-hidden py-1">
         <div className="container mx-auto px-4 h-full">
           <div className="flex flex-col-reverse lg:flex-row h-full max-w-6xl mx-auto bg-blackDark rounded-2xl shadow-lg overflow-hidden">
             {/* Image Side */}
             <div className="lg:w-1/2 h-[50vh] lg:h-full">
               <img
                 src={authBgImage}
                 alt="Welcome To Flykup"
                 className="w-full h-full object-contain"
               />
             </div>
             {/* Form Side */}
             <div className="lg:w-1/2 bg-blackLight flex items-center justify-center lg:h-full h-[90vh] p-4 sm:p-6 md:p-8 lg:px-2">
               <div className="w-full max-w-md">
                 {children}
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
};

const Auth = ({ inputData, setInputData }) => {
   const { user, loading } = useAuth();
   const location = useLocation(); // Get the current location

   // Determine which image to show based on the current path
   const getAuthImage = () => {
     if (location.pathname.includes("register")) {
       return RegisterImage;
     } else if (location.pathname.includes("verify-email") || location.pathname.includes("reset-password")) { // Added reset-password
       return OTPScreen;
     }else if(location.pathname.includes("forgot-password")) {
       return ForgotPasswordImage;
     }
     // Default image for welcome page and login-email
     return AuthImage;
   };

   if (loading) {
     return <FlykupLoader text="Checking authentication" />;
   }

   if (user) {
     return <Navigate to="/" replace />;
   }

   return (
     <AuthLayout authBgImage={getAuthImage()}> 
       <div className="bg-transparent">
         <Routes>
           <Route path="/" element={<WelcomeAuth />} />
           <Route
             path="login-email" // New route for email/password login
             element={<Login inputData={inputData} setInputData={setInputData} />}
           />
           <Route
             path="register"
             element={<Register inputData={inputData} setInputData={setInputData} />}
           />
           <Route
             path="verify-email"
             element={<OtpVerification phone={inputData?.mobile_number} email={inputData?.email} />}
           />
           <Route
             path="reset-password"
             element={<ResetPassword inputData={inputData} setInputData={setInputData} />}
           />
           <Route path="forgot-password" element={<ForgotPassword />} />
           {/* Fallback to WelcomeAuth if an unknown path under /auth is hit */}
           <Route path="*" element={<Navigate to="" replace />} /> {/* Navigates to the base of /auth/ */}
         </Routes>
       </div>
     </AuthLayout>
   );
};

export default Auth;