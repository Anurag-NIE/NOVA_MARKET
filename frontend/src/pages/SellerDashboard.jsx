// // frontend/src/pages/SellerDashboard.jsx - UPDATED
// import React, { useState } from "react";
// import AnalyticsDashboard from "../components/AnalyticsDashboard";
// // KEEP your existing imports

// const SellerDashboard = () => {
//   const [activeTab, setActiveTab] = useState("listings"); // listings, bookings, analytics

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-3xl font-bold mb-6">Provider Dashboard</h1>

//       {/* Tabs */}
//       <div className="flex gap-4 border-b border-gray-200 mb-8">
//         <button
//           onClick={() => setActiveTab("listings")}
//           className={`pb-4 px-2 font-medium transition-colors ${
//             activeTab === "listings"
//               ? "border-b-2 border-purple-600 text-purple-600"
//               : "text-gray-600 hover:text-gray-900"
//           }`}
//         >
//           My Services
//         </button>

//         {/* NEW: Bookings Tab */}
//         <button
//           onClick={() => setActiveTab("bookings")}
//           className={`pb-4 px-2 font-medium transition-colors ${
//             activeTab === "bookings"
//               ? "border-b-2 border-purple-600 text-purple-600"
//               : "text-gray-600 hover:text-gray-900"
//           }`}
//         >
//           Bookings
//         </button>

//         {/* NEW: Analytics Tab */}
//         <button
//           onClick={() => setActiveTab("analytics")}
//           className={`pb-4 px-2 font-medium transition-colors ${
//             activeTab === "analytics"
//               ? "border-b-2 border-purple-600 text-purple-600"
//               : "text-gray-600 hover:text-gray-900"
//           }`}
//         >
//           Analytics
//         </button>

//         {/* KEEP: Orders Tab */}
//         <button
//           onClick={() => setActiveTab("orders")}
//           className={`pb-4 px-2 font-medium transition-colors ${
//             activeTab === "orders"
//               ? "border-b-2 border-purple-600 text-purple-600"
//               : "text-gray-600 hover:text-gray-900"
//           }`}
//         >
//           Orders
//         </button>
//       </div>

//       {/* Content */}
//       {activeTab === "listings" && (
//         <div>{/* KEEP YOUR EXISTING LISTINGS CODE */}</div>
//       )}

//       {activeTab === "bookings" && <BookingsManagement />}

//       {activeTab === "analytics" && <AnalyticsDashboard />}

//       {activeTab === "orders" && (
//         <div>{/* KEEP YOUR EXISTING ORDERS CODE */}</div>
//       )}
//     </div>
//   );
// };

// // NEW: Bookings Management Component
// const BookingsManagement = () => {
//   const [bookings, setBookings] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadBookings();
//   }, []);

//   const loadBookings = async () => {
//     try {
//       const response = await api.get("/bookings/my-bookings");
//       setBookings(response.data.bookings);
//     } catch (error) {
//       console.error("Error loading bookings:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return <div className="text-center py-8">Loading bookings...</div>;
//   }

//   return (
//     <div className="space-y-4">
//       <h2 className="text-2xl font-semibold">Your Bookings</h2>

//       {bookings.length === 0 ? (
//         <div className="text-center py-12 bg-gray-50 rounded-lg">
//           <p className="text-gray-600">No bookings yet</p>
//         </div>
//       ) : (
//         <div className="grid gap-4">
//           {bookings.map((booking) => (
//             <div
//               key={booking.id}
//               className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500"
//             >
//               <div className="flex items-start justify-between">
//                 <div className="flex-1">
//                   <h3 className="font-semibold text-lg">
//                     {booking.client_name}
//                   </h3>
//                   <p className="text-gray-600 mt-1">
//                     {new Date(booking.start_time).toLocaleString()}
//                   </p>
//                   <p className="text-sm text-gray-500 mt-2">
//                     Duration: {booking.duration_minutes} minutes
//                   </p>
//                   {booking.notes && (
//                     <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
//                       Note: {booking.notes}
//                     </p>
//                   )}
//                 </div>

