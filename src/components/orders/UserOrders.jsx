import { useState, useEffect } from "react";
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  ShoppingCart,
  Search,
  MapPin,
  CreditCard,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import { socketurl } from "../../../config";
import { useAuth } from "../../context/AuthContext";

const UserOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch user orders
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = user._id;
        const ordersResponse = await fetch(`${socketurl}/api/order/user/${userId}`);
        const ordersData = await ordersResponse.json();
        if (!ordersResponse.ok) {
          throw new Error(ordersData.message || "Failed to fetch user orders");
        }
        setOrders(ordersData.orders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  // Filter orders based on search query and active tab
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.paymentDetails.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.products.some((product) =>
        product.product.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && order.orderStatus.toLowerCase() === activeTab.toLowerCase();
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
          <p className="mt-4 text-lg text-gray-700">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-error bg-opacity-10 p-4 rounded-full mb-4">
          <Clock className="h-8 w-8 text-error" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Error Loading Orders</h3>
        <p className="text-base-content text-opacity-60 mb-4">{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Orders</h1>
          <p className="text-sm md:text-base text-base-content text-opacity-60 mt-1">
            Track and manage all your purchases in one place
          </p>
        </div>
        <div className="relative w-full md:w-auto">
          <div className="form-control">
            <div className="input-group">
              <span className="btn btn-square btn-sm">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search by order ID or product"
                className="input input-bordered w-full md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for filtering */}
      <div className="tabs tabs-boxed mb-8 overflow-x-auto whitespace-nowrap">
        <a
          className={`tab ${activeTab === "all" ? "bg-yellow-400 font-semibold" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Orders
        </a>
        <a
          className={`tab ${activeTab === "placed" ? "bg-yellow-400 font-semibold" : ""}`}
          onClick={() => setActiveTab("placed")}
        >
          Placed
        </a>
        <a
          className={`tab ${activeTab === "processing" ? "bg-yellow-400 font-semibold" : ""}`}
          onClick={() => setActiveTab("processing")}
        >
          Processing
        </a>
        <a
          className={`tab ${activeTab === "shipped" ? "bg-yellow-400 font-semibold" : ""}`}
          onClick={() => setActiveTab("shipped")}
        >
          Shipped
        </a>
        <a
          className={`tab ${activeTab === "delivered" ? "bg-yellow-400 font-semibold" : ""}`}
          onClick={() => setActiveTab("delivered")}
        >
          Delivered
        </a>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-base-200 p-4 rounded-full mb-4">
              <ShoppingCart className="h-8 w-8 text-base-content text-opacity-60" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No orders found</h3>
            <p className="text-sm md:text-base text-base-content text-opacity-60 mb-4">
              {searchQuery ? "Try a different search term" : "You haven't placed any orders yet"}
            </p>
            <button className="btn btn-warning">
              Start Shopping
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => <OrderCard key={order._id} order={order} />)
        )}
      </div>
    </div>
  );
};

const OrderCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);

  // Format date to be more readable
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate estimated delivery date (7 days from order date)
  const getEstimatedDelivery = (dateString) => {
    const orderDate = new Date(dateString);
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(orderDate.getDate() + 7);
    return formatDate(deliveryDate);
  };

  // Get badge color based on status
  const getBadgeColor = (status) => {
    switch (status) {
      case "DELIVERED":
        return "badge-success";
      case "SHIPPED":
        return "badge-info";
      case "PROCESSING":
        return "badge-warning";
      case "DELAYED":
        return "badge-error";
      default:
        return "badge-neutral";
    }
  };

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body p-0">
        {/* Card Header */}
        <div className="bg-base-200 p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="card-title text-lg flex items-center">
                 #{order.paymentDetails.orderId}
                <span className={`badge ml-3 ${getBadgeColor(order.orderStatus)}`}>
                  {order.orderStatus}
                </span>
              </h2>
              <p className="text-xs md:text-sm text-base-content text-opacity-60 mt-1">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-xs md:text-sm font-medium">Total Amount</p>
                <p className="text-sm md:text-lg font-bold text-primary">
                  ₹{order.totalAmount.toLocaleString()}
                </p>
              </div>
              <button className="btn btn-sm btn-outline" onClick={() => setExpanded(!expanded)}>
                {expanded ? "Hide Details" : "View Details"}
                {expanded ? <ChevronDown className="ml-2 h-4 w-4" /> : <ChevronRight className="ml-2 h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <>
            {/* Order Timeline */}
            <div className="p-6 pb-0">
              <OrderTimeline status={order.orderStatus} orderDate={order.createdAt} />
            </div>

            {/* Products List */}
            <div className="p-6">
              <h3 className="text-xs md:text-sm font-medium text-base-content text-opacity-60 mb-4">
                ORDER ITEMS
              </h3>
              <div className="space-y-4">
                {order.products.map((product) => (
                  <div key={product._id} className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="h-20 w-20 rounded-md overflow-hidden bg-base-200 flex-shrink-0">
                      <img
                        src={product.product.images?.[0] || "/placeholder.svg?height=80&width=80"}
                        alt={product.product.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs md:text-sm truncate">{product.product.title}</h4>
                      <p className="text-xs md:text-sm text-base-content text-opacity-60 truncate">
                        Seller: {product.product.sellerId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xs md:text-sm">₹{product.product.productPrice?.toLocaleString()}</p>
                      <p className="text-xs md:text-sm text-base-content text-opacity-60">Qty: 1</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="divider m-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <div>
                <h3 className="text-xs md:text-sm font-medium text-base-content text-opacity-60 mb-3">
                  SHIPPING DETAILS
                </h3>
                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-base-content text-opacity-60 mt-0.5" />
                      <div>
                        <p className="font-medium text-xs md:text-sm">{order.shippingAddress.name}</p>
                        <p className="text-xs md:text-sm text-base-content text-opacity-60">
                          {order.shippingAddress.line1}, {order.shippingAddress.line2}
                          <br />
                          {order.shippingAddress.city}, {order.shippingAddress.state}
                          <br />
                          PIN: {order.shippingAddress.pincode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-medium text-base-content text-opacity-60 mb-3">
                  PAYMENT INFORMATION
                </h3>
                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-base-content text-opacity-60 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium text-xs md:text-sm">
                          Payment ID: {order.paymentDetails.paymentId || "N/A"}
                        </p>
                        <p className="text-xs md:text-sm text-base-content text-opacity-60">
                          Amount: ₹{order.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-xs md:text-sm text-base-content text-opacity-60">
                          Status: <span className="text-success font-medium">Paid</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <div className="collapse collapse-arrow bg-base-100">
                <input type="checkbox" />
                <div className="collapse-title text-xs md:text-sm font-medium">Need help with this order?</div>
                <div className="collapse-content">
                  <div className="grid gap-4">
                    <p className="text-xs md:text-sm text-base-content text-opacity-60">
                      If you have any questions or issues with your order, our customer support team is here to help.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn btn-sm btn-outline">Return Item</button>
                      <button className="btn btn-sm btn-outline">Report Issue</button>
                      <button className="btn btn-sm btn-outline">Contact Support</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Card Footer */}
        <div className="bg-base-200 flex flex-col md:flex-row justify-between py-3 px-6">
          <p className="text-xs md:text-sm text-base-content text-opacity-60">
            Estimated Delivery: <span className="font-medium">{getEstimatedDelivery(order.createdAt)}</span>
          </p>
          <button className="btn btn-sm btn-ghost mt-2 md:mt-0">
            Track Package
            <Truck className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderTimeline = ({ status, orderDate }) => {
  // Define the steps in the order process
  const steps = [
    { id: "ordered", label: "Ordered", icon: ShoppingCart, date: new Date(orderDate) },
    { id: "processing", label: "Processing", icon: Package },
    { id: "shipped", label: "Shipped", icon: Truck },
    { id: "delivered", label: "Delivered", icon: CheckCircle2 },
  ];

  // Determine the current step based on the order status
  const getCurrentStepIndex = () => {
    switch (status) {
      case "Processing":
        return 1;
      case "Shipped":
        return 2;
      case "Delivered":
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIndex = getCurrentStepIndex();

  // Calculate dates for each step (for demo purposes)
  const getStepDate = (index) => {
    if (index === 0) return new Date(orderDate);
    const date = new Date(orderDate);
    date.setDate(date.getDate() + index * 2); // Add 2 days for each step
    // If the step is in the future based on current status, return null
    if (index > currentStepIndex) return null;
    return date;
  };

  return (
    <div className="relative">
      <ul className="steps steps-horizontal w-full overflow-x-auto whitespace-nowrap">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const stepDate = getStepDate(index);
          return (
            <li
              key={step.id}
              className={`step ${isCompleted ? "step-warning" : ""}`}
              data-content={isCompleted ? "✓" : index + 1}
            >
              <div className="flex flex-col items-center mt-2">
                <span className="text-xs font-medium">{step.label}</span>
                {stepDate && (
                  <span className="text-xs text-base-content text-opacity-60 mt-1">
                    {stepDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default UserOrders;