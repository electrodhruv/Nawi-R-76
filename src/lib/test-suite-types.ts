/**
 * Test Suite Types & Models for NAWI-R76 Complete Testing Module
 *
 * Implements authoritative types for the complete applicable test plan:
 * Administrative, Construction, Weighing Performance, Eccentricity,
 * Discrimination, Repeatability, Creep, Zero Return, Stability of Equilibrium,
 * Temperature Sequence, Voltage Variation, Damp Heat, and Span Stability.
 */

export type TestStatusCode =
  | 'NOT_TESTED'
  | 'IN_PROGRESS'
  | 'PASS'
  | 'FAIL'
  | 'INCOMPLETE'
  | 'INCONCLUSIVE'
  | 'NOT_APPLICABLE'
  | 'RETEST_REQUIRED';

export interface ChecklistItem {
  id: string;
  requirement: string;
  clause: string;
  observation: string;
  status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE';
  remarks?: string;
}

export interface AdminChecklistData {
  items: ChecklistItem[];
  allChecked: boolean;
}

export interface ConstructionChecklistData {
  items: ChecklistItem[];
  allChecked: boolean;
}

export interface WeighingObsPoint {
  id: string;
  step: number;
  direction: 'INC' | 'DEC';
  load: number;
  indication: number;
  deltaL: number;
  calculated_P?: number;
  error_E?: number;
  zeroError_E0?: number;
  correctedError_Ec?: number;
  applicableMpe?: number;
  isPass?: boolean;
}

export interface WeighingPerformanceData {
  observations: WeighingObsPoint[];
}

export interface EccentricityObsPoint {
  id: string;
  position: string;
  load: number;
  indication: number;
  deltaL: number;
  calculated_P?: number;
  error_E?: number;
  diffFromCenter?: number;
  isPass?: boolean;
}

export interface EccentricityData {
  receptorType: 'STANDARD_PAN' | 'ROLLING_TRACK' | 'MOBILE_SCALE';
  testLoad: number;
  observations: EccentricityObsPoint[];
  maxDiff?: number;
  mpeAllowed?: number;
}

export interface DiscriminationPoint {
  id: string;
  loadPointName: string;
  load: number;
  indicationBefore: number;
  extraLoad_1_4d: number;
  indicationAfter: number;
  observedDelta: number;
  requiredResponse: string;
  isPass: boolean;
  remarks?: string;
}

export interface DiscriminationData {
  points: DiscriminationPoint[];
}

export interface RepeatabilityWeighing {
  id: string;
  repetitionIndex: number;
  load: number;
  indication: number;
  deltaL: number;
  calculated_P?: number;
  error_E?: number;
}

export interface RepeatabilitySeries {
  seriesName: string;
  nominalLoad: number;
  targetPercent: number;
  weighings: RepeatabilityWeighing[];
  maxError?: number;
  minError?: number;
  span?: number;
  mpeMagnitude?: number;
  isCompliant?: boolean;
}

export interface RepeatabilityData {
  series1: RepeatabilitySeries;
  series2: RepeatabilitySeries;
  requiredObservationsPerSeries: number;
}

export interface CreepTimePoint {
  id: string;
  elapsedMinutes: number;
  indication: number;
  deltaL: number;
  calculated_P?: number;
  driftFromInitial?: number;
}

export interface CreepData {
  appliedLoad: number;
  initialReading_P0?: number;
  observations: CreepTimePoint[];
  earlyTerminationQualified?: boolean;
  earlyTerminatedAt30Min?: boolean;
  isPass?: boolean;
}

export interface ZeroReturnData {
  preLoadZero: number;
  appliedLoad: number;
  removalTimestamp: string;
  residualIndication: number;
  residualDeltaL: number;
  calculatedResidualZero?: number;
  maxPermissibleLimit?: number;
  isPass?: boolean;
}

export interface EquilibriumCheckItem {
  id: string;
  condition: string;
  operationAttempted: string;
  expectedBehavior: string;
  observedBehavior: string;
  isPass: boolean;
  remarks?: string;
}

export interface EquilibriumData {
  checks: EquilibriumCheckItem[];
}

export interface TemperatureStage {
  id: string;
  stageNumber: number;
  stageName: string;
  targetTempC: number;
  actualTempC: number;
  chamberHumidityRh: number;
  zeroIndication: number;
  zeroDeltaL: number;
  maxLoad: number;
  maxLoadIndication: number;
  maxLoadDeltaL: number;
  calculated_P_zero?: number;
  calculated_P_max?: number;
  correctedError?: number;
  zeroShiftPer5C?: number;
  isPass?: boolean;
}

export interface TemperatureData {
  stages: TemperatureStage[];
  referenceTempC: number;
}

export interface VoltageConditionPoint {
  id: string;
  conditionName: string;
  supplyType: 'AC_MAINS' | 'BATTERY';
  targetVoltage: string;
  actualVoltage: number;
  load: number;
  indication: number;
  deltaL: number;
  calculatedError?: number;
  mpe?: number;
  blankingBehaviorObserved?: string;
  isPass: boolean;
}

export interface VoltageData {
  supplyType: 'AC_MAINS' | 'BATTERY' | 'DUAL';
  nominalVoltage: string;
  points: VoltageConditionPoint[];
}

export interface DampHeatData {
  chamberTempC: number;
  chamberHumidityRh: number;
  durationHours: number;
  preExposureZero: number;
  preExposureMaxError: number;
  duringExposureZero: number;
  duringExposureMaxError: number;
  postRecoveryZero: number;
  postRecoveryMaxError: number;
  zeroShift: number;
  mpeTolerance: number;
  isPass: boolean;
}

export interface SpanStabilityRun {
  runIndex: number;
  dayNumber: number;
  testDate: string;
  referenceLoad: number;
  indication: number;
  deltaL: number;
  ambientTempC: number;
  ambientHumidityRh: number;
  calculated_P?: number;
  error?: number;
  driftFromDay0?: number;
  status: 'COMPLETED' | 'SCHEDULED';
}

export interface SpanStabilityData {
  runs: SpanStabilityRun[];
  maxDriftAllowed: number;
  overallCompliant?: boolean;
}

export interface TestEvidenceItem {
  id: string;
  fileName: string;
  dataUrl?: string;
  mimeType: string;
  timestamp: string;
  description: string;
}

export type WeighingObservationRow = WeighingObsPoint;

export type TestSpecificData =
  | AdminChecklistData
  | ConstructionChecklistData
  | WeighingPerformanceData
  | EccentricityData
  | DiscriminationData
  | RepeatabilityData
  | CreepData
  | ZeroReturnData
  | EquilibriumData
  | TemperatureData
  | VoltageData
  | DampHeatData
  | SpanStabilityData
  | Record<string, unknown>;

export interface TestSuiteItem {
  id: string;
  testCode: string;
  name: string;
  clause: string;
  purpose: string;
  instruction: string;
  isApplicable: boolean;
  exclusionJustification?: string | null;
  status: TestStatusCode;
  remarks?: string;
  evidence: TestEvidenceItem[];
  data: TestSpecificData;
}
