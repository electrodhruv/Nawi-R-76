import Decimal from 'decimal.js';
import { RulePackDefinition, MetrologicalRuleDefinition } from './rule-types';

/**
 * Metadata definition for OIML R 76-1:2006 Table 6 MPE Rule.
 */
export const RULE_R76_2006_TABLE6_MPE: MetrologicalRuleDefinition = {
  ruleId: 'RULE_R76_2006_TABLE6_MPE',
  standard: 'OIML R 76-1',
  standardVersion: '2006 (E)',
  clauseReference: '3.5.1 Table 6',
  title: 'Maximum Permissible Errors for Initial Verification and Pattern Evaluation',
  applicability: {
    description:
      'Applicable to all non-automatic weighing instruments undergoing type examination / pattern evaluation and initial verification.',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
  },
  inputDefinitions: [
    {
      name: 'accuracyClass',
      type: 'STRING',
      description: 'Accuracy class of the instrument (Class I, II, III, or IIII)',
    },
    {
      name: 'load',
      type: 'DECIMAL',
      unit: 'mass',
      description: 'Test load L applied to the load receptor',
    },
    {
      name: 'e',
      type: 'DECIMAL',
      unit: 'mass',
      description: 'Verification scale interval e (in identical mass units as load)',
    },
  ],
  calculationDescription:
    'Derives the load expressed in verification scale intervals m = load / e, matches m against the class-specific tier boundaries from Table 6, and scales the MPE factor (0.5, 1.0, or 1.5) by e.',
  thresholdInformation: {
    expression: '|MPE| = factor * e, where factor in {0.5, 1.0, 1.5}',
    description:
      'Stepwise linear tolerance threshold defined in terms of verification scale intervals e.',
  },
  passFailLogicMetadata: {
    condition: '|Ec| <= |MPE|',
    explanation:
      'The corrected error of indication Ec must not exceed the absolute maximum permissible error |MPE| for the applied load.',
  },
  testReferences: [
    'OIML R 76-1:2006 Clause 3.5.1 Table 6',
    'OIML R 76-1:2006 Clause 3.2 Table 3',
    'OIML R 76-2:2007 Annex A Form 1',
  ],
};

/**
 * Authoritative Rule Pack for OIML R 76-1:2006 (Version R76-2006-v1).
 */
export const OIML_R76_2006_V1: RulePackDefinition = {
  rulePackVersion: 'R76-2006-v1',
  standard: 'OIML R 76-1',
  standardVersion: '2006 (E)',
  description:
    'Canonical normative rules and Table 6 MPE limits under OIML R 76-1:2006 (E) for Non-Automatic Weighing Instruments.',
  table6Rules: {
    CLASS_I: {
      accuracyClass: 'CLASS_I',
      minN: new Decimal(50000),
      maxN: null, // No upper limit under Table 3
      tiers: [
        {
          tier: 'TIER_1',
          maxMInE: new Decimal(50000),
          mpeFactor: new Decimal(0.5),
        },
        {
          tier: 'TIER_2',
          maxMInE: new Decimal(200000),
          mpeFactor: new Decimal(1.0),
        },
        {
          tier: 'TIER_3',
          maxMInE: null, // m > 200,000
          mpeFactor: new Decimal(1.5),
        },
      ],
    },
    CLASS_II: {
      accuracyClass: 'CLASS_II',
      minN: new Decimal(100),
      maxN: new Decimal(100000),
      tiers: [
        {
          tier: 'TIER_1',
          maxMInE: new Decimal(5000),
          mpeFactor: new Decimal(0.5),
        },
        {
          tier: 'TIER_2',
          maxMInE: new Decimal(20000),
          mpeFactor: new Decimal(1.0),
        },
        {
          tier: 'TIER_3',
          maxMInE: new Decimal(100000),
          mpeFactor: new Decimal(1.5),
        },
      ],
    },
    CLASS_III: {
      accuracyClass: 'CLASS_III',
      minN: new Decimal(100),
      maxN: new Decimal(10000),
      tiers: [
        {
          tier: 'TIER_1',
          maxMInE: new Decimal(500),
          mpeFactor: new Decimal(0.5),
        },
        {
          tier: 'TIER_2',
          maxMInE: new Decimal(2000),
          mpeFactor: new Decimal(1.0),
        },
        {
          tier: 'TIER_3',
          maxMInE: new Decimal(10000),
          mpeFactor: new Decimal(1.5),
        },
      ],
    },
    CLASS_IIII: {
      accuracyClass: 'CLASS_IIII',
      minN: new Decimal(100),
      maxN: new Decimal(1000),
      tiers: [
        {
          tier: 'TIER_1',
          maxMInE: new Decimal(50),
          mpeFactor: new Decimal(0.5),
        },
        {
          tier: 'TIER_2',
          maxMInE: new Decimal(200),
          mpeFactor: new Decimal(1.0),
        },
        {
          tier: 'TIER_3',
          maxMInE: new Decimal(1000),
          mpeFactor: new Decimal(1.5),
        },
      ],
    },
  },
  ruleDefinitions: {
    RULE_R76_2006_TABLE6_MPE,
  },
};

/**
 * Registry of supported versioned rule packs.
 */
export const RULE_PACK_REGISTRY: Record<string, RulePackDefinition> = {
  'R76-2006-v1': OIML_R76_2006_V1,
};
