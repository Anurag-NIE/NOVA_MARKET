import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Briefcase, Plus, X } from "lucide-react";
import { serviceAPI } from "../utils/api";

const AddService = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    delivery_days: "",
    experience_level: "intermediate",
    skills: [],
  });
  const [skillInput, setSkillInput] = useState("");

  const categories = [
    "Grocery & Daily Essentials",
    "Home Services (Plumbing, Electrical, Cleaning)",
    "Food & Catering",
    "Tailoring & Alterations",
    "Beauty & Wellnes",
    "Local Handicrafts & Art",
    "Appliance Repair & Maintenance",
    "Tutoring & Education Services",
    "Event Planning & Photography",
    "Fitness & Personal Training",
    "Transportation & Delivery",
    "Pet Care & Supplies",
    "Gardening & Landscaping",
    "Local Fashion & Accessories",
    "Web Development & IT Services",
  ];

  const experienceLevels = ["beginner", "intermediate", "expert"];

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (index) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!user) {
      toast.error("Please login to add services");
      navigate("/login");
      return;
    }

    if (user.role !== "seller") {
      toast.error("Only sellers can add services");
      return;
    }

    if (
      !formData.title ||
      !formData.description ||
      !formData.price ||
      !formData.category ||
      formData.skills.length === 0 ||
      !formData.delivery_days
    ) {
      toast.error("Please fill all required fields and add at least one skill");
      return;
    }

    if (parseFloat(formData.price) <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    if (parseInt(formData.delivery_days) < 1) {
      toast.error("Delivery time must be at least 1 day");
      return;
    }

    setLoading(true);
    try {
      const response = await serviceAPI.add({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        delivery_days: parseInt(formData.delivery_days) || 1,
        experience_level: formData.experience_level,
        skills: formData.skills,
      });

      toast.success("Service added successfully!");

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        price: "",
        delivery_days: "",
        experience_level: "intermediate",
        skills: [],
      });

      // Navigate after a short delay
      setTimeout(() => {
        navigate("/seller-dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error adding service:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to add service";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check for seller role - show access denied message if not seller
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center py-8 px-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-6 text-center">
            <Briefcase
              size={48}
              className="mx-auto mb-4 text-muted-foreground"
            />
            <h2 className="text-2xl font-bold mb-2">Please Login</h2>
            <p className="text-muted-foreground mb-4">
              You need to be logged in to add services
            </p>
            <Button onClick={() => navigate("/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== "seller") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center py-8 px-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-6 text-center">
            <Briefcase size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              Only sellers can add services. Your current role is:{" "}
              <strong className="capitalize">{user.role}</strong>
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate("/")}>
                Go Home
              </Button>
              {user.role === "buyer" && (
                <Button onClick={() => navigate("/buyer-dashboard")}>
                  Buyer Dashboard
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/seller-dashboard")}
          className="mb-6"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Briefcase className="text-purple-600" size={24} />
              </div>
              Add New Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Service Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Full-Stack Web Development"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe what service you offer..."
                  rows={6}
                  className="mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full h-10 px-3 border border-input bg-background rounded-md mt-1"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="experience_level">Experience Level *</Label>
                  <select
                    id="experience_level"
                    value={formData.experience_level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        experience_level: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 border border-input bg-background rounded-md mt-1"
                    required
                  >
                    {experienceLevels.map((level) => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0.00"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="delivery_days">Delivery Time (Days) *</Label>
                  <Input
                    id="delivery_days"
                    type="number"
                    min="1"
                    value={formData.delivery_days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        delivery_days: e.target.value,
                      })
                    }
                    placeholder="7"
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Skills & Technologies *</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., React, Node.js, MongoDB"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddSkill}
                      variant="outline"
                    >
                      <Plus size={18} className="mr-2" />
                      Add
                    </Button>
                  </div>

                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(idx)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X size={14} />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/seller-dashboard")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Adding..." : "Add Service"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddService;
