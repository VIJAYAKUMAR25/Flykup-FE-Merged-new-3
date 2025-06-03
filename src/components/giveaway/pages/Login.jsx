import React, { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import config from "../api/config";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import Logo from "../../public/Logo-Flikup-Black.png";
import GoogleAuth from "../components/GoogleAuth";

const Login = ({ toggleTheme, theme, onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // API integration for email/password login
      const response = await axios.post(
        `${config.backendUrl}/api/auth/login`,
        { email, password }
      );

      // Proceed only if the response status is 200
      if (response.status === 200) {
        // Store user data from response
        const userData = response.data.user || { email };
        localStorage.setItem("flykupUser", JSON.stringify(userData));

        // Store token if available
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }

        toast.success("Login successful");

        // Call the onLogin callback if provided
        if (onLogin) onLogin();

        // Redirect to profile
        navigate("/profile");
      } else {
        // In case status is not 200, show error
        const errorMessage = "Login failed. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Invalid credentials. Please try again.";
      setError(errorMessage);
      // Optionally, toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-gradient-to-br from-stone-900 to-stone-800 font-montserrat">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="https://flykup.in/path-to-your-poster.jpg"
        className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
      >
        <source
          src="https://flykup.in/wp-content/uploads/2025/02/3a49bb548b7c4f08b3a47eb4447beaaa.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* Optional overlay gradient for better contrast */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-black/50 to-black/30 rounded-lg" />

      {/* Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center z-10 px-4 py-8">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transition-all duration-300 hover:shadow-yellow-200/10">
          <div className="flex items-center justify-center mb-8">
            <div className="flex flex-col items-center justify-center gap-2">
              <h1 className="hidden text-4xl font-bold">
                <span className="text-yellow-500">Flyk</span>
                <span className="text-gray-800">Up</span>
              </h1>
              <img src={Logo} alt="Logo" className="w-[220px] h-[100px]" />
              <p className="md:text-md text-sm text-gray-600">
                Login to Giveaway dashboard
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="hidden justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-yellow-500 hover:text-yellow-600 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <hr className="flex-grow border-t border-gray-300" />
            <span className="mx-4 text-gray-500 text-sm">OR</span>
            <hr className="flex-grow border-t border-gray-300" />
          </div>

          {/* Google Authentication */}
          <div className="w-full">
            <GoogleAuth onLogin={onLogin} />
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 md:text-md text-sm">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-yellow-500 hover:text-yellow-600 font-medium transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
