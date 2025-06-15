import React, { useEffect, useRef, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { PAGINATED_PRODUCTS } from "../api/apiDetails";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";

const ProductsFeed = ({ totalProducts, products, sellerInfo, userInfo }) => {
  const [loading, setLoading] = useState(false);
  const [productList, setProductList] = useState(products);
  const [favorites, setFavorites] = useState(new Set());
  const navigate = useNavigate();

  const pageLimit = 20;
  const [currPage, setCurrPage] = useState(1);
  const totalPages = Math.ceil(totalProducts / pageLimit);

  // Use environment variable for AWS CDN URL
  const AWS_CDN_URL = import.meta.env.VITE_AWS_CDN_URL;

  // Use a ref to track the current loading state
  const loadingRef = useRef(loading);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const fetchMoreProducts = async () => {
    if (currPage >= totalPages) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        PAGINATED_PRODUCTS.replace(":sellerId", sellerInfo._id),
        {
          params: {
            page: currPage + 1,
            limit: pageLimit,
          },
        }
      );
      const newProducts = res.data.data;
      setProductList((prevProducts) => [...prevProducts, ...newProducts]);
      setCurrPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("Error in fetchMoreProducts:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // fetching more products when near the bottom
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.offsetHeight
      ) {
        // Use the ref value to check current loading state
        if (loadingRef.current || currPage >= totalPages) return;
        fetchMoreProducts();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currPage, totalPages]);

  const handleFavorite = (productId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

  const calculateDiscount = (mrp, productPrice) => {
    if (!mrp || mrp <= productPrice) return 0;
    return Math.round(((mrp - productPrice) / mrp) * 100);
  };

  if (productList.length === 0) {
    return (
      <div className="min-h-screen bg-blackDark flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-whiteLight mb-4">
            No Products Available
          </h1>
          <p className="text-whiteHalf text-sm md:text-base">
            We don't have any products to show right now. Please check back
            later.
          </p>
        </div>
      </div>
    );
  }

  const handleBuyNow = (product) => {
    navigate("/home/checkout", {
      state: {
        products: [{ product, quantity: 1 }],
        isFromMyCart: false,
      },
    });
  };

  console.log("Products List:", productList);

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-2 md:py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {productList.map((product) => {
            const firstImage = product.images?.[0];
            let imageUrl = "/placeholder.jpg";
            if (firstImage) {
              imageUrl = typeof firstImage === "object" 
                ? firstImage?.azureUrl || `${AWS_CDN_URL}${firstImage?.key}`
                : `${AWS_CDN_URL}${firstImage}`;
            }
            
            const discountPercentage = calculateDiscount(product.MRP, product.productPrice);
            
            return (
              <div
                key={product._id}
                className="bg-blackLight rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-blackLight hover:border-newYellow/30"
              >
                {/* Full Cover Image Container */}
                <div className="relative w-full h-48 md:h-52 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
                  />
                  
                  {/* Gradient overlay for better text visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-blackDark/60 via-transparent to-blackDark/20"></div>
                  
                  {/* Favorite Button */}
                  <button
                    onClick={() => handleFavorite(product._id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-blackDark/80 backdrop-blur-sm hover:bg-blackDark/90 transition-all duration-200 hover:scale-110 shadow-lg"
                  >
                    <Heart
                      size={16}
                      className={`${
                        favorites.has(product._id)
                          ? "fill-red-500 text-red-500"
                          : "text-whiteLight hover:text-red-500"
                      } transition-colors duration-200`}
                    />
                  </button>
                  
                  {/* Discount Badge */}
                  {discountPercentage > 0 && (
                    <div className="absolute top-3 left-3 bg-newYellow text-blackDark font-bold px-2 py-1 rounded-md text-xs shadow-lg">
                      {discountPercentage}% OFF
                    </div>
                  )}
                </div>

                {/* Product Content */}
                <div className="p-4 space-y-3">
                  {/* Product Title */}
                  <a 
                    href={`/user/product/${product._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <h2 className="text-sm md:text-base font-bold text-whiteLight truncate hover:text-newYellow transition-colors cursor-pointer">
                      {product.title}
                    </h2>
                  </a>

                  {/* Category with Icon */}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-newYellow rounded-full"></div>
                    <p className="text-xs text-whiteHalf truncate font-medium tracking-wide">
                      {[product.category, product.subcategory]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                  {/* Price Section */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg md:text-xl font-bold text-newYellow">
                        {new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                        }).format(product.productPrice)}
                      </p>
                      {product.MRP && product.MRP > product.productPrice && (
                        <p className="text-sm text-whiteHalf line-through">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                          }).format(product.MRP)}
                        </p>
                      )}
                    </div>
                    {discountPercentage > 0 && (
                      <p className="text-xs text-green-400 font-medium">
                        You save ₹{(product.MRP - product.productPrice).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>

                  {/* Buy Now Button */}
                  <button 
                    className="w-full bg-newYellow hover:bg-newYellow/90 text-blackDark font-semibold py-2.5 md:py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-newYellow/30 flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => handleBuyNow(product)}
                  >
                    <ShoppingCart size={16} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm md:text-base">Buy Now</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blackLight rounded-full shadow-lg border border-newYellow/20">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-newYellow border-t-transparent"></div>
              <p className="text-whiteLight font-medium text-sm">Loading more products...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsFeed;