'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateAnalysisModal } from './create-analysis-modal';
import type { MonsterWithDate } from '@/services/monsters.service';
import type { PanelMemberInfo } from '@/lib/analysis-types';

interface ProjectAnalysisSectionProps {
  projectCode: string;
  projectGUID: string;
  monsters: MonsterWithDate[];
  panelMembers: PanelMemberInfo[];
  selectedMonsterGUIDs: string[];
}

export function ProjectAnalysisSection({
  projectCode,
  projectGUID,
  monsters,
  panelMembers,
  selectedMonsterGUIDs,
}: ProjectAnalysisSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasSelection = selectedMonsterGUIDs.length > 0;
  const selectedMonsters = monsters.filter((m) =>
    selectedMonsterGUIDs.includes(m.MonsterGUID)
  );

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        size="default"
        disabled={!hasSelection}
        title={!hasSelection ? 'Select at least one monster to create an analysis' : ''}
      >
        <Plus className="mr-2 h-4 w-4" />
        Create New Analysis
        {hasSelection && ` (${selectedMonsterGUIDs.length})`}
      </Button>

      <CreateAnalysisModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        projectCode={projectCode}
        projectGUID={projectGUID}
        monsters={selectedMonsters}
        panelMembers={panelMembers}
      />
    </>
  );
}
