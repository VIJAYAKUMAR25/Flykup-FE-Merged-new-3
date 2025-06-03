import React, { useState, useCallback } from "react";
import {
  Clock,
  Package,
  Truck,
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  User,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  Building,
  Globe,
  MapPinned,
  Store,
  ShoppingBag,
  Circle,
  Calendar,
   X,
  Camera,
  Tag,
  Layers,
  Download, FileText, CheckCircle, Sparkles
} from "lucide-react";
import { FaArrowCircleLeft } from "react-icons/fa";
import fb from '.././../../assets/images/SellerIcons/fb.png';
import insta from '.././../../assets/images/SellerIcons/insta.png';
import amazon from '.././../../assets/images/SellerIcons/amazon.png';
import flipkart from '.././../../assets/images/SellerIcons/Flipkart.png';
import meesho from '.././../../assets/images/SellerIcons/meeshow.png';
import shopify from '.././../../assets/images/SellerIcons/shopify.png';
import Document from '../../../assets/docs/Flykup_GST_Exemption_Social_Seller.pdf';
import { deleteObjectFromS3, uploadImageToS3 } from "../../../utils/aws";
import TermsAndConditionsModal from "./Terms&Condition.jsx";
import { Link, useNavigate } from "react-router-dom";
import { backendurl } from "../../../../config.js";
import axios from "axios";
import axiosInstance from "../../../utils/axiosInstance.js";
import { GET_USER_DETAILS_BY_ID,IMAGE_UPLOADTO_AZURE, SELLER_APPLICATION } from "../../api/apiDetails.js";
import { useAuth } from '../../../context/AuthContext.jsx';
import SellerAgreementModal from "./SellerAgreementModal.jsx";
import DigitalAgreementModal from "./DigitalAgreementModal.jsx";
import { createAzureFileHandler } from "../../../utils/azure.js";
import PDF from '../../../assets/images/pdf.png';


const PreviewUploads = ({ previewUrl, onRemove, name, isLoading, isUploaded, isPDF }) => {
  if (!previewUrl && !isLoading) return null;

  return (
    <div className="relative group">
      {previewUrl && (
        <div className="w-full h-48 flex items-center justify-center bg-gray-50 rounded-lg">
          {isPDF ? (
            <div className="flex flex-col items-center p-4">
              <img
                src={PDF}
                alt="PDF document"
                className="w-32 h-32 object-contain mb-2"
              />
              <span className="text-sm text-gray-500">PDF Document</span>
            </div>
          ) : (
            <img
              src={previewUrl}
              alt={name}
              className="w-full h-48 object-contain rounded-lg"
            />
          )}
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-white"></span>
        </div>
      )}

      {isUploaded && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Check className="w-8 h-8 text-green-400" strokeWidth={2} />
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};




// First Tab Component
const FirstTabContent = React.memo(
  ({ formData, handleInputChange, handleBusinessTypeSelect, errors }) => (
    <div className="lg:p-6 p-3 bg-black/5 rounded-lg shadow-md">
      <h2 className="text-2xl text-newBlack font-bold mb-2">Brand Seller Information</h2>

      <div className="mb-3">
        <label className="block flex items-center text-newBlack font-semibold mb-2">
          <User size={18} />
          <span className="ml-2">Full Name / Business Name</span>
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="w-full p-3 border bg-newWhite text-newBlack border-gray-300 rounded-lg"
          required
        />
        {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name}</span>}
      </div>

      {/* Mobile & Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
        <div>
          <label className="block flex items-center text-newBlack font-semibold mb-2">
            <Phone size={18} />
            <span className="ml-2">Mobile Number</span>
            <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleInputChange}
            className="w-full p-3 border bg-newWhite text-newBlack border-gray-300 rounded-lg"
            required
          />
          {errors.mobileNumber && <span className="text-red-500 text-sm mt-1">{errors.mobileNumber}</span>}
        </div>
        <div>
          <label className="block flex items-center text-newBlack font-semibold mb-2">
            <Mail size={18} />
            <span className="ml-2">Email Address</span>
            <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-3 border bg-newWhite text-newBlack border-gray-300 rounded-lg"
            required
          />
          {errors.email && <span className="text-red-500 text-sm mt-1 block">{errors.email}</span>}
        </div>
      </div>

      {/* Business Type */}
      <div className="mb-3">
        <label className="block flex items-center text-newBlack font-semibold mb-2">
          <Briefcase size={18} />
          <span className="ml-2">Business Type</span>
          <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            "Individual",
            "Sole Proprietor",
            "Private Limited",
            "LLP",
            "Partnership",
          ].map((type) => (
            <button
              key={type}
              onClick={() => handleBusinessTypeSelect(type)}
              className={`p-2 rounded-lg border flex items-center justify-between ${formData.businessType === type
                ? "bg-gray-900 text-white border-gray-900"
                : "border-gray-300 bg-newWhite text-newBlack hover:border-gray-900"
                }`}
            >
              <span>{type}</span>
              <span>
                {formData.businessType === type ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                )}
              </span>
            </button>
          ))}
        </div>
        {errors.businessType && (
          <span className="text-red-500 text-sm mt-1 block">
            {errors.businessType}
          </span>
        )}
      </div>

      {/* Address */}
      <div className="mb-6">
        <label className="block flex items-center text-newBlack font-semibold mb-2">
          <MapPin size={18} />
          <span className="ml-2">Business Address</span>
          <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 gap-4">
          <div className="relative">
            <MapPinned size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              name="streetAddress1"
              value={formData.streetAddress1}
              onChange={handleInputChange}
              placeholder="Street Address"
              className="w-full bg-newWhite text-newBlack p-3 pl-10 border border-gray-300 rounded-lg"
            />
            {errors.streetAddress1 && <span className="text-red-500 text-sm mt-1 block">{errors.streetAddress1}</span>}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="relative">
              <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                name="streetAddress2"
                value={formData.streetAddress2}
                onChange={handleInputChange}
                placeholder="streetAddress 2 "
                className="w-full bg-newWhite text-newBlack p-3 pl-10 border border-gray-300 rounded-lg"
              />
              {errors.streetAddress2 && <span className="text-red-500 text-sm mt-1 block">{errors.streetAddress2}</span>}
            </div>
            <div className="relative">
              <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City"
                className="w-full bg-newWhite text-newBlack p-3 pl-10 border border-gray-300 rounded-lg"
              />
              {errors.city && <span className="text-red-500 text-sm mt-1 block">{errors.city}</span>}
            </div>

          </div>
          <div className="grid lg:grid-cols-2 gap-2">
            <div className="relative">
              <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="State"
                className="w-full bg-newWhite text-newBlack p-3 pl-10 border border-gray-300 rounded-lg"
              />
              {errors.state && <span className="text-red-500 text-sm mt-1 block">{errors.state}</span>}
            </div>


            <div className="relative">
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                name="pinCode"
                value={formData.pinCode}
                onChange={handleInputChange}
                placeholder="Pin Code"
                className="w-full bg-newWhite text-newBlack p-3 pl-10 border border-gray-300 rounded-lg"
                maxLength={6}
              />
              {errors.pinCode && <span className="text-red-500 text-sm mt-1 block">{errors.pinode}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
);

