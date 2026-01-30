'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { PhotoEntry } from '@/lib/photoService';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';

interface PhotoCarouselProps {
  entries: PhotoEntry[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function PhotoCarousel({ entries }: PhotoCarouselProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No photos yet. Start tracking today!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Swiper
        modules={[Navigation, Pagination, Thumbs]}
        navigation
        pagination={{ clickable: true }}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        spaceBetween={16}
        slidesPerView={1}
        className="w-full"
      >
        {entries.map((entry) => (
          <SwiperSlide key={entry.date}>
            <div className="pb-2">
              <h3 className="text-center text-sm font-medium text-gray-600 mb-3">
                {formatDate(entry.date)}
              </h3>
              <div className="flex gap-3 justify-center">
                <div className="relative">
                  {entry.frontPhotoUrl ? (
                    <img
                      src={entry.frontPhotoUrl}
                      alt="Front view"
                      className="w-28 h-36 object-cover rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="w-28 h-36 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No photo</span>
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">Front</span>
                </div>
                <div className="relative">
                  {entry.backPhotoUrl ? (
                    <img
                      src={entry.backPhotoUrl}
                      alt="Back view"
                      className="w-28 h-36 object-cover rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="w-28 h-36 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No photo</span>
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">Back</span>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Thumbnail scrubber */}
      <Swiper
        onSwiper={setThumbsSwiper}
        modules={[FreeMode, Thumbs]}
        spaceBetween={6}
        slidesPerView="auto"
        freeMode
        watchSlidesProgress
        className="w-full px-2 scrollbar-hide"
      >
        {entries.map((entry) => (
          <SwiperSlide key={entry.date} className="!w-12">
            <div className="cursor-pointer group">
              {entry.frontPhotoUrl ? (
                <img
                  src={entry.frontPhotoUrl}
                  alt={formatShortDate(entry.date)}
                  className="w-12 h-16 object-cover rounded border-2 border-transparent group-[.swiper-slide-thumb-active]:border-blue-500 transition-all"
                />
              ) : (
                <div className="w-12 h-16 bg-gray-200 rounded border-2 border-transparent group-[.swiper-slide-thumb-active]:border-blue-500 flex items-center justify-center transition-all">
                  <span className="text-[8px] text-gray-500 text-center leading-tight">
                    {formatShortDate(entry.date)}
                  </span>
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
