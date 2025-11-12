'use client';

import type { Analysis } from '@/lib/analysis-types';
import { Button } from '@/components/ui/button';
import { Trash2, Users, Calendar, PlayCircle, Clock, Folder } from 'lucide-react';
import { deleteAnalysis, activateAnalysis } from '@/actions/analysis.actions';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import Link from 'next/link';

interface AnalysisListProps {
  analyses: Analysis[];
  panelMemberNames: Map<string, string>; // ContactGUID -> ContactFullName
  groupByProject?: boolean; // If true, groups analyses by project code
}

export function AnalysisList({ analyses, panelMemberNames, groupByProject = false }: AnalysisListProps) {
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

  const handleActivate = (analysisId: string) => {
    if (!confirm('Are you sure you want to activate this analysis? Testers will have 12 hours to complete it.')) {
      return;
    }

    startTransition(async () => {
      const result = await activateAnalysis(analysisId);
      if (result.success) {
        router.refresh();
      } else {
        alert(`Failed to activate analysis: ${result.error}`);
      }
    });
  };

  const getAnalysisStatus = (analysis: Analysis): { label: string; color: string } => {
    if (!analysis.isActive) {
      return { label: 'Not Active', color: 'bg-gray-100 text-gray-800' };
    }

    // Check if 12 hours have passed since activation
    if (analysis.activatedAt) {
      const hoursElapsed =
        (new Date().getTime() - new Date(analysis.activatedAt).getTime()) / (1000 * 60 * 60);
      if (hoursElapsed > 12) {
        return { label: 'Expired', color: 'bg-red-100 text-red-800' };
      }
    }

    // Check completion status
    const totalTesters = analysis.panelMemberIds.length;
    const testersCompleted = analysis.testerProgress.filter(
      (tp) => tp.completedRoomNumbers.length >= analysis.roomAssignments.length
    ).length;

    if (testersCompleted === totalTesters && totalTesters > 0) {
      return { label: 'Completed', color: 'bg-green-100 text-green-800' };
    }

    return { label: 'Active', color: 'bg-blue-100 text-blue-800' };
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
        <p className="text-muted-foreground">
          {groupByProject ? 'No analyses have been created yet.' : 'No analyses created yet for this project.'}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {groupByProject
            ? 'Navigate to a project and click "Create New Analysis" to get started.'
            : 'Click "Create New Analysis" to get started.'}
        </p>
      </div>
    );
  }

  // Group analyses by project if needed
  const analysesByProject = groupByProject
    ? analyses.reduce(
        (acc, analysis) => {
          if (!acc[analysis.projectCode]) {
            acc[analysis.projectCode] = [];
          }
          acc[analysis.projectCode].push(analysis);
          return acc;
        },
        {} as Record<string, Analysis[]>
      )
    : { '': analyses };

  const renderAnalysisCard = (analysis: Analysis) => {
    const status = getAnalysisStatus(analysis);
    const totalTesters = analysis.panelMemberIds.length;
    const testersStarted = analysis.testerProgress.length;
    const testersCompleted = analysis.testerProgress.filter(
      (tp) => tp.completedRoomNumbers.length >= analysis.roomAssignments.length
    ).length;
    const testersNotStarted = totalTesters - testersStarted;

    return (
      <div
        key={analysis.analysisId}
        className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
      >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
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
                  {/* Quick Stats */}
                  {analysis.isActive && (
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-green-600">{testersCompleted}</span>
                        <span className="text-muted-foreground">completed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-blue-600">
                          {testersStarted - testersCompleted}
                        </span>
                        <span className="text-muted-foreground">in progress</span>
                      </div>
                      {testersNotStarted > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-orange-600">{testersNotStarted}</span>
                          <span className="text-muted-foreground">not started</span>
                        </div>
                      )}
                    </div>
                  )}
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

                {/* Panel Members with Progress */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Panel Members ({analysis.panelMemberIds.length}):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.panelMemberIds.map((memberId) => {
                      const progress = analysis.testerProgress.find((tp) => tp.testerId === memberId);
                      const totalRooms = analysis.roomAssignments.length;
                      const completed = progress?.completedRoomNumbers.length || 0;
                      const hasStarted = !!progress;
                      const isComplete = completed >= totalRooms;

                      return (
                        <div
                          key={memberId}
                          className="inline-flex flex-col gap-1 rounded-md border bg-card px-2.5 py-1.5"
                        >
                          <span className="text-xs font-medium">
                            {panelMemberNames.get(memberId) || 'Unknown'}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  isComplete
                                    ? 'bg-green-600'
                                    : hasStarted
                                      ? 'bg-blue-600'
                                      : 'bg-gray-300'
                                }`}
                                style={{ width: `${(completed / totalRooms) * 100}%` }}
                              />
                            </div>
                            <span
                              className={`text-xs font-medium ${
                                isComplete
                                  ? 'text-green-600'
                                  : hasStarted
                                    ? 'text-blue-600'
                                    : 'text-muted-foreground'
                              }`}
                            >
                              {completed}/{totalRooms}
                            </span>
                          </div>
                          {!hasStarted && analysis.isActive && (
                            <span className="text-[10px] text-muted-foreground italic">
                              Not started
                            </span>
                          )}
                          {hasStarted && !isComplete && (
                            <span className="text-[10px] text-blue-600 italic">
                              In progress
                            </span>
                          )}
                          {isComplete && (
                            <span className="text-[10px] text-green-600 italic">
                              Complete
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex gap-2">
                {!analysis.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleActivate(analysis.analysisId)}
                    disabled={isPending}
                    className="gap-2"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Activate
                  </Button>
                )}
                {analysis.isActive && analysis.activatedAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {(() => {
                      const hoursElapsed =
                        (new Date().getTime() - new Date(analysis.activatedAt).getTime()) /
                        (1000 * 60 * 60);
                      const hoursRemaining = Math.max(0, 12 - hoursElapsed);
                      const hours = Math.floor(hoursRemaining);
                      const minutes = Math.round((hoursRemaining - hours) * 60);
                      return hoursRemaining > 0 ? `${hours}h ${minutes}m left` : 'Expired';
                    })()}
                  </div>
                )}
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
  };

  return (
    <div className="space-y-6">
      {Object.entries(analysesByProject)
        .sort(([projectA], [projectB]) => projectA.localeCompare(projectB))
        .map(([projectCode, projectAnalyses]) => (
          <div key={projectCode || 'default'} className="space-y-4">
            {/* Project Header (only if grouped) */}
            {groupByProject && projectCode && (
              <div className="flex items-center gap-3">
                <Folder className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">
                  <Link
                    href={`/portal/coordinator/${projectCode}`}
                    className="hover:underline text-primary"
                  >
                    {projectCode}
                  </Link>
                </h3>
                <span className="text-sm text-muted-foreground">
                  ({projectAnalyses.length} {projectAnalyses.length === 1 ? 'analysis' : 'analyses'})
                </span>
              </div>
            )}

            {/* Analyses */}
            <div className={groupByProject ? 'space-y-3 pl-8' : 'space-y-4'}>
              {projectAnalyses
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .map((analysis) => renderAnalysisCard(analysis))}
            </div>
          </div>
        ))}
    </div>
  );
}
