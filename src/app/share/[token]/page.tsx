'use client';

import { useState, useEffect, use } from 'react';

interface ShareEntry {
  date: string;
  frontPhotoUrl: string | null;
  backPhotoUrl: string | null;
}

interface ShareData {
  permissions: {
    showGraph: boolean;
    showPhotos: boolean;
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

function SharedHeatmap({ entries, onDayClick }: { entries: ShareEntry[]; onDayClick?: (date: string) => void }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const workoutDates = new Set(
    entries
      .filter(e => e.frontPhotoUrl || e.backPhotoUrl)
      .map(e => e.date)
  );

  const years = Array.from(
    new Set([currentYear, ...entries.map(e => new Date(e.date).getFullYear())])
  ).sort((a, b) => b - a);

  const grid = generateYearGrid(selectedYear);
  const monthLabels = getMonthLabels(selectedYear);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Exercise Activity</h2>
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

                    const hasWorkout = workoutDates.has(dateStr);
                    const isFuture = dateStr > today;
                    const isToday = dateStr === today;

                    return (
                      <button
                        key={dayIdx}
                        onClick={() => onDayClick?.(dateStr)}
                        disabled={isFuture || !hasWorkout}
                        title={`${dateStr}${hasWorkout ? ' - Workout logged' : ''}`}
                        className={`w-3 h-3 rounded-sm transition-all ${
                          isFuture
                            ? 'bg-gray-50'
                            : hasWorkout
                            ? 'bg-green-500 cursor-pointer hover:bg-green-600'
                            : 'bg-gray-200'
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
    </div>
  );
}

function SharedCarousel({ entries }: { entries: ShareEntry[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const entriesWithPhotos = entries.filter(e => e.frontPhotoUrl || e.backPhotoUrl);

  if (entriesWithPhotos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No photos available.</p>
      </div>
    );
  }

  const entry = entriesWithPhotos[currentIndex];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-center text-lg font-semibold text-gray-800 mb-4">
        {formatDate(entry.date)}
      </h3>
      <div className="flex gap-4 justify-center mb-4">
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
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <span className="flex items-center text-sm text-gray-500">
          {currentIndex + 1} / {entriesWithPhotos.length}
        </span>
        <button
          onClick={() => setCurrentIndex(i => Math.min(entriesWithPhotos.length - 1, i + 1))}
          disabled={currentIndex === entriesWithPhotos.length - 1}
          className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">Shared Fitness Progress</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {data.permissions.showGraph && (
          <SharedHeatmap
            entries={data.entries}
            onDayClick={data.permissions.showPhotos ? handleDayClick : undefined}
          />
        )}

        {data.permissions.showPhotos && !selectedDate && (
          <SharedCarousel entries={data.entries} />
        )}

        {data.permissions.showPhotos && selectedEntry && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {formatDate(selectedEntry.date)}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
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

        {!data.permissions.showGraph && !data.permissions.showPhotos && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-500">No content available for this share link.</p>
          </div>
        )}
      </main>

      <footer className="text-center py-4 text-sm text-gray-400">
        Shared via Fitness Tracker
      </footer>
    </div>
  );
}
