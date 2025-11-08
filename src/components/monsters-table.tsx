'use client';

import type { MonsterWithDate } from '@/services/monsters.service';
import type { PanelMemberInfo } from '@/lib/analysis-types';
import { MonstersDateFilter } from './monsters-date-filter';
import { Checkbox } from '@/components/ui/checkbox';
import { ProjectAnalysisSection } from './project-analysis-section';

interface MonstersTableProps {
  monsters: MonsterWithDate[];
  availableDates: Date[];
  selectedDate?: string;
  selectedMonsters?: string[];
  onSelectionChange?: (selectedMonsterGUIDs: string[]) => void;
  projectCode: string;
  projectGUID: string;
  panelMembers: PanelMemberInfo[];
}

/**
 * Client-side rendered table component that displays monsters (samples) with date filtering.
 */
export function MonstersTable({
  monsters,
  availableDates,
  selectedDate,
  selectedMonsters = [],
  onSelectionChange,
  projectCode,
  projectGUID,
  panelMembers,
}: MonstersTableProps) {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('nl-BE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (date: Date | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('nl-BE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggleMonster = (monsterGUID: string) => {
    if (!onSelectionChange) return;

    const isSelected = selectedMonsters.includes(monsterGUID);
    const newSelection = isSelected
      ? selectedMonsters.filter((guid) => guid !== monsterGUID)
      : [...selectedMonsters, monsterGUID];

    onSelectionChange(newSelection);
  };

  const handleToggleAll = (dateMonsters: MonsterWithDate[]) => {
    if (!onSelectionChange) return;

    const dateMonsterGUIDs = dateMonsters.map((m) => m.MonsterGUID);
    const allSelected = dateMonsterGUIDs.every((guid) =>
      selectedMonsters.includes(guid)
    );

    if (allSelected) {
      // Deselect all monsters from this date group
      const newSelection = selectedMonsters.filter(
        (guid) => !dateMonsterGUIDs.includes(guid)
      );
      onSelectionChange(newSelection);
    } else {
      // Select all monsters from this date group
      const newSelection = [
        ...selectedMonsters,
        ...dateMonsterGUIDs.filter((guid) => !selectedMonsters.includes(guid)),
      ];
      onSelectionChange(newSelection);
    }
  };

  if (monsters.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          No sensory analysis samples found for this project.
        </p>
      </div>
    );
  }

  // Filter monsters by selected date
  const filteredMonsters = selectedDate
    ? monsters.filter((monster) => {
        if (!monster.MNDatum) return false;
        const monsterDateStr = new Date(monster.MNDatum).toISOString().split('T')[0];
        return monsterDateStr === selectedDate;
      })
    : monsters;

  // Group monsters by date
  const groupedMonsters = filteredMonsters.reduce(
    (acc, monster) => {
      const dateKey = monster.MNDatum
        ? new Date(monster.MNDatum).toISOString().split('T')[0]
        : 'unknown';
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(monster);
      return acc;
    },
    {} as Record<string, MonsterWithDate[]>
  );

  return (
    <div className="space-y-4">
      {/* Date filter and Create Analysis button */}
      <div className="flex items-center justify-between">
        <MonstersDateFilter
          availableDates={availableDates}
          selectedDate={selectedDate}
          totalCount={monsters.length}
          monsters={monsters}
        />
        <ProjectAnalysisSection
          projectCode={projectCode}
          projectGUID={projectGUID}
          monsters={monsters}
          panelMembers={panelMembers}
          selectedMonsterGUIDs={selectedMonsters}
        />
      </div>

      {/* Results summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredMonsters.length} of {monsters.length} samples
        {selectedMonsters.length > 0 && (
          <span className="ml-2 font-medium">
            ({selectedMonsters.length} selected)
          </span>
        )}
      </div>

      {/* Grouped tables by date */}
      {Object.entries(groupedMonsters)
        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
        .map(([dateKey, dateMonsters]) => (
          <div key={dateKey} className="space-y-2">
            <h3 className="text-lg font-semibold">
              {dateKey === 'unknown' ? 'Unknown Date' : formatDate(new Date(dateKey))}{' '}
              ({dateMonsters.length} samples)
            </h3>

            <div className="rounded-lg border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      {onSelectionChange && (
                        <th className="px-4 py-3 text-left text-sm font-semibold w-12">
                          <Checkbox
                            checked={dateMonsters.every((m) =>
                              selectedMonsters.includes(m.MonsterGUID)
                            )}
                            onCheckedChange={() => handleToggleAll(dateMonsters)}
                          />
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Monstername Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Start Time</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Stop Time</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Code Medium</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {dateMonsters.map((monster) => {
                      const isSelected = selectedMonsters.includes(monster.MonsterGUID);
                      return (
                        <tr
                          key={monster.MonsterGUID}
                          className={`hover:bg-accent/50 transition-colors ${
                            onSelectionChange ? 'cursor-pointer' : ''
                          } ${isSelected ? 'bg-accent/30' : ''}`}
                          onClick={() => onSelectionChange && handleToggleMonster(monster.MonsterGUID)}
                        >
                          {onSelectionChange && (
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleMonster(monster.MonsterGUID)}
                              />
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm">{formatDate(monster.MNDatum)}</td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                monster.MonsterStatus === 'Actief'
                                  ? 'bg-green-100 text-green-800'
                                  : monster.MonsterStatus === 'Afgewerkt'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {monster.MonsterStatus || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{formatDateTime(monster.MonsterStart)}</td>
                          <td className="px-4 py-3 text-sm">{formatDateTime(monster.MonsterStop)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-primary">
                            {monster.MonsterCodeMedium || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
