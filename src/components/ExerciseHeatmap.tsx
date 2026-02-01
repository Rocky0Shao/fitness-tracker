'use client';

import { useState, useMemo } from 'react';
import { PhotoEntry } from '@/lib/photoService';

interface ExerciseHeatmapProps {
  entries: PhotoEntry[];
  onDayClick: (date: string) => void;
  onDayView?: (date: string) => void; // Navigate to view photos for this date
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getYearsFromEntries(entries: PhotoEntry[]): number[] {
  const currentYear = new Date().getFullYear();
  // Always include current year and previous year for retroactive uploads
  const years = new Set<number>([currentYear, currentYear - 1]);
  entries.forEach(entry => {
    const year = new Date(entry.date).getFullYear();
    years.add(year);
  });
  return Array.from(years).sort((a, b) => b - a);
}

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

export default function ExerciseHeatmap({ entries, onDayClick, onDayView }: ExerciseHeatmapProps) {
  const availableYears = useMemo(() => getYearsFromEntries(entries), [entries]);
  const [selectedYear, setSelectedYear] = useState(availableYears[0] || new Date().getFullYear());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Map of dates to photo counts
  const datePhotoMap = useMemo(() => {
    const map = new Map<string, { front: boolean; back: boolean }>();
    entries.forEach(entry => {
      map.set(entry.date, {
        front: !!entry.frontPhotoUrl,
        back: !!entry.backPhotoUrl,
      });
    });
    return map;
  }, [entries]);

  const workoutDates = useMemo(() => {
    const dates = new Set<string>();
    entries.forEach(entry => {
      if (entry.frontPhotoUrl || entry.backPhotoUrl) {
        dates.add(entry.date);
      }
    });
    return dates;
  }, [entries]);

  const getPhotoCount = (date: string) => {
    const info = datePhotoMap.get(date);
    if (!info) return 0;
    return (info.front ? 1 : 0) + (info.back ? 1 : 0);
  };

  const getTooltipText = (date: string) => {
    const info = datePhotoMap.get(date);
    if (!info) return `${date} - No photos`;
    const count = (info.front ? 1 : 0) + (info.back ? 1 : 0);
    const parts = [];
    if (info.front) parts.push('Front');
    if (info.back) parts.push('Back');
    return `${date}: ${count} photo${count !== 1 ? 's' : ''} (${parts.join(', ')})`;
  };

  const grid = useMemo(() => generateYearGrid(selectedYear), [selectedYear]);
  const monthLabels = useMemo(() => getMonthLabels(selectedYear), [selectedYear]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Exercise Activity ({workoutDates.size} Day{workoutDates.size !== 1 ? 's' : ''})
        </h2>
        <div className="flex gap-2">
          {availableYears.map(year => (
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

      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="inline-block pt-10 pb-2">
            <div className="flex mb-1" style={{ paddingLeft: '30px', gap: '4px' }}>
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

          <div className="flex">
            <div className="flex flex-col" style={{ gap: '4px', width: '22px', marginRight: '8px' }}>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="flex items-center justify-end text-[10px] text-gray-400"
                  style={{ height: '12px' }}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="flex" style={{ gap: '4px' }}>
              {Array.from({ length: grid[0].length }, (_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col" style={{ gap: '4px' }}>
                  {grid.map((row, dayIdx) => {
                    const dateStr = row[weekIdx];
                    if (!dateStr) {
                      return <div key={dayIdx} style={{ width: '12px', height: '12px' }} />;
                    }

                    const hasWorkout = workoutDates.has(dateStr);
                    const isFuture = dateStr > today;
                    const isToday = dateStr === today;
                    const photoCount = getPhotoCount(dateStr);
                    const isHovered = hoveredDate === dateStr;

                    return (
                      <div key={dayIdx} className="relative" style={{ width: '12px', height: '12px' }}>
                        <button
                          onClick={() => {
                            if (isFuture) return;
                            if (hasWorkout && onDayView) {
                              onDayView(dateStr);
                            } else {
                              onDayClick(dateStr);
                            }
                          }}
                          onDoubleClick={() => !isFuture && onDayClick(dateStr)}
                          onMouseEnter={() => setHoveredDate(dateStr)}
                          onMouseLeave={() => setHoveredDate(null)}
                          disabled={isFuture}
                          style={{ width: '12px', height: '12px' }}
                          className={`rounded-sm transition-all ${
                            isFuture
                              ? 'bg-gray-50 cursor-not-allowed'
                              : hasWorkout
                              ? photoCount === 2
                                ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                                : 'bg-green-300 hover:bg-green-400 cursor-pointer'
                              : 'bg-gray-200 hover:bg-gray-300 cursor-pointer'
                          } ${isToday ? 'ring-1 ring-blue-500 ring-offset-1' : ''}`}
                        />
                        {isHovered && !isFuture && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none">
                            {getTooltipText(dateStr)}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-gray-200" />
        <div className="w-3 h-3 rounded-sm bg-green-300" />
        <div className="w-3 h-3 rounded-sm bg-green-500" />
        <span>More</span>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        Click to view photos • Double-click to edit
      </p>
    </div>
  );
}
