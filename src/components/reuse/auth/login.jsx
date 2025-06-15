// import { useState } from "react"
// import { Link, useNavigate,Navigate } from "react-router-dom"
// import { Eye, EyeOff } from "lucide-react"
// import axiosInstance from "../../../utils/axiosInstance"
// import AuthContainer from "./AuthContainer"
// import { EMAIL_LOGIN } from "../../api/apiDetails"
// import { useAuth } from "../../../context/AuthContext"

// const Login = ({ inputData, setInputData }) => {
//   const navigate = useNavigate()
//   const [isLoading, setIsLoading] = useState(false);
//   const { setUser } = useAuth();

//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//   })

//   const [errors, setErrors] = useState({
//     email: "",
//     password: "",
//     general: "",
//   })

//   const [showPassword, setShowPassword] = useState(false)

//   const validateEmail = (email) => {
//     if (!email) return "Email is required"
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
//     if (!emailRegex.test(email)) return "Please enter a valid email address"
//     return ""
//   }

//   const validatePassword = (password) => {
//     if (!password) return "Password is required"
//     if (password.length < 8) return "Password must be at least 8 characters"
//     return ""
//   }

//   const handleInputChange = (e) => {
//     const { name, value } = e.target
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }))

//     setErrors((prev) => ({
//       ...prev,
//       [name]: name === "email" ? validateEmail(value) : validatePassword(value),
//       general: "",
//     }))
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()

//     const newErrors = {
//       email: formData.email ? validateEmail(formData.email) : "Email is required",
//       password: formData.password ? validatePassword(formData.password) : "Password is required",
//     }

//     setErrors(newErrors)

//     if (Object.values(newErrors).every((error) => error === "")) {
//       setIsLoading(true)
//       try {
//         const { data } = await axiosInstance.post(EMAIL_LOGIN, {
//           emailId: formData.email,
//           password: formData.password
//         });


//         if (data.action === "verifyOtp") {
//           setInputData((prev) => ({
//             ...prev,
//             email: formData.email,
//           }))

//           navigate("/auth/verify-email")
//         } else if (data.action === "login") {
//           setUser(data.data);
//           navigate("/profile");
//         }
//       } catch (error) {
//         console.error("Login error:", error)
//         setErrors((prev) => ({
//           ...prev,
//           general: error.response?.data?.message || "Invalid email or password",
//         }))
//       } finally {
//         setIsLoading(false)
//       }
//     }
//   }


//   return (
//     <div className="w-full bg-blackLight">
//       <div className="min-h-full  w-full w-[600px] md:w-[500px] sm:w-[320px] bg-transparant flex  justify-center p-1">
//         <div className="w-full max-w-sm rounded-lg ">
//          <div className="text-center pb-3">
//             <h1 className="text-3xl font-thin text-whiteLight tracking-widest mb-2 relative">
//               LOG<span className="font-black text-newYellow">IN</span>
//             </h1>
//             <div className="w-24 h-px bg-gradient-to-r from-transparent via-newYellow to-transparent mx-auto"></div>
//           </div>
//           <form onSubmit={handleSubmit} className="space-y-3">
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

//             <div className="space-y-4">
//               <div className="relative">
//                 <input
//                   id="email"
//                   name="email"
//                   type="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   placeholder=""
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
//                 {errors.email && <p className="mt-1.5 text-sm text-red-500 flex items-center">✵{errors.email}</p>}
//               </div>

//               <div className="relative">
//                 <input
//                   id="password"
//                   name="password"
//                   type={showPassword ? "text" : "password"}
//                   value={formData.password}
//                   onChange={handleInputChange}
//                   placeholder=" "
//                    className={`peer w-full px-4 py-2 border-2 rounded-lg bg-blackLight
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
//                 {errors.password && <p className="mt-1.5 text-sm text-red-500 flex items-center">✵{errors.password}</p>}
//               </div>
//             </div>

//             <div className="flex items-center justify-end">
//               <Link className="text-sm text-newYellow hover:text-blue-600" to={"/auth/forgot-password"}>
//                 Forgot Password?
//               </Link>
//             </div>

//            <button
//               type="submit"
//               disabled={isLoading}
//               className="w-full font-semibold bg-newYellow text-blackDark py-3 px-4 rounded-md hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:bg-amber-100 disabled:cursor-not-allowed hover:tracking-wider hover:font-blackLight tracking-tight"
//             >
//               {isLoading ? "Loading..." : "LOGIN"}
//             </button>

//             <div className="text-center">
//               <span className="text-sm text-gray-200">Don't have an account? </span>
//               <Link to={"/auth/register"} className="text-sm text-newYellow hover:text-blue-600">
//                 Sign up
//               </Link>
//             </div>
//             <div className="relative ">
//               <div className="absolute inset-0 flex items-center">
//                 <div className="w-full border-t border-gray-300"></div>
//               </div>
//               <div className="relative flex justify-center text-sm">
//                 <span className="bg-amber-200 px-2 text-gray-700 font-semibold rounded-xl">Or continue with</span>
//               </div>
//             </div>

//             <div className="mt-3">
//               <AuthContainer />
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Login

// Modified Login.jsx for localStorage token handling
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import axiosInstance from "../../../utils/axiosInstance"
import AuthContainer from "./AuthContainer"
import { EMAIL_LOGIN } from "../../api/apiDetails"
import { useAuth } from "../../../context/AuthContext"

const Login = ({ inputData, setInputData, onViewChange, isModal = false }) => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, saveTokens } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  })

  const [showPassword, setShowPassword] = useState(false)

  const validateEmail = (email) => {
    if (!email) return "Email is required"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return "Please enter a valid email address"
    return ""
  }

  const validatePassword = (password) => {
    if (!password) return "Password is required"
    if (password.length < 8) return "Password must be at least 8 characters"
    return ""
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    setErrors((prev) => ({
      ...prev,
      [name]: name === "email" ? validateEmail(value) : validatePassword(value),
      general: "",
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {
      email: formData.email ? validateEmail(formData.email) : "Email is required",
      password: formData.password ? validatePassword(formData.password) : "Password is required",
    }

    setErrors(newErrors)

    if (Object.values(newErrors).every((error) => error === "")) {
      setIsLoading(true)
      try {
        const { data } = await axiosInstance.post(EMAIL_LOGIN, {
          emailId: formData.email,
          password: formData.password
        });

        if (data.action === "verifyOtp") {
          setInputData((prev) => ({
            ...prev,
            email: formData.email,
          }))

          if (isModal && onViewChange) {
            onViewChange('otp');
          } else {
            navigate("/auth/verify-email");
          }
        } else if (data.action === "login") {
          // Save tokens to localStorage
          saveTokens(data.accessToken, data.refreshToken);
          setUser(data.data);
          
          if (!isModal) {
            navigate("/profile");
          }
          // If modal, the parent component will handle the success
        }
      } catch (error) {
        console.error("Login error:", error)
        setErrors((prev) => ({
          ...prev,
          general: error.response?.data?.message || "Invalid email or password",
        }))
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleForgotPassword = () => {
    if (isModal && onViewChange) {
      onViewChange('forgot');
    } else {
      navigate("/auth/forgot-password");
    }
  };

  const handleSignUpClick = () => {
    if (isModal && onViewChange) {
      onViewChange('register');
    } else {
      navigate("/auth/register");
    }
  };

  return (
    <div className="w-full">
      <div className="w-full bg-transparent flex justify-center">
        <div className="w-full max-w-sm rounded-lg">
          {!isModal && (
            <div className="text-center pb-3">
              <h1 className="text-3xl font-thin text-whiteLight tracking-widest mb-2 relative">
                LOG<span className="font-black text-newYellow">IN</span>
              </h1>
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-newYellow to-transparent mx-auto"></div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
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

            <div className="space-y-4">
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder=""
                  className={`peer w-full px-4 py-2 border-2 rounded-lg ${isModal ? 'bg-gray-700 text-white' : 'bg-blackLight text-whiteLight'} 
                    backdrop-blur-sm placeholder-transparent font-semibold
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
                {errors.email && <p className="mt-1.5 text-sm text-red-500 flex items-center">✵{errors.email}</p>}
              </div>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder=" "
                  className={`peer w-full px-4 py-2 border-2 rounded-lg ${isModal ? 'bg-gray-700 text-white' : 'bg-blackLight text-whiteLight'}
                    backdrop-blur-sm placeholder-transparent font-semibold
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
                {errors.password && <p className="mt-1.5 text-sm text-red-500 flex items-center">✵{errors.password}</p>}
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-newYellow hover:text-blue-600"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full font-semibold bg-newYellow text-blackDark py-3 px-4 rounded-md hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:bg-amber-100 disabled:cursor-not-allowed hover:tracking-wider hover:font-blackLight tracking-tight"
            >
              {isLoading ? "Loading..." : "LOGIN"}
            </button>

            <div className="text-center">
              <span className={`text-sm ${isModal ? 'text-gray-300' : 'text-gray-200'}`}>Don't have an account? </span>
              <button
                type="button"
                onClick={handleSignUpClick}
                className="text-sm text-newYellow hover:text-blue-600"
              >
                Sign up
              </button>
            </div>

            {!isModal && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-amber-200 px-2 text-gray-700 font-semibold rounded-xl">Or continue with</span>
                  </div>
                </div>

                <div className="mt-3">
                  <AuthContainer />
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login;