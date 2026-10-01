import Decimal from 'decimal.js';
import { AccuracyClass, MPETier } from '../types/metrology';

/**
 * Metadata parameter definition for rule inputs.
 */
export interface RuleInputParameterDefinition {
  name: string;
  type: 'DECIMAL' | 'STRING' | 'INTEGER' | 'BOOLEAN';
  unit?: string;
  description: string;
}

/**
 * Formal, immutable rule definition contract.
 * Serves as the authoritative metadata specification for each standard requirement.
 */
export interface MetrologicalRuleDefinition {
  ruleId: string;
  standard: string;
  standardVersion: string;
  clauseReference: string;
  title: string;
  applicability: {
    description: string;
    applicableClasses: AccuracyClass[];
  };
  inputDefinitions: RuleInputParameterDefinition[];
  calculationDescription: string;
  thresholdInformation: {
    expression: string;
    description: string;
  };
  passFailLogicMetadata: {
    condition: string;
    explanation: string;
  };
  testReferences: string[];
}

/**
 * Specification for a single Table 6 tier boundary.
 */
export interface Table6TierBoundary {
  tier: MPETier;
  /**
   * Upper inclusive boundary of load in units of e (m <= maxMInE).
   * Null represents unbounded (e.g. m > 200,000 for Class I).
   */
  maxMInE: Decimal | null;
  /**
   * Factor multiplying e (0.5, 1.0, 1.5).
   */
  mpeFactor: Decimal;
}

/**
 * MPE Table 6 specification for a specific accuracy class.
 */
export interface ClassMPESpecification {
  accuracyClass: AccuracyClass;
  /** Nominal minimum number of verification scale intervals (n_min) from Table 3 */
  minN: Decimal;
  /**
   * Nominal maximum number of verification scale intervals (n_max) from Table 3 / Table 6.
   * Null if no upper limit specified (Class I).
   */
  maxN: Decimal | null;
  tiers: Table6TierBoundary[];
}

/**
 * Complete versioned rule-pack container contract.
 */
export interface RulePackDefinition {
  rulePackVersion: string;
  standard: string;
  standardVersion: string;
  description: string;
  table6Rules: Record<AccuracyClass, ClassMPESpecification>;
  ruleDefinitions: Record<string, MetrologicalRuleDefinition>;
}
