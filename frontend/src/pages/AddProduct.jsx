import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, Package, Upload, Plus, X } from "lucide-react";
import api from "../utils/api";
import { productAPI } from "../utils/api";

const AddProduct = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    images: [],
  });
  const [imageUrl, setImageUrl] = useState("");

  const categories = [
    "Electronics",
    "Clothing",
    "Home & Garden",
    "Books",
    "Sports",
    "Toys",
    "Health",
    "Beauty",
  ];

  const handleAddImage = () => {
    const trimmedUrl = imageUrl.trim();
    if (trimmedUrl) {
      // Validate URL format
      const isValidUrl = trimmedUrl.startsWith("http://") || 
                        trimmedUrl.startsWith("https://") || 
                        trimmedUrl.startsWith("/");
      
      if (!isValidUrl) {
        toast.error("Please enter a valid image URL (must start with http://, https://, or /)");
        return;
      }
      
      console.log("Adding image URL:", trimmedUrl);
      setFormData({
        ...formData,
        images: [...formData.images, trimmedUrl],
      });
      setImageUrl("");
      toast.success("Image added!");
    }
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price || !formData.category) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      // Validate and filter images
      const validImages = formData.images.filter(img => 
        img && typeof img === 'string' && img.trim().length > 0
      );
      
      console.log("📤 Submitting product with images:", validImages);
      console.log("📤 Full product data:", {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 1,
        category: formData.category,
        images: validImages,
      });
      
      const response = await productAPI.add({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 1,
        category: formData.category,
        images: validImages,
      });
      
      console.log("✅ Product added response:", response.data);
      console.log("✅ Product images in response:", response.data?.images);
      
      toast.success("Product added successfully!");
      navigate("/products"); // Navigate to products page to see the new product
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error(error.response?.data?.detail || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

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
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Package className="text-blue-600" size={24} />
              </div>
              Add New Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter product title"
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
                  placeholder="Describe your product..."
                  rows={5}
                  className="mt-1"
                  required
                />
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
                  <Label htmlFor="stock">Stock Quantity *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    placeholder="0"
                    className="mt-1"
                    required
                  />
                </div>
              </div>

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
                <Label>Product Images</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Image URL"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddImage}
                      variant="outline"
                    >
                      <Plus size={18} className="mr-2" />
                      Add
                    </Button>
                  </div>

                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {formData.images.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt={`Product ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/150?text=Invalid+URL";
                            }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(idx)}
                          >
                            <X size={14} />
                          </Button>
                        </div>
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
                  {loading ? "Adding..." : "Add Product"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddProduct;

