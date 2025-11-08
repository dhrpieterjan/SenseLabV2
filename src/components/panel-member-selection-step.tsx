'use client';

import { useState } from 'react';
import type { PanelMemberInfo } from '@/lib/analysis-types';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface PanelMemberSelectionStepProps {
  availableMembers: PanelMemberInfo[];
  onComplete: (selectedMemberIds: string[]) => void;
  onBack?: () => void;
}

const MAX_PANEL_MEMBERS = 6;

export function PanelMemberSelectionStep({
  availableMembers,
  onComplete,
  onBack,
}: PanelMemberSelectionStepProps) {
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        if (newSet.size >= MAX_PANEL_MEMBERS) {
          alert(`You can select a maximum of ${MAX_PANEL_MEMBERS} panel members`);
          return prev;
        }
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const handleComplete = () => {
    if (selectedMemberIds.size === 0) {
      alert('Please select at least one panel member');
      return;
    }
    onComplete(Array.from(selectedMemberIds));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Panel Members</h3>
        <p className="text-sm text-muted-foreground">
          Select up to {MAX_PANEL_MEMBERS} panel members for this analysis. Each member must be
          unique.
        </p>
      </div>

      {/* Selected Count */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <span className="font-medium">Selected Panel Members:</span>
        <span
          className={`text-lg font-bold ${selectedMemberIds.size === MAX_PANEL_MEMBERS ? 'text-primary' : ''}`}
        >
          {selectedMemberIds.size} / {MAX_PANEL_MEMBERS}
        </span>
      </div>

      {/* Panel Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
        {availableMembers.map((member) => {
          const isSelected = selectedMemberIds.has(member.ContactGUID);
          return (
            <button
              key={member.ContactGUID}
              onClick={() => toggleMember(member.ContactGUID)}
              className={`
                relative border-2 rounded-lg p-4 text-left transition-all
                ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                }
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{member.ContactFullName}</div>
                  {member.ContactMail && (
                    <div className="text-xs text-muted-foreground truncate">{member.ContactMail}</div>
                  )}
                </div>
                {isSelected && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {availableMembers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No panel members available</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleComplete} disabled={selectedMemberIds.size === 0}>
          Create Analysis ({selectedMemberIds.size} members)
        </Button>
      </div>
    </div>
  );
}
