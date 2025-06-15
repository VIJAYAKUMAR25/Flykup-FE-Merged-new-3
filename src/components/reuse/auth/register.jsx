// import { useState } from "react";
// import "react-phone-input-2/lib/style.css";
// import { Eye, EyeOff, ArrowLeft } from "lucide-react"; // Import ArrowLeft
// import { Link, useNavigate } from "react-router-dom";
// import LoadingSpinner from "../../resources/Loader"; // Assuming this path is correct
// import AuthContainer from "./AuthContainer"; // Assuming this path is correct
// import { SIGNUP } from "../../api/apiDetails"; // Assuming this path is correct
// import axiosInstance from "../../../utils/axiosInstance"; // Assuming this path is correct

// const Register = ({ inputData, setInputData }) => {
//   const navigate = useNavigate();
//   const [isLoading, setIsLoading] = useState(false);

//   const [formData, setFormData] = useState({
//     fullName: "",
//     email: "",
//     password: "",
//     reenterPassword: "",
//   });

//   const [errors, setErrors] = useState({
//     fullName: "",
//     email: "",
//     password: "",
//     reenterPassword: "",
//     general: "",
//   });

//   const [showPassword, setShowPassword] = useState(false);
//   const [showReenterPassword, setShowReenterPassword] = useState(false);

//   const validateFullName = (name) => {
//     if (!name.trim()) return "*Full name is required";
//     if (name.trim().length < 3)
//       return "*Full name must be at least 3 characters";
//     if (!/^[a-zA-Z0-9\s]*$/.test(name))
//       return "*Full name can only contain letters, numbers, and spaces";
//     return "";
//   };

//   const validateEmail = (email) => {
//     if (!email) return "**Email is required";
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) return "**Please enter a valid email address";
//     return "";
//   };

//   const validatePassword = (password) => {
//     if (!password) return "*Password is required";
//     if (password.length < 8) return "*Password must be at least 8 characters";
//     if (!/[A-Z]/.test(password))
//       return "*Password must contain at least one uppercase letter";
//     if (!/[a-z]/.test(password))
//       return "*Password must contain at least one lowercase letter";
//     if (!/[0-9]/.test(password))
//       return "*Password must contain at least one number";
//     if (!/[!@#$%^&*]/.test(password))
//       return "*Password must contain at least one special character (!@#$%^&*)";
//     return "";
//   };

//   const validateReenterPassword = (reenterPassword, password) => {
//     if (!reenterPassword) return "*Re-enter password is required";
//     if (reenterPassword !== password) return "*Passwords do not match";
//     return "";
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));

//     let error = "";
//     switch (name) {
//       case "fullName":
//         error = validateFullName(value);
//         break;
//       case "email":
//         error = validateEmail(value);
//         break;
//       case "password":
//         error = validatePassword(value);
//         setErrors((prev) => ({
//           ...prev,
//           reenterPassword: validateReenterPassword(
//             formData.reenterPassword,
//             value
//           ),
//         }));
//         break;
//       case "reenterPassword":
//         error = validateReenterPassword(value, formData.password);
//         break;
//       default:
//         break;
//     }

