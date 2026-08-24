import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Star, Verified, Filter } from 'lucide-react';
import SEO from '../components/SEO';

interface Review {
  _id: string;
  customerName: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  verifiedPurchase: boolean;
  product?: {
    name: string;
    slug: string;
  };
}

export default function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await axios.get('/api/reviews/testimonials');
        if (response.data.success) {
          setReviews(response.data.data);
        }
      } catch (error) {
        console.error('Failed to load testimonials:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'text-warning fill-warning' : 'text-slate-300'}
      />
    ));
  };

  return (
    <div className="min-h-screen py-16 px-6 bg-slate-50/50 pb-24">
      <SEO title="Customer Testimonials | Kanishk Digital World" description="See what our customers are saying about our digital products." />
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">What Customers Say</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            We take pride in providing digital assets that deliver real results. Here is what the KDW community has to say.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="max-w-3xl mx-auto bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Star size={40} className="fill-primary/20" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Customer stories are coming soon.</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              After purchasing a KDW product, customers can share their experience and help others choose the right resource.
            </p>
            <Link to="/shop" className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col h-full">
                <div className="flex items-center gap-1 mb-6">
                  {renderStars(review.rating)}
                </div>
                {review.title && <h3 className="font-bold text-slate-900 text-lg mb-2">{review.title}</h3>}
                <p className="text-slate-600 mb-8 flex-1 italic leading-relaxed">"{review.comment}"</p>
                
                <div className="mt-auto pt-6 border-t border-slate-100 flex justify-between items-end">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      {review.customerName}
                      {review.verifiedPurchase && <Verified size={16} className="text-success" />}
                    </div>
                    {review.product && (
                      <Link to={`/product/${review.product.slug}`} className="text-xs text-primary font-medium hover:underline mt-1 block">
                        {review.product.name}
                      </Link>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
