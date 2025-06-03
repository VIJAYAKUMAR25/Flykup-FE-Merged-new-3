import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Package,
  Pencil,
  Box,
  ArrowDown,
  Shield,
  Plus,
} from "lucide-react";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import Stocks from "./Stocks";
import { IoCloseCircleOutline } from "react-icons/io5";
import { GET_PRODUCTS_BY_SELLER_ID } from "../../api/apiDetails";
import axiosInstance from "../../../utils/axiosInstance";
import { toast } from "react-toastify";
import { CiCircleList } from "react-icons/ci";
import { motion } from "framer-motion";

const ProductListing = () => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showAddToShow, setShowAddToShow] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const tabs = [
    { id: "products", icon: <ShoppingCart className="w-4 h-4" /> },
    { id: "stocks", icon: <Box className="w-4 h-4" /> },
  ];
  const [refreshing, setRefreshing] = useState(false);

  const toggleProductSelection = (product) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((p) => p.productId === product._id);
      return exists
        ? prev.filter((p) => p.productId !== product._id)
        : [...prev, { productId: product._id, title: product.title }];
    });
  };

  useEffect(() => {
    setShowAddToShow(selectedProducts.length > 0);
  }, [selectedProducts]);

  useEffect(() => {
    setSelectedProducts([]);
  }, [activeTab]);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          product.quantity > 0
      ),
    [products, searchQuery]
  );

  const fetchInventories = async () => {
    try {
      const { data } = await axiosInstance.get(GET_PRODUCTS_BY_SELLER_ID);
      console.log("Fetched products:", data.data);
      setProducts(data.data);
    } catch (error) {
      console.error("Error fetching product listings:", error);
      toast.error("Failed to fetch product listings.");
    }
  };

  useEffect(() => {
    fetchInventories();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInventories();
    setRefreshing(false);
    toast.success("Inventory refreshed");
  };

  const handleCreateProduct = () => {
    navigate("/seller/createProductListing");
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-blackLight shadow-2xl relative overflow-hidden p-6 text-gray-800">
      <div className="sticky top-0 z-20 bg-blackLight p-4 shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 -mx-6 px-6 border-l-4 border-newYellow">
        <div className="flex-grow">
          <h1 className="text-xl sm:text-2xl font-bold text-whiteLight flex items-center mb-1 sm:mb-0">
            <CiCircleList className="mr-2 text-newYellow" size={24} />
            Product Management
          </h1>
          <p className="text-sm text-newYellow mt-1">
            Manage products available for customer purchase
          </p>
        </div>

        {/* Button Section - Align to end */}
        {/* Removed sm:w-auto to make the button size to its content */}
        <button
  onClick={handleCreateProduct}
  className="bg-newYellow hover:bg-amber-300 text-blackDark px-4 py-2 rounded-full font-semibold flex items-center justify-center text-sm sm:w-[200px] sm:text-base transition-colors hover:scale-105 shadow-md shadow-amber-300/50 mt-4 sm:mt-0"
>
  <Plus size={18} className="mr-2" />
  Add
</button>
      </div>

      {/* Tabs Navigation - Make it sticky right below the main header */}
      <div className="sticky top-[96px] z-10 bg-blackLight p-2 -mx-6 px-6 flex space-x-2 mb-2 rounded-lg overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-medium
              transition-all duration-300 transform hover:scale-105 whitespace-nowrap
              ${
                activeTab === tab.id
                  ? "bg-newYellow hover:bg-amber-300 text-blackDark font-semibold shadow-md shadow-amber-300/50"
                  : "text-gray-600 bg-gray-100 hover:bg-gray-50"
              }
            `}
          >
            {tab.icon}
            <span className=" capitalize">{tab.id}</span>
          </button>
        ))}
      </div>

      {/* SellerShowsModal (if uncommented) */}
      {/* {isOpen && <SellerShowsModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        selectedProductIds={selectedProducts}
        setSelectedProducts={setSelectedProducts}
      />} */}

      {/* Add To Show Button on Product Select */}
      {showAddToShow && (
        <div className="fixed bottom-6 right-6 z-30 animate-bounce">
          <button
            onClick={() => setIsOpen(true)}
            className="btn btn-warning bg-primaryYellow shadow-lg rounded-full px-5 py-3 flex items-center"
          >
            <Plus size={18} className="mr-2" />
            Add{" "}
            <font className="font-semibold text-success">
              {" "}
              {selectedProducts.length}
            </font>{" "}
            to Show
          </button>
        </div>
      )}

      {/* Main content area for Products or Stocks */}
      {activeTab === "products" ? (
        <div className="flex flex-col flex-grow w-full overflow-hidden">
          {/* Header for Listed Products and Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-2 gap-4 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 md:w-7 md:h-7 text-newYellow" />
                <h1 className="text-xl md:text-3xl font-bold text-whiteLight">
                  Listed Products
                </h1>
                <motion.button
                  onClick={handleRefresh}
                  whileTap={{ scale: 0.9 }}
                  disabled={refreshing}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="Refresh Products"
                >
                  <RefreshCw
                    size={18}
                    className={`text-blue-500 ${
                      refreshing ? "animate-spin" : "hover:text-blue-600"
                    }`}
                  />
                </motion.button>
              </div>
              <div className="h-1 w-32 md:w-44 bg-primaryYellow mt-1 rounded-full"></div>
            </div>

            {/* Search Bar */}
            <div className="w-full md:w-auto md:min-w-[300px] lg:min-w-[400px]">
              <div className="relative rounded-full w-full">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 md:py-3 pl-10 rounded-full border border-gray-200 bg-whiteLight focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-transparent transition-all duration-200"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                  >
                    <IoCloseCircleOutline size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Section with Responsiveness */}
          <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-100 flex-grow">
            <div className="relative h-full overflow-y-auto">
              <table className="table w-full">
                <thead className="bg-newYellow sticky top-0 z-10">
                  <tr className="text-primaryBlack">
                    {/* Fixed widths for table headers */}
                    <th className="w-[80px]">
                      <div className="flex items-center">Image</div>
                    </th>
                    <th className="w-[200px]">
                      <div className="flex items-center">
                        <Tag size={14} className="mr-1" /> Name
                      </div>
                    </th>
                    <th className="w-[150px] hidden md:table-cell">
                      <div className="flex items-center">
                        <Package size={14} className="mr-1" /> Category
                      </div>
                    </th>
                    <th className="w-[80px] hidden lg:table-cell">
                      <div className="flex items-center">
                        <ShoppingCart size={14} className="mr-1" /> Qty
                      </div>
                    </th>
                    <th className="w-[200px]">
                      <div className="flex items-center">
                        <FaIndianRupeeSign size={14} className="mr-1" />
                        Buy Now Price
                      </div>
                    </th>
                    <th className="w-[200px]">
                      <div className="flex items-center">
                        <FaIndianRupeeSign size={14} className="mr-1" />
                        Auction Price
                      </div>
                    </th>
                    <th className="w-[80px]">
                      <div className="flex items-center">
                        <FaEdit size={14} className="mr-1" /> Edit
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="text-center py-8 md:py-12 text-whiteLight"
                      >
                        <div className="flex flex-col items-center justify-center space-y-4 px-4">
                          {products.length === 0 ? (
                            <>
                              <div className="relative w-16 h-16 md:w-24 md:h-24 animate-pulse">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-16 w-16 md:h-24 md:w-24 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                  />
                                </svg>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="absolute top-5 left-5 md:top-7 md:left-7 h-6 w-6 md:h-10 md:w-10 text-newYellow animate-bounce"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                              </div>
                              <h3 className="text-base md:text-lg font-medium text-whiteLight">
                                No products yet
                              </h3>
                              <p className="text-sm md:text-base text-gray-400 max-w-xs text-center">
                                Create your first product to get started with
                                your inventory
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="relative w-16 h-16 md:w-24 md:h-24">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-16 w-16 md:h-24 md:w-24 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                  />
                                </svg>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="absolute bottom-0 right-0 h-6 w-6 md:h-8 md:w-8 text-newYellow animate-pulse"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                  />
                                </svg>
                              </div>
                              <h3 className="text-base md:text-lg font-medium text-whiteLight">
                                No matching products
                              </h3>
                              <p className="text-sm md:text-base text-gray-400 max-w-xs text-center">
                                Try adjusting your search or filter to find what
                                you're looking for
                              </p>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <ProductRow
                        key={product._id}
                        product={product}
                        toggleProductSelection={() =>
                          toggleProductSelection(product)
                        }
                        isSelected={selectedProducts.some(
                          (p) => p.productId === product._id
                        )}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <Stocks />
      )}
    </div>
  );
};

const ProductRow = ({ product, toggleProductSelection, isSelected }) => {
  const navigate = useNavigate();
  const cdnURL = import.meta.env.VITE_AWS_CDN_URL;

  const handleEditProduct = (product) => {
    navigate("/seller/editProductListing", { state: product });
  };

  const discountPercentage =
    product?.MRP && product.productPrice
      ? Math.round(((product.MRP - product.productPrice) / product.MRP) * 100)
      : 0;
  const imageUrl = product.images?.[0]?.key;
  return (
    <tr className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer">
      {/* Fixed widths for table data cells */}
      <td className="w-[80px]">
        <div className="w-12 h-12 flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl ? `${cdnURL}${imageUrl}` : "/placeholder-image.png"}
              alt={product.title}
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">No image</span>
            </div>
          )}
        </div>
      </td>
      <td className="w-[200px] p-4 text-whiteLight">
        <div className="truncate">{product.title}</div>
      </td>
      <td className="w-[150px] p-4 text-whiteLight hidden md:table-cell">
        <div className="truncate">
          {product.subcategory || product.category || "Other"}
        </div>
      </td>
      <td className="w-[80px] text-whiteLight font-semibold hidden lg:table-cell">
        {product.quantity}
      </td>
      <td className="w-[200px] p-2">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="h-5 w-5 text-slate-500" />
          <div className="flex items-center">
            <span className="line-through text-slate-400 mr-2">
              ₹{product?.MRP}
            </span>
            <span className="font-bold text-whiteLight text-lg">
              ₹{product.productPrice}
            </span>
            {discountPercentage > 0 && (
              <span className="ml-2 bg-amber-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                {discountPercentage}% OFF
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="w-[200px]">
        <div className="flex flex-col gap-1">
          <span className="text-whiteLight flex items-center text-sm">
            <ArrowDown className="h-4 w-4 mr-1 inline text-whiteLight" /> Start:{" "}
            <font className="font-bold text-amber-200">
              ₹{product.startingPrice}
            </font>
          </span>
          <span className="text-whiteLight flex items-center text-sm ">
            <Shield className="h-4 w-4 mr-1 inline" /> Reserve:{" "}
            <font className="font-bold text-greenLight">
              ₹{product.reservedPrice}
            </font>
          </span>
        </div>
      </td>
      <td className="w-[80px]">
        <div className="flex">
          <button
            onClick={() => handleEditProduct(product)}
            className="btn btn-ghost btn-xs bg-newYellow text-primaryBlack rounded-full shadow-md"
          >
            <Pencil size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ProductListing;