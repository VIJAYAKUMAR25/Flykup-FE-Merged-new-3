import React from 'react';
import ImageWithSignedUrlShow from '../../../utils/ShowImage'; // Adjust path
import { PlusCircle, Info, Package, Percent } from "lucide-react"; // Added Percent icon

// ============================================================================
//  Internal Component: ProductSelectionList (Renders Accordion for Available)
// ============================================================================
const ProductSelectionList = ({
    availableGroupedProducts = [], // Expect grouped data [{ sellerInfo, products }]
    onSelect, // Function -> onSelect(type, product, event)
    openSellerId, // ID of the currently open accordion section
    setOpenSellerId, // Function to set the open accordion section
    isLoading,
    searchQuery,
    type // 'buyNow', 'auction', 'giveaway' - needed for the onSelect call
}) => {

    const toggleSellerAccordion = (sellerId) => {
        setOpenSellerId(prevId => prevId === sellerId ? null : sellerId);
    };

    const totalAvailableCount = availableGroupedProducts.reduce((sum, group) => sum + (group?.products?.length || 0), 0);

    return (
        <div className="mb-6">
            {/* Section Header */}
            <h3 className="text-lg font-bold mb-3 flex items-center text-gray-700">
                Available Products
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    {totalAvailableCount}
                </span>
            </h3>

            {/* Container for Accordions with scroll */}
            <div className="border border-gray-200 rounded-lg bg-gray-50 h-80 overflow-y-auto p-2 space-y-2 custom-scrollbar"> {/* Increased default height */}
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
                    // Accordion mapping
                    availableGroupedProducts.map(group => {
                        if (!group || !group.sellerInfo || !group.products) return null; // Basic data validation
                        const isOpen = openSellerId === group.sellerInfo._id;
                        return (
                            <div
                                key={group.sellerInfo._id}
                                tabIndex={0}
                                // DaisyUI collapse classes with dynamic open/close state
                                className={`collapse collapse-arrow border border-base-300 bg-base-100 rounded-md shadow-sm transition-all duration-300 ${isOpen ? 'collapse-open' : 'collapse-close'}`}
                            >
                                {/* Accordion Title - clickable */}
                                <div
                                    className="collapse-title text-md font-semibold cursor-pointer flex justify-between items-center" // Increased font-semibold
                                    onClick={() => toggleSellerAccordion(group.sellerInfo._id)}
                                >
                                    {/* Seller Info with optional avatar/initials */}
                                    <div className='flex items-center gap-2 overflow-hidden'>
                                        <div className="avatar placeholder flex-shrink-0">
                                            <div className="bg-neutral-focus text-neutral-content rounded-full w-6 h-6 text-xs"> {/* Smaller avatar */}
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
                                {/* Accordion Content - contains the table */}
                                <div className="collapse-content !p-0 !pb-2 !pt-1"> {/* Adjusted padding */}
                                    <div className="overflow-x-auto bg-white rounded-b-md"> {/* Added bg color */}
                                        <table className="min-w-full table table-sm"> {/* DaisyUI table classes */}
                                            {/* --- TABLE HEADERS --- */}
                                            <thead >
                                                <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                                                    <th className="px-3 py-2 font-medium">Image</th>
                                                    <th className="px-3 py-2 font-medium">Product Details</th>
                                                    <th className="px-3 py-2 font-medium text-center">Commission</th>
                                                    <th className="px-3 py-2 font-medium text-center">Stock</th>
                                                    <th className="px-3 py-2 font-medium text-center">Action</th>
                                                </tr>
                                            </thead>
                                            {/* --- END TABLE HEADERS --- */}
                                            <tbody className="divide-y divide-gray-100">
                                                {group.products.map((product) => {
                                                    if (!product || !product._id) return null;
                                                    const firstImageKey = Array.isArray(product.images) && product.images.length > 0 ? product.images[0]?.key || product.images[0] : null;
                                                    return (
                                                        <tr key={product._id} className="hover align-middle"> {/* Use align-middle */}
                                                            {/* Image */}
                                                            <td className="px-3 py-2 w-16">
                                                                <ImageWithSignedUrlShow
                                                                    imageKey={firstImageKey}
                                                                    imageUrl={product.imageUrl}
                                                                    altText={product.title}
                                                                    className="w-12 h-12 object-cover rounded-md border" // Added border
                                                                />
                                                            </td>
                                                            {/* Details */}
                                                            <td className="px-3 py-2 max-w-xs"> {/* Added max-width */}
                                                                <div className="font-medium text-gray-800 line-clamp-2 text-sm" title={product.title}>{product.title || 'N/A'}</div> {/* Allow wrapping */}
                                                                <div className="text-xs text-gray-500">{product.category || 'N/A'} / {product.subcategory || 'N/A'}</div>
                                                            </td>
                                                            {/* Commission */}
                                                            <td className="px-3 py-2 whitespace-nowrap w-20 text-center">
                                                                <span className={`badge badge-success badge-outline badge-sm ${!product.commissionRate ? 'badge-ghost' : ''}`}>
                                                                    {product.commissionRate ?? '--'}<Percent size={12} className='mr-0.5' />
                                                                </span>
                                                            </td>
                                                            {/* Stock */}
                                                            <td className="px-3 py-2 whitespace-nowrap w-20 text-center">
                                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${product.quantity > 10 ? 'bg-green-100 text-green-800' : product.quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                                    {product.quantity ?? 'N/A'} units
                                                                </span>
                                                            </td>
                                                            {/* Action */}
                                                            <td className="px-3 py-2 whitespace-nowrap text-center w-24">
                                                                <button
                                                                    className="btn btn-xs btn-primary btn-outline flex items-center gap-1 mx-auto" // Centered button
                                                                    onClick={(e) => onSelect(type, product, e)}
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

// Make sure to export if this is in its own file
export default ProductSelectionList;