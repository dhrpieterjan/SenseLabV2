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

// Validation schema for analysis
const AnalysisSchema = z.object({
  analysisId: z.string().uuid(),
  projectCode: z.string().min(1),
  projectGUID: z.string().uuid(),
  roomAssignments: z.array(RoomAssignmentSchema).min(1).max(8),
  panelMemberIds: z.array(z.string().uuid()).min(1).max(6),
  createdAt: z.date(),
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

    // Convert date strings back to Date objects
    const parsedAnalyses = analyses.map((analysis) => ({
      ...analysis,
      createdAt: new Date(analysis.createdAt),
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
    // Validate the analysis
    const validatedAnalysis = AnalysisSchema.parse(analysis);

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
        error: `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
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
    // Validate the analysis
    const validatedAnalysis = AnalysisSchema.parse(analysis);

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
        error: `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
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
