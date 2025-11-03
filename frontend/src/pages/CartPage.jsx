// frontend/src/pages/CartPage.jsx - COMPLETE WORKING VERSION
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import api from "../utils/api";

const CartPage = ({ user }) => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "buyer") {
      toast.error("Please login as a buyer to view cart");
      navigate("/login");
      return;
    }
    loadCart();
  }, [user, navigate]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const response = await api.get("/products/cart");
      const server = response.data || {};
      const items = Array.isArray(server.items)
        ? server.items.map((i) => ({
            id: i.id,
            product_id: i.product?.id || i.product_id,
            title: i.product?.title || "Product",
            category: i.product?.category || "",
            image: i.product?.images?.[0] || "",
            price: i.product?.price ?? 0,
            quantity: i.quantity ?? 1,
          }))
        : [];
      setCart(items);
      // Clear fallback cache after successful server sync
      try {
        localStorage.removeItem(`cart_cache_${user.id}`);
      } catch {}
    } catch (error) {
      console.error("Error loading cart:", error);
      const errorMsg = error?.response?.data?.detail || error?.message || "Failed to load cart";
      console.error("Cart API error details:", {
        status: error?.response?.status,
        data: error?.response?.data,
        message: errorMsg,
      });
      
      // Fallback to local cache to avoid blank cart
      try {
        const key = `cart_cache_${user.id}`;
        const cached = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(cached) && cached.length > 0) {
          const detailed = await Promise.all(
            cached.map(async (c) => {
              try {
                const res = await api.get(`/products/${c.product_id}`);
                const p = res.data || {};
                return {
                  id: c.product_id,
                  product_id: c.product_id,
                  title: p.title || "Product",
                  category: p.category || "",
                  image: (p.images && p.images[0]) || "",
                  price: p.price ?? 0,
                  quantity: c.quantity || 1,
                };
              } catch {
                return null;
              }
            })
          );
          const items = detailed.filter(Boolean);
          setCart(items);
          toast.error(`Server cart unavailable (${errorMsg}). Showing cached cart.`);
        } else {
          toast.error(errorMsg);
          setCart([]);
        }
      } catch {
        toast.error(errorMsg);
        setCart([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, change) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item) return;

    const newQuantity = item.quantity + change;
    if (newQuantity < 1) return;

    try {
      // Fallback mode: when id === product_id, we are using local cache
      if (item.id === item.product_id) {
        const key = `cart_cache_${user.id}`;
        const cached = JSON.parse(localStorage.getItem(key) || "[]");
        const idx = cached.findIndex((c) => c.product_id === item.product_id);
        if (idx !== -1) cached[idx].quantity = newQuantity;
        localStorage.setItem(key, JSON.stringify(cached));
        setCart(
          cart.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i))
        );
        toast.success("Quantity updated");
        return;
      }

      // Server mode: try to update by delete + re-add
      // If item doesn't exist (404), just add it directly
      try {
        await api.delete(`/products/cart/${itemId}`);
      } catch (deleteError) {
        // If delete fails with 404, item might not exist - that's okay, we'll add it
        if (deleteError?.response?.status !== 404) {
          throw deleteError; // Re-throw if it's not a "not found" error
        }
        // 404 is okay - item might have been deleted already or doesn't exist
        console.log("Item not found in cart, will add as new");
      }
      
      // Add with new quantity (this will update if it already exists, or create new)
      await api.post("/products/cart/add", {
        product_id: item.product_id,
        quantity: newQuantity,
      });
      
      // Reload cart from server to get the actual updated state
      await loadCart();
      toast.success("Quantity updated");
    } catch (error) {
      console.error("Error updating quantity:", error);
      const errorMsg = error?.response?.data?.detail || error?.message || "Failed to update quantity";
      toast.error(errorMsg);
      // Reload from server to stay consistent
      await loadCart();
    }
  };

  const removeItem = async (itemId) => {
    try {
      const item = cart.find((i) => i.id === itemId);
      if (!item) return;
      
      if (item.id === item.product_id) {
        // Fallback cache removal
        const key = `cart_cache_${user.id}`;
        const cached = JSON.parse(localStorage.getItem(key) || "[]");
        const next = cached.filter((c) => c.product_id !== item.product_id);
        localStorage.setItem(key, JSON.stringify(next));
        setCart(cart.filter((i) => i.id !== itemId));
        toast.success("Item removed from cart");
        return;
      }

      // Server mode: delete from backend
      await api.delete(`/products/cart/${itemId}`);
      setCart(cart.filter((i) => i.id !== itemId));
      toast.success("Item removed from cart");
      
      // Reload to sync with server
      await loadCart();
    } catch (error) {
      console.error("Error removing item:", error);
      const errorMsg = error?.response?.data?.detail || error?.message || "Failed to remove item";
      toast.error(errorMsg);
      // Try to reload cart to sync state
      await loadCart();
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setProcessing(true);
    try {
      const response = await api.post("/checkout/create-session", {
        items: cart.map((item) => ({ id: item.product_id, quantity: item.quantity })),
        type: "product",
      });

      const url = response.data?.url || response.data?.checkout_url;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      const detail = error?.response?.data?.detail;
      const message =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail.map((d) => d?.msg || "").filter(Boolean).join(", ") ||
            "Failed to create checkout session"
          : "Failed to create checkout session";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <ShoppingCart className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold mb-2">Your Shopping Cart</h1>
          <p className="text-muted-foreground">{cart.length} items in your cart</p>
        </div>

        {cart.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingCart
                size={64}
                className="mx-auto text-muted-foreground mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">
                Add some products to get started!
              </p>
              <Button onClick={() => navigate("/products")}>
                Browse Products
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <Card
                  key={item.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <ShoppingCart
                          size={32}
                          className="text-muted-foreground"
                          style={{ display: item.image ? 'none' : 'block' }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">
                          {item.title}
                        </h3>
                        <Badge variant="secondary">{item.category}</Badge>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={16} />
                            </Button>
                            <span className="w-12 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus size={16} />
                            </Button>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-2xl font-bold text-purple-600">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={18} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-semibold">Free</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-semibold">$0.00</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between mb-6">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-bold text-purple-600">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      disabled={processing || cart.length === 0}
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {processing ? (
                        <>
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard size={20} className="mr-2" />
                          Proceed to Checkout
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { toast } from "sonner";
// import { Card, CardContent } from "../components/ui/card";
// import { Button } from "../components/ui/button";
// import { Badge } from "../components/ui/badge";
// import {
//   ShoppingCart,
//   Trash2,
//   ArrowRight,
//   Package,
//   DollarSign,
//   Minus,
//   Plus,
// } from "lucide-react";
// import api from "../utils/api";

// const CartPage = ({ user }) => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [cart, setCart] = useState(null);

//   useEffect(() => {
//     if (user?.role === "buyer") {
//       fetchCart();
//     }
//   }, [user]);

//   const fetchCart = async () => {
//     setLoading(true);
//     try {
//       const response = await api.get("/products/cart");
//       console.log("Cart response:", response.data); // Debug
//       if (response.data && (response.data.items || response.data.length === 0)) {
//         setCart(response.data);
//       } else {
//         // Handle empty cart
//         setCart({
//           items: [],
//           total: 0,
//           item_count: 0
//         });
//       }
//     } catch (error) {
//       console.error("Error fetching cart:", error);
//       console.error("Error details:", error.response?.data); // Debug
//       // Set empty cart instead of failing
//       setCart({
//         items: [],
//         total: 0,
//         item_count: 0
//       });
//       if (error.response?.status === 403) {
//         toast.error("Only buyers can view cart");
//       } else {
//         toast.error(error.response?.data?.detail || "Failed to load cart");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleUpdateQuantity = async (itemId, newQuantity) => {
//     if (newQuantity <= 0) {
//       handleRemoveItem(itemId);
//       return;
//     }

//     try {
//       // Remove old item and add with new quantity
//       await api.delete(`/products/cart/${itemId}`);
//       const item = cart.items.find((i) => i.id === itemId);
//       if (item && item.product) {
//         await api.post("/products/cart/add", {
//           product_id: item.product.id || item.product._id,
//           quantity: newQuantity,
//         });
//       }
//       await fetchCart(); // Refresh cart after update
//     } catch (error) {
//       console.error("Error updating quantity:", error);
//       toast.error("Failed to update quantity");
//     }
//   };

//   const handleRemoveItem = async (itemId) => {
//     try {
//       await api.delete(`/products/cart/${itemId}`);
//       toast.success("Item removed from cart");
//       await fetchCart(); // Refresh cart
//     } catch (error) {
//       console.error("Error removing item:", error);
//       toast.error(error.response?.data?.detail || "Failed to remove item");
//     }
//   };

//   const handleCheckout = async () => {
//     if (!cart || !cart.items || cart.items.length === 0) {
//       toast.error("Cart is empty");
//       return;
//     }

//     try {
//       const checkoutItems = cart.items
//         .filter(item => item.product && (item.product.id || item.product._id))
//         .map((item) => ({
//           id: item.product.id || item.product._id,
//           type: "product",
//           quantity: item.quantity || 1,
//           price: item.product.price || 0,
//           title: item.product.title || "Product",
//         }));

//       if (checkoutItems.length === 0) {
//         toast.error("No valid items in cart");
//         await fetchCart(); // Refresh to get updated cart
//         return;
//       }

//       const response = await api.post("/checkout/create-session", {
//         items: checkoutItems,
//         type: "product",
//       });

//       if (response.data && response.data.url) {
//         // Redirect to Stripe checkout
//         window.location.href = response.data.url;
//       } else {
//         toast.error("Failed to get checkout URL");
//       }
//     } catch (error) {
//       console.error("Error creating checkout:", error);
//       toast.error(error.response?.data?.detail || "Failed to proceed to checkout");
//     }
//   };

//   if (!user || user.role !== "buyer") {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center">
//         <div className="text-center">
//           <ShoppingCart size={64} className="mx-auto text-muted-foreground mb-4" />
//           <h2 className="text-2xl font-bold mb-2">Buyer Account Required</h2>
//           <p className="text-muted-foreground mb-4">
//             Only buyers can access the cart
//           </p>
//           <Button onClick={() => navigate("/")}>Go Home</Button>
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-lg text-muted-foreground">Loading cart...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!cart || !cart.items || cart.items.length === 0) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-8 px-4">
//         <div className="max-w-4xl mx-auto">
//           <Card className="shadow-lg p-12 text-center">
//             <ShoppingCart size={64} className="mx-auto text-muted-foreground mb-4" />
//             <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
//             <p className="text-muted-foreground mb-6">
//               Add products to your cart to get started
//             </p>
//             <Button onClick={() => navigate("/products")}>
//               Browse Products
//             </Button>
//           </Card>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-8 px-4">
//       <div className="max-w-6xl mx-auto">
//         <div className="flex items-center justify-between mb-8">
//           <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//             Shopping Cart
//           </h1>
//           <Badge variant="secondary" className="text-lg px-4 py-2">
//             {cart.item_count} {cart.item_count === 1 ? "item" : "items"}
//           </Badge>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Cart Items */}
//           <div className="lg:col-span-2 space-y-4">
//             {cart.items.map((item) => (
//               <Card key={item.id} className="shadow-lg">
//                 <CardContent className="p-6">
//                   <div className="flex gap-4">
//                     {/* Product Image */}
//                     <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
//                       {item.product.images && item.product.images.length > 0 ? (
//                         <img
//                           src={item.product.images[0]}
//                           alt={item.product.title}
//                           className="w-full h-full object-cover"
//                         />
//                       ) : (
//                         <div className="w-full h-full flex items-center justify-center">
//                           <Package size={32} className="text-muted-foreground" />
//                         </div>
//                       )}
//                     </div>

//                     {/* Product Info */}
//                     <div className="flex-1">
//                       <div className="flex items-start justify-between mb-2">
//                         <div className="flex-1">
//                           <h3 className="text-lg font-bold mb-1">
//                             {item.product.title}
//                           </h3>
//                           <Badge variant="secondary" className="text-xs">
//                             {item.product.category}
//                           </Badge>
//                         </div>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => handleRemoveItem(item.id)}
//                           className="text-red-600 hover:text-red-700"
//                         >
//                           <Trash2 size={18} />
//                         </Button>
//                       </div>

//                       <div className="flex items-center justify-between mt-4">
//                         <div className="flex items-center gap-3">
//                           <span className="text-sm text-muted-foreground">Quantity:</span>
//                           <div className="flex items-center gap-2 border rounded-lg">
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
//                               className="h-8 w-8 p-0"
//                             >
//                               <Minus size={16} />
//                             </Button>
//                             <span className="w-12 text-center font-semibold">
//                               {item.quantity}
//                             </span>
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
//                               className="h-8 w-8 p-0"
//                               disabled={item.quantity >= item.product.stock}
//                             >
//                               <Plus size={16} />
//                             </Button>
//                           </div>
//                         </div>

//                         <div className="flex items-center gap-2">
//                           <DollarSign size={20} className="text-green-600" />
//                           <span className="text-2xl font-bold text-green-600">
//                             {item.subtotal.toFixed(2)}
//                           </span>
//                         </div>
//                       </div>

//                       {item.product.stock < item.quantity && (
//                         <p className="text-sm text-red-600 mt-2">
//                           Only {item.product.stock} in stock
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>

//           {/* Order Summary */}
//           <div className="lg:col-span-1">
//             <Card className="sticky top-6 shadow-lg">
//               <CardContent className="pt-6">
//                 <h2 className="text-xl font-bold mb-4">Order Summary</h2>

//                 <div className="space-y-3 mb-6">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground">Subtotal:</span>
//                     <span className="font-semibold">${cart.total.toFixed(2)}</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground">Shipping:</span>
//                     <span className="font-semibold">Free</span>
//                   </div>
//                   <div className="border-t pt-3">
//                     <div className="flex justify-between text-lg font-bold">
//                       <span>Total:</span>
//                       <span className="text-green-600 dark:text-green-400">${cart.total.toFixed(2)}</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Payment Methods */}
//                 <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
//                   <p className="text-xs text-muted-foreground mb-2">Secure payment powered by</p>
//                   <div className="flex items-center gap-2">
//                     <div className="px-2 py-1 bg-white dark:bg-slate-700 rounded text-xs font-semibold">
//                       Stripe
//                     </div>
//                     <span className="text-xs text-muted-foreground">
//                       Visa • Mastercard • Amex
//                     </span>
//                   </div>
//                 </div>

//                 <Button
//                   className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
//                   onClick={handleCheckout}
//                 >
//                   <div className="flex items-center justify-center gap-2">
//                     <span>Proceed to Payment</span>
//                     <ArrowRight size={20} />
//                   </div>
//                 </Button>

//                 <Button
//                   variant="outline"
//                   className="w-full mt-3"
//                   onClick={() => navigate("/products")}
//                 >
//                   Continue Shopping
//                 </Button>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CartPage;
