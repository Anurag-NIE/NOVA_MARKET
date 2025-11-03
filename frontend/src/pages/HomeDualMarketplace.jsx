import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  ShoppingCart,
  Briefcase,
  ArrowRight,
  Star,
  TrendingUp,
  Package,
} from "lucide-react";
import api from "../utils/api";

const HomeDualMarketplace = ({ user }) => {
  const navigate = useNavigate();
  const [productCount, setProductCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const [productsRes, servicesRes] = await Promise.all([
        api.get("/products", { params: { limit: 100 } }).catch(() => ({ data: [] })),
        api.get("/services", { params: { limit: 100 } }).catch(() => ({ data: [] })),
      ]);
      // Get actual counts
      setProductCount(productsRes.data?.length || 0);
      setServiceCount(servicesRes.data?.length || 0);
    } catch (error) {
      console.error("Error fetching counts:", error);
      // Don't block rendering if API fails
      setProductCount(0);
      setServiceCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-pink-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
              <span className="text-white font-bold text-5xl">N</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Dual Marketplace
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Shop products like Amazon • Hire services like Fiverr
              <br />
              Everything you need in one place
            </p>

            {!user && (
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/register?role=buyer")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Get Started as Buyer
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/register?role=seller")}
                >
                  Start Selling
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Dual Platform Split */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Marketplace Card */}
            <Card
              className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-500"
              onClick={() => navigate("/products")}
            >
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <ShoppingCart className="text-white" size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-1">Shop Products</h2>
                    <p className="text-muted-foreground">Like Amazon</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Browse thousands of physical products from verified sellers.
                  Add to cart, checkout with Stripe, and get your items delivered.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {productCount}+
                    </div>
                    <div className="text-sm text-muted-foreground">Products</div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      Multiple
                    </div>
                    <div className="text-sm text-muted-foreground">Categories</div>
                  </div>
                </div>

                <Button
                  className="w-full group-hover:bg-blue-600"
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/products");
                  }}
                >
                  Browse Products
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                <div className="mt-4 text-sm text-muted-foreground">
                  ✓ Secure payments • ✓ Fast delivery • ✓ Buyer protection
                </div>
              </CardContent>
            </Card>

            {/* Service Marketplace Card */}
            <Card
              className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-purple-500"
              onClick={() => navigate("/services")}
            >
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Briefcase className="text-white" size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-1">Hire Services</h2>
                    <p className="text-muted-foreground">Like Fiverr</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Find talented freelancers for your projects. Book services,
                  pay securely, and get work delivered on time.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {serviceCount}+
                    </div>
                    <div className="text-sm text-muted-foreground">Services</div>
                  </div>
                  <div className="p-4 bg-pink-50 dark:bg-pink-950 rounded-lg">
                    <div className="text-2xl font-bold text-pink-600">
                      Expert
                    </div>
                    <div className="text-sm text-muted-foreground">Freelancers</div>
                  </div>
                </div>

                <Button
                  className="w-full group-hover:bg-purple-600"
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/services");
                  }}
                >
                  Browse Services
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                <div className="mt-4 text-sm text-muted-foreground">
                  ✓ Verified sellers • ✓ Secure payments • ✓ Quality guarantee
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose Us?</h2>
            <p className="text-xl text-muted-foreground">
              The best of both worlds in one platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="text-blue-600" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Products & Services</h3>
                <p className="text-muted-foreground">
                  Shop physical goods and hire services all in one place
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="text-purple-600" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
                <p className="text-muted-foreground">
                  Stripe-powered checkout for safe and fast transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="text-pink-600" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Trusted Sellers</h3>
                <p className="text-muted-foreground">
                  Verified sellers with ratings and reviews
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-12 text-center">
                <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
                <p className="text-xl mb-8 opacity-90">
                  Join thousands of buyers and sellers on our platform
                </p>
                <div className="flex gap-4 justify-center">
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => navigate("/register?role=buyer")}
                  >
                    Sign Up as Buyer
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-blue-600"
                    onClick={() => navigate("/register?role=seller")}
                  >
                    Become a Seller
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomeDualMarketplace;

