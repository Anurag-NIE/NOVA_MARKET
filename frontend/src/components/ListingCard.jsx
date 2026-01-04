import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ShieldCheck, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

const ListingCard = ({ listing, user, onDelete }) => {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent card click navigation
    
    if (!confirm(`Are you sure you want to delete "${listing.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const productId = listing.id || listing._id;
      
      // Try to delete as product first (most common case)
      // If that fails with 404, try as listing
      try {
        await api.delete(`/products/${productId}`);
      } catch (productError) {
        // If product delete fails with 404, try listing endpoint
        if (productError.response?.status === 404) {
          await api.delete(`/listings/${productId}`);
        } else {
          throw productError; // Re-throw if it's a different error
        }
      }
      
      toast.success("Product deleted successfully");
      if (onDelete) {
        onDelete(productId);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error.response?.data?.detail || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  const isOwner = user && user.role === "seller" && listing && user.id === listing.seller_id;

  return (
    <Card
      className="group rounded-xl overflow-hidden border bg-card hover:shadow-md transition-shadow duration-200 cursor-pointer relative"
      onClick={() => navigate(`/listing/${listing.id}`)}
      data-testid="listing-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={listing.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="absolute right-2 top-2 flex gap-2 items-start">
          {listing.verified && (
            <ShieldCheck
              className="text-emerald-500"
              size={20}
              aria-label="Verified seller"
            />
          )}
          {isOwner && (
            <Button
              variant="destructive"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete product"
            >
              {deleting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </Button>
          )}
        </div>
      </div>
      <CardHeader className="p-3">
        <div className="text-sm font-medium line-clamp-2" title={listing.title}>
          {listing.title}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">${listing.price.toFixed(2)}</div>
          {listing.rating > 0 && (
            <div className="flex items-center gap-1 text-amber-500" aria-label="rating">
              <Star size={14} fill="currentColor" />
              <span className="text-xs text-foreground/70">{listing.rating}</span>
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">By {listing.seller_name}</div>
      </CardContent>
      <CardFooter className="px-3 pb-3 flex justify-between items-center">
        <Badge variant="secondary" className="text-xs">{listing.category}</Badge>
        <Badge variant="outline" className="text-xs capitalize">{listing.type}</Badge>
      </CardFooter>
    </Card>
  );
};

export default ListingCard;