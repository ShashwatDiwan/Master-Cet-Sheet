import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BookOpen, Target, TrendingUp, FileText, GraduationCap, Zap } from 'lucide-react';

interface CarouselSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
  bgGradient: string;
}

const slides: CarouselSlide[] = [
  {
    icon: <Target className="w-8 h-8" />,
    title: 'Track Your Progress',
    description: 'Monitor chapter-wise completion for Physics, Chemistry, and Maths with real-time progress tracking.',
    accentColor: 'text-blue-400',
    bgGradient: 'from-blue-500/15 to-blue-600/5',
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: 'Handwritten Notes',
    description: 'Access high-quality handwritten notes, short notes, and formula booklets for every chapter.',
    accentColor: 'text-emerald-400',
    bgGradient: 'from-emerald-500/15 to-emerald-600/5',
  },
  {
    icon: <BookOpen className="w-8 h-8" />,
    title: 'Previous Year Questions',
    description: 'Practice with curated PYQs organized chapter-wise to boost your exam confidence.',
    accentColor: 'text-amber-400',
    bgGradient: 'from-amber-500/15 to-amber-600/5',
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: 'Weightage Analysis',
    description: 'Know the importance of each chapter with detailed weightage percentages for smart preparation.',
    accentColor: 'text-rose-400',
    bgGradient: 'from-rose-500/15 to-rose-600/5',
  },
  {
    icon: <GraduationCap className="w-8 h-8" />,
    title: 'Revision Mode',
    description: 'Star chapters for quick revision and keep track of what needs another pass before exam day.',
    accentColor: 'text-violet-400',
    bgGradient: 'from-violet-500/15 to-violet-600/5',
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: 'All Subjects Covered',
    description: 'Complete coverage of Physics, Chemistry, and Mathematics with 50+ chapters in total.',
    accentColor: 'text-cyan-400',
    bgGradient: 'from-cyan-500/15 to-cyan-600/5',
  },
];

interface ContentCarouselProps {
  autoPlayInterval?: number;
  ariaLabel?: string;
}

const ContentCarousel: React.FC<ContentCarouselProps> = ({
  autoPlayInterval = 4000,
  ariaLabel = 'Feature highlights carousel',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSlides = slides.length;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto-play
  useEffect(() => {
    if (isHovered) return;
    timerRef.current = setInterval(goToNext, autoPlayInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered, autoPlayInterval, goToNext]);

  // Visible slides: show 1 on mobile, 3 on desktop
  const getVisibleCount = () => {
    if (typeof window === 'undefined') return 3;
    return window.innerWidth < 768 ? 1 : 3;
  };

  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount());
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getVisibleSlides = () => {
    const visible: { slide: CarouselSlide; index: number }[] = [];
    for (let i = 0; i < visibleCount; i++) {
      const idx = (currentIndex + i) % totalSlides;
      visible.push({ slide: slides[idx], index: idx });
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
      {/* Slide container */}
      <div className="flex gap-4">
        {visibleSlides.map(({ slide, index }) => (
          <div
            key={`${index}-${slide.title}`}
            className="flex-1 min-w-0"
            style={{ flex: `0 0 calc(${100 / visibleCount}% - ${((visibleCount - 1) * 16) / visibleCount}px)` }}
          >
            <div
              className={`relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${slide.bgGradient} p-5 sm:p-6 h-full transition-all duration-300 hover:border-border hover:shadow-lg`}
            >
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-foreground/[0.03] to-transparent rounded-bl-full" />

              <div className="relative z-10 flex flex-col gap-3">
                <div className={`${slide.accentColor} flex-shrink-0`}>
                  {slide.icon}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground leading-tight text-balance">
                  {slide.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {slide.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 sm:-translate-x-5 z-20 bg-background/60 backdrop-blur-md hover:bg-background/80 text-foreground w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
        aria-label="Previous slide"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={goToNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 sm:translate-x-5 z-20 bg-background/60 backdrop-blur-md hover:bg-background/80 text-foreground w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
        aria-label="Next slide"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots indicator */}
      <div className="flex items-center justify-center mt-5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 backdrop-blur-md border border-border/30">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-primary w-5 h-2.5'
                  : 'bg-muted-foreground/40 hover:bg-muted-foreground/60 w-2.5 h-2.5'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContentCarousel;
