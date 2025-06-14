// components/search/ProductResults.js
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

const PLACEHOLDER_IMAGE = "/placeholder.svg"; // Adjust path if needed
const AWS_CDN_URL = import.meta.env.VITE_AWS_CDN_URL; // Get CDN URL from environment

// Helper to format currency (adapt to your needs and locale)
const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) return '';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
    }).format(amount);
}

// Helper to generate CDN image URL
const generateImageUrl = (imageKey) => {
    if (!imageKey || !AWS_CDN_URL) return PLACEHOLDER_IMAGE;
    
    // Remove leading slash if present in CDN URL and ensure proper concatenation
    const cdnBase = AWS_CDN_URL.endsWith('/') ? AWS_CDN_URL.slice(0, -1) : AWS_CDN_URL;
    const key = imageKey.startsWith('/') ? imageKey.slice(1) : imageKey;
    
    return `${cdnBase}/${key}`;
}

// Reusing animation variants
const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: i => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" }
    }),
    hover: {
        scale: 1.03, y: -5,
        boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -2px rgba(0,0,0,0.05)",
        transition: { duration: 0.2 }
    }
};

const ProductResults = ({ products = [], isLoading, error, loadMore, hasMore }) => {
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '200px 0px',
        triggerOnce: false
    });

    useEffect(() => {
        if (inView && hasMore && !isLoading) {
            loadMore();
        }
    }, [inView, hasMore, isLoading, loadMore]);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, index) => {
                 const imageKey = product?.images?.[0]?.key;
                 const imageUrl = generateImageUrl(imageKey);
                 const price = product?.productPrice;
                 const mrp = product?.MRP;
                 const hasDiscount = mrp != null && price != null && mrp > price; // Check for nulls
                 const discountPercent = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0;
                 const productId = product?._id;

                 return (
                    <motion.div
                        key={productId || index}
                        className="card card-compact bg-white shadow-md hover:shadow-xl border border-gray-100 overflow-hidden group cursor-pointer"
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        custom={index}
                    >
                        <a 
                            href={`/user/product/${productId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="contents"
                        >
                            <figure className="aspect-square bg-gray-50 p-2">
                                <img
                                    src={imageUrl}
                                    alt={product?.title || 'Product image'}
                                    className="w-full h-full object-contain mix-blend-multiply"
                                    onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                                    loading="lazy"
                                />
                            </figure>
                            <div className="card-body p-4">
                                <h2 className="card-title text-sm font-medium text-gray-800 line-clamp-2 h-10" title={product?.title || 'No Title'}>
                                    {product?.title || 'No Title Provided'}
                                </h2>
                                {/* Seller info */}
                                <div className="flex items-center gap-2 mt-1">
                                    {product?.sellerProfileURL && (
                                        <img 
                                            src={product.sellerProfileURL} 
                                            alt={product?.sellerCompanyName || "Seller"} 
                                            className="w-5 h-5 rounded-full object-cover"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    )}
                                    <span className="text-xs text-gray-500 truncate">
                                        {product?.sellerCompanyName || product?.sellerUserName || "Unknown Seller"}
                                    </span>
                                </div>
                                {/* Price Section */}
                                <div className="flex items-baseline gap-2 mt-2">
                                    {price != null && (
                                        <span className="text-lg font-semibold text-gray-900">{formatCurrency(price)}</span>
                                    )}
                                    {hasDiscount && mrp != null && (
                                        <span className="text-sm text-gray-400 line-through">{formatCurrency(mrp)}</span>
                                    )}
                                </div>
                                
                                {hasDiscount && discountPercent > 0 && (
                                    <div className="badge bg-green-50 text-green-600 border border-green-200 text-xs mt-1 px-2 py-0.5 rounded">
                                        {discountPercent}% off
                                    </div>
                                )}
                            </div>
                        </a>
                        
                        {/* Actions - Example Add to Cart Button - Outside Link to not trigger navigation */}
                        <div className="px-4 pb-4">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button 
                                    className="w-full btn bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-md py-1.5 text-sm font-medium flex items-center justify-center gap-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Add to cart functionality here
                                    }}
                                >
                                    <ShoppingCart size={16}/> Add to Cart
                                </button>
                            </div>
                        </div>
                    </motion.div>
                 );
            })}

            {/* Sentinel Element for Intersection Observer */}
            {hasMore && (
                <div ref={ref} className="col-span-full h-10" />
            )}
        </div>
    );
};

export default ProductResults;