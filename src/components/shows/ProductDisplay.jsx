import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Auctions from './Auctions';

const ProductDisplay = ({ show, showId, signedUrls }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Animation variants for products
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const productVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.03,
      boxShadow: "0px 10px 20px rgba(0,0,0,0.1)",
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <div className="p-6 bg-base-200 min-h-screen w-[20%]">
      <h2 className="text-3xl font-bold text-center mb-8 text-primary">Featured Products</h2>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {show?.taggedProducts?.map((taggedProduct) => (
          <motion.div 
            key={taggedProduct._id} 
            className="card bg-base-100 shadow-xl overflow-hidden"
            variants={productVariants}
            whileHover="hover"
            layout
          >
            {/* Product Image with skeleton loader */}
            <figure className="relative h-64 overflow-hidden bg-base-300">
              {taggedProduct.productId.images && taggedProduct.productId.images.length > 0 ? (
                <img
                  src={signedUrls[taggedProduct.productId] || taggedProduct.productId.images[0]}
                  alt={taggedProduct.productId.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className="animate-pulse w-full h-full bg-base-300 flex items-center justify-center">
                  <span className="text-base-content/40">Image loading...</span>
                </div>
              )}
              
              {/* Sale badge if applicable */}
              {taggedProduct.productId.onSale && (
                <div className="badge badge-secondary absolute top-4 right-4 p-3">SALE</div>
              )}
            </figure>
            
            <div className="card-body">
              <h3 className="card-title text-xl font-bold line-clamp-1">
                {taggedProduct.productId.title}
                {taggedProduct.productId.inStock ? (
                  <div className="badge badge-success gap-2 text-xs">
                    In Stock
                  </div>
                ) : (
                  <div className="badge badge-error gap-2 text-xs">
                    Out of Stock
                  </div>
                )}
              </h3>
              
              <p className="text-base-content/80 line-clamp-2 mb-2">
                {taggedProduct.productId.description}
              </p>
              
              <div className="divider my-2"></div>
              
              {/* Auctions component with animation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Auctions streamId={showId} product={taggedProduct} />
              </motion.div>
              
              <div className="card-actions justify-end mt-4">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setSelectedProduct(taggedProduct)}
                >
                  View Details
                </button>
                <button className="btn btn-outline btn-sm">
                  Add to Cart
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Modal for product details */}
      {selectedProduct && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg">{selectedProduct.productId.title}</h3>
            <p className="py-4">{selectedProduct.productId.description}</p>
            <div className="modal-action">
              <button 
                className="btn"
                onClick={() => setSelectedProduct(null)}
              >
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}></div>
        </div>
      )}
    </div>
  );
};

export default ProductDisplay;