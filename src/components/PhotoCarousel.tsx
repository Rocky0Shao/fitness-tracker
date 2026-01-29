'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { PhotoEntry } from '@/lib/photoService';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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

export default function PhotoCarousel({ entries }: PhotoCarouselProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No photos yet. Start tracking your progress today!</p>
      </div>
    );
  }

  return (
    <Swiper
      modules={[Navigation, Pagination]}
      navigation
      pagination={{ clickable: true }}
      spaceBetween={20}
      slidesPerView={1}
      className="w-full max-w-md mx-auto"
    >
      {entries.map((entry) => (
        <SwiperSlide key={entry.date}>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-center text-lg font-semibold text-gray-800 mb-4">
              {formatDate(entry.date)}
            </h3>
            <div className="flex gap-4 justify-center">
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-2">Front</span>
                {entry.frontPhotoUrl ? (
                  <img
                    src={entry.frontPhotoUrl}
                    alt="Front view"
                    className="w-36 h-48 object-cover rounded-lg shadow"
                  />
                ) : (
                  <div className="w-36 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No photo</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-2">Back</span>
                {entry.backPhotoUrl ? (
                  <img
                    src={entry.backPhotoUrl}
                    alt="Back view"
                    className="w-36 h-48 object-cover rounded-lg shadow"
                  />
                ) : (
                  <div className="w-36 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No photo</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
