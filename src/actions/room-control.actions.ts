'use server';

import { roomControlService } from '@/services/room-control.service';
import type { RoomStatus } from '@/services/room-control.service';

/**
 * Server actions for room control operations
 */

/**
 * Get current room system status
 */
export async function getRoomStatus(): Promise<{
  success: boolean;
  data?: RoomStatus;
  error?: string;
}> {
  return roomControlService.getStatus();
}

/**
 * Pressurize the system
 */
export async function pressurizeSystem(): Promise<{
  success: boolean;
  data?: { state: string };
  error?: string;
}> {
  return roomControlService.pressurize();
}

/**
 * Select a specific room
 */
export async function selectRoom(roomId: number): Promise<{
  success: boolean;
  data?: { selected: number };
  error?: string;
}> {
  return roomControlService.selectRoom(roomId);
}

/**
 * Open the selected room
 */
export async function openRoom(): Promise<{
  success: boolean;
  data?: { state: string };
  error?: string;
}> {
  return roomControlService.openRoom();
}

/**
 * Prepare and open a specific room
 * This handles the complete workflow: pressurize -> select -> open
 * Returns detailed log of each step for debugging
 */
export async function prepareAndOpenRoom(roomId: number): Promise<{
  success: boolean;
  steps?: {
    pressurize: boolean;
    select: boolean;
    open: boolean;
  };
  commandLog?: Array<{
    timestamp: string;
    endpoint: string;
    request?: any;
    response?: any;
  }>;
  error?: string;
}> {
  // Validate room ID
  if (roomId < 1 || roomId > 8) {
    console.error('[Actions] prepareAndOpenRoom - Invalid room ID:', roomId);
    return {
      success: false,
      error: `Invalid room ID: ${roomId}. Must be between 1 and 8.`,
    };
  }

  console.log('[Actions] prepareAndOpenRoom - Starting workflow for room', roomId);
  const result = await roomControlService.prepareAndOpenRoom(roomId);
  console.log('[Actions] prepareAndOpenRoom - Workflow complete. Success:', result.success);
  return result;
}

/**
 * Close the current session and return system to standby
 */
export async function closeRoomSession(): Promise<{
  success: boolean;
  error?: string;
}> {
  console.log('[Actions] closeRoomSession - Closing session');
  const result = await roomControlService.closeSession();
  console.log('[Actions] closeRoomSession - Session closed. Success:', result.success);
  return result;
}

/**
 * Get system error information
 */
export async function getRoomError(): Promise<{
  success: boolean;
  data?: { error: string };
  error?: string;
}> {
  return roomControlService.getError();
}

/**
 * Check if room control is in mock mode
 */
export async function isRoomControlMockMode(): Promise<boolean> {
  return roomControlService.isMockMode();
}

/**
 * Reset mock state (only works in mock mode, for testing purposes)
 */
export async function resetRoomControlMock(): Promise<void> {
  roomControlService.resetMock();
}
