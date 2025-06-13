import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import axiosInstance from "../../../utils/axiosInstance";
import { countries } from 'countries-list';

import {
    FaInfoCircle,
    FaPlus,
    FaRegTrashAlt,
    FaChevronDown,
    FaChevronLeft,
} from "react-icons/fa";
import { AiOutlinePercentage } from "react-icons/ai";
import {
    X,
    Settings,
    ShoppingCart,
    IndianRupee,
    Gavel,
    Shield,
    AlertCircle,
    ClipboardList,
    Tag,
    Factory,
    Weight,
    Ruler,
    CheckCircle,
    UserCircle,
    ShieldCheck,
    Info,
    Package,
    Image as ImageIcon,
    Archive,
    Hash,
    Box,
    MapPin,
    Scale,
    CalendarDays,
    NotebookText,
    Phone,
    FileText,
    Building,
    Globe,
    Container,
    Clock,
    Plus,
    Recycle,
} from "lucide-react";
import { HiUser, HiHashtag, HiDocumentText } from "react-icons/hi";

import {
    UPDATE_PRODUCT_LISTING,
    GET_CATEGORIES,
} from "../../api/apiDetails";

import { fieldMapping, getFieldsForCategory } from "./fieldMapping";
import { uploadImageToS3 } from "../../../utils/aws";

