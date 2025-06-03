import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Hammer,
  Gift,
  ChevronDown,
  Trash,
  PlusCircle,
  Box,
  Package,
} from "lucide-react";
import { GET_PRODUCTS_BY_SELLER_ID } from "../../api/apiDetails";
import axiosInstance from "../../../utils/axiosInstance";

const ProductTab = ({ onSelectProducts }) => {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("buyNow");
  const [selectedProducts, setSelectedProducts] = useState({
    buyNow: [],
    auction: [],
    giveaway: [],
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState({
    error: null,
    success: null,
  });




  const getValidationError = (tab, index, field) => {
    return validationErrors[`${tab}-${index}-${field}`];
  };

  const validateFields = () => {
    const errors = {};

    // Validate Buy Now products
    selectedProducts.buyNow.forEach((product, index) => {
      if (
        product.productPrice === "" ||
        isNaN(parseFloat(product.productPrice))
      ) {
        errors[`buyNow-${index}-price`] =
          "Price is required and must be a number";
      }
    });

    // Validate Auction products
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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch products when userData is available
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch products from the backend
  const fetchProducts = async () => {
    try {
      const { data } = await axiosInstance.get(GET_PRODUCTS_BY_SELLER_ID);
      if (data.status) {
        setProducts(data?.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Get available products (not already selected in any tab)
  const getAvailableProducts = (tab) => {
    return products.filter(
      (product) =>
        !selectedProducts.buyNow.some((p) => p.productId === product._id) &&
        !selectedProducts.auction.some((p) => p.productId === product._id) &&
        !selectedProducts.giveaway.some((p) => p.productId === product._id)
    );
  };

  // Handle product selection
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
      }),
      ...(tab === "giveaway" && {
        followersOnly: false,
        images: product.images,
        title: product.title,
      }),
    };

    setSelectedProducts((prev) => ({
      ...prev,
      [tab]: [...prev[tab], newProduct],
    }));
  };

  // Handle product removal
  const handleProductRemove = (tab, productId) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [tab]: prev[tab].filter((p) => p.productId !== productId),
    }));
  };

  // Handle changes for price inputs (for auction and buyNow)
  // Value is stored as string so that empty input is preserved.
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

  // Handle individual giveaway toggle change
  const handleGiveawayChange = (productId, followersOnly) => {
    setSelectedProducts((prev) => ({
      ...prev,
      giveaway: prev.giveaway.map((p) =>
        p.productId === productId ? { ...p, followersOnly } : p
      ),
    }));
  };

  // Submit selected products
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateFields()) {
      return;
    }
    onSelectProducts(selectedProducts);
  };

  // Tab configuration
  const tabInfo = {
    buyNow: {
      label: "Buy Now",
      icon: ShoppingCart,
      activeColor: "bg-primaryYellow text-primaryBlack font-bold",
      inactiveColor: "hover:bg-amber-100 text-primaryBlack",
    },
    auction: {
      label: "Auction",
      icon: Hammer,
      activeColor: "bg-primaryYellow text-primaryBlack font-bold",
      inactiveColor: "hover:bg-amber-100 text-primaryBlack",
    },
    giveaway: {
      label: "Giveaway",
      icon: Gift,
      activeColor: "bg-primaryYellow text-primaryBlack font-bold",
      inactiveColor: "hover:bg-amber-100 text-primaryBlack",
    },
  };

  const totalSelectedProducts =
    selectedProducts.buyNow.length +
    selectedProducts.auction.length +
    selectedProducts.giveaway.length;

  return (
    <div className="bg-slate-200 rounded-box shadow-lg">
      {/* Tabs */}
      <div className="tabs tabs-boxed bg-gray-100 rounded-box p-1">
        {Object.keys(tabInfo).map((tab) => {
          const {
            icon: Icon,
            label,
            activeColor,
            inactiveColor,
          } = tabInfo[tab];

          return (
            <button
              key={tab}
              className={`
                tab 
                flex 
                items-center 
                transition-all 
                duration-200 
                ${activeTab === tab ? activeColor : `${inactiveColor} bg-white`}
                lg:flex-row lg:gap-2
                max-lg:justify-center max-lg:px-3
              `}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(tab);
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="max-lg:hidden ml-2">
                {label} ({selectedProducts[tab].length})
              </span>
              <span className="lg:hidden ml-1 text-xs">
                ({selectedProducts[tab].length})
              </span>
            </button>
          );
        })}
      </div>

      {/* Counts */}
      <div className="flex justify-center items-center space-x-4 p-2 mt-2 mr-8">
        <div className="tooltip tooltip-bottom">
          <div className="flex items-center bg-slate-400 text-primaryBlack px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <span className="font-bold text-sm">
              Total Products: {products.length}
            </span>
          </div>
        </div>
        <div className="tooltip tooltip-bottom">
          <div className="relative">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            {totalSelectedProducts > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                {totalSelectedProducts}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="">
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
          />
        )}

        {activeTab === "giveaway" && (
          <GiveawayTabContent
            products={getAvailableProducts("giveaway")}
            selected={selectedProducts.giveaway}
            onSelect={(product) => handleProductSelect("giveaway", product)}
            onRemove={(productId) => handleProductRemove("giveaway", productId)}
            onChange={handleGiveawayChange}
          />
        )}
      </div>

      <button
        className="btn btn-ghost bg-primaryYellow hover:bg-amber-400 text-primaryBlack font-bold mt-6 w-full"
        onClick={handleSubmit}
      >
        Confirm Selection
      </button>
    </div>
  );
};

