import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaRegCircle, FaSpinner } from 'react-icons/fa';
import { FaCircleArrowLeft } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../utils/axiosInstance';
import { CATEGORY_ADD } from '../../api/apiDetails';
import { useAuth } from '../../../context/AuthContext';

// Import all category images
import Fashion from "../../../assets/images/Categories/Fashion&Accessories.png";
import Beauty from "../../../assets/images/Categories/Beauty&Personalcare.png";
import Sports from "../../../assets/images/Categories/Sports&Fitness.png";
import Gifts from "../../../assets/images/Categories/Gift&Festive.png";
import BabyKids from "../../../assets/images/Categories/Baby&Kids.png";
import Electronics from "../../../assets/images/Categories/Electronics&Gadgets.png";
import HomeLiving from "../../../assets/images/Categories/Home&Livings.png";
import Food from "../../../assets/images/Categories/Food&Beverages.png";
import Health from "../../../assets/images/Categories/Helth&Wellness.png";
import Books from "../../../assets/images/Categories/Books&Hobbies.png";
import Automobiles from "../../../assets/images/Categories/Automobiles&Accessories.png";
import Industrial from "../../../assets/images/Categories/Industrial&Scientific.png";
import Pets from "../../../assets/images/Categories/Pets.png";
import Gaming from "../../../assets/images/Categories/Gaming.png";
import Tools from "../../../assets/images/Categories/Tools&Hardware.png";
import Construction from "../../../assets/images/Categories/ConstructionMaterials.png";
import Misc from "../../../assets/images/Categories/Miscellanious.png";
import Luxury from "../../../assets/images/Categories/Luxury & Collectibles.png";

const categories = [
  { id: 1, name: "Fashion & Accessories", iconPath: Fashion },
  { id: 2, name: "Beauty & Personal Care", iconPath: Beauty },
  { id: 3, name: "Sports & Fitness", iconPath: Sports },
  { id: 4, name: "Gifts & Festive Needs", iconPath: Gifts },
  { id: 5, name: "Baby & Kids", iconPath: BabyKids },
  { id: 6, name: "Electronics & Gadgets", iconPath: Electronics },
  { id: 7, name: "Home & Living", iconPath: HomeLiving },
  { id: 8, name: "Food & Beverages", iconPath: Food },
  { id: 9, name: "Health & Wellness", iconPath: Health },
  { id: 10, name: "Books, Hobbies & Stationery", iconPath: Books },
  { id: 11, name: "Automobiles & Accessories", iconPath: Automobiles },
  { id: 12, name: "Industrial & Scientific", iconPath: Industrial },
  { id: 13, name: "Pets", iconPath: Pets },
  { id: 14, name: "Gaming", iconPath: Gaming },
  { id: 15, name: "Tools & Hardware", iconPath: Tools },
  { id: 16, name: "Construction Materials", iconPath: Construction },
  { id: 17, name: "Miscellaneous", iconPath: Misc },
  { id: 18, name: "Luxury & Collectibles", iconPath: Luxury },
];

const CategorySelectionPage = () => {
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Kept for completeness, though not used for initial load

  const navigate = useNavigate();
  const { setUser, logout } = useAuth();

  const handleToggleCategory = (categoryName) => {
    setError('');
    setSelectedCategories(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(categoryName)) {
        newSelected.delete(categoryName);
      } else {
        newSelected.add(categoryName);
      }
      return newSelected;
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (selectedCategories.size === 0) {
      setError("Please select at least one category of interest.");
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const response = await axiosInstance.post(
        CATEGORY_ADD,
        { categories: Array.from(selectedCategories) }
      );
      console.log("API Response data:", response.data);

      if (response.data && response.data.status === true) {
        setUser(prevUser => ({
          ...prevUser,
          categories: response.data.data
        }));
        console.log("Categories saved successfully. Navigating to dashboard...");
        navigate('/user', { replace: true });
      } else {
        setError(response.data?.message || "Failed to save categories. Please try again.");
      }
    } catch (err) {
      console.error("Error saving categories:", err);
      const errorMessage = err.response?.data?.message || "A server error occurred. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/'); // Optionally navigate to home or login after logout
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.05, boxShadow: "0px 10px 25px rgba(79, 70, 229, 0.3)", transition: { duration: 0.2 } },
    tap: { scale: 0.98 }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blackDark flex items-center justify-center">
        <div className="text-center text-white">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <FaSpinner className="animate-spin text-5xl text-primary mb-4" />
            <h2 className="text-2xl font-bold">Loading categories...</h2>
            <p className="text-slate-300 mt-2">This shouldn't take long. If it persists, please refresh.</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-newBlack">
      <div className="min-h-screen flex flex-col items-center px-4 sm:px-8   relative">
        {/* Back and Logout Button */}
        

        {/* Page Title and Description */}
        <div className="text-center mb-5 "> 
          <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.95 }}
          className="btn btn-ghost bg-newGradiant text-newWhite rounded-2xl btn-sm md:btn-md absolute top-4 left-4 lg:top-6 lg:left-6 mb-3 gap-2"
          aria-label="Back"
        >
          <FaCircleArrowLeft className="text-xl" />
          <span className="hidden sm:inline">Back</span>
        </motion.button>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-newGradiant text-3xl sm:text-4xl font-bold mb-2"
          >
            Categories
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white text-2xl sm:text-3xl font-semibold mb-4"
          >
            "Let's Set Up Your Shop"
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto"
          >
            Choose the categories that suit you best. You can change them anytime!
          </motion.p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="alert alert-error mb-6 w-full max-w-md shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}

        <div className="w-full max-w-5xl pb-12">
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {categories.map((category) => (
              <motion.div
                key={category.id}
                variants={cardVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => handleToggleCategory(category.name)}
                className={`
                  relative card cursor-pointer overflow-hidden transition-all duration-200 rounded-lg
                  ${selectedCategories.has(category.name)
                    ? 'shadow-lg shadow-yellow-300/30 border border-gray-700 bg-newYellow'
                    : 'border-2 border-yellow-900 bg-newGradiant' 
                  }
                `}
              >
                
                <div className="card-body relative z-10 flex flex-col items-center justify-center p-3 sm:p-4">
                  <div className={`mb-2 flex justify-center p-3 rounded-full ${selectedCategories.has(category.name) ? 'bg-black/60 shadow-lg shadow-black/30' : 'bg-white/10'}`}>
                    <img
                      src={category.iconPath}
                      alt={category.name}
                      className={`w-10 h-10 sm:w-12 sm:h-12 object-contain ${selectedCategories.has(category.name) ? 'filter brightness-100' : 'filter brightness-150 '}`}
                    />
                  </div>
                  <h2 className={`text-center text-xs sm:text-sm  ${selectedCategories.has(category.name) ? 'text-black font-bold' : 'text-white font-medium'}`}>{category.name}</h2>
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                    {selectedCategories.has(category.name) ? (
                      <FaCheckCircle className="text-lg sm:text-xl text-blackDark" /> 
                    ) : (
                      <FaRegCircle className="text-lg sm:text-xl text-gray-400 opacity-70" /> 
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Adjusted "Next" Button alignment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-end mt-8" 
          >
            <motion.button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedCategories.size === 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                btn btn-lg w-auto px-10 py-3 
                ${isSubmitting || selectedCategories.size === 0
                  ? 'btn-disabled opacity-50'
                  : 'bg-newYellow text-blackDark font-semibold rounded-full shadow-lg shadow-yellow-500/30 hover:bg-yellow-300' // Changed button style
                }
              `}
            >
              {isSubmitting ? (
                <> <FaSpinner className="animate-spin mr-2" /> Saving Choices... </>
              ) : "Continue" } {/* Changed text to "Next" */}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CategorySelectionPage;