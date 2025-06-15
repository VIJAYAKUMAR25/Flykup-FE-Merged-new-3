import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Hammer,
  Gift,
  ChevronDown,
  Trash,
  PlusCircle,
  Box,
  Package,
  Search,
  Filter,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  Boxes,
} from "lucide-react";
import { GET_PRODUCTS_BY_SELLER_ID } from "../../api/apiDetails";
import axiosInstance from "../../../utils/axiosInstance";

const cdnURL = import.meta.env.VITE_AWS_CDN_URL;

const ProductTab = ({ onSelectProducts }) => {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("buyNow");
  const [selectedProducts, setSelectedProducts] = useState({
    buyNow: [],
    auction: [],
    giveaway: [],
  });
  const [validationErrors, setValidationErrors] = useState({}); // For product-specific validation (prices, etc.)
  const [formErrors, setFormErrors] = useState({}); // For general form errors like subcategory

  const [submitStatus, setSubmitStatus] = useState({
    error: null,
    success: null,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [allCategories, setAllCategories] = useState([]);

  // Mock formData and currentCategoryObj for demonstration of subcategory dropdown.
  // In your actual app, these might come from props or other state management.
  const [formData, setFormData] = useState({
    category: "Electronics", // Example: a category is selected to enable subcategory dropdown
    subCategory: "",
  });
  const [currentCategoryObj, setCurrentCategoryObj] = useState({
    subcategories: [{ _id: "1", name: "Laptops" }, { _id: "2", name: "Smartphones" }, { _id: "3", name: "Tablets" }],
  });
  const isAnyLoading = false; // Example: assuming no loading state from external source

  // This handleChange is specifically for the subcategory dropdown example
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // You would typically add validation for subcategory here if it's required
    // For example:
    // if (name === "subCategory" && value === "") {
    //   setFormErrors(prev => ({ ...prev, subCategory: "Subcategory is required" }));
    // } else {
    //   setFormErrors(prev => { const newErrors = { ...prev }; delete newErrors.subCategory; return newErrors; });
    // }
  };


  const getValidationError = (tab, index, field) => {
    return validationErrors[`${tab}-${index}-${field}`];
  };

  const validateFields = () => {
    const errors = {}; // Local object to collect errors

    selectedProducts.buyNow.forEach((product, index) => {
      if (
        product.productPrice === "" ||
        isNaN(parseFloat(product.productPrice))
      ) {
        errors[`buyNow-${index}-price`] =
          "Price is required and must be a number";
      }
    });

    selectedProducts.auction.forEach((product, index) => {
      if (
        product.startingPrice === "" ||
        isNaN(parseFloat(product.startingPrice))
      ) {
        errors[`auction-${index}-starting`] =
          "Starting price is required and must be a number";
      }
      if (
        product.reservedPrice === "" ||
        isNaN(parseFloat(product.reservedPrice))
      ) {
        errors[`auction-${index}-reserved`] =
          "Reserved price is required and must be a number";
      }
    });

    // You can also add validation for the subcategory here if it's part of the overall submission validation
    // if (formData.category && formData.subCategory === "") {
    //   errors['subCategory'] = "Subcategory is required when a category is selected";
    // }

    setValidationErrors(errors); // Update the state with these product-specific errors
    // If you add subcategory validation here, you'd merge or use a separate state for it
    // setFormErrors(subcategoryErrors); // if subcategory errors are handled separately
    return Object.keys(errors).length === 0; // Only check product errors for now
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await axiosInstance.get(GET_PRODUCTS_BY_SELLER_ID);
      if (data.status) {
        setProducts(data?.data);
        const categories = [
          "All",
          ...new Set(data?.data.map((p) => p.category).filter(Boolean)),
        ];
        setAllCategories(categories);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setSubmitStatus({
        error: "Failed to fetch products. Please try again.",
        success: null,
      });
    }
  };

  const filterProducts = (prods) => {
    let filtered = prods.filter((product) => {
      const matchesSearch = product.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;

      const matchesStock = showOutOfStock ? true : product.quantity > 0;

      return matchesSearch && matchesCategory && matchesStock;
    });
    return filtered;
  };

  const getAvailableProducts = (tab) => {
    const allAvailable = products.filter(
      (product) =>
        !selectedProducts.buyNow.some((p) => p.productId === product._id) &&
        !selectedProducts.auction.some((p) => p.productId === product._id) &&
        !selectedProducts.giveaway.some((p) => p.productId === product._id)
    );
    return filterProducts(allAvailable);
  };

  const handleProductSelect = (tab, product) => {
    const newProduct = {
      productId: product._id,
      ...(tab === "buyNow" && {
        productPrice:
          product.productPrice !== undefined
            ? product.productPrice.toString()
            : "",
        title: product.title,
        images: product.images,
        quantity: product.quantity,
      }),
      ...(tab === "auction" && {
        startingPrice:
          product.startingPrice !== undefined
            ? product.startingPrice.toString()
            : "",
        reservedPrice:
          product.reservedPrice !== undefined
            ? product.reservedPrice.toString()
            : "",
        images: product.images,
        title: product.title,
        quantity: product.quantity,
      }),
      ...(tab === "giveaway" && {
        followersOnly: false,
        images: product.images,
        title: product.title,
        quantity: product.quantity,
      }),
    };

    setSelectedProducts((prev) => ({
      ...prev,
      [tab]: [...prev[tab], newProduct],
    }));
  };

  const handleProductRemove = (tab, productId) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [tab]: prev[tab].filter((p) => p.productId !== productId),
    }));
  };

  const handlePriceChange = (productId, field, value) => {
    setSelectedProducts((prev) => ({
      ...prev,
      auction: prev.auction.map((p) =>
        p.productId === productId ? { ...p, [field]: value } : p
      ),
      buyNow: prev.buyNow.map((p) =>
        p.productId === productId ? { ...p, [field]: value } : p
      ),
    }));
  };

  const handleGiveawayChange = (productId, followersOnly) => {
    setSelectedProducts((prev) => ({
      ...prev,
      giveaway: prev.giveaway.map((p) =>
        p.productId === productId ? { ...p, followersOnly } : p
      ),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitStatus({ error: null, success: null });
    if (!validateFields()) {
      setSubmitStatus({
        error: "Please correct the validation errors before confirming.",
        success: null,
      });
      return;
    }
    onSelectProducts(selectedProducts);
    setSubmitStatus({ success: "Products selection confirmed!", error: null });
  };

  const tabInfo = {
    buyNow: {
      label: "Buy Now",
      icon: ShoppingCart,
      activeColor: "bg-newYellow text-blackDark shadow-lg shadow-yellow-500/25",
      inactiveColor: "text-whiteLight bg-blackLight hover:text-blackDark hover:bg-amber-100",
    },
    auction: {
      label: "Auction",
      icon: Hammer,
      activeColor: "bg-newYellow text-blackDark shadow-lg shadow-yellow-500/25",
      inactiveColor: "text-whiteLight bg-blackLight hover:text-blackDark hover:bg-amber-100",
    },
    giveaway: {
      label: "Giveaway",
      icon: Gift,
      activeColor: "bg-newYellow text-blackDark shadow-lg shadow-yellow-500/25",
      inactiveColor: "text-whiteLight bg-blackLight hover:text-blackDark hover:bg-amber-100",
    },
  };

  const totalSelectedProducts =
    selectedProducts.buyNow.length +
    selectedProducts.auction.length +
    selectedProducts.giveaway.length;

  return (
    <div className="bg-blackDark rounded-box shadow-lg  overflow-x-hidden px-2"> {/* Added overflow-x-hidden */}
      <motion.div
        className="relative bg-yellowHalf rounded-2xl shadow-lg backdrop-blur-sm mb-3  py-2" // Added px-3 py-2 for consistent padding
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
      
        {/* Desktop Layout - Tabs and Filters side-by-side or stacked */}
        <div className="hidden lg:flex items-center justify-between gap-4 w-full"> {/* Added w-full */}
          <AnimatePresence>
            <div className="flex gap-2 min-w-0 flex-wrap"> {/* Added min-w-0 and flex-wrap */}
              {Object.keys(tabInfo).map((tab) => {
                const { icon: Icon, label, activeColor, inactiveColor } = tabInfo[tab];
                const isActive = activeTab === tab;
                const count = selectedProducts[tab].length;

                return (
                  <motion.button
                    key={tab}
                    className={`
                      relative flex items-center gap-3 px-6 py-3 rounded-xl font-medium text-sm
                      transition-all duration-300 ease-out
                      ${isActive ? activeColor : inactiveColor}
                      min-w-fit flex-shrink-0 {/* Added flex-shrink-0 to prevent shrinking */}
                    `}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(tab);
                      setSearchTerm("");
                      setSelectedCategory("All");
                      setShowOutOfStock(false);
                      setValidationErrors({});
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    layout
                  >
                    <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: isActive ? 360 : 0 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>

                    <span className="font-semibold whitespace-nowrap">
                      {label}
                    </span>

                    {count > 0 && (
                      <motion.div
                        className={`
                          px-2 py-1 rounded-full bg-red-500 text-whiteLight text-xs font-bold min-w-[1.5rem] text-center
                        `}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        {count}
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </AnimatePresence>
          {/* Filters and Search for Desktop */}
          <div className="flex items-center gap-4 min-w-0"> {/* Added min-w-0 */}
            <div className="form-control flex-grow"> {/* Added flex-grow */}
              <label className="input input-bordered flex items-center gap-2 bg-blackDark rounded-full border border-gray-600">
                <Search size={20} className="text-gray-500" />
                <input
                  type="text"
                  className="grow text-whiteLight bg-blackDark placeholder-whiteHalf focus:outline-none min-w-0" // Added min-w-0
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </label>
            </div>
            <div className="form-control flex-shrink-0"> {/* Added flex-shrink-0 */}
              
              <select
                className="select select-bordered focus:select-focus w-full bg-blackDark text-whiteLight rounded-full border border-gray-600 min-w-0" // Added min-w-0
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {allCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Tabs then Filters below */}
        <div className="lg:hidden">
          <div className="flex gap-2 overflow-x-auto py-2 justify-between px-3 scrollbar-hide mb-3">
            {Object.keys(tabInfo).map((tab) => {
              const { icon: Icon, label, activeColor, inactiveColor } = tabInfo[tab];
              const isActive = activeTab === tab;
              const count = selectedProducts[tab].length;

              return (
                <motion.button
                  key={tab}
                  className={`
                    relative flex items-center gap-1 px-4 py-2 rounded-xl
                    transition-all duration-300 ease-out min-w-[80px] flex-shrink-0
                    ${isActive ? activeColor : inactiveColor}
                  `}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(tab);
                    setSearchTerm("");
                    setSelectedCategory("All");
                    setShowOutOfStock(false);
                    setValidationErrors({});
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="relative"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: isActive ? 360 : 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <Icon className="w-5 h-5" />
                    {count > 0 && (
                      <motion.div
                        className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        {count > 9 ? '9+' : count}
                      </motion.div>
                    )}
                  </motion.div>

                  <span className="text-xs font-medium whitespace-nowrap">
                    {label}
                  </span>
                </motion.button>
              );
            })}
          </div>
          {/* Filters and Search for Mobile - below the tabs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full px-3">
            <div className="form-control w-full sm:w-auto flex-grow"> {/* Added flex-grow */}
             
              <label className="input input-bordered flex items-center gap-2 bg-blackDark rounded-lg border border-gray-600">
                <Search size={20} className="text-gray-500" />
                <input
                  type="text"
                  className="grow text-whiteLight bg-blackDark placeholder-whiteHalf focus:outline-none min-w-0" // Added min-w-0
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </label>
            </div>
            <div className="form-control w-full sm:w-auto flex-shrink-0"> {/* Added flex-shrink-0 */}
              <select
                className="select select-bordered focus:select-focus w-full bg-blackDark text-whiteLight rounded-lg border border-gray-600 min-w-0" // Added min-w-0
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {allCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </motion.div>

    

      {/* Tab Content */}
      <div>
        {activeTab === "buyNow" && (
          <ProductTabContent
            products={getAvailableProducts("buyNow")}
            selected={selectedProducts.buyNow}
            onSelect={(product) => handleProductSelect("buyNow", product)}
            onRemove={(productId) => handleProductRemove("buyNow", productId)}
            onChange={handlePriceChange}
            validationErrors={validationErrors}
            getValidationError={getValidationError}
            type="buyNow"
            cdnURL={cdnURL}
          />
        )}

        {activeTab === "auction" && (
          <AuctionTabContent
            products={getAvailableProducts("auction")}
            selected={selectedProducts.auction}
            onSelect={(product) => handleProductSelect("auction", product)}
            onRemove={(productId) => handleProductRemove("auction", productId)}
            onChange={handlePriceChange}
            validationErrors={validationErrors}
            getValidationError={getValidationError}
            cdnURL={cdnURL}
          />
        )}

        {activeTab === "giveaway" && (
          <GiveawayTabContent
            products={getAvailableProducts("giveaway")}
            selected={selectedProducts.giveaway}
            onSelect={(product) => handleProductSelect("giveaway", product)}
            onRemove={(productId) => handleProductRemove("giveaway", productId)}
            onChange={handleGiveawayChange}
            cdnURL={cdnURL}
          />
        )}
      </div>
  {/* Submission Status */}
      {submitStatus.error && (
        <div role="alert" className="alert alert-error rounded-full shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{submitStatus.error}</span>
        </div>
      )}
      {submitStatus.success && (
        <div role="alert" className="alert alert-success rounded-full shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{submitStatus.success}</span>
        </div>
      )}
      <button
        className="btn btn-ghost bg-newYellow hover:bg-blackDark hover:text-newYellow text-blackDark font-bold mt-1 w-full py-3 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        onClick={handleSubmit}
      >
        Confirm Selection ({totalSelectedProducts} )
      </button>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e0;
          border-radius: 10px;
          border: 2px solid #f1f1f1;
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f7fafc;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

const ProductTabContent = ({
  products,
  selected,
  onSelect,
  onRemove,
  onChange,
  type,
  validationErrors,
  getValidationError,
  cdnURL,
}) => {
  return (
    <div className="container mx-auto space-y-2">
      {/* Available Products Section */}
      <div className="card bg-blackDark shadow-xl border ">
        <div className="card-body p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="card-title text-2xl font-extrabold text-whiteLight flex items-center gap-3">
              <PlusCircle className="w-6 h-6 text-newYellow" />
              Available Products for {type === "buyNow" ? "Buy Now" : "Listing"}
            </h2>
          </div>
          <div
            className="overflow-x-auto overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#CBD5E0 #F7FAFC",
            }}
          >
            {products.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-lg">
                <p>No available products matching your criteria.</p>
                <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              <table className="table w-full">
                <thead className="sticky top-0 bg-newYellow z-10 shadow-sm">
                  <tr className="text-blackDark">
                    <th>#</th>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Stock</th>
                    {type === "buyNow" && <th>Original Price</th>}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr
                      key={product._id}
                      className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <img
                              src={
                                product?.images[0]?.key
                                  ? `${cdnURL}${product.images[0].key}`
                                  : "/placeholder-image.png"
                              }
                              alt={product?.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[180px] text-whiteLight font-medium">
                        <div className="truncate" title={product.title}>
                          {product.title}
                        </div>
                      </td>
                      <td>
                        <div className={`flex items-center gap-2 ${product.quantity <= 0 ? 'text-error font-semibold' : 'text-success font-semibold'}`}>
                          <Package className="w-5 h-5" />
                          <span>{product.quantity}</span>
                        </div>
                      </td>
                      {type === "buyNow" && (
                        <td>
                          <span className="text-whiteLight font-medium">
                            ₹ {product.productPrice || "N/A"}
                          </span>
                        </td>
                      )}
                      <td>
                       <button
                          onClick={(e) => {
                            e.preventDefault();
                            onSelect(product);
                          }}
                          className="btn btn-circle btn-sm bg-greenLight text-blackDark shadow-lg hover:from-green-600 hover:to-green-800 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
                          data-tip="Select Product"
                          aria-label="Select Product"
                          title="Select Product"
                        >
                          <PlusCircle size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Selected Products Section */}
      {selected.length > 0 && (
        <div className="card bg-blackLight shadow-xl border border-gray-200 mt-6">
          <div className="card-body p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="card-title text-2xl font-extrabold text-whiteLight flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-newYellow" />
                Your Selected Products
              </h2>
            </div>
            <div
              className="overflow-x-auto overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#CBD5E0 #F7FAFC",
              }}
            >
              <table className="table  w-full">
                <thead className="sticky top-0 bg-newYellow z-10 shadow-sm">
                  <tr className="text-blackDark">
                    <th>#</th>
                    <th>Image</th>
                    <th>Title</th>
                    {type === "buyNow" && <th>Set Price</th>}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((product, index) => (
                    <tr
                      key={product.productId}
                         className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <img
                              src={
                                product?.images[0]?.key
                                  ? `${cdnURL}${product.images[0].key}`
                                  : "/placeholder-image.png"
                              }
                              alt={product?.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[180px] text-whiteLight font-medium">
                        <div className="truncate" title={product.title}>
                          {product.title}
                        </div>
                      </td>
                      {type === "buyNow" && (
                        <td>
                          <label className="form-control w-full max-w-xs">
                            <input
                              type="text"
                              value={product.productPrice}
                              onChange={(e) =>
                                onChange(
                                  product.productId,
                                  "productPrice",
                                  e.target.value
                                )
                              }
                              className={`input input-bordered text-whiteLight rounded-full font-bold bg-blackDark w-[100px] ${
                                getValidationError("buyNow", index, "price")
                                  ? "input-error"
                                  : ""
                              }`}
                              placeholder="Enter Price"
                            />
                            {getValidationError("buyNow", index, "price") && (
                              <div className="label">
                                <span className="label-text-alt text-error">
                                  {getValidationError(
                                    "buyNow",
                                    index,
                                    "price"
                                  )}
                                </span>
                              </div>
                            )}
                          </label>
                        </td>
                      )}
                      <td>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onRemove(product.productId);
                          }}
                          className="btn btn-circle btn-sm bg-red-500 text-whiteLight shadow-lg hover:from-green-600 hover:to-green-800 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
                          data-tip="Remove Product"
                          aria-label="Remove Product"
                          title="Remove Product"
                        >
                          <Trash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AuctionTabContent = ({
  products,
  selected,
  onSelect,
  onRemove,
  onChange,
  validationErrors,
  getValidationError,
  cdnURL,
}) => {
  return (
    <div className="container mx-auto space-y-4">
      {/* Available Products Section */}
      <div className="card bg-blackDark shadow-xl border ">
        <div className="card-body p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="card-title text-2xl font-extrabold text-whiteLight flex items-center gap-3">
              <PlusCircle className="w-6 h-6 text-newYellow" />
              Available Products for Auction
            </h2>
          </div>
          <div
            className="overflow-x-auto overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#CBD5E0 #F7FAFC",
            }}
          >
            {products.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-lg">
                <p>No available products for auction matching your criteria.</p>
                <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              <table className="table w-full">
                <thead className="sticky top-0 bg-newYellow z-10 shadow-sm">
                  <tr className="text-blackDark">
                    <th>#</th>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Original Start Price</th>
                    <th>Original Reserve Price</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr
                      key={product._id}
                      className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <img
                              src={
                                product?.images[0]?.key
                                  ? `${cdnURL}${product.images[0].key}`
                                  : "/placeholder-image.png"
                              }
                              alt={product?.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[150px] text-whiteLight font-medium">
                        <div className="truncate" title={product.title}>
                          {product.title}
                        </div>
                      </td>
                      <td className="text-whiteLight font-semibold">
                        ₹ {product.startingPrice || "N/A"}
                      </td>
                      <td className="text-whiteLight font-semibold">
                        ₹ {product.reservedPrice || "N/A"}
                      </td>
                      <td>
                        <div className={`flex items-center gap-2 ${product.quantity <= 0 ? 'text-error font-semibold' : 'text-success font-semibold'}`}>
                          <Package className="w-5 h-5" />
                          <span>{product.quantity}</span>
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onSelect(product);
                          }}
                          className="btn btn-circle btn-sm bg-greenLight text-blackDark shadow-lg hover:from-green-600 hover:to-green-800 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
                          data-tip="Select Product"
                          aria-label="Select Product"
                          title="Select Product"
                        >
                          <PlusCircle size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Selected Products Section */}
      {selected.length > 0 && (
        <div className="card bg-blackLight shadow-xl border border-gray-200 mt-6">
          <div className="card-body p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="card-title text-2xl font-extrabold text-whiteLight flex items-center gap-3">
                <Hammer className="w-6 h-6 text-newYellow" />
                Your Selected Auction Products
              </h2>
            </div>
            <div
              className="overflow-x-auto overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#CBD5E0 #F7FAFC",
              }}
            >
              <table className="table w-full">
                <thead className="sticky top-0 bg-newYellow z-10 shadow-sm">
                  <tr className="text-blackDark">
                    <th>#</th>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Set Start Price</th>
                    <th>Set Reserve Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((product, index) => (
                    <tr
                      key={product.productId}
                      className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <img
  src={
    product.images && product.images.length > 0 && product.images[0].key
      ? `${cdnURL}${product.images[0].key}`
      : "/placeholder-image.png"
  }
  alt={product?.title}
  className="w-full h-full object-cover"
/>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[180px] text-whiteLight font-medium">
                        <div className="truncate" title={product.title}>
                          {product.title}
                        </div>
                      </td>
                      <td>
                        <label className="form-control w-full max-w-xs">
                          <input
                            type="text"
                            value={product.startingPrice}
                            onChange={(e) =>
                              onChange(
                                product.productId,
                                "startingPrice",
                                e.target.value
                              )
                            }
                            className={`input input-bordered text-primaryBlack rounded-full font-bold bg-blackDark text-whiteLight w-[100px] ${
                              getValidationError("auction", index, "starting")
                                ? "input-error"
                                : ""
                            }`}
                            placeholder="Start Price"
                          />
                          {getValidationError(
                            "auction",
                            index,
                            "starting"
                          ) && (
                            <div className="label">
                              <span className="label-text-alt text-error">
                                {getValidationError(
                                  "auction",
                                  index,
                                  "starting"
                                )}
                              </span>
                            </div>
                          )}
                        </label>
                      </td>
                      <td>
                        <label className="form-control w-full max-w-xs">
                          <input
                            type="text"
                            value={product.reservedPrice}
                            onChange={(e) =>
                              onChange(
                                product.productId,
                                "reservedPrice",
                                e.target.value
                              )
                            }
                            className={`input input-bordered rounded-full text-whiteLight font-bold bg-blackDark w-[100px] ${
                              getValidationError("auction", index, "reserved")
                                ? "input-error"
                                : ""
                            }`}
                            placeholder="Reserve Price"
                          />
                          {getValidationError(
                            "auction",
                            index,
                            "reserved"
                          ) && (
                            <div className="label">
                              <span className="label-text-alt text-error">
                                {getValidationError(
                                  "auction",
                                  index,
                                  "reserved"
                                )}
                              </span>
                            </div>
                          )}
                        </label>
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onRemove(product.productId);
                          }}
                          className="btn btn-circle btn-sm bg-red-500 text-whiteLight shadow-lg hover:from-green-600 hover:to-green-800 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
                          data-tip="Remove Product"
                          aria-label="Remove Product"
                          title="Remove Product"
                        >
                          <Trash size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GiveawayTabContent = ({
  products,
  selected,
  onSelect,
  onRemove,
  onChange,
  cdnURL,
}) => {
  return (
    <div className="container mx-auto space-y-4">
      {/* Available Products Section */}
      <div className="card bg-blackDark shadow-xl border ">
        <div className="card-body p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="card-title text-2xl font-extrabold text-whiteLight flex items-center gap-3">
              <PlusCircle className="w-6 h-6 text-newYellow" />
              Available Products for Giveaway
            </h2>
          </div>

          <div
            className="overflow-x-auto overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#CBD5E0 #F7FAFC",
            }}
          >
            {products.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-lg">
                <p>No available products for giveaway matching your criteria.</p>
                <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              <table className="table w-full">
                <thead className="sticky top-0 bg-newYellow z-10 shadow-sm">
                  <tr className="text-blackDark">
                    <th>#</th>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr
                      key={product._id}
                      className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <img
                              src={
                                product?.images[0]?.key
                                  ? `${cdnURL}${product.images[0].key}`
                                  : "/placeholder-image.png"
                              }
                              alt={product?.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[180px] text-whiteLight font-medium">
                        <div className="truncate" title={product.title}>
                          {product.title}
                        </div>
                      </td>
                      <td>
                        <div className={`flex items-center gap-2 ${product.quantity <= 0 ? 'text-error font-semibold' : 'text-success font-semibold'}`}>
                          <Package className="w-5 h-5" />
                          <span>{product.quantity}</span>
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onSelect(product);
                          }}
                          className="btn btn-circle btn-sm bg-greenLight text-blackDark shadow-lg hover:from-green-600 hover:to-green-800 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
                          data-tip="Select Product"
                          aria-label="Select Product"
                          title="Select Product"
                        >
                          <PlusCircle size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Selected Products Section */}
      {selected.length > 0 && (
        <div className="card bg-blackLight shadow-xl border border-gray-200 mt-6">
          <div className="card-body p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="card-title text-2xl font-extrabold text-whiteLight flex items-center gap-3">
                <Gift className="w-6 h-6 text-newYellow" />
                Your Selected Giveaway Products
              </h2>
            </div>
            <div
              className="overflow-x-auto overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#CBD5E0 #F7FAFC",
              }}
            >
              <table className="table w-full">
                <thead className="sticky top-0 bg-newYellow z-10 shadow-sm">
                  <tr className="text-blackDark">
                    <th>#</th>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Followers Only</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((product, index) => (
                    <tr
                      key={product.productId}
                      className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <img
                              src={
                                product?.images[0]?.key
                                  ? `${cdnURL}${product.images[0].key}`
                                  : "/placeholder-image.png"
                              }
                              alt={product?.title}
                              className="w-full h-full object-full"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[180px] text-whiteLight font-medium">
                        <div className="truncate" title={product.title}>
                          {product.title}
                        </div>
                      </td>
                      <td>
                        <label className="label cursor-pointer bg-whiteHalf rounded-full justify-center">
                          <input
                            type="checkbox"
                            checked={product.followersOnly}
                            onChange={(e) =>
                              onChange(product.productId, e.target.checked)
                            }
                            className="toggle toggle-warning toggle-md"
                          />
                        </label>
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onRemove(product.productId);
                          }}
                          className="btn btn-circle btn-sm bg-red-500 text-whiteLight shadow-lg hover:from-green-600 hover:to-green-800 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
                          data-tip="Remove Product"
                          aria-label="Remove Product"
                          title="Remove Product"
                        >
                          <Trash size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTab;