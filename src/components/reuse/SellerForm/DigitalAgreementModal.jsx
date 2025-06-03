import React, { useState } from 'react';
import { X, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const DigitalAgreementModal = ({ isOpen, onClose, onAccept }) => {
  const [expandedSections, setExpandedSections] = useState({
    purpose: true,
    dataCollection: false,
    storageSecurity: false,
    retention: false,
    userRights: false,
    legalCompliance: false,
    fraudPrevention: false,
    updates: false,
    contact: false,
  });

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-newBlack">Digital Consent & Audit Trail Policy</h2>
          <button onClick={onClose} className="btn btn-ghost bg-slate-100 btn-circle">
            <X className="h-6 w-6 text-newBlack" />
          </button>
        </div>

        {/* Content - Scrollable Area */}
        <div className="overflow-y-auto flex-grow p-4">
          {/* 1. Purpose & Scope */}
          <div className="mb-4">
            <div 
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('purpose')}
            >
              <h3 className="font-bold">1. Purpose & Scope</h3>
              {expandedSections.purpose ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.purpose && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>This Policy outlines the procedures for collecting, storing, and managing digital consent and audit trails of transactions conducted on the Flykup platform.</p>
                <p className="mt-2">It applies to all Sellers, Social Sellers, and Users interacting with the platform for transactions, agreements, and digital approvals.</p>
                <p className="mt-2">The Policy ensures compliance with RBI guidelines, the Information Technology Act, 2000, and other applicable laws governing e-commerce and digital transactions.</p>
              </div>
            )}
          </div>

          {/* 2. Data Collection for Digital Consent */}
          <div className="mb-4">
            <div 
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('dataCollection')}
            >
              <h3 className="font-bold">2. Data Collection for Digital Consent</h3>
              {expandedSections.dataCollection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.dataCollection && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>The Platform captures and stores the following details as part of the digital consent process:</p>
                <ul className="mt-2 list-disc ml-6">
                  <li><strong>IP Address:</strong> The originating network address of the user at the time of agreement acceptance.</li>
                  <li><strong>Timestamp:</strong> The precise date and time when consent was recorded.</li>
                  <li><strong>User Identification:</strong> The registered user ID, email, or mobile number associated with the consent.</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, and device details (where applicable).</li>
                  <li><strong>Action Logged:</strong> The specific action taken (e.g., agreement acceptance, order confirmation, etc.).</li>
                  <li><strong>Geolocation Data:</strong> Approximate location of the user at the time of consent (if applicable).</li>
                </ul>
                <p className="mt-2">This data collection ensures compliance with RBI guidelines, prevents fraud and unauthorized transactions, and reinforces the legal enforceability of digital agreements under the relevant laws.</p>
              </div>
            )}
          </div>

          {/* 3. Storage & Security Measures */}
          <div className="mb-4">
            <div 
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('storageSecurity')}
            >
              <h3 className="font-bold">3. Storage & Security Measures</h3>
              {expandedSections.storageSecurity ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.storageSecurity && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <ul className="mt-2 list-disc ml-6">
                  <li>Encryption of stored consent logs using industry-standard protocols (e.g., AES-256).</li>
                  <li>Access controls limiting data access to authorized personnel only.</li>
                  <li>Multi-factor authentication (MFA) for accessing sensitive data.</li>
                  <li>Regular audits to ensure compliance and data integrity.</li>
                  <li>Data localization as per RBI guidelines, with all data stored on servers located in India.</li>
                </ul>
                <p className="mt-2">All collected data is securely stored in compliance with the IT Rules, RBI’s Master Directions on PPIs and PAs, and applicable security standards. Third-party service providers, if any, are required to adhere to these standards.</p>
              </div>
            )}
          </div>

          {/* 4. Retention Policy */}
          <div className="mb-4">
            <div 
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('retention')}
            >
              <h3 className="font-bold">4. Retention Policy</h3>
              {expandedSections.retention ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.retention && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>Digital consent and audit trail records will be retained for 5 years from the date of the transaction or agreement, in accordance with RBI guidelines and IT Act regulations.</p>
                <p className="mt-2">After the retention period, records will be securely archived or deleted unless required for legal or regulatory purposes. In cases of ongoing disputes or investigations, data will be retained until resolution.</p>
              </div>
            )}
          </div>

          {/* 5. User Rights & Access to Consent Records */}
          <div className="mb-4">
            <div 
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('userRights')}
            >
              <h3 className="font-bold">5. User Rights & Access to Consent Records</h3>
              {expandedSections.userRights ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.userRights && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>Sellers and users can request access to their consent records by submitting a formal request to <strong>support@flykup.in</strong>.</p>
                <p className="mt-2">Upon verification, consent logs will be provided within 10 business days.</p>
                <p className="mt-2">Users have the right to request correction of inaccurate or incomplete data, withdraw consent for future transactions (subject to platform policies), and lodge grievances related to data handling or consent records.</p>
              </div>
            )}
          </div>

          {/* 6. Legal & Compliance Requirements */}
          <div className="mb-4">
            <div 
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('legalCompliance')}
            >
              <h3 className="font-bold">6. Legal & Compliance Requirements</h3>
              {expandedSections.legalCompliance ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.legalCompliance && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <ul className="mt-2 list-disc ml-6">
                  <li>Compliance with RBI Guidelines on payment aggregators, digital transactions, and data localization.</li>
                  <li>Adherence to the Information Technology Act, 2000 and related IT security rules.</li>
                  <li>Observance of the Indian Contract Act, 1872 concerning digital contracts.</li>
                  <li>Compliance with the Consumer Protection Act, 2019 for grievance redressal and transparency.</li>
                </ul>
                <p className="mt-2">Digital consent logs may be used as evidence in legal disputes in accordance with the Indian Evidence Act, 1872. The Platform will cooperate with regulatory authorities and law enforcement agencies as required.</p>
              </div>
            )}
          </div>

          {/* 7. Fraud Prevention & Dispute Resolution */}
          <div className="mb-4">
            <div 
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('fraudPrevention')}
            >
              <h3 className="font-bold">7. Fraud Prevention & Dispute Resolution</h3>
              {expandedSections.fraudPrevention ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.fraudPrevention && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>The Platform employs advanced fraud detection mechanisms to identify and prevent unauthorized transactions.</p>
                <p className="mt-2">In case of disputes, users can raise grievances through the platform’s Grievance Redressal Mechanism. Disputes will be resolved in compliance with RBI’s grievance redressal framework and the Consumer Protection Act, 2019, with chargebacks and refunds processed as per platform policies.</p>
              </div>
            )}
          </div>

          {/* 8. Updates & Amendments */}
          <div className="mb-4">
            <div 
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('updates')}
            >
              <h3 className="font-bold">8. Updates & Amendments</h3>
              {expandedSections.updates ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.updates && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p>This Policy may be updated periodically to reflect changes in regulatory requirements or platform operations.</p>
                <p className="mt-2">Users will be notified of any significant changes via email or platform notifications at least 30 days in advance. Continued use of the platform after amendments constitutes acceptance of the revised Policy.</p>
              </div>
            )}
          </div>

          {/* 9. Contact Information */}
          <div className="mb-4">
            <div 
              className="flex justify-between items-center cursor-pointer p-2 bg-newYellow rounded-lg text-black"
              onClick={() => toggleSection('contact')}
            >
              <h3 className="font-bold">9. Contact Information</h3>
              {expandedSections.contact ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.contact && (
              <div className="p-3 bg-slate-100 text-newBlack border border-base-300 rounded-b-lg mt-1">
                <p><strong>KAPS Nextgen Pvt Ltd</strong></p>
                <p className="mt-2"><strong>Email:</strong> support@flykup.in</p>
                <p className="mt-2"><strong>Registered Address:</strong> No.7, Kambar Street, SRP Mills, Janatha Nagar, Saravanampatti, Coimbatore South, Coimbatore - 641035, Tamil Nadu, India</p>
                <p className="mt-2"><strong>Effective Date:</strong> 20/03/2025</p>
                <p className="mt-2"><strong>Authorized Representative:</strong> Pavan Kumar, Director, KAPS Nextgen Pvt Ltd</p>
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
            I Agree to Policy
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalAgreementModal;
