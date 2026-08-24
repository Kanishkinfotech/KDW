import React from 'react';
import { Filter, CheckCircle, Image as ImageIcon, Video, Star } from 'lucide-react';

interface ReviewFiltersProps {
  filters: {
    verified: boolean;
    withImages: boolean;
    withVideos: boolean;
    sort: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
}

const ReviewFilters: React.FC<ReviewFiltersProps> = ({ filters, setFilters }) => {
  const toggleFilter = (key: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 border-b border-gray-100  gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-medium text-gray-500 mr-2 flex items-center">
          <Filter className="w-4 h-4 mr-1" /> Filters:
        </div>
        
        <button
          onClick={() => toggleFilter('verified')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center border ${
            filters.verified 
              ? 'bg-blue-50 text-blue-700 border-blue-200   ' 
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50    '
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
          Verified Purchases
        </button>
        
        <button
          onClick={() => toggleFilter('withImages')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center border ${
            filters.withImages 
              ? 'bg-purple-50 text-purple-700 border-purple-200   ' 
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50    '
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
          With Images
        </button>

        <button
          onClick={() => toggleFilter('withVideos')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center border ${
            filters.withVideos 
              ? 'bg-red-50 text-red-700 border-red-200   ' 
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50    '
          }`}
        >
          <Video className="w-3.5 h-3.5 mr-1.5" />
          With Videos
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-sm text-gray-500 whitespace-nowrap">Sort by:</label>
        <select
          value={filters.sort}
          onChange={(e) => setFilters((prev: any) => ({ ...prev, sort: e.target.value }))}
          className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2    "
        >
          <option value="newest">Newest First</option>
          <option value="helpful">Most Helpful</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
    </div>
  );
};

export default ReviewFilters;
