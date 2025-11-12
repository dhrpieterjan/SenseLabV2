'use client';

import type { Analysis } from '@/lib/analysis-types';
import { AnalysisList } from '@/components/analysis-list';

interface AllAnalysesListProps {
  analyses: Analysis[];
  panelMemberNames: Map<string, string>;
}

export function AllAnalysesList({ analyses, panelMemberNames }: AllAnalysesListProps) {
  return <AnalysisList analyses={analyses} panelMemberNames={panelMemberNames} groupByProject />;
}