//     setErrors((prev) => ({
//       ...prev,
//       [name]: error,
//       general: "",
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const newErrors = {
//       fullName: formData.fullName
//         ? validateFullName(formData.fullName)
//         : "Full name is required",
//       email: formData.email ? validateEmail(formData.email) : "Email is required",
//       password: formData.password
//         ? validatePassword(formData.password)
//         : "Password is required",
//       reenterPassword: formData.reenterPassword
//         ? validateReenterPassword(formData.reenterPassword, formData.password)
//         : "Re-enter password is required",
//     };

//     setErrors(newErrors);

//     if (Object.values(newErrors).every((error) => error === "")) {
//       setIsLoading(true);
//       try {
//         const { data } = await axiosInstance.post(SIGNUP, {
//           name: formData.fullName,
//           emailId: formData.email,
//           password: formData.password,
//         });

//         setInputData((prev) => ({
//           ...prev,
//           email: formData.email,
//         }));

//         navigate("/auth/verify-email");
//       } catch (error) {
//         console.error("Registration error:", error);
//         setErrors((prev) => ({
//           ...prev,
//           general:
//             error.response?.data?.message ||
//             "An error occurred during registration.",
//         }));
//       } finally {
//         setIsLoading(false);
//       }
//     }
//   };

//   return (
//     <div className="w-full bg-blackLight">
//       <div className="min-h-full w-full md:w-[500px] sm:w-[320px] bg-transparant flex justify-center p-1">
//         <div className="w-full max-w-sm rounded-lg">
          
//           {/* End of Back button */}
//           <div className="relative flex pb-3">
//             <Link to="/auth/" className="absolute left-0 pt-3 flex items-center text-newYellow hover:text-amber-300 transition-transform duration-300 hover:animate-pulse hover:-translate-x-2">
//               <ArrowLeft className="h-5 w-5" />
//             </Link>
//             <div className="flex-1 text-center">
//               <h1 className="text-3xl font-thin text-whiteLight tracking-widest">
//                 SIGN<span className="font-black text-newYellow">UP</span>
//               </h1>
//               <div className="w-24 h-px bg-gradient-to-r from-transparent via-newYellow to-transparent mx-auto"></div>
//             </div>
//           </div>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             {errors.general && (
//               <div
//                 className={`p-3 border rounded-md text-center mb-4 ${
//                   errors.general.includes("sent")
//                     ? "bg-green-100 border-green-400 text-green-700"
//                     : "bg-red-200 border-red-600 text-red-700"
//                 }`}
//               >
//                 {errors.general}
//               </div>
//             )}

//             <div className="space-y-4 sm:space-y-4 md:space-y-4 lg:space-y-3">
//               <div className="relative">
//                 <input
//                   id="fullName"
//                   name="fullName"
//                   type="text"
//                   value={formData.fullName}
//                   onChange={handleInputChange}
//                   placeholder=""
//                   className={`peer w-full px-4 py-2 border-2 rounded-lg bg-blackLight
//                     backdrop-blur-sm placeholder-transparent text-whiteLight font-semibold
//                     ${errors.fullName ? "border-red-400" : "border-gray-200"}
//                     focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20
//                     transition-all duration-200`}
//                 />
//                 <label
//                   htmlFor="fullName"
//                   className="absolute left-2 -top-2.5 px-2 text-sm font-medium bg-whiteLight rounded-xl
//                     text-gray-600 transition-all duration-200
//                     peer-placeholder-shown:text-base peer-placeholder-shown:text-blackDark
//                     peer-placeholder-shown:top-3 peer-placeholder-shown:left-4
//                     peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm
//                     peer-focus:text-blackDark"
//                 >
//                   Full Name
//                 </label>
//                 {errors.fullName && (
//                   <p className="mt-1.5 text-sm text-red-500 flex items-center">
//                     ✵{errors.fullName}
//                   </p>
//                 )}
//               </div>

//               <div className="relative">
//                 <input
//                   id="email"
//                   name="email"
//                   type="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   placeholder="ggrtgrt"
//                   className={`peer w-full px-4 py-2 border-2 rounded-lg bg-blackLight
//                     backdrop-blur-sm placeholder-transparent text-whiteLight font-semibold
//                     ${errors.email ? "border-red-400" : "border-gray-200"}
//                     focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20
//                     transition-all duration-200`}
//                   disabled={isLoading}
//                 />
//                 <label
//                   htmlFor="email"
//                   className="absolute left-2 -top-2.5 px-2 text-sm font-medium bg-whiteLight rounded-xl
//                     text-gray-600 transition-all duration-200
//                     peer-placeholder-shown:text-base peer-placeholder-shown:text-blackDark
//                     peer-placeholder-shown:top-3 peer-placeholder-shown:left-4
//                     peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm
//                     peer-focus:text-blackDark"
//                 >
//                   Email
//                 </label>
//                 {errors.email && (
//                   <p className="mt-1.5 text-sm text-red-500 flex items-center">
//                     ✵{errors.email}
//                   </p>
//                 )}
//               </div>

//               <div className="relative">
//                 <input
//                   id="password"
//                   name="password"
//                   type={showPassword ? "text" : "password"}
//                   value={formData.password}
//                   onChange={handleInputChange}
//                   placeholder=" "
//                   className={`peer w-full px-4 py-2 border-2 rounded-lg bg-blackLight
//                     backdrop-blur-sm placeholder-transparent text-whiteLight font-semibold
//                     ${errors.password ? "border-red-400" : "border-gray-200"}
//                     focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20
//                     transition-all duration-200`}
//                   disabled={isLoading}
//                 />
//                 <label
//                   htmlFor="password"
//                   className="absolute left-2 -top-2.5 px-2 text-sm font-medium bg-whiteLight rounded-xl
//                     text-gray-600 transition-all duration-200
//                     peer-placeholder-shown:text-base peer-placeholder-shown:text-blackDark
//                     peer-placeholder-shown:top-3 peer-placeholder-shown:left-4
//                     peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm
//                     peer-focus:text-blackDark"
//                 >
//                   Password
//                 </label>
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-6 -translate-y-1/2 p-1.5
//                     text-gray-400 hover:text-gray-600
//                     rounded-full hover:bg-gray-100/20
//                     transition-all duration-200"
//                 >
//                   {showPassword ? (
//                     <EyeOff className="h-5 w-5 text-newYellow bg-grey-100" />
//                   ) : (
//                     <Eye className="h-5 w-5 text-newYellow bg-grey-100" />
//                   )}
//                 </button>
//                 {errors.password && (
//                   <p className="mt-1.5 text-sm text-red-500 flex items-center">
//                     ✵{errors.password}
//                   </p>
//                 )}
//               </div>

//               <div className="relative">
//                 <input
//                   id="reenterPassword"
//                   name="reenterPassword"
//                   type={showReenterPassword ? "text" : "password"}
//                   value={formData.reenterPassword}
//                   onChange={handleInputChange}
//                   placeholder=" "
//                   className={`peer w-full px-4 py-2 border-2 rounded-lg bg-blackLight
//                     backdrop-blur-sm placeholder-transparent text-whiteLight font-semibold
//                     ${
//                       errors.reenterPassword
//                         ? "border-red-400"
//                         : "border-gray-200"
//                     }
//                     focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20
//                     transition-all duration-200`}
//                   disabled={isLoading}
//                 />
//                 <label
//                   htmlFor="reenterPassword"
//                   className="absolute left-2 -top-2.5 px-2 text-sm font-medium bg-whiteLight rounded-xl
//                     text-gray-600 transition-all duration-200
//                     peer-placeholder-shown:text-base peer-placeholder-shown:text-blackDark
//                     peer-placeholder-shown:top-3 peer-placeholder-shown:left-4
//                     peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm
//                     peer-focus:text-blackDark"
//                 >
//                   Re-enter Password
//                 </label>
//                 <button
//                   type="button"
//                   onClick={() => setShowReenterPassword(!showReenterPassword)}
//                   className="absolute right-3 top-6 -translate-y-1/2 p-1.5
//                     text-gray-400 hover:text-gray-600
//                     rounded-full hover:bg-gray-100/20
//                     transition-all duration-200"
//                 >
//                   {showReenterPassword ? (
//                     <EyeOff className="h-5 w-5 text-newYellow bg-grey-100" />
//                   ) : (
//                     <Eye className="h-5 w-5 text-newYellow bg-grey-100" />
//                   )}
//                 </button>
//                 {errors.reenterPassword && (
//                   <p className="mt-1.5 text-sm text-red-500 flex items-center">
//                     ✵{errors.reenterPassword}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={isLoading}
//               className="w-full font-semibold bg-newYellow text-blackDark py-3 px-4 rounded-md hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20 focus:ring-offset-2 transition-all duration-200 disabled:bg-amber-100 disabled:cursor-not-allowed hover:tracking-wider hover:font-blackLight tracking-tight"
//             >
//               {isLoading ? "Loading..." : "SIGN UP"}
//             </button>

//             <div className="text-center">
//               <span className="text-sm text-gray-200">
//                 Already have an account?{" "}
//               </span>
//               <Link to={"/auth/login-email"} className="text-sm text-newYellow hover:text-blue-600">
//                 Sign In
//               </Link>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;


import { useState } from "react";
import "react-phone-input-2/lib/style.css";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import LoadingSpinner from "../../resources/Loader";
import AuthContainer from "./AuthContainer";
import { SIGNUP } from "../../api/apiDetails";
import axiosInstance from "../../../utils/axiosInstance";

const Register = ({ inputData, setInputData }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    reenterPassword: "",
  });

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    reenterPassword: "",
    general: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showReenterPassword, setShowReenterPassword] = useState(false);

  const validateFullName = (name) => {
    if (!name.trim()) return "*Full name is required";
    if (name.trim().length < 3)
      return "*Full name must be at least 3 characters";
    if (!/^[a-zA-Z0-9\s]*$/.test(name))
      return "*Full name can only contain letters, numbers, and spaces";
    return "";
  };

  const validateEmail = (email) => {
    if (!email) return "**Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "**Please enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "*Password is required";
    if (password.length < 8) return "*Password must be at least 8 characters";
    if (!/[A-Z]/.test(password))
      return "*Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password))
      return "*Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password))
      return "*Password must contain at least one number";
    if (!/[!@#$%^&*]/.test(password))
      return "*Password must contain at least one special character (!@#$%^&*)";
    return "";
  };

  const validateReenterPassword = (reenterPassword, password) => {
    if (!reenterPassword) return "*Re-enter password is required";
    if (reenterPassword !== password) return "*Passwords do not match";
    return "";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    let error = "";
    switch (name) {
      case "fullName":
        error = validateFullName(value);
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "password":
        error = validatePassword(value);
        setErrors((prev) => ({
          ...prev,
          reenterPassword: validateReenterPassword(
            formData.reenterPassword,
            value
          ),
        }));
        break;
      case "reenterPassword":
        error = validateReenterPassword(value, formData.password);
        break;
      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
      general: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      fullName: formData.fullName
        ? validateFullName(formData.fullName)
        : "Full name is required",
      email: formData.email ? validateEmail(formData.email) : "Email is required",
      password: formData.password
        ? validatePassword(formData.password)
        : "Password is required",
      reenterPassword: formData.reenterPassword
        ? validateReenterPassword(formData.reenterPassword, formData.password)
        : "Re-enter password is required",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).every((error) => error === "")) {
      setIsLoading(true);
      try {
        const { data } = await axiosInstance.post(SIGNUP, {
          name: formData.fullName,
          emailId: formData.email,
          password: formData.password,
        });

        setInputData((prev) => ({
          ...prev,
          email: formData.email,
        }));

        navigate("/auth/verify-email");
      } catch (error) {
        console.error("Registration error:", error);
        setErrors((prev) => ({
          ...prev,
          general:
            error.response?.data?.message ||
            "An error occurred during registration.",
        }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="w-full bg-blackLight">
      <div className="min-h-full w-full md:w-[500px] sm:w-[320px] bg-transparant flex justify-center p-1">
        <div className="w-full max-w-sm rounded-lg">
          
          <div className="relative flex pb-3">
            <Link to="/auth/" className="absolute left-0 pt-3 flex items-center text-newYellow hover:text-amber-300 transition-transform duration-300 hover:animate-pulse hover:-translate-x-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-thin text-whiteLight tracking-widest">
                SIGN<span className="font-black text-newYellow">UP</span>
              </h1>
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-newYellow to-transparent mx-auto"></div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div
                className={`p-3 border rounded-md text-center mb-4 ${
                  errors.general.includes("sent")
                    ? "bg-green-100 border-green-400 text-green-700"
                    : "bg-red-200 border-red-600 text-red-700"
                }`}
              >
                {errors.general}
              </div>
            )}

            <div className="space-y-4 sm:space-y-4 md:space-y-4 lg:space-y-3">
              <div className="relative">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder=""
                  className={`peer w-full px-4 py-2 border-2 rounded-lg bg-blackLight
                    backdrop-blur-sm placeholder-transparent text-whiteLight font-semibold
                    ${errors.fullName ? "border-red-400" : "border-gray-200"}
                    focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20
                    transition-all duration-200`}
                />
                <label
                  htmlFor="fullName"
                  className="absolute left-2 -top-2.5 px-2 text-sm font-medium bg-whiteLight rounded-xl
                    text-gray-600 transition-all duration-200
                    peer-placeholder-shown:text-base peer-placeholder-shown:text-blackDark
                    peer-placeholder-shown:top-3 peer-placeholder-shown:left-4
                    peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm
                    peer-focus:text-blackDark"
                >
                  Full Name
                </label>
                {errors.fullName && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center">
                    ✵{errors.fullName}
                  </p>
                )}
              </div>

              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="ggrtgrt"
                  className={`peer w-full px-4 py-2 border-2 rounded-lg bg-blackLight
                    backdrop-blur-sm placeholder-transparent text-whiteLight font-semibold
                    ${errors.email ? "border-red-400" : "border-gray-200"}
                    focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20
                    transition-all duration-200`}
                  disabled={isLoading}
                />
                <label
                  htmlFor="email"
                  className="absolute left-2 -top-2.5 px-2 text-sm font-medium bg-whiteLight rounded-xl
                    text-gray-600 transition-all duration-200
                    peer-placeholder-shown:text-base peer-placeholder-shown:text-blackDark
                    peer-placeholder-shown:top-3 peer-placeholder-shown:left-4
                    peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm
                    peer-focus:text-blackDark"
                >
                  Email
                </label>
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center">
                    ✵{errors.email}
                  </p>
                )}
              </div>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder=" "
                  className={`peer w-full px-4 py-2 border-2 rounded-lg bg-blackLight
                    backdrop-blur-sm placeholder-transparent text-whiteLight font-semibold
                    ${errors.password ? "border-red-400" : "border-gray-200"}
                    focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20
                    transition-all duration-200`}
                  disabled={isLoading}
                />
                <label
                  htmlFor="password"
                  className="absolute left-2 -top-2.5 px-2 text-sm font-medium bg-whiteLight rounded-xl
                    text-gray-600 transition-all duration-200
                    peer-placeholder-shown:text-base peer-placeholder-shown:text-blackDark
                    peer-placeholder-shown:top-3 peer-placeholder-shown:left-4
                    peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm
                    peer-focus:text-blackDark"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-6 -translate-y-1/2 p-1.5
                    text-gray-400 hover:text-gray-600
                    rounded-full hover:bg-gray-100/20
                    transition-all duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-newYellow bg-grey-100" />
                  ) : (
                    <Eye className="h-5 w-5 text-newYellow bg-grey-100" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center">
                    ✵{errors.password}
                  </p>
                )}
              </div>

              <div className="relative">
                <input
                  id="reenterPassword"
                  name="reenterPassword"
                  type={showReenterPassword ? "text" : "password"}
                  value={formData.reenterPassword}
                  onChange={handleInputChange}
                  placeholder=" "
                  className={`peer w-full px-4 py-2 border-2 rounded-lg bg-blackLight
                    backdrop-blur-sm placeholder-transparent text-whiteLight font-semibold
                    ${
                      errors.reenterPassword
                        ? "border-red-400"
                        : "border-gray-200"
                    }
                    focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20
                    transition-all duration-200`}
                  disabled={isLoading}
                />
                <label
                  htmlFor="reenterPassword"
                  className="absolute left-2 -top-2.5 px-2 text-sm font-medium bg-whiteLight rounded-xl
                    text-gray-600 transition-all duration-200
                    peer-placeholder-shown:text-base peer-placeholder-shown:text-blackDark
                    peer-placeholder-shown:top-3 peer-placeholder-shown:left-4
                    peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm
                    peer-focus:text-blackDark"
                >
                  Re-enter Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowReenterPassword(!showReenterPassword)}
                  className="absolute right-3 top-6 -translate-y-1/2 p-1.5
                    text-gray-400 hover:text-gray-600
                    rounded-full hover:bg-gray-100/20
                    transition-all duration-200"
                >
                  {showReenterPassword ? (
                    <EyeOff className="h-5 w-5 text-newYellow bg-grey-100" />
                  ) : (
                    <Eye className="h-5 w-5 text-newYellow bg-grey-100" />
                  )}
                </button>
                {errors.reenterPassword && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center">
                    ✵{errors.reenterPassword}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full font-semibold bg-newYellow text-blackDark py-3 px-4 rounded-md hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20 focus:ring-offset-2 transition-all duration-200 disabled:bg-amber-100 disabled:cursor-not-allowed hover:tracking-wider hover:font-blackLight tracking-tight"
            >
              {isLoading ? "Loading..." : "SIGN UP"}
            </button>

            <div className="text-center">
              <span className="text-sm text-gray-200">
                Already have an account?{" "}
              </span>
              <Link to={"/auth/login-email"} className="text-sm text-newYellow hover:text-blue-600">
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;






