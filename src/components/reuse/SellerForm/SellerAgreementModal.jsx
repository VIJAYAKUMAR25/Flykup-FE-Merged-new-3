import React, { useState } from 'react';
import { X, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const SellerAgreementModal = ({ isOpen, onClose, onAccept }) => {
  const [expandedSections, setExpandedSections] = useState({
    scope: true,
    rbi: false,
    obligations: false,
    fraud: false,
    dataSecurity: false,
    forceMajeure: false,
    amendments: false,
    governingLaw: false,
    annexure: false,
    acceptance: false,
  });

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-newBlack">Seller & Social Seller Agreement</h2>
          <button onClick={onClose} className="btn btn-ghost bg-slate-100 btn-circle">
            <X className="h-6 w-6 text-newBlack" />
          </button>
        </div>

        {/* Content - Scrollable Area */}
        <div className="overflow-y-auto flex-grow p-4">
          {/* 1. Scope of Agreement */}
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('scope')}
            >
              <h3 className="font-bold">1. Scope of Agreement</h3>
              {expandedSections.scope ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.scope && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>
                  This Agreement governs the Seller’s use of the Flykup platform for listing, promoting, selling, and
                  fulfilling orders via Live Selling, Auctions, Shoppable Videos, and Standard E-commerce Listings.
                </p>
                <p className="mt-2">
                  Flykup acts as a marketplace facilitator and does not take ownership of the products listed by the
                  Seller.
                </p>
                <p className="mt-2">
                  The Seller agrees to comply with all applicable laws, regulations, and platform policies.
                </p>
              </div>
            )}
          </div>

          {/* 2. Compliance with RBI Guidelines */}
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('rbi')}
            >
              <h3 className="font-bold">2. Compliance with RBI Guidelines</h3>
              {expandedSections.rbi ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.rbi && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>
                  The Seller agrees to comply with all applicable Reserve Bank of India (RBI) regulations governing
                  payment aggregation and e-commerce transactions, including:
                </p>
                <ul className="mt-2">
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>
                      <strong>Nodal Account Compliance:</strong> All payments shall be processed via a nodal account in
                      compliance with RBI’s Master Directions on Prepaid Payment Instruments (PPIs) and Payment
                      Aggregators (PAs).
                    </span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>
                      <strong>Settlement Timeline:</strong> Payouts will be processed 48 hours post-delivery confirmation as
                      per RBI guidelines.
                    </span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>
                      <strong>Refunds & Chargebacks:</strong> Refunds and chargebacks will be handled in accordance with RBI’s
                      grievance redressal mechanisms.
                    </span>
                  </li>
                </ul>
                <p className="mt-2">
                  The Seller acknowledges that Flykup will hold funds in the nodal account until the settlement period is
                  completed, as per RBI guidelines.
                </p>
              </div>
            )}
          </div>

          {/* 3. Seller Obligations */}
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('obligations')}
            >
              <h3 className="font-bold">3. Seller Obligations</h3>
              {expandedSections.obligations ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.obligations && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>The Seller shall:</p>
                <ul className="mt-2">
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>
                      Ensure all listed products comply with the Consumer Protection Act, 2019, GST regulations, and other
                      applicable laws.
                    </span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Maintain quality standards and fulfill orders within the agreed timeframe.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Accurately describe products, pricing, and availability.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Resolve disputes and customer complaints in a timely manner.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>
                      Remain responsible for chargebacks arising from non-delivery, fraud, or product-related issues.
                    </span>
                  </li>
                </ul>
                <p className="mt-2">The Seller shall not engage in fraudulent activities, including but not limited to:</p>
                <ul className="mt-2">
                  <li className="flex items-start mt-1">
                    <X className="h-5 w-5 text-error mr-2 mt-1 flex-shrink-0" />
                    <span>Misrepresentation of products.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <X className="h-5 w-5 text-error mr-2 mt-1 flex-shrink-0" />
                    <span>Manipulation of sales or reviews.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <X className="h-5 w-5 text-error mr-2 mt-1 flex-shrink-0" />
                    <span>Unauthorized use of customer data.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* 4. Fraud Prevention & Chargebacks */}
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('fraud')}
            >
              <h3 className="font-bold">4. Fraud Prevention & Chargebacks</h3>
              {expandedSections.fraud ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.fraud && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <ul className="mt-2">
                  <li className="flex items-start mt-1">
                    <p className="font-bold">4.1</p>
                    <span className="ml-2">
                      Flykup reserves the right to monitor transactions and take necessary action, including withholding
                      payments, suspending accounts, or terminating agreements in cases of suspected fraud.
                    </span>
                  </li>
                  <li className="flex items-start mt-1">
                    <p className="font-bold">4.2</p>
                    <span className="ml-2">
                      The Seller agrees to cooperate with Flykup in fraud investigations and provide necessary documentation
                      upon request.
                    </span>
                  </li>
                  <li className="flex items-start mt-1">
                    <p className="font-bold">4.3</p>
                    <span className="ml-2">
                      The Seller shall bear all liabilities arising from chargebacks due to non-delivery of products,
                      product defects or misrepresentation, and customer disputes or dissatisfaction.
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* 5. Data Security & Privacy */}
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('dataSecurity')}
            >
              <h3 className="font-bold">5. Data Security & Privacy</h3>
              {expandedSections.dataSecurity ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.dataSecurity && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>
                  The Seller agrees to handle customer data in compliance with the Information Technology Act, 2000 and
                  related data protection rules, including the Information Technology (Reasonable Security Practices and
                  Procedures and Sensitive Personal Data or Information) Rules, 2011.
                </p>
                <p className="mt-2">The Seller shall:</p>
                <ul className="mt-2">
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Implement reasonable security practices to protect customer information.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Not share customer data with third parties without explicit consent.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <Check className="h-5 w-5 text-success mr-2 mt-1 flex-shrink-0" />
                    <span>Report any data breaches or security incidents to Flykup immediately.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* 6. Force Majeure */}
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('forceMajeure')}
            >
              <h3 className="font-bold">6. Force Majeure</h3>
              {expandedSections.forceMajeure ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.forceMajeure && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <ul className="mt-2">
                  <li className="flex flex-col mt-1">
                    <span>
                      Neither party shall be liable for delays or failures in performance caused by unforeseen events
                      beyond their control, including but not limited to:
                    </span>
                    <ul className="mt-2 list-disc ml-6">
                      <li>Natural disasters.</li>
                      <li>Pandemics or epidemics.</li>
                      <li>Government actions or regulatory changes.</li>
                      <li>Acts of terrorism or war.</li>
                    </ul>
                  </li>
                  <li className="flex items-start mt-1">
                    <span>
                      In the event of a force majeure, the affected party shall notify the other party promptly and take
                      reasonable steps to mitigate the impact.
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* 7. Agreement Amendments & Termination */}
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('amendments')}
            >
              <h3 className="font-bold">7. Agreement Amendments & Termination</h3>
              {expandedSections.amendments ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.amendments && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <ul className="mt-2">
                  <li className="flex items-start mt-1">
                    <p className="font-bold">7.1</p>
                    <span className="ml-2">
                      Flykup may update this Agreement with 30 days’ prior notice.
                    </span>
                  </li>
                  <li className="flex items-start mt-1">
                    <p className="font-bold">7.2</p>
                    <span className="ml-2">
                      If the Seller disagrees with any changes, they may terminate the Agreement with written notice
                      within 15 days of receiving the update.
                    </span>
                  </li>
                  <li className="flex items-start mt-1">
                    <p className="font-bold">7.3</p>
                    <span className="ml-2">
                      Flykup reserves the right to suspend or terminate this Agreement immediately in cases of breach of
                      terms, fraudulent activities, non-compliance with laws, or failure to resolve customer disputes
                      or chargebacks.
                    </span>
                  </li>
                  <li className="flex items-start mt-1">
                    <p className="font-bold">7.4</p>
                    <span className="ml-2">
                      Upon termination, the Seller must clear all outstanding dues and obligations.
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* 8. Governing Law & Dispute Resolution */}
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('governingLaw')}
            >
              <h3 className="font-bold">8. Governing Law & Dispute Resolution</h3>
              {expandedSections.governingLaw ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.governingLaw && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <ul className="mt-2">
                  <li className="flex items-start mt-1">
                    <p className="font-bold">8.1</p>
                    <span className="ml-2">This Agreement shall be governed by the laws of India.</span>
                  </li>
                  <li className="flex items-start mt-1">
                    <p className="font-bold">8.2</p>
                    <span className="ml-2">
                      Any disputes arising out of or in connection with this Agreement shall be subject to the exclusive
                      jurisdiction of the courts in Coimbatore, Tamil Nadu.
                    </span>
                  </li>
                  <li className="flex items-start mt-1">
                    <p className="font-bold">8.3</p>
                    <span className="ml-2">
                      The parties agree to attempt amicable resolution of disputes through negotiation before resorting
                      to legal proceedings.
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Annexure - Pricing & Charges */}
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('annexure')}
            >
              <h3 className="font-bold">Annexure - Pricing & Charges</h3>
              {expandedSections.annexure ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.annexure && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>Transaction Fee: 2.75% on all successful transactions.</p>
                <p className="mt-2">Payout Cycle: 48 hours post-delivery confirmation.</p>
                <p className="mt-2">Nodal Account: As per RBI guidelines.</p>
              </div>
            )}
          </div>

          {/* Acceptance by Seller */}
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('acceptance')}
            >
              <h3 className="font-bold">Acceptance by Seller</h3>
              {expandedSections.acceptance ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.acceptance && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>
                  By accepting this Agreement and completing registration, the Seller agrees to abide by all terms and
                  conditions outlined herein.
                </p>
                <p className="mt-2">Authorized Representative:</p>
                <p className="mt-1">Pavan Kumar, Director, KAPS Nextgen Pvt Ltd</p>
                <p className="mt-2">Date of Effect:</p>
                <p className="mt-2">Seller’s Signature: ______________________</p>
                <p className="mt-2">Seller’s Name: ______________________</p>
                <p className="mt-2">Date: ______________________</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-between items-center">
          <button onClick={onClose} className="btn btn-outline">
            Decline
          </button>
          <button onClick={onAccept} className="btn btn-ghost bg-newBlack text-white hover:bg-slate-600 hover:text-black">
            I Agree to Agreement
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerAgreementModal;
