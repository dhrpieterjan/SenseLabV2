'use server';

import { cookies } from 'next/headers';
import type { Analysis, AnalysesCookie } from '@/lib/analysis-types';
import { z } from 'zod';

const COOKIE_NAME = 'senselab_analyses';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Validation schema for room assignment
const RoomAssignmentSchema = z.object({
  roomNumber: z.number().min(1).max(8),
  monsterGUID: z.string().uuid(),
  monsterMNID: z.string(),
  monsterCodeMedium: z.string().optional(),
});

// Validation schema for tester progress
const TesterProgressSchema = z.object({
  testerId: z.string().uuid(),
  completedRoomNumbers: z.array(z.number().min(1).max(8)),
  currentRoomNumber: z.number().min(1).max(8).optional(),
  startedAt: z.date().optional(),
  lastUpdatedAt: z.date().optional(),
});

// Validation schema for analysis
const AnalysisSchema = z.object({
  analysisId: z.string().uuid(),
  projectCode: z.string().min(1),
  projectGUID: z.string().uuid(),
  roomAssignments: z.array(RoomAssignmentSchema).min(1).max(8),
  panelMemberIds: z.array(z.string().uuid()).min(1).max(6),
  createdAt: z.date(),
  isActive: z.boolean(),
  activatedAt: z.date().optional(),
  testerProgress: z.array(TesterProgressSchema),
});

export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all analyses from cookie
 */
export async function getAnalyses(): Promise<ActionResponse<AnalysesCookie>> {
  try {
    const cookieStore = await cookies();
    const analysesCookie = cookieStore.get(COOKIE_NAME);

    if (!analysesCookie?.value) {
      return { success: true, data: [] };
    }

    const analyses: AnalysesCookie = JSON.parse(analysesCookie.value);

    // Convert date strings back to Date objects and migrate old analyses
    const parsedAnalyses = analyses.map((analysis) => ({
      ...analysis,
      createdAt: new Date(analysis.createdAt),
      activatedAt: analysis.activatedAt ? new Date(analysis.activatedAt) : undefined,
      // Migrate old analyses that don't have the new fields
      isActive: analysis.isActive ?? false,
      testerProgress: analysis.testerProgress ?? [],
    }));

    return { success: true, data: parsedAnalyses };
  } catch (error) {
    console.error('Error getting analyses:', error);
    return { success: false, error: 'Failed to retrieve analyses' };
  }
}

/**
 * Get analyses by project code
 */
export async function getAnalysesByProject(
  projectCode: string
): Promise<ActionResponse<AnalysesCookie>> {
  try {
    const result = await getAnalyses();
    if (!result.success || !result.data) {
      return result;
    }

    const projectAnalyses = result.data.filter((a) => a.projectCode === projectCode);
    return { success: true, data: projectAnalyses };
  } catch (error) {
    console.error('Error getting analyses by project:', error);
    return { success: false, error: 'Failed to retrieve project analyses' };
  }
}

/**
 * Get a specific analysis by ID
 */
export async function getAnalysisById(analysisId: string): Promise<ActionResponse<Analysis>> {
  try {
    const result = await getAnalyses();
    if (!result.success || !result.data) {
      return { success: false, error: 'Failed to retrieve analyses' };
    }

    const analysis = result.data.find((a) => a.analysisId === analysisId);
    if (!analysis) {
      return { success: false, error: 'Analysis not found' };
    }

    return { success: true, data: analysis };
  } catch (error) {
    console.error('Error getting analysis by ID:', error);
    return { success: false, error: 'Failed to retrieve analysis' };
  }
}

/**
 * Save a new analysis to cookie
 */
