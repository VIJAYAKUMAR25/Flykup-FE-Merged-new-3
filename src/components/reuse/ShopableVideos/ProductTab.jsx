// import React, { useState, useEffect, useMemo } from 'react';
// import { ChevronDown, Trash, PlusCircle, Info, Search } from "lucide-react";
// import { GET_PRODUCTS_BY_SELLER_ID } from '../../api/apiDetails'; // Make sure this path is correct
// import axiosInstance from '../../../utils/axiosInstance'; // Make sure this path is correct

// const ProductTabShopaAble = ({ initialSelected, onSelectProducts }) => {
//   const [products, setProducts] = useState([]); // All products fetched from API
//   const [selectedProducts, setSelectedProducts] = useState([]); // IDs of selected products
//   const [availableProducts, setAvailableProducts] = useState([]); // Full product objects available for selection
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isLoading, setIsLoading] = useState(true);

//   const cdnURL = import.meta.env.VITE_AWS_CDN_URL;

//   // Effect to fetch all products for the seller
//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   // Effect to synchronize the internal selectedProducts state with the initialSelected prop from parent
//   useEffect(() => {
//     if (initialSelected) {
//       setSelectedProducts(initialSelected);
//     } else {
//       setSelectedProducts([]);
//     }
//   }, [initialSelected]);

//   // Effect to determine available products based on all products, selected products, and search query
//   // This list (`availableProducts`) is for the "Available Products" table.
//   useEffect(() => {
//     const filteredOutSelected = products.filter(p => !selectedProducts.includes(p._id));

//     if (searchQuery) {
//       const query = searchQuery.toLowerCase();
//       setAvailableProducts(
//         filteredOutSelected.filter(p =>
//           p.title.toLowerCase().includes(query) ||
//           (p.category && p.category.toLowerCase().includes(query)) ||
//           (p.subcategory && p.subcategory.toLowerCase().includes(query))
//         )
//       );
//     } else {
//       setAvailableProducts(filteredOutSelected);
//     }
//   }, [products, selectedProducts, searchQuery]);

//   // --- Logic for accurate progress bar ---
//   const productsMatchingSearchQuery = useMemo(() => {
//     if (!products) return [];
//     if (!searchQuery) return products; // If no search, all products are in scope for progress
//     const query = searchQuery.toLowerCase();
//     return products.filter(p =>
//       p.title.toLowerCase().includes(query) ||
//       (p.category && p.category.toLowerCase().includes(query)) ||
//       (p.subcategory && p.subcategory.toLowerCase().includes(query))
//     );
//   }, [products, searchQuery]);

//   const totalProductsInScope = useMemo(() => {
//     return productsMatchingSearchQuery.length;
//   }, [productsMatchingSearchQuery]);

//   const selectedProductsInScopeCount = useMemo(() => {
//     if (!productsMatchingSearchQuery || !selectedProducts) return 0;
//     // Count how many of the products matching the search are actually selected
//     return productsMatchingSearchQuery.filter(p => selectedProducts.includes(p._id)).length;
//   }, [productsMatchingSearchQuery, selectedProducts]);
//   // --- End: Logic for accurate progress bar ---

//   const fetchProducts = async () => {
//     setIsLoading(true);
//     try {
//       const { data } = await axiosInstance.get(GET_PRODUCTS_BY_SELLER_ID);
//       if (data && data.status && Array.isArray(data.data)) {
//         setProducts(data.data);
//       } else {
//         setProducts([]);
//         console.error("Error fetching products: Invalid data structure", data);
//       }
//     } catch (error) {
//       console.error("Error fetching products:", error);
//       setProducts([]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleProductSelect = (e, productId) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setSelectedProducts(prev => [...prev, productId]);
//   };

//   const handleProductRemove = (e, productId) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setSelectedProducts(prev => prev.filter(id => id !== productId));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     onSelectProducts(selectedProducts);
//   };

//   const handleSearchChange = (e) => {
//     e.stopPropagation();
//     setSearchQuery(e.target.value);
//   };

