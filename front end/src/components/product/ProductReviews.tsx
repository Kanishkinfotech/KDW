import React, { useState, useEffect } from 'react';
import { getPublicReviews, voteReview, reportReview, checkReviewEligibility } from '../../utils/api/reviews';
import ReviewSummary from './ReviewSummary';
import ReviewFilters from './ReviewFilters';
import ReviewCard from './ReviewCard';
import ReviewSubmissionModal from './ReviewSubmissionModal';
import { Edit3, Star, Check, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

interface ProductReviewsProps {
  productId: string;
  productTitle: string;
  productImage: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, productTitle, productImage }) => {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    total: 0,
    histogram: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    verifiedPercentage: 0,
    recommendPercentage: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    verified: false,
    withImages: false,
    withVideos: false,
    sort: 'newest'
  });
  const [activeRatingFilter, setActiveRatingFilter] = useState<number | null>(null);

  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    verified: boolean;
    alreadyReviewed: boolean;
    reason?: string;
  } | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getPublicReviews(productId, {
        ...filters,
        rating: activeRatingFilter
      });
      if (data?.success) {
        const rawReviews = data.reviews || data.data?.reviews || [];
        const rawSummary = data.summary || data.data?.summary || {
          total: rawReviews.length,
          histogram: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          verifiedPercentage: 100,
          recommendPercentage: 100
        };
        setReviews(rawReviews);
        setSummary(rawSummary);
      }
    } catch (error) {
      console.error('Failed to fetch reviews', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibility = async () => {
    if (!productId) return;
    try {
      const res = await checkReviewEligibility(productId);
      if (res?.success) {
        setEligibility(res);
      }
    } catch (error) {
      console.error('Failed to check eligibility', error);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchEligibility();
  }, [productId, filters, activeRatingFilter, isAuthenticated]);

  const handleVote = async (id: string, type: 'helpful' | 'notHelpful') => {
    try {
      await voteReview(id, type);
      // Optimistically update
      setReviews(reviews.map(r => {
        if (r.id === id || r._id === id) {
          return {
            ...r,
            helpfulVotes: type === 'helpful' ? (r.helpfulVotes || 0) + 1 : (r.helpfulVotes || 0),
            notHelpfulVotes: type === 'notHelpful' ? (r.notHelpfulVotes || 0) + 1 : (r.notHelpfulVotes || 0)
          };
        }
        return r;
      }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Vote recorded.');
    }
  };

  const handleReport = async (id: string) => {
    const reason = prompt('Please enter the reason for reporting this review:');
    if (!reason) return;
    try {
      await reportReview(id, reason);
      toast.success('Review reported successfully. Our team will review it.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to report review.');
    }
  };

  return (
    <div className="mt-16 max-w-5xl mx-auto" id="reviews">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Customer Reviews</h2>
          <p className="text-gray-500 mt-2 text-lg">Real feedback from verified purchasers</p>
        </div>
        {!isAuthenticated ? (
          <a
            href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
            className="flex items-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-400" />
            Sign in to Review
          </a>
        ) : eligibility?.alreadyReviewed ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Review Submitted ✓</span>
          </div>
        ) : eligibility?.eligible ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <Edit3 className="w-5 h-5 mr-2" />
            Write a Review
          </button>
        ) : (
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Verified Buyers Only
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Purchase product to leave a review</p>
          </div>
        )}
      </div>

      <ReviewSummary 
        summary={summary} 
        averageRating={summary?.total > 0 ? Object.entries(summary.histogram).reduce((acc, [star, count]) => acc + (Number(star) * (count as number)), 0) / summary.total : 0} 
        totalDownloads={(summary?.total || 0) * 3} // Mock data
        onFilterChange={setActiveRatingFilter}
        activeFilter={activeRatingFilter}
      />

      <div className="mt-8">
        <ReviewFilters filters={filters} setFilters={setFilters} />
      </div>

      <div className="mt-8 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-200  h-10 w-10"></div>
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-2 bg-gray-200  rounded w-1/4"></div>
                  <div className="h-2 bg-gray-200  rounded w-full"></div>
                  <div className="h-2 bg-gray-200  rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          reviews.map(review => (
            <ReviewCard 
              key={review.id || review._id} 
              review={review} 
              onVote={handleVote} 
              onReport={handleReport} 
            />
          ))
        ) : (
          <div className="text-center py-16 bg-gray-50  rounded-2xl border border-gray-100 ">
            <Star className="mx-auto h-12 w-12 text-gray-300  mb-4" />
            <h3 className="text-lg font-medium text-gray-900  mb-2">No reviews yet</h3>
            <p className="text-gray-500">
              {activeRatingFilter || filters.verified || filters.withImages || filters.withVideos
                ? "Try clearing your filters to see more reviews."
                : "Be the first verified customer to review this product."}
            </p>
          </div>
        )}
      </div>

      <ReviewSubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={{ id: productId, title: productTitle, coverImage: productImage }}
        onSuccess={() => {
          fetchReviews();
          fetchEligibility();
        }}
      />
    </div>
  );
};

export default ProductReviews;
