// src/App.js
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./App.css"; 
import AuthLayout from "./layout/auth.jsx";
import Home from "./Home.jsx";
import CategoryPage from "./components/reuse/auth/CategoryPage.jsx"; 

import { GoogleOAuthProvider } from "@react-oauth/google";
import { useState, useEffect } from "react";
import ProtectedPage from "./ProtectedPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider} from "./context/AuthContext.jsx";
import { AlertProvider } from './components/Alerts/AlertProviedr.jsx'; // Adjust path
import { SearchTabProvider } from "./context/SearchContext.jsx"; // Adjust path
import { AlertsContainer } from "./components/Alerts/AlertContainer.jsx"; // Adjust path
import { FaSpinner } from "react-icons/fa"; // For a loading spinner
import { useAuth } from "./context/AuthContext.jsx";
import FlykupLoader from "./components/resources/FlykupLoader.jsx";
// This component contains the core app logic and routes,
// and can safely use router and auth hooks.
function AppContentWrapper() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [inputData, setInputData] = useState({
    name: "", email: "", password: "", mobile_number: "",
  });

  useEffect(() => {

 if (!authLoading && user) {
 const isAuthPage = location.pathname.startsWith('/auth');
const isSelectCategoriesPage = location.pathname === '/select-categories';

 if (!isAuthPage && !isSelectCategoriesPage && (!user.categories || user.categories.length === 0)) {
 navigate('/select-categories', { replace: true });
 }
 }
    }, [user, authLoading, navigate, location.pathname]);
 
  if (authLoading && user === undefined) {
    return (
     <FlykupLoader text="Please wait!" />
    );
  }

  return (
    <div className="font-montserrat "> 
      <Routes>
        <Route
          path="/auth/*"
          element={<AuthLayout inputData={inputData} setInputData={setInputData} />}
        />
        <Route
          path="/select-categories"
          element={
            <ProtectedPage
              element={<CategoryPage />}
            />
          }
        />
        <Route
          path="/*" // Catches /home, /dashboard, and other main app routes
          element={
            <ProtectedPage
              element={<Home inputData={inputData} setInputData={setInputData} />}
            />
          }
        />
        {/* Example 404 Route: */}
        {/* <Route path="*" element={<div><h2>404 Not Found</h2><Link to="/">Go Home</Link></div>} /> */}
      </Routes>
    </div>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AlertProvider>
        <SearchTabProvider>
          <AlertsContainer />
          <BrowserRouter>
            <AuthProvider> 
              <AppContentWrapper />
            </AuthProvider>
          </BrowserRouter>
          <ToastContainer autoClose={2000} />
        </SearchTabProvider>
      </AlertProvider>
    </GoogleOAuthProvider>
  );
}

export default App;