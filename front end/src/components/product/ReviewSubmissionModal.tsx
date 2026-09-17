import React, { useState, useEffect } from 'react';
import { Star, X, Upload, Plus, Minus, Info, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitReview } from '../../utils/api/reviews';
import { uploadImage } from '../../utils/uploadImage';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onSuccess: () => void;
}

const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({ isOpen, onClose, product, onSuccess }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [pros, setPros] = useState<string[]>([]);
  const [proInput, setProInput] = useState('');
  const [cons, setCons] = useState<string[]>([]);
  const [conInput, setConInput] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      for (const file of files) {
        try {
          const uploadedUrl = await uploadImage(file, 'reviews');
          if (uploadedUrl) {
            if (file.type.startsWith('image/')) {
              setImages(prev => [...prev, uploadedUrl]);
            } else if (file.type.startsWith('video/')) {
              setVideos(prev => [...prev, uploadedUrl]);
            }
          }
        } catch (err) {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    }
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };
  const removeVideo = (idx: number) => {
    setVideos(videos.filter((_, i) => i !== idx));
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autosave Draft
  useEffect(() => {
    if (!isOpen) return;
    const draft = localStorage.getItem(`review_draft_${product.id}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setRating(parsed.rating || 0);
        setTitle(parsed.title || '');
        setComment(parsed.comment || '');
        setPros(parsed.pros || []);
        setCons(parsed.cons || []);
        setWouldRecommend(parsed.wouldRecommend);
      } catch (e) {
        // invalid draft
      }
    }
  }, [isOpen, product.id]);

  useEffect(() => {
    if (isOpen) {
      const draft = { rating, title, comment, pros, cons, wouldRecommend };
      localStorage.setItem(`review_draft_${product.id}`, JSON.stringify(draft));
    }
  }, [rating, title, comment, pros, cons, wouldRecommend, isOpen, product.id]);

  const handleAddPro = () => {
    if (proInput.trim() && !pros.includes(proInput.trim())) {
      setPros([...pros, proInput.trim()]);
      setProInput('');
    }
  };

  const handleAddCon = () => {
    if (conInput.trim() && !cons.includes(conInput.trim())) {
      setCons([...cons, conInput.trim()]);
      setConInput('');
    }
  };

  const removePro = (idx: number) => setPros(pros.filter((_, i) => i !== idx));
  const removeCon = (idx: number) => setCons(cons.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }
    if (comment.trim().length < 5) {
      toast.error('Review must be at least 5 characters long');
      return;
    }

    const finalPros = [...pros];
    if (proInput.trim() && !finalPros.includes(proInput.trim())) {
      finalPros.push(proInput.trim());
    }

    const finalCons = [...cons];
    if (conInput.trim() && !finalCons.includes(conInput.trim())) {
      finalCons.push(conInput.trim());
    }

    setIsSubmitting(true);
    try {
      const res = await submitReview({
        productId: product.id,
        customerName: user?.name || guestName.trim() || 'Customer',
        customerEmail: user?.email || guestEmail.trim() || undefined,
        guestName: user?.name || guestName.trim() || 'Customer',
        guestEmail: user?.email || guestEmail.trim() || undefined,
        rating,
        title: title.trim() || 'Product Review',
        comment: comment.trim(),
        pros: finalPros,
        cons: finalCons,
        wouldRecommend: wouldRecommend !== null ? wouldRecommend : true,
        images,
        videos
      });
      if (res?.isFlagged) {
        toast('Your review contains flagged language and was routed to our moderation desk for inspection.', {
          icon: '⚠️',
          duration: 6000
        });
      } else {
        toast.success(res?.message || 'Your verified review has been submitted successfully!');
      }
      localStorage.removeItem(`review_draft_${product.id}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Write a Review</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 :text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          <div className="flex items-center space-x-4 mb-8">
            <img src={product.coverImage} alt={product.title} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-1">{product.title}</h3>
              <p className="text-sm text-gray-500">Rate your experience</p>
            </div>
          </div>

          <form id="review-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Rating */}
            <div className="flex flex-col items-center">
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none transition-transform hover:scale-110"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star 
                      className={`w-10 h-10 ${ star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 ' }`} 
                    />
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm font-medium text-gray-500">
                {rating === 0 ? 'Click to rate' : rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
              </p>
            </div>

            {/* Guest Name & Email if not authenticated */}
            {!user && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 px-4 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
              <input
                type="text"
                placeholder="Summarize your experience"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 px-4 py-2"
              />
            </div>

            {/* Comment */}
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium text-gray-700">Detailed Review <span className="text-red-500">*</span></label>
                <span className={`text-xs ${comment.length < 5 ? 'text-red-500' : 'text-gray-500'}`}>
                  {comment.length}/500
                </span>
              </div>
              <textarea
                required
                rows={4}
                maxLength={500}
                placeholder="What did you like or dislike? What should other buyers know?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 p-4"
              />
            </div>

            {/* Pros and Cons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pros */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pros (Optional)</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={proInput}
                    onChange={(e) => setProInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPro())}
                    className="flex-1 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2"
                    placeholder="Add a pro..."
                  />
                  <button type="button" onClick={handleAddPro} className="p-2 bg-gray-100 hover:bg-gray-200 :bg-gray-700 rounded-lg text-gray-600">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pros.map((pro, idx) => (
                    <span key={idx} className="inline-flex items-center text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
                      {pro}
                      <button type="button" onClick={() => removePro(idx)} className="ml-1 hover:text-green-900 :text-green-200">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Cons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cons (Optional)</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={conInput}
                    onChange={(e) => setConInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCon())}
                    className="flex-1 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2"
                    placeholder="Add a con..."
                  />
                  <button type="button" onClick={handleAddCon} className="p-2 bg-gray-100 hover:bg-gray-200 :bg-gray-700 rounded-lg text-gray-600">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cons.map((con, idx) => (
                    <span key={idx} className="inline-flex items-center text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full">
                      {con}
                      <button type="button" onClick={() => removeCon(idx)} className="ml-1 hover:text-red-900 :text-red-200">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Would you recommend this product?</label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setWouldRecommend(true)}
                  className={`flex-1 py-2 rounded-xl border flex items-center justify-center space-x-2 transition-colors ${ wouldRecommend === true ? 'bg-blue-50 border-blue-500 text-blue-700 ' : 'border-gray-200 text-gray-600 hover:bg-gray-50 :bg-gray-800' }`}
                >
                  <ThumbsUp className="w-4 h-4" /> <span>Yes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWouldRecommend(false)}
                  className={`flex-1 py-2 rounded-xl border flex items-center justify-center space-x-2 transition-colors ${ wouldRecommend === false ? 'bg-red-50 border-red-500 text-red-700 ' : 'border-gray-200 text-gray-600 hover:bg-gray-50 :bg-gray-800' }`}
                >
                  <ThumbsDown className="w-4 h-4" /> <span>No</span>
                </button>
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Media (Optional)</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-500 transition-colors bg-gray-50">
                <div className="space-y-1 text-center w-full">
                  <div className="flex justify-center space-x-4 mb-4">
                    <label className="relative cursor-pointer bg-white border border-gray-300 shadow-sm rounded-lg px-4 py-2 font-medium text-blue-600 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
                      <span className="flex items-center"><Upload className="w-4 h-4 mr-2"/> Add Image</span>
                      <input type="file" className="sr-only" multiple accept="image/*" onChange={handleMediaUpload} />
                    </label>
                    <label className="relative cursor-pointer bg-white border border-gray-300 shadow-sm rounded-lg px-4 py-2 font-medium text-blue-600 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
                      <span className="flex items-center"><Upload className="w-4 h-4 mr-2"/> Add Video</span>
                      <input type="file" className="sr-only" multiple accept="video/*" onChange={handleMediaUpload} />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF, MP4 up to 10MB</p>
                </div>
              </div>
              
              {/* Image and Video Previews */}
              {(images.length > 0 || videos.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-4">
                  {images.map((img, idx) => (
                    <div key={`img-${idx}`} className="relative group">
                      <img src={img} alt="preview" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                      <button 
                        type="button" 
                        onClick={() => removeImage(idx)} 
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-opacity"
                        aria-label="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {videos.map((vid, idx) => (
                    <div key={`vid-${idx}`} className="relative group">
                      <video src={vid} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                          <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-white ml-1"></div>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeVideo(idx)} 
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-opacity"
                        aria-label="Remove video"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 p-3 rounded-lg flex items-start">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Your review helps other creators make better decisions. Fake or abusive reviews will be removed and may result in account suspension.
              </p>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 :bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="review-form"
            disabled={isSubmitting || rating === 0}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReviewSubmissionModal;
