'use client';

import { useState } from 'react';
import type { RoomAssignment } from '@/lib/analysis-types';
import type { MonsterWithDate } from '@/services/monsters.service';
import { Button } from '@/components/ui/button';

interface RoomAssignmentStepProps {
  monsters: MonsterWithDate[];
  onComplete: (assignments: RoomAssignment[]) => void;
  onBack?: () => void;
}

const ROOM_COUNT = 8;

export function RoomAssignmentStep({ monsters, onComplete, onBack }: RoomAssignmentStepProps) {
  const [assignments, setAssignments] = useState<Map<number, RoomAssignment>>(new Map());

  const handleAssignMonster = (roomNumber: number, monster: MonsterWithDate) => {
    setAssignments((prev) => {
      const newMap = new Map(prev);

      // Remove this monster from any other room first
      for (const [room, assignment] of newMap.entries()) {
        if (assignment.monsterGUID === monster.MonsterGUID) {
          newMap.delete(room);
        }
      }

      // Toggle: if monster is already in this room, remove it; otherwise assign it
      const existingAssignment = newMap.get(roomNumber);
      if (existingAssignment?.monsterGUID === monster.MonsterGUID) {
        newMap.delete(roomNumber);
      } else {
        newMap.set(roomNumber, {
          roomNumber,
          monsterGUID: monster.MonsterGUID,
          monsterMNID: monster.MonsterMNID || '',
          monsterCodeMedium: monster.MonsterCodeMedium || undefined,
        });
      }

      return newMap;
    });
  };

  const handleContinue = () => {
    if (assignments.size === 0) {
      alert('Please assign at least one monster to a room');
      return;
    }
    onComplete(Array.from(assignments.values()));
  };

  const getMonsterRoom = (monsterGUID: string): number | null => {
    for (const [room, assignment] of assignments.entries()) {
      if (assignment.monsterGUID === monsterGUID) {
        return room;
      }
    }
    return null;
  };

  const isRoomOccupied = (roomNumber: number): boolean => {
    return assignments.has(roomNumber);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 1: Assign Monsters to Rooms</h3>
        <p className="text-sm text-muted-foreground">
          Click a room number to assign each monster to that room. Each monster can only be assigned
          to one room (1-8).
        </p>
      </div>

      {/* Monsters List with Room Buttons */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {monsters.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No monsters available for this project
          </p>
        ) : (
          monsters.map((monster) => {
            const assignedRoom = getMonsterRoom(monster.MonsterGUID);
            return (
              <div
                key={monster.MonsterGUID}
                className={`border rounded-lg p-4 transition-all ${
                  assignedRoom ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {monster.MonsterCodeMedium || 'No Code'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {monster.MNDatum
                        ? new Date(monster.MNDatum).toLocaleDateString('nl-BE')
                        : 'No date'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground mr-1">Room:</span>
                    <div className="flex gap-1">
                      {Array.from({ length: ROOM_COUNT }, (_, i) => i + 1).map((roomNum) => {
                        const isAssigned = assignedRoom === roomNum;
                        const isOccupied = isRoomOccupied(roomNum) && !isAssigned;
                        return (
                          <Button
                            key={roomNum}
                            size="sm"
                            variant={isAssigned ? 'default' : isOccupied ? 'outline' : 'ghost'}
                            onClick={() => handleAssignMonster(roomNum, monster)}
                            disabled={isOccupied}
                            className={`w-9 h-9 p-0 text-xs font-semibold ${
                              isAssigned ? 'ring-2 ring-primary ring-offset-2' : ''
                            }`}
                          >
                            {roomNum}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {assignments.size > 0 && (
        <div className="rounded-lg bg-muted p-4">
          <div className="text-sm font-medium mb-2">Assigned Rooms:</div>
          <div className="flex flex-wrap gap-2">
            {Array.from(assignments.entries())
              .sort(([a], [b]) => a - b)
              .map(([roomNum, assignment]) => (
                <span key={roomNum} className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-primary text-primary-foreground rounded">
                  Room {roomNum}: {assignment.monsterCodeMedium || 'No Code'}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <Button onClick={handleContinue} className="ml-auto">
          Continue ({assignments.size} assigned)
        </Button>
      </div>
    </div>
  );
}
