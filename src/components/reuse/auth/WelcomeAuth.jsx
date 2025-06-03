import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContainer from './AuthContainer';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseOutline } from 'react-icons/io5';

// --- Modal Component with Framer Motion ---
const TermsModal = ({ isOpen, onClose, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center  p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: "9998" }}
        >
          <motion.div
            className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto relative shadow-xl transform transition-all duration-300"
            initial={{ y: "-100vh", opacity: 0 }}
            animate={{ y: "0", opacity: 1 }}
            exit={{ y: "100vh", opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-3xl font-bold transition-colors duration-200 focus:outline-none"
              aria-label="Close modal"
            >
              <IoCloseOutline />
            </button>
            <h2 className="text-3xl font-extrabold mb-5 text-gray-900 border-b pb-3">Terms and Privacy Policy</h2>
            <div className="text-gray-700 text-base leading-relaxed custom-scrollbar pr-2">
              {children}
            </div>
            <div className="mt-8 text-right">
              <motion.button
                onClick={onClose}
                className="bg-newYellow text-blackDark py-3 px-6 rounded-full hover:bg-amber-300 font-semibold transition-all duration-200 text-lg shadow-md"
                whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- WelcomeAuth Component (no changes needed here, just for context) ---
const WelcomeAuth = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const termsContent = (
    <>
      <p className="mb-3">
        Welcome to Flykup! These Terms and Privacy Policy ("Terms") govern your use of the Flykup website,
        applications, and services (collectively, the "Service"). By accessing or using our Service,
        you agree to be bound by these Terms.
      </p>
      <h3 className="font-bold text-xl mt-6 mb-3 text-gray-800">1. Acceptance of Terms</h3>
      <p className="mb-3">
        By creating an account or using the Service, you signify your agreement to these Terms. If you do not
        agree to these Terms, you may not access or use the Service.
      </p>
      <h3 className="font-bold text-xl mt-6 mb-3 text-gray-800">2. Privacy Policy</h3>
      <p className="mb-3">
        Your privacy is very important to us. Our Privacy Policy explains how we collect, use, and disclose
        information about you. By using the Service, you consent to our collection, use, and disclosure of your
        personal data as described in the Privacy Policy.
      </p>
      <ul className="list-disc ml-6 mb-3 text-base">
        <li className="mb-1">Information We Collect: We collect information you provide directly to us, such as your name,
          email address, and payment information. We also collect usage data and device information.</li>
        <li className="mb-1">How We Use Your Information: We use the information we collect to provide, maintain, and improve
          our Service, process transactions, and communicate with you.</li>
        <li>Sharing of Information: We may share your information with third-party service providers who perform
          services on our behalf, or when required by law.</li>
      </ul>
      <h3 className="font-bold text-xl mt-6 mb-3 text-gray-800">3. User Conduct</h3>
      <p className="mb-3">
        You agree not to use the Service for any unlawful or prohibited activities, including but not limited to:
      </p>
      <ul className="list-disc ml-6 mb-3 text-base">
        <li className="mb-1">Violating any applicable laws or regulations.</li>
        <li className="mb-1">Infringing on the rights of others.</li>
        <li>Distributing viruses or other harmful code.</li>
      </ul>
      <h3 className="font-bold text-xl mt-6 mb-3 text-gray-800">4. Intellectual Property</h3>
      <p className="mb-3">
        All content and materials available on the Service, including but not limited to text, graphics, logos,
        and images, are the property of Flykup or its licensors and are protected by intellectual property laws.
      </p>
      <h3 className="font-bold text-xl mt-6 mb-3 text-gray-800">5. Changes to Terms</h3>
      <p className="mb-3">
        We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the
        new Terms on this page. Your continued use of the Service after any such changes constitutes your acceptance
        of the new Terms.
      </p>
      <h3 className="font-bold text-xl mt-6 mb-3 text-gray-800">6. Contact Us</h3>
      <p>
        If you have any questions about these Terms, please contact us at support@flykup.com.
      </p>
    </>
  );

  return (
    <div className="w-full bg-blackLight">
      <div className="min-h-full w-full w-[600px] md:w-[500px] sm:w-[320px] bg-transparent flex justify-center p-1">
        <div className="w-full max-w-sm rounded-lg text-center">
          <div className="text-center">
            <h1 className="text-xl font-thin text-whiteLight tracking-widest mb-2 relative">
              WELCOME TO FLYKUP !
            </h1>
            <p className="text-whiteLight text-sm mb-4">
              explore exclusive live drops and stream-to-shop events.
            </p>
          </div>

          <AuthContainer />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-amber-200 px-2 text-gray-700 font-semibold rounded-xl">Or continue with</span>
            </div>
          </div>

          <Link
            to="/auth/register"
            className="block w-full font-semibold bg-newYellow text-blackDark py-2 px-4 rounded-full hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover:tracking-wider hover:font-blackLight tracking-tight"
          >
            Continue with Email
          </Link>

          <div className="text-center mt-3">
            <p className="text-sm text-gray-200">
              By signing up, you agree to Flykup's{' '}
              <a href="#" onClick={handleOpenModal} className="text-newYellow hover:text-blue-600 cursor-pointer">
                Terms and Privacy Policy.
              </a>
            </p>
          </div>

          <div className="text-center mt-1">
            <span className="text-sm text-gray-200">Already have an account? </span>
            <Link to="/auth/login-email" className="text-sm text-newYellow hover:text-blue-600">
              Login
            </Link>
          </div>
        </div>
      </div>

      <TermsModal isOpen={isModalOpen} onClose={handleCloseModal}>
        {termsContent}
      </TermsModal>
    </div>
  );
};

export default WelcomeAuth;