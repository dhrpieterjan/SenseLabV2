/**
 * Analysis-related types for sensory analysis management
 * This will be stored in cookies temporarily before database implementation
 */

export interface RoomAssignment {
  roomNumber: number; // 1-8
  monsterGUID: string;
  monsterMNID: string;
  monsterCodeMedium?: string;
}

/**
 * Tracks which rooms a tester has completed
 */
export interface TesterProgress {
  testerId: string; // ContactGUID
  completedRoomNumbers: number[]; // Room numbers they've completed
  currentRoomNumber?: number; // Room they're currently working on
  startedAt?: Date;
  lastUpdatedAt?: Date;
}

export interface Analysis {
  analysisId: string; // UUID
  projectCode: string;
  projectGUID: string;
  roomAssignments: RoomAssignment[];
  panelMemberIds: string[]; // ContactGUID[]
  createdAt: Date;
  isActive: boolean; // Whether the analysis is currently active (12-hour window)
  activatedAt?: Date; // When the analysis was activated
  testerProgress: TesterProgress[]; // Track progress for each tester
}

/**
 * Helper type for panel member display
 */
export interface PanelMemberInfo {
  ContactGUID: string;
  ContactFullName: string;
  ContactMail?: string | null;
}

/**
 * Sensory response for a single room - EXACTLY matches TblSensorischeAnalyse structure
 * This will be stored in cookies temporarily before database implementation
 */
export interface SensoryResponse {
  SAGUID: string; // Generated GUID for this response
  SAMonsterID: string | null; // Which room/monster this is for
  SAPanelID: string | null; // ContactGUID of the tester
  SAIntensiteit: number | null; // 0 to 10 with 0.1 increments
  SAAangenaamheid: number | null; // -4 to 4 with 0.1 increments
  SAGeurkarakter: string | null; // Character of the smell
  SAGeuromschrijving: string | null; // Optional description
  SATijdStip: Date | null; // When the response was recorded
  SAGewijzigdDoor: string | null; // User who last modified (for audit)
  SAGewijzigdOp: Date | null; // When last modified (for audit)
}

/**
 * Tester's responses for all rooms in an analysis
 * Stored in cookie keyed by analysisId
 */
export interface TesterResponses {
  analysisId: string;
  testerId: string; // ContactGUID (SAPanelID)
  responses: SensoryResponse[]; // One per room completed
  lastUpdatedAt: Date;
}

/**
 * Stored in cookie - serialized analyses
 */
export type AnalysesCookie = Analysis[];

/**
 * Stored in cookie - tester's responses for analyses they're participating in
 * Array of TesterResponses, one per analysis
 */
export type TesterResponsesCookie = TesterResponses[];
