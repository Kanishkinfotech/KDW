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
                  onClick={() => { setShowOptions(false); onReport(review._id); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50  flex items-center"
                >
                  <Flag className="w-4 h-4 mr-2" /> Report
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {review.title && (
        <h5 className="font-semibold text-lg text-gray-900  mt-4">
          {review.title}
        </h5>
      )}

      <div className="mt-2 text-gray-700  leading-relaxed">
        {displayText}
        {isLongText && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="ml-2 font-medium text-blue-600 hover:text-blue-700   inline-flex items-center"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Pros & Cons */}
      {(review.pros?.length > 0 || review.cons?.length > 0) && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {review.pros?.length > 0 && (
            <div className="bg-green-50/50  rounded-lg p-3 border border-green-100 ">
              <h6 className="text-sm font-semibold text-green-700  mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1.5" /> Pros
              </h6>
              <ul className="list-disc list-inside text-sm text-gray-600  space-y-1">
                {review.pros.map((pro: string, idx: number) => (
                  <li key={idx}>{pro}</li>
                ))}
              </ul>
            </div>
          )}
          {review.cons?.length > 0 && (
            <div className="bg-red-50/50  rounded-lg p-3 border border-red-100 ">
              <h6 className="text-sm font-semibold text-red-700  mb-2 flex items-center">
                <div className="w-4 h-4 mr-1.5 flex items-center justify-center font-bold">-</div> Cons
              </h6>
              <ul className="list-disc list-inside text-sm text-gray-600  space-y-1">
                {review.cons.map((con: string, idx: number) => (
                  <li key={idx}>{con}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Images/Videos */}
      {(review.images?.length > 0 || review.videos?.length > 0) && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {review.images?.map((img: string, idx: number) => (
            <div key={`img-${idx}`} className="relative group rounded-lg overflow-hidden border border-gray-200  cursor-pointer w-20 h-20">
              <img src={img} alt={`Review ${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
            </div>
          ))}
          {review.videos?.map((vid: string, idx: number) => (
            <div key={`vid-${idx}`} className="relative group rounded-lg overflow-hidden border border-gray-200  cursor-pointer w-32 h-20 bg-black">
              <video src={vid} controls className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Footer / Actions */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-500">Helpful?</span>
          <button 
            onClick={() => onVote(review._id, 'helpful')}
            className="flex items-center text-sm text-gray-600 hover:text-blue-600   transition-colors"
          >
            <ThumbsUp className="w-4 h-4 mr-1.5" /> {review.helpfulVotes || 0}
          </button>
          <button 
            onClick={() => onVote(review._id, 'notHelpful')}
            className="flex items-center text-sm text-gray-600 hover:text-red-600   transition-colors"
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

      {/* Creator Reply */}
      {review.creatorReply && review.creatorReply.text && (
        <div className="mt-4 ml-6 p-4 bg-blue-50/50  rounded-xl border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <h6 className="font-semibold text-sm text-gray-900  flex items-center">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-xs">C</span>
              Creator Response
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Official</span>
            </h6>
            <span className="text-xs text-gray-500">{formatDate(review.creatorReply.repliedAt)}</span>
          </div>
          <p className="text-sm text-gray-700 ">
            {review.creatorReply.text}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
