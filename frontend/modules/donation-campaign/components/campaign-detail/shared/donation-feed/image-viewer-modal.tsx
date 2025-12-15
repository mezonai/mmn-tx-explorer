'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBreakpoint } from '@/hooks';
import { EBreakpoint } from '@/enums';
import { ipfsServiceURL } from '@/service';

const MIN_SWIPE_DISTANCE = 50;
const CONTROL_AUTO_HIDE_DELAY = 2000;

interface ImageViewerModalProps {
  isOpen: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export const ImageViewerModal = ({ isOpen, images, initialIndex, onClose }: ImageViewerModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showControls, setShowControls] = useState(false);

  const isMobile = !(useBreakpoint(EBreakpoint.MD) ?? true);
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, images]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleClose = () => {
    setShowControls(false);
    onClose();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;

    const distance = touchStart - touchEnd;

    if (distance > MIN_SWIPE_DISTANCE) {
      goToNext();
    } else if (distance < -MIN_SWIPE_DISTANCE) {
      goToPrev();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const toggleControls = () => {
    if (isMobile) {
      setShowControls((prev) => !prev);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          goToNext();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'Escape':
          handleClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      if (isMobile) {
        setShowControls(true);
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (!isOpen || !isMobile || !showControls) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, CONTROL_AUTO_HIDE_DELAY);

    return () => clearTimeout(timer);
  }, [isOpen, isMobile, showControls, currentIndex]);

  const hasMultipleImages = images.length > 1;
  const navigationButtonClasses = `absolute top-1/2 z-50 h-12 w-12 -translate-y-1/2 rounded-full p-2 text-black transition-all duration-300 md:pointer-events-auto md:opacity-100 ${
    showControls ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
  }`;

  if (!isOpen || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-full items-center justify-center bg-black" onClick={handleClose}>
      <Button
        onClick={handleClose}
        variant="secondary"
        className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full p-2 text-black transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </Button>

      {hasMultipleImages && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          variant="secondary"
          className={`${navigationButtonClasses} left-2 md:left-4`}
          aria-label="Previous image"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      )}

      <div
        className="relative flex max-h-[100vh] max-w-[90vw] items-center justify-center overflow-hidden"
        onClick={(e) => {
          e.stopPropagation();
          toggleControls();
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative h-[90vh] w-[90vw]">
          {images.map((cid, i) => (
            <img
              key={i}
              src={`${ipfsServiceURL}/${cid}`}
              alt={`Image ${i + 1} of ${images.length}`}
              className={`absolute inset-0 m-auto max-h-full max-w-full rounded-lg object-contain transition-opacity duration-300 ease-out ${
                i === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
              draggable={false}
            />
          ))}
        </div>
      </div>

      {hasMultipleImages && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          variant="secondary"
          className={`${navigationButtonClasses} right-2 md:right-4`}
          aria-label="Next image"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      )}

      {hasMultipleImages && (
        <div className="bg-background/70 text-foreground absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};
