import React, { useState, useEffect } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'product' | 'bundle' | 'category' | 'generic';
  fallbackSrc?: string;
  wrapperClassName?: string;
}

const FALLBACK_MAP = {
  product: '/images/fallback/product.png',
  bundle: '/images/fallback/bundle.png',
  category: '/images/fallback/category.png',
  generic: '/images/fallback/image-unavailable.png',
};

export default function SafeImage({
  src,
  alt,
  fallbackType = 'generic',
  fallbackSrc,
  className = '',
  wrapperClassName = '',
  onError,
  ...props
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);
  const [hasError, setHasError] = useState(false);
  const [fallbackLevel, setFallbackLevel] = useState(0);

  // Sync src changes from parent
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
    setFallbackLevel(0);
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // If the image fails, we try the specified fallback or type-based fallback.
    // If that fails, we try the generic fallback.
    // If that fails, we stop to prevent infinite loops.
    
    if (fallbackLevel === 0) {
      setImgSrc(fallbackSrc || FALLBACK_MAP[fallbackType]);
      setFallbackLevel(1);
    } else if (fallbackLevel === 1) {
      setImgSrc(FALLBACK_MAP.generic);
      setFallbackLevel(2);
    } else {
      setHasError(true);
    }

    // Call original onError if provided
    if (onError) {
      onError(e);
    }
  };

  // If even the generic fallback fails, render a placeholder div to preserve layout
  if (hasError) {
    return (
      <div 
        className={`bg-slate-100 flex items-center justify-center text-slate-400 text-sm p-4 text-center ${className} ${wrapperClassName}`}
        {...props as any}
      >
        <span className="truncate max-w-full">{alt || 'Image unavailable'}</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc || FALLBACK_MAP[fallbackType]}
      alt={alt || 'Image'}
      className={className}
      onError={handleError}
      loading={props.loading || 'lazy'}
      data-no-fallback={hasError ? 'true' : undefined} // Signal to global listener that we already handled it
      {...props}
    />
  );
}
