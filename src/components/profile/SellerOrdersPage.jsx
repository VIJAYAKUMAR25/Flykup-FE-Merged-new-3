import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { socketurl } from '../../../config';
import { useAuth } from '../../context/AuthContext';

const SellerOrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchSellerOrders = async () => {
      try {
        if (!user || !user.sellerInfo?._id) {
          throw new Error('Seller ID not found');
        }
        const sellerId = user.sellerInfo._id;
        const ordersResponse = await fetch(`${socketurl}/api/order/seller/${sellerId}`);
        if (!ordersResponse.ok) {
          throw new Error(`Failed to fetch orders: ${ordersResponse.statusText}`);
        }
        const data = await ordersResponse.json();
        setOrders(data.orders);
      } catch (err) {
        console.error('Error fetching seller orders:', err);
        setError(err.message || 'An error occurred while fetching orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchSellerOrders();
  }, [user]);

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'processing' && order.orderStatus === 'PLACED') ||
      (activeTab === 'shipped' && order.orderStatus === 'SHIPPED') ||
      (activeTab === 'delivered' && order.orderStatus === 'DELIVERED');
    const matchesSearch =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.userId && order.userId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.products &&
        order.products.some(
          (p) =>
            p.product &&
            p.product.name &&
            p.product.name.toLowerCase().includes(searchTerm.toLowerCase())
        ));
    return matchesTab && matchesSearch;
  });

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${socketurl}/api/order/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      setOrders(
        orders.map((order) =>
          order._id === orderId ? { ...order, orderStatus: newStatus } : order
        )
      );
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err.message || 'Failed to update order status');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  const stats = {
    totalSales: orders?.reduce((sum, order) => sum + order.totalAmount, 0),
    pendingOrders: orders?.filter((order) => order.orderStatus === 'PLACED').length,
    shippedOrders: orders?.filter((order) => order.orderStatus === 'SHIPPED').length,
    deliveredOrders: orders?.filter((order) => order.orderStatus === 'DELIVERED').length,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500 text-white';
      case 'SHIPPED':
        return 'bg-blue-500 text-white';
      case 'PLACED':
        return 'bg-amber-500 text-white';
      case 'CANCELLED':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
          <p className="mt-4 text-lg text-gray-700">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-center text-gray-900">
            Error Loading Orders
          </h3>
          <p className="text-gray-600 text-center">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Orders Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage and track all your customer orders</p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-6">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            {
              title: 'Total Sales',
              value: formatINR(stats.totalSales),
              iconBg: 'bg-indigo-500',
              icon: (
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
            },
            {
              title: 'Pending Orders',
              value: stats.pendingOrders,
              iconBg: 'bg-amber-500',
              icon: (
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
            },
            {
              title: 'Shipped Orders',
              value: stats.shippedOrders,
              iconBg: 'bg-blue-500',
              icon: (
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
              ),
            },
            {
              title: 'Delivered Orders',
              value: stats.deliveredOrders,
              iconBg: 'bg-emerald-500',
              icon: (
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
            },
          ].map(({ title, value, iconBg, icon }, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
              variants={itemVariants}
            >
              <div className="px-6 py-5">
                <div className="flex items-center">
                  <div
                    className={`h-12 w-12 rounded-lg flex items-center justify-center ${iconBg}`}
                  >
                    {icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Orders Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          {/* Search and Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center px-6 py-4 gap-4">
              <div className="relative w-full lg:w-64">
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg
                  className="absolute left-3 top-3 h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-18 0 7 7 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="inline-flex items-center rounded-md shadow-sm w-full lg:w-auto">
                {['all', 'processing', 'shipped', 'delivered'].map((tab, index) => (
                  <button
                    key={index}
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === tab
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    } border rounded-l-md first:rounded-l-md last:rounded-r-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} Orders
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.paymentDetails.orderId.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {order.products.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-md object-cover"
                                src={item.product?.images?.[0] || '/placeholder-product.jpg'}
                                alt={item.product?.title || 'Product'}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                {item.product?.title || 'Unknown Product'}
                              </p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                        {order.products.length > 2 && (
                          <div className="text-xs text-gray-500 italic pl-12">
                            +{order.products.length - 2} more items
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.shippingAddress?.name}
                      </div>
                      <div className="text-sm text-gray-500">{order.shippingAddress?.mobile}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(order.createdAt || new Date())}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatINR(order.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          order.orderStatus
                        )}`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => {
                          setSelectedOrder(order);
                          window.my_modal_5.showModal();
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <motion.div
                key={order._id}
                className="p-4"
                variants={itemVariants}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      #{order.paymentDetails.orderId.substring(0, 8)}...
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.createdAt || new Date())}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      order.orderStatus
                    )}`}
                  >
                    {order.orderStatus}
                  </span>
                </div>
                <div className="space-y-3">
                  {order.products.slice(0, 2).map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-12 w-12">
                        <img
                          className="h-12 w-12 rounded-md object-cover"
                          src={item.product?.images?.[0] || '/placeholder-product.jpg'}
                          alt={item.product?.title || 'Product'}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.product?.title || 'Unknown Product'}
                        </p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                  {order.products.length > 2 && (
                    <p className="text-xs text-gray-500 italic">
                      +{order.products.length - 2} more items
                    </p>
                  )}
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm font-medium text-gray-900">
                    {formatINR(order.totalAmount)}
                  </div>
                  <button
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => {
                      setSelectedOrder(order);
                      window.my_modal_5.showModal();
                    }}
                  >
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? 'Try adjusting your search or filter terms.'
                  : 'New orders will appear here when customers place them.'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">1</span> to{' '}
                    <span className="font-medium">
                      {Math.min(filteredOrders.length, 10)}
                    </span>{' '}
                    of <span className="font-medium">{filteredOrders.length}</span> results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      aria-current="page"
                      className="z-10 bg-indigo-50 border-indigo-500 text-indigo-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                    >
                      1
                    </button>
                    <button className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                      2
                    </button>
                    <button className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hidden md:inline-flex relative items-center px-4 py-2 border text-sm font-medium">
                      3
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      ...
                    </span>
                    <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      <dialog id="my_modal_5" className="modal modal-bottom sm:modal-middle">
        {selectedOrder && (
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              Order #{selectedOrder.paymentDetails.orderId.substring(0, 8)}...
            </h3>
            {/* Order Summary */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900">Order Summary</h4>
              <div className="mt-2 border-t border-b border-gray-200 py-2">
                <div className="flex justify-between text-sm">
                  <p className="text-gray-500">Order Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <p className="text-gray-500">Order Status</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      selectedOrder.orderStatus
                    )}`}
                  >
                    {selectedOrder.orderStatus}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <p className="text-gray-500">Payment Method</p>
                  <p className="font-medium text-gray-900">
                    {selectedOrder.paymentMethod || 'Online'}
                  </p>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <p className="text-gray-500">Total Amount</p>
                  <p className="font-medium text-gray-900">
                    {formatINR(selectedOrder.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
            {/* Products */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900">Products</h4>
              <div className="mt-2 space-y-3">
                {selectedOrder.products.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 py-2 border-b border-gray-200 last:border-b-0"
                  >
                    <div className="flex-shrink-0 h-16 w-16">
                      <img
                        className="h-16 w-16 rounded-md object-cover"
                        src={item.product?.images?.[0] || '/placeholder-product.jpg'}
                        alt={item.product?.title || 'Product'}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {item.product?.title || 'Unknown Product'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {formatINR(item.product.productPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Customer & Shipping Information */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Customer Information
                </h4>
                <div className="mt-2 text-sm">
                  <p className="font-medium">{selectedOrder.shippingAddress?.name}</p>
                  <p className="text-gray-500 mt-1">
                    {selectedOrder.shippingAddress?.mobile}
                  </p>
                  <p className="text-gray-500">
                    {selectedOrder.shippingAddress?.email || 'No email provided'}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Shipping Address
                </h4>
                <div className="mt-2 text-sm text-gray-500">
                  <p>{selectedOrder.shippingAddress?.addressLine1}</p>
                  {selectedOrder.shippingAddress?.addressLine2 && (
                    <p>{selectedOrder.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {selectedOrder.shippingAddress?.city},{' '}
                    {selectedOrder.shippingAddress?.state}{' '}
                    {selectedOrder.shippingAddress?.pincode}
                  </p>
                </div>
              </div>
            </div>
            {/* Update Status */}
            {selectedOrder.orderStatus !== 'DELIVERED' &&
              selectedOrder.orderStatus !== 'CANCELLED' && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900">
                    Update Order Status
                  </h4>
                  <div className="mt-2">
                    {selectedOrder.orderStatus === 'PLACED' && (
                      <button
                        onClick={() => {
                          updateOrderStatus(selectedOrder._id, 'SHIPPED');
                          window.my_modal_5.close();
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Mark as Shipped
                      </button>
                    )}
                    {selectedOrder.orderStatus === 'SHIPPED' && (
                      <button
                        onClick={() => {
                          updateOrderStatus(selectedOrder._id, 'DELIVERED');
                          window.my_modal_5.close();
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Mark as Delivered
                      </button>
                    )}
                  </div>
                </div>
              )}
            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-sm">Close</button>
              </form>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
};

export default SellerOrdersPage;