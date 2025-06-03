import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { generateSignedUrl } from "../../utils/aws";
import { USER_FEED_PRODUCTS } from "../api/apiDetails";
import { useNavigate } from "react-router-dom";

const ProductsFeed = () => {
  const [products, setProducts] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const prod = await axiosInstance.get(USER_FEED_PRODUCTS);
      const productsData = prod.data.data || [];
      setProducts(productsData);

      // Generate signed URLs for only the first image of each product
      const urlPromises = productsData.map(async (product) => {
        const imageKey = product.images?.[0];
        if (!imageKey) return { id: product._id, url: null };
        const url = await generateSignedUrl(imageKey);
        return { id: product._id, url };
      });

      const resolvedUrls = await Promise.all(urlPromises);
      const urlMap = resolvedUrls.reduce((acc, { id, url }) => {
        acc[id] = url;
        return acc;
      }, {});
      setSignedUrls(urlMap);
    } catch (error) {
      console.error("Error fetching products:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="card bg-base-100 shadow-xl animate-pulse">
              <figure className="h-48 bg-gray-300"></figure>
              <div className="card-body p-4">
                <div className="flex items-center gap-2">
                  <div className="avatar placeholder">
                    <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                  </div>
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                </div>
                <div className="h-5 bg-gray-300 rounded w-3/4 mt-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mt-1"></div>
                <div className="h-8 bg-gray-300 rounded w-full mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            {/* <ShoppingBagIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" /> */}
            <h1 className="text-2xl font-bold text-base-content">No Products Available</h1>
            <p className="py-6">We don't have any products to show right now. Please check back later.</p>
          </div>
        </div>
      </div>
    );
  }
  const handleProfileView = (id) => {
    navigate(`/profile/user/${id}`)
  }

  const handleProductView = (id) => {
    window.open(`/user/product/${id}`, '_blank');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Explore Products</h1> */}

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            className="relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 flex flex-col h-full"
          >
            <div className="relative pb-[75%] overflow-hidden bg-gray-100">
              <img
                src={product.images[0].azureUrl || "/placeholder.svg"}
                alt={product.title + " image"}
                className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/placeholder.svg";
                }}
              />
            </div>

            <div className="p-3 flex-grow flex flex-col">
              <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => handleProfileView(product.sellerId.userInfo.userName)}>
                <img
                  src={
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      product.sellerId?.userInfo?.userName || "User"
                    )}&background=random&size=64`
                  }
                  alt="profile"
                  className="w-8 h-8 rounded-full object-cover shadow-sm"
                />

                <div className="flex flex-col overflow-hidden">
                  <h3 className="text-xs font-semibold text-gray-700 truncate">
                    {product.sellerId?.companyName || "Company"}
                  </h3>
                  <h3 className="text-xs text-gray-500 truncate">
                    @{product.sellerId?.userInfo?.userName || "user"}
                  </h3>
                </div>
              </div>

              <h2
                className="text-sm md:text-base font-bold text-gray-800 line-clamp-2 mb-1 transition-all duration-300 ease-in-out cursor-pointer hover:text-blue-600 hover:scale-105 hover:underline"
                onClick={() => handleProductView(product._id)}
              >
                {product.title}
              </h2>


              <p className="text-base md:text-lg text-gray-800 font-semibold mb-1">
                {
                  new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                  }).format(product.productPrice)
                }
              </p>

              <p className="text-xs text-gray-500 mb-3 truncate">
                {product.category} {product.subcategory ? `• ${product.subcategory}` : ''}
              </p>

              <div className="mt-auto">
                <button
                  className="w-full py-2 px-4 bg-newYellow hover:bg-amber-300 text-black font-medium rounded-lg transition-colors duration-300 text-sm shadow-sm"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsFeed;