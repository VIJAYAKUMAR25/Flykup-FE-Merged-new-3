import React, { useState } from 'react';
import { X, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const TermsAndConditionsModal = ({ isOpen, onClose, onAccept }) => {
  const [expandedSections, setExpandedSections] = useState({
    introduction: true,
    eligibility: false,
    product: false,
    liveSelling: false,
    fulfillment: false,
    payments: false,
    prohibited: false,
    liability: false,
    amendments: false,
    agreement: false
  });

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-newBlack">Flykup Seller General Terms & Conditions</h2>
         
          <button onClick={onClose} className="btn btn-ghost  bg-slate-100 btn-circle">
            <X className="h-6 w-6 text-newBlack" />
          </button>
        </div>

        {/* Content - Scrollable Area */}
        <div className="overflow-y-auto flex-grow p-4">
          {/* Introduction */}
          <div className="mb-4">
            <div 
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('introduction')}
            >
              <h3 className="font-bold">1. Introduction</h3>
              {expandedSections.introduction ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {expandedSections.introduction && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>Welcome to Flykup, a live shopping and auction platform connecting sellers with buyers in a real-time interactive environment. By registering as a seller on Flykup, you agree to comply with these Seller Terms & Conditions, Flykup's Privacy Policy, and all applicable laws.</p>
                <p className="mt-2">By clicking "I Agree," you confirm that you have read, understood, and accepted these terms.</p>
              </div>
            )}
          </div>

          {/* Eligibility & Registration */}
          <div className="mb-4">
            <div 
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('eligibility')}
            >
              <h3 className="font-bold">2. Eligibility & Seller Registration</h3>
              {expandedSections.eligibility ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {expandedSections.eligibility && (
              <div className="  p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>To sell on Flykup, you must:</p>
                <ul className="mt-2">
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Be at least 18 years old and legally eligible to conduct business in India.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Provide accurate and verifiable KYC details (PAN, Aadhaar, GST, Bank Account, etc.).</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Agree to our Live Selling & Product Quality Guidelines.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Not have any history of fraud, counterfeit sales, or policy violations on any e-commerce platform.</span>
                  </li>
                </ul>
                <div className="flex items-start mt-3">
                  <AlertCircle className="h-5 w-5 text-error mr-2 mt-1 flex-shrink-0" />
                  <span>Flykup reserves the right to reject or suspend any seller account that fails to meet these criteria.</span>
                </div>
              </div>
            )}
          </div>

          {/* Product Listing */}
          <div className="mb-4">
            <div 
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('product')}
            >
              <h3 className="font-bold">3. Product Listing & Quality Compliance</h3>
              {expandedSections.product ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {expandedSections.product && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>All sellers must:</p>
                <ul className="mt-2">
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Ensure that all product listings are genuine, legally owned, and meet quality standards.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Provide accurate product descriptions, pricing, and images/videos.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Clearly disclose warranty, return, and refund policies.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Avoid prohibited products, including counterfeit goods, illegal items, or restricted categories (e.g., alcohol, tobacco, weapons, etc.).</span>
                  </li>
                </ul>
                <div className="flex items-start mt-3">
                  <AlertCircle className="h-5 w-5 text-error mr-2 mt-1 flex-shrink-0" />
                  <span>Flykup reserves the right to remove any listing that is misleading, violates regulations, or affects buyer trust.</span>
                </div>
              </div>
            )}
          </div>

          {/* Live Selling Guidelines */}
          <div className="mb-4">
            <div 
              className="  flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('liveSelling')}
            >
              <h3 className="font-bold">4. Live Selling Guidelines</h3>
              {expandedSections.liveSelling ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {expandedSections.liveSelling && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>As a live commerce platform, Flykup expects sellers to:</p>
                <ul className="mt-2">
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Conduct professional and engaging live sales with clear communication.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Avoid misleading claims, false advertising, or offensive behavior.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Follow Flykup's broadcasting standards, including content restrictions and engagement policies.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Ensure high-quality video, audio, and presentation.</span>
                  </li>
                </ul>
                <div className="flex items-start mt-3">
                  <AlertCircle className="h-5 w-5 text-error mr-2 mt-1 flex-shrink-0" />
                  <span>Sellers violating live-streaming policies will be suspended or permanently banned.</span>
                </div>
              </div>
            )}
          </div>

          {/* Fulfillment & Logistics */}
          <div className="mb-4">
            <div 
              className="  flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('fulfillment')}
            >
              <h3 className="font-bold">5. Order Fulfillment & Logistics</h3>
              {expandedSections.fulfillment ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {expandedSections.fulfillment && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <ul className="mt-2">
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Orders must be processed and shipped within the agreed timeframe (Same day or 1-3 days).</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Sellers must use Flykup's logistics partner or ensure reliable self-shipping.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Tracking details must be updated within 24 hours of dispatch.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Returns and refunds must be handled as per the declared policy.</span>
                  </li>
                </ul>
                <div className="flex items-start mt-3">
                  <AlertCircle className="h-5 w-5 text-error mr-2 mt-1 flex-shrink-0" />
                  <span>Delayed shipments, non-fulfillment, or frequent cancellations may lead to penalties or account suspension.</span>
                </div>
              </div>
            )}
          </div>

          {/* Payments & Commissions */}
          <div className="mb-4">
            <div 
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('payments')}
            >
              <h3 className="font-bold">6. Payments & Commissions</h3>
              {expandedSections.payments ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {expandedSections.payments && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <ul className="mt-2">
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Sellers receive payments after order fulfillment and return window completion.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Flykup deducts a pre-agreed commission per sale before settlement.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Payments are processed weekly/monthly based on transaction volume.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>GST and other applicable taxes are the seller's responsibility.</span>
                  </li>
                </ul>
                <div className="flex items-start mt-3">
                  <AlertCircle className="h-5 w-5 text-error mr-2 mt-1 flex-shrink-0" />
                  <span>Chargebacks, fraud, or disputes may result in payment holds or account review.</span>
                </div>
              </div>
            )}
          </div>

          {/* Prohibited Activities */}
          <div className="mb-4">
            <div 
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('prohibited')}
            >
              <h3 className="font-bold">7. Prohibited Activities & Account Suspension</h3>
              {expandedSections.prohibited ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {expandedSections.prohibited && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>The following activities will result in immediate termination of the seller account:</p>
                <ul className="mt-2">
                  <li className="flex items-start mt-1">
                    <X className="h-5 w-5 text-error mr-2 mt-1 flex-shrink-0" />
                    <span>Selling counterfeit, illegal, or misrepresented products.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <X className="h-5 w-5 text-error mr-2 mt-1 flex-shrink-0" />
                    <span>Fake bidding, price manipulation, or fraudulent activity.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <X className="h-5 w-5 text-error mr-2 mt-1 flex-shrink-0" />
                    <span>Misleading buyers, false claims, or unethical sales practices.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <X className="h-5 w-5 text-error mr-2 mt-1 flex-shrink-0" />
                    <span>Using unauthorized payment methods or engaging in off-platform transactions.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <X className="h-5 w-5 text-error mr-2 mt-1 flex-shrink-0" />
                    <span>Violating intellectual property laws or infringing copyrights.</span>
                  </li>
                </ul>
                <div className="flex items-start mt-3">
                  <AlertCircle className="h-5 w-5 text-error mr-2 mt-1 flex-shrink-0" />
                  <span>Flykup has the right to suspend, ban, or take legal action against sellers violating these policies.</span>
                </div>
              </div>
            )}
          </div>

          {/* Liability & Indemnification */}
          <div className="mb-4">
            <div 
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('liability')}
            >
              <h3 className="font-bold">8. Liability & Indemnification</h3>
              {expandedSections.liability ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {expandedSections.liability && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <ul className="mt-2">
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Sellers are fully responsible for their products, warranties, and buyer disputes.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Flykup is not liable for any damages, legal claims, or losses arising from seller misconduct.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Sellers agree to indemnify and hold Flykup harmless against any claims related to product defects, customer complaints, or policy violations.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Amendments & Termination */}
          <div className="mb-4">
            <div 
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('amendments')}
            >
              <h3 className="font-bold">9. Amendments & Termination</h3>
              {expandedSections.amendments ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {expandedSections.amendments && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <ul className="mt-2">
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Flykup reserves the right to update these terms at any time.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Sellers will be notified of major changes via email or platform notifications.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Flykup can terminate any seller account without notice if policies are violated.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Seller Agreement */}
          <div className="mb-4">
            <div 
              className=" flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('agreement')}
            >
              <h3 className="font-bold">10. Seller Agreement & Confirmation</h3>
              {expandedSections.agreement ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {expandedSections.agreement && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>By clicking "I Agree", you confirm that:</p>
                <ul className="mt-2">
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>You have read, understood, and accepted Flykup's Seller Terms & Conditions.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>All information provided during registration is accurate and verifiable.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>You will comply with all applicable laws, regulations, and platform policies.</span>
                  </li>
                </ul>
                <div className="flex items-start mt-3">
                  <AlertCircle className="h-5 w-5 text-info mr-2 mt-1 flex-shrink-0" />
                  <span>If you do not agree to these terms, you should not proceed with seller registration.</span>
                </div>
              </div>
            )}
          </div>

          {/* Declaration */}
          <div className="mt-6 p-4 bg-slate-100 text-newBlack border border-base-300 rounded-lg">
            <h3 className="font-bold mb-2">Seller Declaration & Confirmation Statement</h3>
            <p className="mb-2">By submitting this application, I confirm that:</p>
            <ul>
              <li className="flex items-start mt-1">
                <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                <span>All information provided is accurate, complete, and up to date.</span>
              </li>
              <li className="flex items-start mt-1">
                <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                <span>All documents submitted (KYC, GST, Business Details) are authentic and legally valid.</span>
              </li>
              <li className="flex items-start mt-1">
                <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                <span>I am legally authorized to sell the listed products and comply with all applicable laws.</span>
              </li>
              <li className="flex items-start mt-1">
                <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                <span>I understand that providing false or misleading information may result in immediate rejection, suspension, or legal action.</span>
              </li>
            </ul>
            <div className="flex items-start mt-3">
              <AlertCircle className="h-5 w-5 text-info mr-2 mt-1 flex-shrink-0" />
              <span>I agree to abide by Flykup's Seller Terms & Conditions and all platform policies.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-between items-center">
          <button 
            onClick={onClose}
            className="btn btn-outline"
          >
            Decline
          </button>
          <button 
            onClick={onAccept}
            className="btn btn-ghost bg-newBlack text-white hover:bg-slate-600 hover:text-black" 
          >
            I Agree to Terms & Conditions
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsModal;