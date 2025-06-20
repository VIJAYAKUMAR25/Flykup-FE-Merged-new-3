// // import { createContext, useContext, useEffect, useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import axiosInstance from "../utils/axiosInstance";
// // import { GET_CATEGORIES, LOGOUT, VALIDATE_ME } from "../components/api/apiDetails";

// // import { requestPermissionAndGetToken, setupForegroundMessageHandler } from "../utils/firebaseMessaging.jsx";

// // const AuthContext = createContext();

// // export const AuthProvider = ({ children }) => {
// //     const [user, setUser] = useState(undefined);
// //     const [ categories, setCategories ] = useState([]);
// //     const [loading, setLoading] = useState(true);
// //     const navigate = useNavigate();

// //     useEffect(() => {
// //         const initializeAuth = async () => {
// //             setLoading(true);
// //        await  fetchUser();
// //        await fetchCategories();
// //         setLoading(false);
// //         }

// //         initializeAuth();
// //     }, []);

// //     // FCM setup
// //     useEffect(()=> {
// //         if(!loading && user ) {
// //             console.log("User Authenticated, setting up FCM...");
// //             requestPermissionAndGetToken();

// //             // foreground message listener
// //             const unsubscribe = setupForegroundMessageHandler();

// //             return () => {
// //                 console.log("Cleaning up foreground message listener.");
// //                 unsubscribe();
// //             }
// //         } else if ( !loading && !user ){
// //             console.log("User not authenticated or logged out, skipping FCM setup");  
// //         }
// //     }, [user, loading])

// //     const fetchUser = async () => {
// //         try {
// //             const res = await axiosInstance.get(VALIDATE_ME);
// //             setUser(res.data.data);
// //         } catch (error) {
// //             console.error("Error fetching user:", error);
// //             setUser(null);
// //         }
// //     };

// //     const fetchCategories = async () => {
// //         try {
// //             const res = await axiosInstance.get(GET_CATEGORIES);
// //             setCategories(res.data);
// //         } catch (error) {
// //             console.error("Error fetching categories:", error.message);
// //         }
// //     }

// //     const logout = async () => {
// //         try {
// //             await axiosInstance.post(LOGOUT, {}, { skipAuthRefresh: true });
// //         } catch (error) {
// //             console.error("Logout failed:", error);
// //         } finally {
// //             setUser(null);
// //             setLoading(false);
// //             navigate("/auth/");
// //         }
// //     };

// //     window.logoutUser = logout;

// //     return (
// //         <AuthContext.Provider value={{ user, setUser, logout, loading, categories }}>
// //             {children}
// //         </AuthContext.Provider>
// //     );
// // };

// // export const useAuth = () => useContext(AuthContext);




// import { createContext, useContext, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axiosInstance from "../utils/axiosInstance";
// import { GET_CATEGORIES, LOGOUT, VALIDATE_ME } from "../components/api/apiDetails";

// import { requestPermissionAndGetToken, setupForegroundMessageHandler } from "../utils/firebaseMessaging.jsx";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(undefined);
//     const [categories, setCategories] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const navigate = useNavigate();

//     useEffect(() => {
//         const initializeAuth = async () => {
//             await fetchUser();
//             await fetchCategories();
//             setLoading(false);
//         }

//         initializeAuth();
//     }, []);

//     // FCM setup
//     useEffect(() => {
//         if (!loading && user) {
//             console.log("User Authenticated, setting up FCM...");
//             requestPermissionAndGetToken();

//             // foreground message listener
//             const unsubscribe = setupForegroundMessageHandler();

//             return () => {
//                 console.log("Cleaning up foreground message listener.");
//                 unsubscribe();
//             }
//         } else if (!loading && !user) {
//             console.log("User not authenticated or logged out, skipping FCM setup");
//         }
//     }, [user, loading])

//     const fetchUser = async () => {
//         try {
//             const accessToken = localStorage.getItem('accessToken');
//             if (!accessToken) {
//                 setUser(null);
//                 return;
//             }

//             const res = await axiosInstance.get(VALIDATE_ME);
//             setUser(res.data.data);
//         } catch (error) {
//             console.error("Error fetching user:", error);
//             // Clear tokens if user validation fails
//             localStorage.removeItem('accessToken');
//             localStorage.removeItem('refreshToken');
//             setUser(null);
//         }
//     };

//     const fetchCategories = async () => {
//         try {
//             const res = await axiosInstance.get(GET_CATEGORIES);
//             setCategories(res.data);
//         } catch (error) {
//             console.error("Error fetching categories:", error.message);
//         }
//     }

