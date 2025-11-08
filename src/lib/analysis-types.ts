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

export interface Analysis {
  analysisId: string; // UUID
  projectCode: string;
  projectGUID: string;
  roomAssignments: RoomAssignment[];
  panelMemberIds: string[]; // ContactGUID[]
  createdAt: Date;
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
 * Stored in cookie - serialized analyses
 */
export type AnalysesCookie = Analysis[];