// Updated ProductTabContent Component with DaisyUI
const ProductTabContent = ({
  products,
  selected,
  onSelect,
  onRemove,
  onChange,
  type,
  validationErrors,
  getValidationError,
}) => {
    const cdnURL = import.meta.env.VITE_AWS_CDN_URL;

  return (
    <div className="container mx-auto space-y-2">
      {/* Available Products Section */}
      <div className="card bg-white shadow-xl border">
        <div className="px-3 py-2">
          <div className="flex justify-between">
            <h2 className="card-title text-xl font-bold mb-1 text-primaryBlack flex items-center gap-3">
              Available Products
            </h2>
            <div className="relative right-0">
              <ChevronDown
                size={24}
                className="text-primary animate-[glowPulse_1.5s_infinite] transition-all duration-300 hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
            </div>
          </div>
          <div
            className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#CBD5E0 #F7FAFC",
            }}
          >
            <table className="table w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-inputYellow text-primaryBlack">
                  <th>#</th>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Stock</th>
                  {type === "buyNow" && <th>Price</th>}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr
                    key={product.productId}
                    className="transition-all duration-300 ease-in-out transform hover:scale-103 hover:shadow-md"
                  >
                    <td>{index + 1}</td>
                    <td>
                      <div className="avatar">
                        <div className="w-10 rounded">
                          <img
                            src={product?.images[0]?.key ? `${cdnURL}${product.images[0].key}` : "/placeholder-image.png"}
                            alt={product?.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[150px] w-[150px] text-primaryBlack">
                      <div className="truncate">{product.title}</div>
                    </td>
                    <td className="text-success font-semibold">
                      <div className="flex items-center gap-2">
                        <Box className="w-5 h-5" />
                        <span>{product.quantity}</span>
                      </div>
                    </td>
                    {type === "buyNow" && (
                      <td>
                        <span className="text-gray-700 font-medium">
                          ₹ {product.productPrice}
                        </span>
                      </td>
                    )}
                    <td>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onSelect(product);
                        }}
                        className="btn btn-ghost bg-green-200 btn-sm hover:animate-none flex items-center justify-center text-info"
                        aria-label="Select Product"
                        title="Select Product"
                      >
                        <PlusCircle
                          size={22}
                          className="text-success hover:text-success-focus"
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Selected Products Section */}
      {selected.length > 0 && (
        <div className="card bg-white shadow-xl border">
          <div className="px-3 py-2">
            <div className="flex justify-between">
              <h2 className="card-title text-xl font-bold mb-4 text-primaryBlack flex items-center gap-3">
                Selected Products
              </h2>
              <div className="relative right-0">
                <ChevronDown
                  size={24}
                  className="text-primary animate-[glowPulse_3s_infinite] transition-all duration-300 hover:scale-110"
                />
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
              </div>
            </div>
            <div
              className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#CBD5E0 #F7FAFC",
              }}
            >
              <table className="table w-full">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="bg-inputYellow text-primaryBlack">
                    <th>#</th>
                    <th>Image</th>
                    <th>Title</th>
                    {type === "buyNow" && <th>Price</th>}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((product, index) => (
                    <tr
                      key={product.productId}
                      className="transition-all hover:inputYellow duration-300 ease-in-out transform hover:scale-103 hover:shadow-md"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="avatar">
                          <div className="w-10 rounded">
                          <img
                            src={product?.images[0]?.key ? `${cdnURL}${product.images[0].key}` : "/placeholder-image.png"}
                            alt={product?.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[200px] w-[200px] text-primaryBlack">
                        <div className="truncate">{product.title}</div>
                      </td>
                      {type === "buyNow" && (
                        <td>
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
                            className={`input input-bordered input-primary text-primaryBlack font-bold bg-inputYellow input-md rounded-full w-full focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 ${
                              getValidationError("buyNow", index, "price")
                                ? "input-error"
                                : "input-primary"
                            }`}
                            placeholder="Enter Price"
                          />
                        </td>
                      )}
                      <td>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onRemove(product.productId);
                          }}
                          className="btn btn-error btn-sm animate-shake hover:animate-none flex items-center gap-2"
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

// Updated AuctionTabContent Component
const AuctionTabContent = ({
  products,
  selected,
  onSelect,
  onRemove,
  onChange,
  validationErrors,
  getValidationError,
}) => {
      const cdnURL = import.meta.env.VITE_AWS_CDN_URL;
  return (
    <div className="container mx-auto space-y-2">
      {/* Available Products Section */}
      <div className="card bg-white shadow-xl border">
        <div className="px-3 py-2">
          <div className="flex justify-between">
            <h2 className="card-title text-xl font-bold mb-1 text-primaryBlack flex items-center gap-3">
              Available Auction Products
            </h2>
            <div className="relative right-0">
              <ChevronDown
                size={24}
                className="text-primary animate-[glowPulse_1.5s_infinite] transition-all duration-300 hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
            </div>
          </div>
          <div
            className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#CBD5E0 #F7FAFC",
            }}
          >
            <table className="table w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-inputYellow text-primaryBlack">
                  <th>#</th>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Start Price</th>
                  <th>Reserve Price</th>
                  <th>Stocks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr
                    key={product.productId}
                    className="transition-all duration-300 ease-in-out transform hover:scale-103 hover:shadow-md"
                  >
                    <td>{index + 1}</td>
                    <td>
                      <div className="avatar">
                        <div className="w-10 rounded">
                        <img
                            src={product?.images[0]?.key ? `${cdnURL}${product.images[0].key}` : "/placeholder-image.png"}
                            alt={product?.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[150px] w-[150px] text-primaryBlack">
                      <div className="truncate">{product.title}</div>
                    </td>
                    <td className="text-slate-600 font-semibold">
                      ₹ {product.startingPrice}
                    </td>
                    <td className="text-slate-600 font-semibold">
                      ₹ {product.reservedPrice}
                    </td>
                    <td className="flex gap-1">
                      <Package className="w-5 h-5" />
                      <div className="text-gray-700 font-medium">
                        {product.quantity}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onSelect(product);
                        }}
                        className="btn btn-ghost bg-green-200 btn-sm hover:animate-none flex items-center justify-center text-info"
                        aria-label="Select Product"
                        title="Select Product"
                      >
                        <PlusCircle
                          size={22}
                          className="text-success hover:text-success-focus"
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Selected Products Section */}
      {selected.length > 0 && (
        <div className="card bg-white shadow-xl border">
          <div className="px-3 py-2">
            <div className="flex justify-between">
              <h2 className="card-title text-xl font-bold mb-4 text-primaryBlack flex items-center gap-3">
                Selected Auction Products
              </h2>
              <div className="relative right-0">
                <ChevronDown
                  size={24}
                  className="text-primary animate-[glowPulse_3s_infinite] transition-all duration-300 hover:scale-110"
                />
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
              </div>
            </div>
            <div
              className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#CBD5E0 #F7FAFC",
              }}
            >
              <table className="table w-full">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="bg-inputYellow text-primaryBlack">
                    <th>#</th>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Start Price</th>
                    <th>Reserve Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((product, index) => (
                    <tr
                      key={product.productId}
                      className="transition-all hover:inputYellow duration-300 ease-in-out transform hover:scale-103 hover:shadow-md"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="avatar">
                          <div className="w-10 rounded">
                          <img
                            src={product?.images[0]?.key ? `${cdnURL}${product.images[0].key}` : "/placeholder-image.png"}
                            alt={product?.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[200px] w-[200px] text-primaryBlack">
                        <div className="truncate">{product.title}</div>
                      </td>
                      <td>
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
                          className={`input input-bordered input-primary text-primaryBlack font-bold bg-inputYellow input-md rounded-full w-full focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 ${
                            getValidationError("auction", index, "starting")
                              ? "input-error"
                              : "input-primary"
                          }`}
                          placeholder="Start Price"
                        />
                      </td>
                      <td>
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
                          className={`input input-bordered input-primary text-primaryBlack font-bold bg-inputYellow input-md rounded-full w-full focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 ${
                            getValidationError("auction", index, "reserved")
                              ? "input-error"
                              : "input-primary"
                          }`}
                          placeholder="Reserve Price"
                        />
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onRemove(product.productId);
                          }}
                          className="btn btn-error btn-sm animate-shake hover:animate-none flex items-center gap-2"
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

// Updated GiveawayTabContent Component (global toggle removed; each product’s toggle is individual)
const GiveawayTabContent = ({
  products,
  selected,
  onSelect,
  onRemove,
  onChange,
}) => {
      const cdnURL = import.meta.env.VITE_AWS_CDN_URL;
  return (
    <div className="container mx-auto space-y-2">
      {/* Available Products Section */}
      <div className="card bg-white shadow-xl border">
        <div className="px-3 py-2">
          <div className="flex justify-end">
            <div className="relative right-0">
              <ChevronDown
                size={24}
                className="text-primary animate-[glowPulse_1.5s_infinite] transition-all duration-300 hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
            </div>
          </div>

          <div
            className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#CBD5E0 #F7FAFC",
            }}
          >
            <table className="table w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-inputYellow text-primaryBlack">
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
                    key={product.productId}
                    className="transition-all duration-300 ease-in-out transform hover:scale-103 hover:shadow-md"
                  >
                    <td>{index + 1}</td>
                    <td>
                      <div className="avatar">
                        <div className="w-10 rounded">
                        <img
                            src={product?.images[0]?.key ? `${cdnURL}${product.images[0].key}` : "/placeholder-image.png"}
                            alt={product?.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[150px] w-[150px] text-primaryBlack">
                      <div className="truncate">{product.title}</div>
                    </td>
                    <td className="text-success font-semibold">
                      <div className="flex items-center gap-2">
                        <Box className="w-5 h-5" />
                        <span>{product.quantity}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onSelect(product);
                        }}
                        className="btn btn-ghost bg-green-200 btn-sm hover:animate-none flex items-center justify-center text-info"
                        aria-label="Select Product"
                        title="Select Product"
                      >
                        <PlusCircle
                          size={22}
                          className="text-success hover:text-success-focus"
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Selected Products Section */}
      {selected.length > 0 && (
        <div className="card bg-white shadow-xl border">
          <div className="px-3 py-2">
            <div className="flex justify-between">
              <h2 className="card-title text-xl font-bold mb-4 text-primaryBlack flex items-center gap-3">
                Selected Giveaway Products
              </h2>
              <div className="relative right-0">
                <ChevronDown
                  size={24}
                  className="text-primary animate-[glowPulse_3s_infinite] transition-all duration-300 hover:scale-110"
                />
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
              </div>
            </div>
            <div
              className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#CBD5E0 #F7FAFC",
              }}
            >
              <table className="table w-full">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="bg-inputYellow text-primaryBlack">
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
                      className="transition-all hover:inputYellow duration-300 ease-in-out transform hover:scale-103 hover:shadow-md"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="avatar">
                          <div className="w-10 rounded">
                          <img
                           src={product?.images[0]?.key ? `${cdnURL}${product.images[0].key}` : "/placeholder-image.png"}
                            alt={product?.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[200px] w-[200px] text-primaryBlack">
                        <div className="truncate">{product.title}</div>
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={product.followersOnly}
                          onChange={(e) =>
                            onChange(product.productId, e.target.checked)
                          }
                          className="toggle toggle-primary"
                        />
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onRemove(product.productId);
                          }}
                          className="btn btn-error btn-sm animate-shake hover:animate-none flex items-center gap-2"
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

export default ProductTab;