export async function saveAnalysis(analysis: Analysis): Promise<ActionResponse<Analysis>> {
  try {
    // Ensure dates are Date objects (in case they were serialized as strings)
    const analysisWithDates = {
      ...analysis,
      createdAt: analysis.createdAt instanceof Date ? analysis.createdAt : new Date(analysis.createdAt),
      activatedAt: analysis.activatedAt
        ? (analysis.activatedAt instanceof Date ? analysis.activatedAt : new Date(analysis.activatedAt))
        : undefined,
      testerProgress: analysis.testerProgress.map(tp => ({
        ...tp,
        startedAt: tp.startedAt
          ? (tp.startedAt instanceof Date ? tp.startedAt : new Date(tp.startedAt))
          : undefined,
        lastUpdatedAt: tp.lastUpdatedAt
          ? (tp.lastUpdatedAt instanceof Date ? tp.lastUpdatedAt : new Date(tp.lastUpdatedAt))
          : undefined,
      })),
    };

    // Validate the analysis
    const validatedAnalysis = AnalysisSchema.parse(analysisWithDates);

    // Get existing analyses
    const result = await getAnalyses();
    const existingAnalyses = result.data || [];

    // Check if analysis ID already exists
    if (existingAnalyses.some((a) => a.analysisId === analysis.analysisId)) {
      return { success: false, error: 'Analysis with this ID already exists' };
    }

    // Add new analysis
    const updatedAnalyses = [...existingAnalyses, validatedAnalysis];

    // Save to cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, JSON.stringify(updatedAnalyses), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return { success: true, data: validatedAnalysis };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(', ')}`,
      };
    }
    console.error('Error saving analysis:', error);
    return { success: false, error: 'Failed to save analysis' };
  }
}

/**
 * Update an existing analysis
 */
export async function updateAnalysis(analysis: Analysis): Promise<ActionResponse<Analysis>> {
  try {
    // Ensure dates are Date objects (in case they were serialized as strings)
    const analysisWithDates = {
      ...analysis,
      createdAt: analysis.createdAt instanceof Date ? analysis.createdAt : new Date(analysis.createdAt),
      activatedAt: analysis.activatedAt
        ? (analysis.activatedAt instanceof Date ? analysis.activatedAt : new Date(analysis.activatedAt))
        : undefined,
      testerProgress: analysis.testerProgress.map(tp => ({
        ...tp,
        startedAt: tp.startedAt
          ? (tp.startedAt instanceof Date ? tp.startedAt : new Date(tp.startedAt))
          : undefined,
        lastUpdatedAt: tp.lastUpdatedAt
          ? (tp.lastUpdatedAt instanceof Date ? tp.lastUpdatedAt : new Date(tp.lastUpdatedAt))
          : undefined,
      })),
    };

    // Validate the analysis
    const validatedAnalysis = AnalysisSchema.parse(analysisWithDates);

    // Get existing analyses
    const result = await getAnalyses();
    const existingAnalyses = result.data || [];

    // Find and update the analysis
    const analysisIndex = existingAnalyses.findIndex((a) => a.analysisId === analysis.analysisId);
    if (analysisIndex === -1) {
      return { success: false, error: 'Analysis not found' };
    }

    existingAnalyses[analysisIndex] = validatedAnalysis;

    // Save to cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, JSON.stringify(existingAnalyses), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return { success: true, data: validatedAnalysis };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(', ')}`,
      };
    }
    console.error('Error updating analysis:', error);
    return { success: false, error: 'Failed to update analysis' };
  }
}

/**
 * Delete an analysis
 */
export async function deleteAnalysis(analysisId: string): Promise<ActionResponse> {
  try {
    // Get existing analyses
    const result = await getAnalyses();
    const existingAnalyses = result.data || [];

    // Filter out the analysis to delete
    const updatedAnalyses = existingAnalyses.filter((a) => a.analysisId !== analysisId);

    if (updatedAnalyses.length === existingAnalyses.length) {
      return { success: false, error: 'Analysis not found' };
    }

    // Save to cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, JSON.stringify(updatedAnalyses), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting analysis:', error);
    return { success: false, error: 'Failed to delete analysis' };
  }
}

/**
 * Clear all analyses from cookie
 */
export async function clearAllAnalyses(): Promise<ActionResponse> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return { success: true };
  } catch (error) {
    console.error('Error clearing analyses:', error);
    return { success: false, error: 'Failed to clear analyses' };
  }
}

/**
 * Get analyses where the current user is a panel member
 */
export async function getAnalysesForTester(
  testerId: string
): Promise<ActionResponse<AnalysesCookie>> {
  try {
    const result = await getAnalyses();
    if (!result.success || !result.data) {
      return result;
    }

    const testerAnalyses = result.data.filter((a) => a.panelMemberIds.includes(testerId));
    return { success: true, data: testerAnalyses };
  } catch (error) {
    console.error('Error getting analyses for tester:', error);
    return { success: false, error: 'Failed to retrieve tester analyses' };
  }
}

/**
 * Activate an analysis (sets isActive to true and records activation time)
 */
