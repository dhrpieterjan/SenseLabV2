'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Analysis } from '@/lib/analysis-types';
import { startTesting } from '@/actions/analysis.actions';
import { TestingInterface } from '@/components/testing-interface';
import { useRouter } from 'next/navigation';

interface TestingInterfaceWrapperProps {
  analysisId: string;
  testerId: string;
  initialAnalysis: Analysis;
}

export function TestingInterfaceWrapper({
  analysisId,
  testerId,
  initialAnalysis,
}: TestingInterfaceWrapperProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [currentRoomNumber, setCurrentRoomNumber] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const initializeTesting = useCallback(async () => {
    setIsLoading(true);
    setError(null); // Clear any previous errors
    try {
      console.log('[TestingWrapper] Fetching testing session...', { analysisId, testerId });
      // Call startTesting to initialize or continue
      const result = await startTesting(analysisId, testerId);

      console.log('[TestingWrapper] startTesting result:', result);

      if (!result.success || !result.data) {
        setError(result.error || 'Failed to start testing');
        return;
      }

      setAnalysis(result.data.analysis);
      setCurrentRoomNumber(result.data.assignedRoomNumber);
      console.log('[TestingWrapper] Set room number:', result.data.assignedRoomNumber);
    } catch (err) {
      console.error('Error initializing testing:', err);
      setError('Failed to initialize testing');
    } finally {
      setIsLoading(false);
    }
  }, [analysisId, testerId]);

  const handleRoomComplete = useCallback(() => {
    // Trigger a refresh by incrementing the key
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    initializeTesting();
  }, [initializeTesting, refreshKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading testing session...</div>
          <div className="text-sm text-muted-foreground mt-2">Please wait</div>
        </div>
      </div>
    );
  }

  if (error || !analysis || currentRoomNumber === null) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-destructive font-semibold mb-2">Error</p>
        <p className="text-muted-foreground">{error || 'Failed to load testing session'}</p>
        <button
          onClick={() => router.push('/portal/tester')}
          className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Back to Tester Portal
        </button>
      </div>
    );
  }

  const currentRoomAssignment = analysis.roomAssignments.find(
    (ra) => ra.roomNumber === currentRoomNumber
  );

  if (!currentRoomAssignment) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-destructive font-semibold mb-2">Error</p>
        <p className="text-muted-foreground">Room assignment not found</p>
        <button
          onClick={() => router.push('/portal/tester')}
          className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Back to Tester Portal
        </button>
      </div>
    );
  }

  const testerProgress = analysis.testerProgress.find((tp) => tp.testerId === testerId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sensory Analysis Testing</h1>
          <p className="text-muted-foreground">
            Project: {analysis.projectCode} - Room {currentRoomNumber}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">Progress</div>
          <div className="text-2xl font-bold">
            {testerProgress?.completedRoomNumbers.length || 0} / {analysis.roomAssignments.length}
          </div>
        </div>
      </div>

      <TestingInterface
        analysis={analysis}
        testerId={testerId}
        currentRoomNumber={currentRoomNumber}
        currentRoomAssignment={currentRoomAssignment}
        onRoomComplete={handleRoomComplete}
      />
    </div>
  );
}
