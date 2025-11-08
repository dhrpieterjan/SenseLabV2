'use client';

import type { Analysis } from '@/lib/analysis-types';
import { Button } from '@/components/ui/button';
import { Trash2, Users, Calendar } from 'lucide-react';
import { deleteAnalysis } from '@/actions/analysis.actions';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

interface AnalysisListProps {
  analyses: Analysis[];
  panelMemberNames: Map<string, string>; // ContactGUID -> ContactFullName
}

export function AnalysisList({ analyses, panelMemberNames }: AnalysisListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (analysisId: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    startTransition(async () => {
      const result = await deleteAnalysis(analysisId);
      if (result.success) {
        router.refresh();
      } else {
        alert(`Failed to delete analysis: ${result.error}`);
      }
    });
  };

  const getAnalysisStatus = (analysis: Analysis): { label: string; color: string } => {
    // For now, all analyses are "Pending" since we haven't created tbl_SensorischeAnalyse records yet
    // In the future, we can check if records exist to determine status
    return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('nl-BE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (analyses.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No analyses created yet for this project.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Click "Create New Analysis" to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {analyses.map((analysis) => {
        const status = getAnalysisStatus(analysis);
        return (
          <div
            key={analysis.analysisId}
            className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${status.color}`}
                  >
                    {status.label}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(analysis.createdAt)}
                  </span>
                </div>

                {/* Room Assignments */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Room Assignments:</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.roomAssignments.map((assignment) => (
                      <div
                        key={assignment.roomNumber}
                        className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5 text-xs"
                      >
                        <span className="font-semibold text-primary">Room {assignment.roomNumber}</span>
                        <span className="text-muted-foreground">→</span>
                        <span>{assignment.monsterCodeMedium || 'No Code'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panel Members */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Panel Members ({analysis.panelMemberIds.length}):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.panelMemberIds.map((memberId) => (
                      <span
                        key={memberId}
                        className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        {panelMemberNames.get(memberId) || 'Unknown'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(analysis.analysisId)}
                  disabled={isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
