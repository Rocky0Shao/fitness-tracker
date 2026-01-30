'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function ComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track container width for the before image sizing
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  }, [updateSliderPosition]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    updateSliderPosition(e.touches[0].clientX);
  }, [updateSliderPosition]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateSliderPosition(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        updateSliderPosition(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, updateSliderPosition]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[3/4] max-w-md mx-auto rounded-xl overflow-hidden cursor-ew-resize select-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* After Image (Background) */}
      <img
        src={afterImage}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Before Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="absolute inset-0 h-full object-cover"
          style={{ width: containerWidth || '100%' }}
          draggable={false}
        />
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        {/* Handle Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 text-white text-xs rounded">
        {beforeLabel}
      </div>
      <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded">
        {afterLabel}
      </div>
    </div>
  );
}
