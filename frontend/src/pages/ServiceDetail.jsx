// frontend/src/pages/ServiceDetail.jsx - COMPLETE FIX
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Briefcase,
  Star,
  DollarSign,
  Clock,
  Calendar,
  User,
  CheckCircle,
  MessageCircle,
  Award,
} from "lucide-react";
import api from "../utils/api";
import BookingCalendar from "../components/BookingCalendar";

const ServiceDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchService();
  }, [id]);

  const fetchService = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/services/${id}`);
      setService(response.data);
    } catch (error) {
      console.error("Error fetching service:", error);
      toast.error("Failed to load service");
      navigate("/services");
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = () => {
    if (!user) {
      toast.error("Please login to book services");
      navigate("/login");
      return;
    }

    if (user.role !== "buyer") {
      toast.error("Only buyers can book services");
      return;
    }

    // Open booking modal with calendar
    setShowBookingModal(true);
  };

  const handleBookingComplete = async (bookingData) => {
    if (!service || (!service.id && !service._id)) {
      toast.error("Service information is missing");
      return;
    }

    try {
      setShowBookingModal(false); // Close modal while processing
      
      // Validate booking data
      if (!bookingData || !bookingData.date || !bookingData.time) {
        toast.error("Please select date and time for booking");
        setShowBookingModal(true);
        return;
      }

      // Validate service price
      const servicePrice = parseFloat(service.price || 0);
      if (servicePrice <= 0) {
        toast.error("Invalid service price. Please contact support.");
        setShowBookingModal(true);
        return;
      }
      
      // Create checkout session
      const checkoutItems = [
        {
          id: service.id || service._id,
          type: "service",
          quantity: 1,
          price: servicePrice,
          title: service.title || "Service",
          booking_data: bookingData || {}, // Pass booking info to checkout
        },
      ];

      console.log("Creating checkout session with items:", checkoutItems);

      const response = await api.post("/checkout/create-session", {
        items: checkoutItems,
        type: "service",
      });

      console.log("Checkout response:", response.data);

      if (response.data?.url) {
        // Redirect to Stripe payment
        window.location.href = response.data.url;
      } else {
        toast.error("Failed to create checkout session: No payment URL received");
        setShowBookingModal(true); // Reopen modal on error
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      console.error("Error response:", error?.response?.data);
      
      let errorMessage = "Checkout failed";
      if (error?.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail);
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
      setShowBookingModal(true); // Reopen modal on error
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "beginner":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "intermediate":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "expert":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading service...</p>
        </div>
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate("/services")}
          className="mb-6 px-4 py-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back to Services
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Header */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-3">{service.title}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                      {service.category}
                    </span>
                    <span
                      className={`px-3 py-1 border rounded-full text-sm font-medium ${getLevelColor(
                        service.experience_level
                      )}`}
                    >
                      {service.experience_level || "intermediate"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  <Star className="text-yellow-400 fill-yellow-400" size={24} />
                  <span className="text-xl font-semibold">
                    {service.rating?.toFixed(1) || "5.0"}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  ({service.reviews_count || 0} reviews)
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {service.completed_count || 0} completed
                </span>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3">About This Service</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {service.description}
                </p>
              </div>

              {/* Skills */}
              {service.skills && service.skills.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-3">
                    Skills & Technologies
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {service.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border rounded-lg text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <User size={24} />
                About the Seller
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {service.seller_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg">{service.seller_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {service.seller_level || "Professional Seller"}
                  </p>
                </div>
              </div>

              {user && user.id !== service.seller_id && (
                <button
                  onClick={() => navigate(`/chat?user=${service.seller_id}`)}
                  className="mt-4 w-full px-4 py-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  Contact Seller
                </button>
              )}
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={32} className="text-green-600" />
                <span className="text-4xl font-bold text-green-600">
                  {service.price?.toFixed(2)}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Clock size={20} className="text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Delivery Time
                    </p>
                    <p className="font-semibold">
                      {service.delivery_days || 7} days
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <Award size={20} className="text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-semibold capitalize">
                      {service.experience_level || "intermediate"}
                    </p>
                  </div>
                </div>
              </div>

              {user?.role === "buyer" ? (
                <button
                  onClick={handleBookService}
                  className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Calendar size={20} />
                  Book This Service
                </button>
              ) : user?.role === "seller" ? (
                <div className="text-center text-muted-foreground p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  You cannot book your own services
                </div>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Login to Book
                </button>
              )}

              <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-green-700 dark:text-green-400 mb-1">
                      Secure Payment
                    </p>
                    <p className="text-green-600 dark:text-green-500">
                      Protected by Stripe payment gateway
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
            <ServiceReviews serviceId={service.id || service._id} user={user} />
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold">Book {service.title}</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            <div className="p-6">
              <BookingCalendar
                service={service}
                onBookingComplete={handleBookingComplete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reviews Component
const ServiceReviews = ({ serviceId, user }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    fetchReviews();
  }, [serviceId]);

  const fetchReviews = async () => {
    try {
      const response = await api.get("/reviews", {
        params: { item_id: serviceId, item_type: "service" },
      });
      setReviews(response.data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user || user.role !== "buyer") {
      toast.error("Only buyers can leave reviews");
      return;
    }

    try {
      await api.post("/reviews", {
        item_id: serviceId,
        item_type: "service",
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      toast.success("Review submitted!");
      setShowReviewForm(false);
      setReviewForm({ rating: 5, comment: "" });
      fetchReviews();
      // Refresh service to update rating
      window.location.reload();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error.response?.data?.detail || "Failed to submit review");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      {user?.role === "buyer" && !showReviewForm && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Write a Review
        </button>
      )}

      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="space-y-4 p-4 border rounded-lg">
          <div>
            <label className="block font-semibold mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  className="text-2xl"
                >
                  <Star
                    className={star <= reviewForm.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-2">Comment</label>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-slate-800"
              rows={4}
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Submit Review
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReviewForm(false);
                setReviewForm({ rating: 5, comment: "" });
              }}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No reviews yet. Be the first to review!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id || review._id} className="border-b pb-4 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold">{review.buyer_name}</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(review.created_at || review.timestamp).toLocaleDateString()}
                </p>
              </div>
              <p className="text-muted-foreground">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceDetail;




// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { toast } from "sonner";
// import { Card, CardContent } from "../components/ui/card";
// import { Button } from "../components/ui/button";
// import { Badge } from "../components/ui/badge";
// import {
//   ArrowLeft,
//   Briefcase,
//   Star,
//   DollarSign,
//   Clock,
//   Calendar,
//   User,
//   CheckCircle,
// } from "lucide-react";
// import api from "../utils/api";

// const ServiceDetail = ({ user }) => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [service, setService] = useState(null);

//   useEffect(() => {
//     fetchService();
//   }, [id]);

//   const fetchService = async () => {
//     setLoading(true);
//     try {
//       const response = await api.get(`/services/${id}`);
//       setService(response.data);
//     } catch (error) {
//       console.error("Error fetching service:", error);
//       toast.error("Failed to load service");
//       navigate("/services");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBookService = async () => {
//     if (!user) {
//       toast.error("Please login to book services");
//       navigate("/login");
//       return;
//     }

//     if (user.role !== "buyer") {
//       toast.error("Only buyers can book services");
//       return;
//     }

//     try {
//       // Create booking
//       await api.post("/services/bookings/create", {
//         service_id: service.id,
//       });

//       // Redirect to checkout
//       const checkoutItems = [{
//         id: service.id,
//         type: "service",
//         quantity: 1,
//         price: service.price,
//         title: service.title,
//       }];

//       const checkoutResponse = await api.post("/checkout/create-session", {
//         items: checkoutItems,
//         type: "service",
//       });

//       // Redirect to Stripe
//       window.location.href = checkoutResponse.data.url;
//     } catch (error) {
//       console.error("Error booking service:", error);
//       toast.error(error.response?.data?.detail || "Failed to book service");
//     }
//   };

//   const getLevelColor = (level) => {
//     switch (level) {
//       case "beginner":
//         return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
//       case "intermediate":
//         return "bg-blue-500/20 text-blue-400 border-blue-500/30";
//       case "expert":
//         return "bg-purple-500/20 text-purple-400 border-purple-500/30";
//       default:
//         return "bg-slate-500/20 text-slate-400";
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
//           <p className="text-lg text-muted-foreground">Loading service...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!service) return null;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-8 px-4">
//       <div className="max-w-6xl mx-auto">
//         <Button
//           variant="ghost"
//           onClick={() => navigate("/services")}
//           className="mb-6"
//         >
//           <ArrowLeft size={18} className="mr-2" />
//           Back to Services
//         </Button>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Main Content */}
//           <div className="lg:col-span-2 space-y-6">
//             <div>
//               <div className="flex items-start justify-between mb-4">
//                 <div className="flex-1">
//                   <h1 className="text-4xl font-bold mb-3">{service.title}</h1>
//                   <div className="flex items-center gap-2 flex-wrap">
//                     <Badge variant="secondary" className="text-lg px-3 py-1">
//                       {service.category}
//                     </Badge>
//                     <Badge className={getLevelColor(service.experience_level)}>
//                       {service.experience_level}
//                     </Badge>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex items-center gap-4 mb-6">
//                 <div className="flex items-center gap-1">
//                   <Star className="text-yellow-400 fill-yellow-400" size={24} />
//                   <span className="text-xl font-semibold">
//                     {service.rating?.toFixed(1) || "0.0"}
//                   </span>
//                 </div>
//                 <span className="text-muted-foreground">
//                   ({service.reviews_count || 0} reviews)
//                 </span>
//                 <span className="text-muted-foreground">•</span>
//                 <span className="text-muted-foreground">
//                   {service.completed_count || 0} completed
//                 </span>
//               </div>
//             </div>

//             {/* Description */}
//             <Card>
//               <CardContent className="pt-6">
//                 <h2 className="text-xl font-bold mb-3">About This Service</h2>
//                 <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
//                   {service.description}
//                 </p>
//               </CardContent>
//             </Card>

//             {/* Skills */}
//             {service.skills && service.skills.length > 0 && (
//               <Card>
//                 <CardContent className="pt-6">
//                   <h2 className="text-xl font-bold mb-3">Skills & Technologies</h2>
//                   <div className="flex flex-wrap gap-2">
//                     {service.skills.map((skill, idx) => (
//                       <Badge key={idx} variant="outline" className="text-base px-3 py-1">
//                         {skill}
//                       </Badge>
//                     ))}
//                   </div>
//                 </CardContent>
//               </Card>
//             )}
//           </div>

//           {/* Sidebar */}
//           <div className="space-y-6">
//             <Card className="sticky top-6">
//               <CardContent className="pt-6">
//                 <div className="flex items-center gap-2 mb-4">
//                   <DollarSign size={32} className="text-green-600" />
//                   <span className="text-4xl font-bold text-green-600">
//                     ${service.price?.toFixed(2)}
//                   </span>
//                 </div>

//                 <div className="space-y-3 mb-6">
//                   <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
//                     <Clock size={20} className="text-blue-600" />
//                     <div>
//                       <p className="text-sm text-muted-foreground">Delivery Time</p>
//                       <p className="font-semibold">{service.delivery_days} days</p>
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
//                     <User size={20} className="text-purple-600" />
//                     <div>
//                       <p className="text-sm text-muted-foreground">Service Provider</p>
//                       <p className="font-semibold">{service.seller_name}</p>
//                     </div>
//                   </div>
//                 </div>

//                 {user?.role === "buyer" && (
//                   <Button
//                     className="w-full h-12 text-lg"
//                     onClick={handleBookService}
//                   >
//                     <Briefcase size={20} className="mr-2" />
//                     Book This Service
//                   </Button>
//                 )}

//                 {user?.role !== "buyer" && (
//                   <div className="text-center text-muted-foreground p-4">
//                     Login as buyer to book this service
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ServiceDetail;
