import React from 'react';
import { Star, CheckCircle, ThumbsUp, Download } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReviewSummaryProps {
  summary: {
    total: number;
    histogram: { [key: number]: number };
    verifiedPercentage: number;
    recommendPercentage: number;
  };
  averageRating: number;
  totalDownloads: number;
  onFilterChange: (rating: number | null) => void;
  activeFilter: number | null;
}

const ReviewSummary: React.FC<ReviewSummaryProps> = ({ summary, averageRating, totalDownloads, onFilterChange, activeFilter }) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 '}`}
      />
    ));
  };

  return (
    <div className="bg-white  rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 ">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Overall Rating Section */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center space-y-2 border-b md:border-b-0 md:border-r border-gray-100  pb-6 md:pb-0">
          <div className="text-6xl font-bold text-gray-900 ">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex space-x-1 justify-center">
            {renderStars(averageRating)}
          </div>
          <p className="text-sm text-gray-500 ">
            Based on {summary.total} reviews
          </p>
        </div>

        {/* Histogram Section */}
        <div className="md:col-span-5 space-y-3">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.histogram[star] || 0;
            const percentage = summary.total > 0 ? (count / summary.total) * 100 : 0;
            const isActive = activeFilter === star;

            return (
              <button
                key={star}
                onClick={() => onFilterChange(isActive ? null : star)}
                className={`flex items-center w-full group transition-opacity ${isActive ? 'opacity-100' : activeFilter ? 'opacity-50' : 'opacity-100 hover:opacity-80'}`}
              >
                <div className="flex items-center w-24 text-sm font-medium text-gray-600 ">
                  {star} <Star className="w-4 h-4 ml-1 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 h-2.5 mx-4 bg-gray-100  rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-yellow-400 rounded-full"
                  />
                </div>
                <div className="w-12 text-right text-xs text-gray-500 ">
                  {Math.round(percentage)}%
                </div>
              </button>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="md:col-span-3 flex flex-col space-y-4">
          <div className="flex items-center space-x-3 text-sm text-gray-700 ">
            <div className="w-8 h-8 rounded-full bg-green-50  flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="font-semibold">{summary.verifiedPercentage}%</p>
              <p className="text-xs text-gray-500">Verified Purchases</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-700 ">
            <div className="w-8 h-8 rounded-full bg-blue-50  flex items-center justify-center">
              <ThumbsUp className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold">{summary.recommendPercentage}%</p>
              <p className="text-xs text-gray-500">Would Recommend</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-700 ">
            <div className="w-8 h-8 rounded-full bg-purple-50  flex items-center justify-center">
              <Download className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="font-semibold">{totalDownloads.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Downloads</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;
