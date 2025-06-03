import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Share, Play, ShoppingBag, Video, Calendar, Package, Store, ChevronLeft, Edit, Settings, Box, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { socketurl } from '../../../config';

const SellerProfileDummy = () => {
    const { user } = useAuth();
    const id = user.sellerInfo._id;
    const [sellerData, setSellerData] = useState({
        companyName: "",
        userInfo: {
            userName: ""
        }
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("products");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSellerData = async () => {
            try {
                const response = await fetch(`${socketurl}/api/seller/get/${id}`);
                const data = await response.json();
                setSellerData(data);
            } catch (error) {
                console.error('Error fetching seller data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSellerData();
    }, [id]);

    const dashboardData = {
        displayName: sellerData?.companyName || "Your Shop Name",
        username: sellerData?.userInfo?.userName || "shop_handle",
        profileUrl: "https://picsum.photos/id/1062/200/200",
        stats: {
            products: "1.2K",
            orders: "356",
            revenue: "₹2,34,567"
        },
        products: [
            { id: 1, name: "Kanchipuram Silk Saree", price: "₹5,499", stock: 42, image: "https://picsum.photos/id/1061/300/300" },
            { id: 2, name: "Tanjore Painting", price: "₹3,299", stock: 15, image: "https://picsum.photos/id/1063/300/300" },
            { id: 3, name: "Brass Lamp", price: "₹1,799", stock: 28, image: "https://picsum.photos/id/1064/300/300" },
        ],
        orders: [
            { id: 1, product: "Silk Saree", status: "Pending", customer: "Riya Sharma", amount: "₹5,499" },
            { id: 2, product: "Brass Lamp", status: "Shipped", customer: "Arun Kumar", amount: "₹1,799" },
            { id: 3, product: "Tanjore Painting", status: "Delivered", customer: "Priya Patel", amount: "₹3,299" },
        ]
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case "products":
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dashboardData.products.map((product) => (
                            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                                <div className="p-4">
                                    <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                                    <div className="flex justify-between items-center">
                                        <span className="text-newBlack font-bold">{product.price}</span>
                                        <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {product.stock} in stock
                                        </span>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <button className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center gap-2">
                                            <Edit className="w-4 h-4" /> Edit
                                        </button>
                                        <button className="flex-1 py-2 bg-newYellow hover:bg-amber-200 rounded-lg flex items-center justify-center gap-2">
                                            <Box className="w-4 h-4" /> Manage
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case "orders":
                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Order ID</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.orders.map((order) => (
                                        <tr key={order.id} className="border-t border-gray-100">
                                            <td className="px-4 py-3">#{order.id}</td>
                                            <td className="px-4 py-3">{order.product}</td>
                                            <td className="px-4 py-3">{order.customer}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-sm ${
                                                    order.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                                                    order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-semibold">{order.amount}</td>
                                            <td className="px-4 py-3">
                                                <button className="p-2 hover:bg-gray-100 rounded-lg">
                                                    <Settings className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-8">
            {/* Dashboard Header */}
            <div className="bg-white shadow-sm py-4 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-700" />
                        </button>
                        
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-bold">{dashboardData.displayName}</h1>
                            <div className="bg-amber-100 px-2 py-1 rounded-full flex items-center gap-1">
                                <span className="text-sm text-amber-800">Seller Dashboard</span>
                            </div>
                        </div>

                        <button className="p-2 hover:bg-gray-100 rounded-full">
                            <Settings className="w-6 h-6 text-gray-700" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Profile Overview */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        <div className="relative">
                            <img
                                src={dashboardData.profileUrl}
                                alt="Profile"
                                className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                            />
                            <button className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-sm border hover:bg-gray-50">
                                <Edit className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="flex-1 w-full">
                            <div className="flex  justify-between items-start gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold">{dashboardData.displayName}</h1>
                                    <p className="text-gray-600">@{dashboardData.username}</p>
                                </div>
                                
                                <div className="flex gap-3">
                                    <button className="px-4 py-2 bg-newYellow hover:bg-amber-200 text-black font-semibold rounded-lg flex items-center gap-2">
                                        <Edit className="w-4 h-4" />
                                        Edit Profile
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <div className="text-gray-600">Total Products</div>
                                    <div className="text-2xl font-bold mt-1">{dashboardData.stats.products}</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <div className="text-gray-600">Active Orders</div>
                                    <div className="text-2xl font-bold mt-1">{dashboardData.stats.orders}</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <div className="text-gray-600">Monthly Revenue</div>
                                    <div className="text-2xl font-bold mt-1">{dashboardData.stats.revenue}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Navigation */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
                <div className="bg-white rounded-full shadow-sm border border-gray-100 p-1.5 flex gap-2 overflow-x-auto">
                    {['products', 'orders', 'analytics', 'settings'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 py-2.5 px-4 rounded-full capitalize ${
                                activeTab === tab
                                    ? 'bg-newBlack text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {tab === 'products' && <ShoppingBag className="w-5 h-5" />}
                            {tab === 'orders' && <Package className="w-5 h-5" />}
                            {tab === 'analytics' && <List className="w-5 h-5" />}
                            {tab === 'settings' && <Settings className="w-5 h-5" />}
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default SellerProfileDummy;