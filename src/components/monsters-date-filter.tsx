'use client';

import { useQueryState } from 'nuqs';
import type { MonsterWithDate } from '@/services/monsters.service';

interface MonstersDateFilterProps {
  availableDates: Date[];
  selectedDate?: string;
  totalCount: number;
  monsters: MonsterWithDate[];
}

/**
 * Client-side filter component for selecting a date to filter monsters.
 * Uses nuqs to manage the date filter in the URL query params.
 */
export function MonstersDateFilter({
  availableDates,
  selectedDate,
  totalCount,
  monsters,
}: MonstersDateFilterProps) {
  const [, setDate] = useQueryState('date', { defaultValue: '' });

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('nl-BE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleDateChange = (value: string) => {
    if (value === '') {
      setDate(null); // Remove the query param when "all" is selected
    } else {
      setDate(value);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <label htmlFor="date-filter" className="text-sm font-medium">
        Filter by date:
      </label>
      <select
        id="date-filter"
        value={selectedDate || ''}
        onChange={(e) => handleDateChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <option value="">All dates ({totalCount} samples)</option>
        {availableDates.map((date) => {
          const dateStr = date.toISOString().split('T')[0];
          const count = monsters.filter((m) => {
            if (!m.MNDatum) return false;
            return new Date(m.MNDatum).toISOString().split('T')[0] === dateStr;
          }).length;
          return (
            <option key={dateStr} value={dateStr}>
              {formatDate(date)} ({count} samples)
            </option>
          );
        })}
      </select>
    </div>
  );
}
