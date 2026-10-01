/**
 * Types & Data Contracts for NAWI Lab Assistant Knowledge System
 *
 * Implements an extensible knowledge retrieval model for laboratory guidance,
 * OIML R 76 procedures, approved laboratory SOPs, and instrument operating manuals.
 */

export type KnowledgeSourceType =
  | 'OIML_STANDARD'
  | 'LAB_SOP'
  | 'INSTRUMENT_MANUAL'
  | 'APPLICATION_HELP'
  | 'OTHER_APPROVED'
  | 'UNAPPROVED_FALLBACK';

export type KnowledgeDocumentStatus = 'ACTIVE' | 'SUPERSEDED' | 'DRAFT';

export interface KnowledgeSection {
  sectionId: string;
  sectionNumber: string;
  title: string;
  content: string;
  keywords: string[];
  citation: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  sourceType: KnowledgeSourceType;
  instrumentModel?: string; // Associated instrument model if specific to a device
  version: string;
  effectiveDate: string;
  status: KnowledgeDocumentStatus;
  sections: KnowledgeSection[];
}

export type GuidanceActionType =
  | 'EXPLAIN_STEP'
  | 'EXPLAIN_TEST'
  | 'WHAT_TO_ENTER'
  | 'EQUIPMENT_NEEDED'
  | 'EVIDENCE_NEEDED'
  | 'EXPLAIN_ERROR'
  | 'SHOW_PROCEDURE'
  | 'HOW_TO_USE_INSTRUMENT'
  | 'WHY_NOT_APPLICABLE'
  | 'WHAT_PREVENTS_COMPLETION'
  | 'FREE_QUERY';

export interface GuidanceContext {
  evaluationNumber?: string;
  instrumentModel?: string;
  instrumentManufacturer?: string;
  instrumentSerial?: string;
  testCode?: string;
  testName?: string;
  clauseReference?: string;
  stepNumber?: number;
  stepName?: string;
  activeFieldName?: string;
  activeValidationErrors?: string[];
  testStatus?: string;
  isTestApplicable?: boolean;
  requiredEvidenceCount?: number;
  recordedEvidenceCount?: number;
  unrecordedObservationsCount?: number;
}

export interface GuidanceRequest {
  userQuery: string;
  actionType?: GuidanceActionType;
  context: GuidanceContext;
}

export interface GuidanceResponse {
  text: string;
  sourceCitation: string;
  sourceType: KnowledgeSourceType;
  safetyDisclaimer: string;
  relevantFields?: string[];
  matchedDocumentTitle?: string;
  suggestedFollowUps?: string[];
}

export interface TestHelpMetadata {
  testCode: string;
  clause: string;
  testName: string;
  purpose: string;
  setup: string;
  operatorInputs: Array<{
    name: string;
    symbol?: string;
    description: string;
    unit?: string;
    example?: string;
  }>;
  calculatedOutputs: Array<{
    name: string;
    symbol: string;
    formula?: string;
    description: string;
  }>;
  requiredConditions: string;
  evidencePolicy: string;
  completionRequirements: string;
  standardCitation: string;
}