export async function activateAnalysis(analysisId: string): Promise<ActionResponse<Analysis>> {
  try {
    const result = await getAnalysisById(analysisId);
    if (!result.success || !result.data) {
      return { success: false, error: 'Analysis not found' };
    }

    const analysis = result.data;
    analysis.isActive = true;
    analysis.activatedAt = new Date();

    return await updateAnalysis(analysis);
  } catch (error) {
    console.error('Error activating analysis:', error);
    return { success: false, error: 'Failed to activate analysis' };
  }
}

/**
 * Start testing for a tester (assigns first room or continues from last room)
 */
export async function startTesting(
  analysisId: string,
  testerId: string
): Promise<ActionResponse<{ analysis: Analysis; assignedRoomNumber: number }>> {
  try {
    const result = await getAnalysisById(analysisId);
    if (!result.success || !result.data) {
      return { success: false, error: 'Analysis not found' };
    }

    const analysis = result.data;

    // Check if tester is assigned to this analysis
    if (!analysis.panelMemberIds.includes(testerId)) {
      return { success: false, error: 'Tester not assigned to this analysis' };
    }

    // Find or create tester progress
    let testerProgress = analysis.testerProgress.find((tp) => tp.testerId === testerId);

    if (!testerProgress) {
      // First time - assign random room
      const availableRooms = analysis.roomAssignments.map((ra) => ra.roomNumber);
      const randomIndex = Math.floor(Math.random() * availableRooms.length);
      const assignedRoom = availableRooms[randomIndex];

      testerProgress = {
        testerId,
        completedRoomNumbers: [],
        currentRoomNumber: assignedRoom,
        startedAt: new Date(),
        lastUpdatedAt: new Date(),
      };
      analysis.testerProgress.push(testerProgress);
    } else {
      // Continuing - update timestamp
      testerProgress.lastUpdatedAt = new Date();
    }

    // Save updated analysis
    const updateResult = await updateAnalysis(analysis);
    if (!updateResult.success) {
      console.error('Failed to save progress in startTesting:', updateResult.error);
      return { success: false, error: updateResult.error || 'Failed to save progress' };
    }

    return {
      success: true,
      data: {
        analysis: updateResult.data!,
        assignedRoomNumber: testerProgress.currentRoomNumber!,
      },
    };
  } catch (error) {
    console.error('Error starting testing:', error);
    return { success: false, error: 'Failed to start testing' };
  }
}

/**
 * Complete a room and assign the next one
 */
export async function completeRoom(
  analysisId: string,
  testerId: string,
  roomNumber: number
): Promise<ActionResponse<{ analysis: Analysis; nextRoomNumber?: number; isComplete: boolean }>> {
  try {
    const result = await getAnalysisById(analysisId);
    if (!result.success || !result.data) {
      return { success: false, error: 'Analysis not found' };
    }

    const analysis = result.data;

    // Find tester progress
    const testerProgress = analysis.testerProgress.find((tp) => tp.testerId === testerId);
    if (!testerProgress) {
      return { success: false, error: 'Tester progress not found' };
    }

    // Mark current room as completed
    if (!testerProgress.completedRoomNumbers.includes(roomNumber)) {
      testerProgress.completedRoomNumbers.push(roomNumber);
    }

    // Check if all rooms are done
    const totalRooms = analysis.roomAssignments.length;
    const isComplete = testerProgress.completedRoomNumbers.length >= totalRooms;

    let nextRoomNumber: number | undefined;

    if (!isComplete) {
      // Find next room that hasn't been completed
      const remainingRooms = analysis.roomAssignments
        .map((ra) => ra.roomNumber)
        .filter((rn) => !testerProgress.completedRoomNumbers.includes(rn));

      if (remainingRooms.length > 0) {
        // Assign random room from remaining rooms
        const randomIndex = Math.floor(Math.random() * remainingRooms.length);
        nextRoomNumber = remainingRooms[randomIndex];
        testerProgress.currentRoomNumber = nextRoomNumber;
      }
    } else {
      // All done
      testerProgress.currentRoomNumber = undefined;
    }

    testerProgress.lastUpdatedAt = new Date();

    // Save updated analysis
    const updateResult = await updateAnalysis(analysis);
    if (!updateResult.success) {
      return { success: false, error: 'Failed to save progress' };
    }

    return {
      success: true,
      data: {
        analysis: updateResult.data!,
        nextRoomNumber,
        isComplete,
      },
    };
  } catch (error) {
    console.error('Error completing room:', error);
    return { success: false, error: 'Failed to complete room' };
  }
}
