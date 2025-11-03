import axios from "axios";

// Use environment variable or fallback to localhost
const API_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  },
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.post("/auth/change-password", data),
};

// Freelancer APIs
export const freelancerAPI = {
  getProfile: (userId) => api.get(`/freelancers/${userId}`),
  updateProfile: (data) => api.put("/freelancers/profile", data),
  getAll: (params) => api.get("/freelancers", { params }),
  search: (params) => api.get("/freelancers/search", { params }),
};

// Service Request APIs
export const serviceRequestAPI = {
  create: (data) => api.post("/service-requests", data),
  getAll: (params) => api.get("/service-requests", { params }),
  getById: (id) => api.get(`/service-requests/${id}`),
  update: (id, data) => api.put(`/service-requests/${id}`, data),
  delete: (id) => api.delete(`/service-requests/${id}`),
  getMy: () => api.get("/service-requests", { params: {} }), // Buyers see their own
  getProposals: (requestId) => api.get(`/service-requests/${requestId}/proposals`),
  acceptProposal: (requestId, proposalId) => api.post(`/service-requests/${requestId}/proposals/${proposalId}/accept`),
  completeRequest: (requestId) => api.post(`/service-requests/${requestId}/complete`),
  book: (requestId) => api.post(`/service-requests/${requestId}/book`), // Sellers book service requests
  getMyBookings: () => api.get("/service-requests/bookings/my-bookings"), // Sellers view their bookings
};

// Proposal APIs
export const proposalAPI = {
  submit: (requestId, data) => api.post(`/service-requests/${requestId}/proposals`, data),
  getMy: () => api.get("/my-proposals"),
  getByRequest: (requestId) => api.get(`/service-requests/${requestId}/proposals`),
};

// Product Marketplace APIs
export const productAPI = {
  getAll: (params) => api.get("/products", { params }),
  getById: (id) => api.get(`/products/${id}`),
  add: (data) => api.post("/products/add", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  addToCart: (data) => api.post("/products/cart/add", data),
  getCart: () => api.get("/products/cart"),
  removeFromCart: (itemId) => api.delete(`/products/cart/${itemId}`),
  getOrders: () => api.get("/products/orders"),
};

// Service Marketplace APIs
export const serviceAPI = {
  getAll: (params) => api.get("/services", { params }),
  getById: (id) => api.get(`/services/${id}`),
  add: (data) => api.post("/services/add", data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  createBooking: (data) => api.post("/services/bookings/create", data),
  getMyBookings: () => api.get("/services/bookings/my-bookings"),
  updateBookingStatus: (bookingId, status) => api.put(`/services/bookings/${bookingId}/status`, { status }, { params: { status } }),
};

// Unified Checkout API
export const checkoutAPI = {
  createSession: (data) => api.post("/checkout/create-session", data),
};

// Review APIs
export const reviewAPI = {
  create: (data) => api.post("/reviews", data),
  getByItem: (itemId, itemType) => api.get("/reviews", { params: { item_id: itemId, item_type: itemType } }),
};

// Booking APIs
export const bookingAPI = {
  create: (data) => api.post("/bookings", data),
  getAll: (params) => api.get("/bookings", { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  cancel: (id) => api.delete(`/bookings/${id}`),
  getMy: () => api.get("/bookings/my-bookings"),
};

// Listing APIs
export const listingAPI = {
  create: (data) => api.post("/listings", data),
  getAll: (params) => api.get("/listings", { params }),
  getById: (id) => api.get(`/listings/${id}`),
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
  getMy: () => api.get("/listings/my-listings"),
};

// Order APIs
export const orderAPI = {
  create: (data) => api.post("/orders", data),
  getAll: (params) => api.get("/orders", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.put(`/orders/${id}`, data),
  cancel: (id) => api.delete(`/orders/${id}`),
};

// Notification APIs
export const notificationAPI = {
  getAll: (params) => api.get("/notifications", { params }),
  markAsRead: (id) => api.post(`/notifications/${id}/mark-read`), // Fixed: POST not PUT
  markAllAsRead: () => api.post("/notifications/mark-all-read"), // Fixed: POST not PUT
  delete: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get("/notifications/unread-count"),
};

export default api;