//   const handleSearchSubmit = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     // Search is handled by useEffect reacting to searchQuery change
//   };

//   const getProductById = (id) => products.find(p => p._id === id);

//   return (
//     <div className="bg-newYellow rounded-lg shadow-lg p-6 w-full" onClick={e => e.stopPropagation()}>
//       <h1 className="text-2xl text-blackDark font-bold mb-2">Product Selection</h1>
      
//       {/* Progress Bar Section - Corrected */}
//       <div className="bg-white p-4 rounded-lg border mb-4">
//         <div className="flex justify-between items-center mb-2">
//           <span className="text-sm font-medium text-gray-700">Product Selection Progress</span>
//           <span className="text-sm text-gray-500">
//             {selectedProductsInScopeCount} of {totalProductsInScope}
//           </span>
//         </div>
//         <div className="w-full bg-gray-200 rounded-full h-3">
//           <div
//             className="bg-blue-500 h-3 rounded-full transition-all duration-300"
//             style={{ width: totalProductsInScope > 0 ? `${(selectedProductsInScopeCount / totalProductsInScope) * 100}%` : '0%' }}
//           ></div>
//         </div>
//         <div className="flex justify-between mt-2 text-xs text-gray-500">
//           <span>0</span>
//           <span>{totalProductsInScope}</span>
//         </div>
//       </div>

//       <div className="mb-3">
//         <form onSubmit={handleSearchSubmit} className="relative">
//           <input
//             type="text"
//             placeholder="Search by name, category, or subcategory..."
//             className="w-full p-3 pl-10 border text-newBlack bg-newWhite border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
//             value={searchQuery}
//             onChange={handleSearchChange}
//             onClick={e => e.stopPropagation()}
//           />
//           <Search className="absolute left-3 top-3 text-gray-400" size={20} />
//         </form>
//       </div>

