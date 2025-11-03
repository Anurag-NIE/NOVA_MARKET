import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Search,
  Briefcase,
  Star,
  DollarSign,
  Clock,
  Filter,
  Eye,
  Calendar,
  Plus,
} from "lucide-react";
import api from "../utils/api";

const ServicesPage = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedSkill, setSelectedSkill] = useState("");

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
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchTerm, selectedCategory, selectedLevel, selectedSkill, services]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory && selectedCategory !== "All") {
        params.category = selectedCategory;
      }
      if (selectedLevel && selectedLevel !== "All") {
        params.experience_level = selectedLevel;
      }
      if (selectedSkill) {
        params.skills = selectedSkill;
      }
      if (searchTerm) params.search = searchTerm;

      const response = await api.get("/services", { params });
      const servicesData = response.data || [];
      setServices(servicesData);
      setFilteredServices(servicesData); // Initialize filtered services
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error(error.response?.data?.detail || "Failed to load services");
      setServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = [...services];

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  };

  const handleBookService = (serviceId) => {
    if (!user) {
      toast.error("Please login to book services");
      navigate("/login");
      return;
    }

    if (user.role !== "buyer") {
      toast.error("Only buyers can book services");
      return;
    }

    navigate(`/service/${serviceId}`);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
            <Briefcase className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Service Marketplace
          </h1>
          <p className="text-muted-foreground text-lg mb-4">
            {user?.role === "seller" 
              ? "Manage and offer your freelance services"
              : "Hire talented freelancers for your projects"}
          </p>
          {/* Add Service Button for Sellers */}
          {user?.role === "seller" && (
            <Button
              onClick={() => navigate("/add-service")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              <Plus size={20} className="mr-2" />
              Add New Service
            </Button>
          )}
        </div>

        {/* Search & Filters */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-12 px-4 border border-input bg-background rounded-md"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <Button onClick={fetchServices} className="h-12">
                <Filter size={18} className="mr-2" />
                Apply
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="h-10 px-4 border border-input bg-background rounded-md"
              >
                {experienceLevels.map((level) => (
                  <option key={level} value={level}>
                    {level === "All" ? "All Levels" : level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>

              <Input
                placeholder="Filter by skill (e.g., React, Python)"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="h-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredServices.length} of {services.length} services
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <Card className="shadow-lg p-12 text-center">
            <Briefcase size={64} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Services Found</h3>
            {user?.role === "seller" ? (
              <div className="space-y-4">
                <p className="text-muted-foreground mb-4">
                  You haven't added any services yet. Start offering your expertise!
                </p>
                <Button
                  onClick={() => navigate("/add-service")}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus size={20} className="mr-2" />
                  Add Your First Service
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card
                key={service.id || service._id}
                className="hover:shadow-xl transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 line-clamp-2">
                        {service.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{service.category}</Badge>
                        <Badge className={getLevelColor(service.experience_level)}>
                          {service.experience_level}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {service.description}
                  </p>

                  {/* Skills */}
                  {service.skills && service.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {service.skills.slice(0, 4).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {service.skills.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{service.skills.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="text-yellow-400 fill-yellow-400" size={16} />
                        <span className="text-sm font-semibold">
                          {service.rating?.toFixed(1) || "0.0"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar size={16} />
                        <span>{service.delivery_days} days</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <DollarSign size={20} className="text-green-600" />
                        <span className="text-2xl font-bold text-green-600">
                          {service.price?.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {service.completed_count || 0} completed
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/service/${service.id || service._id}`)}
                    >
                      <Eye size={16} className="mr-2" />
                      View
                    </Button>
                    {user?.role === "buyer" && (
                      <Button
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={() => handleBookService(service.id || service._id)}
                      >
                        <Briefcase size={16} className="mr-2" />
                        Book
                      </Button>
                    )}
                    {user?.role === "seller" && service.seller_id === user.id && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate("/seller-dashboard")}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;

