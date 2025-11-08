'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RoomAssignmentStep } from './room-assignment-step';
import { PanelMemberSelectionStep } from './panel-member-selection-step';
import type { RoomAssignment, PanelMemberInfo, Analysis } from '@/lib/analysis-types';
import type { MonsterWithDate } from '@/services/monsters.service';
import { saveAnalysis } from '@/actions/analysis.actions';
import { useRouter } from 'next/navigation';

interface CreateAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectCode: string;
  projectGUID: string;
  monsters: MonsterWithDate[];
  panelMembers: PanelMemberInfo[];
}

type Step = 'room-assignment' | 'panel-selection';

export function CreateAnalysisModal({
  open,
  onOpenChange,
  projectCode,
  projectGUID,
  monsters,
  panelMembers,
}: CreateAnalysisModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('room-assignment');
  const [roomAssignments, setRoomAssignments] = useState<RoomAssignment[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRoomAssignmentComplete = (assignments: RoomAssignment[]) => {
    setRoomAssignments(assignments);
    setCurrentStep('panel-selection');
  };

  const handlePanelSelectionComplete = (selectedMemberIds: string[]) => {
    // Generate UUID for analysis
    const analysisId = crypto.randomUUID();

    const analysis: Analysis = {
      analysisId,
      projectCode,
      projectGUID,
      roomAssignments,
      panelMemberIds: selectedMemberIds,
      createdAt: new Date(),
    };

    // Save analysis to cookie
    startTransition(async () => {
      const result = await saveAnalysis(analysis);

      if (result.success) {
        // Reset and close modal
        setCurrentStep('room-assignment');
        setRoomAssignments([]);
        onOpenChange(false);

        // Refresh the page to show updated data
        router.refresh();
      } else {
        alert(`Failed to create analysis: ${result.error}`);
      }
    });
  };

  const handleBack = () => {
    if (currentStep === 'panel-selection') {
      setCurrentStep('room-assignment');
    }
  };

  const handleClose = () => {
    if (!isPending) {
      setCurrentStep('room-assignment');
      setRoomAssignments([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Sensory Analysis</DialogTitle>
          <DialogDescription>
            Assign monsters to rooms and select panel members for this sensory analysis session.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`flex items-center gap-2 ${currentStep === 'room-assignment' ? 'font-semibold' : 'text-muted-foreground'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                currentStep === 'room-assignment'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              1
            </div>
            <span>Room Assignment</span>
          </div>

          <div className="flex-1 h-px bg-border" />

          <div
            className={`flex items-center gap-2 ${currentStep === 'panel-selection' ? 'font-semibold' : 'text-muted-foreground'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                currentStep === 'panel-selection'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              2
            </div>
            <span>Panel Members</span>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'room-assignment' && (
          <RoomAssignmentStep monsters={monsters} onComplete={handleRoomAssignmentComplete} />
        )}

        {currentStep === 'panel-selection' && (
          <PanelMemberSelectionStep
            availableMembers={panelMembers}
            onComplete={handlePanelSelectionComplete}
            onBack={handleBack}
          />
        )}

        {isPending && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="text-lg font-semibold">Creating analysis...</div>
              <div className="text-sm text-muted-foreground">Please wait</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