//       {/* Available Products Section */}
//       <div className="mb-6">
//         <h3 className="text-lg font-bold mb-2 flex items-center text-gray-800">
//           <span>Available Products</span>
//           <div className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
//             {availableProducts.length} {/* This count is correct for the list below */}
//           </div>
//         </h3>
//         <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
//           <div className="h-64 overflow-y-auto overflow-x-auto">
//             {isLoading ? (
//               <div className="flex justify-center items-center h-full">
//                 <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
//               </div>
//             ) : availableProducts.length === 0 ? (
//               <div className="flex flex-col justify-center items-center h-full text-gray-500 p-4">
//                 <Info size={32} className="text-gray-400" />
//                 <p className="mt-2">No products available {searchQuery ? 'for your search' : 'to add'}</p>
//                 {searchQuery && (
//                   <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
//                 )}
//               </div>
//             ) : (
//               <div className="min-w-full">
//                 <table className="min-w-full table-auto">
//                   <thead className="bg-gray-100 sticky top-0 z-10">
//                     <tr className="bg-newBlack text-white">
//                       <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Image</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Product Details</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Price</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Stock</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Action</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200 bg-white">
//                     {availableProducts.map((product) => (
//                       <tr key={product._id} className="hover:bg-gray-50">
//                         <td className="px-4 py-3 whitespace-nowrap">
//                           <img
//                             src={product.images && product.images[0] && product.images[0].key ? `${cdnURL}${product.images[0].key}` : "/placeholder-image.png"}
//                             alt={product.title}
//                             className="w-16 h-16 object-cover rounded-md shadow-sm"
//                           />
//                         </td>
//                         <td className="px-4 py-3">
//                           <div>
//                             <div className="max-w-[150px] w-[150px] text-primaryBlack">
//                               <div className="truncate">{product.title}</div>
//                             </div>
//                             <div className="text-sm text-gray-500">{product.category} / {product.subcategory}</div>
//                           </div>
//                         </td>
//                         <td className="px-4 py-3 whitespace-nowrap">
//                           <div className="font-semibold text-blue-600">₹{product.productPrice}</div>
//                           <div className="text-xs text-gray-500">
//                             Start: ₹{product.startingPrice} | Reserve: ₹{product.reservedPrice}
//                           </div>
//                         </td>
//                         <td className="px-4 py-3 whitespace-nowrap">
//                           <div className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
//                             {product.quantity} units
//                           </div>
//                         </td>
//                         <td className="px-4 py-3 whitespace-nowrap">
//                           <button
//                             className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm"
//                             onClick={(e) => handleProductSelect(e, product._id)}
//                           >
//                             <PlusCircle size={16} className="mr-1" /> Add
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Selected Products Section */}
//       {selectedProducts.length > 0 && (
//         <div className="mb-6">
//           <h3 className="text-lg font-bold mb-2 flex items-center text-gray-800">
//             <span>Selected Products</span>
//             <div className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
//               {selectedProducts.length} {/* This count is correct for the list below */}
//             </div>
//           </h3>
//           <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
//             <div className="h-64 overflow-y-auto overflow-x-auto">
//               <div className="min-w-full">
//                 <table className="min-w-full table-auto">
//                   <thead className="bg-gray-100 sticky top-0 z-10">
//                     <tr className="bg-newBlack text-white">
//                       <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Image</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Product Details</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Price</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Stock</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Action</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200 bg-white">
//                     {selectedProducts.map((productId) => {
//                       const product = getProductById(productId);
//                       return product ? (
//                         <tr key={productId} className="hover:bg-gray-50">
//                           <td className="px-4 py-3 whitespace-nowrap">
//                             <img
//                               src={product.images && product.images[0] && product.images[0].key ? `${cdnURL}${product.images[0].key}` : "/placeholder-image.png"}
//                               alt={product.title}
//                               className="w-16 h-16 object-cover rounded-md shadow-sm"
//                             />
//                           </td>
//                           <td className="px-4 py-3">
//                             <div>
//                               <div className="max-w-[150px] w-[150px] text-primaryBlack">
//                                 <div className="truncate">{product.title}</div>
//                               </div>
//                               <div className="text-sm text-gray-500">{product.category} / {product.subcategory}</div>
//                             </div>
//                           </td>
//                           <td className="px-4 py-3 whitespace-nowrap">
//                             <div className="font-semibold text-blue-600">₹{product.productPrice}</div>
//                             <div className="text-xs text-gray-500">
//                               Start: ₹{product.startingPrice} | Reserve: ₹{product.reservedPrice}
//                             </div>
//                           </td>
//                           <td className="px-4 py-3 whitespace-nowrap">
//                             <div className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
//                               {product.quantity} units
//                             </div>
//                           </td>
//                           <td className="px-4 py-3 whitespace-nowrap">
//                             <button
//                               className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center text-sm"
//                               onClick={(e) => handleProductRemove(e, productId)}
//                             >
//                               <Trash size={16} className="mr-1" /> Remove
//                             </button>
//                           </td>
//                         </tr>
//                       ) : null;
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="h-px bg-gray-200 my-4"></div>

//       {/* Confirm Button Section */}
//       <div className="flex justify-between items-center">
//         <div className="text-sm text-gray-600">
//           {selectedProducts.length} products selected
//         </div>
//         <button
//           className={`px-4 py-2 rounded-md font-bold transition-colors flex items-center ${
//             selectedProducts.length === 0 || isLoading // Disable if no products selected or if still loading overall
//               ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
//               : 'bg-newBlack text-newYellow hover:bg-newWhite hover:text-purple-700'
//           }`}
//           onClick={handleSubmit}
//           disabled={isLoading || selectedProducts.length === 0}
//         >
//           Confirm Selection ({selectedProducts.length})
//         </button>
//       </div>
//     </div>
//   );
// };
// ProductTabShopaAble.jsx



import React, { useState, useEffect, useMemo ,useRef} from 'react';
import { Trash, PlusCircle, Info, Search, Loader2, CheckCircle, Package, X, Filter } from "lucide-react";
import { GET_PRODUCTS_BY_SELLER_ID } from '../../api/apiDetails';
import axiosInstance from '../../../utils/axiosInstance';

const ProductTabShopaAble = ({ initialSelected, onSelectProducts, selectedCategory }) => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const isInitialMount = useRef(true);
  const cdnURL = import.meta.env.VITE_AWS_CDN_URL;



 useEffect(() => {
    fetchProducts();
  }, []);

  // Effect to handle initial selected products based on category and fetched products
  useEffect(() => {
    if (!initialSelected || initialSelected.length === 0 || !selectedCategory || products.length === 0) {
      setSelectedProducts([]);
      return;
    }

    const validSelected = initialSelected.filter(id => {
      const product = products.find(p => p._id === id);
      return product?.category === selectedCategory;
    });

    setSelectedProducts(validSelected);
  }, [initialSelected, selectedCategory, products]);

  useEffect(() => {
    if (!selectedCategory) {
      setAvailableProducts([]);
      return;
    }

    const categoryProducts = products.filter(p => p.category === selectedCategory);
    const filteredOutSelected = categoryProducts.filter(p => !selectedProducts.includes(p._id));

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      setAvailableProducts(
        filteredOutSelected.filter(p =>
          p.title.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(query)) ||
          (p._id && p._id.toLowerCase().includes(query))
        )
      );
    } else {
      setAvailableProducts(filteredOutSelected);
    }
  }, [products, selectedProducts, searchQuery, selectedCategory]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.get(GET_PRODUCTS_BY_SELLER_ID);
      if (data && data.status && Array.isArray(data.data)) {
        setProducts(data.data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleProductSelect = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProducts(prev => [...prev, productId]);
  };

  const handleProductRemove = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProducts(prev => prev.filter(id => id !== productId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isConfirming || selectedProducts.length === 0) return;

    setIsConfirming(true);
    try {
      await onSelectProducts(selectedProducts);
    } catch (error) {
      console.error("Error during product selection confirmation:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const getProductById = (id) => products.find(p => p._id === id);

  const clearSearch = () => setSearchQuery('');

  return (
    <div className="bg-blackDark rounded-2xl mt-10 shadow-xl p-1 sm:p-4 lg:p-4 w-full max-w-full mx-auto" onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div className="mb-1"> 
        <h1 className="text-2xl sm:text-2xl lg:text-3xl font-bold text-newYellow mb-1 flex items-center gap-3"> 
          <Package className="w-8 h-8 text-whiteLight" />
          Product Selection Hub
        </h1>
        <p className="text-whiteLight text-sm sm:text-base">Select products from your inventory to proceed</p>
      </div>

      {/* Enhanced Category Indicator */}
      <div className="mb-4 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"> 
        
        {!selectedCategory && (
          <div className="p-4 bg-red-50 border-t border-red-100">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 font-medium">
                Please select a category in the form above to view and select products.
              </p>
            </div>
          </div>
        )}
      </div>

      {selectedCategory && (
        <>
          {/* Enhanced Available Products Section */}
          <div className="mb-4"> {/* Adjusted mb-4 from mb-2 for consistency */}
            <div className="bg-blackLight rounded-2xl shadow-lg  overflow-hidden">
              {/* Header with Search */}
              {/* Adjusted padding: p-3 sm:p-4 */}
              <div className="bg-greyLight p-2 sm:p-2">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"> {/* Adjusted gap from gap-1 */}
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-blackDark" />
                    </div>
                    <div>
                      <p className="text-whiteHalf text-sm">Browse and select from <span className='text-greenLight'>{selectedCategory}</span> category</p>
                    </div>
                  </div>
                  
                  {/* Responsive Search Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-80">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search by name, description, ID..."
                        className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-whiteLight placeholder-gray-500 bg-blackDark"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          onClick={clearSearch}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors"
                        >
                          <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>
                    
                    {/* Search Results Counter */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {searchQuery && (
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-semibold">
                          {availableProducts.length} found
                        </div>
                      )}
                      <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-semibold">
                        {availableProducts.length} available
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Content */}
              <div className="p-1 sm:p-6">
                <div className="rounded-xl bg-blackDark border border-gray-200 overflow-hidden">
                  <div className="h-80 sm:h-96 overflow-y-auto">
                    {isLoading ? (
                      <div className="flex flex-col justify-center items-center h-full text-gray-500 p-8">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-lg font-medium text-center">Loading {selectedCategory} products...</p>
                        <p className="text-sm text-gray-400 text-center mt-2">Please wait while we fetch your inventory</p>
                      </div>
                    ) : availableProducts.length === 0 ? (
                      <div className="flex flex-col justify-center items-center h-full text-gray-500 p-8">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                          <Info size={32} className="text-gray-400" />
                        </div>
                        <p className="text-lg font-medium text-center mb-2">
                          {searchQuery ? `No products match your search in ${selectedCategory}` : `No products available in ${selectedCategory}`}
                        </p>
                        {searchQuery ? (
                          <div className="text-center">
                            <p className="text-sm text-gray-400 mb-3">Try adjusting your search criteria</p>
                            <button
                              onClick={clearSearch}
                              className="bg-newYellow hover:bg-amber-400 text-blackDark px-4 py-2 rounded-full text-sm font-medium transition-colors"
                            >
                              Clear search filter
                            </button>
                          </div>
                        ) : (
                          products.filter(p => p.category === selectedCategory).length > 0 && (
                            <p className="text-sm text-gray-400 mt-2 text-center">All products from this category might have been selected.</p>
                          )
                        )}
                      </div>
                    ) : (
                     <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="min-w-full table-auto">
                      {/* Sticky header for available products */}
                      <thead className="bg-newYellow sticky top-0 z-10 border-b border-gray-300">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-blackDark uppercase tracking-wider">Image</th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-blackDark uppercase tracking-wider">Product Details</th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-blackDark uppercase tracking-wider hidden sm:table-cell">Pricing</th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-blackDark uppercase tracking-wider hidden lg:table-cell">Stock</th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-blackDark uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-blackLight">
                        {availableProducts.map((product) => (
                          <tr key={product._id} className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer">
                            <td className="px-3 sm:px-6 py-2">
                              <img
                                src={product.images && product.images[0] && product.images[0].key ? `${cdnURL}${product.images[0].key}` : "/placeholder-image.png"}
                                alt={product.title}
                                className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg shadow-md border border-gray-200"
                              />
                            </td>
                            <td className="px-3 sm:px-6 py-2">
                              <div className="max-w-xs">
                                <div className="font-semibold text-newYellow text-sm sm:text-base mb-1 truncate">
                                  {product.title}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md inline-block">
                                  {product.category} • {product.subcategory}
                                </div>
                                {/* Show pricing on mobile */}
                                <div className="sm:hidden mt-2">
                                  <div className="font-bold text-green-600 text-sm">₹{product.productPrice}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                              <div className="space-y-1">
                                <div className="font-bold text-green-600 text-lg">₹{product.productPrice}</div>
                                <div className="text-xs text-gray-500 space-y-0.5">
                                  <div>Starting: ₹{product.startingPrice}</div>
                                  <div>Reserve: ₹{product.reservedPrice}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                                {product.quantity} units
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4">
                              <button
                                className="inline-flex items-center px-3 sm:px-4 py-2 bg-newYellow text-blackDark rounded-full hover:bg-blackDark hover:text-newYellow transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm"
                                onClick={(e) => handleProductSelect(e, product._id)}
                                disabled={isConfirming}
                              >
                                <PlusCircle size={16} className="mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Add </span>
                                <span className="sm:hidden">Add</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Selected Products Section */}
          {selectedProducts.length > 0 && (
            <div className="mb-1"> {/* Adjusted mb-4 from mb-2 for consistency */}
              <div className="bg-blackDark rounded-2xl shadow-lg  overflow-hidden">
                {/* Adjusted padding: p-3 sm:p-4 */}
                <div className="bg-blackLight p-2 sm:p-4 ">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blackDark rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-whiteLight">Selected Products</h3>
                        <p className="text-gray-300 text-sm">Products ready for confirmation</p>
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                      {selectedProducts.length} selected
                    </div>
                  </div>
                </div>
                
             <div className="p-1 sm:p-6">
                  <div className="rounded-xl bg-blackLight  overflow-hidden">
                    <div className="h-80 sm:h-96 overflow-y-auto overflow-x-auto">
                      <table className="min-w-full table-auto">
                        {/* Sticky header for selected products */}
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-gradient-to-r from-green-700 to-green-800 text-white">
                            <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Image</th>
                            <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Product Details</th>
                            <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider hidden sm:table-cell">Pricing</th>
                            <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider hidden lg:table-cell">Stock</th>
                            <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y  ">
                          {selectedProducts.map((productId) => {
                            const product = getProductById(productId);
                            return product ? (
                              <tr key={productId} className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer">
                                <td className="px-3 sm:px-6 py-2">
                                  <img
                                    src={product.images && product.images[0] && product.images[0].key ? `${cdnURL}${product.images[0].key}` : "/placeholder-image.png"}
                                    alt={product.title}
                                    className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg shadow-md border border-gray-200"
                                  />
                                </td>
                                <td className="px-3 sm:px-6 py-2">
                                  <div className="max-w-xs">
                                    <div className="font-semibold text-newYellow text-sm sm:text-base mb-1 truncate">
                                      {product.title}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md inline-block">
                                      {product.category} • {product.subcategory}
                                    </div>
                                    {/* Show pricing on mobile */}
                                    <div className="sm:hidden mt-2">
                                      <div className="font-bold text-green-600 text-sm">₹{product.productPrice}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-2 hidden sm:table-cell">
                                  <div className="space-y-1">
                                    <div className="font-bold text-green-600 text-lg">₹{product.productPrice}</div>
                                    <div className="text-xs text-whiteHalf space-y-0.5">
                                      <div>Starting: ₹{product.startingPrice}</div>
                                      <div>Reserve: ₹{product.reservedPrice}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-2 hidden lg:table-cell">
                                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                                    {product.quantity} units
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-2">
                                  <button
                                    className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm"
                                    onClick={(e) => handleProductRemove(e, productId)}
                                    disabled={isConfirming}
                                  >
                                    <Trash size={16} className="" />
                                  </button>
                                </td>
                              </tr>
                            ) : null;
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Enhanced Divider */}
      <div className="bg-gradient-to-r from-transparent via-gray-300 to-transparent h-px my-2"></div>

      {/* Enhanced Footer Section */}
      <div className="bg-blackLight rounded-2xl p-4 sm:p-6 lg:p-3 border border-gray-200 shadow-lg"> {/* Adjusted padding for consistency */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-newYellow" />
              </div>
              <div>
                <div className="text-xl sm:text-xl font-bold text-whiteLight">
                  <span className='text-greenLight'>{selectedProducts.length}</span> Products Selected
                </div>
                <div className="text-sm text-whiteHalf">
                  {selectedProducts.length > 0 ? "Ready to proceed with your selection" : "No products selected yet"}
                </div>
              </div>
            </div>
          </div>
          
          <button
            className={`inline-flex items-center justify-center px-4 sm:px-8 py-2 sm:py-2 rounded-full font-bold transition-all duration-200 text-base sm:text-lg min-w-full sm:min-w-[280px] lg:min-w-[280px] ${
              !selectedCategory || selectedProducts.length === 0 || isLoading || isConfirming
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blackDark text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
            onClick={handleSubmit}
            disabled={!selectedCategory || isLoading || selectedProducts.length === 0 || isConfirming}
          >
            {isConfirming ? (
              <>
                <Loader2 size={24} className="animate-spin mr-3" />
                Processing Selection...
              </>
            ) : (
              <>
                <CheckCircle size={24} className="mr-3" />
                Confirm Selection ({selectedProducts.length})
              </>
            )}
          </button>
        </div>
        
        {selectedProducts.length === 0 && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center gap-2 text-blackDark bg-whiteLight px-4 py-2 rounded-lg">
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">
                {!selectedCategory ? "Please select a category first" : "Select at least one product to continue"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTabShopaAble;