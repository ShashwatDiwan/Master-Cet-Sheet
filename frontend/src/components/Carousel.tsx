import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CarouselProps {
  images: string[];
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  ariaLabel?: string;
  itemsPerView?: number;
  itemsPerViewMobile?: number;
  gap?: number;
}

const Carousel: React.FC<CarouselProps> = ({
  images,
  autoPlayInterval = 3500,
  showDots = true,
  showArrows = true,
  ariaLabel = 'carousel',
  itemsPerView = 3,
  itemsPerViewMobile = 2,
  gap = 16,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [itemsToShow, setItemsToShow] = useState(itemsPerView);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const slides = images.filter(Boolean);
  const totalSlides = slides.length;
  const baseLen = totalSlides;
  const startIndex = baseLen; // middle block start index for 3x cloning
  const extendedSlides = baseLen > 0 ? [...slides, ...slides, ...slides] : [];
  const [isInstant, setIsInstant] = useState(false);

  // Responsive items per view
  useEffect(() => {
    const handleResize = () => {
      setItemsToShow(window.innerWidth <= 768 ? itemsPerViewMobile : itemsPerView);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerView, itemsPerViewMobile]);

  // Ensure index starts in middle block whenever slides change
  useEffect(() => {
    if (baseLen > 0) {
      setCurrentIndex(startIndex);
    }
  }, [baseLen]);

  // Auto-play functionality (infinite, item-by-item)
  useEffect(() => {
    if (baseLen === 0 || isHovered) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, autoPlayInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [baseLen, autoPlayInterval, isHovered]);

  const goToSlide = (index: number) => {
    // Map dot index to middle block
    setCurrentIndex(startIndex + index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => prev - 1);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  if (totalSlides === 0) {
    return (
      <div className="w-full p-6 text-center">
        <p className="text-zinc-400 text-sm">No images to display</p>
      </div>
    );
  }

  // Calculate visible slides based on current index
  const getVisibleSlides = () => {
    const visible = [];
    for (let i = 0; i < itemsToShow; i++) {
      const slideIndex = (currentIndex + i) % totalSlides;
      visible.push({
        src: slides[slideIndex],
        index: slideIndex,
        position: i
      });
    }
    return visible;
  };

  const visibleSlides = getVisibleSlides();

  return (
    <div
      className="relative w-full"
      aria-label={ariaLabel}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main carousel container - infinite loop sliding track */}
      <div className="overflow-hidden">
        <motion.div
          className="flex items-stretch"
          style={{ gap: `${gap}px` }}
          animate={{ x: `-${(100 / itemsToShow) * currentIndex}%` }}
          transition={isInstant ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 30 }}
          onUpdate={() => {
            // no-op
          }}
          onAnimationComplete={() => {
            // If we've moved outside the middle block, jump back instantly
            if (currentIndex >= startIndex + baseLen) {
              setIsInstant(true);
              setCurrentIndex(currentIndex - baseLen);
            } else if (currentIndex < startIndex) {
              setIsInstant(true);
              setCurrentIndex(currentIndex + baseLen);
            } else if (isInstant) {
              // turn animations back on after instant correction render
              setTimeout(() => setIsInstant(false), 0);
            }
          }}
        >
          {extendedSlides.map((src, idx) => (
            <div
              key={`${idx}-${src}`}
              style={{ flex: `0 0 ${100 / itemsToShow}%` }}
              className="shrink-0"
            >
              <motion.div
                className="rounded-2xl overflow-hidden shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-shadow duration-300"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 340, damping: 20 }}
              >
                <img
                  src={src}
                  alt={`Slide ${((idx % baseLen) + 1)}`}
                  className="block w-full h-auto"
                  style={{
                    maxHeight: '280px',
                    objectFit: 'contain'
                  }}
                  loading={idx === currentIndex ? 'eager' : 'lazy'}
                />
              </motion.div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Navigation arrows */}
      {showArrows && totalSlides > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-20 bg-zinc-900/40 backdrop-blur-md hover:bg-zinc-900/60 text-white w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-white/10"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-20 bg-zinc-900/40 backdrop-blur-md hover:bg-zinc-900/60 text-white w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-white/10"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots indicator */}
      {showDots && baseLen > 1 && (
        <div className="flex items-center justify-center mt-6">
          <div className="flex items-center gap-3 px-3 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-inner">
            {Array.from({ length: baseLen }).map((_, index) => (
              <motion.button
                key={index}
                onClick={() => goToSlide(index)}
                className={`rounded-full transition-colors ${
                  ((currentIndex - startIndex + baseLen) % baseLen) === index ? 'bg-blue-500' : 'bg-zinc-400/70 hover:bg-zinc-300'
                }`}
                style={{ height: 10, width: ((currentIndex - startIndex + baseLen) % baseLen) === index ? 22 : 10 }}
                aria-label={`Go to slide ${index + 1}`}
                whileTap={{ scale: 0.9 }}
                animate={{
                  width: ((currentIndex - startIndex + baseLen) % baseLen) === index ? 22 : 10,
                  opacity: 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Carousel;
