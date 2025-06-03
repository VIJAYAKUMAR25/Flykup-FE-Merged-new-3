import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
    Trash, ChevronLeft, ShoppingCart, Hammer, Gift, PlusCircle, Info, Search, Settings, DollarSign, Gavel, Shield, ArrowDown, AlertCircle, Package, Box, Percent, PackageX, // Added relevant icons
    Eye // Assuming Eye or EyeOff might be needed for isActive toggle display
} from "lucide-react";
// Assuming these utils and constants exist and paths are correct
import ImageWithSignedUrlShow from '../../../utils/ShowImage.jsx'; // Adjust path
import { generateSignedUrl } from '../../../utils/aws'; // Adjust path
import axiosInstance from "../../../utils/axiosInstance.js"; // Adjust path
import { useAuth } from "../../../context/AuthContext.jsx"; // Adjust path
// Assuming these API endpoints are defined correctly
import {
    GET_PRODUCTS_BY_DROPSHIPPER,
    GET_SHOW_BY_ID,
    UPDATE_TAGGED_PRODUCTS
} from "../../api/apiDetails.js"; // Adjust path


// ============================================================================
//  Internal Component: ProductSelectionList (Renders Accordion for Available)
//  (No changes needed here based on the request, using previous improved version)
// ============================================================================
const ProductSelectionList = ({
    availableGroupedProducts = [],
    onSelect,
    openSellerId,
    setOpenSellerId,
    isLoading,
    searchQuery,
    type
}) => {

    const toggleSellerAccordion = (sellerId) => {
        setOpenSellerId(prevId => prevId === sellerId ? null : sellerId);
    };

    const totalAvailableCount = availableGroupedProducts.reduce((sum, group) => sum + (group?.products?.length || 0), 0);

    return (
        <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 flex items-center text-gray-700">
                Available Products
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    {totalAvailableCount}
                </span>
            </h3>

            <div className="border border-gray-200 rounded-lg bg-gray-50 h-80 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full p-10">
                        <span className="loading loading-spinner text-primary loading-lg"></span>
                    </div>
                ) : availableGroupedProducts.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-full text-gray-500 p-4 text-center">
                        <Info size={32} className="text-gray-400 mb-2" />
                        <p className="font-semibold">No Products Found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {searchQuery ? 'Try adjusting your search criteria.' : 'No more products available or all are selected.'}
                        </p>
                    </div>
                ) : (
                    availableGroupedProducts.map(group => {
                        if (!group || !group.sellerInfo || !group.products) return null;
                        const isOpen = openSellerId === group.sellerInfo._id;
                        return (
                            <div
                                key={group.sellerInfo._id}
                                tabIndex={0}
                                className={`collapse collapse-arrow border border-base-300 bg-base-100 rounded-md shadow-sm transition-all duration-300 ${isOpen ? 'collapse-open' : 'collapse-close'}`}
                            >
                                <div
                                    className="collapse-title text-md font-medium cursor-pointer flex justify-between items-center"
                                    onClick={() => toggleSellerAccordion(group.sellerInfo._id)}
                                >
                                    <div className='flex items-center gap-2 overflow-hidden'>
                                        <div className="avatar placeholder flex-shrink-0">
                                            <div className="bg-neutral-focus text-neutral-content rounded-full w-6 h-6 text-xs">
                                                {group.sellerInfo.userInfo?.profileURL ? (
                                                    <img src={group.sellerInfo.userInfo.profileURL} alt={group.sellerInfo.companyName || group.sellerInfo.userInfo?.name || 'S'} />
                                                ) : (
                                                    <span>{(group.sellerInfo.companyName || group.sellerInfo.userInfo?.name || '??').substring(0, 1)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="truncate">{group.sellerInfo.companyName || group.sellerInfo.userInfo?.name || 'Unknown Seller'}</span>
                                    </div>
                                    <span className="badge badge-outline badge-primary badge-sm font-medium">{group.products.length} items</span>
                                </div>
                                <div className="collapse-content !p-0 !pb-2 !pt-1">
                                    <div className="overflow-x-auto bg-white rounded-b-md">
                                        <table className="min-w-full table table-sm">
                                            <thead>
                                                {/* Optional: Headers inside each accordion if preferred */}
                                                <tr className="bg-gray-50 text-gray-500 uppercase text-xs">
                                                    <th className="px-3 py-2 font-medium">Image</th>
                                                    <th className="px-3 py-2 font-medium">Product Details</th>
                                                    <th className="px-3 py-2 font-medium text-center">Commission</th>
                                                    <th className="px-3 py-2 font-medium text-center">Stock</th>
                                                    <th className="px-3 py-2 font-medium text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {group.products.map((product) => {
                                                    if (!product || !product._id) return null;
                                                    const firstImageKey = Array.isArray(product.images) && product.images.length > 0 ? product.images[0]?.key || product.images[0] : null;
                                                    return (
                                                        <tr key={product._id} className="hover align-middle">
                                                            <td className="px-3 py-2 w-16">
                                                                <ImageWithSignedUrlShow
                                                                    imageKey={firstImageKey}
                                                                    imageUrl={product.imageUrl} // Use pre-generated URL
                                                                    altText={product.title}
                                                                    className="w-12 h-12 object-cover rounded-md border"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2 max-w-xs">
                                                                <div className="font-medium text-gray-800 line-clamp-2 text-sm" title={product.title}>
                                                                    {product.title || 'N/A'}
                                                                </div>
                                                                <div className="text-xs text-gray-500">{product.category || 'N/A'} / {product.subcategory || 'N/A'}</div>
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap w-20 text-center">
                                                                <span className={`badge badge-sm font-medium ${(product?.commissionRate ?? 0) > 0 ? 'badge-success badge-outline' : 'badge-ghost'}`}>
                                                                    {product?.commissionRate ?? '--'} <Percent size={12} className='inline ml-0.5 mb-px' /> {/* Adjusted icon display */}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap w-20 text-center">
                                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${product.quantity > 10 ? 'bg-green-100 text-green-800' : product.quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                                    {product.quantity ?? 'N/A'} units
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-center w-24">
                                                                <button
                                                                    className="btn btn-xs btn-primary btn-outline flex items-center gap-1 mx-auto"
                                                                    onClick={(e) => onSelect(type, product, e)} // Pass type here
                                                                    disabled={product.quantity <= 0} // Disable if out of stock
                                                                    title={product.quantity <= 0 ? 'Out of stock' : 'Add to list'}
                                                                >
                                                                    <PlusCircle size={14} /> Add
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

// ============================================================================
//  Internal Component: SelectedProductList (Enhanced UI)
// ============================================================================
const SelectedProductList = ({
    selected = [],
    onRemove,
    onChange,
    type,
    // validationErrors = {}, // Can be removed if getValidationError is passed
    getValidationError // Pass function directly
}) => {

    const listTitle = type === 'buyNow' ? 'Buy Now Items' : type === 'auction' ? 'Auction Items' : 'Giveaway Items';

    if (!selected || selected.length === 0) {
        return (
            <div className="text-center text-gray-400 py-10 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center min-h-[150px]">
                <PackageX size={32} className="mb-2 text-gray-300" />
                <p className='font-medium'>No products selected for <span className="font-semibold">{listTitle}</span> yet.</p>
                <p className='text-xs mt-1'>Add products from the list above.</p>
            </div>
        );
    }

    return (
        // Added padding and subtle background to the section
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">{listTitle}</h3> {/* Enhanced title */}
            {/* Container with max height and scroll */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar"> {/* Increased max-height */}
                {/* Use responsive overflow-x-auto */}
                <div className="overflow-x-auto">
                    {/* DaisyUI Table structure */}
                    <table className="table table-zebra table-sm w-full"> {/* Added zebra striping */}
                        {/* head - styled */}
                        <thead className="sticky top-0 z-10 ">
                            <tr className="bg-base-200 text-base-content text-xs uppercase font-semibold"> {/* Theme colors */}
                                <th className="p-3">Image</th>
                                <th className="p-3">Title</th>
                                {/* Conditional Headers */}
                                {type === 'buyNow' && <th className="p-3 whitespace-nowrap">Sell Price (₹)*</th>}
                                {type === 'auction' && <th className="p-3 whitespace-nowrap">Start Price (₹)*</th>}
                                {type === 'auction' && <th className="p-3 whitespace-nowrap">Reserve Price (₹)</th>}
                                {type === 'giveaway' && <th className="p-3 text-center">Followers Only?</th>}
                                <th className="p-3 text-center">Commission</th>
                                <th className="p-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-base-200">
                            {selected.map((product, index) => {
                                // Ensure product and productId exist before rendering row
                                if (!product || !product.productId) {
                                    console.warn("Skipping rendering selected product due to missing data:", product);
                                    return null;
                                }
                                const firstImageKey = Array.isArray(product.images) && product.images.length > 0 ? product.images[0]?.key || product.images[0] : null;
                                return (
                                    <tr key={`${type}-${product.productId}`} className="hover align-middle"> {/* More specific key */}
                                        {/* Image */}
                                        <td className="p-2 w-16"> {/* Adjusted padding */}
                                            <ImageWithSignedUrlShow
                                                imageKey={firstImageKey}
                                                imageUrl={product.imageUrl || null} // Use generated URL
                                                altText={product.title}
                                                className="w-12 h-12 object-cover rounded-md border border-base-300"
                                            />
                                        </td>
                                        {/* Title */}
                                        <td className="p-2 max-w-xs"> {/* Adjusted padding */}
                                            <div className="font-medium text-gray-800 line-clamp-2 text-sm" title={product.title}>
                                                {product.title || 'N/A'}
                                            </div>
                                        </td>

                                        {/* Conditional Inputs */}
                                        {type === 'buyNow' && (
                                            <td className="p-2 w-36">
                                                <label className={`input input-sm input-bordered flex items-center gap-1 ${getValidationError(type, index, "productPrice") ? 'input-error' : ''}`}>
                                                    <span className='text-gray-500'>₹</span>
                                                    <input
                                                        type="text" inputMode="decimal" // Use text + inputMode for better mobile support
                                                        pattern="[0-9]*\.?[0-9]*" // Basic pattern for decimals
                                                        value={product.productPrice ?? ''} // Handle null/undefined
                                                        onChange={(e) => onChange(product.productId, "productPrice", e.target.value, 'buyNow')}
                                                        className="grow border-none focus:outline-none focus:ring-0 p-0 bg-transparent font-medium w-full" // Added w-full
                                                        placeholder="Amount" aria-label="Product Sell Price"
                                                    />
                                                </label>
                                                {getValidationError(type, index, "productPrice") && <p className="text-error text-xs mt-1">{getValidationError(type, index, "productPrice")}</p>}
                                            </td>
                                        )}
                                        {type === 'auction' && (
                                            <>
                                                <td className="p-2 w-36">
                                                    <label className={`input input-sm input-bordered flex items-center gap-1 ${getValidationError(type, index, "startingPrice") ? 'input-error' : ''}`}>
                                                        <span className='text-gray-500'>₹</span>
                                                        <input
                                                            type="text" inputMode="decimal"
                                                            pattern="[0-9]*\.?[0-9]*"
                                                            value={product.startingPrice ?? ''} // Handle null/undefined
                                                            onChange={(e) => onChange(product.productId, "startingPrice", e.target.value, 'auction')}
                                                            className="grow border-none focus:outline-none focus:ring-0 p-0 bg-transparent font-medium w-full"
                                                            placeholder="Start Price" aria-label="Auction Starting Price"
                                                        />
                                                    </label>
                                                    {getValidationError(type, index, "startingPrice") && <p className="text-error text-xs mt-1">{getValidationError(type, index, "startingPrice")}</p>}
                                                </td>
                                                <td className="p-2 w-36">
                                                    <label className={`input input-sm input-bordered flex items-center gap-1 ${getValidationError(type, index, "reservedPrice") ? 'input-error' : ''}`}>
                                                        <span className='text-gray-500'>₹</span>
                                                        <input
                                                            type="text" inputMode="decimal"
                                                            pattern="[0-9]*\.?[0-9]*"
                                                            value={product.reservedPrice ?? ''} // Handle null/undefined
                                                            onChange={(e) => onChange(product.productId, "reservedPrice", e.target.value, 'auction')}
                                                            className="grow border-none focus:outline-none focus:ring-0 p-0 bg-transparent font-medium w-full"
                                                            placeholder="Reserve (Optional)" aria-label="Auction Reserve Price"
                                                        />
                                                    </label>
                                                    {getValidationError(type, index, "reservedPrice") && <p className="text-error text-xs mt-1">{getValidationError(type, index, "reservedPrice")}</p>}
                                                </td>
                                            </>
                                        )}
                                        {type === 'giveaway' && (
                                            <td className="p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={!!product.followersOnly} // Ensure boolean
                                                    onChange={(e) => onChange(product.productId, "followersOnly", e.target.checked, 'giveaway')}
                                                    className="toggle toggle-primary toggle-sm"
                                                    aria-label="Followers Only Toggle"
                                                />
                                            </td>
                                        )}

                                        {/* Commission Rate Display */}
                                        <td className="p-2 whitespace-nowrap w-20 text-center">
                                            <span className={`badge badge-sm font-medium ${(product?.commissionRate ?? 0) > 0 ? 'badge-success badge-outline' : 'badge-ghost'}`}>
                                                {product?.commissionRate ?? '--'}<Percent size={12} className='inline ml-0.5 mb-px' /> {/* Adjusted icon display */}
                                            </span>
                                        </td>

                                        {/* Action Button */}
                                        <td className="p-2 whitespace-nowrap text-center w-24">
                                            <div className="tooltip tooltip-left" data-tip="Remove from list">
                                                <button
                                                    className="btn btn-xs btn-ghost text-error hover:bg-error hover:text-error-content"
                                                    onClick={(e) => onRemove(type, product.productId, e)}
                                                    aria-label={`Remove ${product.title}`}
                                                >
                                                    <Trash size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// ============================================================================
//  Main Component: ShipperEditTaggedProducts
// ============================================================================
const ShipperEditTaggedProducts = () => {
    const location = useLocation();
    const showId = location.state?.showId || location.state; // Handle potential object state
    const navigate = useNavigate();
    const { user } = useAuth();

    const [allGroupedProducts, setAllGroupedProducts] = useState([]); // Holds ALL fetched products
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
    const [openSellerId, setOpenSellerId] = useState(null); // For available product accordion
    const [searchQuery, setSearchQuery] = useState('');
    const [availableGroupedProducts, setAvailableGroupedProducts] = useState([]); // Filtered available products

    // Define tabInfo within the component scope
    const tabInfo = {
        buyNow: { label: "Buy Now", icon: ShoppingCart },
        auction: { label: "Auction", icon: Hammer },
        giveaway: { label: "Giveaway", icon: Gift },
    };

    // Memoize utility function for validation errors
    const getValidationError = useCallback((tab, index, field) => {
        return validationErrors[`${tab}-${index}-${field}`];
    }, [validationErrors]);

    // Fetch products (expecting grouped data)
    const fetchProducts = async () => {
        console.log("Fetching products...");
        setLoadingProducts(true);
        setAllGroupedProducts([]); // Reset the source of truth
        setAvailableGroupedProducts([]); // Reset filtered list
        try {
            const { data } = await axiosInstance.get(GET_PRODUCTS_BY_DROPSHIPPER);
            console.log("Raw products data:", data);
            if (data.status && Array.isArray(data.data)) {
                 // Generate image URLs ONCE for all products
                const processedGroups = await Promise.all(
                    data.data.map(async (group) => {
                        if (!group || !Array.isArray(group.products)) {
                            console.warn("Skipping invalid group structure:", group);
                            return { ...group, products: [] }; // Return empty products array
                        }
                        const productsWithImages = await Promise.all(
                            group.products.map(async (product) => {
                                if (!product || !product._id) {
                                     console.warn("Skipping invalid product structure:", product);
                                     return null; // Filter out invalid products later
                                }
                                const firstImageKey = Array.isArray(product.images) && product.images.length > 0
                                    ? product.images[0]?.key || product.images[0]
                                    : null;
                                const imageUrl = firstImageKey
                                    ? await generateSignedUrl(firstImageKey).catch((err) => { console.error(`URL Gen Error for key ${firstImageKey}:`, err); return null; })
                                    : null;
                                return { ...product, imageUrl }; // Add generated URL
                            })
                        );
                        // Filter out any products that failed processing (returned null)
                        const validProducts = productsWithImages.filter(p => p !== null);
                        return { ...group, products: validProducts };
                    })
                );
                 console.log("Processed product groups with images:", processedGroups);
                setAllGroupedProducts(processedGroups);
            } else {
                console.error("Invalid data structure received for products:", data);
                toast.error("Could not load products: Invalid data format.");
                setAllGroupedProducts([]);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error(`Could not load available products. ${error.response?.data?.message || error.message}`);
            setAllGroupedProducts([]);
        } finally {
            setLoadingProducts(false);
            console.log("Finished fetching products.");
        }
    };

    // Helper to map product data safely
    const mapProductData = (showProductArray = []) => {
        if (!Array.isArray(showProductArray)) {
            console.warn("Received non-array for product mapping:", showProductArray);
            return [];
        }
        return showProductArray.map(item => {
            const productInfo = item.productId || {}; // productId might be populated or just an ID string
            const id = typeof productInfo === 'string' ? item.productId : productInfo._id;

            if (!id) {
                console.warn("Skipping show item due to missing ID:", item);
                return null;
            }

            return {
                productId: id.toString(), // Ensure string ID
                title: productInfo.title || 'Product Title Unavailable',
                images: productInfo.images || [],
                imageUrl: null, // Will be generated later
                // Use item's price first (as saved in show), fallback to product's default price
                productPrice: item.productPrice?.toString() ?? productInfo.productPrice?.toString() ?? "",
                startingPrice: item.startingPrice?.toString() ?? productInfo.startingPrice?.toString() ?? "",
                reservedPrice: item.reservedPrice?.toString() ?? productInfo.reservedPrice?.toString() ?? "",
                followersOnly: typeof item.followersOnly === 'boolean' ? item.followersOnly : false,
                commissionRate: productInfo.commissionRate ?? null, // Include commissionRate from product details
                // Include other necessary fields from productInfo if needed (like quantity for reference, though not directly used)
                originalQuantity: productInfo.quantity ?? 0,
            };
        }).filter(p => p !== null); // Filter out items that couldn't be mapped
    };


    // Fetch show details
    const fetchShow = async () => {
        if (!showId) {
            toast.error("No Show ID provided for editing.");
            navigate('/shipper/allShows');
            setLoadingShow(false); // Ensure loading state is false
            return;
        }
        console.log(`Workspaceing show details for ID: ${showId}`);
        setLoadingShow(true);
        try {
            const res = await axiosInstance.get(`${GET_SHOW_BY_ID}/${showId}`);
            console.log("Fetched Show Data Raw:", res.data);

            if (res.data.status && res.data.data) {
                const showData = res.data.data;
                setShow(showData);

                // Initialize selected products based on fetched show data
                const initialSelected = {
                    buyNow: mapProductData(showData.buyNowProducts),
                    auction: mapProductData(showData.auctionProducts),
                    giveaway: mapProductData(showData.giveawayProducts),
                };
                console.log("Initialized Selected Products:", initialSelected);
                setSelectedProducts(initialSelected);

            } else {
                toast.error(res.data.message || "Could not fetch show details.");
                navigate('/shipper/allShows');
            }
        } catch (err) {
            console.error("Error fetching show:", err);
            toast.error(`Failed to load show details. ${err.response?.data?.message || err.message}`);
            navigate('/shipper/allShows');
        } finally {
            setLoadingShow(false);
             console.log("Finished fetching show details.");
        }
    };

    // Initial data fetching (run once on mount or if showId changes)
    useEffect(() => {
        fetchProducts();
        fetchShow();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showId]); // Dependency: showId

    // Generate Signed URLs for initially selected products AFTER show data is loaded
     useEffect(() => {
        if (show && (selectedProducts.buyNow.length > 0 || selectedProducts.auction.length > 0 || selectedProducts.giveaway.length > 0)) {
            console.log("Generating signed URLs for initially selected products...");
            const updateImageUrls = async () => {
                let changed = false;
                const updatedSelections = { buyNow: [], auction: [], giveaway: [] };

                for (const tabKey of Object.keys(selectedProducts)) {
                    updatedSelections[tabKey] = await Promise.all(
                        selectedProducts[tabKey].map(async (item) => {
                            if (!item || item.imageUrl) return item; // Skip if no item or URL already exists

                            const firstImageKey = Array.isArray(item.images) && item.images.length > 0
                                ? (typeof item.images[0] === 'string' ? item.images[0] : item.images[0]?.key)
                                : null;

                            if (!firstImageKey) return item; // Skip if no image key

                            try {
                                const imageUrl = await generateSignedUrl(firstImageKey);
                                if (imageUrl !== item.imageUrl) {
                                     changed = true;
                                     return { ...item, imageUrl };
                                }
                                return item;
                            } catch (error) {
                                console.error(`Failed to generate signed URL for key ${firstImageKey}:`, error);
                                return item; // Return item without URL if generation fails
                            }
                        })
                    );
                }

                if (changed) {
                     console.log("Updating selected products state with signed URLs.");
                    setSelectedProducts(updatedSelections);
                } else {
                    console.log("No changes in signed URLs needed for selected products.")
                }
            };
            updateImageUrls();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]); // Rerun only when show data itself changes (after fetch)


    // Effect to filter available products (grouped) whenever selections, search, or all products change
    useEffect(() => {
        if (loadingProducts || !allGroupedProducts) return; // Don't filter until products are loaded

        console.log("Filtering available products...");
        const query = searchQuery.toLowerCase().trim();
        // Create a Set of all currently selected product IDs for efficient lookup
        const allSelectedIds = new Set([
            ...selectedProducts.buyNow.map(p => String(p.productId)),
            ...selectedProducts.auction.map(p => String(p.productId)),
            ...selectedProducts.giveaway.map(p => String(p.productId))
        ]);
         console.log("Currently selected IDs:", allSelectedIds);

        const filteredAndGrouped = allGroupedProducts.map(group => {
            if (!group || !Array.isArray(group.products)) return null; // Skip invalid groups

            const availableProdsInGroup = group.products.filter(p => {
                 if (!p || !p._id) return false; // Skip invalid products
                 const productIdStr = String(p._id);

                // Condition 1: Must not be already selected
                const isSelected = allSelectedIds.has(productIdStr);
                 if (isSelected) return false;

                 // Condition 2: Must have stock > 0
                 // if (p.quantity <= 0) return false; //-- Optional: uncomment to hide out-of-stock items

                // Condition 3: Must match search query (if query exists)
                if (query) {
                    const titleMatch = p.title?.toLowerCase().includes(query);
                    const categoryMatch = p.category?.toLowerCase().includes(query);
                    const subcategoryMatch = p.subcategory?.toLowerCase().includes(query);
                    return titleMatch || categoryMatch || subcategoryMatch;
                }

                // If no query, it's available (passes condition 1 and 2)
                return true;
            });

            // Only include the group if it has available products after filtering
            if (availableProdsInGroup.length > 0) {
                return { ...group, products: availableProdsInGroup };
            }
            return null; // Discard group if it has no available products matching criteria
        }).filter(group => group !== null); // Remove the null entries

        console.log("Filtered available product groups:", filteredAndGrouped);
        setAvailableGroupedProducts(filteredAndGrouped);

        // If the currently open accordion's seller has no available products anymore, close it
        if (openSellerId && !filteredAndGrouped.some(g => g.sellerInfo._id === openSellerId)) {
            setOpenSellerId(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allGroupedProducts, selectedProducts, searchQuery, loadingProducts]); // Dependencies

    // --- Event Handlers ---

    // Handle selecting a product FROM the available list
    const handleProductSelect = (tabType, productToAdd, event) => {
        event?.preventDefault();
        event?.stopPropagation(); // Prevent accordion toggle if clicking button inside

        if (!productToAdd || !productToAdd._id) {
            toast.warn("Cannot add product: Invalid product data.");
            return;
        }
        const productIdStr = String(productToAdd._id);

        // Double check it's not already selected somehow (should be filtered out, but good safeguard)
        const isAlreadySelected = Object.values(selectedProducts).flat().some(p => String(p.productId) === productIdStr);
        if (isAlreadySelected) {
             toast.info(`"${productToAdd.title}" is already selected in one of the lists.`);
             return;
        }

        // Find the full product details from the original source (allGroupedProducts)
        // This ensures we have the most complete data, including potential pre-generated imageUrl
        let originalProduct = null;
        for (const group of allGroupedProducts) {
            originalProduct = group.products.find(p => String(p._id) === productIdStr);
            if (originalProduct) break;
        }

        if (!originalProduct) {
            toast.error("Could not add product: Original product details not found.");
            console.error("Original product not found for ID:", productIdStr, "Available Data:", productToAdd);
            return;
        }

        // Create the new product object for the selected list
        const newProduct = {
            productId: productIdStr,
            title: originalProduct.title,
            images: originalProduct.images || [],
            imageUrl: originalProduct.imageUrl || null, // Use pre-generated URL if available
            commissionRate: originalProduct.commissionRate ?? null,
            originalQuantity: originalProduct.quantity ?? 0, // Store original quantity for reference
            // Set type-specific fields (initialize with defaults or product's base price if available)
            productPrice: tabType === "buyNow" ? (originalProduct.productPrice?.toString() || "") : "",
            startingPrice: tabType === "auction" ? (originalProduct.startingPrice?.toString() || "") : "",
            reservedPrice: tabType === "auction" ? (originalProduct.reservedPrice?.toString() || "") : "",
            followersOnly: tabType === "giveaway" ? false : undefined, // Set default for giveaway
        };

        console.log(`Adding product ${productIdStr} to ${tabType} list:`, newProduct);

        setSelectedProducts((prev) => ({
            ...prev,
            [tabType]: [...prev[tabType], newProduct]
        }));

        // Clear potential validation errors for the *new* item (it doesn't have errors yet)
        // Note: Validation should run on submit or potentially on blur/change
        const newIndex = selectedProducts[tabType].length; // Index where the new product will be
        setValidationErrors(prevErr => {
            const newErrors = { ...prevErr };
            // Remove any potential stale errors for this index if they somehow existed
            delete newErrors[`${tabType}-${newIndex}-productPrice`];
            delete newErrors[`${tabType}-${newIndex}-startingPrice`];
            delete newErrors[`${tabType}-${newIndex}-reservedPrice`];
            return newErrors;
        });

        toast.success(`"${originalProduct.title}" added to ${tabInfo[tabType].label}.`);
    };


    // Handle removing a product FROM the selected list
    const handleProductRemove = (tabType, productIdToRemove, event) => {
        event?.preventDefault();
        event?.stopPropagation();
        const productIdStr = String(productIdToRemove);

         console.log(`Removing product ${productIdStr} from ${tabType} list.`);

        const removedIndex = selectedProducts[tabType].findIndex(p => String(p.productId) === productIdStr);
        if (removedIndex === -1) return; // Item not found

        // Filter out the product
        const updatedList = selectedProducts[tabType].filter((item) => String(item.productId) !== productIdStr);

        setSelectedProducts((prev) => ({
            ...prev,
            [tabType]: updatedList,
        }));

        // Clear validation errors associated with the removed item AND shift errors for subsequent items
        setValidationErrors(prevErr => {
            const newErrors = {};
            Object.keys(prevErr).forEach(key => {
                const [keyTab, keyIndexStr, keyField] = key.split('-');
                const keyIndex = parseInt(keyIndexStr, 10);

                if (keyTab !== tabType) {
                    // Keep errors from other tabs
                    newErrors[key] = prevErr[key];
                } else {
                    // Handle errors within the same tab
                    if (keyIndex < removedIndex) {
                        // Keep errors for items before the removed one
                        newErrors[key] = prevErr[key];
                    } else if (keyIndex > removedIndex) {
                        // Shift errors for items after the removed one
                        const newKey = `${keyTab}-${keyIndex - 1}-${keyField}`;
                        newErrors[newKey] = prevErr[key];
                    }
                    // Discard errors for the removed item (keyIndex === removedIndex)
                }
            });
             console.log("Updated validation errors after removal:", newErrors);
            return newErrors;
        });

         toast.info(`Product removed from ${tabInfo[tabType].label}.`);
    };


    // Combined handler for price/toggle changes in SelectedProductList
    const handleSelectedProductChange = (productId, field, value, type) => {
        const productIdStr = String(productId);

        setSelectedProducts((prev) => ({
            ...prev,
            [type]: prev[type].map((p) => {
                if (String(p.productId) !== productIdStr) {
                    return p; // Not the product we're changing
                }

                // Handle specific field updates
                if (type === 'giveaway' && field === 'followersOnly') {
                    return { ...p, [field]: Boolean(value) }; // Ensure boolean
                }
                else if ((type === 'buyNow' || type === 'auction') && ['productPrice', 'startingPrice', 'reservedPrice'].includes(field)) {
                    // Allow empty string or valid decimal format (potentially partial)
                    const regex = /^\d*\.?\d*$/;
                    if (value === "" || regex.test(value)) {
                         // Update the value
                         return { ...p, [field]: value };
                    } else {
                        // Invalid input format, don't update state (or show feedback)
                        console.warn(`Invalid input for ${field}: ${value}`);
                        return p; // Return original product state
                    }
                }
                // Fallback for other potential fields if needed
                return { ...p, [field]: value };
            }),
        }));

        // Clear the specific validation error for the field being changed
        // Validation will typically re-run on submit or potentially on blur
        const index = selectedProducts[type].findIndex(p => String(p.productId) === productIdStr);
        if (index !== -1) {
            setValidationErrors(prevErr => {
                const newErrors = { ...prevErr };
                delete newErrors[`${type}-${index}-${field}`]; // Clear error for this specific field
                 // Optionally clear related errors, e.g., if changing start price, re-evaluate reserve price relation
                 if (type === 'auction' && field === 'startingPrice') {
                      delete newErrors[`${type}-${index}-reservedPrice`]; // Clear reserve if start changes
                 }
                return newErrors;
            });
        }
    };


    // Validation function for selected products before submit
    const validateFields = () => {
         console.log("Validating selected products...");
        const errors = {};
         // Allows positive numbers, including decimals. Does not allow leading zeros unless it's '0.x'.
         const priceRegex = /^(?:[1-9]\d*|0)?(?:\.\d+)?$/;
         // Stricter: Requires at least one digit before or after decimal, > 0
         const positivePriceRegex = /^(?![0.]+$)\d*(?:\.\d+)?$/;


        // Validate Buy Now
        selectedProducts.buyNow.forEach((product, index) => {
            const price = product.productPrice?.trim();
            if (!price) {
                errors[`buyNow-${index}-productPrice`] = "Price is required.";
            } else if (!positivePriceRegex.test(price) || parseFloat(price) <= 0) {
                errors[`buyNow-${index}-productPrice`] = "Enter a valid price > 0.";
            }
        });

        // Validate Auction
        selectedProducts.auction.forEach((product, index) => {
            const startPrice = product.startingPrice?.trim();
            const reservePrice = product.reservedPrice?.trim();

            // Starting Price Validation
            if (!startPrice) {
                errors[`auction-${index}-startingPrice`] = "Start price is required.";
            } else if (!positivePriceRegex.test(startPrice) || parseFloat(startPrice) <= 0) {
                errors[`auction-${index}-startingPrice`] = "Enter a valid start price > 0.";
            }

             // Reserve Price Validation (if entered)
             if (reservePrice) { // Only validate if not empty
                  if (!positivePriceRegex.test(reservePrice) || parseFloat(reservePrice) <= 0) {
                      errors[`auction-${index}-reservedPrice`] = "Enter a valid reserve price > 0.";
                  } else if (startPrice && positivePriceRegex.test(startPrice) && parseFloat(reservePrice) < parseFloat(startPrice)) {
                       // Only compare if start price is also valid
                      errors[`auction-${index}-reservedPrice`] = "Reserve price cannot be less than start price.";
                  }
             } else {
                // If reserve price is explicitly empty, ensure no validation error shows for it
                delete errors[`auction-${index}-reservedPrice`];
             }
        });

        // No specific validation for Giveaway fields in this example (followersOnly is boolean)

         console.log("Validation Errors:", errors);
        setValidationErrors(errors);
        return Object.keys(errors).length === 0; // Return true if no errors
    };

    // On submit, format and send the payload
    const handleSubmit = async (e) => {
        e.preventDefault();
         console.log("Submit button clicked.");

        if (!validateFields()) {
            toast.warn("Please correct the errors in the selected product lists before submitting.");
            // Optionally, switch to the first tab with an error
             const firstErrorKey = Object.keys(validationErrors)[0];
             if (firstErrorKey) {
                 const firstErrorTab = firstErrorKey.split('-')[0];
                 setActiveTab(firstErrorTab);
             }
            return;
        }

         // Ensure at least one product is selected across all lists
         if (selectedProducts.buyNow.length === 0 && selectedProducts.auction.length === 0 && selectedProducts.giveaway.length === 0) {
            toast.warn("Please select at least one product for the show.");
            return;
         }

        // Format the payload for the API
        const formatProductPayload = (product, type) => {
             // Ensure prices are numbers or null/undefined for the backend
             const parsePrice = (priceStr) => {
                const trimmed = priceStr?.trim();
                if (!trimmed) return null; // Send null if empty or just whitespace
                const num = parseFloat(trimmed);
                return isNaN(num) ? null : num; // Send null if parsing fails
             }

            const basePayload = {
                productId: product.productId, // Just send the ID
            };

            switch (type) {
                case 'buyNow':
                    return {
                        ...basePayload,
                        productPrice: parsePrice(product.productPrice),
                    };
                case 'auction':
                    return {
                        ...basePayload,
                        startingPrice: parsePrice(product.startingPrice),
                        reservedPrice: parsePrice(product.reservedPrice), // Allow null if empty
                    };
                case 'giveaway':
                    return {
                        ...basePayload,
                        followersOnly: !!product.followersOnly, // Ensure boolean
                    };
                default:
                    return null; // Should not happen
            }
        };

        const payload = {
            buyNowProducts: selectedProducts.buyNow.map(p => formatProductPayload(p, 'buyNow')).filter(p => p !== null),
            auctionProducts: selectedProducts.auction.map(p => formatProductPayload(p, 'auction')).filter(p => p !== null),
            giveawayProducts: selectedProducts.giveaway.map(p => formatProductPayload(p, 'giveaway')).filter(p => p !== null),
        };

        console.log("Submitting Payload:", JSON.stringify(payload, null, 2)); // Pretty print JSON
        setSubmitLoading(true);

        try {
            const response = await axiosInstance.put(`${UPDATE_TAGGED_PRODUCTS}/${showId}`, payload);
            console.log("Update Response:", response.data);
            if (response.data.status) {
                toast.success("Show products updated successfully!");
                navigate('/shipper/allShows'); // Navigate back on success
            } else {
                toast.error(`Failed to update products: ${response.data.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error("Error updating show products:", err);
            toast.error(`An error occurred: ${err.response?.data?.message || err.message}`);
        } finally {
            setSubmitLoading(false);
        }
    };

    // Modal confirmation handlers
    const handleConfirmDiscard = () => { setShowModal(false); navigate("/shipper/allShows"); };
    const handleCancelDiscard = () => { setShowModal(false); };

    // --- Render Logic ---

    // Show main loading spinner until both products and show details are fetched
    if (loadingProducts || loadingShow || !show) { // Also check if show is null
        return (
             <div className="flex justify-center items-center h-screen bg-neutral-50">
                <div className='text-center'>
                    <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
                    <p className='text-lg font-medium text-gray-600'>Loading Show Editor...</p>
                    {loadingProducts && <p className='text-sm text-gray-500'>Loading available products...</p>}
                    {loadingShow && <p className='text-sm text-gray-500'>Loading show details...</p>}
                </div>
            </div>
        );
    }

    // Main component render
    return (
        <div className="bg-neutral-50 min-h-screen p-4 md:p-6 lg:p-8 text-gray-700"> {/* Responsive padding */}
             {/* Back Button */}
             <div className="flex items-center mb-4">
                 <button
                     type="button"
                     className="btn btn-sm btn-ghost flex items-center text-gray-600 hover:text-gray-900"
                     onClick={() => setShowModal(true)} // Show confirmation modal
                     aria-label="Go back to all shows"
                 >
                     <ChevronLeft size={18} className="mr-1" /> Back
                 </button>
             </div>

             {/* Header */}
            <h2 className="text-xl md:text-2xl font-bold mb-1">Edit Products for Show</h2>
            <p className="text-md md:text-lg text-primary font-semibold mb-6 truncate" title={show?.title}>
                 {show?.title || 'Loading Show Title...'}
            </p>

             {/* Search for Available Products */}
            <div className="mb-6 relative">
                 <label htmlFor="productSearch" className="sr-only">Search Available Products</label>
                 <input
                     id="productSearch"
                     type="text"
                     placeholder="Search available products by title, category..."
                     className="input input-bordered w-full pl-10 shadow-sm bg-white"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                 />
                 <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                 {searchQuery && (
                    <button
                         onClick={() => setSearchQuery('')}
                         className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-error"
                         aria-label="Clear search"
                    >
                         <X size={18} /> {/* Assuming X icon from lucide */}
                    </button>
                 )}
             </div>

            {/* Tabs */}
            <div className="tabs tabs-boxed justify-center bg-white mb-6 gap-1 p-1 shadow-sm border border-gray-200">
                {/* --- FIX APPLIED HERE (tabInfo && ...) --- */}
                {tabInfo && Object.keys(tabInfo).map((tabKey) => {
                    const currentTab = tabInfo[tabKey];
                    if (!currentTab) {
                        console.warn(`Invalid tabKey "${tabKey}" encountered in tab mapping.`);
                        return null;
                    }
                    const IconComponent = currentTab.icon;
                    const { label } = currentTab;
                    const selectedCount = selectedProducts[tabKey]?.length || 0;

                    return (
                        <button
                            key={tabKey}
                            role="tab" // Add role for accessibility
                            aria-selected={activeTab === tabKey} // Accessibility state
                            className={`tab tab-lg flex-1 flex items-center justify-center gap-2 transition-all duration-200 ${activeTab === tabKey ? 'tab-active bg-primary text-primary-content font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                            onClick={(e) => { e.preventDefault(); setActiveTab(tabKey); }}
                        >
                            {IconComponent && <IconComponent size={18} />}
                            <span>{label} ({selectedCount})</span>
                        </button>
                    );
                })}
            </div>

            {/* Content Area - Render based on activeTab */}
            <div className="mt-6 space-y-8"> {/* Increased spacing */}
                 {/* Available Products Section */}
                 <ProductSelectionList
                     availableGroupedProducts={availableGroupedProducts}
                     onSelect={handleProductSelect}
                     openSellerId={openSellerId}
                     setOpenSellerId={setOpenSellerId}
                     isLoading={loadingProducts} // Pass product loading state
                     searchQuery={searchQuery}
                     type={activeTab} // Pass activeTab to the selection list's onSelect
                 />

                 {/* Selected Products Section for the Active Tab */}
                 <SelectedProductList
                     selected={selectedProducts[activeTab]}
                     onRemove={handleProductRemove}
                     onChange={handleSelectedProductChange}
                     type={activeTab}
                     // validationErrors={validationErrors} // Pass full errors object OR...
                     getValidationError={getValidationError} // Pass the memoized getter function
                 />
            </div>

            {/* Submit Button Area */}
            <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
                <button
                    className="btn btn-primary btn-wide"
                    onClick={handleSubmit}
                    disabled={submitLoading || loadingProducts || loadingShow} // Disable while submitting or initial loading
                    aria-label="Update show products"
                >
                    {submitLoading ? (
                        <>
                            <span className="loading loading-spinner loading-xs"></span> Updating...
                        </>
                    ) : (
                        "Update Show Products"
                    )}
                </button>
            </div>

             {/* Global Validation Error Message */}
             {Object.keys(validationErrors).length > 0 && (
                 <p className='text-error text-sm text-center mt-3 font-medium'>
                     <AlertCircle size={16} className='inline mr-1 mb-px'/>
                     Please fix the errors in the selected product lists above.
                 </p>
            )}

            {/* Discard Changes Modal */}
            {showModal && (
                 <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 modal modal-open" aria-modal="true" role="dialog">
                     <div className="modal-box max-w-md w-full bg-white rounded-lg shadow-xl">
                         <h3 className="font-bold text-lg text-error flex items-center">
                             <AlertCircle size={20} className="mr-2"/> Discard Unsaved Changes?
                         </h3>
                         <p className="py-4 text-gray-600">Are you sure you want to leave this page? Any changes you made will be lost.</p>
                         <div className="modal-action justify-end gap-3 mt-4"> {/* Align buttons right */}
                             <button onClick={handleConfirmDiscard} className="btn btn-error">
                                 Yes, Discard
                             </button>
                             <button onClick={handleCancelDiscard} className="btn btn-ghost">
                                 No, Keep Editing
                             </button>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    );
};

// Import X if needed for search clear button
import { X } from 'lucide-react';

export default ShipperEditTaggedProducts;