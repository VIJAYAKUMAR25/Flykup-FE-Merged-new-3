import React from 'react';
import ImageWithSignedUrlShow from '../../../utils/ShowImage'; // Adjust path
import { Trash, DollarSign, Shield, ArrowDown, Percent, PackageX } from "lucide-react"; // Make sure Percent is imported

// ============================================================================
//  Internal Component: SelectedProductList (Renders Table for Selected Items)
// ============================================================================
const SelectedProductList = ({
    selected = [], // Expects array like [{productId, title, images, imageUrl?, productPrice?, startingPrice?, reservedPrice?, followersOnly?, commissionRate?}]
    onRemove, // Function -> onRemove(type, productId, event)
    onChange, // Function -> onChange(productId, field, value, type)
    type, // 'buyNow', 'auction', 'giveaway'
    validationErrors = {},
    getValidationError // Function -> getValidationError(type, index, field)
}) => {

    // Determine title based on type
    const listTitle = type === 'buyNow' ? 'Buy Now Items' : type === 'auction' ? 'Auction Items' : 'Giveaway Items';

    if (!selected || selected.length === 0) {
        return (
             <div className="text-center text-gray-400 py-10 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center min-h-[150px]">
                <PackageX size={32} className="mb-2 text-gray-300"/>
                <p className='font-medium'>No products selected for <span className="font-semibold">{listTitle}</span> yet.</p>
                <p className='text-xs mt-1'>Add products from the list above.</p>
            </div>
        );
    }

    return (
        <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 text-gray-800">{listTitle}</h3> {/* Use dynamic title */}
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden max-h-72 overflow-y-auto custom-scrollbar">
                <div className="overflow-x-auto">
                    <table className="table table-sm min-w-full w-full"> {/* DaisyUI table classes */}
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-base-200 text-base-content"> {/* Use theme colors */}
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Image</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Title</th>
                                {/* Conditional Headers */}
                                {type === 'buyNow' && <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Sell Price (₹)*</th>}
                                {type === 'auction' && <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Start Price (₹)*</th>}
                                {type === 'auction' && <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Reserve Price (₹)</th>}
                                {type === 'giveaway' && <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Followers Only?</th>}
                                {/* --- ADDED Commission Header --- */}
                                <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Commission</th>
                                {/* --- END Commission Header --- */}
                                <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-base-200">
                           {selected.map((product, index) => {
                               if (!product || !product.productId) return null;
                               // --- FIX: Safer image key access ---
                               const firstImageKey = Array.isArray(product.images) && product.images.length > 0 ? product.images[0]?.key || product.images[0] : null;
                               return (
                                   <tr key={product.productId} className="hover align-middle">
                                       {/* Image */}
                                       <td className="px-3 py-2 w-16">
                                           <ImageWithSignedUrlShow
                                               imageKey={firstImageKey}
                                               imageUrl={product.imageUrl || null}
                                               altText={product.title}
                                               className="w-12 h-12 object-cover rounded-md border border-base-300"
                                           />
                                       </td>
                                       {/* Title */}
                                       <td className="px-3 py-2 max-w-xs">
                                           <div className="font-medium text-gray-800 line-clamp-2 text-sm" title={product.title}>
                                               {product.title || 'N/A'}
                                           </div>
                                       </td>

                                       {/* Conditional Inputs */}
                                       {type === 'buyNow' && (
                                           <td className="px-3 py-2 w-36">
                                               <label className={`input input-sm input-bordered flex items-center gap-1 ${getValidationError(type, index, "price") ? 'input-error' : ''}`}>
                                                    <span>₹</span>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={product.productPrice}
                                                        onChange={(e) => onChange(product.productId, "productPrice", e.target.value, 'buyNow')}
                                                        className="grow border-none focus:outline-none focus:ring-0 p-0 bg-transparent"
                                                        placeholder="Amount"
                                                        aria-label="Product Sell Price"
                                                    />
                                                </label>
                                               {getValidationError(type, index, "price") && <p className="text-error text-xs mt-1">{getValidationError(type, index, "price")}</p>}
                                           </td>
                                       )}
                                       {type === 'auction' && (
                                           <>
                                               <td className="px-3 py-2 w-36">
                                                    <label className={`input input-sm input-bordered flex items-center gap-1 ${getValidationError(type, index, "starting") ? 'input-error' : ''}`}>
                                                        <span>₹</span>
                                                        <input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={product.startingPrice}
                                                            onChange={(e) => onChange(product.productId, "startingPrice", e.target.value, 'auction')}
                                                            className="grow border-none focus:outline-none focus:ring-0 p-0 bg-transparent"
                                                            placeholder="Start"
                                                            aria-label="Auction Starting Price"
                                                        />
                                                    </label>
                                                   {getValidationError(type, index, "starting") && <p className="text-error text-xs mt-1">{getValidationError(type, index, "starting")}</p>}
                                               </td>
                                               <td className="px-3 py-2 w-36">
                                                    <label className={`input input-sm input-bordered flex items-center gap-1 ${getValidationError(type, index, "reserved") ? 'input-error' : ''}`}>
                                                        <span>₹</span>
                                                        <input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={product.reservedPrice}
                                                            onChange={(e) => onChange(product.productId, "reservedPrice", e.target.value, 'auction')}
                                                            className="grow border-none focus:outline-none focus:ring-0 p-0 bg-transparent"
                                                            placeholder="Reserve (Optional)"
                                                            aria-label="Auction Reserve Price"
                                                        />
                                                    </label>
                                                   {getValidationError(type, index, "reserved") && <p className="text-error text-xs mt-1">{getValidationError(type, index, "reserved")}</p>}
                                               </td>
                                           </>
                                       )}
                                       {type === 'giveaway' && (
                                           <td className="px-3 py-2 text-center">
                                               <input
                                                   type="checkbox"
                                                   checked={!!product.followersOnly}
                                                   // --- FIX: Pass 'type' and 'field' to onChange ---
                                                   onChange={(e) => onChange(product.productId, "followersOnly", e.target.checked, 'giveaway')}
                                                   // --- END FIX ---
                                                   className="toggle toggle-primary toggle-sm"
                                                   aria-label="Followers Only Toggle"
                                               />
                                           </td>
                                       )}

                                        {/* --- ADDED Commission Rate Display --- */}
                                        <td className="px-3 py-2 whitespace-nowrap w-20 text-center">
                                            {/* Access commissionRate from the product object in selected state */}
                                            <span className={`badge badge-sm font-medium ${(product?.commissionRate ?? 0) > 0 ? 'badge-success badge-outline' : 'badge-ghost'}`}>
                                            {product?.commissionRate ?? '--'}<Percent size={12} className='mr-0.5'/>
                                            </span>
                                        </td>
                                        {/* --- END Commission Rate Display --- */}

                                       {/* Action Button */}
                                       <td className="px-3 py-2 whitespace-nowrap text-center w-24">
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

// --- No export needed if defined in the same file as parent ---
export default SelectedProductList;