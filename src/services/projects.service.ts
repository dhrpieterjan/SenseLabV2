import { db } from '@/lib/db';
import type { Selectable } from 'kysely';
import type { TblProjecten } from '@/lib/types';

/**
 * Service layer for project operations.
 * Returns structured responses with success/error states.
 */

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Base project type
 */
export type Project = Selectable<TblProjecten>;

/**
 * Extended project type with related information
 */
export interface ProjectWithDetails extends Project {
  RelatieNaam?: string | null;
  ProjectStatus?: string | null;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Paginated response with metadata
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  error?: string;
}

/**
 * The GUID for sensory analysis (sensorische analyse)
 * This filters projects that have sensory analysis samples
 */
const SENSORY_ANALYSIS_ID = '8B45474B-B1BE-438D-A877-6BB7019D087C';

/**
 * Get paginated projects that have sensory analysis samples.
 *
 * This function joins:
 * - tbl_Monsters (filtered by sensory analysis ID)
 * - tbl_Monstername (sample collection)
 * - tbl_Projecten (projects)
 * - tbl_Relaties (client relations)
 * - tbl_ProjectStatus (project status)
 *
 * Returns only projects with sensory analyses with pagination metadata.
 */
export async function getProjectsWithSensoryAnalysisPaginated(
  options: PaginationOptions
): Promise<PaginatedResponse<ProjectWithDetails>> {
  try {
    const { page, pageSize } = options;

    // First, get all distinct projects with their details
    const allProjects = await db
      .selectFrom('tbl_Monsters')
      .innerJoin('tbl_Monstername', 'tbl_Monsters.MonsterMNID', 'tbl_Monstername.MonsternameGUID')
      .innerJoin('tbl_Projecten', 'tbl_Monstername.MNProjectID', 'tbl_Projecten.ProjectGUID')
      .leftJoin('tbl_Relaties', 'tbl_Projecten.ProjectRelatieID', 'tbl_Relaties.RelatieGUID')
      .leftJoin(
        'tbl_ProjectStatus',
        'tbl_Projecten.ProjectStatusID',
        'tbl_ProjectStatus.ProjectStatusGUID'
      )
      .where('tbl_Monsters.MonsterAnalyseID', '=', SENSORY_ANALYSIS_ID)
      .select([
        'tbl_Projecten.ProjectGUID',
        'tbl_Projecten.ProjectCode',
        'tbl_Projecten.ProjectOmschrijving',
        'tbl_Projecten.ProjectDatumStart',
        'tbl_Projecten.ProjectDatumEind',
        'tbl_Projecten.ProjectDeadline',
        'tbl_Projecten.ProjectContactID',
        'tbl_Projecten.ProjectLeiderID',
        'tbl_Projecten.ProjectRelatieID',
        'tbl_Projecten.ProjectStatusID',
        'tbl_Projecten.ProjectVestigingID',
        'tbl_Projecten.ProjectSoortID',
        'tbl_Projecten.ProjectMedewerker',
        'tbl_Projecten.ProjectFolder',
        'tbl_Projecten.ProjectReferteKlant',
        'tbl_Projecten.ProjectOpmerking',
        'tbl_Projecten.ProjectDatumBevestiging',
        'tbl_Projecten.ProjectDatumOfferte',
        'tbl_Projecten.ProjectFacturatiePrijs',
        'tbl_Projecten.ProjectRegie',
        'tbl_Projecten.ProjectAanbrengerID',
        'tbl_Projecten.ProjectVervalID',
        'tbl_Projecten.ProjectMemoVerval',
        'tbl_Projecten.ProjectGewijzigdDoor',
        'tbl_Projecten.ProjectGewijzigdOp',
        'tbl_Relaties.RelatieNaam',
        'tbl_ProjectStatus.ProjectStatus',
      ])
      .distinct()
      .orderBy('tbl_Projecten.ProjectCode', 'desc')
      .execute();

    // Calculate pagination
    const totalCount = allProjects.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Get the paginated slice
    const projects = allProjects.slice(startIndex, endIndex);

    return {
      success: true,
      data: projects,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error fetching paginated projects with sensory analysis:', error);
    return {
      success: false,
      error: 'Failed to fetch projects with sensory analysis',
    };
  }
}

/**
 * Get all projects that have sensory analysis samples (non-paginated).
 * @deprecated Use getProjectsWithSensoryAnalysisPaginated for better performance
 */
export async function getProjectsWithSensoryAnalysis(): Promise<
  ServiceResponse<ProjectWithDetails[]>
> {
  try {
    const projects = await db
      .selectFrom('tbl_Monsters')
      .innerJoin('tbl_Monstername', 'tbl_Monsters.MonsterMNID', 'tbl_Monstername.MonsternameGUID')
      .innerJoin('tbl_Projecten', 'tbl_Monstername.MNProjectID', 'tbl_Projecten.ProjectGUID')
      .leftJoin('tbl_Relaties', 'tbl_Projecten.ProjectRelatieID', 'tbl_Relaties.RelatieGUID')
      .leftJoin(
        'tbl_ProjectStatus',
        'tbl_Projecten.ProjectStatusID',
        'tbl_ProjectStatus.ProjectStatusGUID'
      )
      .where('tbl_Monsters.MonsterAnalyseID', '=', SENSORY_ANALYSIS_ID)
      .select([
        'tbl_Projecten.ProjectGUID',
        'tbl_Projecten.ProjectCode',
        'tbl_Projecten.ProjectOmschrijving',
        'tbl_Projecten.ProjectDatumStart',
        'tbl_Projecten.ProjectDatumEind',
        'tbl_Projecten.ProjectDeadline',
        'tbl_Projecten.ProjectContactID',
        'tbl_Projecten.ProjectLeiderID',
        'tbl_Projecten.ProjectRelatieID',
        'tbl_Projecten.ProjectStatusID',
        'tbl_Projecten.ProjectVestigingID',
        'tbl_Projecten.ProjectSoortID',
        'tbl_Projecten.ProjectMedewerker',
        'tbl_Projecten.ProjectFolder',
        'tbl_Projecten.ProjectReferteKlant',
        'tbl_Projecten.ProjectOpmerking',
        'tbl_Projecten.ProjectDatumBevestiging',
        'tbl_Projecten.ProjectDatumOfferte',
        'tbl_Projecten.ProjectFacturatiePrijs',
        'tbl_Projecten.ProjectRegie',
        'tbl_Projecten.ProjectAanbrengerID',
        'tbl_Projecten.ProjectVervalID',
        'tbl_Projecten.ProjectMemoVerval',
        'tbl_Projecten.ProjectGewijzigdDoor',
        'tbl_Projecten.ProjectGewijzigdOp',
        'tbl_Relaties.RelatieNaam',
        'tbl_ProjectStatus.ProjectStatus',
      ])
      .distinct()
      .orderBy('tbl_Projecten.ProjectCode', 'desc')
      .execute();

    return {
      success: true,
      data: projects,
    };
  } catch (error) {
    console.error('Error fetching projects with sensory analysis:', error);
    return {
      success: false,
      error: 'Failed to fetch projects with sensory analysis',
    };
  }
}

/**
 * Get a specific project by its GUID
 */
export async function getProjectById(
  projectId: string
): Promise<ServiceResponse<ProjectWithDetails>> {
  try {
    const project = await db
      .selectFrom('tbl_Projecten')
      .leftJoin('tbl_Relaties', 'tbl_Projecten.ProjectRelatieID', 'tbl_Relaties.RelatieGUID')
      .leftJoin(
        'tbl_ProjectStatus',
        'tbl_Projecten.ProjectStatusID',
        'tbl_ProjectStatus.ProjectStatusGUID'
      )
      .select([
        'tbl_Projecten.ProjectGUID',
        'tbl_Projecten.ProjectCode',
        'tbl_Projecten.ProjectOmschrijving',
        'tbl_Projecten.ProjectDatumStart',
        'tbl_Projecten.ProjectDatumEind',
        'tbl_Projecten.ProjectDeadline',
        'tbl_Projecten.ProjectContactID',
        'tbl_Projecten.ProjectLeiderID',
        'tbl_Projecten.ProjectRelatieID',
        'tbl_Projecten.ProjectStatusID',
        'tbl_Projecten.ProjectVestigingID',
        'tbl_Projecten.ProjectSoortID',
        'tbl_Projecten.ProjectMedewerker',
        'tbl_Projecten.ProjectFolder',
        'tbl_Projecten.ProjectReferteKlant',
        'tbl_Projecten.ProjectOpmerking',
        'tbl_Projecten.ProjectDatumBevestiging',
        'tbl_Projecten.ProjectDatumOfferte',
        'tbl_Projecten.ProjectFacturatiePrijs',
        'tbl_Projecten.ProjectRegie',
        'tbl_Projecten.ProjectAanbrengerID',
        'tbl_Projecten.ProjectVervalID',
        'tbl_Projecten.ProjectMemoVerval',
        'tbl_Projecten.ProjectGewijzigdDoor',
        'tbl_Projecten.ProjectGewijzigdOp',
        'tbl_Relaties.RelatieNaam',
        'tbl_ProjectStatus.ProjectStatus',
      ])
      .where('tbl_Projecten.ProjectGUID', '=', projectId)
      .executeTakeFirst();

    if (!project) {
      return {
        success: false,
        error: 'Project not found',
      };
    }

    return {
      success: true,
      data: project,
    };
  } catch (error) {
    console.error('Error fetching project:', error);
    return {
      success: false,
      error: 'Failed to fetch project',
    };
  }
}

/**
 * Get a specific project by its project code
 */
export async function getProjectByCode(
  projectCode: string
): Promise<ServiceResponse<ProjectWithDetails>> {
  try {
    const project = await db
      .selectFrom('tbl_Projecten')
      .leftJoin('tbl_Relaties', 'tbl_Projecten.ProjectRelatieID', 'tbl_Relaties.RelatieGUID')
      .leftJoin(
        'tbl_ProjectStatus',
        'tbl_Projecten.ProjectStatusID',
        'tbl_ProjectStatus.ProjectStatusGUID'
      )
      .select([
        'tbl_Projecten.ProjectGUID',
        'tbl_Projecten.ProjectCode',
        'tbl_Projecten.ProjectOmschrijving',
        'tbl_Projecten.ProjectDatumStart',
        'tbl_Projecten.ProjectDatumEind',
        'tbl_Projecten.ProjectDeadline',
        'tbl_Projecten.ProjectContactID',
        'tbl_Projecten.ProjectLeiderID',
        'tbl_Projecten.ProjectRelatieID',
        'tbl_Projecten.ProjectStatusID',
        'tbl_Projecten.ProjectVestigingID',
        'tbl_Projecten.ProjectSoortID',
        'tbl_Projecten.ProjectMedewerker',
        'tbl_Projecten.ProjectFolder',
        'tbl_Projecten.ProjectReferteKlant',
        'tbl_Projecten.ProjectOpmerking',
        'tbl_Projecten.ProjectDatumBevestiging',
        'tbl_Projecten.ProjectDatumOfferte',
        'tbl_Projecten.ProjectFacturatiePrijs',
        'tbl_Projecten.ProjectRegie',
        'tbl_Projecten.ProjectAanbrengerID',
        'tbl_Projecten.ProjectVervalID',
        'tbl_Projecten.ProjectMemoVerval',
        'tbl_Projecten.ProjectGewijzigdDoor',
        'tbl_Projecten.ProjectGewijzigdOp',
        'tbl_Relaties.RelatieNaam',
        'tbl_ProjectStatus.ProjectStatus',
      ])
      .where('tbl_Projecten.ProjectCode', '=', projectCode)
      .executeTakeFirst();

    if (!project) {
      return {
        success: false,
        error: 'Project not found',
      };
    }

    return {
      success: true,
      data: project,
    };
  } catch (error) {
    console.error('Error fetching project by code:', error);
    return {
      success: false,
      error: 'Failed to fetch project',
    };
  }
}
