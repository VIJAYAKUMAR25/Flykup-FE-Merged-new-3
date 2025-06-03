import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import config from "../api/config";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import Logo from '../../public/Logo-Flikup-Black.png';

const SignUp = ({ toggleTheme, theme }) => {
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef(null);

  // Validate email with regex
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Toggle password visibility
  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const toggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Validate form on input change
  useEffect(() => {
    if (!touched.email && !touched.password && !touched.confirmPassword) return;

    const newErrors = {};

    if (touched.email && email.trim() !== "" && !isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (touched.password && password.trim() !== "" && password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (touched.confirmPassword && confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
  }, [email, password, confirmPassword, touched]);

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    // Mark all fields as touched for validation
    setTouched({
      name: true,
      mobileNumber: true,
      email: true,
      password: true,
      confirmPassword: true
    });

    // Validate all fields
    const newErrors = {};

    if (name.trim() === "") {
      newErrors.name = "Name is required";
    }

    if (mobileNumber.trim() === "") {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (!/^\d{10}$/.test(mobileNumber.trim())) {
      newErrors.mobileNumber = "Please enter a valid 10 digit mobile number";
    }

    if (email.trim() === "") {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (password.trim() === "") {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (confirmPassword.trim() === "") {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    // If there are errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      // Post the registration data to the API
      const response = await axios.post(
        `${config.backendUrl}/api/auth/register`,
        {
          name,
          email,
          mobileNumber,
          password,
        }
      );

      toast.success("Registration successful! Welcome to FlykUp!");

      // Redirect to profile/dashboard on successful registration
      navigate("/profile");
    } catch (err) {
      const errorMessage =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Registration failed. Please try again.";

      toast.error(errorMessage);
    }
  };

  const inputClasses = (fieldName) =>
    `w-full px-4 py-3 rounded-lg border ${errors[fieldName]
      ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
      : "border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
    } transition-all duration-200 bg-white text-gray-800`;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-stone-900 to-stone-800 font-montserrat" style={{scrollbarWidth: 'none'}}>

      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="https://flykup.in/path-to-your-poster.jpg"
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source
          src="https://flykup.in/wp-content/uploads/2025/02/3a49bb548b7c4f08b3a47eb4447beaaa.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* Enhanced overlay gradient for better contrast */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-black/60 to-black/40" />

      <div className="flex-1 flex flex-col justify-center items-center z-10 px-4 py-8">
        {/* Signup Form Container - Wider with better spacing */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-4xl transition-all duration-300 hover:shadow-yellow-200/20">
          <div className="flex flex-col items-center justify-center mb-8">
            <h1 className="hidden text-4xl font-bold mb-2">
              <span className="text-yellow-500">Flyk</span>
              <span className="text-gray-800">Up</span>
            </h1>
                 <img src={Logo} alt="Logo" className="w-[220px] h-[100px]" />
            <p className="text-gray-600 text-lg">
              Create your Giveaway account
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-6">
            {/* Grid Layout for form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => handleBlur("name")}
                  className={inputClasses("name")}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <input
                  type="Number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  onBlur={() => handleBlur("mobileNumber")}
                  className={inputClasses("mobileNumber")}
                  placeholder="Enter your mobile number"
                />
                {errors.mobileNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.mobileNumber}</p>
                )}
              </div>

              {/* Email Address - Full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur("email")}
                  className={inputClasses("email")}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur("password")}
                    className={`${inputClasses("password")} pr-12`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={togglePassword}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => handleBlur("confirmPassword")}
                    className={`${inputClasses("confirmPassword")} pr-12`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPassword}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Submit Button - Enhanced with better styling */}
            <div className="mt-8">
              <button
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg text-lg"
              >
                Create Account
              </button>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-md">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-yellow-500 hover:text-yellow-600 font-medium transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;