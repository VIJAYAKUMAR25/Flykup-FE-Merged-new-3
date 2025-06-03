import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

export default function ProductImageGallery({ images, title }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Use provided images or placeholder
  const productImages = images?.length ? images : ["/placeholder.svg"];
  const primaryImage = productImages[activeImageIndex];
  
  const handleNext = () => {
    setActiveImageIndex((prev) => (prev + 1) % productImages.length);
  };
  
  const handlePrev = () => {
    setActiveImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productImages.length]);
  
  return (
    <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-xl shadow-md">
      {/* Main Image Container */}
      <div className="relative overflow-hidden rounded-t-xl bg-gradient-to-b from-gray-50 to-white">
        {/* Image Count Indicator */}
        {productImages.length > 1 && (
          <div className="absolute top-4 right-4 z-10 bg-black/60 text-white text-sm py-1 px-3 rounded-full">
            {activeImageIndex + 1} / {productImages.length}
          </div>
        )}
        
        {/* Main Image */}
        <div className="relative aspect-square md:aspect-[4/3] w-full">
          <img
            src={primaryImage}
            alt={title || "Product"}
            className={`w-full h-full object-contain transition-all duration-500 ${
              isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          />
          
          {/* Zoom Icon */}
          <button className="absolute bottom-4 right-4 bg-white/90 hover:bg-black text-gray-700 hover:text-white p-2 rounded-full shadow-lg transition-colors duration-300">
            <ZoomIn size={20} />
          </button>
        </div>
        
        {/* Navigation Arrows */}
        {productImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-black text-gray-700 hover:text-white rounded-full p-2 shadow-lg transition-colors duration-300"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-black text-gray-700 hover:text-white rounded-full p-2 shadow-lg transition-colors duration-300"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>
      
      {/* Thumbnails */}
      {productImages.length > 1 && (
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x scrollbar-thin scrollbar-thumb-gray-300">
            {productImages.map((img, index) => (
              <div
                key={index}
                className={`flex-shrink-0 cursor-pointer transition-all duration-200 snap-start ${
                  activeImageIndex === index
                    ? "ring-2 ring-black ring-offset-1 scale-105"
                    : "opacity-60 hover:opacity-100"
                }`}
                onClick={() => setActiveImageIndex(index)}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden bg-gray-50 border border-gray-200">
                  <img
                    src={img}
                    alt={`Product view ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}