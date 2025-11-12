'use client';

import type { Analysis } from '@/lib/analysis-types';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TesterAnalysisTableProps {
  analyses: Analysis[];
  testerId: string;
}

export function TesterAnalysisTable({ analyses, testerId }: TesterAnalysisTableProps) {
  const router = useRouter();

  const getAnalysisStatus = (analysis: Analysis) => {
    if (!analysis.isActive) {
      return {
        label: 'Not Active',
        color: 'text-muted-foreground',
        icon: Clock,
      };
    }

    // Check if 12 hours have passed since activation
    if (analysis.activatedAt) {
      const hoursElapsed =
        (new Date().getTime() - new Date(analysis.activatedAt).getTime()) / (1000 * 60 * 60);
      if (hoursElapsed > 12) {
        return {
          label: 'Expired',
          color: 'text-destructive',
          icon: Clock,
        };
      }
    }

    return {
      label: 'Active',
      color: 'text-green-600',
      icon: CheckCircle2,
    };
  };

  const getTesterProgress = (analysis: Analysis) => {
    const progress = analysis.testerProgress.find((tp) => tp.testerId === testerId);
    const totalRooms = analysis.roomAssignments.length;

    if (!progress) {
      return {
        completed: 0,
        total: totalRooms,
        percentage: 0,
        hasStarted: false,
        isComplete: false,
      };
    }

    const completed = progress.completedRoomNumbers.length;
    const isComplete = completed >= totalRooms;

    return {
      completed,
      total: totalRooms,
      percentage: Math.round((completed / totalRooms) * 100),
      hasStarted: true,
      isComplete,
    };
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

  const formatTimeRemaining = (activatedAt: Date) => {
    const hoursElapsed =
      (new Date().getTime() - new Date(activatedAt).getTime()) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 12 - hoursElapsed);

    if (hoursRemaining === 0) {
      return 'Expired';
    }

    const hours = Math.floor(hoursRemaining);
    const minutes = Math.round((hoursRemaining - hours) * 60);

    return `${hours}h ${minutes}m remaining`;
  };

  const handleStartOrContinue = (analysisId: string) => {
    router.push(`/portal/tester/${analysisId}`);
  };

  if (analyses.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No analyses assigned to you yet.</p>
        <p className="text-sm text-muted-foreground mt-2">
          You will see your assigned sensory analysis sessions here once they are created by a
          coordinator.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analyses.map((analysis) => {
            const status = getAnalysisStatus(analysis);
            const progress = getTesterProgress(analysis);
            const StatusIcon = status.icon;
            const isExpired = status.label === 'Expired';
            const isNotActive = status.label === 'Not Active';

            return (
              <TableRow key={analysis.analysisId}>
                <TableCell>
                  <div>
                    <div className="font-medium">{analysis.projectCode}</div>
                    <div className="text-sm text-muted-foreground">
                      {analysis.roomAssignments.length} rooms
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-4 h-4 ${status.color}`} />
                    <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="text-sm">
                    {analysis.isActive && analysis.activatedAt ? (
                      <div>
                        <div className="font-medium">{formatTimeRemaining(analysis.activatedAt)}</div>
                        <div className="text-muted-foreground text-xs">
                          Started: {formatDate(analysis.activatedAt)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        Created: {formatDate(analysis.createdAt)}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium min-w-[3rem] text-right">
                        {progress.percentage}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {progress.completed} / {progress.total} rooms completed
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  {progress.isComplete ? (
                    <Button disabled size="sm" className="gap-2" variant="outline">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Completed
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleStartOrContinue(analysis.analysisId)}
                      disabled={isNotActive || isExpired}
                      size="sm"
                      className="gap-2"
                    >
                      <PlayCircle className="w-4 h-4" />
                      {progress.hasStarted ? 'Continue' : 'Start'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
