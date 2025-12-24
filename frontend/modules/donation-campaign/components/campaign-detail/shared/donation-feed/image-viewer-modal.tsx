'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrev();
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
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
  const navigationButtonClasses = `absolute top-1/2 z-50 h-8 w-8 -translate-y-1/2 rounded-full p-2 text-black transition-all duration-300 md:pointer-events-auto md:opacity-100 ${
    showControls ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
  }`;

  if (!isOpen || images.length === 0) return null;

  const modalContent = (
    <div
      className="pointer-events-auto fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-black"
      onClick={(e) => {
        handleClose();
      }}
    >
      <Button
        onClick={(e) => {
          handleClose();
        }}
        variant="secondary"
        className="absolute top-4 right-4 z-[10000] h-10 w-10 rounded-full p-2 text-black transition-colors"
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
          className={`${navigationButtonClasses} left-5`}
          aria-label="Previous image"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      )}

      <div
        className="relative flex h-screen w-screen items-center justify-center overflow-hidden"
        onClick={(e) => {
          e.stopPropagation();
          toggleControls();
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative h-screen w-screen">
          {images.map((cid, i) => (
            <img
              key={i}
              src={`${ipfsServiceURL}/${cid}`}
              alt={`Image ${i + 1} of ${images.length}`}
              className={`absolute inset-0 m-auto max-h-screen max-w-screen object-contain transition-opacity duration-300 ease-out ${
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
          className={`${navigationButtonClasses} right-5`}
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

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
