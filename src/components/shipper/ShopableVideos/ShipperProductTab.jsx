import React, { useState, useEffect } from 'react';
import { generateSignedUrl } from '../../../utils/aws'; // Adjust path
import ImageWithSignedUrlShow from '../../../utils/ShowImage'; // Adjust path
import { Trash, PlusCircle, Info, Search, ChevronUp, ChevronDown, Percent } from "lucide-react"; // Use ChevronUp/Down for visual cue potentially
import { GET_PRODUCTS_BY_DROPSHIPPER } from '../../api/apiDetails'; // Adjust path
import axiosInstance from '../../../utils/axiosInstance'; // Adjust path

const ProductTabShopaAble = ({ onSelectProducts, initialSelectedProducts = [] }) => {
  // State to hold the grouped structure { sellerInfo, products[] }
  const [groupedProducts, setGroupedProducts] = useState([]);
  // State to hold currently selected product IDs (flat array)
  const [selectedProducts, setSelectedProducts] = useState(initialSelectedProducts);
  // State to hold the *filtered* grouped structure for display
  const [availableGroupedProducts, setAvailableGroupedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  // --- NEW STATE for Accordion ---
  const [openSellerId, setOpenSellerId] = useState(null); // Stores the ID of the currently open seller accordion

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Effect to filter and structure available products
  useEffect(() => {
    // Keep setIsLoading(true) here if fetchProducts doesn't handle it initially
    // setIsLoading(true); // Set loading before filtering starts

    const query = searchQuery.toLowerCase();

    const filteredAndGrouped = groupedProducts
      .map(group => {
        const availableProdsInGroup = group.products.filter(p => {
          const isSelected = selectedProducts.includes(p._id);
          if (isSelected) return false;
          if (!query) return true;
          return (
            p.title?.toLowerCase().includes(query) ||
            p.category?.toLowerCase().includes(query) ||
            p.subcategory?.toLowerCase().includes(query)
          );
        });

        if (availableProdsInGroup.length > 0) {
          return {
            ...group,
            products: availableProdsInGroup
          };
        }
        return null;
      })
      .filter(group => group !== null);

    setAvailableGroupedProducts(filteredAndGrouped);
    // Set loading false only after filtering is done
    // Consider setting isLoading false in fetchProducts's finally block
    // if initial load time is significant
    // setIsLoading(false); // Moved loading set to false inside fetchProducts finally block

  }, [groupedProducts, selectedProducts, searchQuery]);


  // Fetch and process grouped products
  const fetchProducts = async () => {
    setIsLoading(true); // Set loading true at the start of fetch
    setGroupedProducts([]); // Clear previous results
    setAvailableGroupedProducts([]); // Clear available products
    try {
      const { data } = await axiosInstance.get(GET_PRODUCTS_BY_DROPSHIPPER);
      if (data.status && Array.isArray(data.data)) {
        const processedGroups = await Promise.all(
          data.data.map(async (group) => {
            const productsWithImages = await Promise.all(
              (group.products || []).map(async (product) => {
                const firstImageKey = Array.isArray(product.images) && product.images.length > 0 ? product.images[0]?.key || product.images[0] : null;
                return {
                  ...product,
                  imageUrl: firstImageKey ? await generateSignedUrl(firstImageKey).catch(() => null) : null,
                }
              })
            );
            return { ...group, products: productsWithImages };
          })
        );
        setGroupedProducts(processedGroups);
        // Optionally open the first seller if results exist
        if (processedGroups.length > 0) {
          // setOpenSellerId(processedGroups[0].sellerInfo._id); // Uncomment to default open first seller
        }
      } else {
        console.error("Invalid data structure received:", data);
        setGroupedProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setGroupedProducts([]);
    } finally {
      // Set loading false after fetch and processing is complete
      setIsLoading(false);
    }
  };

  // --- Accordion Toggle Handler ---
  const toggleSellerAccordion = (sellerId) => {
    setOpenSellerId(prevId => prevId === sellerId ? null : sellerId); // Toggle: close if already open, otherwise open the new one
  };

  // Select a product
  const handleProductSelect = (e, productId) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent accordion toggle on button click
    if (!selectedProducts.includes(productId)) {
      setSelectedProducts(prev => [...prev, productId]);
    }
  };

  // Remove a selected product
  const handleProductRemove = (e, productId) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent accordion toggle if needed
    setSelectedProducts(prev => prev.filter(id => id !== productId));
  };

  // Confirm selection
  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectProducts(selectedProducts);
  };

  const handleSearchChange = (e) => {
    e.stopPropagation();
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Calculate total available count
  const totalAvailableCount = availableGroupedProducts.reduce((sum, group) => sum + group.products.length, 0);

  // Get full product details for selected items
  const selectedProductDetails = selectedProducts.map(id => {
    for (const group of groupedProducts) { // Search in original full list
      const product = group.products.find(p => p._id === id);
      if (product) return product;
    }
    return null;
  }).filter(p => p !== null);


  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 w-full" onClick={e => e.stopPropagation()}>
      {/* Stats Bar */}
      <h1 className="text-xl md:text-2xl text-newBlack font-bold mb-4">Add Products to Your Show</h1>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg shadow-sm text-center">
          <div className="text-sm text-blue-800 font-bold">Available</div>
          <div className="text-2xl font-bold text-blue-600">{totalAvailableCount}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg shadow-sm text-center">
          <div className="text-sm text-purple-800 font-bold">Selected</div>
          <div className="text-2xl font-bold text-purple-600">{selectedProducts.length}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search products by name, category..."
            className="w-full p-3 pl-10 border text-newBlack bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            value={searchQuery}
            onChange={handleSearchChange}
            onClick={e => e.stopPropagation()}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </form>
      </div>

      {/* === Available Products Section (Accordion) === */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-2 flex items-center text-gray-700">
          Available Products
          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
            {totalAvailableCount}
          </span>
        </h3>

        {/* Container for Accordions */}
        <div className="border border-gray-200 rounded-lg bg-gray-50 h-72 overflow-y-auto p-2 space-y-2"> {/* Added padding & spacing */}
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <span className="loading loading-spinner text-primary loading-lg"></span>
            </div>
          ) : availableGroupedProducts.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-gray-500 p-4 text-center">
              <Info size={32} className="text-gray-400 mb-2" />
              <p className="font-semibold">No Products Found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery ? 'Try adjusting your search criteria.' : 'No products available from connected sellers.'}
              </p>
            </div>
          ) : (
            // --- Accordion Loop ---
            availableGroupedProducts.map(group => (
              // Apply collapse-open dynamically based on state
              <div
                key={group.sellerInfo._id}
                // Use tabIndex for accessibility if not using radio/checkbox input method
                tabIndex={0}
                className={`collapse collapse-arrow border border-base-300 bg-base-100 rounded-md shadow-sm ${openSellerId === group.sellerInfo._id ? 'collapse-open' : 'collapse-close'}`}
              >
                {/* Title part of the accordion */}
                <div
                  className="collapse-title text-md font-medium cursor-pointer flex justify-between items-center"
                  onClick={() => toggleSellerAccordion(group.sellerInfo._id)} // Toggle this specific accordion
                >
                  <span>{group.sellerInfo.companyName || group.sellerInfo.userInfo?.name || 'Unknown Seller'}</span>
                  <span className="badge badge-ghost badge-sm">{group.products.length} items</span>
                </div>
                {/* Content part of the accordion */}
                <div className="collapse-content !p-0"> {/* Remove default padding */}
                  {/* Product Table for this Seller */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto text-sm">
                      {/* No thead needed inside each collapse usually */}
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {group.products.map((product) => (
                          <tr key={product._id} className="hover:bg-gray-50">
                            {/* Image */}
                            <td className="px-3 py-2 whitespace-nowrap w-20">
                              <ImageWithSignedUrlShow
                                imageKey={Array.isArray(product.images) && product.images.length > 0 ? product.images[0]?.key || product.images[0] : null}
                                imageUrl={product.imageUrl}
                                altText={product.title}
                                className="w-14 h-14 object-cover rounded-md shadow-sm"
                              />
                            </td>
                            {/* Details */}
                            <td className="px-3 py-2">
                              <div className="font-medium text-gray-800 truncate w-40" title={product.title}>{product.title}</div>
                              <div className="text-xs text-gray-500">{product.category} / {product.subcategory}</div>
                            </td>
                            {/* Price */}
                            <td className="px-3 py-2 whitespace-nowrap w-28">
                              <div className="font-semibold text-green-600">₹{product.productPrice}</div>
                              {(product.startingPrice || product.reservedPrice) && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {product.startingPrice && `Start: ₹${product.startingPrice}`}
                                  {product.reservedPrice && ` | Res: ₹${product.reservedPrice}`}
                                </div>
                              )}
                            </td>
                            {/* Stock */}
                            <td className="px-3 py-2 whitespace-nowrap w-20">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${product.quantity > 10 ? 'bg-green-100 text-green-800' : product.quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                {product.quantity} units
                              </span>
                            </td>
                            {/* Commission */}
                            <td className="px-3 py-2 whitespace-nowrap w-20 text-center">
                              <span className={`badge badge-success badge-outline badge-sm ${!product.commissionRate ? 'badge-ghost' : ''}`}>
                                {product.commissionRate ?? '--'}<Percent size={12} className='mr-0.5' />
                              </span>
                            </td>
                            {/* Action */}
                            <td className="px-3 py-2 whitespace-nowrap text-right w-24">
                              <button
                                className="btn btn-xs btn-primary btn-outline flex items-center gap-1"
                                onClick={(e) => handleProductSelect(e, product._id)}
                              >
                                <PlusCircle size={14} /> Add
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div> {/* End collapse-content */}
              </div> // End collapse div
            ))
            // --- End Accordion Loop ---
          )}
        </div>
      </div>
      {/* === End Available Products Section === */}


      {/* === Selected Products Section (Remains mostly the same) === */}
      {selectedProducts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-2 flex items-center text-gray-700">
            Selected Products
            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
              {selectedProducts.length}
            </span>
          </h3>
          <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden h-60 overflow-y-auto">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-sm">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr className="bg-gray-600 text-white">
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Image</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Product Details</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Price</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Stock</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Commission Rate</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {selectedProductDetails.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap w-20">
                        <ImageWithSignedUrlShow
                          imageKey={Array.isArray(product.images) && product.images.length > 0 ? product.images[0]?.key || product.images[0] : null}
                          imageUrl={product.imageUrl}
                          altText={product.title}
                          className="w-14 h-14 object-cover rounded-md shadow-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-800 truncate w-40" title={product.title}>{product.title}</div>
                        <div className="text-xs text-gray-500">{product.category} / {product.subcategory}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap w-28">
                        <div className="font-semibold text-green-600">₹{product.productPrice}</div>
                        {(product.startingPrice || product.reservedPrice) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {product.startingPrice && `Start: ₹${product.startingPrice}`}
                            {product.reservedPrice && ` | Res: ₹${product.reservedPrice}`}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap w-20">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${product.quantity > 10 ? 'bg-green-100 text-green-800' : product.quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {product.quantity} units
                        </span>
                      </td>
                      {/* --- ADDED Commission Rate Display --- */}
                      <td className="px-3 py-2 whitespace-nowrap w-20 text-center">
                        {/* Access commissionRate from the product object in selected state */}
                        <span className={`badge badge-sm font-medium ${(product?.commissionRate ?? 0) > 0 ? 'badge-success badge-outline' : 'badge-ghost'}`}>
                          {product?.commissionRate ?? '--'}<Percent size={12} className='mr-0.5' />
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right w-24">
                        <button
                          className="btn btn-xs btn-error btn-outline flex items-center gap-1"
                          onClick={(e) => handleProductRemove(e, product._id)}
                        >
                          <Trash size={14} /> Remove
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
      {/* === End Selected Products Section === */}

      <div className="h-px bg-gray-200 my-6"></div>

      {/* Submit Button */}
      <div className="flex justify-end items-center">
        <button
          className={`btn btn-primary ${selectedProducts.length === 0 ? 'btn-disabled' : ''}`}
          onClick={handleSubmit}
          disabled={selectedProducts.length === 0}
        >
          Confirm Selection ({selectedProducts.length})
        </button>
      </div>
    </div>
  );
};

export default ProductTabShopaAble;