'use client';

import { useState } from 'react';
import { MonstersTable } from '@/components/monsters-table';
import { AnalysisList } from '@/components/analysis-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MonsterWithDate } from '@/services/monsters.service';
import type { PanelMemberInfo } from '@/lib/analysis-types';
import type { Analysis } from '@/lib/analysis-types';

interface ProjectDetailClientProps {
  projectCode: string;
  projectGUID: string;
  monsters: MonsterWithDate[];
  availableDates: Date[];
  selectedDate?: string;
  panelMembers: PanelMemberInfo[];
  analyses: Analysis[];
  panelMemberNames: Map<string, string>;
}

export function ProjectDetailClient({
  projectCode,
  projectGUID,
  monsters,
  availableDates,
  selectedDate,
  panelMembers,
  analyses,
  panelMemberNames,
}: ProjectDetailClientProps) {
  const [selectedMonsterGUIDs, setSelectedMonsterGUIDs] = useState<string[]>([]);

  return (
    <Tabs defaultValue="samples" className="space-y-4">
      <TabsList>
        <TabsTrigger value="samples">Samples ({monsters.length})</TabsTrigger>
        <TabsTrigger value="analyses">Analyses ({analyses.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="samples" className="space-y-4">
        <MonstersTable
          monsters={monsters}
          availableDates={availableDates}
          selectedDate={selectedDate}
          selectedMonsters={selectedMonsterGUIDs}
          onSelectionChange={setSelectedMonsterGUIDs}
          projectCode={projectCode}
          projectGUID={projectGUID}
          panelMembers={panelMembers}
        />
      </TabsContent>

      <TabsContent value="analyses" className="space-y-4">
        <AnalysisList analyses={analyses} panelMemberNames={panelMemberNames} />
      </TabsContent>
    </Tabs>
  );
}
