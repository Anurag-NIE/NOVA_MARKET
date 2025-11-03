import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Search,
  ShoppingCart,
  Star,
  DollarSign,
  Package,
  Filter,
  Eye,
} from "lucide-react";
import api from "../utils/api";

const ProductsPage = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const categories = [
    "All",
    "Electronics",
    "Clothing",
    "Home & Garden",
    "Books",
    "Sports",
    "Toys",
    "Health",
    "Beauty",
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory, minPrice, maxPrice, products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory && selectedCategory !== "All") {
        params.category = selectedCategory;
      }
      if (minPrice) params.min_price = parseFloat(minPrice);
      if (maxPrice) params.max_price = parseFloat(maxPrice);
      if (searchTerm) params.search = searchTerm;

      const response = await api.get("/products", { params });
      const productsData = response.data || [];
      
      // Debug: Log products and their images - very detailed
      console.log("📦 Products fetched:", productsData.length);
      console.log("📦 Full response data:", response.data);
      productsData.forEach((p, index) => {
        console.log(`\n📦 Product ${index + 1}:`);
        console.log(`  - ID: ${p.id}`);
        console.log(`  - Title: ${p.title}`);
        console.log(`  - Images array:`, p.images);
        console.log(`  - Images type:`, typeof p.images);
        console.log(`  - Images length:`, Array.isArray(p.images) ? p.images.length : 'not an array');
        console.log(`  - First image:`, p.images?.[0]);
        console.log(`  - Full product object:`, p);
      });
      
      setProducts(productsData);
      setFilteredProducts(productsData); // Initialize filtered products
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(error.response?.data?.detail || "Failed to load products");
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory && selectedCategory !== "All") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = async (e, productId) => {
    e.stopPropagation(); // Prevent navigation
    
    if (!user) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }

    if (user.role !== "buyer") {
      toast.error("Only buyers can add to cart");
      return;
    }

    try {
      const response = await api.post("/products/cart/add", {
        product_id: productId,
        quantity: 1,
      });
      toast.success(response.data?.message || "Added to cart!");

      // Local fallback cache (used if server cart fetch fails)
      try {
        const key = `cart_cache_${user.id}`;
        const cached = JSON.parse(localStorage.getItem(key) || "[]");
        const existing = cached.find((c) => c.product_id === (productId));
        if (existing) {
          existing.quantity = (existing.quantity || 1) + 1;
        } else {
          cached.push({ product_id: productId, quantity: 1 });
        }
        localStorage.setItem(key, JSON.stringify(cached));
      } catch {}
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(error.response?.data?.detail || "Failed to add to cart");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <ShoppingCart className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Product Marketplace
          </h1>
          <p className="text-muted-foreground text-lg">
            Shop thousands of products from trusted sellers
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  placeholder="Search products..."
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

              <Button onClick={fetchProducts} className="h-12">
                <Filter size={18} className="mr-2" />
                Apply Filters
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Min Price ($)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Max Price ($)
                </label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredProducts.length} of {products.length} products
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="shadow-lg p-12 text-center">
            <Package size={64} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id || product._id}
                className="hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/product/${product.id || product._id}`)}
              >
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden mb-4 relative">
                  {(() => {
                    // Robust image checking - handle all cases
                    const imagesArray = product.images;
                    const firstImage = imagesArray && Array.isArray(imagesArray) && imagesArray.length > 0 
                      ? imagesArray[0] 
                      : null;
                    const hasImages = firstImage && 
                                     typeof firstImage === 'string' &&
                                     firstImage.trim().length > 0;
                    
                    // Only log once per product to avoid spam
                    if (!hasImages && imagesArray) {
                      console.warn(`⚠️ Product ${product.id} (${product.title}) - Images array exists but no valid first image:`, {
                        images: imagesArray,
                        firstImage: firstImage,
                        type: typeof imagesArray
                      });
                    }
                    
                    if (hasImages) {
                      return (
                        <>
                          <img
                            key={`img-${product.id}-${firstImage.substring(0, 20)}`}
                            src={firstImage}
                            alt={product.title || 'Product image'}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              console.error(`❌ Failed to load image for product ${product.id}:`, firstImage);
                              console.error(`❌ Image URL that failed:`, e.target.src);
                              e.target.style.display = 'none';
                              const fallback = e.target.parentElement?.querySelector('.image-fallback');
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }}
                            onLoad={() => {
                              console.log(`✅ Image loaded successfully for product ${product.id}`);
                            }}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 image-fallback" style={{ display: 'none' }}>
                            <Package size={48} className="text-muted-foreground" />
                          </div>
                        </>
                      );
                    } else {
                      return (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={48} className="text-muted-foreground" />
                        </div>
                      );
                    }
                  })()}
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg line-clamp-2 flex-1">
                      {product.title}
                    </h3>
                    <Badge variant="secondary" className="ml-2">
                      {product.category}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {product.description}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <Star className="text-yellow-400 fill-yellow-400" size={16} />
                    <span className="text-sm font-semibold">
                      {product.rating?.toFixed(1) || "0.0"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({product.reviews_count || 0})
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <DollarSign size={20} className="text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        {product.price?.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Stock: {product.stock}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${product.id || product._id}`);
                      }}
                    >
                      <Eye size={16} className="mr-2" />
                      View
                    </Button>
                    {user?.role === "buyer" && product.stock > 0 && (
                      <Button
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        onClick={(e) => handleAddToCart(e, product.id || product._id)}
                      >
                        <ShoppingCart size={16} className="mr-2" />
                        Add to Cart
                      </Button>
                    )}
                    {product.stock === 0 && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        disabled
                      >
                        Out of Stock
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

export default ProductsPage;

