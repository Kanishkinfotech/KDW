import { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, X } from 'lucide-react';

interface ProductGalleryProps {
  title: string;
  coverImage: string;
  images?: string[];
}

export default function ProductGallery({ title, coverImage, images = [] }: ProductGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const galleryItems = [coverImage, ...images].filter(Boolean);
  while (galleryItems.length < 4) {
    galleryItems.push(null as any);
  }

  return (
    <>
      <div className="rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl p-3 border border-slate-200/60 shadow-sm">
        <div className="relative group block overflow-hidden rounded-2xl bg-slate-50">
          <button 
            onClick={() => { if(galleryItems[currentImageIndex]) setIsLightboxOpen(true); }}
            className="w-full relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="View fullscreen image"
          >
            {galleryItems[currentImageIndex] ? (
              <img 
                src={galleryItems[currentImageIndex]} 
                alt={`${title} preview ${currentImageIndex + 1}`} 
                loading="eager" 
                className="w-full aspect-[4/3] sm:aspect-video object-cover transition-transform duration-700 group-hover:scale-[1.05] cursor-zoom-in" 
              />
            ) : (
              <div className="w-full aspect-[4/3] sm:aspect-video border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center opacity-60">
                <ImageIcon size={48} className="text-slate-700 mb-2" />
                <span className="text-slate-600 font-medium tracking-wide text-sm">Empty Slot</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center pointer-events-none">
            </div>
          </button>

          {/* Slider Arrows */}
          <button 
            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === 0 ? galleryItems.length - 1 : prev - 1); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:scale-110 active:scale-95"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev + 1) % galleryItems.length); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:scale-110 active:scale-95"
            aria-label="Next image"
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>
        
        {/* Gallery Thumbnails */}
        <div className="flex gap-3 mt-3 overflow-x-auto hide-scrollbar pb-1">
          {galleryItems.map((imgUrl, index) => {
            return imgUrl ? (
              <button 
                key={index} 
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-24 sm:w-28 aspect-video rounded-xl overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${currentImageIndex === index ? 'border-primary ring-2 ring-primary/20 ring-offset-1' : 'border-transparent opacity-50 hover:opacity-100 bg-slate-100'}`} 
                aria-label={`View image ${index + 1}`}
              >
                <img src={imgUrl} alt={`Thumbnail ${index + 1}`} loading="lazy" className="w-full h-full object-cover" />
              </button>
            ) : (
              <button 
                key={index} 
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-24 sm:w-28 aspect-video rounded-xl overflow-hidden border-2 border-dashed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${currentImageIndex === index ? 'border-primary bg-primary/5 opacity-100 ring-2 ring-primary/20 ring-offset-1' : 'border-slate-200 bg-slate-50 opacity-50 hover:opacity-100'}`} 
                aria-label={`Empty image slot ${index + 1}`}
              >
                <ImageIcon size={20} className={`mx-auto ${currentImageIndex === index ? 'text-primary' : 'text-slate-600'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-md animate-in fade-in duration-300 p-4 sm:p-8" onClick={() => setIsLightboxOpen(false)}>
          <button 
            className="absolute top-6 right-6 text-slate-900/70 hover:text-slate-900 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all hover:scale-110 active:scale-95"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close fullscreen"
          >
            <X size={24} />
          </button>
          <img 
            src={galleryItems[currentImageIndex] || coverImage} 
            alt="Fullscreen preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </>
  );
}
