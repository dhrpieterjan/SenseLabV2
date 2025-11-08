import { db } from '@/lib/db';
import type { Selectable } from 'kysely';
import type { TblMonsters, TblMonstername } from '@/lib/types';

/**
 * Service layer for monster (sample) operations.
 * Returns structured responses with success/error states.
 */

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Base monster type
 */
export type Monster = Selectable<TblMonsters>;

/**
 * Base monstername (sample collection) type
 */
export type Monstername = Selectable<TblMonstername>;

/**
 * Extended monster type with monstername date
 */
export interface MonsterWithDate extends Monster {
  MNDatum?: Date | null;
}

/**
 * The GUID for sensory analysis (sensorische analyse)
 */
const SENSORY_ANALYSIS_ID = '8B45474B-B1BE-438D-A877-6BB7019D087C';

/**
 * Get all monsters for a specific project (by ProjectCode) that have sensory analysis.
 * Includes the sample collection date (MNDatum) from tbl_Monstername.
 *
 * @param projectCode - The project code to filter by
 */
export async function getMonstersByProjectCode(
  projectCode: string
): Promise<ServiceResponse<MonsterWithDate[]>> {
  try {
    // First get the project GUID from the project code
    const project = await db
      .selectFrom('tbl_Projecten')
      .select('ProjectGUID')
      .where('ProjectCode', '=', projectCode)
      .executeTakeFirst();

    if (!project) {
      return {
        success: false,
        error: 'Project not found',
      };
    }

    // Get all monsters for this project with sensory analysis
    const monsters = await db
      .selectFrom('tbl_Monsters')
      .innerJoin('tbl_Monstername', 'tbl_Monsters.MonsterMNID', 'tbl_Monstername.MonsternameGUID')
      .where('tbl_Monsters.MonsterProjectID', '=', project.ProjectGUID)
      .where('tbl_Monsters.MonsterAnalyseID', '=', SENSORY_ANALYSIS_ID)
      .select([
        'tbl_Monsters.MonsterGUID',
        'tbl_Monsters.MonsterMNID',
        'tbl_Monsters.MonsterMPID',
        'tbl_Monsters.MonsterProjectID',
        'tbl_Monsters.MonsterAnalyseID',
        'tbl_Monsters.MonsterStart',
        'tbl_Monsters.MonsterStop',
        'tbl_Monsters.MonsterStatus',
        'tbl_Monsters.MonsterCodeMedium',
        'tbl_Monstername.MNDatum',
      ])
      .orderBy('tbl_Monstername.MNDatum', 'desc')
      .execute();

    return {
      success: true,
      data: monsters,
    };
  } catch (error) {
    console.error('Error fetching monsters by project code:', error);
    return {
      success: false,
      error: 'Failed to fetch monsters',
    };
  }
}

/**
 * Get all unique sample collection dates for a project.
 * Returns dates where there are monsters with sensory analysis.
 *
 * @param projectCode - The project code to filter by
 */
export async function getSampleDatesByProjectCode(
  projectCode: string
): Promise<ServiceResponse<Date[]>> {
  try {
    // First get the project GUID from the project code
    const project = await db
      .selectFrom('tbl_Projecten')
      .select('ProjectGUID')
      .where('ProjectCode', '=', projectCode)
      .executeTakeFirst();

    if (!project) {
      return {
        success: false,
        error: 'Project not found',
      };
    }

    // Get all distinct dates from monstername for this project with sensory analysis
    const dates = await db
      .selectFrom('tbl_Monstername')
      .innerJoin('tbl_Monsters', 'tbl_Monstername.MonsternameGUID', 'tbl_Monsters.MonsterMNID')
      .where('tbl_Monstername.MNProjectID', '=', project.ProjectGUID)
      .where('tbl_Monsters.MonsterAnalyseID', '=', SENSORY_ANALYSIS_ID)
      .select('tbl_Monstername.MNDatum')
      .distinct()
      .orderBy('tbl_Monstername.MNDatum', 'desc')
      .execute();

    // Filter out null dates and extract the date values
    const dateValues = dates.map((d) => d.MNDatum).filter((date): date is Date => date !== null);

    return {
      success: true,
      data: dateValues,
    };
  } catch (error) {
    console.error('Error fetching sample dates by project code:', error);
    return {
      success: false,
      error: 'Failed to fetch sample dates',
    };
  }
}

/**
 * Get monsters filtered by project code and optional date.
 *
 * @param projectCode - The project code to filter by
 * @param date - Optional date to filter by (if provided, only monsters from that date are returned)
 */
export async function getMonstersByProjectCodeAndDate(
  projectCode: string,
  date?: Date
): Promise<ServiceResponse<MonsterWithDate[]>> {
  try {
    // First get the project GUID from the project code
    const project = await db
      .selectFrom('tbl_Projecten')
      .select('ProjectGUID')
      .where('ProjectCode', '=', projectCode)
      .executeTakeFirst();

    if (!project) {
      return {
        success: false,
        error: 'Project not found',
      };
    }

    // Build the query
    let query = db
      .selectFrom('tbl_Monsters')
      .innerJoin('tbl_Monstername', 'tbl_Monsters.MonsterMNID', 'tbl_Monstername.MonsternameGUID')
      .where('tbl_Monsters.MonsterProjectID', '=', project.ProjectGUID)
      .where('tbl_Monsters.MonsterAnalyseID', '=', SENSORY_ANALYSIS_ID);

    // Add date filter if provided
    if (date) {
      query = query.where('tbl_Monstername.MNDatum', '=', date);
    }

    const monsters = await query
      .select([
        'tbl_Monsters.MonsterGUID',
        'tbl_Monsters.MonsterMNID',
        'tbl_Monsters.MonsterMPID',
        'tbl_Monsters.MonsterProjectID',
        'tbl_Monsters.MonsterAnalyseID',
        'tbl_Monsters.MonsterStart',
        'tbl_Monsters.MonsterStop',
        'tbl_Monsters.MonsterStatus',
        'tbl_Monsters.MonsterCodeMedium',
        'tbl_Monstername.MNDatum',
      ])
      .orderBy('tbl_Monstername.MNDatum', 'desc')
      .execute();

    return {
      success: true,
      data: monsters,
    };
  } catch (error) {
    console.error('Error fetching monsters by project code and date:', error);
    return {
      success: false,
      error: 'Failed to fetch monsters',
    };
  }
}
