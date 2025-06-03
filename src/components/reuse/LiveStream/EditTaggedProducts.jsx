import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Trash2, ChevronLeft, ShoppingCart, Hammer, Gift } from "lucide-react";
import { AiFillCodeSandboxSquare, AiFillCodepenCircle } from "react-icons/ai";
import { FaCartPlus } from "react-icons/fa";
import {
  GET_PRODUCTS_BY_SELLER_ID,
  GET_SHOW_BY_ID,
  UPDATE_TAGGED_PRODUCTS,
} from "../../api/apiDetails";
import { toast } from "react-toastify";
import axiosInstance from "../../../utils/axiosInstance";
import {useAuth} from "../../../context/AuthContext.jsx"


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
  const { user } = useAuth();
  const CDN_BASE_URL = import.meta.env.VITE_AWS_CDN_URL;
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

 

  // Fetch seller products
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await axiosInstance.get(GET_PRODUCTS_BY_SELLER_ID);
      if (res.data.status) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching products:", err.message);
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

  // Compute available products:
  // Only show products from the seller's list that are not already selected in any group.
  const getAvailableProducts = () => {
    const selectedIds = new Set([
      ...selectedProducts.buyNow.map((item) => String(item.productId)),
      ...selectedProducts.auction.map((item) => String(item.productId)),
      ...selectedProducts.giveaway.map((item) => String(item.productId)),
    ]);
    return products.filter((product) => !selectedIds.has(String(product._id)));
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
      };
    } else if (tab === "giveaway") {
      newProduct = {
        productId: product._id,
        followersOnly: false,
        title: product.title,
        images: product.images,
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

  // For Auction: update starting/reserve price without forcing numeric conversion
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

  // For Giveaway: update followersOnly flag individually
  const handleGiveawayChange = (productId, followersOnly) => {
    setSelectedProducts((prev) => ({
      ...prev,
      giveaway: prev.giveaway.map((item) =>
        item.productId === productId ? { ...item, followersOnly } : item
      ),
    }));
  };

  // Basic field validation before submit
  const validateFields = () => {
    const errors = {};

    selectedProducts.buyNow.forEach((item, index) => {
      if (!item.productPrice || isNaN(item.productPrice)) {
        errors[`buyNow-${index}-price`] = true;
      }
    });
    selectedProducts.auction.forEach((item, index) => {
      if (!item.startingPrice || isNaN(item.startingPrice)) {
        errors[`auction-${index}-starting`] = true;
      }
      if (!item.reservedPrice || isNaN(item.reservedPrice)) {
        errors[`auction-${index}-reserved`] = true;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // On submit, send the payload in the required format.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) return;

    const payload = {
      buyNowProducts: selectedProducts.buyNow,
      auctionProducts: selectedProducts.auction,
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
    } finally {
      setSubmitLoading(false);
    }
  };

  // If either fetch is still loading, show a full-screen spinner
  if (loadingProducts || loadingShow) {
    return (
      <div className="flex justify-center items-center h-screen bg-neutral-50">
        <span className="loading loading-spinner loading-lg text-blue-600"></span>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen p-4 text-gray-700">
      {/* Back Button */}
      <div className="flex items-center mb-4">
        <button
          className="btn btn-sm bg-slate-300 text-primaryBlack flex items-center hover:bg-blue-500 border-none"
          onClick={() => setShowModal(true)}
        >
          <ChevronLeft className="" /> Back
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-4">Products in this Show</h2>

      {/* Unified Tabs (inspired by ProductTab) */}
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

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "buyNow" && (
          <BuyNowTabContent
            availableProducts={getAvailableProducts()}
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
            availableProducts={getAvailableProducts()}
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
            availableProducts={getAvailableProducts()}
            selected={selectedProducts.giveaway}
            onSelect={(product) => handleProductSelect("giveaway", product)}
            onRemove={(id) => handleProductRemove("giveaway", id)}
            onChange={handleGiveawayChange}
          />
        )}
      </div>

      <div className="justify-center flex">
        <button
          className="btn btn-warning bg-primaryYellow mt-6"
          onClick={handleSubmit}
          disabled={submitLoading}
        >
          {submitLoading && (
            <span className="loading loading-spinner loading-sm mr-2 text-gray-800"></span>
          )}
          Update Show
        </button>
      </div>

      {/* Modal for Back Confirmation */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box bg-white text-gray-800">
            <h3 className="font-bold text-lg">Discard changes</h3>
            <p className="py-4">Are you sure you want to discard changes?</p>
            <div className="modal-action">
              <button
                className="btn btn-error"
                onClick={() => setShowModal(false)}
              >
                No
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/seller/allShows")}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ======================= Internal Components =======================

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
   const CDN_BASE_URL = import.meta.env.VITE_AWS_CDN_URL;
  return (
    <div className="space-y-4">
      {/* Available To Select BuyNow Section */}
      <div className="card bg-white shadow-xl border p-4">
        <h2 className="text-xl font-bold mb-2">
          Available To Select ({availableProducts.length})
        </h2>
        <div
            className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#CBD5E0 #F7FAFC",
            }}
          >
          <table className="table w-full">
            {availableProducts.length > 0 && (
              <thead className="sticky top-0 bg-white">
                <tr className="bg-inputYellow text-primaryBlack">
                  <th>#</th>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
            )}
            <tbody>
              {availableProducts.map((product, index) => (
                <tr
                  key={product._id}
                  className="hover:shadow-md transition-all duration-300"
                >
                  <td>{index + 1}</td>
                  <td>
                    <div className="avatar">
                      <div className="w-10 rounded">
                      <img
                            src={product.images && product.images[0] && product.images[0].key ? `${CDN_BASE_URL}${product.images && product.images[0] && product.images[0].key}` : "/placeholder-image.png"}
                            alt={product?.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[150px] w-[150px] text-primaryBlack">
                      <div className="truncate">{product.title}</div>
                    </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <AiFillCodeSandboxSquare className="w-5 h-5" />
                      <span>{product.quantity}</span>
                    </div>
                  </td>
                  <td>₹ {product.productPrice || "-"}</td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        onSelect(product);
                      }}
                    >
                      <FaCartPlus size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Products Section */}
      {selected.length > 0 && (
        <div className="card bg-white shadow-xl border p-4">
          <h2 className="text-xl font-bold mb-2">
            Selected ({selected.length})
          </h2>
          <div
            className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#CBD5E0 #F7FAFC",
            }}
          >
            <table className="table w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="bg-inputYellow text-primaryBlack">
                  <th>#</th>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((item, index) => (
                  <tr
                    key={item.productId}
                    className="hover:shadow-md transition-all duration-300"
                  >
                    <td>{index + 1}</td>
                    <td>
                      <div className="avatar">
                        <div className="w-10 rounded">
                        <img
                            src={item.images && item.images[0] && item.images[0].key ? `${CDN_BASE_URL}${item.images && item.images[0] && item.images[0].key}` : "/placeholder-image.png"}
                            alt={item?.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[150px] w-[150px] text-primaryBlack">
                      <div className="truncate">{item.title}</div>
                    </td>
                    <td>
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
                        className={`input input-bordered w-[140px] rounded-full bg-gray-100 text-gray-800 ${
                          getValidationError("buyNow", index, "price")
                            ? "input-error"
                            : "input-primary"
                        }`}
                        placeholder="Enter Price"
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-error btn-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          onRemove(item.productId);
                        }}
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
   const CDN_BASE_URL = import.meta.env.VITE_AWS_CDN_URL;
  return (
    <div className="space-y-4">
      {/*  Available To Select Auction tab */}
      <div className="card bg-white shadow-xl border p-4">
        <h2 className="text-xl font-bold mb-2">
          Available To Select ({availableProducts.length})
        </h2>
        <div
            className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#CBD5E0 #F7FAFC",
            }}
          >
          <table className="table w-full">
            {availableProducts.length > 0 && (
              <thead className="sticky top-0 bg-white">
                <tr className="bg-inputYellow text-primaryBlack">
                  <th>#</th>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Start Price</th>
                  <th>Reserve Price</th>
                  <th>Stock</th>
                  <th>Action</th>
                </tr>
              </thead>
            )}
            <tbody>
              {availableProducts.map((product, index) => (
                <tr
                  key={product._id}
                  className="hover:shadow-md transition-all duration-300"
                >
                  <td>{index + 1}</td>
                  <td>
                    <div className="avatar">
                      <div className="w-10 rounded">
                      <img
                            src={product.images && product.images[0] && product.images[0].key ? `${CDN_BASE_URL}${product.images && product.images[0] && product.images[0].key}` : "/placeholder-image.png"}
                            alt={product?.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[150px] w-[150px] text-primaryBlack">
                      <div className="truncate">{product.title}</div>
                    </td>
                  <td>₹ {product.startingPrice || "-"}</td>
                  <td>₹ {product.reservedPrice || "-"}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <AiFillCodepenCircle className="w-5 h-5" />
                      <span>{product.quantity}</span>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        onSelect(product);
                      }}
                    >
                      <FaCartPlus size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Auction Products */}
      {selected.length > 0 && (
        <div className="card bg-white shadow-xl border p-4">
          <h2 className="text-xl font-bold mb-2">
            Selected ({selected.length})
          </h2>
          <div
            className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#CBD5E0 #F7FAFC",
            }}
          >
            <table className="table w-full">
              <thead className="sticky top-0 bg-white">
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
                {selected.map((item, index) => (
                  <tr
                    key={item.productId}
                    className="hover:shadow-md transition-all duration-300"
                  >
                    <td>{index + 1}</td>
                    <td>
                      <div className="avatar">
                        <div className="w-10 rounded">
                        <img
                            src={item.images && item.images[0] && item.images[0].key ? `${CDN_BASE_URL}${item.images && item.images[0] && item.images[0].key}` : "/placeholder-image.png"}
                            alt={item?.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[150px] w-[150px] text-primaryBlack">
                      <div className="truncate">{item.title}</div>
                    </td>
                    <td>
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
                        className={`input input-bordered w-[130px] rounded-full bg-gray-100 text-gray-800 ${
                          getValidationError("auction", index, "starting")
                            ? "input-error"
                            : "input-primary"
                        }`}
                        placeholder="Enter Start Price"
                      />
                    </td>
                    <td>
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
                        className={`input input-bordered w-[130px] rounded-full  bg-gray-100 text-gray-800 ${
                          getValidationError("auction", index, "reserved")
                            ? "input-error"
                            : "input-primary"
                        }`}
                        placeholder="Enter Reserve Price"
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-error btn-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          onRemove(item.productId);
                        }}
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
    const CDN_BASE_URL = import.meta.env.VITE_AWS_CDN_URL;
  return (
    <div className="space-y-4">
      {/* Available To Select Giveaway section*/}
      <div className="card bg-white shadow-xl border p-4">
        <h2 className="text-xl font-bold mb-4">
          Available To Select ({availableProducts.length})
        </h2>
        <div
            className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#CBD5E0 #F7FAFC",
            }}
          >
          <table className="table w-full">
            {availableProducts.length > 0 && (
              <thead className="sticky top-0 bg-white">
                <tr className="bg-inputYellow text-primaryBlack">
                  <th>#</th>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Stock</th>
                  <th>Action</th>
                </tr>
              </thead>
            )}
            <tbody>
              {availableProducts.map((product, index) => (
                <tr
                  key={product._id}
                  className="hover:shadow-md transition-all duration-300"
                >
                  <td>{index + 1}</td>
                  <td>
                    <div className="avatar">
                      <div className="w-10 rounded">
                      <img
                            src={product.images && product.images[0] && product.images[0].key ? `${CDN_BASE_URL}${product.images && product.images[0] && product.images[0].key}` : "/placeholder-image.png"}
                            alt={product?.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[150px] w-[150px] text-primaryBlack">
                      <div className="truncate">{product.title}</div>
                    </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <AiFillCodeSandboxSquare className="w-5 h-5" />
                      <span>{product.quantity}</span>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        onSelect(product);
                      }}
                    >
                      <FaCartPlus size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Giveaway Products */}
      {selected.length > 0 && (
        <div className="card bg-white shadow-xl border p-4">
          <h2 className="text-xl font-bold mb-2">
            Selected ({selected.length})
          </h2>
          <div
            className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#CBD5E0 #F7FAFC",
            }}
          >
            <table className="table w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="bg-inputYellow text-primaryBlack">
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
                    className="hover:shadow-md transition-all duration-300"
                  >
                    <td>{index + 1}</td>
                    <td>
                      <div className="avatar">
                        <div className="w-10 rounded">
                        <img
                            src={item.images && item.images[0] && item.images[0].key ? `${CDN_BASE_URL}${product.images && item.images[0] && item.images[0].key}` : "/placeholder-image.png"}
                            alt={item?.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[150px] w-[150px] text-primaryBlack">
                      <div className="truncate">{item.title}</div>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={item.followersOnly}
                        onChange={(e) =>
                          onChange(item.productId, e.target.checked)
                        }
                        className={`toggle ${
                          item.followersOnly
                            ? "bg-gray-600 border-gray-600"
                            : "toggle-primary"
                        }`}
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-error btn-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          onRemove(item.productId);
                        }}
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
      )}
    </div>
  );
};

export default EditTaggedProducts;
