import React, { useEffect, useRef, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { PAGINATED_PRODUCTS } from "../api/apiDetails";
import { useNavigate } from "react-router-dom";

const ProductsFeed = ({ totalProducts, products, sellerInfo, userInfo }) => {
  const [loading, setLoading] = useState(false);
  const [productList, setProductList] = useState(products);
  const navigate = useNavigate();

  const pageLimit = 20;
  const [currPage, setCurrPage] = useState(1);
  const totalPages = Math.ceil(totalProducts / pageLimit);

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

  const handleProfileView = () => {
    navigate(`/user/${userInfo.userName}`);
  };

  if (productList.length === 0) {
    return (
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold text-base-content">
              No Products Available
            </h1>
            <p className="py-6">
              We don't have any products to show right now. Please check back
              later.
            </p>
          </div>
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
    })
  }

  console.log("Products List:", productList);

  return (
    <div className="max-w-7xl mx-auto px-1 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {productList.map((product) => {
          const firstImage = product.images?.[0];
          let imageUrl = "/placeholder.jpg";
          if (firstImage) {
            imageUrl =
              typeof firstImage === "object"
                ? firstImage?.azureUrl
                : `https://flykup-public-files.s3.ap-southeast-2.amazonaws.com/${firstImage}`;
          }
          return (
            <div
              key={product._id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col"
            >
              <div className="relative pb-[75%] bg-gray-100">
                <img
                  src={imageUrl}
                  alt={product.title}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-3 flex flex-col flex-grow">
                <div
                  className="flex items-center gap-2 mb-2 cursor-pointer"
                  onClick={handleProfileView}
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      userInfo.userName || "User"
                    )}&background=000C&color=ffffff&uppercase=true`}
                    alt="avatar"
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="truncate">
                    <p className="text-xs font-semibold truncate">
                      {sellerInfo.companyName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      @{userInfo.userName}
                    </p>
                  </div>
                </div>
                <a 
                            href={`/user/product/${product._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="contents"
                        >
                <h2 className="text-sm font-bold line-clamp-2 mb-1">
                  {product.title}
                </h2>
                </a>
                <p className="text-lg font-semibold mb-1">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(product.productPrice)}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {[product.category, product.subcategory]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
                <button className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black py-2 rounded-lg"
                  onClick={() => handleBuyNow(product)}>
                  Buy Now
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {loading && (
        <div className="mt-4 text-center">
          <p>Loading more products...</p>
        </div>
      )}
    </div>
  );
};

export default ProductsFeed;
