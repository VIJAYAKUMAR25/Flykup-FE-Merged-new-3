import React, { useState, useEffect } from 'react'; // Added React import
import { ShoppingCart, Hammer, Gift } from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from '../../../utils/axiosInstance'; // Adjust path
import { GET_PRODUCTS_BY_DROPSHIPPER } from '../../api/apiDetails'; // Adjust path
import { generateSignedUrl } from '../../../utils/aws'; // Adjust path

// --- Import the new components ---
import ProductSelectionList from './ProductSelectionList'; // Adjust path
import SelectedProductList from './SelectedProductList'; // Adjust path
// --- End Imports ---


const ProductTab = ({ onSelectProducts, initialSelectedProducts = { buyNow: [], auction: [], giveaway: [] } }) => {
  // State for the *full* list of fetched, grouped products
  const [groupedProducts, setGroupedProducts] = useState([]);
  // State for the currently active tab
  const [activeTab, setActiveTab] = useState("buyNow"); // 'buyNow', 'auction', 'giveaway'
  // State for the *selected* products, keyed by type
  const [selectedProducts, setSelectedProducts] = useState(initialSelectedProducts);
  // State for validation errors within selected product inputs
  const [validationErrors, setValidationErrors] = useState({});
  // State for search query
  const [searchQuery, setSearchQuery] = useState('');
  // State for accordion management
  const [openSellerId, setOpenSellerId] = useState(null);
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  // Filtered available products (grouped)
  const [availableGroupedProducts, setAvailableGroupedProducts] = useState([]);


  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);


  // --- Combined useEffect for Filtering Available Products ---
  useEffect(() => {
    // Don't filter if initial data isn't loaded yet
    if (isLoading && groupedProducts.length === 0) return;

    const query = searchQuery.toLowerCase();
    // Get a flat list of all currently selected product IDs across all tabs
    const allSelectedIds = [
      ...selectedProducts.buyNow.map(p => p.productId),
      ...selectedProducts.auction.map(p => p.productId),
      ...selectedProducts.giveaway.map(p => p.productId)
    ];

    const filteredAndGrouped = groupedProducts
      .map(group => {
        const availableProdsInGroup = group.products.filter(p => {
          const isSelected = allSelectedIds.includes(p._id);
          if (isSelected) return false; // Exclude if selected in *any* tab

          if (!query) return true; // Include if no search query

          return (
            p.title?.toLowerCase().includes(query) ||
            p.category?.toLowerCase().includes(query) ||
            p.subcategory?.toLowerCase().includes(query)
          );
        });

        if (availableProdsInGroup.length > 0) {
          return { ...group, products: availableProdsInGroup };
        }
        return null;
      })
      .filter(group => group !== null);

    setAvailableGroupedProducts(filteredAndGrouped);

    // If filtering causes the open accordion group to disappear, close the accordion
    if (openSellerId && !filteredAndGrouped.some(g => g.sellerInfo._id === openSellerId)) {
      setOpenSellerId(null);
    }

  }, [groupedProducts, selectedProducts, searchQuery, openSellerId]); // Added openSellerId dependency
  // --- End Combined useEffect ---


  // Fetch and process grouped products
  const fetchProducts = async () => {
    setIsLoading(true);
    setGroupedProducts([]);
    setAvailableGroupedProducts([]);
    try {
      const { data } = await axiosInstance.get(GET_PRODUCTS_BY_DROPSHIPPER);
      if (data.status && Array.isArray(data.data)) {
        const processedGroups = await Promise.all(
          data.data.map(async (group) => {
            const productsWithImages = await Promise.all(
              (group.products || []).map(async (product) => {
                const firstImageKey = Array.isArray(product.images) && product.images.length > 0 ? product.images[0]?.key || product.images[0] : null;
                // Only generate URL if key exists
                const imageUrl = firstImageKey
                  ? await generateSignedUrl(firstImageKey).catch((err) => { console.error("URL Gen Error:", err); return null; })
                  : null;
                return { ...product, imageUrl };
              })
            );
            return { ...group, products: productsWithImages };
          })
        );
        setGroupedProducts(processedGroups);
        console.log(processedGroups);
        
        // Initial calculation will be triggered by useEffect setting groupedProducts
      } else {
        console.error("Invalid data structure received:", data);
        setGroupedProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Could not load available products.");
      setGroupedProducts([]);
    } finally {
      setIsLoading(false); // Set loading false after fetch is done
    }
  };

  // Handle selecting a product FROM the available list
  // Adds product to the *currently active tab*
  const handleProductSelect = (tabType, product, event) => {
    event?.preventDefault(); // Prevent default if event is passed
    event?.stopPropagation();

    const newProduct = {
      productId: product._id, // Reference the original product ID
      // --- Add fields based on the original product for display ---
      title: product.title,
      images: product.images, // Keep original keys/structure if needed
      imageUrl: product.imageUrl, // Keep fetched URL
      // --- Add default fields specific to the tab type ---
      ...(tabType === "buyNow" && { productPrice: product.productPrice?.toString() || "" }),
      ...(tabType === "auction" && { startingPrice: product.startingPrice?.toString() || "", reservedPrice: product.reservedPrice?.toString() || "" }),
      ...(tabType === "giveaway" && { followersOnly: false }),
    };

    setSelectedProducts((prev) => ({
      ...prev,
      [tabType]: [...prev[tabType], newProduct],
    }));

    // Clear potential validation errors for this new entry (optional)
    const newIndex = selectedProducts[tabType].length;
    setValidationErrors(prevErr => {
      const updatedErrors = { ...prevErr };
      delete updatedErrors[`${tabType}-${newIndex}-price`];
      delete updatedErrors[`${tabType}-${newIndex}-starting`];
      delete updatedErrors[`${tabType}-${newIndex}-reserved`];
      return updatedErrors;
    })
  };

  // Handle removing a product FROM the selected list
  const handleProductRemove = (tabType, productId, event) => {
    event?.preventDefault();
    event?.stopPropagation();
    setSelectedProducts((prev) => ({
      ...prev,
      [tabType]: prev[tabType].filter((p) => p.productId !== productId),
    }));
    // Clear validation errors related to the removed item (important!)
    setValidationErrors(prevErr => {
      const updatedErrors = { ...prevErr };
      Object.keys(updatedErrors).forEach(key => {
        if (key.startsWith(`${tabType}-`) && selectedProducts[tabType].findIndex(p => p.productId === productId) === parseInt(key.split('-')[1])) {
          delete updatedErrors[key];
        }
      });
      return updatedErrors;
    });
  };

  // Handle changes for inputs within the SELECTED products list
  const handleSelectedProductChange = (productId, field, value, type) => {
    // Handle price changes (buyNow, auction)
    if (type === 'buyNow' || type === 'auction') {
      const isPriceField = ['productPrice', 'startingPrice', 'reservedPrice'].includes(field);
      const regex = /^\d*\.?\d*$/; // Allow decimals/empty
      if (value === "" || regex.test(value)) {
        setSelectedProducts((prev) => ({
          ...prev,
          [type]: prev[type].map((p) =>
            p.productId === productId ? { ...p, [field]: value } : p
          ),
        }));
        // Clear specific validation error on change
        const index = selectedProducts[type].findIndex(p => p.productId === productId);
        const errorField = field === 'productPrice' ? 'price' : field === 'startingPrice' ? 'starting' : 'reserved';
        setValidationErrors(prev => ({ ...prev, [`${type}-${index}-${errorField}`]: undefined }));
      }
    }
  };

  // Handle changes for the giveaway toggle within the SELECTED products list
  const handleGiveawayToggleChange = (productId, checked) => {
    setSelectedProducts((prev) => ({
      ...prev,
      giveaway: prev.giveaway.map((p) =>
        p.productId === productId ? { ...p, followersOnly: checked } : p
      ),
    }));
  };

  // Validation function for selected products before submitting
  const validateSelectedFields = () => {
    const errors = {};
    const priceRegex = /^[1-9]\d*(\.\d+)?$/; // Positive number (integer or float)

    selectedProducts.buyNow.forEach((product, index) => {
      if (!product.productPrice || !priceRegex.test(product.productPrice)) {
        errors[`buyNow-${index}-price`] = "Requires a valid price > 0";
      }
    });

    selectedProducts.auction.forEach((product, index) => {
      if (!product.startingPrice || !priceRegex.test(product.startingPrice)) {
        errors[`auction-${index}-starting`] = "Requires a valid start price > 0";
      }
      // Reserved price is often optional, validate only if entered
      if (product.reservedPrice && (!priceRegex.test(product.reservedPrice))) {
        errors[`auction-${index}-reserved`] = "If entered, requires a valid reserve price > 0";
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit final selection
  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!validateSelectedFields()) {
      toast.warn("Please correct the errors in the selected products section(s).");
      return;
    }
    // Format data before passing up (e.g., convert prices to numbers)
    const formattedSelectedProducts = {
      buyNow: selectedProducts.buyNow.map(p => ({
        productId: p.productId,
        productPrice: parseFloat(p.productPrice) // Convert to number
      })),
      auction: selectedProducts.auction.map(p => ({
        productId: p.productId,
        startingPrice: parseFloat(p.startingPrice), // Convert to number
        reservedPrice: p.reservedPrice ? parseFloat(p.reservedPrice) : null // Convert or null
      })),
      giveaway: selectedProducts.giveaway.map(p => ({
        productId: p.productId,
        followersOnly: Boolean(p.followersOnly) // Ensure boolean
      }))
    };
    onSelectProducts(formattedSelectedProducts); // Pass structured data up
    toast.success("Product selections confirmed!");
  };

  // Tab configuration
  const tabInfo = {
    buyNow: { label: "Buy Now", icon: ShoppingCart },
    auction: { label: "Auction", icon: Hammer },
    giveaway: { label: "Giveaway", icon: Gift },
  };

  const totalSelectedCount =
    selectedProducts.buyNow.length +
    selectedProducts.auction.length +
    selectedProducts.giveaway.length;


  return (
    <div className="bg-slate-100 rounded-lg shadow-lg p-1 md:p-2 w-full border border-slate-200"> {/* Lighter background */}
      {/* Tabs */}
      <div className="tabs tabs-boxed justify-center bg-white mb-4 gap-1 p-1">
        {Object.keys(tabInfo).map((tabKey) => {
          // --- FIX: Assign the icon component to an Uppercase variable ---
          const IconComponent = tabInfo[tabKey].icon;
          // -------------------------------------------------------------
          const { label } = tabInfo[tabKey]; // Destructure label for clarity

          return (
            <button
              key={tabKey}
              className={`tab tab-lg flex-1 flex items-center justify-center gap-2 transition-all duration-200 ${activeTab === tabKey
                  ? 'tab-active bg-primary text-primary-content' // DaisyUI active tab styles
                  : 'hover:bg-gray-200'
                }`}
              onClick={(e) => { e.preventDefault(); setActiveTab(tabKey); }}
            >
              {/* --- FIX: Use the Uppercase variable to render the component --- */}
              {IconComponent && <IconComponent size={18} />}
              {/* ------------------------------------------------------------- */}
              <span>{label} ({selectedProducts[tabKey].length})</span>
            </button>
          );
        })}
      </div>

      {/* Content Area: Available Products Accordion + Selected Products Table */}
      <div className='p-2 md:p-4'>

        {/* Pass available products (grouped) and selection handler */}
        <ProductSelectionList
          availableGroupedProducts={availableGroupedProducts}
          onSelect={handleProductSelect} // Pass the correct handler
          openSellerId={openSellerId}
          setOpenSellerId={setOpenSellerId}
          isLoading={isLoading}
          searchQuery={searchQuery}
          type={activeTab} // Pass current tab type for context
        />

        {/* Pass selected products for the *active* tab and handlers */}
        <SelectedProductList
          selected={selectedProducts[activeTab]}
          onRemove={handleProductRemove}
          onChange={activeTab === 'giveaway' ? handleGiveawayToggleChange : handleSelectedProductChange}
          type={activeTab}
          validationErrors={validationErrors}
          getValidationError={(type, index, field) => validationErrors[`${type}-${index}-${field}`]} // Pass simple getter
        />

      </div>


      {/* Submit Button Area */}
      <div className="px-2 md:px-4 pt-4 mt-4 border-t border-gray-300">
        <button
          className="btn btn-primary w-full" // Full width button
          onClick={handleSubmit}
          // Disable if no products selected OR if there are validation errors
          disabled={totalSelectedCount === 0 || Object.keys(validationErrors).some(key => validationErrors[key])}
        >
          Confirm Selection ({totalSelectedCount})
        </button>
        {Object.keys(validationErrors).some(key => validationErrors[key]) && (
          <p className='text-error text-xs text-center mt-2'>Please fix errors in selected products before confirming.</p>
        )}
      </div>

    </div>
  );
};

export default ProductTab;