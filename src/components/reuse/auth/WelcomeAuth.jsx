import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContainer from './AuthContainer';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseOutline } from 'react-icons/io5';

const TermsModal = ({ isOpen, onClose, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9998]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-blackDark rounded-xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 25 }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-whiteLight hover:text-newYellow transition-colors duration-200 focus:outline-none"
              aria-label="Close modal"
            >
              <IoCloseOutline size={28} />
            </button>

            {/* Header */}
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 text-whiteLight border-b border-gray-600 pb-3">
              Flykup Privacy Policy (India)
            </h2>

            {/* Content */}
            <div className="text-whiteSecondary text-sm sm:text-base leading-relaxed space-y-5 pr-2">
              {children}
            </div>

            {/* Footer Button */}
            <div className="mt-8 text-right">
              <motion.button
                onClick={onClose}
                className="bg-newYellow text-blackDark py-3 px-6 rounded-full font-semibold transition-all duration-200 hover:bg-amber-300 shadow-lg"
                whileHover={{ scale: 1.03, boxShadow: "0 6px 16px rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.98 }}
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

// --- WelcomeAuth Component ---
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
    <div className="space-y-6">
      <p><strong className="text-whiteLight">Effective Date:</strong> February 14, 2025</p>
      <p><strong className="text-whiteLight">Last Updated:</strong> February 14, 2025</p>
      <p><strong className="text-whiteLight">Location:</strong> Chennai, Tamil Nadu</p>

      <section>
        <h3 className="text-xl font-bold text-whiteLight mb-3">INTRODUCTION</h3>
        <p className="text-whiteSecondary leading-relaxed">
          This Privacy Policy describes how Kaps NextGen Pvt Ltd, operating under the tradename Flykup (“Flykup,” “we,” “our,” or “us”), collects, processes, stores, shares, and safeguards your personal data in compliance with the Digital Personal Data Protection Act, 2023 (DPDPA 2023), Information Technology Act, 2000, and applicable RBI and financial regulations.
          By accessing or using Flykup, including to register, browse, bid, or complete transactions, you consent to this policy.
        </p>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-whiteLight mb-2">1. INFORMATION WE COLLECT</h4>
        <div className="space-y-4">
          <div>
            <p className="font-medium text-whiteLight">a. Account & Contact Data</p>
            <ul className="list-disc pl-5 text-whiteSecondary">
              <li>Full Name</li>
              <li>Mobile Number, Email Address</li>
              <li>Hashed Password</li>
              <li>Shipping & Billing Address</li>
              <li>GSTIN (for verified sellers)</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-whiteLight">b. Mandatory KYC & Verification Data (Required for Auctions & Payouts)</p>
            <ul className="list-disc pl-5 text-whiteSecondary">
              <li>Aadhaar (Masked Format), PAN, Passport, Voter ID</li>
              <li>Bank Account Number and IFSC</li>
              <li>Live Selfie or Biometric Verification (Liveness Detection)</li>
              <li>Date of Birth, Gender, Approximate Geolocation</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-whiteLight">c. Transactional & Behavioral Data</p>
            <ul className="list-disc pl-5 text-whiteSecondary">
              <li>Bidding and Purchase History</li>
              <li>Wallet Activity, Payment Logs</li>
              <li>Reviews, Messages, and Follower Data</li>
              <li>Device IDs, IP Addresses, Session Fingerprints</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-whiteLight">d. Automated Collection</p>
            <ul className="list-disc pl-5 text-whiteSecondary">
              <li>Cookies, Tracking Pixels, Session Scripts</li>
              <li>Clickstream and Page View Data</li>
              <li>Error Logs and Crash Reports</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-whiteLight mt-6 mb-2">2. LEGAL BASIS AND PURPOSE OF PROCESSING</h4>
        <p className="text-whiteSecondary leading-relaxed">
          Flykup processes personal data under the following lawful bases per DPDPA 2023:
        </p>
        <ul className="list-disc pl-5 text-whiteSecondary mb-4">
          <li><strong>Consent:</strong> For marketing communications and analytics</li>
          <li><strong>Contractual Necessity:</strong> To provide services, facilitate orders, and process transactions</li>
          <li><strong>Legal Obligation:</strong> For KYC/AML compliance, taxation, and regulatory reporting</li>
          <li><strong>Legitimate Interest:</strong> Security monitoring, fraud prevention, and platform improvement</li>
        </ul>
        <p className="font-medium text-whiteLight">Purpose of Use:</p>
        <ul className="list-disc pl-5 text-whiteSecondary">
          <li>Account creation and user onboarding</li>
          <li>KYC verification for participation in auctions and commerce</li>
          <li>Transaction processing, refunds, and payouts</li>
          <li>Identity and fraud risk assessment</li>
          <li>Marketing and personalized offers (with opt-out)</li>
          <li>Grievance handling and legal defense</li>
        </ul>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-whiteLight mt-6 mb-2">3. DATA SECURITY MEASURES</h4>
        <p className="text-whiteSecondary leading-relaxed">
          Flykup follows ISO 27001-aligned data security protocols, including:
        </p>
        <ul className="list-disc pl-5 text-whiteSecondary">
          <li>AES-256 encryption for data at rest</li>
          <li>TLS 1.3 encryption for all data in transit</li>
          <li>Multi-Factor Authentication (MFA) for administrative systems</li>
          <li>Role-Based Access Control (RBAC) for employees and partners</li>
          <li>Annual Vulnerability Assessments (VAPT)</li>
          <li>72-hour breach notification to users and the Data Protection Board of India</li>
        </ul>
        <p className="text-whiteSecondary leading-relaxed mt-4">
          All staff undergo periodic DPDPA 2023 training and sign confidentiality clauses.
        </p>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-whiteLight mt-6 mb-2">4. DATA LOCALIZATION AND RETENTION</h4>
        <p className="text-whiteSecondary leading-relaxed">
          All personal data is stored in India, on servers located within AWS and/or GCP’s Indian regions. Encrypted backups are geo-fenced and retained exclusively within India.
        </p>
        <p className="font-medium text-whiteLight mt-4">Data Retention Periods:</p>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-blackDark rounded-lg shadow overflow-hidden my-4">
            <thead>
              <tr className="bg-gray-700 text-whiteLight">
                <th className="py-2 px-4 text-left">Data Type</th>
                <th className="py-2 px-4 text-left">Retention Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-600">
                <td className="py-2 px-4 text-whiteSecondary">KYC Documents</td>
                <td className="py-2 px-4 text-whiteSecondary">7 years post-account closure (per RBI/PMLA)</td>
              </tr>
              <tr className="border-b border-gray-600">
                <td className="py-2 px-4 text-whiteSecondary">Financial Transactions</td>
                <td className="py-2 px-4 text-whiteSecondary">8 years (as per Income Tax Act)</td>
              </tr>
              <tr>
                <td className="py-2 px-4 text-whiteSecondary">Inactive User Accounts</td>
                <td className="py-2 px-4 text-whiteSecondary">2 years (then anonymized/deleted)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-whiteLight mt-6 mb-2">5. DATA SHARING AND DISCLOSURE</h4>
        <p className="text-whiteSecondary leading-relaxed">
          Flykup shares data only where necessary and with entities bound by Data Processing Agreements (DPAs):
        </p>
        <p className="font-medium text-whiteLight mt-4">Shared With:</p>
        <ul className="list-disc pl-5 text-whiteSecondary">
          <li><strong>Government Authorities:</strong> Upon lawful request (RBI, Income Tax Department, Enforcement Directorate, etc.)</li>
          <li><strong>KYC Partners:</strong> (e.g., Cashfree) for identity verification</li>
          <li><strong>Payment Gateways:</strong> (e.g., PayU, Razorpay) – PCI-DSS compliant</li>
          <li><strong>Logistics Partners:</strong> (e.g., Ecom Express) – Access limited to delivery addresses and contact data</li>
          <li><strong>Auction Bodies or Legal Stakeholders:</strong> Where legally required</li>
        </ul>
        <p className="text-whiteSecondary leading-relaxed mt-4">
          We do not sell or rent personal data to any third parties.
        </p>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-whiteLight mt-6 mb-2">6. USER RIGHTS UNDER DPDPA 2023</h4>
        <p className="text-whiteSecondary leading-relaxed">
          As a Flykup user, you are entitled to exercise the following rights:
        </p>
        <ul className="list-disc pl-5 text-whiteSecondary">
          <li><strong>Right to Access:</strong> Obtain a copy of your personal data in a machine-readable format</li>
          <li><strong>Right to Correction:</strong> Correct inaccurate or outdated KYC/account details</li>
          <li><strong>Right to Erasure:</strong> Request deletion of non-mandatory data</li>
          <li><strong>Right to Consent Management:</strong> Withdraw consent for non-essential processing (e.g., marketing)</li>
          <li><strong>Right to Grievance Redressal:</strong> File complaints directly with our DPO or escalate to the Data Protection Board of India</li>
        </ul>
        <p className="text-whiteSecondary leading-relaxed mt-4">
          Submit your request to the DPO listed below, along with valid identity proof. We aim to respond within 30 days.
        </p>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-whiteLight mt-6 mb-2">7. SPECIAL PROVISIONS</h4>
        <ul className="list-disc pl-5 text-whiteSecondary">
          <li><strong>Minors:</strong> Flykup is not accessible to individuals under 18 years of age. All users undergo age and identity verification during KYC.</li>
          <li><strong>Sensitive Data:</strong> Biometric data is processed only for liveness detection and never stored in raw form</li>
          <li><strong>Cookies:</strong> Essential cookies are mandatory for service functionality. Non-essential cookies require opt-in via your browser settings</li>
          <li><strong>Cross-border Transfers:</strong> Flykup does not transfer personal data outside India, unless mandated by an Indian authority</li>
        </ul>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-whiteLight mt-6 mb-2">8. POLICY UPDATES</h4>
        <p className="text-whiteSecondary leading-relaxed">
          This Privacy Policy may be modified to reflect legal, technical, or business changes.
        </p>
        <ul className="list-disc pl-5 text-whiteSecondary">
          <li>Users will be notified 15 days in advance through in-app messages or email for material updates</li>
          <li>Re-consent will be required for changes involving sensitive data usage or consent parameters</li>
        </ul>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-whiteLight mt-6 mb-2">9. CONTACT & GRIEVANCE REDRESSAL</h4>
        <div className="text-whiteSecondary space-y-2">
          <p><strong>Data Protection Officer (DPO)</strong></p>
          <p>Kaps NextGen Pvt Ltd</p>
          <p>Email: <a href="mailto:privacy@flykup.in" className="text-newYellow hover:underline">privacy@flykup.in</a></p>
          <p>Phone: +91 98404 79979</p>
          <p>Registered Address: No.7, Kambar Street, SRP Mills, Janatha Nagar, SaravanamPatti, Coimbatore 641035, Tamil Nadu, India</p>
        </div>
        <div className="text-whiteSecondary space-y-2 mt-4">
          <p><strong>Escalation:</strong></p>
          <p>If unsatisfied with the DPO response, escalate to:</p>
          <p>Data Protection Board of India</p>
          <p>Ministry of Electronics and Information Technology</p>
          <p>Website: <a href="https://www.meity.gov.in/data-protection-board" target="_blank" rel="noopener noreferrer" className="text-newYellow hover:underline">https://www.meity.gov.in/data-protection-board</a></p>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-whiteLight mt-6 mb-2">10. GOVERNANCE & COMPLIANCE</h4>
        <ul className="list-disc pl-5 text-whiteSecondary">
          <li>Flykup’s data protection practices are governed by an internal Data Protection Committee</li>
          <li>Quarterly Data Protection Impact Assessments (DPIA) are conducted</li>
          <li>Regular audits are performed by ISO 27001-certified third-party firms</li>
        </ul>
      </section>
    </div>
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