const EditProductListing = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const productFromState = location.state;
    const cdnURL = import.meta.env.VITE_AWS_CDN_URL;
    useEffect(() => {
        if (!productFromState?._id) {
            toast.error("Product data missing. Please navigate from the product list.");
            navigate("/seller/productlisting");
        }
    }, [productFromState, navigate]);


    const createInitialState = (productData) => {
        if (!productData) return {};

        // Helper to safely format date
        const formatDate = (dateString) => {
            if (!dateString) return "";
            try {
                return new Date(dateString).toISOString().split('T')[0];
            } catch (e) {
                console.warn("Could not parse date:", dateString);
                return "";
            }
        };

        return {
            _id: productData._id || "",
            title: productData.title || "",
            description: productData.description || "",
            quantity: productData.quantity?.toString() ?? "",
            images: productData.images?.map(img => ({
                key: img.key,
                jpgURL: img.jpgURL,
                preview: img.jpgURL,
                status: 'done',
                file: null
            })) || [],
            category: productData.category || "",
            subcategory: productData.subcategory || "",
            hsnNo: productData.hsnNo || "",
            MRP: productData.MRP?.toString() ?? "",
            productPrice: productData.productPrice?.toString() ?? "",
            startingPrice: productData.startingPrice?.toString() ?? "",
            reservedPrice: productData.reservedPrice?.toString() ?? "",
            commissionRate: productData.commissionRate?.toString() ?? "",
            brand: productData.brand || "",
            manufacturer: productData.manufacturer || "",
            manufacturerAddress: productData.manufacturerAddress || "",
            countryOfOrigin: productData.countryOfOrigin || "", // Will be initialized with country name string
            netQuantity: productData.netQuantity || "",
            packagingType: productData.packagingType || "",
            weight: {
                value: productData.weight?.value?.toString() ?? "",
                unit: productData.weight?.unit || "grams"
            },
            dimensions: {
                length: productData.dimensions?.length?.toString() ?? "",
                width: productData.dimensions?.width?.toString() ?? "",
                height: productData.dimensions?.height?.toString() ?? ""
            },
            expiryDate: formatDate(productData.expiryDate), // Use helper for safe date formatting
            shelfLife: productData.shelfLife || "",
            batchNumber: productData.batchNumber || "",
            gstRate: productData.gstRate?.toString() ?? "",
            sellerName: productData.sellerName || "",
            sellerContact: productData.sellerContact || "",
            sellerGSTIN: productData.sellerGSTIN || "",
            returnPolicy: productData.returnPolicy || [],
            warranty: {
                hasWarranty: productData.warranty?.hasWarranty || false,
                duration: productData.warranty?.duration || ""
            },
            fssaiLicenseNo: productData.fssaiLicenseNo || "",
            bisCertification: productData.bisCertification || "",
            importerName: productData.importerName || "",
            importerAddress: productData.importerAddress || "",
            importerGSTIN: productData.importerGSTIN || "",
            eWasteCompliance: productData.eWasteCompliance || false,
            recyclablePackaging: productData.recyclablePackaging || false,
            hazardousMaterials: productData.hazardousMaterials || "",
            allowDropshipping: productData.allowDropshipping || false,
            isActive: productData.isActive === undefined ? true : productData.isActive,
        };
    }

    const [productDetails, setProductDetails] = useState(() => createInitialState(productFromState));
    const [errors, setErrors] = useState({});
    const [categories, setCategories] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [returnPolicyInput, setReturnPolicyInput] = useState("");
    const [showDiscardModal, setShowDiscardModal] = useState(false);

    // --- State for Dynamic Fields (Required/Optional) ---
    const [requiredFields, setRequiredFields] = useState([]);
    const [optionalFields, setOptionalFields] = useState([]);

    // --- Prepare the country options list once using useMemo ---
    const countryOptions = useMemo(() => {
        return Object.entries(countries) // Get [code, {name, ...}] pairs
            .map(([code, countryData]) => ({
                // Use the full name as both value and label
                // This matches how your state currently stores the country name
                value: countryData.name,
                label: countryData.name,
            }))
            .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically by name
    }, []); // Empty dependency array ensures it runs only once

    // --- Fetch categories ---
    useEffect(() => {
        axiosInstance.get(GET_CATEGORIES)
            .then((res) => setCategories(res.data))
            .catch((err) => {
                console.error("Failed to fetch categories", err);
                toast.error("Failed to load categories.");
            });
    }, []);

    // --- Determine Required/Optional Fields based on initial/updated category/subcategory ---
    useEffect(() => {
        // Ensure productDetails has category/subcategory before calculating
        if (productDetails.category) {
            const { category, subcategory } = productDetails;
            const fields = getFieldsForCategory(category, subcategory); // Use the imported helper
            setRequiredFields(fields.required);
            setOptionalFields(fields.optional);
            // Optional: Re-validate when fields change if needed (might be heavy)
            // validateForm();
        } else {
            // Fallback if category somehow becomes empty
            const fields = getFieldsForCategory(null, null);
            setRequiredFields(fields.required);
            setOptionalFields(fields.optional);
        }
    }, [productDetails.category, productDetails.subcategory]); // Re-run when category/subcat change

    // --- Helper functions for rendering based on dynamic fields ---
    // Use useCallback to memoize these helpers
    const isFieldRequired = useCallback((fieldName) => requiredFields.includes(fieldName), [requiredFields]);
    const isFieldOptional = useCallback((fieldName) => optionalFields.includes(fieldName), [optionalFields]);
    const shouldRenderField = useCallback((fieldName) => isFieldRequired(fieldName) || isFieldOptional(fieldName), [isFieldRequired, isFieldOptional]);

    // --- Input Handlers ---

    // Handle nested object changes
    const handleNestedChange = (parent, field) => (e) => {
        const { value, type, checked } = e.target;
        const newValue = type === "checkbox" ? checked : value;

        setProductDetails((prev) => ({
            ...prev,
            [parent]: { ...prev[parent], [field]: newValue },
        }));

        // Reset duration if warranty is unchecked
        if (parent === 'warranty' && field === 'hasWarranty' && !checked) {
            setProductDetails(prev => ({ ...prev, warranty: { ...prev.warranty, duration: "" } }));
            setErrors(prev => ({ ...prev, warrantyDuration: undefined })); // Clear potential error
        }

        // Clear relevant errors
        if (errors[parent]) setErrors((prev) => ({ ...prev, [parent]: undefined }));
        const nestedErrorKey = `${parent}${field.charAt(0).toUpperCase() + field.slice(1)}`;
        if (errors[nestedErrorKey]) setErrors((prev) => ({ ...prev, [nestedErrorKey]: undefined }));
    };

    // Return Policy Add/Remove
    const addReturnPolicy = () => {
        if (returnPolicyInput.trim() && productDetails.returnPolicy.length < 6) {
            setProductDetails((prev) => ({ ...prev, returnPolicy: [...prev.returnPolicy, returnPolicyInput.trim()] }));
            setReturnPolicyInput("");
            if (errors.returnPolicy) setErrors(prev => ({ ...prev, returnPolicy: undefined }));
        } else if (productDetails.returnPolicy.length >= 6) {
            toast.warn("Maximum of 6 return policy terms allowed.");
        }
    };
    const removeReturnPolicy = (index) => {
        setProductDetails((prev) => ({ ...prev, returnPolicy: prev.returnPolicy.filter((_, i) => i !== index) }));
        // Clear error only if it was specifically about the policy list being empty and required
        if (errors.returnPolicy && productDetails.returnPolicy.length === 1 && isFieldRequired('returnPolicy')) {
            setErrors(prev => ({ ...prev, returnPolicy: undefined }));
        }
    };

    // Generic input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === "checkbox" ? checked : value;

        setProductDetails((prev) => ({ ...prev, [name]: newValue }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));

        // Clear importer details/errors if country changes back to India
        if (name === 'countryOfOrigin' && value.toLowerCase() === 'india') {
            setProductDetails(prev => ({
                ...prev,
                importerName: "",
                importerAddress: "",
                importerGSTIN: ""
            }));
            setErrors((prev) => ({ ...prev, importerName: undefined, importerAddress: undefined, importerGSTIN: undefined }));
        }
        // Clear commission rate/error if dropshipping is unchecked
        if (name === 'allowDropshipping' && !checked) {
            setProductDetails(prev => ({ ...prev, commissionRate: "" }));
            setErrors(prev => ({ ...prev, commissionRate: undefined }));
        }
    };

    // Category change handler (updates fields visibility/requirements)
    const handleCategoryChange = (e) => {
        const selectedCategory = e.target.value;
        const fields = getFieldsForCategory(selectedCategory, ""); // Get requirements for new cat, empty subcat

        setProductDetails((prev) => ({
            ...prev,
            category: selectedCategory,
            subcategory: "", // Reset subcategory
            // Consider resetting specific fields if they become irrelevant
            // e.g., fssaiLicenseNo: fields.required.includes('fssaiLicenseNo') || fields.optional.includes('fssaiLicenseNo') ? prev.fssaiLicenseNo : "",
        }));

        // Update required/optional state
        setRequiredFields(fields.required);
        setOptionalFields(fields.optional);

        // Clear relevant errors
        setErrors((prev) => ({
            ...prev,
            category: undefined,
            subcategory: undefined,
            // Also clear errors for fields whose requirement status might change
            // e.g., fssaiLicenseNo: undefined, bisCertification: undefined
        }));
    };

    // Subcategory change handler (updates fields visibility/requirements)
    const handleSubcategoryChange = (e) => {
        const selectedSubcategory = e.target.value;
        const fields = getFieldsForCategory(productDetails.category, selectedSubcategory);

        setProductDetails((prev) => ({
            ...prev,
            subcategory: selectedSubcategory,
            // Reset fields specific to the *previous* subcategory if necessary
        }));

        setRequiredFields(fields.required);
        setOptionalFields(fields.optional);

        setErrors((prev) => ({
            ...prev,
            subcategory: undefined,
            // Clear errors for fields whose requirement status might change
        }));
    };

    // Numeric/Tel input handlers
    const handleNumericInput = (e) => {
        const { value } = e.target;
        if (value === "" || /^\d*\.?\d*$/.test(value)) {
            handleChange(e);
        }
    };
    const handleTelInput = (e) => {
        const { value } = e.target;
        if (value === "" || /^[0-9 +()-]*$/.test(value)) {
            handleChange(e);
        }
    }

    // --- Image Handling (Adapted for Edit) ---
    const handleImageChange = async (e) => {
        const successfulImages = productDetails.images.filter(img => img.status === 'done');
        const slotsAvailable = 4 - successfulImages.length;
        const files = Array.from(e.target.files).slice(0, slotsAvailable);

        if (files.length === 0) {
            if (slotsAvailable <= 0) toast.warn("Maximum of 4 images already present.");
            return;
        }

        setErrors((prev) => ({ ...prev, images: undefined }));

        const validTypes = ["image/jpeg", "image/jpg", "image/png"];
        const invalidFiles = files.filter(file => !validTypes.includes(file.type));
        if (invalidFiles.length > 0) {
            setErrors((prev) => ({ ...prev, images: "Invalid file type(s). Only JPG, JPEG, PNG allowed." }));
            return;
        }

        const newImagesToAdd = files.map((file) => ({
            tempId: `temp_${Date.now()}_${Math.random()}`,
            preview: URL.createObjectURL(file),
            key: null,
            jpgURL: null,
            status: "pending",
            file,
        }));

        setProductDetails((prev) => ({
            ...prev,
            images: [...prev.images, ...newImagesToAdd].slice(0, 4),
        }));

        setUploadingImages(true);

        const uploadPromises = newImagesToAdd.map(async (newImage) => {
            try {
                setProductDetails((prev) => ({
                    ...prev,
                    images: prev.images.map((img) =>
                        img.tempId === newImage.tempId ? { ...img, status: "uploading" } : img
                    ),
                }));

                // AWS S3 Upload
                const key = await uploadImageToS3(newImage.file, 'products');
                const jpgURL = "";

                setProductDetails((prev) => ({
                    ...prev,
                    images: prev.images.map((img) =>
                        img.tempId === newImage.tempId
                            ? { ...img, key, jpgURL, status: "done", preview: jpgURL, file: null, tempId: undefined }
                            : img
                    ),
                }));

                if (newImage.preview) URL.revokeObjectURL(newImage.preview);
            } catch (error) {
                console.error("Upload failed:", error);
                setProductDetails((prev) => ({
                    ...prev,
                    images: prev.images.map((img) =>
                        img.tempId === newImage.tempId ? { ...img, status: "error", file: null, tempId: undefined } : img
                    ),
                }));
                setErrors((prev) => ({ ...prev, images: "Upload failed for one or more images." }));
                if (newImage.preview) URL.revokeObjectURL(newImage.preview);
            }
        });

        await Promise.all(uploadPromises);
        setUploadingImages(false);
        e.target.value = "";
    };


    // Remove Image (Careful with preview revocation)
    const removeImage = (index) => {
        setProductDetails((prev) => {
            const images = [...prev.images];
            const removed = images.splice(index, 1)[0];
            // Only revoke if it's a temporary blob URL (from a new file upload attempt)
            if (removed?.preview && removed.preview.startsWith('blob:')) {
                URL.revokeObjectURL(removed.preview);
            }
            return { ...prev, images };
        });
        if (errors.images) setErrors(prev => ({ ...prev, images: undefined }));
    };

    // Cleanup preview URLs on unmount
    useEffect(() => {
        return () => {
            productDetails.images.forEach((img) => {
                // Only revoke previews that are temporary blob URLs
                if (img?.preview && img.preview.startsWith('blob:')) {
                    URL.revokeObjectURL(img.preview);
                }
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only on unmount


    // --- Validation Logic (Using dynamic fields) ---
    const validateForm = useCallback(() => {
        const newErrors = {};
        const {
            title, description, quantity, category, subcategory, MRP, productPrice, startingPrice, reservedPrice,
            weight, dimensions, brand, manufacturer, manufacturerAddress, countryOfOrigin, netQuantity, packagingType,
            expiryDate, shelfLife, batchNumber, gstRate, sellerName, sellerContact, sellerGSTIN, warranty, hazardousMaterials, images,
            allowDropshipping, commissionRate, fssaiLicenseNo, bisCertification, eWasteCompliance, recyclablePackaging,
            importerName, importerAddress, importerGSTIN, hsnNo, returnPolicy, isActive
        } = productDetails;

        // Helper functions
        const isNumber = (value) => value !== null && value !== '' && !isNaN(value) && !isNaN(parseFloat(value));
        const isPositive = (value) => parseFloat(value) > 0;
        const isValidGSTIN = (gstin) => gstin && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gstin);
        // Basic Phone validation (Adjust regex as needed for stricter formats)
        // const isValidPhone = (phone) => phone && /^[+]?[0-9\s()-]{8,}$/.test(phone);

        // --- Core Platform Requirements (Always Checked) ---
        if (!title?.trim()) newErrors.title = "Product title is required";
        if (title?.length > 150) newErrors.title = "Title must be less than 150 characters";
        if (!description?.trim()) newErrors.description = "Product description is required";
        if (description?.length > 2000) newErrors.description = "Description must be less than 2000 characters";
        if (!quantity) newErrors.quantity = "Stock quantity is required";
        else if (!/^\d+$/.test(String(quantity)) || parseInt(quantity) < 0) newErrors.quantity = "Valid stock quantity (≥0) required"; // Allow 0 for edit?
        if (!category) newErrors.category = "Category is required";
        if (!subcategory) newErrors.subcategory = "Subcategory is required";

        // Image Validation
        const validImages = images.filter(img => img.status === 'done');
        if (validImages.length === 0) newErrors.images = "At least one product image is required";
        if (images.some(img => img.status === 'uploading')) newErrors.images = "Wait for image uploads to finish";
        if (images.some(img => img.status === 'error')) newErrors.images = "Fix or remove image upload errors before submitting";

        if (!MRP) newErrors.MRP = "MRP is required";
        else if (!isNumber(MRP) || !isPositive(MRP)) newErrors.MRP = "Valid MRP required (>0)";
        if (!productPrice) newErrors.productPrice = "Selling price is required";
        else if (!isNumber(productPrice) || !isPositive(productPrice)) newErrors.productPrice = "Valid price required (>0)";
        else if (isNumber(MRP) && isNumber(productPrice) && parseFloat(productPrice) > parseFloat(MRP)) newErrors.productPrice = "Selling price must be ≤ MRP";
        if (!gstRate) newErrors.gstRate = "GST Rate is required";
        else if (!isNumber(gstRate) || gstRate < 0) newErrors.gstRate = "Valid GST Rate required (≥0)";
        if (!sellerName?.trim()) newErrors.sellerName = "Seller Name is required";
        if (!sellerContact?.trim()) newErrors.sellerContact = "Seller Contact is required";
        // else if (!isValidPhone(sellerContact)) newErrors.sellerContact = "Invalid phone format";
        if (!sellerGSTIN?.trim()) newErrors.sellerGSTIN = "Seller GSTIN is required";
        else if (!isValidGSTIN(sellerGSTIN)) newErrors.sellerGSTIN = "Invalid GSTIN format (e.g., 29ABCDE1234F1Z5)";
        if (!hazardousMaterials) newErrors.hazardousMaterials = "Hazardous material declaration is required";

        // --- Auction / Dropship Validation ---
        if (startingPrice && (!isNumber(startingPrice) || !isPositive(startingPrice))) newErrors.startingPrice = "Valid starting price required (>0)";
        if (reservedPrice && (!isNumber(reservedPrice) || !isPositive(reservedPrice))) newErrors.reservedPrice = "Valid reserved price required (>0)";
        if (isNumber(startingPrice) && isNumber(reservedPrice) && parseFloat(startingPrice) > parseFloat(reservedPrice)) newErrors.reservedPrice = "Must be ≥ starting price";
        if (allowDropshipping) {
            if (!commissionRate) newErrors.commissionRate = "Commission rate required if dropshipping";
            else if (!isNumber(commissionRate) || commissionRate < 0 || commissionRate > 100) newErrors.commissionRate = "Valid commission (0-100) required";
        }

        // --- Category Specific Validation (Uses isFieldRequired) ---
        if (isFieldRequired('brand') && !brand?.trim()) newErrors.brand = "Brand name is required";
        if (brand?.trim() && brand.length > 50) newErrors.brand = "Brand name too long (max 50)";

        if (isFieldRequired('manufacturer') && !manufacturer?.trim()) newErrors.manufacturer = "Manufacturer is required";
        if (manufacturer?.trim() && manufacturer.length > 100) newErrors.manufacturer = "Manufacturer name too long (max 100)";

        if (isFieldRequired('manufacturerAddress') && !manufacturerAddress?.trim()) newErrors.manufacturerAddress = "Manufacturer address is required";
        if (manufacturerAddress?.trim() && manufacturerAddress.length > 200) newErrors.manufacturerAddress = "Address too long (max 200)";

        // Country of Origin Validation (now a select)
        if (isFieldRequired('countryOfOrigin') && !countryOfOrigin?.trim()) newErrors.countryOfOrigin = "Country of origin is required"; // Check if a value is selected

        if (isFieldRequired('netQuantity') && !netQuantity?.trim()) newErrors.netQuantity = "Net quantity (e.g., 500g, 1 Unit) is required";
        if (netQuantity?.trim() && netQuantity.length > 30) newErrors.netQuantity = "Net quantity too long (max 30)";

        if (isFieldRequired('packagingType') && !packagingType) newErrors.packagingType = "Packaging type is required";

        if (isFieldRequired('weight')) {
            if (!weight?.value?.toString().trim()) newErrors.weightValue = "Item weight value is required"; // Changed key for better granularity
            else if (!isNumber(weight.value) || !isPositive(weight.value)) newErrors.weightValue = "Valid weight required (>0)";
            if (!weight?.unit) newErrors.weightUnit = "Weight unit is required"; // Check unit separately
            if (newErrors.weightValue || newErrors.weightUnit) newErrors.weight = "Valid weight & unit required"; // Combine for UI grouping if needed
        }

        if (isFieldRequired('dimensions')) {
            if (!dimensions?.length?.toString().trim() || !isNumber(dimensions.length) || !isPositive(dimensions.length)) newErrors.dimensionsLength = "Valid length (cm) required (>0)";
            if (!dimensions?.width?.toString().trim() || !isNumber(dimensions.width) || !isPositive(dimensions.width)) newErrors.dimensionsWidth = "Valid width (cm) required (>0)";
            if (!dimensions?.height?.toString().trim() || !isNumber(dimensions.height) || !isPositive(dimensions.height)) newErrors.dimensionsHeight = "Valid height (cm) required (>0)";
            if (newErrors.dimensionsLength || newErrors.dimensionsWidth || newErrors.dimensionsHeight) newErrors.dimensions = "Valid L, W, H (cm) required (>0)"; // Combine for UI
        }

        if (isFieldRequired('shelfLife') && !shelfLife?.trim()) newErrors.shelfLife = "Shelf life is required";

        if (isFieldRequired('expiryDate') && !expiryDate) newErrors.expiryDate = "Expiry date is required";
        // Optional: Check if date is in the past - might be too strict depending on use case
        // if (expiryDate && new Date(expiryDate) < new Date().setHours(0,0,0,0)) newErrors.expiryDate = "Expiry date cannot be in the past";

        if (isFieldRequired('batchNumber') && !batchNumber?.trim()) newErrors.batchNumber = "Batch number is required";
        if (isFieldRequired('hsnNo') && !hsnNo?.trim()) newErrors.hsnNo = "HSN No is required"; // Added validation for HSN

        if (isFieldRequired('fssaiLicenseNo') && !fssaiLicenseNo?.trim()) newErrors.fssaiLicenseNo = "FSSAI license number is required";

        if (isFieldRequired('bisCertification') && !bisCertification?.trim()) newErrors.bisCertification = "BIS certification details are required";

        if (isFieldRequired('warranty') && warranty.hasWarranty && !warranty?.duration?.trim()) newErrors.warrantyDuration = "Warranty duration is required when warranty is selected";

        if (isFieldRequired('returnPolicy') && returnPolicy.length === 0) newErrors.returnPolicy = "At least one return policy term is required for this category";

        // Importer Validation (Conditional)
        const shouldShowImporterFields = countryOfOrigin && countryOfOrigin.toLowerCase() !== 'india';
        const importerFieldsRelevant = shouldRenderField('importerName') || shouldRenderField('importerAddress') || shouldRenderField('importerGSTIN');

        if (shouldShowImporterFields && importerFieldsRelevant) {
            if (isFieldRequired('importerName') && !importerName?.trim()) newErrors.importerName = "Importer Name is required";
            if (isFieldRequired('importerAddress') && !importerAddress?.trim()) newErrors.importerAddress = "Importer Address is required";
            if (isFieldRequired('importerGSTIN')) {
                if (!importerGSTIN?.trim()) {
                    newErrors.importerGSTIN = "Importer GSTIN is required";
                } else if (!isValidGSTIN(importerGSTIN)) {
                    newErrors.importerGSTIN = "Invalid Importer GSTIN format";
                }
            }
        }

        // Validate boolean fields if required means MUST be true
        if (isFieldRequired('eWasteCompliance') && !eWasteCompliance) newErrors.eWasteCompliance = "E-Waste Compliance is required for this category.";
        if (isFieldRequired('recyclablePackaging') && !recyclablePackaging) newErrors.recyclablePackaging = "Recyclable Packaging is required for this category.";
        if (isFieldRequired('allowDropshipping') && !allowDropshipping) newErrors.allowDropshipping = "Dropshipping option must be enabled if required by category."; // Example if boolean field needed validation
        if (isFieldRequired('isActive') && !isActive) newErrors.isActive = "Product must be active if required by category."; // Example if boolean field needed validation


        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [productDetails, requiredFields, optionalFields, isFieldRequired, shouldRenderField]); // Dependencies


    // --- Submit Handler ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Re-run validation on submit
        if (!validateForm()) {
            toast.error("Please fix the errors in the form.");
            // Optional: Scroll to first error
            const errorKeys = Object.keys(errors);
            if (errorKeys.length > 0) {
                // Try finding by name first, fallback to potentially combined keys
                const firstErrorKey = errorKeys[0];
                let firstErrorElement = document.getElementsByName(firstErrorKey)[0];
                // Fallback logic for nested or combined errors (like dimensions, weight)
                if (!firstErrorElement) {
                    if (firstErrorKey.startsWith('dimensions')) firstErrorElement = document.getElementsByName('dimensions.length')[0];
                    else if (firstErrorKey.startsWith('weight')) firstErrorElement = document.getElementsByName('weight.value')[0];
                    // Add more fallbacks if needed
                }
                firstErrorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Final checks for images before submission
        const pendingUploads = productDetails.images.some(img => img.status === "uploading");
        if (pendingUploads) {
            toast.warn("Image uploads are still in progress.");
            return;
        }
        const errorUploads = productDetails.images.some(img => img.status === 'error');
        if (errorUploads) {
            toast.error("Cannot submit with image upload errors. Please remove or retry them.");
            return;
        }
        const successfulImages = productDetails.images.filter(img => img.status === 'done');
        if (successfulImages.length === 0) {
            toast.error("Please ensure at least one image is successfully uploaded.");
            setErrors((prev) => ({ ...prev, images: "At least one successful image is required." }));
            return;
        }

        setSubmitting(true);

        try {
            // Prepare payload for UPDATE
            const payload = {
                // Map all fields from productDetails, ensuring correct types/nulls
                title: productDetails.title,
                description: productDetails.description,
                quantity: Number(productDetails.quantity),
                category: productDetails.category,
                subcategory: productDetails.subcategory,
                hsnNo: productDetails.hsnNo || null,
                MRP: parseFloat(productDetails.MRP),
                productPrice: parseFloat(productDetails.productPrice),
                startingPrice: productDetails.startingPrice ? parseFloat(productDetails.startingPrice) : null,
                reservedPrice: productDetails.reservedPrice ? parseFloat(productDetails.reservedPrice) : null,
                commissionRate: productDetails.allowDropshipping && productDetails.commissionRate ? parseFloat(productDetails.commissionRate) : null,
                gstRate: parseFloat(productDetails.gstRate),
                brand: productDetails.brand || null,
                manufacturer: productDetails.manufacturer || null,
                manufacturerAddress: productDetails.manufacturerAddress || null,
                countryOfOrigin: productDetails.countryOfOrigin || null, // Will send the selected country name string
                netQuantity: productDetails.netQuantity || null,
                packagingType: productDetails.packagingType || null,
                weight: {
                    value: productDetails.weight.value ? parseFloat(productDetails.weight.value) : null,
                    unit: productDetails.weight.value ? productDetails.weight.unit : null // Send unit only if value exists
                },
                dimensions: {
                    length: productDetails.dimensions.length ? parseFloat(productDetails.dimensions.length) : null,
                    width: productDetails.dimensions.width ? parseFloat(productDetails.dimensions.width) : null,
                    height: productDetails.dimensions.height ? parseFloat(productDetails.dimensions.height) : null
                },
                images: successfulImages.map(({ key, jpgURL }) => ({ key, jpgURL })),
                expiryDate: productDetails.expiryDate || null,
                batchNumber: productDetails.batchNumber || null,
                shelfLife: productDetails.shelfLife || null,
                sellerName: productDetails.sellerName,
                sellerContact: productDetails.sellerContact,
                sellerGSTIN: productDetails.sellerGSTIN,
                returnPolicy: productDetails.returnPolicy,
                warranty: {
                    hasWarranty: productDetails.warranty.hasWarranty,
                    duration: productDetails.warranty.hasWarranty ? productDetails.warranty.duration : null
                },
                fssaiLicenseNo: productDetails.fssaiLicenseNo || null,
                bisCertification: productDetails.bisCertification || null,
                // Conditionally include importer details based on country
                importerName: productDetails.countryOfOrigin?.toLowerCase() !== 'india' ? productDetails.importerName : null,
                importerAddress: productDetails.countryOfOrigin?.toLowerCase() !== 'india' ? productDetails.importerAddress : null,
                importerGSTIN: productDetails.countryOfOrigin?.toLowerCase() !== 'india' ? productDetails.importerGSTIN : null,
                eWasteCompliance: productDetails.eWasteCompliance,
                recyclablePackaging: productDetails.recyclablePackaging,
                hazardousMaterials: productDetails.hazardousMaterials,
                allowDropshipping: productDetails.allowDropshipping,
                isActive: productDetails.isActive,
            };

            // Clean up potential null/empty nested objects if backend requires absence or specific format
            if (!payload.weight?.value) payload.weight = null; // Or delete payload.weight; check backend needs
            if (!payload.dimensions?.length && !payload.dimensions?.width && !payload.dimensions?.height) payload.dimensions = null; // Or delete payload.dimensions;

            // Clean up importer details fully if country is India
            if (payload.countryOfOrigin?.toLowerCase() === 'india') {
                payload.importerName = null;
                payload.importerAddress = null;
                payload.importerGSTIN = null;
            }

            console.log("Submitting Update Payload:", payload);

            const res = await axiosInstance.put(
                `${UPDATE_PRODUCT_LISTING}/${productDetails._id}`,
                payload
            );

            // Check status based on typical API responses
            if (res.data?.status === true || res.status === 200 || res.status === 201) {
                toast.success("Product listing updated successfully!");
                navigate("/seller/productlisting");
            } else {
                toast.error(res.data?.message || "Failed to update product listing.");
            }
        } catch (error) {
            console.error("Update submission error:", error);
            const backendErrors = error.response?.data?.errors;
            const errorMsg = error.response?.data?.message || "An error occurred during update. Please try again.";

            if (backendErrors && typeof backendErrors === 'object') {
                const mappedErrors = {};
                for (const key in backendErrors) {
                    mappedErrors[key] = backendErrors[key]; // Adjust mapping if needed
                }
                setErrors(prev => ({ ...prev, ...mappedErrors }));
                toast.error("Validation errors from server. Please check the form.");
            } else {
                toast.error(errorMsg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    // --- Helpers ---
    const selectedCategoryObj = categories.find(cat => cat.categoryName === productDetails.category);
    const getHazardousMessage = (value) => {
        switch (value) {
            case "no hazardous materials": return "No hazardous materials → Safe for standard shipping.";
            case "fragrances": return "Fragrances → May require special handling or ground shipping.";
            case "lithium batteries": return "Lithium batteries → Requires special handling and labeling due to regulations.";
            case "other hazardous materials": return "Other hazardous materials → Ensure compliance with shipping regulations for specified materials.";
            default: return "";
        }
    };
    // Use shouldRenderField for importer section visibility check - refined
    const showImporterFields = productDetails.countryOfOrigin &&
        productDetails.countryOfOrigin.toLowerCase() !== 'india' &&
        (shouldRenderField('importerName') || shouldRenderField('importerAddress') || shouldRenderField('importerGSTIN'));

    // --- Discard Modal Handlers ---
    const handleConfirmDiscard = () => { setShowDiscardModal(false); navigate("/seller/productlisting"); };
    const handleCancelDiscard = () => { setShowDiscardModal(false); };

    // --- Early return if product data is missing (after checks) ---
    // More robust check using productFromState as initial source of truth before state is set
    if (!productFromState?._id) {
        // Render minimal UI or a loading/error state until redirect happens
        return (
            <div className="container mx-auto p-4 lg:p-6 flex justify-center items-center min-h-[70vh]">
                <div className="text-center p-8 bg-blackLight border border-greyLight rounded-lg shadow-md max-w-md">
                    <AlertCircle className="w-16 h-16 text-newYellow mx-auto mb-5" />
                    <h2 className="text-2xl font-bold text-whiteLight mb-3">Error Loading Product</h2>
                    <p className="text-whiteHalf mb-6">Could not find product data. Redirecting...</p>
                    {/* Optionally add a manual link back */}
                    <Link to="/seller/productlisting" className="btn btn-sm btn-ghost bg-newYellow text-blackDark">Go to Product List</Link>
                </div>
            </div>
        );
    }

    return (
          <div className="container mx-auto p-2 lg:p-6 bg-blackLight min-h-screen flex flex-col">
            <div className="bg-blackLight rounded-xl shadow-xl relative max-w-6xl mx-auto w-full flex flex-col h-full"> {/* Added flex-col h-full */}
                {/* Header */}
                <div className="sticky top-0 bg-blackLight z-10 flex items-center justify-between mb-3 pb-2 border-b border-greyLight pt-20 px-2 lg:px-6">
                    <button
                        className="btn btn-ghost btn-sm rounded-full bg-newYellow hover:bg-gray-200 p-2 transition-colors duration-200"
                        onClick={() => setShowDiscardModal(true)}
                        aria-label="Back to Product List"
                    >
                        <FaChevronLeft size={18} className="text-blackDark" />
                    </button>
                    <h1 className="text-xl md:text-2xl font-bold text-whiteLight text-center uppercase flex-grow mx-4 truncate"
                        title={productDetails.title}>
                        <span className="text-newYellow">Edit -</span> {productDetails.title || "Product Listing"}
                    </h1>
                    <div className="w-10 h-10"></div>
                </div>
                <div className="p-3 lg:p-8 pt-0 overflow-y-auto flex-grow">
                <form onSubmit={handleSubmit} className="space-y-8 bg-blackLight">
                    {/* --- Main Grid Layout --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* --- Main Content Column (Left Side) --- */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Section: Basic Information */}
                            <div className="p-5 bg-blackDark rounded-lg shadow-md ">
                                <h2 className="text-lg font-semibold text-newYellow mb-5 border-b pb-2 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-newYellow" /> Basic Information
                                </h2>
                                <div className="space-y-5">
                                    {/* Category & Subcategory */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-control w-full relative">
                                            <label className="label pb-1">
                                                <span className="label-text font-medium text-whiteLight flex items-center"> <Box className="w-4 h-4 mr-2 text-newYellow" /> Category <span className="text-red-500">&nbsp; *</span> </span>
                                            </label>
                                            <select name="category" value={productDetails.category} onChange={handleCategoryChange} className={`select select-bordered w-full focus:select-focus bg-blackLight appearance-none ${errors.category ? 'select-error' : ''} ${productDetails.category ? 'text-whiteLight' : 'text-whiteHalf'}`} required>
                                                <option value="" disabled className="text-whiteHalf"> Select Category </option>
                                                {categories.map((cat) => (<option key={cat._id || cat.categoryName} value={cat.categoryName} className="text-whiteLight"> {cat.categoryName} </option>))}
                                            </select>
                                            <FaChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 mt-1 pointer-events-none" />
                                            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                                        </div>
                                        <div className="form-control w-full relative">
                                            <label className="label pb-1">
                                                <span className="label-text font-medium text-whiteLight flex items-center"> <Box className="w-4 h-4 mr-2 text-newYellow" /> Subcategory <span className="text-red-500">&nbsp; *</span> </span>
                                            </label>
                                            <select name="subcategory" value={productDetails.subcategory} onChange={handleSubcategoryChange} className={`select select-bordered w-full focus:select-focus bg-blackLight appearance-none ${!productDetails.category ? "opacity-60 cursor-not-allowed" : ""} ${errors.subcategory ? 'select-error' : ''} ${productDetails.subcategory ? 'text-whiteLight' : 'text-whiteHalf'}`} disabled={!productDetails.category} required>
                                                <option value="" disabled className="text-whiteHalf"> Select Subcategory </option>
                                                {selectedCategoryObj?.subcategories.map((sub) => (<option key={sub._id || sub.name} value={sub.name} className="text-whiteLight"> {sub.name} </option>))}
                                            </select>
                                            <FaChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 mt-1 pointer-events-none" />
                                            {errors.subcategory && <p className="text-red-500 text-xs mt-1">{errors.subcategory}</p>}
                                        </div>
                                    </div>
                                    {/* Title */}
                                    <div className="form-control w-full">
                                        <label className="label pb-1">
                                            <span className="label-text font-medium text-whiteLight flex items-center"> Product Title <span className="text-red-500">&nbsp; *</span> </span>
                                        </label>
                                        <input type="text" name="title" value={productDetails.title} onChange={handleChange} placeholder="Enter product title" className={`input input-bordered w-full focus:input-focus bg-blackLight ${errors.title ? 'input-error' : ''} ${productDetails.title ? 'text-whiteLight' : 'text-whiteHalf'}`} maxLength={150} required />
                                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                                    </div>
                                    {/* Description */}
                                    <div className="form-control w-full">
                                        <label className="label pb-1">
                                            <span className="label-text font-medium text-whiteLight flex items-center"> Description <span className="text-red-500">&nbsp; *</span> </span>
                                        </label>
                                        <textarea name="description" value={productDetails.description} onChange={handleChange} className={`textarea textarea-bordered w-full h-24 focus:textarea-focus bg-blackLight ${errors.description ? 'textarea-error' : ''} ${productDetails.description ? 'text-whiteLight' : 'text-whiteHalf'}`} placeholder="Detailed description..." rows="3" maxLength={2000} required></textarea>
                                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                                    </div>

                                    {/* Stock Quantity & HSN */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-control w-full">
                                            <label className="label pb-1">
                                                <span className="label-text font-medium text-whiteLight flex items-center"> <Archive className="w-4 h-4 mr-2 text-newYellow" /> Stock Quantity <span className="text-red-500">&nbsp; *</span> </span>
                                            </label>
                                            <input type="number" min="0" step="1" name="quantity" value={productDetails.quantity} onChange={handleChange} placeholder="Available stock count" disabled className={`input input-bordered w-full focus:input-focus bg-blackLight ${errors.quantity ? 'input-error' : ''} ${productDetails.quantity ? 'text-whiteLight' : 'text-whiteHalf'}`} required />
                                            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                                        </div>
                                        {/* HSN (Render based on dynamic rules) */}
                                        {shouldRenderField('hsnNo') && (
                                            <div className="form-control w-full">
                                                <label className="label pb-1">
                                                    <span className="label-text font-medium text-whiteLight flex items-center">
                                                        <Hash className="w-4 h-4 mr-2 text-newYellow" />
                                                        HSN No {isFieldRequired('hsnNo') ? <span className="text-red-500">&nbsp; *</span> : '(Optional)'}
                                                    </span>
                                                </label>
                                                <input type="text" name="hsnNo" value={productDetails.hsnNo} onChange={handleChange} placeholder="Enter HSN code" className={`input input-bordered w-full focus:input-focus bg-blackLight ${errors.hsnNo ? 'input-error' : ''} ${productDetails.hsnNo ? 'text-whiteLight' : 'text-whiteHalf'}`} maxLength={8} required={isFieldRequired('hsnNo')} />
                                                {errors.hsnNo && <p className="text-red-500 text-xs mt-1">{errors.hsnNo}</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section: Product Images */}
                            <div className="p-5 bg-blackDark rounded-lg shadow-md ">
                                <h2 className="text-lg font-semibold text-newYellow mb-4 border-b pb-2 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-newYellow" /> Product Images <span className="text-red-500">&nbsp; *</span>
                                </h2>
                                <div className="flex flex-wrap gap-4">
                                    {/* Image Previews/Uploads */}
                                    {productDetails.images.map((image, index) => (
                                        <div key={image.key || image.tempId || index} className="relative w-28 h-28 md:w-32 md:h-32 border rounded-md overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 bg-blackDark">

                                            <img
                                                src={image?.key ? `${cdnURL}${image.key}` : "/placeholder-image.png"}
                                                alt={`product-${index}`}
                                                className="object-cover w-full h-full"
                                                onError={(e) => {
                                                    if (e.target.src !== "/placeholder-image.png") {
                                                        e.target.src = "/placeholder-image.png";
                                                    }
                                                }}
                                            />
                                            {/* Status Overlay */}
                                            {image.status === "uploading" && (<div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center"> <div className="loading loading-spinner loading-sm text-white"></div> </div>)}
                                            {image.status === "error" && (<div className="absolute inset-0 bg-red-600 bg-opacity-80 flex flex-col items-center justify-center text-white text-xs p-1 text-center"> <AlertCircle size={16} className="mb-1" /> Upload failed </div>)}
                                            {image.status === "done" && index === 0 && (<div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-0.5">Cover</div>)}
                                            {/* Remove Button - Available unless uploading */}
                                            {image.status !== "uploading" && (
                                                <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400" aria-label={`Remove image ${index + 1}`}>
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {/* Add Image Placeholder */}
                                    {productDetails.images.filter(img => img.status === 'done').length < 4 && (
                                        <label className={`w-28 h-28 md:w-32 md:h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-md cursor-pointer transition-all duration-300 ${uploadingImages ? "border-newYellow bg-yellowHalf animate-pulse cursor-not-allowed" : "border-greyLight bg-yellowHalf hover:border-newYellow hover:bg-greyLight"} ${errors.images ? 'border-red-400' : ''} `}>
                                            <div className="text-center text-newYellow"> <FaPlus size={24} className="mx-auto mb-1 text-newYellow" /> <p className="text-xs mt-1"> Add Image ({productDetails.images.filter(img => img.status === 'done').length}/4) </p> </div>
                                            <input type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleImageChange} className="hidden" multiple disabled={uploadingImages || productDetails.images.filter(img => img.status === 'done').length >= 4} />
                                        </label>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-3 flex items-center"> <FaInfoCircle className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" /> Upload up to 4 images (JPG, PNG). First image is cover. </p>
                                {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
                            </div>

                            {/* Section: Product Specifications */}
                            {/* Only show the section if ANY relevant field should be rendered */}
                            {(shouldRenderField('brand') || shouldRenderField('manufacturer') || shouldRenderField('manufacturerAddress') || shouldRenderField('countryOfOrigin') || shouldRenderField('netQuantity') || shouldRenderField('weight') || shouldRenderField('dimensions') || shouldRenderField('packagingType') || shouldRenderField('shelfLife') || shouldRenderField('expiryDate') || shouldRenderField('batchNumber') || showImporterFields) && (
                                <div className="p-5 bg-blackDark rounded-lg shadow-md ">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center text-newYellow border-b pb-2 gap-2">
                                        <ClipboardList className="w-5 h-5 text-newYellow" />
                                        Product Specifications
                                    </h3>
                                    <div className="space-y-4">
                                        {/* Helper function for label suffix */}
                                        {(() => {
                                            const getLabelSuffix = (fieldName) => {
                                                return isFieldRequired(fieldName) ? <span className="text-red-500">&nbsp; *</span> : (isFieldOptional(fieldName) ? ' (Optional)' : '');
                                            };

                                            return (
                                                <>
                                                    {/* Render fields based on shouldRenderField and isFieldRequired */}
                                                    {/* Example: Brand & Manufacturer */}
                                                    {(shouldRenderField('brand') || shouldRenderField('manufacturer')) && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {shouldRenderField('brand') && (
                                                                <div className="form-control w-full">
                                                                    <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><Tag className="w-4 h-4 mr-2 text-newYellow" />Brand{getLabelSuffix('brand')}</span></label>
                                                                    <input type="text" name="brand" value={productDetails.brand} onChange={handleChange} placeholder="e.g., Nike" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.brand ? 'input-error' : ''}`} required={isFieldRequired('brand')} maxLength={50} />
                                                                    {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
                                                                </div>
                                                            )}
                                                            {shouldRenderField('manufacturer') && (
                                                                <div className="form-control w-full">
                                                                    <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><Factory className="w-4 h-4 mr-2 text-newYellow" />Manufacturer{getLabelSuffix('manufacturer')}</span></label>
                                                                    <input type="text" name="manufacturer" value={productDetails.manufacturer} onChange={handleChange} placeholder="e.g., Apple Inc." className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.manufacturer ? 'input-error' : ''}`} required={isFieldRequired('manufacturer')} maxLength={100} />
                                                                    {errors.manufacturer && <p className="text-red-500 text-xs mt-1">{errors.manufacturer}</p>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Manufacturer Address */}
                                                    {shouldRenderField('manufacturerAddress') && (
                                                        <div className="form-control w-full">
                                                            <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><MapPin className="w-4 h-4 mr-2 text-newYellow" />Manufacturer Address{getLabelSuffix('manufacturerAddress')}</span></label>
                                                            <textarea name="manufacturerAddress" value={productDetails.manufacturerAddress} onChange={handleChange} placeholder="Full address" className={`textarea textarea-bordered focus:textarea-focus bg-blackLight text-whiteLight h-20 ${errors.manufacturerAddress ? 'textarea-error' : ''}`} rows="2" required={isFieldRequired('manufacturerAddress')} maxLength={200}></textarea>
                                                            {errors.manufacturerAddress && <p className="text-red-500 text-xs mt-1">{errors.manufacturerAddress}</p>}
                                                        </div>
                                                    )}
                                                    {/* Country of Origin & Net Quantity */}
                                                    {(shouldRenderField('countryOfOrigin') || shouldRenderField('netQuantity')) && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* --- MODIFIED: Country of Origin --- */}
                                                            {shouldRenderField('countryOfOrigin') && (
                                                                <div className="form-control w-full relative">
                                                                    <label className="label pb-1">
                                                                        <span className="label-text font-medium flex items-center text-whiteLight">
                                                                            <Globe className="w-4 h-4 mr-2 text-newYellow" />
                                                                            Country of Origin{getLabelSuffix('countryOfOrigin')}
                                                                        </span>
                                                                    </label>
                                                                    {/* ---- START: REPLACEMENT SELECT ---- */}
                                                                    <select
                                                                        name="countryOfOrigin"
                                                                        value={productDetails.countryOfOrigin}
                                                                        onChange={handleChange}
                                                                        className={`select select-bordered w-full focus:select-focus bg-blackLight text-whiteLight appearance-none ${errors.countryOfOrigin ? 'select-error' : ''}`}
                                                                        required={isFieldRequired('countryOfOrigin')}
                                                                    >
                                                                        <option value="" disabled>Select Country of Origin</option>
                                                                        {countryOptions.map((country) => (
                                                                            <option key={country.value} value={country.value}>
                                                                                {country.label}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    {/* Add dropdown arrow icon */}
                                                                    <FaChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 mt-1 pointer-events-none" />
                                                                    {/* ---- END: REPLACEMENT SELECT ---- */}
                                                                    {errors.countryOfOrigin && <p className="text-red-500 text-xs mt-1">{errors.countryOfOrigin}</p>}
                                                                </div>
                                                            )}
                                                            {/* --- END MODIFICATION --- */}

                                                            {/* Net Quantity */}
                                                            {shouldRenderField('netQuantity') && (
                                                                <div className="form-control w-full">
                                                                    <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><Scale className="w-4 h-4 mr-2 text-newYellow" />Net Quantity{getLabelSuffix('netQuantity')}</span></label>
                                                                    <input type="text" name="netQuantity" value={productDetails.netQuantity} onChange={handleChange} placeholder="e.g., 500g, 1 Unit" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.netQuantity ? 'input-error' : ''}`} required={isFieldRequired('netQuantity')} maxLength={30} />
                                                                    {errors.netQuantity && <p className="text-red-500 text-xs mt-1">{errors.netQuantity}</p>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Item Weight & Dimensions */}
                                                    {(shouldRenderField('weight') || shouldRenderField('dimensions')) && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {shouldRenderField('weight') && (
                                                                <div className="form-control w-full">
                                                                    <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><Weight className="w-4 h-4 mr-2 text-newYellow" /> Item Weight{getLabelSuffix('weight')}</span></label>
                                                                    <div className="flex gap-2 items-start">
                                                                        <div className="flex-grow">
                                                                            <input type="text" placeholder="Value" name="weight.value" value={productDetails.weight.value} onChange={handleNestedChange("weight", "value")} onInput={handleNumericInput} className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight w-full ${errors.weightValue || errors.weight ? 'input-error' : ''}`} required={isFieldRequired('weight')} />
                                                                            {errors.weightValue && <p className="text-red-500 text-xs mt-1">{errors.weightValue}</p>}
                                                                        </div>
                                                                        <div className="relative w-1/3">
                                                                            <select name="weight.unit" value={productDetails.weight.unit} onChange={handleNestedChange("weight", "unit")} className={`select select-bordered focus:select-focus bg-blackLight text-whiteLight appearance-none w-full ${errors.weightUnit || errors.weight ? 'select-error' : ''}`} required={isFieldRequired('weight')}>
                                                                                <option value="grams">grams</option><option value="kilograms">kilograms</option><option value="ml">ml</option><option value="litre">litre</option><option value="pounds">pounds</option><option value="ounces">ounces</option>
                                                                            </select>
                                                                            <FaChevronDown className="w-3 h-3 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                                                            {errors.weightUnit && <p className="text-red-500 text-xs mt-1">{errors.weightUnit}</p>}
                                                                        </div>
                                                                    </div>
                                                                    {/* Combined error message */}
                                                                    {errors.weight && !(errors.weightValue || errors.weightUnit) && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
                                                                </div>
                                                            )}
                                                            {shouldRenderField('dimensions') && (
                                                                <div className="form-control w-full">
                                                                    <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><Ruler className="w-4 h-4 mr-2 text-newYellow" /> Dimensions (cm){getLabelSuffix('dimensions')}</span><span className="label-text-alt text-whiteHalf">L x W x H</span></label>
                                                                    <div className="flex gap-2 items-start">
                                                                        <div className="w-1/3">
                                                                            <input type="text" placeholder="L" name="dimensions.length" value={productDetails.dimensions.length} onChange={handleNestedChange("dimensions", "length")} onInput={handleNumericInput} className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight w-full ${errors.dimensionsLength || errors.dimensions ? 'input-error' : ''}`} required={isFieldRequired('dimensions')} />
                                                                            {errors.dimensionsLength && <p className="text-red-500 text-xs mt-1">{errors.dimensionsLength}</p>}
                                                                        </div>
                                                                        <div className="w-1/3">
                                                                            <input type="text" placeholder="W" name="dimensions.width" value={productDetails.dimensions.width} onChange={handleNestedChange("dimensions", "width")} onInput={handleNumericInput} className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight w-full ${errors.dimensionsWidth || errors.dimensions ? 'input-error' : ''}`} required={isFieldRequired('dimensions')} />
                                                                            {errors.dimensionsWidth && <p className="text-red-500 text-xs mt-1">{errors.dimensionsWidth}</p>}
                                                                        </div>
                                                                        <div className="w-1/3">
                                                                            <input type="text" placeholder="H" name="dimensions.height" value={productDetails.dimensions.height} onChange={handleNestedChange("dimensions", "height")} onInput={handleNumericInput} className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight w-full ${errors.dimensionsHeight || errors.dimensions ? 'input-error' : ''}`} required={isFieldRequired('dimensions')} />
                                                                            {errors.dimensionsHeight && <p className="text-red-500 text-xs mt-1">{errors.dimensionsHeight}</p>}
                                                                        </div>
                                                                    </div>
                                                                    {/* Combined error */}
                                                                    {errors.dimensions && !(errors.dimensionsLength || errors.dimensionsWidth || errors.dimensionsHeight) && <p className="text-red-500 text-xs mt-1">{errors.dimensions}</p>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Packaging Type & Shelf Life */}
                                                    {(shouldRenderField('packagingType') || shouldRenderField('shelfLife')) && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {shouldRenderField('packagingType') && (
                                                                <div className="form-control w-full relative">
                                                                    <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><Container className="w-4 h-4 mr-2 text-newYellow" />Packaging Type{getLabelSuffix('packagingType')}</span></label>
                                                                    <select name="packagingType" value={productDetails.packagingType} onChange={handleChange} className={`select select-bordered w-full focus:select-focus bg-blackLight text-whiteLight appearance-none ${errors.packagingType ? 'select-error' : ''}`} required={isFieldRequired('packagingType')}>
                                                                        <option value="" disabled>Select package type</option><option value="Box">Box</option><option value="Bag">Bag</option><option value="Bottle">Bottle</option><option value="Pouch">Pouch</option><option value="Wrapper">Wrapper</option><option value="Tube">Tube</option><option value="Blister Pack">Blister Pack</option><option value="Other">Other</option>
                                                                    </select>
                                                                    <FaChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 mt-1 pointer-events-none" />
                                                                    {errors.packagingType && <p className="text-red-500 text-xs mt-1">{errors.packagingType}</p>}
                                                                </div>
                                                            )}
                                                            {shouldRenderField('shelfLife') && (
                                                                <div className="form-control w-full">
                                                                    <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><Clock className="w-4 h-4 mr-2 text-newYellow" />Shelf Life{getLabelSuffix('shelfLife')}</span></label>
                                                                    <input type="text" name="shelfLife" value={productDetails.shelfLife} onChange={handleChange} placeholder="e.g., 6 months" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.shelfLife ? 'input-error' : ''}`} required={isFieldRequired('shelfLife')} />
                                                                    {errors.shelfLife && <p className="text-red-500 text-xs mt-1">{errors.shelfLife}</p>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Expiry Date & Batch Number */}
                                                    {(shouldRenderField('expiryDate') || shouldRenderField('batchNumber')) && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {shouldRenderField('expiryDate') && (
                                                                <div className="form-control w-full">
                                                                    <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><CalendarDays className="w-4 h-4 mr-2 text-newYellow" />Expiry Date{getLabelSuffix('expiryDate')}</span></label>
                                                                    <input type="date" name="expiryDate" value={productDetails.expiryDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.expiryDate ? 'input-error' : ''}`} required={isFieldRequired('expiryDate')} />
                                                                    {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
                                                                </div>
                                                            )}
                                                            {shouldRenderField('batchNumber') && (
                                                                <div className="form-control w-full">
                                                                    <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><NotebookText className="w-4 h-4 mr-2 text-newYellow" />Batch Number{getLabelSuffix('batchNumber')}</span></label>
                                                                    <input type="text" name="batchNumber" value={productDetails.batchNumber} onChange={handleChange} placeholder="Enter batch number" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.batchNumber ? 'input-error' : ''}`} required={isFieldRequired('batchNumber')} />
                                                                    {errors.batchNumber && <p className="text-red-500 text-xs mt-1">{errors.batchNumber}</p>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}


                                                    {/* Importer Details (Conditional) */}
                                                    {showImporterFields && (
                                                        <div className="pt-4 mt-4 border-t border-dashed border-gray-200 space-y-4">
                                                            <h4 className="text-md font-semibold text-whiteLight flex items-center gap-2"><Building className="w-5 h-5 text-newYellow" /> Importer Details</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {shouldRenderField('importerName') && (
                                                                    <div className="form-control w-full">
                                                                        <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><HiUser className="w-4 h-4 mr-2 text-newYellow" />Importer Name{getLabelSuffix('importerName')}</span></label>
                                                                        <input type="text" name="importerName" value={productDetails.importerName} onChange={handleChange} placeholder="Importer company name" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.importerName ? 'input-error' : ''}`} required={isFieldRequired('importerName')} />
                                                                        {errors.importerName && <p className="text-red-500 text-xs mt-1">{errors.importerName}</p>}
                                                                    </div>
                                                                )}
                                                                {shouldRenderField('importerGSTIN') && (
                                                                    <div className="form-control w-full">
                                                                        <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><HiHashtag className="w-4 h-4 mr-2 text-newYellow" />Importer GSTIN{getLabelSuffix('importerGSTIN')}</span></label>
                                                                        <input type="text" name="importerGSTIN" value={productDetails.importerGSTIN} onChange={(e) => handleChange({ target: { name: 'importerGSTIN', value: e.target.value.toUpperCase() } })} placeholder="Importer's GSTIN" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.importerGSTIN ? 'input-error' : ''}`} required={isFieldRequired('importerGSTIN')} maxLength={15} />
                                                                        {errors.importerGSTIN && <p className="text-red-500 text-xs mt-1">{errors.importerGSTIN}</p>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {shouldRenderField('importerAddress') && (
                                                                <div className="form-control w-full">
                                                                    <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><MapPin className="w-4 h-4 mr-2 text-newYellow" />Importer Address{getLabelSuffix('importerAddress')}</span></label>
                                                                    <textarea name="importerAddress" value={productDetails.importerAddress} onChange={handleChange} placeholder="Full address" className={`textarea textarea-bordered focus:textarea-focus bg-blackLight text-whiteLight h-20 ${errors.importerAddress ? 'textarea-error' : ''}`} rows="2" required={isFieldRequired('importerAddress')} maxLength={200}></textarea>
                                                                    {errors.importerAddress && <p className="text-red-500 text-xs mt-1">{errors.importerAddress}</p>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )} {/* End Importer */}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )} {/* End Specifications Section */}


                            {/* Section: Compliance & Certifications */}
                            {(shouldRenderField('fssaiLicenseNo') || shouldRenderField('bisCertification') || shouldRenderField('eWasteCompliance') || shouldRenderField('recyclablePackaging')) && (
                                <div className="p-5 bg-blackDark rounded-lg shadow-md ">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center text-newYellow border-b pb-2 gap-2">
                                        <ShieldCheck className="w-5 h-5 text-newYellow" /> Compliance & Certifications
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        {/* Helper for label suffix */}
                                        {(() => {
                                            const getLabelSuffix = (fieldName) => isFieldRequired(fieldName) ? <span className="text-red-500">&nbsp; *</span> : (isFieldOptional(fieldName) ? ' (Optional)' : '');

                                            return (
                                                <>
                                                    {shouldRenderField('fssaiLicenseNo') && (
                                                        <div className="form-control w-full">
                                                            <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><NotebookText className="w-4 h-4 mr-2 text-newYellow" />FSSAI License No{getLabelSuffix('fssaiLicenseNo')}</span></label>
                                                            <input type="text" name="fssaiLicenseNo" value={productDetails.fssaiLicenseNo} onChange={handleChange} placeholder="Enter FSSAI number" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.fssaiLicenseNo ? 'input-error' : ''}`} required={isFieldRequired('fssaiLicenseNo')} />
                                                            {errors.fssaiLicenseNo && <p className="text-red-500 text-xs mt-1">{errors.fssaiLicenseNo}</p>}
                                                        </div>
                                                    )}
                                                    {shouldRenderField('bisCertification') && (
                                                        <div className="form-control w-full">
                                                            <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><FileText className="w-4 h-4 mr-2 text-newYellow" />BIS Certification{getLabelSuffix('bisCertification')}</span></label>
                                                            <input type="text" name="bisCertification" value={productDetails.bisCertification} onChange={handleChange} placeholder="Enter BIS details" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.bisCertification ? 'input-error' : ''}`} required={isFieldRequired('bisCertification')} />
                                                            {errors.bisCertification && <p className="text-red-500 text-xs mt-1">{errors.bisCertification}</p>}
                                                        </div>
                                                    )}
                                                    {shouldRenderField('eWasteCompliance') && (
                                                        <div className="form-control flex items-start pt-2 md:items-center md:pt-6">
                                                            <label className="label cursor-pointer justify-start gap-3 p-1">
                                                                <input type="checkbox" name="eWasteCompliance" checked={productDetails.eWasteCompliance} onChange={handleChange} className={`checkbox checkbox-sm ${productDetails.eWasteCompliance ? 'checkbox-primary' : 'border-white'}`} required={isFieldRequired('eWasteCompliance')} />
                                                                <span className="label-text font-medium text-whiteLight"> E-Waste Compliant{getLabelSuffix('eWasteCompliance')}</span>
                                                            </label>
                                                            {errors.eWasteCompliance && <p className="text-red-500 text-xs mt-1 w-full">{errors.eWasteCompliance}</p>}
                                                        </div>
                                                    )}
                                                    {shouldRenderField('recyclablePackaging') && (
                                                        <div className="form-control flex items-start pt-2 md:items-center md:pt-6">
                                                            <label className="label cursor-pointer justify-start gap-3 p-1">
                                                                <input type="checkbox" name="recyclablePackaging" checked={productDetails.recyclablePackaging} onChange={handleChange} className={`checkbox checkbox-sm ${productDetails.recyclablePackaging ? 'checkbox-primary' : 'border-white'}`} required={isFieldRequired('recyclablePackaging')} />
                                                                <span className="label-text font-medium text-whiteLight flex items-center gap-1"> <Recycle className="w-4 h-4 text-newYellow" /> Recyclable Packaging{getLabelSuffix('recyclablePackaging')}</span>
                                                            </label>
                                                            {errors.recyclablePackaging && <p className="text-red-500 text-xs mt-1 w-full">{errors.recyclablePackaging}</p>}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )} {/* End Compliance */}


                            {/* Section: Warranty & Returns */}
                            {(shouldRenderField('warranty') || shouldRenderField('returnPolicy')) && (
                                <div className="p-5 bg-blackDark rounded-lg shadow-md ">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center text-newYellow border-b pb-2 gap-2">
                                        <Info className="w-5 h-5 text-newYellow" /> Warranty & Returns
                                    </h3>
                                    <div className="space-y-4">
                                        {/* Helper for label suffix */}
                                        {(() => {
                                            const getLabelSuffix = (fieldName) => isFieldRequired(fieldName) ? <span className="text-red-500">&nbsp; *</span> : (isFieldOptional(fieldName) ? ' (Optional)' : '');

                                            return (
                                                <>
                                                    {shouldRenderField('warranty') && (
                                                        <div className="form-control">
                                                            <label className="label cursor-pointer justify-start gap-3 p-1 mb-2">
                                                                <input type="checkbox" name="warranty.hasWarranty" checked={productDetails.warranty.hasWarranty} onChange={handleNestedChange("warranty", "hasWarranty")} className={`toggle toggle-sm ${productDetails.warranty.hasWarranty ? 'toggle-warning' : 'bg-white border-white'}`} />
                                                                <span className="label-text font-medium text-whiteLight">Has Warranty?{getLabelSuffix('warranty')}</span>
                                                            </label>
                                                            {productDetails.warranty.hasWarranty && (
                                                                <div className="pl-8">
                                                                    <label className="label pb-1 pt-0"><span className="label-text text-whiteLight text-xs">Duration <span className="text-red-500">&nbsp; *</span></span></label>
                                                                    <input type="text" name="warranty.duration" placeholder="Specify duration (e.g., 1 year)" value={productDetails.warranty.duration} onChange={handleNestedChange("warranty", "duration")} className={`input input-bordered input-sm focus:input-focus bg-blackLight text-whiteLight w-full ${errors.warrantyDuration ? 'input-error' : ''}`} required={isFieldRequired('warranty') && productDetails.warranty.hasWarranty} />
                                                                    {errors.warrantyDuration && <p className="text-red-500 text-xs mt-1">{errors.warrantyDuration}</p>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {shouldRenderField('returnPolicy') && (
                                                        <div className="form-control">
                                                            <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight">Return Policy Terms{getLabelSuffix('returnPolicy')} (Max 6)</span></label>
                                                            <div className="space-y-2">
                                                                <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem] p-2 bg-yellowHalf border border-greyLight rounded-md">
                                                                    {productDetails.returnPolicy.map((policy, index) => (
                                                                        <div key={index} className="badge badge-outline badge-lg gap-2 pr-1 bg-blackDark font-bold border-greyLight text-whiteLight">
                                                                            <span>{policy}</span>
                                                                            <button type="button" onClick={() => removeReturnPolicy(index)} className="text-red-500 bg-whiteLight hover:text-red-500 transition-colors" aria-label={`Remove: ${policy}`}><X className="w-3.5 h-3.5" /></button>
                                                                        </div>
                                                                    ))}
                                                                    {productDetails.returnPolicy.length === 0 && <span className="text-xs text-blackDark italic">{isFieldRequired('returnPolicy') ? 'Add required return terms.' : 'No return terms added yet.'}</span>}
                                                                </div>
                                                                {productDetails.returnPolicy.length < 6 && (
                                                                    <div className="flex gap-2">
                                                                        <input type="text" value={returnPolicyInput} onChange={(e) => setReturnPolicyInput(e.target.value)} className="input input-bordered input-sm focus:input-focus bg-blackLight text-whiteLight flex-1" placeholder="Add term (e.g., 7-day return)" maxLength={50} />
                                                                        <button type="button" onClick={addReturnPolicy} className="btn btn-sm btn-ghost bg-newYellow text-blackDark px-3 cursor-pointer" disabled={!returnPolicyInput.trim() || productDetails.returnPolicy.length >= 6} aria-label="Add return term"><Plus className="w-4 h-4 mr-1" /> Add</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {errors.returnPolicy && <p className="text-red-500 text-xs mt-1">{errors.returnPolicy}</p>}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )} {/* End Warranty & Returns */}

                        </div> {/* End Main Content Column */}


                        {/* --- Sidebar Column (Right Side) --- */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Section: Settings & Visibility */}
                            <div className="p-5 bg-blackDark rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold text-newYellow mb-4 border-b pb-2 flex items-center gap-2"><Settings size={18} className="text-newYellow" /> Settings & Visibility</h3>
                                <div className="space-y-4">
                                    {/* Helper for label suffix */}
                                    {(() => {
                                        const getLabelSuffix = (fieldName) => isFieldRequired(fieldName) ? <span className="text-red-500">&nbsp; *</span> : (isFieldOptional(fieldName) ? ' (Optional)' : '');
                                        return (
                                            <>
                                                {/* Allow Dropshipping */}
                                                {shouldRenderField('allowDropshipping') && (
                                                    <div className="form-control">
                                                        <label className="label cursor-pointer justify-between p-0">
                                                            <span className="label-text font-medium text-whiteLight flex-grow mr-4">Allow Dropshipping?</span>
                                                            <input
                                                                type="checkbox"
                                                                name="allowDropshipping"
                                                                checked={productDetails.allowDropshipping}
                                                                onChange={handleChange}
                                                                className={`toggle toggle-sm ${productDetails.allowDropshipping ? 'toggle-warning' : 'bg-white border-white'}`}
                                                            />
                                                        </label>
                                                        <p className="text-xs text-whiteHalf pt-1">Enable for approved dropshippers.</p>
                                                        {errors.allowDropshipping && <p className="text-red-500 text-xs mt-1 w-full">{errors.allowDropshipping}</p>}
                                                    </div>
                                                )}
                                                {/* Product Active */}
                                                {shouldRenderField('isActive') && (
                                                    <div className="form-control">
                                                        <label className="label cursor-pointer justify-between p-0">
                                                            <span className="label-text font-medium text-whiteLight flex-grow mr-4">Product Active?{getLabelSuffix('isActive')}</span>
                                                            <input
                                                                type="checkbox"
                                                                name="isActive"
                                                                checked={productDetails.isActive}
                                                                onChange={handleChange}
                                                                className={`toggle toggle-sm ${productDetails.isActive ? 'toggle-warning' : 'bg-white border-white'}`}
                                                            />
                                                        </label>
                                                        <p className="text-xs text-whiteHalf pt-1">Uncheck to hide from store.</p>
                                                        {errors.isActive && <p className="text-red-500 text-xs mt-1 w-full">{errors.isActive}</p>}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Section: Pricing */}
                            <div className="p-5 bg-blackDark rounded-lg shadow-md ">
                                <h2 className="text-lg font-semibold text-newYellow mb-2 border-b pb-2 flex items-center gap-2"><IndianRupee className="w-5 h-5 text-newYellow" /> Pricing</h2>
                                <div className="space-y-2">
                                    {/* Buy It Now Pricing */}
                                    <div className="bg-blackLight p-4 rounded-lg ">
                                        <h4 className="text-md font-medium text-newYellow mb-3 flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-newYellow" /> Buy It Now Price</h4>
                                        <div className="space-y-3">
                                            <div className="form-control w-full">
                                                <label className="label pb-1"><span className="label-text font-medium text-whiteLight flex items-center">Actual Price (MRP) <span className="text-red-500">&nbsp; *</span></span></label>
                                                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span><input type="text" name="MRP" value={productDetails.MRP} onChange={handleNumericInput} className={`input input-bordered w-full pl-7 focus:input-focus bg-blackDark text-whiteLight ${errors.MRP ? 'input-error' : ''}`} placeholder="0.00" required /></div>
                                                {errors.MRP && <p className="text-red-500 text-xs mt-1">{errors.MRP}</p>}
                                            </div>
                                            <div className="form-control w-full">
                                                <label className="label pb-1"><span className="label-text font-medium text-whiteLight flex items-center">Selling Price <span className="text-red-500">&nbsp; *</span></span></label>
                                                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span><input type="text" name="productPrice" value={productDetails.productPrice} onChange={handleNumericInput} className={`input input-bordered w-full pl-7 focus:input-focus bg-blackDark text-whiteLight ${errors.productPrice ? 'input-error' : ''}`} placeholder="0.00" required /></div>
                                                {errors.productPrice && <p className="text-red-500 text-xs mt-1">{errors.productPrice}</p>}
                                            </div>
                                            {/* Commission (Conditional on Dropshipping Toggle) */}
                                            {productDetails.allowDropshipping && (
                                                <div className="form-control w-full">
                                                    <label className="label pb-1"><span className="label-text font-medium text-whiteLight flex items-center"><AiOutlinePercentage className="h-4 w-4 mr-2 text-newYellow" /> Commission (%) <span className="text-red-500">&nbsp; *</span></span></label>
                                                    <div className="relative">
                                                        <input type="text" name="commissionRate" value={productDetails.commissionRate} onChange={handleNumericInput} className={`input input-bordered w-full pr-8 focus:input-focus bg-blackDark text-whiteLight ${errors.commissionRate ? 'input-error' : ''}`} placeholder="e.g., 10" required={productDetails.allowDropshipping} />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                                                    </div>
                                                    {errors.commissionRate && <p className="text-red-500 text-xs mt-1">{errors.commissionRate}</p>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Auction Pricing (Optional Fields) */}
                                    <div className="bg-blackLight p-4 rounded-lg ">
                                        <h4 className="text-md font-medium text-newYellow mb-3 flex items-center gap-2"><Gavel className="h-5 w-5 text-newYellow" /> Auction Settings (Optional)</h4>
                                        <div className="space-y-3">
                                            <div className="form-control w-full">
                                                <label className="label pb-1"><span className="label-text font-medium text-whiteLight flex items-center">Starting Bid Price</span></label>
                                                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span><input type="text" name="startingPrice" value={productDetails.startingPrice} onChange={handleNumericInput} className={`input input-bordered w-full pl-7 focus:input-focus bg-blackDark text-whiteLight ${errors.startingPrice ? 'input-error' : ''}`} placeholder="Optional" /></div>
                                                {errors.startingPrice && <p className="text-red-500 text-xs mt-1">{errors.startingPrice}</p>}
                                            </div>
                                            <div className="form-control w-full">
                                                <label className="label pb-1"><span className="label-text font-medium text-whiteLight flex items-center">Reserved Price</span></label>
                                                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span><input type="text" name="reservedPrice" value={productDetails.reservedPrice} onChange={handleNumericInput} className={`input input-bordered w-full pl-7 focus:input-focus bg-blackDark text-whiteLight ${errors.reservedPrice ? 'input-error' : ''}`} placeholder="Optional min bid" /></div>
                                                {errors.reservedPrice && <p className="text-red-500 text-xs mt-1">{errors.reservedPrice}</p>}
                                                <div className="mt-2 text-xs text-gray-400 bg-yellowHalf p-2 rounded-md border-l-4 border-greyLight flex items-center gap-2"><Info className="h-4 w-4 flex-shrink-0 text-gray-200" /><span>If bid is below this, item won't sell. Leave blank if no reserve.</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Shipping */}
                            {(shouldRenderField('hazardousMaterials')) && (
                                <div className="p-5 bg-blackDark rounded-lg shadow-md ">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center text-newYellow border-b pb-2 gap-2"><Package className="w-5 h-5 text-newYellow" /> Shipping Considerations</h3>
                                    <div className="space-y-4">
                                        {/* Helper for label suffix */}
                                        {(() => {
                                            const getLabelSuffix = (fieldName) => isFieldRequired(fieldName) ? <span className="text-red-500">&nbsp; *</span> : (isFieldOptional(fieldName) ? ' (Optional)' : '');
                                            return (
                                                <>
                                                    <div className="form-control w-full relative">
                                                        <label className="label pb-1"><span className="label-text font-medium text-whiteLight flex items-center"> Hazardous Materials {<span className="text-red-500">&nbsp; *</span>}</span></label>
                                                        <select name="hazardousMaterials" value={productDetails.hazardousMaterials} onChange={handleChange} className={`select select-bordered w-full focus:select-focus bg-blackLight text-whiteLight appearance-none ${errors.hazardousMaterials ? 'select-error' : ''}`} required={isFieldRequired('hazardousMaterials')}>
                                                            <option value="" disabled>Select hazard type or none</option><option value="no hazardous materials">No hazardous materials</option><option value="fragrances">Fragrances</option><option value="lithium batteries">Lithium batteries</option><option value="other hazardous materials">Other hazardous materials</option>
                                                        </select>
                                                        <FaChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 mt-1 pointer-events-none" />
                                                        {errors.hazardousMaterials && <p className="text-red-500 text-xs mt-1">{errors.hazardousMaterials}</p>}
                                                        {/* Display informational message based on selection */}
                                                        {productDetails.hazardousMaterials && (
                                                            <div className={`mt-2 text-xs p-2 rounded-md border-l-4 flex items-center gap-2 ${productDetails.hazardousMaterials === "no hazardous materials" ? 'bg-green-50 border-green-300 text-green-800' : 'bg-amber-50 border-amber-400 text-amber-800'}`}>
                                                                {productDetails.hazardousMaterials === "no hazardous materials" ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                                                                <span>{getHazardousMessage(productDetails.hazardousMaterials)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}


                            {/* Section: Seller Information */}
                            <div className="p-5 bg-blackDark rounded-lg shadow-md ">
                                <h3 className="text-lg font-semibold mb-4 flex items-center text-newYellow border-b pb-2 gap-2"><UserCircle className="w-5 h-5 text-newYellow" /> Seller Information</h3>
                                <div className="space-y-4">
                                    {/* These might be non-editable or pre-filled from profile */}
                                    <div className="form-control w-full">
                                        <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight">Seller Name <span className="text-red-500">&nbsp; *</span></span></label>
                                        <input type="text" name="sellerName" value={productDetails.sellerName} onChange={handleChange} placeholder="Your seller name" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.sellerName ? 'input-error' : ''}`} readOnly={true} />
                                        {errors.sellerName && <p className="text-red-500 text-xs mt-1">{errors.sellerName}</p>}
                                    </div>
                                    <div className="form-control w-full">
                                        <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><Phone className="w-4 h-4 mr-2 text-newYellow" /> Seller Contact <span className="text-red-500">&nbsp; *</span></span></label>
                                        <input type="tel" name="sellerContact" value={productDetails.sellerContact} onChange={handleTelInput} placeholder="Your contact number" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.sellerContact ? 'input-error' : ''}`} readOnly={true} />
                                        {errors.sellerContact && <p className="text-red-500 text-xs mt-1">{errors.sellerContact}</p>}
                                    </div>
                                    <div className="form-control w-full">
                                        <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><FileText className="w-4 h-4 mr-2 text-newYellow" /> Seller GSTIN <span className="text-red-500">&nbsp; *</span></span></label>
                                        <input type="text" name="sellerGSTIN" value={productDetails.sellerGSTIN} onChange={(e) => handleChange({ target: { name: 'sellerGSTIN', value: e.target.value.toUpperCase() } })} placeholder="Your 15-digit GSTIN" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.sellerGSTIN ? 'input-error' : ''}`} readOnly={true} maxLength={15} />
                                        {errors.sellerGSTIN && <p className="text-red-500 text-xs mt-1">{errors.sellerGSTIN}</p>}
                                    </div>
                                    <div className="form-control w-full">
                                        <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight">GST Rate (%) <span className="text-red-500">&nbsp; *</span></span></label>
                                        <div className="relative">
                                            <input type="text" name="gstRate" value={productDetails.gstRate} onChange={handleNumericInput} className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight w-full pr-8 ${errors.gstRate ? 'input-error' : ''}`} placeholder="e.g., 5, 12, 18" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                                        </div>
                                        {errors.gstRate && <p className="text-red-500 text-xs mt-1">{errors.gstRate}</p>}
                                    </div>
                                </div>
                            </div>

                        </div> {/* End Sidebar Column */}
                    </div> {/* End Main Grid Layout */}

                    {/* Submit Button */}
                    <div className="pt-8 flex justify-center border-t border-greyLight">
                        <button
                            type="submit"
                            disabled={submitting || uploadingImages}
                            className={`btn btn-ghost bg-newYellow btn-lg min-w-[240px]  hover:bg-blackDark text-blackDark font-bold rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 hover:text-newYellow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 disabled:bg-gray-400`}
                        >
                            {submitting ? (<><span className="loading loading-spinner loading-sm mr-2"></span> Updating...</>) : (<><CheckCircle className="mr-2" /> Update Product</>)}
                        </button>
                    </div>
                </form>
                </div>
            </div>

            {/* Discard Confirmation Modal */}
            {showDiscardModal && (
                <div className="modal modal-open fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className="modal-box max-w-md bg-blackDark rounded-lg shadow-xl p-6">
                        <h3 className="font-bold text-lg text-newYellow flex items-center gap-2"><AlertCircle /> Discard Changes?</h3>
                        <p className="py-4 text-whiteLight">Are you sure you want to leave? Unsaved changes will be lost.</p>
                        <div className="modal-action justify-end gap-3 mt-4">
                            <button onClick={handleCancelDiscard} className="btn btn-ghost bg-slate-100 text-blackDark">Cancel</button>
                            <button onClick={handleConfirmDiscard} className="btn btn-error text-white">Discard</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditProductListing;