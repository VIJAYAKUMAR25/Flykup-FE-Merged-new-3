import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { GET_CATEGORIES, LOGOUT, VALIDATE_ME } from "../components/api/apiDetails";

import { requestPermissionAndGetToken, setupForegroundMessageHandler } from "../utils/firebaseMessaging.jsx";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(undefined);
    const [ categories, setCategories ] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);
       await  fetchUser();
       await fetchCategories();
        setLoading(false);
        }

        initializeAuth();
    }, []);

    // FCM setup
    useEffect(()=> {
        if(!loading && user ) {
            console.log("User Authenticated, setting up FCM...");
            requestPermissionAndGetToken();

            // foreground message listener
            const unsubscribe = setupForegroundMessageHandler();

            return () => {
                console.log("Cleaning up foreground message listener.");
                unsubscribe();
            }
        } else if ( !loading && !user ){
            console.log("User not authenticated or logged out, skipping FCM setup");  
        }
    }, [user, loading])

    const fetchUser = async () => {
        try {
            const res = await axiosInstance.get(VALIDATE_ME);
            setUser(res.data.data);
        } catch (error) {
            console.error("Error fetching user:", error);
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
    }

    const logout = async () => {
        try {
            await axiosInstance.post(LOGOUT, {}, { skipAuthRefresh: true });
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setUser(null);
            setLoading(false);
            navigate("/auth/");
        }
    };

    window.logoutUser = logout;

    return (
        <AuthContext.Provider value={{ user, setUser, logout, loading, categories }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