// Second Tab Component
const SecondTabContent = React.memo(
  ({ handleGSTOption, formData, handleFileChange, handleInputChange, handleRemoveFile, uploadingFiles, errors , filePreviews }) => (
    <div className="p-6 bg-black/5 rounded-lg">
      <h1 className="text-2xl text-newBlack font-bold mb-6">
        Business &amp; KYC Verification
      </h1>

      {/* ========== GST Section ========== */}
      <div className="mb-6">
        <label className="block text-gray-900 mb-2">
          Do You have GST Number
        </label>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => handleGSTOption(true)}
            className={`px-8 py-2 rounded ${formData.hasGST ? "bg-gray-900 text-white" : "bg-white text-gray-900"
              }`}
          >
            Yes
          </button>
          <button
            onClick={() => handleGSTOption(false)}
            className={`px-8 py-2 rounded ${formData.hasGST === false ? "bg-gray-900 text-white" : "bg-white text-gray-900"
              }`}
          >
            No
          </button>
        </div>

        {formData.hasGST && (
          <>
            <div className="mb-4">
              <label className="block text-gray-900 mb-2">GST Number</label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleInputChange}
                className="w-full p-2 bg-white rounded text-newBlack"
              />
              {errors.gstNumber && <span className="text-red-500 text-sm mt-1">{errors.gstNumber}</span>}
            </div>

            {/* GST Document – allows PDF */}
            <div className="mb-4">
              <div className="rounded p-4 text-center bg-newWhite text-newBlack relative">
                <input
                  type="file"
                  name="gstDocument"
                  onChange={handleFileChange}
                  className="hidden"
                  id="gstDocument"
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                {errors.gstDocument && <span className="text-red-500 text-sm mt-1 block">{errors.gstDocument}</span>}
                <label
                  htmlFor="gstDocument"
                  className="cursor-pointer w-full h-full flex items-center justify-center"
                >
                  {uploadingFiles.gstDocument ? (
                    <div className="w-full h-48 flex items-center justify-center">
                      <span className="loading loading-spinner loading-lg text-newBlack"></span>
                    </div>
                  ) : formData.gstDocument ? (
                    <PreviewUploads
                      previewUrl={filePreviews.gstDocument}
                      onRemove={() => handleRemoveFile("gstDocument")}
                      name="GST Document"
                      isLoading={uploadingFiles.gstDocument}
                      isUploaded={formData.gstDocument !== null}
                      isPDF={formData.gstDocument?.endsWith('.pdf')}
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="mb-2 flex items-center justify-center w-12 h-12 rounded-full bg-newYellow">
                        <Upload className="w-6 h-6 text-newBlack" />
                      </div>
                      <span className="block font-semibold mb-1">
                        GST Document
                      </span>
                      <span className="block mb-1">Click or drop to upload</span>
                      <span className="text-sm block">
                        Supports PDF, JPG, JPEG, PNG
                      </span>
                    </div>
                  )}
                </label>
              </div>

            </div>
          </>
        )}

        {!formData.hasGST && (
          <div className="mb-4">
            <a
              href={Document}
              download
              className="flex items-center bg-newWhite text-newBlack px-4 py-3 rounded-lg border border-gray-300 hover:shadow-md transition-shadow"
            >
              <Download className="w-6 h-6 mr-2" />
              <div>
                <p className="font-semibold">
                  Download GST Declaration Form
                </p>
                <p className="text-xs">
                  Download this form, fill in the details, then upload it
                </p>
              </div>
            </a>

            {/* GST Declaration – allows PDF */}
            <div className="mt-4">
              <div className="rounded p-4 text-center bg-newWhite text-newBlack relative">
                <input
                  type="file"
                  name="gstDeclaration"
                  onChange={handleFileChange}
                  className="hidden"
                  id="gstDeclaration"
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                <label
                  htmlFor="gstDeclaration"
                  className="cursor-pointer w-full h-full flex items-center justify-center"
                >
                  {uploadingFiles.gstDeclaration ? (
                    <div className="w-full h-48 flex items-center justify-center">
                      <span className="loading loading-spinner loading-lg text-newBlack"></span>
                    </div>
                  ) : formData.gstDeclaration ? (
                    <PreviewUploads
                    file={formData.gstDeclaration}
                    previewUrl={filePreviews.gstDeclaration}
                    onRemove={() => handleRemoveFile("gstDeclaration")}
                    name="GST Declaration"
                    isPDF={formData.gstDeclaration?.endsWith('.pdf')}
                  />
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="mb-2 flex items-center justify-center w-12 h-12 rounded-full bg-newYellow">
                        <Upload className="w-6 h-6 text-newBlack" />
                      </div>
                      <span className="block font-semibold mb-1">
                        Filled Declaration Form
                      </span>
                      <span className="text-sm block">
                        Supports PDF, JPG, JPEG, PNG
                      </span>
                    </div>
                  )}
                </label>
              </div>
              {errors.gstDeclaration && <span className="text-red-500 text-sm mt-1 block">{errors.gstDeclaration}</span>}
            </div>
          </div>
        )}
      </div>

      {/* ========== PAN Section ========== */}
      <div className="mb-6">
        <div className="mb-4">
          <label className="block text-gray-900 mb-2">PAN Number</label>
          <input
            type="text"
            name="panNumber"
            value={formData.panNumber}
            onChange={handleInputChange}
            className="w-full p-2 bg-white rounded text-newBlack"
          />
          {errors.panNumber && <span className="text-red-500 text-sm mt-1">{errors.panNumber}</span>}
        </div>
        {/* PAN Front Side – images only */}
        <div className="mb-4">
          <div className="rounded p-4 text-center bg-newWhite text-newBlack relative">
            <input
              type="file"
              name="panFront"
              onChange={handleFileChange}
              className="hidden"
              id="panFront"
              accept=".jpg,.jpeg,.png"
            />
            {errors.panFront && <span className="text-red-500 text-sm mt-1">{errors.panFront}</span>}
            <label
              htmlFor="panFront"
              className="cursor-pointer w-full h-full flex items-center justify-center"
            >
              {uploadingFiles.panFront ? (
                <div className="w-full h-48 flex items-center justify-center">
                  <span className="loading loading-spinner loading-lg text-newBlack"></span>
                </div>
              ) : formData.panFront ? (
                <PreviewUploads
                file={formData.panFront}
                previewUrl={filePreviews.panFront}
                onRemove={() => handleRemoveFile("panFront")}
                name="Pan Front"
              />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="mb-2 flex items-center justify-center w-12 h-12 rounded-full bg-newYellow">
                    <Upload className="w-6 h-6 text-newBlack" />
                  </div>
                  <span className="block font-semibold mb-1">
                    PAN Front Side
                  </span>
                  <span className="block mb-1">
                    Click or drop to upload image
                  </span>
                  <span className="text-sm block">
                    Supports JPG, JPEG, PNG
                  </span>
                </div>
              )}
            </label>
          </div>

        </div>
      </div>

      {/* ========== Aadhaar Section ========== */}
      <div className="mb-6">
        <div className="mb-4">
          <label className="block text-gray-900 mb-2">
            Aadhaar Number
          </label>
          <input
            type="text"
            name="aadhaarNumber"
            value={formData.aadhaarNumber}
            onChange={handleInputChange}
            className="w-full p-2 bg-white rounded text-newBlack"
            maxLength={12}
          />
          {errors.aadhaarNumber && <span className="text-red-500 text-sm mt-1">{errors.aadhaarNumber}</span>}
        </div>

        {/* Aadhaar Front Side – images only */}
        <div className="mb-4">
          <div className="rounded p-4 text-center bg-newWhite text-newBlack relative">
            <input
              type="file"
              name="aadhaarFront"
              onChange={handleFileChange}
              className="hidden"
              id="aadhaarFront"
              accept=".jpg,.jpeg,.png"
            />
            {errors.aadhaarFront && <span className="text-red-500 text-sm mt-1">{errors.aadhaarFront}</span>}
            <label
              htmlFor="aadhaarFront"
              className="cursor-pointer w-full h-full flex items-center justify-center"
            >
              {uploadingFiles.aadhaarFront ? (
                <div className="w-full h-48 flex items-center justify-center">
                  <span className="loading loading-spinner loading-lg text-newBlack"></span>
                </div>
              ) : formData.aadhaarFront ? (
                <PreviewUploads
                file={formData.aadhaarFront}
                previewUrl={filePreviews.aadhaarFront}
                onRemove={() => handleRemoveFile("aadhaarFront")}
                name="Aadhaar Front"
              />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="mb-2 flex items-center justify-center w-12 h-12 rounded-full bg-newYellow">
                    <Upload className="w-6 h-6 text-newBlack" />
                  </div>
                  <span className="block font-semibold mb-1">
                    Aadhaar Front Side
                  </span>
                  <span className="block mb-1">
                    Click or drop to upload image
                  </span>
                  <span className="text-sm block">
                    Supports JPG, JPEG, PNG
                  </span>
                </div>
              )}
            </label>
          </div>

        </div>

        {/* Aadhaar Back Side – images only */}
        <div className="mb-4">
          <div className="rounded p-4 text-center bg-newWhite text-newBlack relative">
            <input
              type="file"
              name="aadhaarBack"
              onChange={handleFileChange}
              className="hidden"
              id="aadhaarBack"
              accept=".jpg,.jpeg,.png"
            />
            {errors.aadhaarBack && <span className="text-red-500 text-sm mt-1">{errors.aadhaarBack}</span>}
            <label
              htmlFor="aadhaarBack"
              className="cursor-pointer w-full h-full flex items-center justify-center"
            >
              {uploadingFiles.aadhaarBack ? (
                <div className="w-full h-48 flex items-center justify-center">
                  <span className="loading loading-spinner loading-lg text-newBlack"></span>
                </div>
              ) : formData.aadhaarBack ? (
                <PreviewUploads
                file={formData.aadhaarBack}
                previewUrl={filePreviews.aadhaarBack}
                onRemove={() => handleRemoveFile("aadhaarBack")}
                name="Aadhaar Back"
              />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="mb-2 flex items-center justify-center w-12 h-12 rounded-full bg-newYellow">
                    <Upload className="w-6 h-6 text-newBlack" />
                  </div>
                  <span className="block font-semibold mb-1">
                    Aadhaar Back Side
                  </span>
                  <span className="block mb-1">
                    Click or drop to upload image
                  </span>
                  <span className="text-sm block">
                    Supports JPG, JPEG, PNG
                  </span>
                </div>
              )}
            </label>
          </div>

        </div>
      </div>
    </div>
  )
);

// Third Tab Component
const ThirdTabContent = React.memo(
  ({ formData, setFormData, handleFileChange, handleRemoveFile, uploadingFiles, errors,filePreviews  }) => {
    const sellingChannels = {
      online: [
        { name: "Amazon", icon: amazon, needsProfile: true },
        { name: "Flipkart", icon: flipkart, needsProfile: true },
        { name: "Meesho", icon: meesho, needsProfile: true },
        { name: "Shopify", icon: shopify, needsProfile: true },
        { name: "Instagram", icon: insta, needsProfile: true },
        { name: "Facebook", icon: fb, needsProfile: true },
      ],
      offline: [
        { name: "Physical store", icon: <Store size={18} /> },
        { name: "Trade fairs", icon: <Layers size={18} /> },
        { name: "Direct selling", icon: <ShoppingBag size={18} /> },
      ],
    };

    const productCategories = [
      "Fashion & Accessories",
      "Electronics & Gadgets",
      "Beauty & Personal Care",
      "Home & Living",
      "Sports & Fitness",
      "Books, Hobbies & Stationery",
      "Food & Beverages",
      "Baby & Kids",
      "Health & Wellness",
      "Automobiles & Accessories",
      "Pets",
      "Gifts & Festive Needs",
      "Miscellaneous",
      "Others",
    ];

    // Safe array access using optional chaining
    const handleChannelToggle = useCallback((channelName) => {
      setFormData((prev) => ({
        ...prev,
        sellingChannels: prev.sellingChannels?.includes(channelName)
          ? prev.sellingChannels.filter((ch) => ch !== channelName)
          : [...(prev.sellingChannels || []), channelName],
      }));
    }, []);



    return (
      <div className="p-6 bg-black/5 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-newBlack mb-3 flex items-center">
          <Clock size={24} className="mr-2" />
          Seller Experience & Details
        </h2>

        {/* Selling Experience */}
        <div className="mb-3">
          <label className="block text-newBlack font-semibold mb-2 flex items-center">
            <Clock size={18} className="mr-2" />
            Selling Experience
          </label>
          <div className="grid lg:grid-cols-3 gap-4">
            {["3+ years", "1-3 years", "New Seller (<1 year)"].map((exp) => (
              <button
                key={exp}
                onClick={() =>
                  setFormData({ ...formData, sellerExperience: exp })
                }
                className={`p-3 rounded-lg border flex items-center justify-between ${formData.sellerExperience === exp
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-300 bg-newWhite text-newBlack hover:border-gray-900"
                  }`}
              >

                <span>{exp}</span>
                <span>
                  {formData.sellerExperience === exp ? (
                    <Check size={16} />
                  ) : (
                    <Circle size={16} />
                  )}
                </span>
              </button>
            ))}
            {errors.sellerExperience && <span className="text-red-500 text-sm block">{errors.sellerExperience}</span>}
          </div>
        </div>

        {/* Selling Channels */}
        <div className="mb-2">
          <label className="block text-gray-700 font-semibold mb-3 flex items-center">
            <Globe size={18} className="mr-2" />
            Selling Channels
          </label>

          <div className="space-y-4">
            {/* Online Channels */}
            <div className="bg-white p-2 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-newBlack mb-2 flex items-center">
                <Globe size={16} className="mr-2" />
                Online Channels
              </h3>
              <div className="grid lg:grid-cols-2 gap-3">
                {sellingChannels.online.map((channel) => (
                  <div key={channel.name} className="space-y-2">
                    <label
                      className={`flex items-center p-3 rounded-lg border cursor-pointer ${(formData.sellingChannels || []).includes(channel.name)
                        ? "bg-gray-900 text-white border-gray-900"
                        : "border-gray-300 text-newBlack bg-newWhite hover:border-gray-900"
                        }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={(formData.sellingChannels || []).includes(
                          channel.name
                        )}
                        onChange={() => handleChannelToggle(channel.name)}
                      />
                      <span className="mr-2"><img src={channel.icon} alt={channel.name} /></span>
                      {channel.name}
                    </label>

                    {(formData.sellingChannels || []).includes(channel.name) &&
                      channel.needsProfile && (
                        <div className="relative">
                          <Globe size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            type="text"
                            placeholder={`Enter ${channel.name} profile/store URL`}
                            value={formData.channelProfiles?.[channel.name] || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                channelProfiles: {
                                  ...prev.channelProfiles,
                                  [channel.name]: e.target.value,
                                },
                              }))
                            }
                            className="w-full p-2 pl-8 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                      )}
                  </div>
                ))}
                {errors.sellingChannels && <span className="text-red-500 text-sm block mt-1">{errors.sellingChannels}</span>}
              </div>
            </div>

            {/* Offline Channels */}
            <div className="bg-white p-2 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-newBlack mb-2 flex items-center">
                <Store size={16} className="mr-2" />
                Offline Channels
              </h3>
              <div className="grid lg:grid-cols-3 gap-3">
                {sellingChannels.offline.map((channel) => (
                  <label
                    key={channel.name}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${(formData.sellingChannels || []).includes(channel.name)
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-300 text-newBlack bg-newWhite hover:border-gray-900"
                      }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">{channel.icon}</span>
                      <span>{channel.name}</span>
                    </div>
                    <div className="flex-shrink-0">
                      {(formData.sellingChannels || []).includes(channel.name) ? (
                        <Check size={16} />
                      ) : (
                        <Circle size={16} />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={(formData.sellingChannels || []).includes(channel.name)}
                      onChange={() => {
                        const currentChannels = formData.sellingChannels || [];
                        const updated = currentChannels.includes(channel.name)
                          ? currentChannels.filter((ch) => ch !== channel.name)
                          : [...currentChannels, channel.name];
                        setFormData({ ...formData, sellingChannels: updated });
                      }}
                    />
                  </label>
                ))}
                {errors.sellingChannels && <span className="text-red-500 text-sm block mt-2">{errors.sellingChannels}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Product Catalog Section - NEW */}
         <div className="mb-8 bg-white p-4 rounded-lg shadow-md">
                  <label className="block text-newBlack font-semibold mb-3 flex items-center">
                    <FileText size={18} className="mr-2" />
                    Product Catalog
                  </label>
        
                  <div className="space-y-4">
                    {/* Upload Option */}
                    <div className="mb-4">
                      <div className="rounded p-4 text-center bg-newWhite text-newBlack relative">
                        <input
                          type="file"
                          name="productCatalogFile"
                          onChange={handleFileChange}
                          className="hidden"
                          id="productCatalogFile"
                          accept=".jpg,.jpeg,.png,.pdf"
                        />
                        <label
                          htmlFor="productCatalogFile"
                          className="cursor-pointer w-full h-full flex items-center justify-center"
                        >
                          {uploadingFiles?.productCatalogFile ? (
                            <div className="w-full h-48 flex items-center justify-center">
                              <span className="loading loading-spinner loading-lg text-newBlack"></span>
                            </div>
                          ) : formData.productCatalogFile ? (
                            <PreviewUploads
                            file={formData.productCatalogFile}
                            previewUrl={filePreviews.productCatalogFile}
                            onRemove={() => handleRemoveFile("productCatalogFile")}
                            name="productCatalogFile"
                            isPDF={formData.productCatalogFile?.endsWith('.pdf')}
                          />
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="mb-2 flex items-center justify-center w-12 h-12 rounded-full bg-newYellow">
                                <Upload className="w-6 h-6 text-newBlack" />
                              </div>
                              <span className="block font-semibold mb-1">
                                Product Catalog
                              </span>
                              <span className="block mb-1">Click or drop to upload</span>
                              <span className="text-sm block">
                                Supports PDF, JPG, JPEG, PNG
                              </span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
        
                    {/* Or Divider
                    <div className="flex items-center justify-center">
                      <div className="border-t border-gray-300 flex-grow mr-4"></div>
                      <span className="text-gray-500 font-medium">OR</span>
                      <div className="border-t border-gray-300 flex-grow ml-4"></div>
                    </div> */}
        
                    {/* Link Option */}
                    <div className="relative">
                      <Link size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        value={formData.productCatalogLink}
                        onChange={(e) => setFormData({ ...formData, productCatalogLink: e.target.value })}
                        placeholder="Enter product catalog link"
                        className="w-full p-3 pl-10 border border-gray-300 text-newBlack bg-newWhite rounded-lg"
                      />
                    </div>
        
                    {errors.productCatalog && <span className="text-red-500 text-sm block mt-2">{errors.productCatalog}</span>}
                  </div>
                </div>

        {/* Product Categories */}
        <div className="mb-8 bg-white p-4 rounded-lg shadow-md">
          <label className="block text-newBlack font-semibold mb-3 flex items-center">
            <Tag size={18} className="mr-2" />
            Select Product Categories
          </label>
          <div className="grid lg:grid-cols-3 gap-3">
            {productCategories.map((category) => (
              <label
                key={category}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${(formData.productCategories || []).includes(category)
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-300 text-newBlack bg-newWhite hover:border-gray-900"
                  }`}
              >
                <div className="flex items-center">
                  <span className="mr-2">
                    {(formData.productCategories || []).includes(category) ? (
                      <Check size={16} />
                    ) : (
                      <Circle size={16} />
                    )}
                  </span>
                  <span>{category}</span>
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={(formData.productCategories || []).includes(category)}
                  onChange={() => {
                    setFormData((prev) => ({
                      ...prev,
                      productCategories: prev.productCategories?.includes(category)
                        ? prev.productCategories.filter((cat) => cat !== category)
                        : [...(prev.productCategories || []), category],
                    }));
                  }}
                />
              </label>
            ))}
            {errors.productCategories && <span className="text-red-500 text-sm block mt-1">{errors.productCategories}</span>}
          </div>
        </div>

        {/* Live Selling */}
        <div className="mb-8">
          <label className="block text-gray-700 font-semibold mb-3 flex items-center">
            <Camera size={18} className="mr-2" />
            Live Selling Readiness
          </label>

          <div className="space-y-4">
            <div className="bg-white p-2 rounded-lg shadow-md">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar size={16} className="mr-2" />
                How often can you go live?
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <select
                  value={formData.liveSellingFrequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      liveSellingFrequency: e.target.value,
                    })
                  }
                  className="w-full p-3 pl-10 border border-gray-300 text-newBlack bg-newWhite rounded-lg"
                >
                  <option value="">Select frequency</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="occasionally">Occasionally</option>
                </select>
              </div>
              {errors.liveSellingFrequency && <span className="text-red-500 text-sm block mt-1">{errors.liveSellingFrequency}</span>}
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.cameraSetup}
                  onChange={(e) =>
                    setFormData({ ...formData, cameraSetup: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 flex items-center">
                  <Camera size={16} className="mr-2" />
                  I have a good camera & lighting setup
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

// Fourth Tab Component
const FourthTabContent = React.memo(({ formData, setFormData, errors }) => (
  <div className="p-6 bg-black/5 rounded-lg shadow-md">
    <h2 className="text-2xl font-bold mb-3 text-newBlack">
      Logistics & Fulfillment
    </h2>
    {/* Shipping Method */}
    <div className="mb-8">
      <label className="block text-newBlack font-semibold mb-3">
        Preferred Shipping Method
      </label>
      <div className="grid lg:grid-cols-2 gap-4">
        {[
          {
            name: "Flykup Logistics",
            value: "flykup",
            icon: <Truck className="h-6 w-6 text-purple-500" />,
            description: "We handle shipping & fulfillment",
          },
          {
            name: "Self-shipping",
            value: "self",
            icon: <Package className="h-6 w-6 text-purple-500" />,
            description: "Use your own courier partner",
          },
        ].map((method) => (
          <button
            key={method.value}
            onClick={() =>
              setFormData({ ...formData, preferredShipping: method.value })
            }
            className={`p-4 rounded-lg border text-left ${formData.preferredShipping === method.value
              ? "bg-gray-900 text-white border-gray-900"
              : "border-gray-300 bg-newWhite hover:border-gray-900"
              }`}
          >
            <div className="flex items-center mb-2">
              {method.icon}
              <span
                className={`ml-2 font-medium  ${formData.preferredShipping === method.value
                  ? "text-white "
                  : "text-black"
                  }`}
              >
                {method.name}
              </span>
            </div>
            <p
              className={`text-sm opacity-80  ${formData.preferredShipping === method.value
                ? "text-white "
                : "text-black"
                }`}
            >
              {method.description}
            </p>
          </button>
        ))}
        {errors.preferredShipping && <span className="text-red-500 text-sm block mt-1">{errors.preferredShipping}</span>}
      </div>

      {formData.preferredShipping === "self" && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Courier Partner
            </label>
            <input
              type="text"
              value={formData.courierPartner}
              onChange={(e) =>
                setFormData({ ...formData, courierPartner: e.target.value })
              }
              className="w-full p-3 text-newBlack border bg-newWhite border-gray-300 rounded-lg"
              placeholder="Enter courier partner name"
            />
          </div>
          {errors.courierPartner && <span className="text-red-500 text-sm block mt-1">{errors.courierPartner}</span>}
        </div>
      )}
    </div>

    {/* Dispatch Time */}
    <div className="mb-8">
      <label className="block text-gray-700 font-semibold mb-3 flex items-center">
        <Truck size={18} className="mr-2" />
        Dispatch Time
      </label>
      <div className="grid lg:grid-cols-3 gap-4">
        {[
          { label: "Same Day", value: "same_day" },
          { label: "1-3 Days", value: "1-3_days" },
          { label: "3-5 Days", value: "3-5_days" },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() =>
              setFormData({ ...formData, dispatchTime: option.value })
            }
            className={`p-3 rounded-lg border flex items-center justify-between ${formData.dispatchTime === option.value
              ? "bg-gray-900 text-white border-gray-900"
              : "border-gray-300 bg-newWhite text-newBlack hover:border-gray-900"
              }`}
          >
            <div className="flex items-center">
              <Clock size={16} className="mr-2" />
              <span>{option.label}</span>
            </div>
            <span>
              {formData.dispatchTime === option.value ? (
                <Check size={16} />
              ) : (
                <Circle size={16} />
              )}
            </span>
          </button>
        ))}
      </div>
      {errors.dispatchTime && <span className="text-red-500 text-sm block mt-1">{errors.dispatchTime}</span>}
    </div>

    {/* Return Policy */}
    <div className="mb-8">
      <label className="block text-gray-700 font-semibold mb-3">
        Return & Warranty Policy
      </label>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "7 Days Return", value: "7_days" },
          { label: "15 Days Return", value: "15_days" },
          { label: "No Return", value: "no_return" },
          { label: "Warranty Available", value: "warranty" },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() =>
              setFormData({ ...formData, returnPolicy: option.value })
            }
            className={`p-3 rounded-lg border flex items-center justify-between ${formData.returnPolicy === option.value
              ? "bg-gray-900 text-white border-gray-900"
              : "border-gray-300 bg-newWhite text-newBlack hover:border-gray-900"
              }`}
          >
            <span>{option.label}</span>
            <span>
              {formData.returnPolicy === option.value ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              )}
            </span>
          </button>
        ))}
      </div>
      {errors.returnPolicy && <span className="text-red-500 text-sm block mt-1">{errors.returnPolicy}</span>}
    </div>
  </div>
));

