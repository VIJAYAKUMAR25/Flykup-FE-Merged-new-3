import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Trash2, ChevronLeft, ShoppingCart, Hammer, Gift, PlusCircle, Package, Search } from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../../../utils/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";

import {
  GET_PRODUCTS_BY_SELLER_ID,
  GET_SHOW_BY_ID,
  UPDATE_TAGGED_PRODUCTS,
} from "../../api/apiDetails";

const CDN_BASE_URL = import.meta.env.VITE_AWS_CDN_URL;

const EditTaggedProducts = () => {
  const location = useLocation();
  const showId = location.state || "";
  const [products, setProducts] = useState([]);
  const [show, setShow] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState({
    buyNow: [],
    auction: [],
    giveaway: [],
  });
  const [activeTab, setActiveTab] = useState("buyNow");
  const [validationErrors, setValidationErrors] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingShow, setLoadingShow] = useState(true); 
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [allCategories, setAllCategories] = useState([]);

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

  // Fetch seller products
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await axiosInstance.get(GET_PRODUCTS_BY_SELLER_ID);
      if (res.data.status) {
        setProducts(res.data.data);
        const categories = [
          "All",
          ...new Set(res.data.data.map((p) => p.category).filter(Boolean)),
        ];
        setAllCategories(categories);
      }
    } catch (err) {
      console.error("Error fetching products:", err.message);
      toast.error("Failed to fetch products. Please try again.");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch show details (which contains the pre-selected arrays)
  const fetchShow = async () => {
    setLoadingShow(true);
    try {
      const res = await axiosInstance.get(`${GET_SHOW_BY_ID}/${showId}`);
      if (res.data.status) {
        setShow(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching show:", err.message);
      toast.error("Failed to fetch show details. Please try again.");
    } finally {
      setLoadingShow(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (showId) {
      fetchShow();
    }
  }, [showId]);

  // Once show is fetched, initialize selectedProducts from its arrays
  useEffect(() => {
    if (show) {
      setSelectedProducts({
        buyNow: show.buyNowProducts || [],
        auction: show.auctionProducts || [],
        giveaway: show.giveawayProducts || [],
      });
    }
  }, [show]);

  // Filter products based on search term and category
  const filterAndGetAvailableProducts = () => {
    const selectedIds = new Set([
      ...selectedProducts.buyNow.map((item) => String(item.productId)),
      ...selectedProducts.auction.map((item) => String(item.productId)),
      ...selectedProducts.giveaway.map((item) => String(item.productId)),
    ]);

    let available = products.filter(
      (product) => !selectedIds.has(String(product._id))
    );

    // Apply search term filter
    available = available.filter((product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply category filter
    if (selectedCategory !== "All") {
      available = available.filter(
        (product) => product.category === selectedCategory
      );
    }

    return available;
  };

  // --- Handlers for selecting and removing products ---
  const handleProductSelect = (tab, product) => {
    let newProduct;
    if (tab === "buyNow") {
      newProduct = {
        productId: product._id,
        productPrice: product.productPrice ? String(product.productPrice) : "",
        title: product.title,
        images: product.images,
        quantity: product.quantity,
      };
    } else if (tab === "auction") {
      newProduct = {
        productId: product._id,
        startingPrice: product.startingPrice
          ? String(product.startingPrice)
          : "",
        reservedPrice: product.reservedPrice
          ? String(product.reservedPrice)
          : "",
        title: product.title,
        images: product.images,
        quantity: product.quantity,
      };
    } else if (tab === "giveaway") {
      newProduct = {
        productId: product._id,
        followersOnly: false,
        title: product.title,
        images: product.images,
        quantity: product.quantity,
      };
    }
    setSelectedProducts((prev) => ({
      ...prev,
      [tab]: [...prev[tab], newProduct],
    }));
  };

  const handleProductRemove = (tab, productId) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [tab]: prev[tab].filter((item) => item.productId !== productId),
    }));
  };

  const handleAuctionChange = (productId, field, value) => {
    setSelectedProducts((prev) => ({
      ...prev,
      auction: prev.auction.map((item) =>
        item.productId === productId
          ? { ...item, [field]: value === "" ? "" : value }
          : item
      ),
    }));
  };

  const handleGiveawayChange = (productId, followersOnly) => {
    setSelectedProducts((prev) => ({
      ...prev,
      giveaway: prev.giveaway.map((item) =>
        item.productId === productId ? { ...item, followersOnly } : item
      ),
    }));
  };

  const validateFields = () => {
    const errors = {};

    selectedProducts.buyNow.forEach((item, index) => {
      if (!item.productPrice || isNaN(parseFloat(item.productPrice))) {
        errors[`buyNow-${index}-price`] = true;
      }
    });
    selectedProducts.auction.forEach((item, index) => {
      if (!item.startingPrice || isNaN(parseFloat(item.startingPrice))) {
        errors[`auction-${index}-starting`] = true;
      }
      if (!item.reservedPrice || isNaN(parseFloat(item.reservedPrice))) {
        errors[`auction-${index}-reserved`] = true;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) {
      toast.error("Please correct the validation errors.");
      return;
    }

    const payload = {
      buyNowProducts: selectedProducts.buyNow.map(p => ({
        ...p,
        productPrice: parseFloat(p.productPrice)
      })),
      auctionProducts: selectedProducts.auction.map(p => ({
        ...p,
        startingPrice: parseFloat(p.startingPrice),
        reservedPrice: parseFloat(p.reservedPrice)
      })),
      giveawayProducts: selectedProducts.giveaway,
    };

    try {
      setSubmitLoading(true);
      const res = await axiosInstance.put(
        `${UPDATE_TAGGED_PRODUCTS}/${showId}`,
        payload
      );
      if (res.data.status) {
        toast.success("Tagged products updated successfully!");
        setTimeout(() => navigate("/seller/allShows"), 1000);
      }
    } catch (err) {
      console.error("Error updating show:", err.message);
      toast.error("Failed to update products. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const totalSelectedProducts =
    selectedProducts.buyNow.length +
    selectedProducts.auction.length +
    selectedProducts.giveaway.length;

  if (loadingProducts || loadingShow) {
    return (
      <div className="flex justify-center items-center h-screen bg-blackDark">
        <span className="loading loading-spinner loading-lg text-newYellow"></span>
      </div>
    );
  }

  return (
    // OUTMOST CONTAINER: Ensure it takes full width and hides overflow
    <div className="w-full min-h-screen bg-blackDark text-whiteLight overflow-x-hidden"> {/* Added w-full and min-h-screen, confirmed overflow-x-hidden */}
      <div className="p-4 rounded-box shadow-lg"> {/* Inner padding */}
        {/* Back Button and Page Title */}
        <div className="flex items-center justify-between mb-4">
          <button
            className="btn btn-sm bg-gray-700 text-whiteLight flex items-center hover:bg-newYellow hover:text-blackDark border-none rounded-full px-4 py-2"
            onClick={() => setShowModal(true)}
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          {/* Ensure the title doesn't force overflow by itself */}
          <h2 className="text-2xl font-bold text-center flex-grow truncate">Edit Show Products</h2> {/* Added truncate */}
        </div>

        {/* Unified Tabs and Filters */}
        <motion.div
          className="relative bg-yellowHalf rounded-2xl shadow-lg backdrop-blur-sm mb-6 py-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Desktop Layout - Tabs and Filters side-by-side or stacked */}
          <div className="hidden lg:flex items-center justify-between gap-4 w-full px-3">
            <AnimatePresence>
              <div className="flex gap-2 min-w-0 flex-wrap">
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
                        min-w-fit flex-shrink-0
                      `}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab(tab);
                        setValidationErrors({});
                        setSearchTerm("");
                        setSelectedCategory("All");
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
            <div className="flex items-center gap-4 min-w-0">
              <div className="form-control flex-grow">
                <label className="input input-bordered flex items-center gap-2 bg-blackDark rounded-full border border-gray-600">
                  <Search size={20} className="text-gray-500" />
                  <input
                    type="text"
                    className="grow text-whiteLight bg-blackDark placeholder-whiteHalf focus:outline-none min-w-0"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </label>
              </div>
              <div className="form-control flex-shrink-0">
                <select
                  className="select select-bordered focus:select-focus w-full bg-blackDark text-whiteLight rounded-full border border-gray-600 min-w-0"
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
                      setValidationErrors({});
                      setSearchTerm("");
                      setSelectedCategory("All");
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
              <div className="form-control w-full sm:w-auto flex-grow">
                <label className="input input-bordered flex items-center gap-2 bg-blackDark rounded-lg border border-gray-600">
                  <Search size={20} className="text-gray-500" />
                  <input
                    type="text"
                    className="grow text-whiteLight bg-blackDark placeholder-whiteHalf focus:outline-none min-w-0"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </label>
              </div>
              <div className="form-control w-full sm:w-auto flex-shrink-0">
                <select
                  className="select select-bordered focus:select-focus w-full bg-blackDark text-whiteLight rounded-lg border border-gray-600 min-w-0"
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
        <div className="mt-6">
          {activeTab === "buyNow" && (
            <BuyNowTabContent
              availableProducts={filterAndGetAvailableProducts()}
              selected={selectedProducts.buyNow}
              onSelect={(product) => handleProductSelect("buyNow", product)}
              onRemove={(id) => handleProductRemove("buyNow", id)}
              onChange={(id, field, value) =>
                setSelectedProducts((prev) => ({
                  ...prev,
                  buyNow: prev.buyNow.map((item) =>
                    item.productId === id
                      ? { ...item, productPrice: value }
                      : item
                  ),
                }))
              }
              validationErrors={validationErrors}
              getValidationError={(tab, index, field) =>
                validationErrors[`${tab}-${index}-${field}`]
              }
            />
          )}
          {activeTab === "auction" && (
            <AuctionTabContent
              availableProducts={filterAndGetAvailableProducts()}
              selected={selectedProducts.auction}
              onSelect={(product) => handleProductSelect("auction", product)}
              onRemove={(id) => handleProductRemove("auction", id)}
              onChange={handleAuctionChange}
              validationErrors={validationErrors}
              getValidationError={(tab, index, field) =>
                validationErrors[`${tab}-${index}-${field}`]
              }
            />
          )}
          {activeTab === "giveaway" && (
            <GiveawayTabContent
              availableProducts={filterAndGetAvailableProducts()}
              selected={selectedProducts.giveaway}
              onSelect={(product) => handleProductSelect("giveaway", product)}
              onRemove={(id) => handleProductRemove("giveaway", id)}
              onChange={handleGiveawayChange}
            />
          )}
        </div>

        {/* Update Button */}
        <div className="justify-center flex mt-8">
          <button
            className="btn btn-ghost bg-newYellow hover:bg-blackLight hover:text-newYellow text-blackDark font-bold w-full py-3 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={handleSubmit}
            disabled={submitLoading}
          >
            {submitLoading && (
              <span className="loading loading-spinner loading-sm mr-2 text-gray-800"></span>
            )}
            Update Show Products ({totalSelectedProducts})
          </button>
        </div>

        {/* Modal for Back Confirmation */}
        {showModal && (
          <div className="modal modal-open bg-blackDark bg-opacity-70">
            <div className="modal-box bg-whiteLight text-blackDark p-6 rounded-lg shadow-2xl">
              <h3 className="font-bold text-xl mb-4">Discard changes?</h3>
              <p className="text-lg mb-6">
                Are you sure you want to discard your changes and go back?
              </p>
              <div className="modal-action flex justify-end gap-3">
                <button
                  className="btn btn-lg bg-gray-300 text-blackDark hover:bg-gray-400 border-none rounded-full font-semibold"
                  onClick={() => setShowModal(false)}
                >
                  No
                </button>
                <button
                  className="btn btn-lg bg-red-600 text-whiteLight hover:bg-red-700 border-none rounded-full font-semibold"
                  onClick={() => navigate("/seller/allShows")}
                >
                  Yes, Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div> {/* End of inner padding div */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #333; /* Darker track for dark theme */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #555; /* Darker thumb */
          border-radius: 10px;
          border: 2px solid #333;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #555 #333;
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

// ======================= Internal Components (No changes needed, they use `w-full` for tables inside `overflow-x-auto`) =======================

// Buy Now Tab Content
const BuyNowTabContent = ({
  availableProducts,
  selected,
  onSelect,
  onRemove,
  onChange,
  validationErrors,
  getValidationError,
}) => {
  return (
    <div className="space-y-4">
      {/* Available To Select BuyNow Section */}
      <div className="card bg-blackDark shadow-xl border ">
        <div className="card-body p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="card-title text-2xl font-extrabold text-whiteLight flex items-center gap-3">
              <PlusCircle className="w-6 h-6 text-newYellow" />
              Available Products ({availableProducts.length})
            </h2>
          </div>
          <div
            className="overflow-x-auto overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
          >
            {availableProducts.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-lg">
                <p>No available products to select.</p>
                <p className="text-sm mt-1">
                  Try adjusting your filters or search term.
                </p>
              </div>
            ) : (
              <table className="table w-full">
                <thead className="sticky top-0 bg-newYellow z-10 shadow-sm">
                  <tr className="text-blackDark">
                    <th>#</th>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availableProducts.map((product, index) => (
                    <tr
                      key={product._id}
                      className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <img
                              src={product.images && product.images[0] && product.images[0].key ? `${CDN_BASE_URL}${product.images[0].key}` : "/placeholder-image.png"}
                              alt={product?.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[180px] text-whiteLight font-medium">
                        <div className="truncate" title={product.title}>{product.title}</div>
                      </td>
                      <td>
                        <div className={`flex items-center gap-2 ${product.quantity <= 0 ? 'text-error font-semibold' : 'text-success font-semibold'}`}>
                            <Package className="w-5 h-5" />
                            <span>{product.quantity}</span>
                        </div>
                      </td>
                      <td>₹ {product.productPrice || "-"}</td>
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
                Your Selected Products ({selected.length})
              </h2>
            </div>
            <div
              className="overflow-x-auto overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
            >
              <table className="table w-full">
                <thead className="sticky top-0 bg-newYellow z-10 shadow-sm">
                  <tr className="text-blackDark">
                    <th>#</th>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Set Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((item, index) => (
                    <tr
                      key={item.productId}
                      className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <img
                              src={item.images && item.images[0] && item.images[0].key ? `${CDN_BASE_URL}${item.images[0].key}` : "/placeholder-image.png"}
                              alt={item?.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[180px] text-whiteLight font-medium">
                        <div className="truncate" title={item.title}>{item.title}</div>
                      </td>
                      <td>
                        <label className="form-control w-full max-w-xs">
                          <input
                            type="text"
                            value={item.productPrice}
                            onChange={(e) =>
                              onChange(
                                item.productId,
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
                                Price is required and must be a number
                              </span>
                            </div>
                          )}
                        </label>
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onRemove(item.productId);
                          }}
                          className="btn btn-circle btn-sm bg-red-500 text-whiteLight shadow-lg hover:from-red-600 hover:to-red-800 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
                          data-tip="Remove Product"
                          aria-label="Remove Product"
                          title="Remove Product"
                        >
                          <Trash2 size={16} />
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

// Auction Tab Content
const AuctionTabContent = ({
  availableProducts,
  selected,
  onSelect,
  onRemove,
  onChange,
  validationErrors,
  getValidationError,
}) => {
  return (
    <div className="space-y-4">
      {/* Available To Select Auction tab */}
      <div className="card bg-blackDark shadow-xl border ">
        <div className="card-body p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="card-title text-2xl font-extrabold text-whiteLight flex items-center gap-3">
              <PlusCircle className="w-6 h-6 text-newYellow" />
              Available Products for Auction ({availableProducts.length})
            </h2>
          </div>
          <div
            className="overflow-x-auto overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
          >
            {availableProducts.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-lg">
                <p>No available products for auction to select.</p>
                <p className="text-sm mt-1">
                  Try adjusting your filters or search term.
                </p>
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
                  {availableProducts.map((product, index) => (
                    <tr
                      key={product._id}
                      className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <img
                              src={product.images && product.images[0] && product.images[0].key ? `${CDN_BASE_URL}${product.images[0].key}` : "/placeholder-image.png"}
                              alt={product?.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[180px] text-whiteLight font-medium">
                        <div className="truncate" title={product.title}>{product.title}</div>
                      </td>
                      <td className="text-whiteLight font-semibold">
                        ₹ {product.startingPrice || "-"}
                      </td>
                      <td className="text-whiteLight font-semibold">
                        ₹ {product.reservedPrice || "-"}
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

      {/* Selected Auction Products */}
      {selected.length > 0 && (
        <div className="card bg-blackLight shadow-xl border border-gray-200 mt-6">
          <div className="card-body p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="card-title text-2xl font-extrabold text-whiteLight flex items-center gap-3">
                <Hammer className="w-6 h-6 text-newYellow" />
                Your Selected Auction Products ({selected.length})
              </h2>
            </div>
            <div
              className="overflow-x-auto overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
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
                  {selected.map((item, index) => (
                    <tr
                      key={item.productId}
                      className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <img
                              src={item.images && item.images[0] && item.images[0].key ? `${CDN_BASE_URL}${item.images[0].key}` : "/placeholder-image.png"}
                              alt={item?.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[180px] text-whiteLight font-medium">
                        <div className="truncate" title={item.title}>{item.title}</div>
                      </td>
                      <td>
                        <label className="form-control w-full max-w-xs">
                          <input
                            type="text"
                            value={item.startingPrice}
                            onChange={(e) =>
                              onChange(
                                item.productId,
                                "startingPrice",
                                e.target.value
                              )
                            }
                            className={`input input-bordered text-whiteLight rounded-full font-bold bg-blackDark w-[100px] ${
                              getValidationError("auction", index, "starting")
                                ? "input-error"
                                : ""
                            }`}
                            placeholder="Start Price"
                          />
                          {getValidationError("auction", index, "starting") && (
                            <div className="label">
                              <span className="label-text-alt text-error">
                                Starting price is required and must be a number
                              </span>
                            </div>
                          )}
                        </label>
                      </td>
                      <td>
                        <label className="form-control w-full max-w-xs">
                          <input
                            type="text"
                            value={item.reservedPrice}
                            onChange={(e) =>
                              onChange(
                                item.productId,
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
                          {getValidationError("auction", index, "reserved") && (
                            <div className="label">
                              <span className="label-text-alt text-error">
                                Reserved price is required and must be a number
                              </span>
                            </div>
                          )}
                        </label>
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onRemove(item.productId);
                          }}
                          className="btn btn-circle btn-sm bg-red-500 text-whiteLight shadow-lg hover:from-red-600 hover:to-red-800 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
                          data-tip="Remove Product"
                          aria-label="Remove Product"
                          title="Remove Product"
                        >
                          <Trash2 size={16} />
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

// Giveaway Tab Content with individual toggle only
const GiveawayTabContent = ({
  availableProducts,
  selected,
  onSelect,
  onRemove,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Available To Select Giveaway section*/}
      <div className="card bg-blackDark shadow-xl border ">
        <div className="card-body p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="card-title text-2xl font-extrabold text-whiteLight flex items-center gap-3">
              <PlusCircle className="w-6 h-6 text-newYellow" />
              Available Products for Giveaway ({availableProducts.length})
            </h2>
          </div>

          <div
            className="overflow-x-auto overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
          >
            {availableProducts.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-lg">
                <p>No available products for giveaway to select.</p>
                <p className="text-sm mt-1">
                  Try adjusting your filters or search term.
                </p>
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
                  {availableProducts.map((product, index) => (
                    <tr
                      key={product._id}
                      className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <img
                              src={product.images && product.images[0] && product.images[0].key ? `${CDN_BASE_URL}${product.images[0].key}` : "/placeholder-image.png"}
                              alt={product?.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[180px] text-whiteLight font-medium">
                        <div className="truncate" title={product.title}>{product.title}</div>
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

      {/* Selected Giveaway Products */}
      {selected.length > 0 && (
        <div className="card bg-blackLight shadow-xl border border-gray-200 mt-6">
          <div className="card-body p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="card-title text-2xl font-extrabold text-whiteLight flex items-center gap-3">
                <Gift className="w-6 h-6 text-newYellow" />
                Your Selected Giveaway Products ({selected.length})
              </h2>
            </div>
            <div
              className="overflow-x-auto overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
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
                  {selected.map((item, index) => (
                    <tr
                      key={item.productId}
                      className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <img
                              src={item.images && item.images[0] && item.images[0].key ? `${CDN_BASE_URL}${item.images[0].key}` : "/placeholder-image.png"}
                              alt={item?.title}
                              className="w-full h-full object-full"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[180px] text-whiteLight font-medium">
                        <div className="truncate" title={item.title}>{item.title}</div>
                      </td>
                      <td>
                        <label className="label cursor-pointer bg-whiteHalf rounded-full justify-center">
                          <input
                            type="checkbox"
                            checked={item.followersOnly}
                            onChange={(e) =>
                              onChange(item.productId, e.target.checked)
                            }
                            className="toggle toggle-warning toggle-md"
                          />
                        </label>
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onRemove(item.productId);
                          }}
                          className="btn btn-circle btn-sm bg-red-500 text-whiteLight shadow-lg hover:from-red-600 hover:to-red-800 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
                          data-tip="Remove Product"
                          aria-label="Remove Product"
                          title="Remove Product"
                        >
                          <Trash2 size={16} />
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


export default EditTaggedProducts;