//     const logout = async () => {
//         try {
//             await axiosInstance.post(LOGOUT, {}, { skipAuthRefresh: true });
//         } catch (error) {
//             console.error("Logout failed:", error);
//         } finally {
//             // Clear tokens from localStorage
//             localStorage.removeItem('accessToken');
//             localStorage.removeItem('refreshToken');
//             setUser(null);
//             setLoading(false);
//             navigate("/auth/");
//         }
//     };

//     // Helper function to save tokens
//     const saveTokens = (accessToken, refreshToken) => {
//         localStorage.setItem('accessToken', accessToken);
//         localStorage.setItem('refreshToken', refreshToken);
//     };

//     // Helper function to get tokens
//     const getTokens = () => {
//         return {
//             accessToken: localStorage.getItem('accessToken'),
//             refreshToken: localStorage.getItem('refreshToken')
//         };
//     };

//     window.logoutUser = logout;

//     return (
//         <AuthContext.Provider value={{ 
//             user, 
//             setUser, 
//             logout, 
//             loading, 
//             categories, 
//             saveTokens, 
//             getTokens 
//         }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { GET_CATEGORIES, LOGOUT, VALIDATE_ME } from "../components/api/apiDetails";
import { requestPermissionAndGetToken, setupForegroundMessageHandler } from "../utils/firebaseMessaging.jsx";
import AuthModal from "../components/modals/AuthModal.jsx";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(undefined);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Controls if the authentication modal is visible
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    // Stores the function that should run after a successful login
    const [pendingAction, setPendingAction] = useState(null);
    // ------------------------------------

    useEffect(() => {
        const initializeAuth = async () => {
            await fetchUser();
            await fetchCategories();
            setLoading(false);
        }
        initializeAuth();
    }, []);

    // FCM setup (no changes needed here)
    useEffect(() => {
        if (!loading && user) {
            console.log("User Authenticated, setting up FCM...");
            requestPermissionAndGetToken();
            const unsubscribe = setupForegroundMessageHandler();
            return () => {
                console.log("Cleaning up foreground message listener.");
                unsubscribe();
            }
        } else if (!loading && !user) {
            console.log("User not authenticated or logged out, skipping FCM setup");
        }
    }, [user, loading]);

    const fetchUser = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                setUser(null);
                return;
            }
            const res = await axiosInstance.get(VALIDATE_ME);
            setUser(res.data.data);
        } catch (error) {
            console.error("Error fetching user:", error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axiosInstance.get(GET_CATEGORIES);
            setCategories(res.data);
        } catch (error) {
            console.error("Error fetching categories:", error.message);
        }
    };

    const logout = async () => {
        try {
            await axiosInstance.post(LOGOUT, {}, { skipAuthRefresh: true });
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setLoading(false);
            navigate("/auth/");
        }
    };

    const saveTokens = (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    };

    const getTokens = () => {
        return {
            accessToken: localStorage.getItem('accessToken'),
            refreshToken: localStorage.getItem('refreshToken')
        };
    };

    // --- NEW AUTHENTICATION LOGIC ---

    // Checks if the user is authenticated based on token and user state
    const isAuthenticated = () => {
        const accessToken = localStorage.getItem('accessToken');
        return !!(accessToken && user);
    };

    
    const requireAuth = (actionCallback) => {
        if (!isAuthenticated()) {
            console.log("Authentication required. Opening modal.");
            // Store the action to run it after login
            setPendingAction(() => actionCallback);
            setIsAuthModalOpen(true);
            return false; // Action was not executed
        }

        // If already authenticated, just run the action
        if (typeof actionCallback === 'function') {
            actionCallback();
        }
        return true; // Action was executed
    };

    // This function is called by the AuthModal on successful login
    const handleAuthSuccess = async (authData) => {
        // We can optionally use the data from the modal, but fetching the
        // full user object is often more reliable.
        await fetchUser(); // Re-fetch user data to ensure context is up-to-date
        
        setIsAuthModalOpen(false);

        // If there's an action waiting, execute it now
        if (pendingAction && typeof pendingAction === 'function') {
            console.log("Executing pending action after successful login.");
            // A small delay can help ensure the user state has fully propagated
            setTimeout(() => {
                pendingAction();
                setPendingAction(null); // Clear the pending action
            }, 100);
        }
    };

    // This function is called when the modal is closed without logging in
    const handleAuthModalClose = () => {
        setIsAuthModalOpen(false);
        setPendingAction(null); // Clear any pending action
    };

    // ------------------------------------

    window.logoutUser = logout;

    // The value provided to all consuming components
    const contextValue = {
        user,
        setUser,
        logout,
        loading,
        categories,
        saveTokens,
        getTokens,
        isAuthenticated, 
        requireAuth      
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}

            {/* By placing the AuthModal here, it's available globally and can be
              controlled directly by this context.
            */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={handleAuthModalClose}
                onSuccess={handleAuthSuccess}
            />
        </AuthContext.Provider>
    );
};