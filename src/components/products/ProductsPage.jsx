"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axiosInstance from "../../utils/axiosInstance"
import { USER_PRODUCT } from "../api/apiDetails"
import { generateSignedUrl } from "../../utils/aws.js"
import {
    ShieldCheck,
    Store,
    MapPin,
    Package,
    Tag,
    Info,
    ChevronLeft,
    ChevronRight,
    Share2,
    Heart,
    Star,
    Truck,
    Clock,
    Shield,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext.jsx"
import { useCart } from "../../context/CartContext.jsx"
import { motion } from "framer-motion"
import { useAlert } from "../Alerts/useAlert.jsx"
import ProductImageGallery from "./ProductsImageGallery.jsx"

const ProductPage = () => {
    const { user } = useAuth()
    const { cart, addProduct } = useCart()
    const { productId } = useParams()
    const navigate = useNavigate()
    const [product, setProduct] = useState(null)
    const [seller, setSeller] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [activeImageIndex, setActiveImageIndex] = useState(0)
    const [selectedQuantity, setSelectedQuantity] = useState(1)
    const [wishlist, setWishlist] = useState(false)
    const { positive, negative } = useAlert()

    useEffect(() => {
        const fetchProductAndSellerDetails = async () => {
            try {
                const productResponse = await axiosInstance.get(USER_PRODUCT.replace(":id", productId))
                if (productResponse.status === 200 && productResponse.data.status) {
                    const productData = productResponse.data.data
                    // Generate signed URLs for images
                    if (Array.isArray(productData.images)) {
                        const updatedImages = await Promise.all(
                            productData.images.map(async (imagePath) => {
                                try {
                                    const signedUrl = await generateSignedUrl(imagePath)
                                    return signedUrl
                                } catch (err) {
                                    console.error("Error generating signed product image URL:", err)
                                    return `/${imagePath}`
                                }
                            }),
                        )
                        productData.signedImages = updatedImages
                    }
                    setProduct(productData)
                    setSeller(productData.sellerId)
                } else {
                    setError("Failed to fetch product details.")
                }
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchProductAndSellerDetails()
    }, [productId])

    // Carousel Navigation
    const handlePrev = () => {
        setActiveImageIndex((prevIndex) =>
            product?.signedImages?.length ? (prevIndex === 0 ? product.signedImages.length - 1 : prevIndex - 1) : 0,
        )
    }

    const handleNext = () => {
        setActiveImageIndex((prevIndex) =>
            product?.signedImages?.length ? (prevIndex === product.signedImages.length - 1 ? 0 : prevIndex + 1) : 0,
        )
    }

    // Navigate to checkout with an array of products
    const handleBuyNow = () => {
        navigate("/profile/checkout", {
            state: {
                products: [{ product, quantity: selectedQuantity }],
                isFromMyCart: false,
            },
        })
    }

    // "Add to Cart" uses the selected quantity from above
    const handleAddToCart = () => {
        addProduct(product, selectedQuantity)
        positive("Added to cart!")
    }

    // Share button handler
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.title,
                    text: product.description,
                    url: window.location.href,
                })
            } catch (error) {
                console.error("Error sharing:", error)
            }
        } else {
            navigator.clipboard.writeText(window.location.href)
            alert("Link copied to clipboard!")
        }
    }

    // Toggle wishlist
    const toggleWishlist = () => {
        setWishlist(!wishlist)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
                <div className="flex flex-col items-center">
                    <div className="loading loading-spinner loading-lg text-amber-500"></div>
                    <p className="mt-4 text-lg text-gray-700 font-medium">Loading product details...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 p-4">
                <div className="alert alert-error shadow-lg max-w-md">
                    <div className="flex items-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="stroke-current flex-shrink-0 h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span>{error}</span>
                    </div>
                    <div className="flex-none">
                        <button className="btn btn-sm btn-warning" onClick={() => navigate(-1)}>
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Destructure product data
    const { title, description, quantity, signedImages, MRP, productPrice, weight, hsnNo } = product || {}

    const primaryImage = signedImages?.[activeImageIndex] || "https://via.placeholder.com/600x400?text=No+Image"

    // Dummy recommended data
    const recommendedProducts = [
        { id: 1, title: "Recommended Product 1", image: "https://via.placeholder.com/300?text=Product+1", price: "₹999" },
        { id: 2, title: "Recommended Product 2", image: "https://via.placeholder.com/300?text=Product+2", price: "₹1299" },
        { id: 3, title: "Recommended Product 3", image: "https://via.placeholder.com/300?text=Product+3", price: "₹899" },
        { id: 4, title: "Recommended Product 4", image: "https://via.placeholder.com/300?text=Product+4", price: "₹1099" },
        { id: 11, title: "Recommended Product 1", image: "https://via.placeholder.com/300?text=Product+1", price: "₹999" },
        { id: 12, title: "Recommended Product 2", image: "https://via.placeholder.com/300?text=Product+2", price: "₹1299" },
        { id: 13, title: "Recommended Product 3", image: "https://via.placeholder.com/300?text=Product+3", price: "₹899" },
        { id: 14, title: "Recommended Product 4", image: "https://via.placeholder.com/300?text=Product+4", price: "₹1099" },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100">
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumbs */}
                <div className="text-sm breadcrumbs mb-6">
                    <ul className="flex flex-wrap">
                        <li>
                            <a className="text-amber-700 hover:text-amber-900">Home</a>
                        </li>
                        <li>
                            <a className="text-amber-700 hover:text-amber-900">Products</a>
                        </li>
                        <li className="text-amber-900 font-medium">{title}</li>
                    </ul>
                </div>

                {/* Product Main Section */}
                <div className="card lg:card-side bg-base-100 shadow-xl overflow-hidden border border-amber-100">
                    {/* Product Image Gallery */}
                    <figure className="lg:w-1/2 flex flex-col relative bg-gradient-to-br from-amber-50 to-white p-6 rounded-2xl shadow-lg">
                        <div className="carousel w-full overflow-hidden rounded-2xl border border-amber-100 shadow-inner relative">
                            <div className="carousel-item w-full relative">
                                <img
                                    src={primaryImage || "/placeholder.svg"}
                                    alt={title || "Product Image"}
                                    className="w-full md:h-[500px] h-[300px] object-contain bg-white transition-all duration-500"
                                />

                                {signedImages?.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrev}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-amber-500 text-amber-700 hover:text-white rounded-full p-2 shadow-md transition-all duration-300"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-amber-500 text-amber-700 hover:text-white rounded-full p-2 shadow-md transition-all duration-300"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Image Thumbnails */}
                        {signedImages?.length > 1 && (
                            <div className="flex flex-wrap justify-center gap-3 py-5 mt-6 px-2 border-t border-amber-100">
                                {signedImages.map((img, index) => (
                                    <div
                                        key={index}
                                        className={`cursor-pointer transition-transform duration-300 ${activeImageIndex === index
                                                ? "ring-2 ring-amber-500 ring-offset-2 scale-105"
                                                : "opacity-70 hover:opacity-100"
                                            }`}
                                        onClick={() => setActiveImageIndex(index)}
                                    >
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border border-amber-200 bg-white shadow-sm">
                                            <img
                                                src={img || "/placeholder.svg"}
                                                alt={`Thumbnail ${index + 1}`}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </figure>

                    {/* <ProductImageGallery signedImages={signedImages} /> */}


                    {/* Product Details */}
                    <div className="card-body lg:w-1/2 p-6 lg:p-8">
                        <div className="flex justify-between items-start">
                            <h1 className="card-title md:text-3xl text-xl font-bold text-amber-900">{title}</h1>
                            <button
                                className={`btn btn-circle ${wishlist ? "bg-red-500 text-white hover:bg-red-600" : "btn-ghost text-amber-500 hover:bg-amber-100"
                                    } border-none`}
                                onClick={toggleWishlist}
                            >
                                <Heart className={wishlist ? "fill-current" : ""} size={20} />
                            </button>
                        </div>

                        <div className="flex items-center mt-2">
                            <div className="rating rating-sm">
                                {[1, 2, 3, 4].map((i) => (
                                    <input
                                        key={i}
                                        type="radio"
                                        name="rating-2"
                                        className="mask mask-star-2 bg-amber-500"
                                        checked
                                        readOnly
                                    />
                                ))}
                                <input type="radio" name="rating-2" className="mask mask-star-2 bg-amber-300" checked readOnly />
                            </div>
                            <span className="text-sm ml-2 text-amber-700">(128 reviews)</span>
                        </div>

                        {/* Pricing */}
                        <div className="flex items-baseline space-x-4 mt-4">
                            <p className="md:text-3xl text-2xl font-bold text-amber-600">₹{productPrice}</p>
                            {MRP && MRP > productPrice && (
                                <>
                                    <span className="text-gray-500 line-through">₹{MRP}</span>
                                    <div className="badge badge-warning text-amber-900 font-medium">
                                        {Math.round(((MRP - productPrice) / MRP) * 100)}% off
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Description */}
                        <div className="mt-4">
                            <h3 className="font-semibold text-amber-900 mb-2">Description</h3>
                            <p className="text-gray-700">{description}</p>
                        </div>

                        {/* Product Benefits */}
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-lg">
                                <Truck className="text-amber-600" size={20} />
                                <span className="text-sm font-medium">Fast Delivery</span>
                            </div>
                            <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-lg">
                                <Shield className="text-amber-600" size={20} />
                                <span className="text-sm font-medium">Quality Assured</span>
                            </div>
                            <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-lg">
                                <Clock className="text-amber-600" size={20} />
                                <span className="text-sm font-medium">24/7 Support</span>
                            </div>
                            <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-lg">
                                <Star className="text-amber-600" size={20} />
                                <span className="text-sm font-medium">Top Rated</span>
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="divider my-6"></div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-amber-50 p-4 rounded-lg text-center">
                                <Package className="w-5 h-5 mx-auto mb-2 text-amber-600" />
                                <div className="text-xs text-amber-800 font-medium">Quantity</div>
                                <div className="font-semibold text-amber-900">{quantity || "N/A"}</div>
                            </div>

                            <div className="bg-amber-50 p-4 rounded-lg text-center">
                                <Tag className="w-5 h-5 mx-auto mb-2 text-amber-600" />
                                <div className="text-xs text-amber-800 font-medium">HSN</div>
                                <div className="font-semibold text-amber-900">{hsnNo || "N/A"}</div>
                            </div>

                            <div className="bg-amber-50 p-4 rounded-lg text-center">
                                <Info className="w-5 h-5 mx-auto mb-2 text-amber-600" />
                                <div className="text-xs text-amber-800 font-medium">Weight</div>
                                <div className="font-semibold text-amber-900">{weight || "N/A"}</div>
                            </div>
                        </div>

                        {/* Quantity Control */}
                        <div className="form-control w-full max-w-xs my-6">
                            <label className="label">
                                <span className="label-text font-medium text-amber-900">Select Quantity</span>
                            </label>
                            <div className="join">
                                <button
                                    className="join-item btn bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-200"
                                    onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                                >
                                    -
                                </button>
                                <div className="join-item btn bg-white pointer-events-none w-16 text-amber-900 border-amber-200">
                                    {selectedQuantity}
                                </div>
                                <button
                                    className="join-item btn bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-200"
                                    onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 flex md:flex-row flex-col gap-3">
                            <motion.button
                                onClick={handleBuyNow}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 btn btn-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 border-none font-bold"
                            >
                                Buy Now
                            </motion.button>
                            <motion.button
                                onClick={handleAddToCart}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 btn btn-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-none font-bold"
                            >
                                Add to Cart
                            </motion.button>
                            <motion.button
                                onClick={handleShare}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn btn-circle btn-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-none"
                            >
                                <Share2 size={20} />
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Seller Information */}
                {seller && (
                    <div className="card bg-base-100 shadow-xl mt-8 border border-amber-100 overflow-hidden">
                        <div className="card-body">
                            <h2 className="card-title text-2xl text-amber-900 flex items-center gap-2">
                                <Store className="text-amber-600" size={24} />
                                Seller Information
                            </h2>
                            <div className="divider my-2"></div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-xl">
                                    <div
                                        className="flex items-center gap-4 cursor-pointer hover:bg-amber-50 p-3 rounded-lg transition-colors"
                                        onClick={() => navigate(`/profile/${seller.userInfo.userName}`)}
                                    >
                                        <div className="avatar">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white flex items-center justify-center">
                                                <Store className="w-8 h-8" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-amber-900">{seller.companyName}</h3>
                                            <div className="badge badge-warning text-amber-900 font-medium mt-1">
                                                {seller.sellerType} Seller
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 space-y-3">
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                                            <MapPin className="text-amber-600" size={18} />
                                            <span className="font-medium text-amber-900">{seller.businessType} Business</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                                            <ShieldCheck className="text-emerald-600" size={18} />
                                            <span className="font-medium text-amber-900">
                                                Approval Status: <span className="text-emerald-600">{seller.approvalStatus}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-xl">
                                    <h4 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                                        <Star className="text-amber-500" size={18} />
                                        Seller Expertise
                                    </h4>

                                    <div className="space-y-4">
                                        <div className="bg-white p-4 rounded-lg shadow-sm">
                                            <div className="font-medium text-amber-900 mb-2">Experience</div>
                                            <div className="text-gray-700">{seller.sellerExperienceInfo?.experience || "N/A"}</div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg shadow-sm">
                                            <div className="font-medium text-amber-900 mb-2">Selling Channels</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {seller.sellerExperienceInfo?.offline?.map((channel, index) => (
                                                    <div key={index} className="badge badge-outline badge-lg gap-1">
                                                        <Store size={12} />
                                                        {channel}
                                                    </div>
                                                ))}
                                                {seller.sellerExperienceInfo?.online?.length === 0 && (
                                                    <div className="text-gray-500 italic">No online channels</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg shadow-sm">
                                            <div className="font-medium text-amber-900 mb-2">Product Categories</div>
                                            <div className="flex flex-wrap gap-2">
                                                {seller.productCategories?.map((category, index) => (
                                                    <div key={index} className="badge badge-warning text-amber-900 gap-1">
                                                        <Tag size={12} />
                                                        {category}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recommended Products Section */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-amber-900 mb-6 flex items-center gap-2">
                        <Star className="text-amber-500" size={24} />
                        Recommended Products
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {recommendedProducts.map((prod) => (
                            <motion.div
                                key={prod.id}
                                className="card bg-base-100 shadow-md hover:shadow-xl transition-all border border-amber-100 overflow-hidden"
                                whileHover={{ y: -5 }}
                            >
                                <figure className="relative h-48 overflow-hidden bg-white">
                                    <img
                                        src={prod.image || "/placeholder.svg"}
                                        alt={prod.title}
                                        className="h-full w-full object-contain p-2"
                                    />
                                    <div className="absolute top-2 right-2">
                                        <button className="btn btn-circle btn-xs bg-white text-amber-500 hover:bg-amber-500 hover:text-white border border-amber-200">
                                            <Heart size={12} />
                                        </button>
                                    </div>
                                </figure>
                                <div className="card-body p-4">
                                    <h3 className="card-title text-base text-amber-900">{prod.title}</h3>
                                    <p className="text-amber-600 font-semibold">{prod.price}</p>
                                    <div className="card-actions justify-end mt-2">
                                        <button className="btn btn-sm btn-warning text-amber-900 font-medium">View</button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductPage
