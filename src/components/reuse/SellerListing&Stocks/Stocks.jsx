import { useEffect, useState } from "react";
import {
  Pencil,
  Package2,
  Save,
  X,
  Search,
  AlertTriangle,
  CheckCircle2,
  ArrowDownUp,
  RefreshCw,
  Box
} from "lucide-react";
import { toast } from "react-toastify";
import { GET_STOCKS_BY_SELLER_ID, UPDATE_STOCK } from "../../api/apiDetails";
import axiosInstance from "../../../utils/axiosInstance";

const Stocks = () => {

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editedQuantity, setEditedQuantity] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("title");
  const [sortDirection, setSortDirection] = useState("asc");
  const [refreshing, setRefreshing] = useState(false);
  const cdnURL = import.meta.env.VITE_AWS_CDN_URL;

  const fetchInventories = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(GET_STOCKS_BY_SELLER_ID);
      console.log("Fetched data:", data);
      setProducts(data.data);

    } catch (error) {
      console.error("Error fetching product listings:", error);
      toast.error(error.response?.data?.message || "Error in fetching inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, []);

  const handleEditClick = (product) => {
    setEditingId(product._id);
    setEditedQuantity(product.quantity.toString());
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedQuantity("");
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) { // Only allow numeric input
      setEditedQuantity(value);
    }
  };

  const handleSaveQuantity = async (productId) => {
    if (!editedQuantity || isNaN(editedQuantity)) {
      toast.error("Please enter a valid quantity");
      return;
    }
    try {
      setUpdatingId(productId);

      const { data } = await axiosInstance.put(`${UPDATE_STOCK}/${productId}`, { quantity: parseInt(editedQuantity) })

      // Update local state
      setProducts(products.map(product =>
        product._id === productId
          ? { ...product, quantity: parseInt(editedQuantity) }
          : product
      ));

      toast.success("Quantity updated successfully");
      setEditingId(null);
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Failed to update quantity");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInventories();
    setRefreshing(false);
    toast.success("Inventory refreshed");
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    product.quantity > 0

  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortField === "title") {
      return sortDirection === "asc"
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else if (sortField === "quantity") {
      return sortDirection === "asc"
        ? a.quantity - b.quantity
        : b.quantity - a.quantity;
    }
    return 0;
  });


  console.log(sortedProducts);


  return (
    <div className="bg-blackDark rounded-lg shadow-md md:p-6 transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-4">
        <div className="flex items-center gap-2">
          <Package2 className="text-newYellow" />
          <h2 className="text-xl font-bold text-whiteLight">Stock Inventory</h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            title="Refresh Stocks"
          >
            <RefreshCw
              size={18}
              className={`text-blue-500 ${refreshing ? "animate-spin" : "hover:text-blue-600"}`}
            />
          </button>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64 border bg-whiteLight rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <span className="bg-whiteLight text-blue-800 text-sm font-medium px-3 py-1 rounded-full whitespace-nowrap animate-fadeIn">
            {filteredProducts.length} Products
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={30} className="text-blue-500 animate-spin" />
            <p className="text-gray-600">Loading inventory...</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center p-8 text-gray-500 border border-dashed rounded-lg">
          <Box size={40} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">No products found in your inventory</p>
          <p className="mt-2">Add products to start managing your stock</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-blackDark">
          {/* Wrapper for sticky header and scrollable body */}
          <div className="relative max-h-[calc(100vh-250px)] overflow-y-auto"> {/* Adjust max-h as needed */}
            <table className="min-w-full divide-y divide-blackDark bg-blackDark">
              <thead>
                <tr className="bg-newYellow sticky top-0 z-10"> {/* Sticky header */}
                  <th className="p-3 text-left text-xs font-semibold text-primaryBlack uppercase tracking-wider">#</th>
                  <th className="p-3 text-left text-xs font-semibold text-primaryBlack uppercase tracking-wider">Image</th>
                  <th
                    className="p-3 text-left text-xs font-semibold text-primaryBlack uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-1">
                      Product
                      {sortField === "title" && (
                        <ArrowDownUp size={14} className={`transform ${sortDirection === "desc" ? "rotate-180" : ""} transition-transform`} />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3 text-left text-xs font-semibold text-primaryBlack uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort("quantity")}
                  >
                    <div className="flex items-center gap-1">
                      Quantity
                      {sortField === "quantity" && (
                        <ArrowDownUp size={14} className={`transform ${sortDirection === "desc" ? "rotate-180" : ""} transition-transform`} />
                      )}
                    </div>
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-primaryBlack uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-blackDark divide-y divide-gray-200">
                {sortedProducts.map((product, index) => (
                  <tr
                    key={product._id}
                    className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="p-3 whitespace-nowrap text-whiteLight">{index + 1}</td>
                    <td>
                      <div className="w-12 h-12 flex-shrink-0 overflow-hidden relative group">
                        {product?.images[0]?.key ? (
                          <img
                            src={product?.images[0]?.key ? `${cdnURL}${product.images[0].key}` : ""}
                            alt={product.title}
                            className="w-full h-full object-cover rounded-md transform group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-md">
                            <span className="text-xs text-gray-500">No image</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 max-w-[250px] w-[250px] text-whiteLight">
                      <div className="truncate font-medium hover:text-blue-600 transition-colors" title={product.title}>
                        {product.title}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {editingId === product._id ? (
                        <input
                          type="text"
                          value={editedQuantity}
                          onChange={handleQuantityChange}
                          className="w-24 px-2 py-1 border text-black bg-inputYellow font-bold rounded-md text-sm focus:ring-2 focus:ring-blue-500 animate-pulse "
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`
                              px-3 py-1.5 rounded-full text-sm flex items-center justify-center gap-1.5
                              w-20 /* Or another fixed width like w-24, or min-w-[Xrem] */
                              ${
                                product.quantity > 10
                                  ? 'bg-amber-100 text-green-800'
                                  : product.quantity > 5
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            `}
                          >
                            {product.quantity > 10 ? (
                              <CheckCircle2 size={14} />
                            ) : product.quantity <= 5 ? (
                              <AlertTriangle size={14} />
                            ) : (
                              <span className="w-[14px]" /> /* Placeholder for consistent spacing when no icon */
                            )}
                            <span className="font-medium">{product.quantity}</span>
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {editingId === product._id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveQuantity(product._id)}
                            disabled={updatingId === product._id}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 transition-all hover:shadow-md"
                          >
                            {updatingId === product._id ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Save size={14} />
                            )}
                            <span>Save</span>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 transition-all hover:shadow-md"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(product)}
                          className="bg-newYellow hover:bg-slate-300 text-white px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 transition-all hover:shadow-md hover:translate-y-px"
                        >
                          <Pencil size={14} className="text-blackDark" />
                          <span className="text-primaryBlack">Edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default Stocks;