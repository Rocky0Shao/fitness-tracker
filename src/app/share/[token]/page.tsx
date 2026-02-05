'use client';

import { useState, useEffect, use, useRef, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';

interface ShareEntry {
  date: string;
  frontPhotoUrl: string | null;
  backPhotoUrl: string | null;
}

interface ShareData {
  permissions: {
    showGraph: boolean;
    showPhotos: boolean;
    showCompare: boolean;
  };
  entries: ShareEntry[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function generateYearGrid(year: number): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: 7 }, () => []);
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const startDayOfWeek = startDate.getDay();
  for (let i = 0; i < startDayOfWeek; i++) {
    grid[i].push(null);
  }

  const current = new Date(startDate);
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];
    grid[dayOfWeek].push(dateStr);
    current.setDate(current.getDate() + 1);
  }

  const maxWeeks = Math.max(...grid.map(row => row.length));
  grid.forEach(row => {
    while (row.length < maxWeeks) {
      row.push(null);
    }
  });

  return grid;
}

function getMonthLabels(year: number): { month: string; weekIndex: number }[] {
  const labels: { month: string; weekIndex: number }[] = [];
  const startDate = new Date(year, 0, 1);
  const startDayOfWeek = startDate.getDay();

  for (let month = 0; month < 12; month++) {
    const firstOfMonth = new Date(year, month, 1);
    const dayOfYear = Math.floor((firstOfMonth.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor((dayOfYear + startDayOfWeek) / 7);
    labels.push({ month: MONTHS[month], weekIndex });
  }

  return labels;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function SharedHeatmap({
  entries,
  onDayClick,
  compareMode,
  selectedDates,
}: {
  entries: ShareEntry[];
  onDayClick?: (date: string) => void;
  compareMode?: boolean;
  selectedDates?: string[];
}) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const workoutDates = new Map<string, { front: boolean; back: boolean }>();
  entries.forEach(e => {
    if (e.frontPhotoUrl || e.backPhotoUrl) {
      workoutDates.set(e.date, {
        front: !!e.frontPhotoUrl,
        back: !!e.backPhotoUrl,
      });
    }
  });

  const daysExercised = workoutDates.size;

  const years = Array.from(
    new Set([currentYear, ...entries.map(e => new Date(e.date).getFullYear())])
  ).sort((a, b) => b - a);

  const grid = generateYearGrid(selectedYear);
  const monthLabels = getMonthLabels(selectedYear);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Exercise Activity ({daysExercised} Days)
        </h2>
        <div className="flex gap-2">
          {years.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                selectedYear === year
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {compareMode && (
        <p className="text-sm text-blue-600 mb-4">
          {selectedDates?.length === 0 && 'Click a date to select the "Before" photo'}
          {selectedDates?.length === 1 && 'Click another date to select the "After" photo'}
          {selectedDates?.length === 2 && 'Two dates selected - ready to compare!'}
        </p>
      )}

      <div className="overflow-x-auto">
        <div className="inline-block">
          <div className="flex gap-1 mb-1 ml-8">
            {monthLabels.map(({ month, weekIndex }, idx) => {
              const nextWeekIndex = monthLabels[idx + 1]?.weekIndex ?? grid[0].length;
              const span = nextWeekIndex - weekIndex;
              return (
                <div
                  key={month}
                  style={{ width: `${span * 12 + (span - 1) * 4}px` }}
                  className="text-xs text-gray-500 truncate"
                >
                  {span >= 2 ? month : ''}
                </div>
              );
            })}
          </div>

          <div className="flex gap-1">
            <div className="flex flex-col gap-1 mr-1">
              {DAYS.map((day, idx) => (
                <div
                  key={day}
                  className="h-3 text-[10px] text-gray-400 leading-3 text-right pr-1"
                >
                  {idx % 2 === 1 ? day : ''}
                </div>
              ))}
            </div>

            <div className="flex gap-1">
              {Array.from({ length: grid[0].length }, (_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {grid.map((row, dayIdx) => {
                    const dateStr = row[weekIdx];
                    if (!dateStr) {
                      return <div key={dayIdx} className="w-3 h-3" />;
                    }

                    const workout = workoutDates.get(dateStr);
                    const hasWorkout = !!workout;
                    const hasBoth = workout?.front && workout?.back;
                    const isFuture = dateStr > today;
                    const isToday = dateStr === today;
                    const isSelected = selectedDates?.includes(dateStr);

                    return (
                      <button
                        key={dayIdx}
                        onClick={() => onDayClick?.(dateStr)}
                        disabled={isFuture || (!hasWorkout && !compareMode)}
                        title={`${dateStr}${hasWorkout ? ` - ${hasBoth ? '2 photos' : '1 photo'}` : ''}`}
                        className={`w-3 h-3 rounded-sm transition-all ${
                          isFuture
                            ? 'bg-gray-50'
                            : hasWorkout
                            ? hasBoth
                              ? 'bg-green-500 cursor-pointer hover:bg-green-600'
                              : 'bg-green-300 cursor-pointer hover:bg-green-400'
                            : 'bg-gray-200'
                        } ${isToday ? 'ring-1 ring-blue-500 ring-offset-1' : ''} ${
                          isSelected ? 'ring-2 ring-purple-500 ring-offset-1' : ''
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-gray-400">Click to view photos</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-gray-200" />
          <div className="w-3 h-3 rounded-sm bg-green-300" />
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

function SharedPhotoCarousel({
  entries,
  onDateChange,
  initialDate,
}: {
  entries: ShareEntry[];
  onDateChange?: (date: string) => void;
  initialDate?: string;
}) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);

  const entriesWithPhotos = entries.filter(e => e.frontPhotoUrl || e.backPhotoUrl);

  useEffect(() => {
    if (initialDate && mainSwiper) {
      const index = entriesWithPhotos.findIndex((e) => e.date === initialDate);
      if (index !== -1) {
        mainSwiper.slideTo(index);
      }
    }
  }, [initialDate, mainSwiper, entriesWithPhotos]);

  if (entriesWithPhotos.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No photos available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Progress Photos</h2>
      <div className="flex flex-col gap-3">
        <Swiper
          onSwiper={setMainSwiper}
          modules={[Navigation, Pagination, Thumbs]}
          navigation
          pagination={{ clickable: true }}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          spaceBetween={16}
          slidesPerView={1}
          onSlideChange={(swiper) => {
            const entry = entriesWithPhotos[swiper.activeIndex];
            if (entry && onDateChange) {
              onDateChange(entry.date);
            }
          }}
          className="w-full"
        >
          {entriesWithPhotos.map((entry) => (
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
          className="w-full px-2"
        >
          {entriesWithPhotos.map((entry) => (
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
    </div>
  );
}

function ComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updateSliderPosition(e.touches[0].clientX);
  };

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
  }, [isDragging]);

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

function ComparisonModal({
  isOpen,
  entries,
  onClose,
}: {
  isOpen: boolean;
  entries: ShareEntry[];
  onClose: () => void;
}) {
  const [beforeDate, setBeforeDate] = useState<string>('');
  const [afterDate, setAfterDate] = useState<string>('');
  const [viewType, setViewType] = useState<'front' | 'back'>('front');

  // Filter entries that have photos for the selected view type
  const entriesWithPhotos = useMemo(() => {
    return entries.filter((e) =>
      viewType === 'front' ? e.frontPhotoUrl : e.backPhotoUrl
    );
  }, [entries, viewType]);

  // Compute default dates
  const defaultAfterDate = entriesWithPhotos.length >= 1 ? entriesWithPhotos[0].date : '';
  const defaultBeforeDate = entriesWithPhotos.length >= 2 ? entriesWithPhotos[entriesWithPhotos.length - 1].date : '';

  // Use state values if set, otherwise use defaults
  const effectiveBeforeDate = beforeDate || defaultBeforeDate;
  const effectiveAfterDate = afterDate || defaultAfterDate;

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setBeforeDate('');
      setAfterDate('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const beforeEntry = entries.find((e) => e.date === effectiveBeforeDate);
  const afterEntry = entries.find((e) => e.date === effectiveAfterDate);

  const beforeImage = viewType === 'front' ? beforeEntry?.frontPhotoUrl : beforeEntry?.backPhotoUrl;
  const afterImage = viewType === 'front' ? afterEntry?.frontPhotoUrl : afterEntry?.backPhotoUrl;

  const canCompare = beforeImage && afterImage && effectiveBeforeDate !== effectiveAfterDate;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-800">Compare Progress</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {entriesWithPhotos.length < 2 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Need at least 2 photos to compare progress.</p>
            </div>
          ) : (
            <>
              {/* View Type Toggle */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setViewType('front')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewType === 'front'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Front View
                </button>
                <button
                  onClick={() => setViewType('back')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewType === 'back'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Back View
                </button>
              </div>

              {/* Date Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Before (Start Date)
                  </label>
                  <select
                    value={effectiveBeforeDate}
                    onChange={(e) => setBeforeDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {entriesWithPhotos.map((entry) => (
                      <option key={entry.date} value={entry.date} disabled={entry.date === effectiveAfterDate}>
                        {formatDate(entry.date)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    After (Current)
                  </label>
                  <select
                    value={effectiveAfterDate}
                    onChange={(e) => setAfterDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {entriesWithPhotos.map((entry) => (
                      <option key={entry.date} value={entry.date} disabled={entry.date === effectiveBeforeDate}>
                        {formatDate(entry.date)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comparison Slider */}
              {canCompare ? (
                <ComparisonSlider
                  beforeImage={beforeImage}
                  afterImage={afterImage}
                  beforeLabel={formatDate(effectiveBeforeDate)}
                  afterLabel={formatDate(effectiveAfterDate)}
                />
              ) : (
                <div className="aspect-[3/4] max-w-md mx-auto bg-gray-100 rounded-xl flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Select different dates to compare</p>
                </div>
              )}

              <p className="text-center text-xs text-gray-400">
                Drag the slider to reveal your transformation
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<ShareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || 'Failed to load');
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError('Failed to load shared content');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const handleDayClick = (date: string) => {
    if (data.permissions.showPhotos) {
      setSelectedDate(date);
    }
  };

  const selectedEntry = selectedDate
    ? data.entries.find(e => e.date === selectedDate)
    : null;

  const hasPhotos = data.entries.some(e => e.frontPhotoUrl || e.backPhotoUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">FitSnap</h1>
          <div className="flex items-center gap-3">
            {data.permissions.showCompare && data.permissions.showPhotos && hasPhotos && (
              <button
                onClick={() => setShowCompare(!showCompare)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showCompare
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Compare
              </button>
            )}
            <a
              href="/"
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Your Journey
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Comparison Modal */}
        <ComparisonModal
          isOpen={showCompare && data.permissions.showCompare && data.permissions.showPhotos}
          entries={data.entries}
          onClose={() => setShowCompare(false)}
        />

        {data.permissions.showPhotos && !selectedDate && (
          <SharedPhotoCarousel
            entries={data.entries}
            onDateChange={(date) => setSelectedDate(null)}
          />
        )}

        {data.permissions.showPhotos && selectedEntry && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {formatDate(selectedEntry.date)}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Back to carousel
              </button>
            </div>
            <div className="flex gap-4 justify-center">
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-2">Front</span>
                {selectedEntry.frontPhotoUrl ? (
                  <img
                    src={selectedEntry.frontPhotoUrl}
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
                {selectedEntry.backPhotoUrl ? (
                  <img
                    src={selectedEntry.backPhotoUrl}
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
        )}

        {data.permissions.showGraph && (
          <SharedHeatmap
            entries={data.entries}
            onDayClick={data.permissions.showPhotos ? handleDayClick : undefined}
          />
        )}

        {!data.permissions.showGraph && !data.permissions.showPhotos && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-500">No content available for this share link.</p>
          </div>
        )}
      </main>

      <footer className="text-center py-8">
        <p className="text-sm text-gray-400 mb-3">Shared via FitSnap</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium"
        >
          <span>Create your own fitness diary</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
      </footer>
    </div>
  );
}
