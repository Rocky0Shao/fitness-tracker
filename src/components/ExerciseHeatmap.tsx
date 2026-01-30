'use client';

import { useState, useMemo } from 'react';
import { PhotoEntry } from '@/lib/photoService';

interface ExerciseHeatmapProps {
  entries: PhotoEntry[];
  onDayClick: (date: string) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getYearsFromEntries(entries: PhotoEntry[]): number[] {
  const currentYear = new Date().getFullYear();
  const years = new Set<number>([currentYear]);
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

export default function ExerciseHeatmap({ entries, onDayClick }: ExerciseHeatmapProps) {
  const availableYears = useMemo(() => getYearsFromEntries(entries), [entries]);
  const [selectedYear, setSelectedYear] = useState(availableYears[0] || new Date().getFullYear());

  const workoutDates = useMemo(() => {
    const dates = new Set<string>();
    entries.forEach(entry => {
      if (entry.frontPhotoUrl || entry.backPhotoUrl) {
        dates.add(entry.date);
      }
    });
    return dates;
  }, [entries]);

  const grid = useMemo(() => generateYearGrid(selectedYear), [selectedYear]);
  const monthLabels = useMemo(() => getMonthLabels(selectedYear), [selectedYear]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Exercise Activity</h2>
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

      <div className="overflow-x-auto scrollbar-hide">
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

                    const hasWorkout = workoutDates.has(dateStr);
                    const isFuture = dateStr > today;
                    const isToday = dateStr === today;

                    return (
                      <button
                        key={dayIdx}
                        onClick={() => !isFuture && onDayClick(dateStr)}
                        disabled={isFuture}
                        title={`${dateStr}${hasWorkout ? ' - Workout logged' : ''}`}
                        className={`w-3 h-3 rounded-sm transition-all ${
                          isFuture
                            ? 'bg-gray-50 cursor-not-allowed'
                            : hasWorkout
                            ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                            : 'bg-gray-200 hover:bg-gray-300 cursor-pointer'
                        } ${isToday ? 'ring-1 ring-blue-500 ring-offset-1' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
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
        Click any day to add or update photos
      </p>
    </div>
  );
}
