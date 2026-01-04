import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  DollarSign,
  Package,
  CheckCircle,
  Edit3,
  X,
  User,
  Trash2,
  Edit,
  MoreVertical,
  Sparkles,
  Heart,
} from "lucide-react";
import api from "../utils/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const ProductDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (user && product) {
      checkWishlist();
    }
  }, [product, user]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product");
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const checkWishlist = async () => {
    if (!user) return;
    
    try {
      const response = await api.get("/wishlist");
      const productId = product?.id || product?._id || id;
      const wishlist = response.data || [];
      setInWishlist(wishlist.some((item) => (item.id === productId || item._id === productId)));
    } catch (error) {
      console.error("Error checking wishlist:", error);
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast.error("Please login to add items to wishlist");
      navigate("/login");
      return;
    }

    if (user.role !== "buyer") {
      toast.error("Only buyers can add to wishlist");
      return;
    }

    try {
      const productId = product?.id || product?._id || id;
      const method = inWishlist ? "delete" : "post";
      const response = await api[method](`/wishlist/${productId}`);
      
      setInWishlist(!inWishlist);
      toast.success(
        inWishlist ? "Removed from wishlist" : "Added to wishlist"
      );
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error("Failed to update wishlist");
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }

    if (user.role !== "buyer") {
      toast.error("Only buyers can add to cart");
      return;
    }

    if (quantity > product.stock) {
      toast.error("Quantity exceeds available stock");
      return;
    }

    try {
      const response = await api.post("/products/cart/add", {
        product_id: product.id || product._id,
        quantity: quantity,
      });
      toast.success(response.data?.message || "Added to cart!");
      // Local fallback cache in case server cart fetch fails later
      try {
        const key = `cart_cache_${user.id}`;
        const cached = JSON.parse(localStorage.getItem(key) || "[]");
        const pid = product.id || product._id;
        const existing = cached.find((c) => c.product_id === pid);
        if (existing) {
          existing.quantity = (existing.quantity || 1) + quantity;
        } else {
          cached.push({ product_id: pid, quantity });
        }
        localStorage.setItem(key, JSON.stringify(cached));
      } catch {}
      // Optionally refresh cart count or navigate
    } catch (error) {
      console.error("Error adding to cart:", error);
      let errorMessage = "Failed to add to cart";
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/products/${product.id || product._id}`);
      toast.success("Product deleted successfully!");
      navigate("/products");
    } catch (error) {
      console.error("Error deleting product:", error);
      let errorMessage = "Failed to delete product";
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
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleEdit = () => {
    navigate(`/add-product?id=${product.id || product._id}`);
  };

  const isOwner = user && user.role === "seller" && product && user.id === product.seller_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/products")}
          className="mb-6 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <Card className="shadow-xl border-0 bg-white dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-bl-full blur-2xl"></div>
            
            <CardContent className="p-8 relative z-10">
              {product.images && product.images.length > 0 && product.images[0] ? (
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl overflow-hidden shadow-inner group relative ring-2 ring-slate-200 dark:ring-slate-700">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl flex items-center justify-center" style={{ display: 'none' }}>
                    <Package size={80} className="text-muted-foreground opacity-50" />
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl flex items-center justify-center shadow-inner ring-2 ring-slate-200 dark:ring-slate-700">
                  <div className="text-center">
                    <Package size={80} className="text-muted-foreground opacity-50 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No image available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border-0 relative overflow-hidden">
              {/* Decorative gradient overlay */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -z-0"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        {product.title}
                      </h1>
                      {user?.role === "buyer" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleWishlist}
                          className={`h-12 w-12 rounded-full transition-all duration-200 ${
                            inWishlist
                              ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                          title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <Heart
                            size={24}
                            className={inWishlist ? "fill-current" : ""}
                          />
                        </Button>
                      )}
                      {isOwner && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                              <MoreVertical size={20} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                              <Edit size={16} className="mr-2" />
                              Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setShowDeleteDialog(true)}
                              className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400"
                            >
                              <Trash2 size={16} className="mr-2" />
                              Delete Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-base px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-semibold border-0 shadow-md">
                      <Sparkles size={14} className="mr-1.5" />
                      {product.category}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg shadow-sm">
                    <Star className="text-amber-400 fill-amber-400" size={22} />
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                      {product.rating?.toFixed(1) || "0.0"}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    ({product.reviews_count || 0} {product.reviews_count === 1 ? 'review' : 'reviews'})
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg shadow-sm">
                    <DollarSign size={28} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    ${product.price?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <Card className="shadow-lg border-0 bg-white dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
                  <Package size={24} className="text-blue-500" />
                  Description
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-base pl-8">
                  {product.description || "No description available."}
                </p>
              </CardContent>
            </Card>

            {/* Stock & Quantity */}
            <Card className="shadow-lg border-0 bg-white dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-lg font-semibold flex items-center gap-2">
                    <Package size={20} className="text-slate-600 dark:text-slate-400" />
                    Stock Available:
                  </span>
                  <div className="flex items-center gap-2">
                    {product.stock > 0 ? (
                      <>
                        <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
                          <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-xl font-bold text-green-600 dark:text-green-400">
                          {product.stock} items
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full">
                          <X size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                        <span className="text-xl font-bold text-red-600 dark:text-red-400">
                          Out of Stock
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {product.stock > 0 && user?.role === "buyer" && (
                  <div className="space-y-5">
                    <div>
                      <label className="text-sm font-semibold mb-3 block text-slate-700 dark:text-slate-300">
                        Quantity
                      </label>
                      <div className="flex items-center gap-4 justify-center">
                        <Button
                          variant="outline"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="h-10 w-10 rounded-full border-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                          -
                        </Button>
                        <span className="text-2xl font-bold w-16 text-center bg-slate-100 dark:bg-slate-800 py-2 px-4 rounded-lg">
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          disabled={quantity >= product.stock}
                          className="h-10 w-10 rounded-full border-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <Button
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart size={22} className="mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                )}

                {product.stock === 0 && (
                  <div className="flex items-center gap-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <X size={22} />
                    <span className="font-semibold text-lg">Out of Stock</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seller Info */}
            <Card className="shadow-lg border-0 bg-white dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-2 rounded-lg">
                    <User size={18} className="text-white" />
                  </div>
                  Sold by
                </h3>
                <div className="flex items-center gap-3 pl-12">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-full p-2.5">
                    <span className="text-white text-sm font-bold">
                      {product.seller_name?.charAt(0)?.toUpperCase() || "S"}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">{product.seller_name}</p>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="shadow-lg border-0 bg-white dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
                  <Star size={24} className="text-amber-500" />
                  Customer Reviews
                </h2>
                <ProductReviews productId={product.id || product._id} user={user} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <Trash2 size={20} />
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base pt-2">
              Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{product?.title}"</span>? 
              This action cannot be undone and will permanently remove the product from the marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Reviews Component
const ProductReviews = ({ productId, user }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const response = await api.get("/reviews", {
        params: { item_id: productId, item_type: "product" },
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
        item_id: productId,
        item_type: "product",
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      toast.success("Review submitted!");
      setShowReviewForm(false);
      setReviewForm({ rating: 5, comment: "" });
      fetchReviews();
      // Refresh product to update rating
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
      {reviews.length === 0 ? (
        <div className="text-center py-12 px-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
          <div className="flex flex-col items-center gap-4">
            <Star size={48} className="text-slate-400 dark:text-slate-500" />
            <div>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No reviews yet
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Be the first to share your experience!
              </p>
            </div>
            {user?.role === "buyer" && !showReviewForm && (
              <Button
                onClick={() => setShowReviewForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-6 text-base font-semibold"
              >
                <Edit3 size={20} className="mr-2" />
                Write a Review
              </Button>
            )}
            {!user && (
              <p className="text-sm text-muted-foreground">
                Please log in as a buyer to leave a review
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {user?.role === "buyer" && !showReviewForm && (
            <Button
              onClick={() => setShowReviewForm(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-6 text-base font-semibold"
            >
              <Edit3 size={20} className="mr-2" />
              Write a Review
            </Button>
          )}

          <div className="space-y-5">
            {reviews.map((review) => (
              <div
                key={review.id || review._id}
                className="border-l-4 border-blue-500 dark:border-blue-400 pl-5 pr-4 py-4 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/30 dark:to-transparent rounded-r-lg hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-full p-2">
                        <User size={18} className="text-white" />
                      </div>
                      <p className="font-bold text-lg text-slate-900 dark:text-white">
                        {review.buyer_name || "Anonymous"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-11">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={18}
                          className={
                            star <= review.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-300 dark:text-slate-600"
                          }
                        />
                      ))}
                      <span className="ml-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {review.rating}.0
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium whitespace-nowrap ml-4">
                    {new Date(review.created_at || review.timestamp).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <p className="text-muted-foreground leading-relaxed ml-11 text-base">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {showReviewForm && (
        <div className="mt-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Write Your Review
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowReviewForm(false);
                setReviewForm({ rating: 5, comment: "" });
              }}
              className="hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X size={20} />
            </Button>
          </div>
          <form onSubmit={handleSubmitReview} className="space-y-5">
            <div>
              <label className="block font-semibold mb-3 text-slate-700 dark:text-slate-300">
                Rating
              </label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="transition-transform hover:scale-125 active:scale-95"
                  >
                    <Star
                      size={36}
                      className={
                        star <= reviewForm.rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-300 dark:text-slate-600 hover:text-amber-300"
                      }
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {reviewForm.rating === 5 && "Excellent!"}
                {reviewForm.rating === 4 && "Great!"}
                {reviewForm.rating === 3 && "Good"}
                {reviewForm.rating === 2 && "Fair"}
                {reviewForm.rating === 1 && "Poor"}
              </p>
            </div>
            <div>
              <label className="block font-semibold mb-3 text-slate-700 dark:text-slate-300">
                Your Comment
              </label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                rows={5}
                placeholder="Share your thoughts about this product..."
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 text-base font-semibold"
              >
                <Star size={20} className="mr-2" />
                Submit Review
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowReviewForm(false);
                  setReviewForm({ rating: 5, comment: "" });
                }}
                className="px-6 h-12 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;

