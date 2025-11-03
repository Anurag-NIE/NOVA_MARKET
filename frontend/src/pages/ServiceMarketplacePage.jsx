// // frontend/src/pages/ServiceMarketplacePage.jsx - FIXED

// import React from "react";
// import ServiceMarketplace from "./ServiceMarketplace"; // ✅ FIXED: Changed from components to pages

// const ServiceMarketplacePage = () => {
//   return (
//     <div className="min-h-screen">
//       <ServiceMarketplace />
//     </div>
//   );
// };

// export default ServiceMarketplacePage;














// frontend/src/pages/ServiceMarketplacePage.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Briefcase,
  Send,
  Eye,
  Calendar,
  Award,
  Zap,
  Target,
  Star,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

import api from "../utils/api";

const ServiceMarketplacePage = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");

  const categories = [
    "All",
    "Web Development",
    "Mobile Development",
    "UI/UX Design",
    "Data Science",
    "Machine Learning",
    "DevOps",
    "Content Writing",
    "Digital Marketing",
    "Video Editing",
    "Graphic Design",
  ];

  const experienceLevels = ["All", "beginner", "intermediate", "expert"];

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchTerm, selectedCategory, selectedLevel, requests]);

  const fetchServiceRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get("/service-requests", {
        params: { status: "open" }
      });
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.skills_required?.some((skill) =>
            skill.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (selectedCategory && selectedCategory !== "All") {
      filtered = filtered.filter((req) => req.category === selectedCategory);
    }

    if (selectedLevel && selectedLevel !== "All") {
      filtered = filtered.filter(
        (req) => req.experience_level === selectedLevel
      );
    }

    setFilteredRequests(filtered);
  };

  const handleApply = (requestId) => {
    if (!requestId) {
      toast.error("Invalid request ID");
      return;
    }

    if (!user) {
      toast.error("Please login to apply");
      navigate("/login");
      return;
    }

    if (user.role !== "seller") {
      toast.error("Only sellers can submit proposals");
      return;
    }

    navigate(`/submit-proposal/${requestId}`);
  };

  const handleViewDetails = (requestId) => {
    if (!requestId) {
      toast.error("Invalid request ID");
      return;
    }
    navigate(`/service-request/${requestId}`);
  };

  const getExperienceBadgeColor = (level) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const calculateDaysAgo = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-indigo-500 mx-auto mb-6"></div>
            <Zap
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse"
              size={32}
            />
          </div>
          <p className="text-lg text-indigo-200 animate-pulse font-medium">
            Loading opportunities...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-10 relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <div className="w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl"></div>
          </div>
          <div className="relative">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5 shadow-2xl shadow-indigo-500/50 transform hover:scale-110 transition-all duration-300">
              <Briefcase className="text-white" size={40} />
            </div>
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Find Your Next Project
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Browse{" "}
              <span className="font-bold text-indigo-400">
                {filteredRequests.length}
              </span>{" "}
              open projects and submit winning proposals
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5 backdrop-blur-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-300 mb-1">Total Projects</p>
                <p className="text-3xl font-bold text-emerald-400">
                  {requests.length}
                </p>
              </div>
              <Target className="text-emerald-400 opacity-50" size={40} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5 backdrop-blur-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-300 mb-1">Open Now</p>
                <p className="text-3xl font-bold text-blue-400">
                  {requests.filter((r) => r.status === "open").length}
                </p>
              </div>
              <Briefcase className="text-blue-400 opacity-50" size={40} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300 mb-1">Avg. Budget</p>
                <p className="text-3xl font-bold text-purple-400">
                  $
                  {Math.round(
                    requests.reduce((acc, r) => acc + (r.budget || 0), 0) /
                      (requests.length || 1)
                  )}
                </p>
              </div>
              <DollarSign className="text-purple-400 opacity-50" size={40} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20 rounded-2xl p-5 backdrop-blur-xl hover:shadow-lg hover:shadow-pink-500/20 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-300 mb-1">Categories</p>
                <p className="text-3xl font-bold text-pink-400">
                  {new Set(requests.map((r) => r.category)).size}
                </p>
              </div>
              <Award className="text-pink-400 opacity-50" size={40} />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-900/50 backdrop-blur-xl border-2 border-indigo-500/20 rounded-2xl shadow-2xl mb-8 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400"
                size={20}
              />
              <input
                placeholder="Search projects, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter
                className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none z-10"
                size={20}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-slate-800/50 border border-slate-700 text-white rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-800">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience Level Filter */}
            <div className="relative">
              <Award
                className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none z-10"
                size={20}
              />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-slate-800/50 border border-slate-700 text-white rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                {experienceLevels.map((level) => (
                  <option key={level} value={level} className="bg-slate-800">
                    {level === "All"
                      ? "All Levels"
                      : level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm ||
            selectedCategory !== "All" ||
            selectedLevel !== "All") && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-sm text-slate-400">Active filters:</span>
              {searchTerm && (
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-sm">
                  Search: {searchTerm}
                </span>
              )}
              {selectedCategory !== "All" && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-sm">
                  {selectedCategory}
                </span>
              )}
              {selectedLevel !== "All" && (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-sm">
                  {selectedLevel}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                  setSelectedLevel("All");
                }}
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-slate-300">
            Showing{" "}
            <span className="font-bold text-indigo-400">
              {filteredRequests.length}
            </span>{" "}
            of <span className="font-bold">{requests.length}</span> projects
          </p>
          <button
            onClick={fetchServiceRequests}
            className="flex items-center gap-2 text-indigo-300 hover:text-white transition-colors"
          >
            <TrendingUp size={16} />
            Refresh
          </button>
        </div>

        {/* Projects Grid */}
        {filteredRequests.length === 0 ? (
          <div className="bg-slate-900/50 backdrop-blur-xl border-2 border-slate-700 rounded-2xl shadow-2xl p-16 text-center">
            <Briefcase size={64} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              No Projects Found
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm ||
              selectedCategory !== "All" ||
              selectedLevel !== "All"
                ? "Try adjusting your filters"
                : "Check back soon for new opportunities!"}
            </p>
            {(searchTerm ||
              selectedCategory !== "All" ||
              selectedLevel !== "All") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                  setSelectedLevel("All");
                }}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/50 transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRequests.map((request) => (
              <div
                key={request.id || request._id}
                className="group bg-slate-900/50 backdrop-blur-xl border-2 border-slate-700 hover:border-indigo-500/50 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 mb-2">
                        {request.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-medium">
                          {request.category}
                        </span>
                        <span
                          className={`px-3 py-1 border rounded-full text-xs font-medium ${getExperienceBadgeColor(
                            request.experience_level
                          )}`}
                        >
                          {request.experience_level || "intermediate"}
                        </span>
                        {calculateDaysAgo(request.created_at) && (
                          <span className="text-xs text-slate-400">
                            Posted {calculateDaysAgo(request.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-300 mb-4 line-clamp-3 leading-relaxed">
                    {request.description}
                  </p>

                  {/* Skills */}
                  {request.skills_required &&
                    request.skills_required.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {request.skills_required
                          .slice(0, 5)
                          .map((skill, idx) => (
                            <span
                              key={`${request.id || request._id}-skill-${idx}`}
                              className="px-3 py-1 bg-slate-800/70 text-slate-300 border border-slate-600 rounded-lg text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        {request.skills_required.length > 5 && (
                          <span className="px-3 py-1 text-slate-400 text-xs">
                            +{request.skills_required.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                  {/* Project Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <DollarSign size={20} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Budget</p>
                        <p className="font-bold text-emerald-400">
                          ${request.budget?.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {request.deadline && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Calendar size={20} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Deadline</p>
                          <p className="font-semibold text-blue-400 text-sm">
                            {formatDate(request.deadline)}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Users size={20} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Proposals</p>
                        <p className="font-semibold text-purple-400">
                          {request.proposals_count || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <Clock size={20} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Status</p>
                        <p className="font-semibold text-amber-400 text-sm capitalize">
                          {request.status || "open"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        handleViewDetails(request.id || request._id)
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl transition-all"
                    >
                      <Eye size={16} />
                      View Details
                    </button>

                    {user?.role === "seller" && (
                      <button
                        onClick={() => handleApply(request.id || request._id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all"
                      >
                        <Send size={16} />
                        Submit Proposal
                      </button>
                    )}

                    {!user && (
                      <button
                        onClick={() => navigate("/login")}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/50 transition-all"
                      >
                        Login to Apply
                      </button>
                    )}

                    {user?.role === "buyer" && (
                      <button
                        disabled
                        className="flex-1 px-4 py-3 bg-slate-700 text-slate-400 rounded-xl cursor-not-allowed"
                      >
                        Buyer Account
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceMarketplacePage;