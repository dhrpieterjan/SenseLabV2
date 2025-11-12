'use client';

import { useState, useTransition, useEffect } from 'react';
import type { Analysis, RoomAssignment, SensoryResponse } from '@/lib/analysis-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { completeRoom } from '@/actions/analysis.actions';
import {
  closeRoomSession,
  getRoomStatus,
  pressurizeSystem,
  selectRoom as selectRoomAction,
  openRoom as openRoomAction,
} from '@/actions/room-control.actions';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface TestingInterfaceProps {
  analysis: Analysis;
  testerId: string;
  currentRoomNumber: number;
  currentRoomAssignment: RoomAssignment;
  onRoomComplete: () => void;
}

// Fixed Geurkarakter options (placeholder for plotly wheel)
const GEURKARAKTER_OPTIONS = ['Floral', 'Fruity', 'Woody', 'Chemical'];

export function TestingInterface({
  analysis,
  testerId,
  currentRoomNumber,
  currentRoomAssignment,
  onRoomComplete,
}: TestingInterfaceProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Simple state management - no need for URL state since we store in cookies
  const [intensiteit, setIntensiteit] = useState<number>(0);
  const [aangenaamheid, setAangenaamheid] = useState<number>(0);
  const [geurkarakter, setGeurkarakter] = useState<string>('');
  const [geuromschrijving, setGeuromschrijving] = useState<string>('');
  const [atRoom, setAtRoom] = useState<boolean>(false);

  // Room control state
  const [isOpeningRoom, setIsOpeningRoom] = useState(false);
  const [roomControlError, setRoomControlError] = useState<string | null>(null);

  // Poll room status periodically for logging
  useEffect(() => {
    const fetchStatus = async () => {
      const result = await getRoomStatus();
      if (result.success && result.data) {
        console.log('[Frontend] Room status poll:', result.data);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  // Get tester progress
  const testerProgress = analysis.testerProgress.find((tp) => tp.testerId === testerId);
  const completedCount = testerProgress?.completedRoomNumbers.length || 0;
  const totalRooms = analysis.roomAssignments.length;

  const handleConfirmLocation = async () => {
    setIsOpeningRoom(true);
    setRoomControlError(null);

    try {
      console.log('[Frontend] Starting workflow for Room', currentRoomNumber);

      // Step 1: Check status
      const statusResult = await getRoomStatus();
      if (!statusResult.success || !statusResult.data) {
        throw new Error('Failed to get initial status');
      }
      console.log('[Frontend] GET /status ->', statusResult.data);

      // Step 2: Pressurize if needed
      if (statusResult.data.state === 'standby') {
        const pressurizeResult = await pressurizeSystem();
        if (!pressurizeResult.success) {
          throw new Error('Failed to pressurize: ' + pressurizeResult.error);
        }
        console.log('[Frontend] POST /pressurize ->', pressurizeResult.data);

        // Poll until ready
        let retries = 0;
        while (retries < 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const checkStatus = await getRoomStatus();
          if (checkStatus.data) {
            console.log('[Frontend] GET /status (polling) ->', checkStatus.data);
          }
          if (checkStatus.success && checkStatus.data?.state === 'ready') {
            break;
          }
          retries++;
        }
      }

      // Step 3: Select room
      const selectResult = await selectRoomAction(currentRoomNumber);
      if (!selectResult.success) {
        throw new Error('Failed to select room: ' + selectResult.error);
      }
      console.log(`[Frontend] POST /select/${currentRoomNumber} ->`, selectResult.data);

      // Step 4: Open room
      const openResult = await openRoomAction();
      if (!openResult.success) {
        throw new Error('Failed to open room: ' + openResult.error);
      }
      console.log('[Frontend] POST /open ->', openResult.data);

      console.log('[Frontend] Workflow complete for Room', currentRoomNumber);
      setAtRoom(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setRoomControlError(errorMessage);
      alert(`Error opening room: ${errorMessage}`);
      console.error('[Frontend] Workflow failed:', errorMessage);
    } finally {
      setIsOpeningRoom(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!geurkarakter) {
      alert('Please select a Geurkarakter (smell character)');
      return;
    }

    // Create sensory response matching TblSensorischeAnalyse structure
    const response: SensoryResponse = {
      SAGUID: crypto.randomUUID(),
      SAMonsterID: currentRoomAssignment.monsterGUID,
      SAPanelID: testerId,
      SAIntensiteit: intensiteit,
      SAAangenaamheid: aangenaamheid,
      SAGeurkarakter: geurkarakter,
      SAGeuromschrijving: geuromschrijving || null,
      SATijdStip: new Date(),
      SAGewijzigdDoor: testerId,
      SAGewijzigdOp: new Date(),
    };

    // Store in cookie
    const existingResponses = getResponsesFromCookie(analysis.analysisId);
    const updatedResponses = [...existingResponses, response];
    saveResponsesToCookie(analysis.analysisId, testerId, updatedResponses);

    startTransition(async () => {
      console.log('[TestingInterface] Completing room:', currentRoomNumber);
      const result = await completeRoom(analysis.analysisId, testerId, currentRoomNumber);
      console.log('[TestingInterface] Complete room result:', result);

      if (result.success) {
        // Close the room session
        console.log('[Frontend] Closing room session...');
        const closeResult = await closeRoomSession();
        if (!closeResult.success) {
          console.warn('[Frontend] Failed to close room session:', closeResult.error);
        } else {
          console.log('[Frontend] POST /standby -> Room session closed');
        }

        if (result.data?.isComplete) {
          // All rooms completed - redirect to tester portal
          alert('Congratulations! You have completed all rooms in this analysis.');
          router.push('/portal/tester');
        } else {
          console.log('[TestingInterface] Moving to next room, resetting form...');
          // Reset form state
          setIntensiteit(0);
          setAangenaamheid(0);
          setGeurkarakter('');
          setGeuromschrijving('');
          setAtRoom(false);

          console.log('[TestingInterface] Form reset, calling onRoomComplete');
          // Trigger refresh in parent to fetch next room
          onRoomComplete();
        }
      } else {
        alert(`Failed to submit: ${result.error}`);
      }
    });
  };

  // Helper functions for cookie management
  function getResponsesFromCookie(analysisId: string): SensoryResponse[] {
    try {
      const cookieValue = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`tester_responses_${analysisId}=`));

      if (!cookieValue) return [];

      const data = JSON.parse(decodeURIComponent(cookieValue.split('=')[1]));
      return data.responses || [];
    } catch (error) {
      console.error('Error reading responses from cookie:', error);
      return [];
    }
  }

  function saveResponsesToCookie(
    analysisId: string,
    testerId: string,
    responses: SensoryResponse[]
  ) {
    try {
      const data = {
        analysisId,
        testerId,
        responses,
        lastUpdatedAt: new Date().toISOString(),
      };

      const cookieValue = encodeURIComponent(JSON.stringify(data));
      // Set cookie with 24 hour expiry
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `tester_responses_${analysisId}=${cookieValue}; expires=${expires}; path=/; SameSite=Strict`;
    } catch (error) {
      console.error('Error saving responses to cookie:', error);
    }
  }

  // Show location confirmation first
  if (!atRoom) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-4xl font-bold mb-2">Room {currentRoomNumber}</CardTitle>
            <CardDescription className="text-lg">
              Please proceed to this room to begin the sensory test
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">Sample Code</p>
              <p className="text-2xl font-bold">
                {currentRoomAssignment.monsterCodeMedium || 'N/A'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">
                  {completedCount} / {totalRooms} rooms
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(completedCount / totalRooms) * 100}%` }}
                />
              </div>
            </div>

            {roomControlError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-destructive">Room Control Error</p>
                  <p className="text-sm text-destructive/80 mt-1">{roomControlError}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleConfirmLocation}
              className="w-full h-14 text-lg"
              size="lg"
              disabled={isOpeningRoom}
            >
              {isOpeningRoom ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Opening Room {currentRoomNumber}...
                </>
              ) : (
                `I am at Room ${currentRoomNumber}`
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/portal/tester')}
              className="w-full"
            >
              Back to Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show the actual testing form
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Room {currentRoomNumber}</CardTitle>
            <CardDescription className="text-base mt-1">
              Sample: {currentRoomAssignment.monsterCodeMedium || 'N/A'}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Progress</div>
            <div className="text-xl font-bold">
              {completedCount} / {totalRooms}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Intensiteit Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="intensiteit" className="text-lg font-semibold">
                Intensiteit
              </label>
              <span className="text-2xl font-bold text-primary">{intensiteit.toFixed(1)}</span>
            </div>
            <Slider
              id="intensiteit"
              min={0}
              max={10}
              step={0.1}
              value={[intensiteit]}
              onValueChange={([value]) => setIntensiteit(value)}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0 (None)</span>
              <span>5 (Medium)</span>
              <span>10 (Very Strong)</span>
            </div>
          </div>

          {/* Aangenaamheid Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="aangenaamheid" className="text-lg font-semibold">
                Aangenaamheid
              </label>
              <span className="text-2xl font-bold text-primary">
                {aangenaamheid > 0 ? '+' : ''}
                {aangenaamheid.toFixed(1)}
              </span>
            </div>
            <Slider
              id="aangenaamheid"
              min={-4}
              max={4}
              step={0.1}
              value={[aangenaamheid]}
              onValueChange={([value]) => setAangenaamheid(value)}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>-4 (Very Unpleasant)</span>
              <span>0 (Neutral)</span>
              <span>+4 (Very Pleasant)</span>
            </div>
          </div>

          {/* Geurkarakter Buttons */}
          <div className="space-y-4">
            <label className="text-lg font-semibold block">
              Geurkarakter <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {GEURKARAKTER_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGeurkarakter(option)}
                  className={`p-4 rounded-lg border-2 text-lg font-medium transition-all ${
                    geurkarakter === option
                      ? 'border-primary bg-primary text-primary-foreground shadow-md'
                      : 'border-muted bg-background hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Geuromschrijving Text Field */}
          <div className="space-y-4">
            <label htmlFor="geuromschrijving" className="text-lg font-semibold block">
              Geuromschrijving <span className="text-xs text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="geuromschrijving"
              value={geuromschrijving}
              onChange={(e) => setGeuromschrijving(e.target.value)}
              placeholder="Describe the smell in your own words..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (confirm('Are you sure you want to go back? Your progress will be saved.')) {
                  router.push('/portal/tester');
                }
              }}
              disabled={isPending}
              className="flex-1 h-12 text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !geurkarakter}
              className="flex-1 h-12 text-base gap-2"
            >
              {isPending ? (
                'Submitting...'
              ) : completedCount + 1 >= totalRooms ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Complete Analysis
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  Next Room
                </>
              )}
            </Button>
          </div>

          {/* Room Overview */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-3">Rooms Overview</h3>
            <div className="grid grid-cols-4 gap-2">
              {analysis.roomAssignments.map((assignment) => {
                const isCompleted = testerProgress?.completedRoomNumbers.includes(
                  assignment.roomNumber
                );
                const isCurrent = assignment.roomNumber === currentRoomNumber;

                return (
                  <div
                    key={assignment.roomNumber}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      isCurrent
                        ? 'border-primary bg-primary/10 font-semibold'
                        : isCompleted
                          ? 'border-green-600 bg-green-50 text-green-600'
                          : 'border-muted bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    <div className="text-sm">Room {assignment.roomNumber}</div>
                    {isCompleted && (
                      <CheckCircle2 className="w-4 h-4 mx-auto mt-1 text-green-600" />
                    )}
                    {isCurrent && <div className="text-xs mt-1">Current</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
  );
}