const BrandSeller = () => {
  const [activeTab, setActiveTab] = useState(0);
  const totalTabs = 4;
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const { setUser } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [isGeneralModalOpen, setGeneralModalOpen] = useState(false);
  const [isSellerModalOpen, setSellerModalOpen] = useState(false);
  const [isDigitalModalOpen, setDigitalModalOpen] = useState(false);

  const [generalAccepted, setGeneralAccepted] = useState(false);
  const [sellerAccepted, setSellerAccepted] = useState(false);
  const [digitalAccepted, setDigitalAccepted] = useState(false);

  const [formData, setFormData] = useState({
    // Tab 1
    name: "",
    mobileNumber: "",
    email: "",
    businessType: "",
    streetAddress1: "",
    city: "",
    state: "",
    streetAddress2: "",
    pinCode: "",
    // Tab 2
    hasGST: true,
    gstNumber: "",
    gstDocument: null,
    gstDeclaration: null,
    panNumber: "",
    panFront: null,
    aadhaarNumber: "",
    aadhaarFront: null,
    aadhaarBack: null,

    // Tab 3
    sellerExperience: "",
    sellingChannels: [],
    channelProfiles: {},
    productCategories: [],
    productCatalog: "",
    productCatalogLink: "",
    productCatalogFile: "",
    liveSellingFrequency: "",
    cameraSetup: false,

    // Tab 4
    preferredShipping: "",
    dispatchTime: "",
    returnPolicy: "",
    courierPartner: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
   const [filePreviews, setFilePreviews] = useState({
     gstDocument: null,
     panFront: null,
     aadhaarFront: null,
     aadhaarBack: null,
     productCatalogFile: null,
     gstDeclaration: null
   });
   const [uploadingFiles, setUploadingFiles] = useState({});
   
   const handleUploadSuccess = (uploadResult, fieldName) => {
     console.log('Upload successful:', uploadResult);
     // If you need to store additional metadata:
     setFormData(prev => ({
       ...prev,
       [`${fieldName}_metadata`]: uploadResult 
     }));
   };
 
   const handleFileChange = createAzureFileHandler({
     setFormData,
     setFilePreviews,
     generateSasEndpoint: IMAGE_UPLOADTO_AZURE,
     onUploadStart: (fieldName) => {
       setUploadingFiles(prev => ({ ...prev, [fieldName]: true }));
     },
     onUploadSuccess: (result, fieldName) => {
       setUploadingFiles(prev => ({ ...prev, [fieldName]: false }));
       setFormData(prev => ({
         ...prev,
         [fieldName]: result.blobName
       }));
     },
     onUploadError: (error, fieldName) => {
       setUploadingFiles(prev => ({ ...prev, [fieldName]: false }));
       handleRemoveFile(fieldName);
     }
   });
 
   
 
 
   // Update your handleRemoveFile function
   const handleRemoveFile = (fieldName) => {
     setFormData(prev => ({ ...prev, [fieldName]: null }));
     if (filePreviews[fieldName]) {
       URL.revokeObjectURL(filePreviews[fieldName]);
     }
     setFilePreviews(prev => ({ ...prev, [fieldName]: null }));
   };
 
 


  // Stable callback handlers
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);



  const handleBusinessTypeSelect = useCallback((type) => {

    setFormData((prev) => ({ ...prev, businessType: type }));
  }, []);

  const handleGSTOption = useCallback((hasGST) => {
    setFormData((prev) => ({ ...prev, hasGST }));
  }, []);


  const validateTab = useCallback((tab) => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[6-9]\d{9}$/;
    const pincodeRegex = /^\d{6}$/;
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const aadhaarRegex = /^\d{12}$/;

    if (tab === 0) {
      if (!formData.name.trim()) newErrors.name = "Full Name is required";
      if (!formData.mobileNumber.trim()) newErrors.mobileNumber = "Mobile Number is required";
      else if (!mobileRegex.test(formData.mobileNumber)) newErrors.mobileNumber = "Invalid mobile number";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email format";
      if (formData.businessType == "") {
        newErrors.businessType = "Business Type is required";
      }
      if (!formData.streetAddress1.trim()) newErrors.streetAddress1 = "Street Address 1 is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.state.trim()) newErrors.state = "State is required";
      if (!formData.streetAddress2.trim()) newErrors.streetAddress2 = "streetAddress 2 is required";
      if (!formData.pinCode.trim()) newErrors.pinCode = "Pin Code is required";
      else if (!pincodeRegex.test(formData.pinCode)) newErrors.pinCode = "Invalid pin code";
    } else if (tab === 1) {
      if (formData.hasGST) {
        if (!formData.gstNumber.trim()) newErrors.gstNumber = "GST Number is required";
        else if (!gstRegex.test(formData.gstNumber)) newErrors.gstNumber = "Invalid GST format";
        if (!formData.gstDocument) newErrors.gstDocument = "GST Document is required";
      } else {
        if (!formData.gstDeclaration) newErrors.gstDeclaration = "GST Declaration is required";
      }
      if (!formData.panNumber.trim()) newErrors.panNumber = "PAN Number is required";
      else if (!panRegex.test(formData.panNumber)) newErrors.panNumber = "Invalid PAN format";
      if (!formData.panFront) newErrors.panFront = "PAN Front image is required";
      if (!formData.aadhaarNumber.trim()) newErrors.aadhaarNumber = "Aadhaar Number is required";
      else if (!aadhaarRegex.test(formData.aadhaarNumber)) newErrors.aadhaarNumber = "Invalid Aadhaar number";
      if (!formData.aadhaarFront) newErrors.aadhaarFront = "Aadhaar Front image is required";
      if (!formData.aadhaarBack) newErrors.aadhaarBack = "Aadhaar Back image is required";
    } else if (tab === 2) {
      if (!formData.sellerExperience) newErrors.sellerExperience = "Please select selling experience";
      if (!formData.productCategories?.length) newErrors.productCategories = "Please select at least one product category";

    } else if (tab === 3) {
      if (!formData.preferredShipping) newErrors.preferredShipping = "Please select shipping method";
      if (formData.preferredShipping === "self" && !formData.courierPartner?.trim()) {
        newErrors.courierPartner = "Courier partner is required";
      }
      if (!formData.dispatchTime) newErrors.dispatchTime = "Please select dispatch time";
      if (!formData.returnPolicy) newErrors.returnPolicy = "Please select return policy";
    }

    return newErrors;
  }, [formData]);

  const handleNext = useCallback(() => {
    const tabErrors = validateTab(activeTab);
    console.log("Tab errors:", tabErrors);
    if (Object.keys(tabErrors).length === 0) {
      setActiveTab(prev => Math.min(totalTabs - 1, prev + 1));
      setErrors({});
    } else {
      setErrors(tabErrors);
    }
  }, [activeTab, validateTab]);



  const formatSubmissionData = () => {
    return {
      companyName: formData.name,
      mobileNumber: formData.mobileNumber,
      email: formData.email,
      sellerType: "brand",
      businessType: formData.businessType,
      productCategories: formData.productCategories || [],
      productCatalog: {
        link: formData.productCatalogLink,
        file: formData.productCatalogFile
      },

      sellerExperienceInfo: {
        online: (formData.sellingChannels || [])
          .filter(channel => ["Amazon", "Flipkart", "Meesho", "Shopify", "Instagram", "Facebook"].includes(channel))
          .map(platform => ({
            platform,
            profile: formData.channelProfiles?.[platform] || ""
          })),
        offline: (formData.sellingChannels || [])
          .filter(channel => ["Physical store", "Trade fairs", "Direct selling"].includes(channel)),
        experience: formData.sellerExperience
      },
      gstInfo: {
        hasGST: formData.hasGST,
        gstDeclaration: formData.gstDeclaration,
        gstNumber: formData.gstNumber,
        gstDocument: formData.gstDocument
      },
      aadhaarInfo: {
        aadhaarNumber: formData.aadhaarNumber,
        aadhaarFront: formData.aadhaarFront,
        aadhaarBack: formData.aadhaarBack
      },
      panInfo: {
        panNumber: formData.panNumber,
        panFront: formData.panFront
      },
      shippingInfo: {
        preferredShipping: formData.preferredShipping,
        dispatchTime: formData.dispatchTime,
        returnPolicy: formData.returnPolicy,
        courierPartner: formData.courierPartner
      },
      readiness: {
        liveSellingFrequency: formData.liveSellingFrequency,
        cameraSetup: formData.cameraSetup,
        isWillingToGoLive: Boolean(formData.liveSellingFrequency)
      },
      promotions: {
        promoteLiveSelling: Boolean(formData.liveSellingFrequency),
        brandPromotion: false,
        flykupCollab: false
      },
      address: {
        addressLine1: formData.streetAddress1,
        addressLine2: formData.streetAddress2,
        city: formData.city,
        state: formData.state,
        pincode: formData.pinCode
      }
    };
  };

   const handleSubmit = async () => {
      const finalErrors = validateTab(activeTab);
      if (Object.keys(finalErrors).length > 0) {
        setErrors(finalErrors);
        return;
      }
    
      if (!generalAccepted || !sellerAccepted || !digitalAccepted) {
        alert("Please accept the terms and conditions.");
        return;
      }
    
      try {
        const submissionData = formatSubmissionData();

        // Add terms acceptance to submission data
        submissionData.generalAccepted = generalAccepted;
        submissionData.sellerAccepted = sellerAccepted;
        submissionData.digitalAccepted = digitalAccepted;

      
    
        const response = await axiosInstance.put(
          SELLER_APPLICATION,
          submissionData, 
          {
            headers: {
              'Content-Type': 'application/json', 
            },
          }
        );
    
        if (response.status === 200) {
          const updatedUserData = response.data.data;
          setUser(updatedUserData);
          setShowSuccessModal(true);
        }
      } catch (error) {
      console.error("Error submitting form:", error);
      if (error.response) {
        alert(
          error.response.data.message || "An error occurred. Please try again."
        );
      } else if (error.request) {
        alert("No response received from the server. Please check your connection.");
      } else {
        alert("An error occurred. Please try again.");
      }
    }finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessModalClose = async () => {
    try {


      const response = await axiosInstance.get(
        GET_USER_DETAILS_BY_ID
      );
      if (response.data?.status) {
        const updatedUserData = response.data.data;
        setUser(updatedUserData);
      }

    } catch (error) {
      console.error("Error fetching updated user data:", error.message);
    } finally {
      setShowSuccessModal(false);
      navigate("/user");
    }
  };



  const handleCloseModal = () => {
    setGeneralModalOpen(false);
    setSellerModalOpen(false);
    setDigitalModalOpen(false);
  };

  const handleAcceptGeneralTerms = () => {
    setGeneralAccepted(true);
    setGeneralModalOpen(false);
  };

  const handleAcceptSellerTerms = () => {
    setSellerAccepted(true);
    setSellerModalOpen(false);
  };

  const handleAcceptDigitalTerms = () => {
    setDigitalAccepted(true);
    setDigitalModalOpen(false);
  };

  return (
    <div className="w-full mx-auto lg:p-6 p-3 bg-newYellow mb-10">
      {/* Progress Bar */}
      <div className="mb-8 relative flex justify-center overflow-hidden">
        <Link
          to={'/user/sellerform'}
          className="btn btn-ghost btn-sm bg-white/30 backdrop-blur-md text-newBlack absolute top-0 left-0 border border-white/20 z-20"
        >
          <FaArrowCircleLeft size={20} /> <span className="text-sm">Back</span>
        </Link>
        <div className="flex justify-between w-[300px] relative z-10 mt-10">
          {[...Array(totalTabs)].map((_, index) => (
            <div
              key={index}
              className={`w-1/4 h-4 rounded-full transition-all duration-300 ease-in-out ${index <= activeTab ? "bg-newBlack" : "bg-gray-200"
                }`}
            />
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 0 && (
        <FirstTabContent
          formData={formData}
          handleInputChange={handleInputChange}
          handleBusinessTypeSelect={handleBusinessTypeSelect}
          errors={errors}
        />
      )}


      {activeTab === 1 && (
        <SecondTabContent
          formData={formData}
          handleInputChange={handleInputChange}
          handleGSTOption={handleGSTOption}
          handleRemoveFile={handleRemoveFile}
          uploadingFiles={uploadingFiles}
          handleFileChange={handleFileChange}
          filePreviews={filePreviews}
          errors={errors}
        />
      )}


      {activeTab === 2 && (
        <ThirdTabContent
          formData={formData}
          setFormData={setFormData}
          handleRemoveFile={handleRemoveFile}
          uploadingFiles={uploadingFiles}
          handleFileChange={handleFileChange}
          filePreviews={filePreviews}
          errors={errors}
        />
      )}


      {activeTab === 3 && (
        <FourthTabContent formData={formData} setFormData={setFormData} errors={errors} />
      )}

      {/* Navigation Buttons */}
      <>
        <div className="flex flex-col gap-4 mt-8">
          {/* Navigation buttons */}
          <div className="flex justify-between w-full">
            <button
              onClick={() => setActiveTab((prev) => Math.max(0, prev - 1))}
              disabled={activeTab === 0}
              className={`
        flex items-center justify-center px-4 py-2
        rounded-lg font-medium transition-all duration-200
        ${activeTab === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'text-newBlack'
                }
      `}
            >
              <ArrowLeft className="h-5 w-5 mr-1" strokeWidth={2.5} />
              Back
            </button>

            {activeTab !== totalTabs - 1 && (
              <button
                onClick={handleNext}
                className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:transform active:scale-95"
              >
                Next
                <ArrowRight className="h-5 w-5 ml-1" />
              </button>
            )}
          </div>

          {/* Terms and Submit button (only on final step) */}
          {activeTab === totalTabs - 1 && (
            <div className="flex flex-col w-full mt-2">
              <div className="flex items-start mb-4">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={generalAccepted}
                  onChange={() => setGeneralAccepted(!generalAccepted)}
                  className="mr-2 h-4 w-4 mt-1"
                />
                <label htmlFor="acceptTerms" className="text-sm text-black">
                  I accept the
                  <button
                    type="button"
                    onClick={() => setGeneralModalOpen(true)}
                    className="text-blue-500 font-bold hover:underline mx-1"
                  >
                    General Terms and Conditions
                  </button>
                  <span className="text-gray-500">(click to view)</span>
                </label>
              </div>
              <div className="flex items-start mb-4">
                <input
                  type="checkbox"
                  id="termsAcceptTerms"
                  checked={sellerAccepted}
                  onChange={() => setSellerAccepted(!sellerAccepted)}
                  className="mr-2 h-4 w-4 mt-1"
                />
                <label htmlFor="acceptTerms" className="text-sm text-black">
                  I accept the
                  <button
                    type="button"
                    onClick={() => setSellerModalOpen(true)}
                    className="text-blue-500 font-bold hover:underline mx-1"
                  >
                    Seller & Social Seller Agreement
                  </button>
                  <span className="text-gray-500">(click to view)</span>
                </label>
              </div>
              <div className="flex items-start mb-4">
                <input
                  type="checkbox"
                  id="digitalAcceptTerms"
                  checked={digitalAccepted}
                  onChange={() => setDigitalAccepted(!digitalAccepted)}
                  className="mr-2 h-4 w-4 mt-1"
                />
                <label htmlFor="acceptTerms" className="text-sm text-black">
                  I accept the
                  <button
                    type="button"
                    onClick={() => setDigitalModalOpen(true)}
                    className="text-blue-500 font-bold hover:underline mx-1"
                  >
                    Digital Consent & Audit Trail Policy
                  </button>
                  <span className="text-gray-500">(click to view)</span>
                </label>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!(generalAccepted && sellerAccepted && digitalAccepted)}
                className={`
                flex items-center justify-center w-full px-6 py-3 rounded-lg
                ${!(generalAccepted && sellerAccepted && digitalAccepted)
                    ? 'bg-gray-400 text-gray-100 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800 active:transform active:scale-95'
                  }
              `}
              >
                <Check className="h-5 w-5 mr-2" />
                Submit
              </button>

            </div>
          )}
        </div>

        <TermsAndConditionsModal
          isOpen={isGeneralModalOpen}
          onClose={handleCloseModal}
          onAccept={handleAcceptGeneralTerms}
        />
        <SellerAgreementModal
          isOpen={isSellerModalOpen}
          onClose={handleCloseModal}
          onAccept={handleAcceptSellerTerms}
        />
        <DigitalAgreementModal
          isOpen={isDigitalModalOpen}
          onClose={handleCloseModal}
          onAccept={handleAcceptDigitalTerms}
        />
      </>

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate__animated animate__zoomIn relative overflow-hidden">
            {/* Modal content - keep this exactly as provided */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-green-100 rounded-full blur-2xl opacity-60" />
            <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-blue-100 rounded-full blur-2xl opacity-60" />

            <div className="relative flex flex-col items-center gap-6">
              {/* Success Animation Container */}
              <div className="relative">
                <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-20" />
                <div className="relative bg-gradient-to-br from-green-50 to-green-100 rounded-full p-6 shadow-lg">
                  <CheckCircle className="w-16 h-16 text-green-500 animate-bounce" />
                </div>

                {/* Decorative Sparkles */}
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
                <Sparkles className="absolute -bottom-2 -left-2 w-6 h-6 text-yellow-400 animate-pulse" />
              </div>

              {/* Content */}
              <div className="space-y-2 text-center">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  Congratulations!
                </h3>
                <h4 className="text-xl font-semibold text-gray-700">
                  Application Received
                </h4>
              </div>

              <p className="text-center text-gray-600 leading-relaxed max-w-sm">
                Your seller application has been successfully submitted. We'll
                review your details and get back to you soon!
              </p>

              {/* Success Stats */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-green-600 font-semibold">Status</div>
                  <div className="text-sm text-gray-600">Under Review</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-blue-600 font-semibold">Est. Time</div>
                  <div className="text-sm text-gray-600">24-48 hrs</div>
                </div>
              </div>

              {/* Button */}
              <button
                onClick={handleSuccessModalClose}
                className="group w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Back to Home
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    

    </div>
  );
};

export default BrandSeller;
