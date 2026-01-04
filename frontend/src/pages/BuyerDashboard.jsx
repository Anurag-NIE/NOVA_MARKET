import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import ListingCard from "../components/ListingCard";
import api from "../utils/api";
import { toast } from "sonner";
import {
  ShoppingBag,
  Heart,
  Package,
  Calendar,
  Video,
  Clock,
  XCircle,
  DollarSign,
  Briefcase,
  Trash2,
  Folder,
  Smile,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const BuyerDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [myServiceRequests, setMyServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    fetchData();
    
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
    return () => window.removeEventListener('switchTab', handleTabSwitch);
  }, []);

  const fetchData = async () => {
    try {
      // Force fresh fetch by adding cache-busting timestamp
      const timestamp = new Date().getTime();
      const [productOrdersRes, serviceBookingsRes, wishlistRes, oldBookingsRes, serviceRequestsRes] = await Promise.all([
        api.get("/products/orders", { params: { _t: timestamp } }).catch(() => ({ data: { orders: [] } })),
        api.get("/services/bookings/my-bookings", { params: { _t: timestamp } }).catch(() => ({ data: { bookings: [] } })),
        api.get("/wishlist", { params: { _t: timestamp } }).catch(() => ({ data: [] })),
        api.get("/bookings/my-bookings", { params: { _t: timestamp } }).catch(() => ({ data: { bookings: [] } })),
        api.get("/service-requests", { params: { _t: timestamp } }).catch(() => ({ data: { requests: [] } })),
      ]);
      
      // Combine product orders and service bookings
      const productOrders = productOrdersRes.data?.orders || [];
      const serviceBookings = serviceBookingsRes.data?.bookings || [];
      const oldBookings = oldBookingsRes.data?.bookings || [];
      const serviceRequests = Array.isArray(serviceRequestsRes.data?.requests) 
        ? serviceRequestsRes.data.requests 
        : [];
      
      // Clear state first, then set new data to avoid stale data
      setOrders([]);
      setBookings([]);
      setWishlist([]);
      setMyServiceRequests([]);
      
      // Then set the fresh data
      setOrders(productOrders);
      setBookings([...serviceBookings, ...oldBookings]);
      setWishlist(wishlistRes.data || []);
      setMyServiceRequests(serviceRequests);
      
      console.log("Fetched service requests:", serviceRequests.length);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
      // Clear all data on error
      setOrders([]);
      setBookings([]);
      setWishlist([]);
      setMyServiceRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!bookingId) {
      toast.error("Invalid booking ID");
      return;
    }

    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      toast.success("Booking cancelled successfully");
      fetchData();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error(error.response?.data?.detail || "Failed to cancel booking");
    }
  };

  const handleDeleteServiceRequest = async (requestId) => {
    if (!requestId) {
      toast.error("Invalid service request ID");
      return;
    }

    if (!confirm("Are you sure you want to delete this service request? This action cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/service-requests/${requestId}`);
      toast.success("Service request deleted successfully");
      // Remove from local state immediately
      setMyServiceRequests((prev) => 
        prev.filter((req) => (req.id || req._id) !== requestId)
      );
      // Refresh data to ensure consistency
      fetchData();
    } catch (error) {
      console.error("Error deleting service request:", error);
      toast.error(error.response?.data?.detail || "Failed to delete service request");
    }
  };

  // Generate dummy data for Orders, Bookings, and Delivered
  // Using seeded random for consistent dummy data per buyer
  const dummyData = useMemo(() => {
    const seed = user?.id ? user.id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 1000;
    const seededRandom = (seed, index) => {
      const x = Math.sin((seed + index) * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    
    return {
      orders: 3 + Math.floor(seededRandom(seed, 1) * 12), // 3-15 orders
      bookings: 2 + Math.floor(seededRandom(seed, 2) * 8), // 2-10 bookings
      delivered: 1 + Math.floor(seededRandom(seed, 3) * 6) // 1-7 delivered
    };
  }, [user?.id]);

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500",
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Buyer Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}!</p>
          </div>
          <Button
            onClick={() => navigate("/post-service-request")}
            className="flex items-center gap-2"
          >
            <Briefcase size={18} />
            Post Service Request
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Folder className="text-blue-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orders.length + dummyData.orders}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Calendar className="text-blue-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bookings.length + dummyData.bookings}</p>
                  <p className="text-sm text-muted-foreground">Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Heart className="text-green-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{wishlist.length}</p>
                  <p className="text-sm text-muted-foreground">Wishlist</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Package className="text-green-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {orders.filter((o) => o.status === "delivered").length + dummyData.delivered}
                  </p>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="service-requests">My Service Requests</TabsTrigger>
            <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id || order._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {order.listing_title || order.product_title || order.title || "Order"}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Order ID: {(order.id || order._id || "").toString().slice(0, 8)}...
                          </p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status || "pending"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium">{order.quantity || 1}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-medium">
                            ${((order.total_amount || order.amount || 0)).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Payment</p>
                          <p className="font-medium capitalize">
                            {order.payment_status || "pending"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">
                            {order.created_at || order.timestamp
                              ? new Date(order.created_at || order.timestamp).toLocaleDateString()
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
                <CardContent className="pt-20 pb-20 text-center">
                  <div className="relative mx-auto w-32 h-32 mb-6 flex items-center justify-center">
                    <ShoppingBag
                      size={80}
                      className="text-muted-foreground/30"
                      strokeWidth={1.5}
                    />
                    <Smile
                      size={32}
                      className="absolute bottom-4 right-4 text-muted-foreground/50"
                      strokeWidth={2}
                    />
                  </div>
                  <p className="text-xl font-semibold mb-2">No orders yet</p>
                  <p className="text-muted-foreground">
                    Start shopping to see your orders here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            {bookings.length > 0 ? (
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
                            with {booking.provider_name || booking.seller_name || "Provider"}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <Calendar
                              size={16}
                              className="inline mr-2 text-muted-foreground"
                            />
                            <span>
                              {booking.start_time || booking.booked_at || booking.created_at
                                ? new Date(
                                    booking.start_time || booking.booked_at || booking.created_at
                                  ).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                          <div>
                            <Clock
                              size={16}
                              className="inline mr-2 text-muted-foreground"
                            />
                            <span>
                              {booking.start_time || booking.booked_at || booking.created_at
                                ? new Date(
                                    booking.start_time || booking.booked_at || booking.created_at
                                  ).toLocaleTimeString()
                                : "N/A"}
                            </span>
                          </div>
                          <div>
                            <DollarSign
                              size={16}
                              className="inline mr-2 text-muted-foreground"
                            />
                            <span>${booking.price || booking.amount || 0}</span>
                          </div>
                        </div>

                        {booking.notes && (
                          <div className="p-3 bg-muted rounded-lg text-sm">
                            <strong>Notes:</strong> {booking.notes}
                          </div>
                        )}

                        <div className="flex gap-2">
                          {booking.meeting_link &&
                            booking.status === "confirmed" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  window.open(booking.meeting_link, "_blank")
                                }
                              >
                                <Video size={16} className="mr-2" />
                                Join Meeting
                              </Button>
                            )}
                          {booking.status === "confirmed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id || booking._id)}
                            >
                              Cancel
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
                  <Calendar
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-lg font-medium">No bookings yet</p>
                  <p className="text-muted-foreground">
                    Book services to see your appointments here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="service-requests" className="mt-6">
            {myServiceRequests.length > 0 ? (
              <div className="space-y-4">
                {myServiceRequests.map((request) => (
                  <Card key={request.id || request._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{request.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Posted on: {new Date(request.created_at || request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(request.status || "open")}>
                          {request.status || "open"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-muted-foreground">{request.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{request.category}</Badge>
                          <Badge variant="outline">
                            Budget: ${request.budget?.toFixed(2) || "0.00"}
                          </Badge>
                          <Badge variant="outline">
                            {request.experience_level || "intermediate"}
                          </Badge>
                        </div>

                        {request.skills_required && request.skills_required.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Required Skills:</p>
                            <div className="flex flex-wrap gap-2">
                              {request.skills_required.map((skill, idx) => (
                                <Badge key={idx} variant="outline">{skill}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              navigate(`/service-request/${request.id || request._id}`)
                            }
                          >
                            View Details
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() =>
                              handleDeleteServiceRequest(request.id || request._id)
                            }
                            className="flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            Delete
                          </Button>
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
                  <p className="text-lg font-medium">No service requests posted yet</p>
                  <p className="text-muted-foreground mb-4">
                    Post a service request to find freelancers for your project
                  </p>
                  <Button
                    onClick={() => navigate("/post-service-request")}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Briefcase size={18} />
                    Post Service Request
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="wishlist" className="mt-6">
            {wishlist.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
                {wishlist.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-10 pb-10 text-center">
                  <Heart
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-lg font-medium">No items in wishlist</p>
                  <p className="text-muted-foreground">
                    Save listings you like to view them later
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BuyerDashboard;