//                 <div className="text-right">
//                   <span
//                     className={`
//                     inline-block px-3 py-1 rounded-full text-sm font-semibold
//                     ${
//                       booking.status === "confirmed"
//                         ? "bg-green-100 text-green-700"
//                         : booking.status === "completed"
//                         ? "bg-blue-100 text-blue-700"
//                         : "bg-red-100 text-red-700"
//                     }
//                   `}
//                   >
//                     {booking.status}
//                   </span>
//                   <p className="text-xl font-bold text-purple-600 mt-2">
//                     ${booking.price}
//                   </p>

//                   {booking.meeting_link && (
//                     <a
//                       href={booking.meeting_link}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="inline-block mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-all"
//                     >
//                       Join Meeting
//                     </a>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default SellerDashboard;
















import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import ListingCard from "../components/ListingCard";
import AvailabilitySettings from "../components/AvailabilitySettings";
import api, { serviceRequestAPI } from "../utils/api";
import { toast } from "sonner";
import {
  Plus,
  Package,
  Briefcase,
  DollarSign,
  Eye,
  TrendingUp,
  Calendar,
  Clock,
  Video,
  CheckCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

const categories = [
  "Electronics",
  "Fashion",
  "Home",
  "Books",
  "Sports",
  "Beauty",
  "Toys",
  "Services",
];

const SellerDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("listings");
  const [showAddListing, setShowAddListing] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    images: "",
    stock: "1",
    type: "product",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const timestamp = new Date().getTime();
      
      const [listingsRes, ordersRes, bookingsRes, productsRes, servicesRes, serviceBookingsRes, requestsRes] = await Promise.all([
        api.get("/listings", { params: { _t: timestamp } }).catch(() => ({ data: [] })),
        api.get("/orders", { params: { _t: timestamp } }).catch(() => ({ data: [] })),
        api.get("/bookings/my-bookings", { params: { _t: timestamp } }).catch(() => ({ data: { bookings: [] } })),
        api.get("/products", { params: { _t: timestamp } }).catch((e) => {
          console.error("Error fetching products:", e);
          return { data: [] };
        }),
        api.get("/services", { params: { _t: timestamp } }).catch((e) => {
          console.error("Error fetching services:", e);
          return { data: [] };
        }),
        api.get("/services/bookings/my-bookings", { params: { _t: timestamp } }).catch(() => ({ data: { bookings: [] } })),
        serviceRequestAPI.getAll({ _t: timestamp }).catch((e) => {
          console.error("❌ Error fetching service requests:", e);
          console.error("Error response:", e.response);
          console.error("Error details:", e.response?.data);
          console.error("Error status:", e.response?.status);
          console.error("Error message:", e.message);
          if (e.response?.status === 401) {
            console.error("⚠️ Authentication error - user may need to re-login");
          }
          return { data: { requests: [] } };
        }),
      ]);

      const myListings = (Array.isArray(listingsRes.data) ? listingsRes.data : []).filter(
        (p) => p.seller_id === user.id
      );
      
      // Filter products and services by seller
      const myProducts = (Array.isArray(productsRes.data) ? productsRes.data : []).filter(
        (p) => p.seller_id === user.id
      );
      const myServices = (Array.isArray(servicesRes.data) ? servicesRes.data : []).filter(
        (s) => s.seller_id === user.id
      );
      
      // Combine all listings (old + new)
      setListings([
        ...myListings, 
        ...(myProducts.map(p => ({...p, type: 'product', id: p.id || p._id}))), 
        ...(myServices.map(s => ({...s, type: 'service', id: s.id || s._id})))
      ]);
      
      // Fetch product orders - backend returns { orders: [], total: number }
      const productOrdersRes = await api.get("/products/orders", { params: { _t: timestamp } }).catch(() => ({ data: { orders: [], total: 0 } }));
      
      // Handle different response formats for orders
      let ordersData = [];
      if (Array.isArray(ordersRes.data)) {
        ordersData = ordersRes.data;
      } else if (ordersRes.data && Array.isArray(ordersRes.data.orders)) {
        ordersData = ordersRes.data.orders;
      } else if (ordersRes.data && ordersRes.data.data && Array.isArray(ordersRes.data.data.orders)) {
        ordersData = ordersRes.data.data.orders;
      }
      
      // Handle product orders response - can be { orders: [] } or just array
      let productOrdersData = [];
      if (productOrdersRes.data) {
        if (Array.isArray(productOrdersRes.data)) {
          productOrdersData = productOrdersRes.data;
        } else if (Array.isArray(productOrdersRes.data.orders)) {
          productOrdersData = productOrdersRes.data.orders;
        } else if (productOrdersRes.data.data && Array.isArray(productOrdersRes.data.data)) {
          productOrdersData = productOrdersRes.data.data;
        }
      }
      
      // Combine all orders and filter by seller
      const allOrders = [...ordersData, ...productOrdersData].filter(order => {
        if (!order) return false;
        return order.seller_id === user.id || order.provider_id === user.id;
      });
      
      console.log("📊 Orders fetched:", {
        totalFound: allOrders.length,
        ordersData: ordersData.length,
        productOrdersData: productOrdersData.length,
        user_id: user.id,
        sample: allOrders[0]
      });
      
      setOrders(allOrders);
      
      // Combine bookings - filter by seller/provider
      const bookingsData1 = Array.isArray(bookingsRes.data?.bookings) ? bookingsRes.data.bookings : [];
      const bookingsData2 = Array.isArray(serviceBookingsRes.data?.bookings) ? serviceBookingsRes.data.bookings : [];
      
      // Filter bookings to ensure they belong to this seller/provider
      const allBookings = [...bookingsData1, ...bookingsData2].filter(booking => {
        return booking.provider_id === user.id || booking.seller_id === user.id || booking.freelancer_id === user.id;
      });
      
      setBookings(allBookings);
      
          // Set service requests - clear first to avoid stale data
          console.log("🔍 Service requests API response:", requestsRes);
          console.log("🔍 Response data:", requestsRes.data);
          console.log("🔍 Response structure:", {
            hasRequests: !!requestsRes.data?.requests,
            isArray: Array.isArray(requestsRes.data?.requests),
            type: typeof requestsRes.data?.requests,
            keys: requestsRes.data ? Object.keys(requestsRes.data) : []
          });
          
          const requestsData = Array.isArray(requestsRes.data?.requests) ? requestsRes.data.requests : [];
          console.log("✅ Parsed service requests data:", requestsData);
          console.log("✅ Number of service requests:", requestsData.length);
          
          // Clear first to avoid stale data
          setServiceRequests([]);
          // Then set fresh data
          setServiceRequests(requestsData);
          
          if (requestsData.length === 0) {
            console.warn("⚠️ No service requests found. This could mean:");
            console.warn("1. No requests exist in the database");
            console.warn("2. All requests have status other than 'open'");
            console.warn("3. API returned empty array");
            console.warn("4. Authentication/authorization issue");
            console.warn("5. Query filter is too restrictive");
          }
    } catch (error) {
      console.error("Error fetching data:", error);
      let errorMessage = "Failed to load dashboard data";
      const detail = error.response?.data?.detail;
      if (detail) {
        if (typeof detail === "string") {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map(err => typeof err === "string" ? err : err.msg || JSON.stringify(err)).join(", ");
        } else if (typeof detail === "object") {
          errorMessage = detail.msg || detail.message || JSON.stringify(detail);
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
    
    // Listen for tab switch event from Navbar
    const handleTabSwitch = (event) => {
      if (event.detail === 'service-requests') {
        setActiveTab('service-requests');
        setTimeout(() => {
          const tabs = document.querySelector('[role="tablist"]');
          if (tabs) {
            window.scrollTo({ top: tabs.offsetTop - 100, behavior: 'smooth' });
          }
        }, 100);
      }
    };
    
    window.addEventListener('switchTab', handleTabSwitch);
    
    // Refresh data every 30 seconds to keep it dynamic
    const refreshInterval = setInterval(() => {
      if (user?.id) {
        fetchData();
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('switchTab', handleTabSwitch);
      clearInterval(refreshInterval);
    };
  }, [user?.id, fetchData]);

  const handleAddListing = async (e) => {
    e.preventDefault();

    try {
      const images = formData.images
        .split(",")
        .map((img) => img.trim())
        .filter(Boolean);
      if (images.length === 0) {
        images.push(
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
        );
      }

      const dataToSend = {
        ...formData,
        price: parseFloat(formData.price),
        images,
        tags: [],
      };

      if (formData.type === "product") {
        dataToSend.stock = parseInt(formData.stock);
      } else {
        delete dataToSend.stock;
      }

      await api.post("/listings", dataToSend);

      toast.success("Listing added successfully!");
      setShowAddListing(false);
      setFormData({
        title: "",
        description: "",
        price: "",
        category: "",
        images: "",
        stock: "1",
        type: "product",
      });
      fetchData();
    } catch (error) {
      console.error("Error adding listing:", error);
      let errorMessage = "Failed to add listing";
      const detail = error.response?.data?.detail;
      if (detail) {
        if (typeof detail === "string") {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map(err => typeof err === "string" ? err : err.msg || JSON.stringify(err)).join(", ");
        } else if (typeof detail === "object") {
          errorMessage = detail.msg || detail.message || JSON.stringify(detail);
        }
      }
      toast.error(errorMessage);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/complete`);
      toast.success("Booking marked as completed");
      fetchData();
    } catch (error) {
      console.error("Error completing booking:", error);
      let errorMessage = "Failed to complete booking";
      const detail = error.response?.data?.detail;
      if (detail) {
        if (typeof detail === "string") {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map(err => typeof err === "string" ? err : err.msg || JSON.stringify(err)).join(", ");
        } else if (typeof detail === "object") {
          errorMessage = detail.msg || detail.message || JSON.stringify(detail);
        }
      }
      toast.error(errorMessage);
    }
  };

  const openAvailabilitySettings = (service) => {
    setSelectedService(service);
    setShowAvailability(true);
  };

  // Calculate total revenue from orders and bookings
  const ordersRevenue = (Array.isArray(orders) ? orders : []).reduce(
    (sum, order) => sum + (order?.total_amount || order?.amount || 0),
    0
  );
  const bookingsRevenue = (Array.isArray(bookings) ? bookings : []).reduce(
    (sum, booking) => sum + (booking?.price || booking?.amount || 0),
    0
  );
  const totalRevenue = ordersRevenue + bookingsRevenue;
  
  const totalViews = (Array.isArray(listings) ? listings : []).reduce(
    (sum, listing) => sum + (listing?.views_count || listing?.reviews_count || 0),
    0
  );
  const serviceListings = (Array.isArray(listings) ? listings : []).filter((l) => l.type === "service");

  // Generate dummy chart data with random curve for all sellers
  // Using useMemo to ensure consistent data per seller
  const chartData = useMemo(() => {
    // Use seller ID as seed for consistent random curve per seller
    const seed = user?.id ? user.id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.floor(Math.random() * 1000);
    
    // Simple seeded random function
    const seededRandom = (seed, index) => {
      const x = Math.sin((seed + index) * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    
    // Generate base values with smooth curve
    const baseValue = 30 + (seededRandom(seed, 0) * 40); // Base between 30-70
    const peakMultiplier = 0.6 + (seededRandom(seed, 1) * 0.8); // Peak between 0.6-1.4
    
    // Create a curve that peaks around weekend (Fri-Sat)
    const curvePattern = [0.7, 0.85, 1.1, 1.4, 1.2, 0.95, 0.8]; // Wed to Tue pattern
    
    return [
      { 
        day: 'Wed', 
        sales: Math.floor(baseValue * curvePattern[0] * peakMultiplier + seededRandom(seed, 2) * 15),
        views: Math.floor(baseValue * curvePattern[0] * peakMultiplier * 2.5 + seededRandom(seed, 3) * 20)
      },
      { 
        day: 'Thu', 
        sales: Math.floor(baseValue * curvePattern[1] * peakMultiplier + seededRandom(seed, 4) * 15),
        views: Math.floor(baseValue * curvePattern[1] * peakMultiplier * 2.5 + seededRandom(seed, 5) * 20)
      },
      { 
        day: 'Fri', 
        sales: Math.floor(baseValue * curvePattern[2] * peakMultiplier + seededRandom(seed, 6) * 15),
        views: Math.floor(baseValue * curvePattern[2] * peakMultiplier * 2.5 + seededRandom(seed, 7) * 20)
      },
      { 
        day: 'Sat', 
        sales: Math.floor(baseValue * curvePattern[3] * peakMultiplier + seededRandom(seed, 8) * 15),
        views: Math.floor(baseValue * curvePattern[3] * peakMultiplier * 2.5 + seededRandom(seed, 9) * 20)
      },
      { 
        day: 'Sun', 
        sales: Math.floor(baseValue * curvePattern[4] * peakMultiplier + seededRandom(seed, 10) * 15),
        views: Math.floor(baseValue * curvePattern[4] * peakMultiplier * 2.5 + seededRandom(seed, 11) * 20)
      },
      { 
        day: 'Mon', 
        sales: Math.floor(baseValue * curvePattern[5] * peakMultiplier + seededRandom(seed, 12) * 15),
        views: Math.floor(baseValue * curvePattern[5] * peakMultiplier * 2.5 + seededRandom(seed, 13) * 20)
      },
      { 
        day: 'Tue', 
        sales: Math.floor(baseValue * curvePattern[6] * peakMultiplier + seededRandom(seed, 14) * 15),
        views: Math.floor(baseValue * curvePattern[6] * peakMultiplier * 2.5 + seededRandom(seed, 15) * 20)
      }
    ];
  }, [user?.id]);

  const handleBookServiceRequest = async (requestId) => {
    if (!requestId) {
      toast.error("Invalid service request");
      return;
    }

    try {
      const response = await serviceRequestAPI.book(requestId);
      toast.success(response.data?.message || "Service request booked successfully!");
      // Refresh data to update the list
      await fetchData();
    } catch (error) {
      console.error("Error booking service request:", error);
      let errorMessage = "Failed to book service request";
      const detail = error.response?.data?.detail;
      if (detail) {
        if (typeof detail === "string") {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map(err => typeof err === "string" ? err : err.msg || JSON.stringify(err)).join(", ");
        } else if (typeof detail === "object") {
          errorMessage = detail.msg || detail.message || JSON.stringify(detail);
        }
      }
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500",
      open: "bg-green-500",
      in_progress: "bg-blue-500",
    };
    return colors[status] || "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Seller Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}!</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/add-product")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Package size={18} />
              Add Product
            </Button>
            <Button
              onClick={() => navigate("/add-service")}
              className="flex items-center gap-2"
            >
              <Briefcase size={18} />
              Add Service
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Array.isArray(listings) ? listings.length : 0}</p>
                  <p className="text-sm text-muted-foreground">Listings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <DollarSign className="text-emerald-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    ${totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="text-blue-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Array.isArray(orders) ? orders.length : 0}</p>
                  <p className="text-sm text-muted-foreground">Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Calendar className="text-purple-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Array.isArray(bookings) ? bookings.length : 0}</p>
                  <p className="text-sm text-muted-foreground">Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-lg font-semibold">Sales & Views Overview</h3>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 6, right: 6 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(202 84% 38%)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(202 84% 38%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(202 84% 38%)"
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="service-requests">Service Requests</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-6">
            {Array.isArray(listings) && listings.length > 0 ? (
              <div className="space-y-6">
                {serviceListings.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        Services - Manage Availability
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {serviceListings.map((service) => (
                        <Card key={service.id || service._id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <img
                                src={Array.isArray(service.images) && service.images.length > 0 
                                  ? service.images[0] 
                                  : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"}
                                alt={service.title || "Service"}
                                className="w-20 h-20 rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold">
                                  {service.title}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  ${service.price}/session
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() =>
                                    openAvailabilitySettings(service)
                                  }
                                >
                                  <Clock size={14} className="mr-2" />
                                  Set Availability
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-4">All Listings</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
                    {(Array.isArray(listings) ? listings : []).map((listing) => (
                      <ListingCard key={listing.id || listing._id} listing={listing} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-10 pb-10 text-center">
                  <Package
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-lg font-medium">No listings yet</p>
                  <p className="text-muted-foreground mb-4">
                    Start selling by adding your first product or service
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => navigate("/add-product")}>
                      <Package size={18} className="mr-2" />
                      Add Product
                    </Button>
                    <Button onClick={() => navigate("/add-service")}>
                      <Briefcase size={18} className="mr-2" />
                      Add Service
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="service-requests" className="mt-6">
            {Array.isArray(serviceRequests) && serviceRequests.length > 0 ? (
              <div className="space-y-4">
                {serviceRequests.map((request) => (
                  <Card key={request.id || request._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{request.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Posted by: {request.client_name || "Unknown Buyer"}
                          </p>
                        </div>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-muted-foreground">{request.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{request.category}</Badge>
                          <Badge variant="outline">
                            {request.experience_level || "intermediate"}
                          </Badge>
                          {request.skills_required && request.skills_required.length > 0 && (
                            <>
                              {request.skills_required.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="outline">{skill}</Badge>
                              ))}
                              {request.skills_required.length > 3 && (
                                <Badge variant="outline">+{request.skills_required.length - 3} more</Badge>
                              )}
                            </>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Budget</p>
                            <p className="font-semibold text-green-600">
                              ${request.budget?.toFixed(2) || "0.00"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Deadline</p>
                            <p className="font-semibold">
                              {request.deadline
                                ? new Date(request.deadline).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Proposals</p>
                            <p className="font-semibold">
                              {request.proposal_count || request.proposals_count || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Match Score</p>
                            <p className="font-semibold">
                              {request.ai_match_score !== undefined
                                ? `${request.ai_match_score}%`
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              navigate(`/service-request/${request.id || request._id}`)
                            }
                          >
                            <Eye size={16} className="mr-2" />
                            View Details
                          </Button>
                          {request.status === "open" && (
                            <Button
                              onClick={() =>
                                handleBookServiceRequest(request.id || request._id)
                              }
                              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            >
                              <Briefcase size={16} className="mr-2" />
                              Book This Request
                            </Button>
                          )}
                          {request.status !== "open" && (
                            <Button disabled variant="outline">
                              {request.status === "in_progress"
                                ? "Already Booked"
                                : "Not Available"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-10 pb-10 text-center">
                  <Briefcase
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-lg font-medium">No service requests available</p>
                  <p className="text-muted-foreground">
                    Check back later for new service requests from buyers
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            {Array.isArray(bookings) && bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.id || booking._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {booking.service_title || booking.service_name || "Service Booking"}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Client: {booking.client_name || booking.buyer_name || "Unknown"}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-2">
                          <Calendar
                            className="text-muted-foreground mt-0.5"
                            size={18}
                          />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Date
                            </p>
                            <p className="font-medium">
                              {booking.start_time || booking.booked_at 
                                ? format(
                                    new Date(booking.start_time || booking.booked_at),
                                    "MMM d, yyyy"
                                  )
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock
                            className="text-muted-foreground mt-0.5"
                            size={18}
                          />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Time
                            </p>
                            <p className="font-medium">
                              {booking.start_time || booking.booked_at
                                ? format(new Date(booking.start_time || booking.booked_at), "h:mm a")
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <DollarSign
                            className="text-muted-foreground mt-0.5"
                            size={18}
                          />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Price
                            </p>
                            <p className="font-medium">${booking.price || booking.amount || 0}</p>
                          </div>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">
                            Client Notes:
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.notes}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-2">
                        {booking.meeting_link && (
                          <Button
                            onClick={() =>
                              window.open(booking.meeting_link, "_blank")
                            }
                            size="sm"
                          >
                            <Video size={16} className="mr-2" />
                            Start Meeting
                          </Button>
                        )}
                        {booking.status === "confirmed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompleteBooking(booking.id)}
                          >
                            <CheckCircle size={16} className="mr-2" />
                            Mark Completed
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-10 pb-10 text-center">
                  <Calendar
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-lg font-medium">No bookings yet</p>
                  <p className="text-muted-foreground">
                    Bookings will appear here when clients book your services
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            {Array.isArray(orders) && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id || order._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {order.listing_title || order.product_title || "Order"}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Order from: {order.buyer_name || "Unknown"}
                          </p>
                        </div>
                        <Badge>{order.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium">{order.quantity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">
                            ${(order.total_amount || order.amount || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Payment</p>
                          <p className="font-medium capitalize">
                            {order.payment_status}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">
                            {order.created_at 
                              ? new Date(order.created_at).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-10 pb-10 text-center">
                  <TrendingUp
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-lg font-medium">No orders yet</p>
                  <p className="text-muted-foreground">
                    Orders will appear here once customers purchase your
                    listings
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Availability Settings Modal */}
      <Dialog open={showAvailability} onOpenChange={setShowAvailability}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Set Availability for {selectedService?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedService && (
            <AvailabilitySettings
              serviceId={selectedService.id}
              serviceName={selectedService.title}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerDashboard;