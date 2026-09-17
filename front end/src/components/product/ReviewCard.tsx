import React, { useState } from 'react';
import { Star, CheckCircle, ThumbsUp, ThumbsDown, MoreVertical, Flag, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReviewCardProps {
  review: any;
  onVote: (id: string, type: 'helpful' | 'notHelpful') => void;
  onReport: (id: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onVote, onReport }) => {
  const [expanded, setExpanded] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showImages, setShowImages] = useState(false);

  const isLongText = review.comment.length > 250;
  const displayText = expanded ? review.comment : `${review.comment.substring(0, 250)}${isLongText ? '...' : ''}`;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 '}`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="py-6 border-b border-gray-100  last:border-0">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
            {review.customerName ? review.customerName.charAt(0).toUpperCase() : 'U'}
          </div>
          
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h4 className="font-semibold text-gray-900 ">
                {review.customerName}
              </h4>
              {review.verifiedPurchase && (
                <span className="inline-flex items-center text-xs text-green-600 bg-green-50   px-2 py-0.5 rounded-full font-medium">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified Purchase
                </span>
              )}
              {review.versionPurchased && (
                <span className="text-xs text-gray-500 bg-gray-100  px-2 py-0.5 rounded-full">
                  {review.versionPurchased}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex">{renderStars(review.rating)}</div>
              <span className="text-sm text-gray-500">• {formatDate(review.createdAt)}</span>
              {review.isEdited && <span className="text-xs text-gray-400 italic">(Edited)</span>}
            </div>
          </div>
        </div>

        {/* Options Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="p-1.5 text-gray-400 hover:text-gray-600  rounded-full hover:bg-gray-100  transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          <AnimatePresence>
            {showOptions && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 mt-2 w-36 bg-white  rounded-lg shadow-lg border border-gray-100  z-10 py-1"
              >
                <button 
                  onClick={() => { setShowOptions(false); onReport(review.id || review._id); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <Flag className="w-4 h-4 mr-2" /> Report
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {review.title && (
        <h5 className="font-semibold text-lg text-gray-900 mt-4">
          {review.title}
        </h5>
      )}

      {/* Comment Body */}
      <p className="text-gray-700 mt-2 leading-relaxed whitespace-pre-line text-sm">
        {displayText}
      </p>

      {isLongText && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-primary text-sm font-semibold mt-2 inline-flex items-center hover:underline"
        >
          {expanded ? (
            <>Read Less <ChevronUp className="w-4 h-4 ml-1" /></>
          ) : (
            <>Read More <ChevronDown className="w-4 h-4 ml-1" /></>
          )}
        </button>
      )}

      {/* Pros and Cons */}
      {(review.pros || review.cons) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-gray-50 p-4 rounded-xl">
          {review.pros && (
            <div>
              <span className="text-xs font-bold text-green-700 uppercase tracking-wider block mb-1">Pros</span>
              <p className="text-sm text-gray-700">{review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div>
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider block mb-1">Cons</span>
              <p className="text-sm text-gray-700">{review.cons}</p>
            </div>
          )}
        </div>
      )}

      {/* Images and Videos */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {review.images.map((img: string, index: number) => (
            <img 
              key={index} 
              src={img} 
              alt="Review attachment" 
              className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90"
              onClick={() => window.open(img, '_blank')}
            />
          ))}
        </div>
      )}

      {/* Card Actions (Helpful, Not Helpful, Share) */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Was this review helpful?</span>
          <button 
            onClick={() => onVote(review.id || review._id, 'helpful')}
            className="flex items-center text-sm text-gray-600 hover:text-primary transition-colors"
          >
            <ThumbsUp className="w-4 h-4 mr-1.5" /> {review.helpfulVotes || 0}
          </button>
          <button 
            onClick={() => onVote(review.id || review._id, 'notHelpful')}
            className="flex items-center text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            <ThumbsDown className="w-4 h-4 mr-1.5" /> {review.notHelpfulVotes || 0}
          </button>
        </div>
        
        {review.wouldRecommend !== undefined && (
          <div className="text-sm text-gray-500 flex items-center bg-gray-50  px-3 py-1 rounded-full">
            {review.wouldRecommend ? (
              <><ThumbsUp className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Recommends this</>
            ) : (
              <><ThumbsDown className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Does not recommend</>
            )}
          </div>
        )}
      </div>

      {/* Official Staff / Creator Reply */}
      {((review.replies && review.replies.length > 0) || (review.creatorReply && review.creatorReply.text)) && (
        <div className="mt-4 ml-4 sm:ml-6 p-4 bg-blue-50/60 rounded-2xl border-l-4 border-blue-600 space-y-3">
          {review.replies && review.replies.length > 0 ? (
            review.replies.map((rep: any) => (
              <div key={rep.id || rep._id}>
                <div className="flex items-center justify-between mb-1.5">
                  <h6 className="font-bold text-xs text-blue-950 flex items-center">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2 text-[10px] font-bold">K</span>
                    {rep.authorName || 'KDW Official Support'}
                    <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">Official Response</span>
                  </h6>
                  <span className="text-[11px] text-slate-500">{formatDate(rep.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {rep.body}
                </p>
              </div>
            ))
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h6 className="font-bold text-xs text-blue-950 flex items-center">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2 text-[10px] font-bold">K</span>
                  {review.creatorReply.authorName || 'KDW Official Support'}
                  <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">Official Response</span>
                </h6>
                <span className="text-[11px] text-slate-500">{formatDate(review.creatorReply.repliedAt)}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {review.creatorReply.text}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
