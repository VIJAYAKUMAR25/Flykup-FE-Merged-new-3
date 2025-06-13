import React, { useState, useEffect, useMemo } from "react";
import {
    FaInfoCircle,
    FaPlus,
    FaRegTrashAlt,
    FaChevronDown,
    FaChevronLeft,
} from "react-icons/fa";
import {
    X,
    Settings,
    ShoppingCart,
    DollarSign,
    IndianRupee,
    Gavel,
    ArrowDown,
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
    Recycle,
} from "lucide-react";
import { HiUser, HiHashtag, HiDocumentText } from "react-icons/hi";
import { AiOutlinePercentage } from "react-icons/ai";
import { Plus } from "lucide-react";
import { CREATE_PRODUCT_LISTING, GET_CATEGORIES} from "../../api/apiDetails"; 
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance"; 
import { getFieldsForCategory } from "./fieldMapping"; 
import { countries } from 'countries-list';
import { uploadImageToS3 } from "../../../utils/aws";
import { FaArrowLeft } from "react-icons/fa";

const LiveStreamProductForm = () => {
    const initialProductDetails = {
        title: "",
        description: "",
        quantity: "",
        images: [],
        category: "",
        subcategory: "",
        hsnNo: "",
        MRP: "",
        productPrice: "",
        startingPrice: "",
        reservedPrice: "",
        commissionRate: "",
        brand: "",
        manufacturer: "",
        manufacturerAddress: "",
        countryOfOrigin: "",
        netQuantity: "",
        packagingType: "",
        weight: { value: "", unit: "grams" },
        dimensions: { length: "", width: "", height: "" },
        expiryDate: "",
        shelfLife: "",
        batchNumber: "",
        gstRate: "",
        sellerName: "",
        sellerContact: "",
        sellerGSTIN: "",
        returnPolicy: [],
        warranty: { hasWarranty: false, duration: "" },
        fssaiLicenseNo: "",
        bisCertification: "",
        importerName: "",
        importerAddress: "",
        importerGSTIN: "",
        eWasteCompliance: false,
        recyclablePackaging: false,
        hazardousMaterials: "",
        allowDropshipping: false,
        isActive: true,
    };

    const isNumber = (value) => 
        value !== null && value !== '' && !isNaN(value) && !isNaN(parseFloat(value));

    
    const navigate = useNavigate();
    const [productDetails, setProductDetails] = useState(initialProductDetails);
    const [errors, setErrors] = useState({});
    const [categories, setCategories] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [returnPolicyInput, setReturnPolicyInput] = useState("");
    const [requiredFields, setRequiredFields] = useState(getFieldsForCategory(null, null).required);
    const [optionalFields, setOptionalFields] = useState(getFieldsForCategory(null, null).optional);

    const cdnURL = import.meta.env.VITE_AWS_CDN_URL;




    // Fetch categories on mount
    useEffect(() => {
        axiosInstance
            .get(GET_CATEGORIES)
            .then((res) => {
                setCategories(res.data);
                console.log("Categories fetched:", res.data); // Debugging log
            })
            .catch((err) => {
                console.error("Failed to fetch categories", err);
                toast.error("Failed to load categories.");
            });
    }, []);


     useEffect(() => {
        const { category, subcategory } = productDetails;
        const fields = getFieldsForCategory(category, subcategory);
        setRequiredFields(fields.required);
        setOptionalFields(fields.optional);
    }, [productDetails.category, productDetails.subcategory]);

    // --- Helper functions for rendering ---
    const isFieldRequired = (fieldName) => requiredFields.includes(fieldName);
    const isFieldOptional = (fieldName) => optionalFields.includes(fieldName);
    const shouldRenderField = (fieldName) => isFieldRequired(fieldName) || isFieldOptional(fieldName);

    const getLabelSuffix = (fieldName) => {
    if (isFieldRequired(fieldName)) return <span className="text-red-500">&nbsp; *</span>;
    if (isFieldOptional(fieldName)) return ' (Optional)';
    return '';
};

    const handleNestedChange = (parent, field) => (e) => {
        const { value, type, checked } = e.target;
        setProductDetails((prev) => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: type === "checkbox" ? checked : value,
            },
        }));

        if (errors[parent]) setErrors((prev) => ({ ...prev, [parent]: undefined }));
         if (parent === 'warranty' && field === 'hasWarranty' && !checked) {
            setErrors((prev) => ({ ...prev, warrantyDuration: undefined }));
         }

         const nestedErrorKey = `${parent}${field.charAt(0).toUpperCase() + field.slice(1)}`;
         if (errors[nestedErrorKey]) {
             setErrors((prev) => ({ ...prev, [nestedErrorKey]: undefined }));
         }

         if (errors[parent]) {
             setErrors((prev) => ({ ...prev, [parent]: undefined }));
         }

    };

    const addReturnPolicy = () => {
        if (returnPolicyInput.trim() && productDetails.returnPolicy.length < 6) {
            setProductDetails((prev) => ({
                ...prev,
                returnPolicy: [...prev.returnPolicy, returnPolicyInput.trim()],
            }));
            setReturnPolicyInput("");
             if (errors.returnPolicy) setErrors((prev) => ({ ...prev, returnPolicy: undefined })); // Clear error on add
        } else if (productDetails.returnPolicy.length >= 6) {
            toast.warn("Maximum of 6 return policy terms allowed.");
        }
    };

    const removeReturnPolicy = (index) => {
        setProductDetails((prev) => ({
            ...prev,
            returnPolicy: prev.returnPolicy.filter((_, i) => i !== index),
        }));
         if (errors.returnPolicy) setErrors((prev) => ({ ...prev, returnPolicy: undefined }));
    };


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === "checkbox" ? checked : value;

        setProductDetails((prev) => ({
            ...prev,
            [name]: newValue,
        }));

        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));

         if (name === 'countryOfOrigin' && value.toLowerCase() === 'india') {
             setErrors((prev) => ({ ...prev, importerName: undefined, importerAddress: undefined, importerGSTIN: undefined }));
         }

         if(name === 'allowDropshipping' && !checked) {
              setErrors((prev) => ({ ...prev, commissionRate: undefined}));
         }
    };

      const handleCategoryChange = (e) => {
        const selectedCategory = e.target.value;
        const resetFields = {}; 

        setProductDetails((prev) => ({
            ...prev,
            ...resetFields, 
            category: selectedCategory,
            subcategory: "", 
           
           }));

        setErrors((prev) => ({

            ...prev,
            category: undefined,
            subcategory: undefined,
           
        }));
    };

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

    const handleImageChange = async (e) => {

        const files = Array.from(e.target.files).slice(
            0,
            4 - productDetails.images.filter(img => img.status !== 'pending' && img.status !== 'uploading').length // Allow adding up to 4 successful uploads
        );
        if (files.length === 0) return;

        setErrors((prev) => ({ ...prev, images: undefined }));

        const validTypes = ["image/jpeg", "image/jpg", "image/png"];
        const invalidFiles = files.filter(file => !validTypes.includes(file.type));
        if (invalidFiles.length > 0) {
            setErrors((prev) => ({ ...prev, images: "Invalid file type(s). Only JPG, JPEG, PNG allowed." }));
            return;
        }

  const newImages = files.map((file) => ({
    preview: URL.createObjectURL(file),
    key: null,
    jpgURL: null,
    status: "pending",
    file,
  }));

  setProductDetails((prev) => ({
    ...prev,
    images: [...prev.images, ...newImages].slice(0, 4),
  }));

  setUploadingImages(true);

  const uploadPromises = newImages.map(async (newImage) => {
    try {
      setProductDetails((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.preview === newImage.preview
            ? { ...img, status: "uploading" }
            : img
        ),
      }));

      // AWS S3 Upload
      const key = await uploadImageToS3(newImage.file, 'products');
      const jpgURL =  "";

      setProductDetails((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.preview === newImage.preview
            ? { ...img, key, jpgURL, status: "done", preview: null, file: null }
            : img
        ),
      }));

      if (newImage.preview) URL.revokeObjectURL(newImage.preview);
    } catch (error) {
      console.error("Upload failed:", error);
      setProductDetails((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.preview === newImage.preview
            ? { ...img, status: "error", file: null }
            : img
        ),
      }));
      setErrors((prev) => ({
        ...prev,
        images: "Upload failed for one or more images.",
      }));
      if (newImage.preview) URL.revokeObjectURL(newImage.preview);
    }
  });

  await Promise.all(uploadPromises);
  setUploadingImages(false);
};

    const removeImage = (index) => {
        setProductDetails((prev) => {
            const images = [...prev.images];
            const removed = images.splice(index, 1)[0];
            if (removed?.preview) URL.revokeObjectURL(removed.preview); 
            return { ...prev, images };
        });
        if (errors.images) setErrors(prev => ({...prev, images: undefined}));
    };

    useEffect(() => {
        return () => {
            productDetails.images.forEach((img) => {
                if (img.preview) URL.revokeObjectURL(img.preview);
            });
        };
    }, [productDetails.images]);

    const validateForm = () => {
        const newErrors = {};
        const {
            title, description, quantity, category, subcategory, MRP, productPrice, startingPrice, reservedPrice,
            weight, dimensions, brand, manufacturer, manufacturerAddress, countryOfOrigin, netQuantity, packagingType,
            expiryDate, shelfLife, batchNumber, gstRate, sellerName, sellerContact, sellerGSTIN, warranty, hazardousMaterials, images,
            allowDropshipping, commissionRate, fssaiLicenseNo, bisCertification, eWasteCompliance, recyclablePackaging,
            importerName, importerAddress, importerGSTIN, hsnNo, returnPolicy, isActive
        } = productDetails;

        const isNumber = (value) => value !== null && value !== '' && !isNaN(value) && !isNaN(parseFloat(value));
        const isPositive = (value) => isNumber(value) && parseFloat(value) > 0;
        const isInteger = (value) => /^\d+$/.test(value);
        
        const isValidGSTIN = (gstin) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/i.test(gstin); // Standard format

        if (!title.trim()) newErrors.title = "Product title is required";
        else if (title.length > 150) newErrors.title = "Title must be less than 150 characters";

        if (!description.trim()) newErrors.description = "Product description is required";
        else if (description.length > 2000) newErrors.description = "Description must be less than 2000 characters";

        if (!quantity) newErrors.quantity = "Stock quantity is required";
        else if (!isInteger(quantity) || parseInt(quantity) <= 0) newErrors.quantity = "Valid stock quantity (>0 integer) required";

        if (!category) newErrors.category = "Category is required";
        if (!subcategory) newErrors.subcategory = "Subcategory is required";

        const validImages = images.filter(img => img.status === 'done');
        if (validImages.length === 0) newErrors.images = "At least one product image is required";
        if (images.some(img => img.status === 'uploading')) newErrors.images = "Wait for image uploads to finish";
        if (images.some(img => img.status === 'error')) newErrors.images = "Fix image upload errors before submitting";

        if (!MRP) newErrors.MRP = "MRP is required";
        else if (!isPositive(MRP)) newErrors.MRP = "Valid MRP required (>0)";

        if (!productPrice) newErrors.productPrice = "Selling price is required";
        else if (!isPositive(productPrice)) newErrors.productPrice = "Valid price required (>0)";
        else if (isNumber(MRP) && isNumber(productPrice) && parseFloat(productPrice) > parseFloat(MRP)) newErrors.productPrice = "Selling price must be ≤ MRP";

        if (!gstRate) newErrors.gstRate = "GST Rate is required";
        else if (!isNumber(gstRate) || gstRate < 0) newErrors.gstRate = "Valid GST Rate required (≥0)";

        if (!sellerName.trim()) newErrors.sellerName = "Seller Name is required";
        if (!sellerContact.trim()) newErrors.sellerContact = "Seller Contact is required";
    
        if (!sellerGSTIN.trim()) newErrors.sellerGSTIN = "Seller GSTIN is required";
        else if (!isValidGSTIN(sellerGSTIN)) newErrors.sellerGSTIN = "Invalid GSTIN format (e.g., 29ABCDE1234F1Z5)"; // Keep format validation

        if (!hazardousMaterials) newErrors.hazardousMaterials = "Hazardous material declaration is required";

        if (startingPrice && (!isPositive(startingPrice))) newErrors.startingPrice = "If entered, Starting Bid must be a valid price (>0)";
        if (reservedPrice && (!isPositive(reservedPrice))) newErrors.reservedPrice = "If entered, Reserved Price must be a valid price (>0)";
        if (isNumber(startingPrice) && isNumber(reservedPrice) && parseFloat(startingPrice) > parseFloat(reservedPrice)) newErrors.reservedPrice = "Reserved price must be ≥ starting price";

        if (allowDropshipping) {
             if (!commissionRate) newErrors.commissionRate = "Commission rate is required if dropshipping is allowed";
             else if (!isNumber(commissionRate) || commissionRate < 0 || commissionRate > 100) newErrors.commissionRate = "Valid commission rate (0-100) required";
        }

        // Brand
        if (isFieldRequired('brand') && !brand.trim()) newErrors.brand = "Brand name is required for this category";
        else if (brand.trim() && brand.length > 50) newErrors.brand = "Brand name too long (max 50)"; // Validate length even if optional but entered

        // Manufacturer
        if (isFieldRequired('manufacturer') && !manufacturer.trim()) newErrors.manufacturer = "Manufacturer is required for this category";
        else if (manufacturer.trim() && manufacturer.length > 100) newErrors.manufacturer = "Manufacturer name too long (max 100)";

        if (isFieldRequired('manufacturerAddress') && !manufacturerAddress.trim()) newErrors.manufacturerAddress = "Manufacturer address is required for this category";
        else if (manufacturerAddress.trim() && manufacturerAddress.length > 200) newErrors.manufacturerAddress = "Address too long (max 200)";

        if (isFieldRequired('countryOfOrigin') && !countryOfOrigin.trim()) newErrors.countryOfOrigin = "Country of origin is required for this category";


        if (isFieldRequired('netQuantity') && !netQuantity.trim()) newErrors.netQuantity = "Net quantity (e.g., 500g, 1 Unit) is required for this category";
        else if (netQuantity.trim() && netQuantity.length > 30) newErrors.netQuantity = "Net quantity too long (max 30)";

        if (isFieldRequired('packagingType') && !packagingType) newErrors.packagingType = "Packaging type is required for this category";

        if (isFieldRequired('hsnNo') && !hsnNo.trim()) newErrors.hsnNo = "HSN No is required for this category";
        else if (hsnNo.trim() && !/^\d{4,8}$/.test(hsnNo)) newErrors.hsnNo = "HSN No should be 4 to 8 digits";

        if (isFieldRequired('weight')) {
            if (!weight.value.trim()) newErrors.weight = "Item weight value is required for this category";
            else if (!isPositive(weight.value)) newErrors.weight = "Valid weight value required (>0)";
            if (!weight.unit) newErrors.weight = "Weight unit is required";
        } else if (weight.value.trim() && (!isPositive(weight.value) || !weight.unit)) {

             if (!isPositive(weight.value)) newErrors.weight = "If entered, weight value must be > 0";
             if (!weight.unit) newErrors.weight = "If weight value entered, unit is required";
        }

        // Dimensions
        if (isFieldRequired('dimensions')) {
            if (!dimensions.length || !isPositive(dimensions.length)) newErrors.dimensions = "Valid length (cm, >0) required";
            if (!dimensions.width || !isPositive(dimensions.width)) newErrors.dimensions = "Valid width (cm, >0) required";
            if (!dimensions.height || !isPositive(dimensions.height)) newErrors.dimensions = "Valid height (cm, >0) required";
        } else if (dimensions.length || dimensions.width || dimensions.height) {
            // Validate format if optionally entered (any dimension)
            if ((dimensions.length && !isPositive(dimensions.length)) ||
                (dimensions.width && !isPositive(dimensions.width)) ||
                (dimensions.height && !isPositive(dimensions.height))) {
                 newErrors.dimensions = "If entered, all dimensions must be valid numbers > 0";
            } else if (!dimensions.length || !dimensions.width || !dimensions.height) {
                 newErrors.dimensions = "If any dimension is entered, all (L, W, H) are required";
            }
        }

        if (isFieldRequired('shelfLife') && !shelfLife.trim()) newErrors.shelfLife = "Shelf life is required for this category";

        if (isFieldRequired('expiryDate') && !expiryDate) newErrors.expiryDate = "Expiry date is required for this category";

        if (isFieldRequired('batchNumber') && !batchNumber.trim()) newErrors.batchNumber = "Batch number is required for this category";

        if (isFieldRequired('fssaiLicenseNo') && !fssaiLicenseNo.trim()) newErrors.fssaiLicenseNo = "FSSAI license number is required for this category";
  
        if (isFieldRequired('bisCertification') && !bisCertification.trim()) newErrors.bisCertification = "BIS certification details are required for this category";

        if (isFieldRequired('warranty') && warranty.hasWarranty && !warranty.duration.trim()) newErrors.warrantyDuration = "Warranty duration is required when 'Has Warranty' is checked";

        if (isFieldRequired('returnPolicy') && returnPolicy.length === 0) newErrors.returnPolicy = "At least one return policy term is required for this category";

       
        const showImporterFieldsCheck = countryOfOrigin && countryOfOrigin.toLowerCase() !== 'india';
        if (showImporterFieldsCheck) {
            if (isFieldRequired('importerName') && !importerName.trim()) newErrors.importerName = "Importer Name is required for non-India origin";
            if (isFieldRequired('importerAddress') && !importerAddress.trim()) newErrors.importerAddress = "Importer Address is required for non-India origin";
            if (isFieldRequired('importerGSTIN') && !importerGSTIN.trim()) newErrors.importerGSTIN = "Importer GSTIN is required for non-India origin";
            else if (importerGSTIN.trim() && !isValidGSTIN(importerGSTIN)) newErrors.importerGSTIN = "Invalid Importer GSTIN format"; // Validate format if entered
        }

    
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const countryOptions = useMemo(() => {
        return Object.entries(countries)
            .map(([code, countryData]) => ({
                value: countryData.name,
                label: countryData.name,
            }))
            .sort((a, b) => a.label.localeCompare(b.label)); 
    }, []); 

    // --- Handle Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Re-validate on submit attempt
        if (!validateForm()) {
             toast.error("Please fix the errors in the form.");
             // Optional: Scroll to the first error
             const firstErrorKey = Object.keys(errors)[0];
             if (firstErrorKey) {
                 const errorElement = document.querySelector(`[name="${firstErrorKey}"]`);
                 errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
             }
             return;
        }

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
            toast.error("Please upload at least one product image.");
             setErrors((prev) => ({ ...prev, images: "At least one image must be successfully uploaded." }));
            return;
        }

        setSubmitting(true);

        try {

             const payload = {
                 ...productDetails,
                 quantity: Number(productDetails.quantity),
                 MRP: parseFloat(productDetails.MRP),
                 productPrice: parseFloat(productDetails.productPrice),
                 startingPrice: productDetails.startingPrice ? parseFloat(productDetails.startingPrice) : null,
                 reservedPrice: productDetails.reservedPrice ? parseFloat(productDetails.reservedPrice) : null,
                 commissionRate: productDetails.commissionRate ? parseFloat(productDetails.commissionRate) : null,
                 gstRate: parseFloat(productDetails.gstRate),
                 weight: {
                     value: productDetails.weight.value ? parseFloat(productDetails.weight.value) : null,
                     unit: productDetails.weight.value && productDetails.weight.value? productDetails.weight.unit : null // Include unit only if value is valid
                 },
                 dimensions: {
                      length: productDetails.dimensions.length ? parseFloat(productDetails.dimensions.length) : null,
                      width: productDetails.dimensions.width ? parseFloat(productDetails.dimensions.width) : null,
                      height: productDetails.dimensions.height ? parseFloat(productDetails.dimensions.height) : null
                 },
                 images: successfulImages.map(({ key }) => ({ key})),
               
                 expiryDate: productDetails.expiryDate || null,
                 batchNumber: productDetails.batchNumber || null,
                 shelfLife: productDetails.shelfLife || null,
                 fssaiLicenseNo: productDetails.fssaiLicenseNo || null,
                 bisCertification: productDetails.bisCertification || null,
                 importerName: productDetails.importerName || null,
                 importerAddress: productDetails.importerAddress || null,
                 importerGSTIN: productDetails.importerGSTIN || null,
                 hsnNo: productDetails.hsnNo || null,
             };

             // Helper function for checking if a number is valid
             const isNumber = (value) => value !== null && value !== '' && !isNaN(value) && !isNaN(parseFloat(value)); 

             if (payload.weight.value === null) {
                 payload.weight = null;
             }
             if (payload.dimensions.length === null || payload.dimensions.width === null || payload.dimensions.height === null) {
                 payload.dimensions = null;
             }


             
             if (!payload.allowDropshipping) delete payload.commissionRate;
             if (!payload.warranty.hasWarranty) {
                 payload.warranty = { hasWarranty: false, duration: null } 

             }

         
             if (payload.countryOfOrigin?.toLowerCase() === 'india') {
                 delete payload.importerName;
                 delete payload.importerAddress;
                 delete payload.importerGSTIN;
             }

             console.log("Submitting Payload:", payload); 

             const res = await axiosInstance.post(CREATE_PRODUCT_LISTING, payload);
             if (res.data.status) {
                 toast.success("Product listing added successfully!");
                 setProductDetails(initialProductDetails);
                 setRequiredFields(getFieldsForCategory(null, null).required);
                 setOptionalFields(getFieldsForCategory(null, null).optional);
                 navigate("/seller/productlisting");
             } else {
                  toast.error(res.data.message || "Failed to add product listing.");
             }
        } catch (error) {
             console.error("Submission error:", error);
             const backendErrors = error.response?.data?.errors;
             const generalMessage = error.response?.data?.message || "An error occurred during submission. Please try again.";

             if (backendErrors && typeof backendErrors === 'object' && Object.keys(backendErrors).length > 0) {
                  setErrors(prev => ({...prev, ...backendErrors})); 
                  toast.error("Validation errors from server. Please check the form.");
             } else {
                  toast.error(generalMessage);
             }
        } finally {
             setSubmitting(false);
        }
    };

    const selectedCategoryObj = categories.find(
        (cat) => cat.categoryName === productDetails.category
    );

    // Helper for hazardous materials message
    const getHazardousMessage = (value) => {
        switch (value) {
            case "no hazardous materials": return "No hazardous materials → Safe for standard shipping.";
            case "fragrances": return "Fragrances → May require special handling or ground shipping.";
            case "lithium batteries": return "Lithium batteries → Requires special handling and labeling due to regulations.";
            case "other hazardous materials": return "Other hazardous materials → Ensure compliance with shipping regulations for specified materials.";
            default: return "";
        }
    };

    
     const showImporterFields = productDetails.countryOfOrigin &&
                                 productDetails.countryOfOrigin.toLowerCase() !== 'india' &&
                                 (shouldRenderField('importerName') || shouldRenderField('importerAddress') || shouldRenderField('importerGSTIN'));

    return (
         <div className="container mx-auto p-2 lg:p-6 bg-blackLight min-h-screen flex flex-col">
            <div className="bg-blackLight rounded-xl shadow-xl relative max-w-6xl mx-auto w-full flex flex-col h-full"> {/* Added flex-col h-full */}
                {/* Header */}
                <div className="sticky top-0 bg-blackLight z-10 flex items-center justify-between mb-3 pb-2 border-b border-greyLight pt-20 px-2 lg:px-6"> {/* Added pt-6 px-6 to match padding */}
                    <Link
                        className="btn btn-ghost btn-sm rounded-full bg-newYellow hover:bg-gray-200 p-2 transition-colors duration-200"
                        to={"/seller/productlisting"} // Adjust path as needed
                        aria-label="Back to Product List"
                    >
                        <FaArrowLeft size={18} className="text-blackDark" />
                    </Link>
                    <h1 className="text-xl md:text-2xl font-bold text-whiteLight text-center uppercase flex-grow mx-4 truncate" style={{ fontWeight: 900 }}>
                        {productDetails.title || "Product Listing"}
                    </h1>
                    <div className="w-10"></div>
                </div>
                <div className="p-3 lg:p-8 pt-0 overflow-y-auto flex-grow"> 
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Main Grid Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* --- Main Content Column (Left Side) --- */}
                        <div className="lg:col-span-2 space-y-6 bg-blackLight rounded-lg shadow-md ">

                            {/* Section: Basic Information */}
                            <div className="p-5 bg-blackDark rounded-lg shadow-md ">
                                <h2 className="text-lg font-semibold text-newYellow mb-5 border-b border-whiteSecondary pb-2 flex items-center gap-2">
                                    Basic Information
                                </h2>
                                <div className="space-y-5">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-control w-full relative">
                                            <label className="label pb-1">
                                                <span className="label-text font-medium text-whiteLight flex items-center">  
                                                    Category <span className="text-red-500">&nbsp; *</span> 
                                                </span>
                                            </label>
                                            <select 
                                                name="category" 
                                                value={productDetails.category} 
                                                onChange={handleCategoryChange} 
                                                className={`select select-bordered w-full focus:select-greyLight bg-blackLight appearance-none ${
                                                    errors.category ? 'select-error' : ''
                                                } ${
                                                    productDetails.category ? 'text-whiteLight' : 'text-whiteHalf'
                                                }`}
                                            >
                                                <option value="" disabled className="text-whiteHalf"> 
                                                    Select Category 
                                                </option>
                                                {categories.map((cat) => (
                                                    <option key={cat._id} value={cat.categoryName} className="text-whiteLight"> 
                                                        {cat.categoryName} 
                                                    </option>
                                                ))}
                                            </select>
                                            <FaChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 mt-1 pointer-events-none" />
                                            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                                        </div>
                                        <div className="form-control w-full relative">
                                            <label className="label pb-1">
                                                <span className="label-text font-medium text-whiteLight flex items-center"> 
                                                    Subcategory <span className="text-red-500">&nbsp; *</span>
                                                </span>
                                            </label>
                                            <select 
                                                name="subcategory" 
                                                value={productDetails.subcategory} 
                                                onChange={handleChange} 
                                                className={`select select-bordered w-full focus:select-greyLight bg-blackLight appearance-none ${
                                                    !productDetails.category ? "opacity-60 cursor-not-allowed" : ""
                                                } ${
                                                    errors.subcategory ? 'select-error' : ''
                                                } ${
                                                    productDetails.subcategory ? 'text-whiteLight' : 'text-whiteHalf'
                                                }`} 
                                                disabled={!productDetails.category}
                                            >
                                                <option value="" disabled className="text-whiteHalf"> 
                                                    Select Subcategory 
                                                </option>
                                                {selectedCategoryObj?.subcategories.map((sub) => (
                                                    <option key={sub._id} value={sub.name} className="text-whiteLight"> 
                                                        {sub.name} 
                                                    </option>
                                                ))}
                                            </select>
                                            <FaChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 mt-1 pointer-events-none" />
                                            {errors.subcategory && <p className="text-red-500 text-xs mt-1">{errors.subcategory}</p>}
                                        </div>
                                    </div>
                                    {/* Title (Always Required) */}
                                        <div className="form-control w-full">
                                            <label className="label pb-1">
                                                <span className="label-text font-medium text-whiteLight flex items-center">
                                                    Product Title <span className="text-red-500">&nbsp; *</span>
                                                </span>
                                            </label>
                                            <input 
                                                type="text" 
                                                name="title" 
                                                value={productDetails.title} 
                                                onChange={handleChange} 
                                                placeholder="Enter product title (e.g., Men's Casual Shirt)" 
                                                className={`input input-bordered w-full focus:input-focus bg-blackLight ${
                                                    productDetails.title ? 'text-whiteLight' : 'text-whiteHalf'
                                                } ${errors.title ? 'input-error' : ''}`}  
                                                maxLength={150} 
                                            />
                                            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                                        </div>

                                        {/* Description (Always Required) */}
                                        <div className="form-control w-full">
                                            <label className="label pb-1">
                                                <span className="label-text font-medium text-whiteLight flex items-center"> 
                                                    Description <span className="text-red-500">&nbsp; *</span> 
                                                </span>
                                            </label>
                                            <textarea 
                                                name="description" 
                                                value={productDetails.description} 
                                                onChange={handleChange} 
                                                className={`textarea textarea-bordered w-full h-24 focus:textarea-focus bg-blackLight ${
                                                    productDetails.description ? 'text-whiteLight' : 'text-whiteHalf'
                                                } ${errors.description ? 'textarea-error' : ''}`} 
                                                placeholder="Detailed description of the product, features, benefits..." 
                                                rows="3" 
                                                maxLength={2000}
                                            >
                                            </textarea>
                                            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                                        </div>
                                   
                                    {/* Stock Quantity (Always Required) & HSN (Conditional) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-control w-full">
                                            <label className="label pb-1">
                                                <span className="label-text font-medium text-whiteLight flex items-center"> 
                                                    {/* <Archive className="w-4 h-4 mr-2 text-whiteLight" />  */}
                                                    Stock Quantity <span className="text-red-500">&nbsp; *</span>
                                                </span>
                                            </label>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                step="1" 
                                                name="quantity" 
                                                value={productDetails.quantity} 
                                                onChange={handleChange} 
                                                placeholder="Available stock count" 
                                                className={`input input-bordered w-full focus:input-focus bg-blackLight ${
                                                    productDetails.quantity ? 'text-whiteLight' : 'text-whiteHalf'
                                                } ${errors.quantity ? 'input-error' : ''}`}  
                                            />
                                            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                                        </div>
                                        
                                        {/* HSN (Conditional) */}
                                        {shouldRenderField('hsnNo') && (
                                            <div className="form-control w-full">
                                                <label className="label pb-1">
                                                    <span className="label-text font-medium text-whiteLight flex items-center">
                                                        <Hash className="w-4 h-4 mr-2 text-whiteLight" />
                                                        HSN No{getLabelSuffix('hsnNo')}
                                                    </span>
                                                </label>
                                                <input 
                                                    type="text" 
                                                    name="hsnNo" 
                                                    value={productDetails.hsnNo} 
                                                    onChange={handleChange} 
                                                    placeholder="Enter HSN code" 
                                                    className={`input input-bordered w-full focus:input-focus bg-blackLight ${
                                                        productDetails.hsnNo ? 'text-whiteLight' : 'text-whiteHalf'
                                                    } ${errors.hsnNo ? 'input-error' : ''}`} 
                                                    maxLength={8} 
                                                    required={isFieldRequired('hsnNo')} 
                                                />
                                                {errors.hsnNo && <p className="text-red-500 text-xs mt-1">{errors.hsnNo}</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                             {/* Section: Product Images (Always Required) */}
                             <div className="p-5 bg-blackDark rounded-lg shadow-md ">
                                  <h2 className="text-lg font-semibold text-newYellow mb-1  pb-2 flex items-center gap-2">
                                       <ImageIcon className="w-5 h-5 text-newYellow" /> Product Images <span className="text-red-500">&nbsp; *</span>
                                  </h2>
                                  {/* ... Image upload and display logic ... (Keep existing structure) */}
                                  <div className="flex flex-wrap gap-4">
                                       {/* Image Previews/Uploads */}
                                       {productDetails.images.map((image, index) => (
                                           <div key={index} className="bg-blackDark relative w-28 h-28 md:w-32 md:h-32 border rounded-md overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 bg-blackDark">
                                               <img 
                                               src={image?.key ? `${cdnURL}${image.key}` : "/placeholder-image.png"}
                                                alt={`product-${index}`} 
                                                className="object-cover w-full h-full" 
                                                onError={(e) => { 
                                                    if (e.target.src !== "/placeholder-image.png") e.target.src = "/placeholder-image.png"; 
                                                }} 
                                               />
                                               {/* Status Overlay */}
                                               {image.status === "uploading" && ( <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center"> <div className="loading loading-spinner loading-sm text-white"></div> </div> )}
                                               {image.status === "error" && ( <div className="absolute inset-0 bg-red-600 bg-opacity-80 flex flex-col items-center justify-center text-white text-xs p-1 text-center"> <AlertCircle size={16} className="mb-1" /> Upload failed </div> )}
                                               {image.status === "done" && index === 0 && ( <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-0.5">Cover</div> )}
                                               {/* Remove Button */}
                                               {(image.status === 'done' || image.status === 'error' || image.status === 'pending') && ( <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400" aria-label={`Remove image ${index + 1}`}> <X size={14} /> </button> )}
                                           </div>
                                       ))}
                                       {/* Add Image Placeholder */}
                                       {productDetails.images.filter(img => img.status !== 'error').length < 4 && (
                                           <label className={`w-28 h-28 md:w-32 md:h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-md cursor-pointer transition-all duration-300 ${uploadingImages ? "border-blue-400 bg-blue-50 animate-pulse cursor-not-allowed" : "border-gray-400 bg-yellowHalf hover:border-amber-200 hover:bg-greyLight"} ${errors.images ? 'border-red-400' : ''} `}>
                                               <div className="text-center text-gray-500"> <FaPlus size={24} className="mx-auto mb-1 text-gray-400" /> <p className="text-xs mt-1"> Add Image ({productDetails.images.filter(img => img.status === 'done').length}/4) </p> </div>
                                               <input type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleImageChange} className="hidden" multiple disabled={uploadingImages || productDetails.images.filter(img => img.status !== 'error').length >= 4}/>
                                           </label>
                                       )}
                                  </div>
                                  <p className="text-xs text-gray-400 mt-3 flex items-center"> <FaInfoCircle className="h-3 w-3 mr-1 text-grey-400 flex-shrink-0" /> Upload up to 4 images (JPG, PNG). First image is cover. </p>
                                  {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
                             </div>


                             {/* Section: Product Specifications (Conditionally render fields inside) */}
                             {(shouldRenderField('brand') || shouldRenderField('manufacturer') || shouldRenderField('manufacturerAddress') || shouldRenderField('countryOfOrigin') || shouldRenderField('netQuantity') || shouldRenderField('weight') || shouldRenderField('dimensions') || shouldRenderField('packagingType') || shouldRenderField('shelfLife') || shouldRenderField('expiryDate') || shouldRenderField('batchNumber') || showImporterFields) && (
                                 <div className="p-5 bg-blackDark rounded-lg shadow-md ">
                                     <h3 className="text-lg font-semibold mb-4 flex items-center text-whiteLight border-b pb-2 gap-2 border-greyLight">
                                         <ClipboardList className="w-5 h-5 text-whiteLight" />
                                         <span className="text-newYellow">Product</span> Specifications {!productDetails.category || !productDetails.subcategory ? '(Select Category/Subcategory First)' : ''}
                                     </h3>
                                     <div className="space-y-4">
                                         {/* Brand & Manufacturer */}
                                         {(shouldRenderField('brand') || shouldRenderField('manufacturer')) && (
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                 {shouldRenderField('brand') && (
                                                     <div className="form-control w-full">
                                                         <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><Tag className="w-4 h-4 mr-2 text-newYellow" />Brand{getLabelSuffix('brand')}</span></label>
                                                         <input type="text" name="brand" value={productDetails.brand} onChange={handleChange} placeholder="e.g., Nike, Samsung" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.brand ? 'input-error' : ''}`} required={isFieldRequired('brand')} maxLength={50} />
                                                         {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
                                                     </div>
                                                 )}
                                                 {shouldRenderField('manufacturer') && (
                                                     <div className="form-control w-full">
                                                         <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><Factory className="w-4 h-4 mr-2 text-newYellow" />Manufacturer{getLabelSuffix('manufacturer')}</span></label>
                                                         <input type="text" name="manufacturer" value={productDetails.manufacturer} onChange={handleChange} placeholder="e.g., Apple Inc., Local Artisans" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.manufacturer ? 'input-error' : ''}`} required={isFieldRequired('manufacturer')} maxLength={100}/>
                                                         {errors.manufacturer && <p className="text-red-500 text-xs mt-1">{errors.manufacturer}</p>}
                                                     </div>
                                                 )}
                                             </div>
                                         )}
                                         {/* Manufacturer Address */}
                                         {shouldRenderField('manufacturerAddress') && (
                                             <div className="form-control w-full">
                                                 {/* Use MapPin icon */}
                                                <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><MapPin className="w-4 h-4 mr-2 text-newYellow" />Manufacturer Address{getLabelSuffix('manufacturerAddress')}</span></label>
                                                <textarea name="manufacturerAddress" value={productDetails.manufacturerAddress} onChange={handleChange} placeholder="Full address of the manufacturer" className={`textarea textarea-bordered focus:textarea-focus bg-blackLight text-whiteLight ${errors.manufacturerAddress ? 'textarea-error' : ''}`} rows="2" required={isFieldRequired('manufacturerAddress')} maxLength={200}></textarea>
                                                {errors.manufacturerAddress && <p className="text-red-500 text-xs mt-1">{errors.manufacturerAddress}</p>}
                                                <p className="text-xs text-whiteHalf mt-1">Include country, state, city, pincode</p>
                                             </div>
                                         )}
                                         {/* Country of Origin & Net Quantity */}
                                         {(shouldRenderField('countryOfOrigin') || shouldRenderField('netQuantity')) && (
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                 {shouldRenderField('countryOfOrigin') && (
                         <div className="form-control w-full relative"> {/* <-- Added relative */}
                             <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><Globe className="w-4 h-4 mr-2 text-newYellow" />Country of Origin{getLabelSuffix('countryOfOrigin')}</span></label>
                             {/* ---- START: REPLACEMENT SELECT ---- */}
                             <select
                                 name="countryOfOrigin"
                                 value={productDetails.countryOfOrigin}
                                 onChange={handleChange} // Your existing handler works fine
                                 className={`select select-bordered w-full focus:select-focus bg-blackLight text-whiteLight appearance-none ${errors.countryOfOrigin ? 'select-error' : ''}`} // Added appearance-none
                                 required={isFieldRequired('countryOfOrigin')}
                             >
                                 <option value="" disabled>Select Country of Origin</option>
                                 {countryOptions.map((country) => (
                                     <option key={country.value} value={country.value}> {/* Using value as key */}
                                         {country.label}
                                     </option>
                                 ))}
                             </select>
                             {/* Add dropdown arrow icon for consistency */}
                             <FaChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 mt-1 pointer-events-none" />
                            {/* ---- END: REPLACEMENT SELECT ---- */}
                             {errors.countryOfOrigin && <p className="text-red-500 text-xs mt-1">{errors.countryOfOrigin}</p>}
                         </div>
                     )}
                                                 {shouldRenderField('netQuantity') && (
                                                     <div className="form-control w-full">
                                                         <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><Scale className="w-4 h-4 mr-2 text-newYellow" />Net Quantity{getLabelSuffix('netQuantity')}</span></label>
                                                         <input type="text" name="netQuantity" value={productDetails.netQuantity} onChange={handleChange} placeholder="e.g., 500g, 1 Piece, 250ml" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.netQuantity ? 'input-error' : ''}`} required={isFieldRequired('netQuantity')} maxLength={30} />
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
                                                         <div className="flex gap-2 items-center">
                                                             <input type="text" placeholder="Value" value={productDetails.weight.value} onChange={handleNestedChange("weight", "value")} onInput={handleNumericInput} className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight flex-grow ${errors.weight ? 'input-error' : ''}`} required={isFieldRequired('weight')} />
                                                             <div className="relative w-2/3">
                                                                 <select name="unit" value={productDetails.weight.unit} onChange={handleNestedChange("weight", "unit")} className={`select select-bordered focus:select-focus bg-blackLight text-whiteLight appearance-none w-full ${errors.weight ? 'select-error' : ''}`} required={isFieldRequired('weight')}>
                                                                     <option value="grams">grams</option><option value="kilograms">kilograms</option><option value="ml">ml</option><option value="litre">litre</option><option value="pounds">pounds</option><option value="ounces">ounces</option>
                                                                 </select>
                                                                 <FaChevronDown className="w-3 h-3 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                                             </div>
                                                         </div>
                                                         {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
                                                     </div>
                                                 )}
                                                 {shouldRenderField('dimensions') && (
                                                     <div className="form-control w-full">
                                                         <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><Ruler className="w-4 h-4 mr-2 text-newYellow" /> Dimensions (cm){getLabelSuffix('dimensions')}</span><span className="label-text-alt text-whiteLight">L x W x H</span></label>
                                                         <div className="flex gap-2">
                                                             <input type="text" placeholder="L" value={productDetails.dimensions.length} onChange={handleNestedChange("dimensions", "length")} onInput={handleNumericInput} className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight w-1/3 ${errors.dimensions ? 'input-error' : ''}`} required={isFieldRequired('dimensions')} />
                                                             <input type="text" placeholder="W" value={productDetails.dimensions.width} onChange={handleNestedChange("dimensions", "width")} onInput={handleNumericInput} className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight w-1/3 ${errors.dimensions ? 'input-error' : ''}`} required={isFieldRequired('dimensions')} />
                                                             <input type="text" placeholder="H" value={productDetails.dimensions.height} onChange={handleNestedChange("dimensions", "height")} onInput={handleNumericInput} className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight w-1/3 ${errors.dimensions ? 'input-error' : ''}`} required={isFieldRequired('dimensions')} />
                                                         </div>
                                                         {errors.dimensions && <p className="text-red-500 text-xs mt-1">{errors.dimensions}</p>}
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
                                                         <input type="text" name="shelfLife" value={productDetails.shelfLife} onChange={handleChange} placeholder="e.g., 6 months, 1 year" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.shelfLife ? 'input-error' : ''}`} required={isFieldRequired('shelfLife')} />
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
                                                          <input type="text" name="batchNumber" value={productDetails.batchNumber} onChange={handleChange} placeholder="Enter batch number" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.batchNumber ? 'input-error' : ''}`} required={isFieldRequired('batchNumber')}/>
                                                          {errors.batchNumber && <p className="text-red-500 text-xs mt-1">{errors.batchNumber}</p>}
                                                     </div>
                                                 )}
                                             </div>
                                         )}
                                         {/* --- Importer Details (Conditional Rendering based on country AND category requirements) --- */}
                                         {showImporterFields && (
                                             <div className="pt-4 mt-4 border-t border-dashed border-gray-200 space-y-4">
                                                 <h4 className="text-md font-semibold text-whiteLight flex items-center gap-2"><Building className="w-5 h-5 text-newYellow"/> Importer Details</h4>
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
                                                          <textarea name="importerAddress" value={productDetails.importerAddress} onChange={handleChange} placeholder="Full address of the importer" className={`textarea textarea-bordered focus:textarea-focus bg-blackLight text-whiteLight ${errors.importerAddress ? 'textarea-error' : ''}`} rows="2" required={isFieldRequired('importerAddress')} maxLength={200}></textarea>
                                                          {errors.importerAddress && <p className="text-red-500 text-xs mt-1">{errors.importerAddress}</p>}
                                                          <p className="text-xs text-whiteHalf mt-1">Include country, state, city, pincode</p>
                                                     </div>
                                                  )}
                                             </div>
                                         )}
                                         {/* --- End Importer Details --- */}
                                     </div>
                                 </div>
                             )}


                             {/* Section: Compliance & Certifications */}
                             {(shouldRenderField('fssaiLicenseNo') || shouldRenderField('bisCertification') || shouldRenderField('eWasteCompliance') || shouldRenderField('recyclablePackaging')) && (
                                 <div className="p-5 bg-blackDark rounded-lg shadow-md ">
                                     <h3 className="text-lg font-semibold mb-4 flex items-center text-newYellow border-b pb-2 gap-2 border-whiteSecondary">
                                         <ShieldCheck className="w-5 h-5 text-newYellow" /> Compliance & Certifications {!productDetails.category || !productDetails.subcategory ? '(Select Category/Subcategory First)' : ''}
                                     </h3>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3"> {/* Use grid for better alignment */}
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
                                                 <input type="text" name="bisCertification" value={productDetails.bisCertification} onChange={handleChange} placeholder="Enter BIS number/details" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.bisCertification ? 'input-error' : ''}`} required={isFieldRequired('bisCertification')} />
                                                 {errors.bisCertification && <p className="text-red-500 text-xs mt-1">{errors.bisCertification}</p>}
                                             </div>
                                         )}
                                         {shouldRenderField('eWasteCompliance') && (
                                             <div className="form-control flex items-center pt-2 md:pt-6"> {/* Align checkbox vertically */}
                                                 <label className="label cursor-pointer justify-start gap-3 p-1">
                                                     <input 
                                                            type="checkbox" 
                                                            name="eWasteCompliance" 
                                                            checked={productDetails.eWasteCompliance} 
                                                            onChange={handleChange} 
                                                            className={`checkbox checkbox-sm ${
                                                                productDetails.eWasteCompliance ? 'checkbox-primary' : 'border-white'
                                                            }`} 
                                                        />
                                                     <span className="label-text font-medium text-whiteLight"> E-Waste Compliant{getLabelSuffix('eWasteCompliance')}</span>
                                                 </label>
                                                 {errors.eWasteCompliance && <p className="text-red-500 text-xs mt-1 w-full">{errors.eWasteCompliance}</p>}
                                             </div>
                                         )}
                                          {shouldRenderField('recyclablePackaging') && (
                                               <div className="form-control flex items-center pt-2 md:pt-6"> {/* Align checkbox vertically */}
                                                    <label className="label cursor-pointer justify-start gap-3 p-1">
                                                         <input type="checkbox" name="recyclablePackaging" checked={productDetails.recyclablePackaging} onChange={handleChange} className="checkbox checkbox-sm checkbox-primary" />
                                                         <span className="label-text font-medium text-gray-700 flex items-center gap-1"> <Recycle className="w-4 h-4 text-whiteLight"/> Recyclable Packaging{getLabelSuffix('recyclablePackaging')}</span>
                                                    </label>
                                                    {errors.recyclablePackaging && <p className="text-red-500 text-xs mt-1 w-full">{errors.recyclablePackaging}</p>}
                                               </div>
                                          )}
                                     </div>
                                 </div>
                             )}

                             {/* Section: Warranty & Returns */}
                             {(shouldRenderField('warranty') || shouldRenderField('returnPolicy')) && (
                                 <div className="p-5 bg-blackDark rounded-lg shadow-md ">
                                     <h3 className="text-lg font-semibold mb-4 flex items-center text-newYellow border-b pb-2 gap-2 border-whiteSecondary">
                                         {/* Changed icon to Info as Shield seems less relevant */}
                                        <Info className="w-5 h-5 text-newYellow" /> Warranty & Returns {!productDetails.category || !productDetails.subcategory ? '(Select Category/Subcategory First)' : ''}
                                     </h3>
                                     <div className="space-y-4">
                                         {shouldRenderField('warranty') && (
                                             <div className="form-control">
                                                 <label className="label cursor-pointer justify-start gap-3 p-1 mb-2">
                                                     <input 
                                                        type="checkbox" 
                                                        checked={productDetails.warranty.hasWarranty} 
                                                        onChange={handleNestedChange("warranty", "hasWarranty")} 
                                                        className={`toggle toggle-sm ${
                                                            productDetails.warranty.hasWarranty ? 'toggle-warning' : 'bg-white border-white'
                                                        }`} 
                                                    />
                                                     {/* Label indicates if the *field* is optional, not the warranty itself */}
                                                    <span className="label-text font-medium text-whiteLight">Has Warranty?{getLabelSuffix('warranty')}</span>
                                                 </label>
                                                 {productDetails.warranty.hasWarranty && (
                                                     <div className="pl-8"> {/* Indent duration input */}
                                                         <label className="label pb-1 pt-0"><span className="label-text font-medium flex items-center text-whiteLight">Warranty Duration <span className="text-red-500">&nbsp; *</span></span></label>
                                                         <input type="text" placeholder="Specify duration (e.g., 1 year, 6 months)" value={productDetails.warranty.duration} onChange={handleNestedChange("warranty", "duration")} className={`input input-bordered input-sm focus:input-focus bg-blackLight text-whiteLight w-full ${errors.warrantyDuration ? 'input-error' : ''}`} required={productDetails.warranty.hasWarranty} />
                                                         {errors.warrantyDuration && <p className="text-red-500 text-xs mt-1">{errors.warrantyDuration}</p>}
                                                     </div>
                                                 )}
                                             </div>
                                         )}
                                         {shouldRenderField('returnPolicy') && (
                                             <div className="form-control">
                                                 <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight">Return Policy Terms{getLabelSuffix('returnPolicy')} (Max 6)</span></label>
                                                 <div className="space-y-2">
                                                    
                                                     {productDetails.returnPolicy.length < 6 && (
                                                         <div className="flex gap-2">
                                                             <input type="text" value={returnPolicyInput} onChange={(e) => setReturnPolicyInput(e.target.value)} className="input input-bordered input-sm focus:input-focus bg-blackLight text-whiteLight flex-1" placeholder="Add term (e.g., 7-day return)" maxLength={150}/>
                                                             <button type="button" onClick={addReturnPolicy} className="btn btn-sm btn-ghost bg-newYellow text-blackDark px-3 cursor-pointer" disabled={!returnPolicyInput.trim() || productDetails.returnPolicy.length >= 6} aria-label="Add return policy term"><Plus className="w-4 h-4 mr-1" /> Add</button>
                                                         </div>
                                                     )}
                                                      <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem] p-2 bg-yellowHalf border border-gray-200 rounded-md">
                                                         {productDetails.returnPolicy.map((policy, index) => (
                                                             <div key={index} className="badge badge-outline badge-lg gap-2 pr-1 bg-whiteHalf font-bold border-gray-300">
                                                                 <span>{policy}</span>
                                                                 <button type="button" onClick={() => removeReturnPolicy(index)} className="text-red-500 bg-whiteLight hover:text-red-500 transition-colors" aria-label={`Remove policy: ${policy}`}><X className="w-3.5 h-3.5" /></button>
                                                             </div>
                                                         ))}
                                                         {productDetails.returnPolicy.length === 0 && <span className="text-xs text-whiteHalf italic">{isFieldRequired('returnPolicy') ? 'Add required return terms below.' : 'No return terms added yet.'}</span>}
                                                     </div>
                                                 </div>
                                                 {errors.returnPolicy && <p className="text-red-500 text-xs mt-1">{errors.returnPolicy}</p>}
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             )}

                        </div> 


                        {/* --- Sidebar Column (Right Side) --- */}
                        <div className="lg:col-span-1 space-y-6">
                             {/* Section: Settings & Visibility */}
                             <div className="p-5 bg-blackDark rounded-lg shadow-md">
                                  <h3 className="text-lg font-semibold text-newYellow mb-4 border-b pb-2 flex items-center gap-2 border-whiteSecondary"><Settings size={18} className="text-newYellow" /> Settings & Visibility</h3>
                                  <div className="space-y-4">
                                       {/* Allow Dropshipping */}
                                       {shouldRenderField('allowDropshipping') && ( // Only show if relevant for category
                                            <div className="form-control">
                                                <label className="label cursor-pointer justify-between p-0">
                                                     <span className="label-text font-medium text-whiteLight flex-grow mr-4">Allow Dropshipping?</span>
                                                     <input 
                                                        type="checkbox" 
                                                        name="allowDropshipping" 
                                                        checked={productDetails.allowDropshipping} 
                                                        onChange={handleChange} 
                                                        className={`toggle toggle-sm ${
                                                            productDetails.allowDropshipping ? 'toggle-warning' : 'bg-white border-white'
                                                        }`} 
                                                    />
                                                </label>
                                                <p className="text-xs text-whiteHalf pt-1">Enable if dropshippers can list this product.</p>
                                            </div>
                                       )}
                                       {/* Product Active (Considered Platform Required usually) */}
                                       {shouldRenderField('isActive') && ( // Only show if relevant for category (though usually always relevant)
                                            <div className="form-control">
                                                <label className="label cursor-pointer justify-between p-0">
                                                     {/* Usually isActive is not optional, treat as required unless mapping says otherwise */}
                                                    <span className="label-text font-medium text-whiteLight flex-grow mr-4">Product Active?{getLabelSuffix('isActive')}</span>
                                                    <input 
                                                        type="checkbox" 
                                                        name="isActive" 
                                                        checked={productDetails.isActive} 
                                                        onChange={handleChange} 
                                                        className={`toggle toggle-sm ${
                                                            productDetails.isActive ? 'toggle-warning' : 'bg-white border-white'
                                                        }`} 
                                                    />
                                                </label>
                                                <p className="text-xs text-whiteHalf pt-1">Uncheck to hide the product from your store.</p>
                                                {/* No typical error message needed unless backend enforces 'true' */}
                                            </div>
                                       )}
                                  </div>
                             </div>

                             {/* Section: Pricing (MRP, Selling Price always Required) */}
                             <div className="p-5 bg-blackDark rounded-lg shadow-md ">
                                 <h2 className="text-lg font-semibold text-newYellow mb-4 border-b pb-2 flex items-center gap-2 border-whiteSecondary"><IndianRupee className="w-5 h-5 text-newYellow" /> Pricing</h2>
                                 <div className="space-y-5">
                                     {/* Buy It Now Pricing */}
                                     <div className="bg-blackLight p-4 rounded-lg ">
                                         <h4 className="text-md font-medium text-newYellow mb-3 flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-newYellow" /> Buy It Now Price</h4>
                                         <div className="space-y-3">
                                             <div className="form-control w-full">
                                                 <label className="label pb-1"><span className="label-text font-medium text-whiteLight flex items-center">Actual Price (MRP) <span className="text-red-500">&nbsp; *</span></span></label>
                                                 <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span><input type="text" name="MRP" value={productDetails.MRP} onChange={handleNumericInput} onInput={handleNumericInput} className={`input input-bordered w-full pl-7 focus:input-focus bg-blackDark text-whiteLight ${errors.MRP ? 'input-error' : ''}`} placeholder="0.00" required /></div>
                                                 {errors.MRP && <p className="text-red-500 text-xs mt-1">{errors.MRP}</p>}
                                             </div>
                                             <div className="form-control w-full">
                                                 <label className="label pb-1"><span className="label-text font-medium text-whiteLight flex items-center">Selling Price <span className="text-red-500">&nbsp; *</span></span></label>
                                                 <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span><input type="text" name="productPrice" value={productDetails.productPrice} onChange={handleNumericInput} onInput={handleNumericInput} className={`input input-bordered w-full pl-7 focus:input-focus bg-blackDark text-whiteLight ${errors.productPrice ? 'input-error' : ''}`} placeholder="0.00" required /></div>
                                                 {errors.productPrice && <p className="text-red-500 text-xs mt-1">{errors.productPrice}</p>}
                                             </div>
                                             {/* Commission (Conditional on Dropshipping Toggle) */}
                                             {productDetails.allowDropshipping && (
                                                 <div className="form-control w-full">
                                                     <label className="label pb-1"><span className="label-text font-medium text-whiteLight flex items-center"><AiOutlinePercentage className="h-4 w-4 mr-2 text-newYellow" /> Commission (%) <span className="text-red-500">&nbsp; *</span></span></label>
                                                     <div className="relative">
                                                         <input type="text" name="commissionRate" value={productDetails.commissionRate} onChange={handleNumericInput} onInput={handleNumericInput} className={`input input-bordered w-full pr-8 focus:input-focus bg-blackDark text-whiteLight ${errors.commissionRate ? 'input-error' : ''}`} placeholder="e.g., 10" required={productDetails.allowDropshipping}/>
                                                         <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                                                     </div>
                                                     {errors.commissionRate && <p className="text-red-500 text-xs mt-1">{errors.commissionRate}</p>}
                                                 </div>
                                             )}
                                         </div>
                                     </div>
                                      {/* Auction Pricing (Optional Fields) */}
                                      <div className="bg-blackLight p-4 rounded-lg ">
                                           <h4 className="text-md font-medium text-newYellow mb-3 flex items-center gap-2"><Gavel className="h-5 w-5 text-newYellow" /> Auction Settings</h4>
                                           <div className="space-y-3">
                                                <div className="form-control w-full">
                                                    {/* These are inherently optional, no need for getLabelSuffix */}
                                                    <label className="label pb-1"><span className="label-text font-medium text-whiteLight flex items-center">Starting Bid Price</span></label>
                                                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span><input type="text" name="startingPrice" value={productDetails.startingPrice} onChange={handleNumericInput} onInput={handleNumericInput} className={`input input-bordered w-full pl-7 focus:input-focus bg-blackDark text-whiteLight ${errors.startingPrice ? 'input-error' : ''}`} placeholder="0.00"/></div>
                                                    {errors.startingPrice && <p className="text-red-500 text-xs mt-1">{errors.startingPrice}</p>}
                                                </div>
                                                <div className="form-control w-full">
                                                    {/* These are inherently optional, no need for getLabelSuffix */}
                                                    <label className="label pb-1"><span className="label-text font-medium text-whiteLight flex items-center">Reserved Price</span></label>
                                                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span><input type="text" name="reservedPrice" value={productDetails.reservedPrice} onChange={handleNumericInput} onInput={handleNumericInput} className={`input input-bordered w-full pl-7 focus:input-focus bg-blackDark text-whiteLight ${errors.reservedPrice ? 'input-error' : ''}`} placeholder="Min acceptable bid"/></div>
                                                    {errors.reservedPrice && <p className="text-red-500 text-xs mt-1">{errors.reservedPrice}</p>}
                                                    <div className="mt-2 text-xs text-gray-200 bg-yellowHalf p-2 rounded-md border-l-4 border-gray-300 flex items-center gap-2"><Info className="h-4 w-4 flex-shrink-0 text-gray-200"/><span>If bid is below this, item won't sell. Leave blank if no reserve.</span></div>
                                                </div>
                                           </div>
                                      </div>
                                 </div>
                             </div>

                             {/* Section: Shipping (Hazardous Materials - Always Required) */}
                             {/* Only render section if field exists in mapping, but treat as required */}
                             {(shouldRenderField('hazardousMaterials')) && (
                                  <div className="p-5 bg-blackDark rounded-lg shadow-md ">
                                       <h3 className="text-lg font-semibold mb-4 flex items-center text-newYellow border-b pb-2 gap-2 border-whiteSecondary"><Package className="w-5 h-5 text-newYellow" /> Shipping Considerations</h3>
                                       <div className="space-y-4">
                                            <div className="form-control w-full relative">
                                                 <label className="label pb-1"><span className="label-text font-medium text-whiteLight flex items-center"> Hazardous Materials <span className="text-red-500">&nbsp; *</span></span></label>
                                                 <select name="hazardousMaterials" value={productDetails.hazardousMaterials} onChange={handleChange} className={`select select-bordered w-full focus:select-focus bg-blackLight text-whiteLight appearance-none ${errors.hazardousMaterials ? 'select-error' : ''}`} required>
                                                     <option value="" disabled>Select hazard type or none</option><option value="no hazardous materials">No hazardous materials</option><option value="fragrances">Fragrances</option><option value="lithium batteries">Lithium batteries</option><option value="other hazardous materials">Other hazardous materials</option>
                                                 </select>
                                                 <FaChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 mt-1 pointer-events-none" />
                                                 {errors.hazardousMaterials && <p className="text-red-500 text-xs mt-1">{errors.hazardousMaterials}</p>}
                                                 {productDetails.hazardousMaterials && productDetails.hazardousMaterials !== "no hazardous materials" && <div className="mt-2 text-xs text-amber-800 bg-amber-100 p-2 rounded-md border-l-4 border-amber-400 flex items-center gap-2"><AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{getHazardousMessage(productDetails.hazardousMaterials)}</span></div>}
                                            </div>
                                       </div>
                                  </div>
                             )}

                             {/* Section: Seller Information (Always Required) */}
                             <div className="p-5 bg-blackDark rounded-lg shadow-md ">
                                 <h3 className="text-lg font-semibold mb-4 flex items-center text-newYellow border-b pb-2 gap-2 border-whiteSecondary"><UserCircle className="w-5 h-5 text-newYellow" /> Seller Information</h3>
                                 <div className="space-y-4">
                                     <div className="form-control w-full">
                                         <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight">Seller Name <span className="text-red-500">&nbsp; *</span></span></label>
                                         <input type="text" name="sellerName" value={productDetails.sellerName} onChange={handleChange} placeholder="Your registered seller name" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.sellerName ? 'input-error' : ''}`} />
                                         {errors.sellerName && <p className="text-red-500 text-xs mt-1">{errors.sellerName}</p>}
                                     </div>
                                     <div className="form-control w-full">
                                         <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><Phone className="w-4 h-4 mr-2 text-newYellow"/> Seller Contact <span className="text-red-500">&nbsp; *</span></span></label>
                                         <input type="tel" name="sellerContact" value={productDetails.sellerContact} onChange={handleTelInput} placeholder="Your contact number" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.sellerContact ? 'input-error' : ''}`} />
                                         {errors.sellerContact && <p className="text-red-500 text-xs mt-1">{errors.sellerContact}</p>}
                                     </div>
                                     <div className="form-control w-full">
                                         <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight"><FileText className="w-4 h-4 mr-2 text-newYellow"/> Seller GSTIN <span className="text-red-500">&nbsp; *</span></span></label>
                                         <input type="text" name="sellerGSTIN" value={productDetails.sellerGSTIN} onChange={(e) => handleChange({ target: { name: 'sellerGSTIN', value: e.target.value.toUpperCase() } })} placeholder="Your 15-digit GSTIN" className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight ${errors.sellerGSTIN ? 'input-error' : ''}`}  maxLength={15} />
                                         {errors.sellerGSTIN && <p className="text-red-500 text-xs mt-1">{errors.sellerGSTIN}</p>}
                                     </div>
                                      <div className="form-control w-full">
                                           <label className="label pb-1"><span className="label-text font-medium flex items-center text-whiteLight">GST Rate (%) <span className="text-red-500">&nbsp; *</span></span></label>
                                           <div className="relative">
                                                <input type="text" name="gstRate" value={productDetails.gstRate} onChange={handleNumericInput} onInput={handleNumericInput} className={`input input-bordered focus:input-focus bg-blackLight text-whiteLight w-full pr-8 ${errors.gstRate ? 'input-error' : ''}`} placeholder="e.g., 5, 12, 18"/>
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                                           </div>
                                           {errors.gstRate && <p className="text-red-500 text-xs mt-1">{errors.gstRate}</p>}
                                      </div>
                                 </div>
                             </div>

                        </div> {/* End Sidebar Column */}
                    </div> {/* End Main Grid Layout */}

                    {/* Submit Button */}
                    <div className="pt-8 flex justify-center border-t border-gray-300">
                        <button type="submit" disabled={submitting || uploadingImages} className={`btn btn-ghost btn-lg min-w-[240px] bg-newYellow hover:bg-blackDark text-blackDark font-bold rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 hover:text-newYellow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 disabled:bg-gray-400`}>
                            {submitting ? (<><span className="loading loading-spinner loading-sm mr-2"></span> Submitting...</>) : (<><FaPlus className="mr-2" /> Add Product</>)}
                        </button>
                    </div>
                </form>
                </div>
            </div>
        </div>
    );
};

export default LiveStreamProductForm;