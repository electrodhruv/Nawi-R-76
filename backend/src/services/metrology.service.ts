import Decimal from 'decimal.js';

export type AccuracyClass = 'CLASS_I' | 'CLASS_II' | 'CLASS_III' | 'CLASS_IIII';

export interface TurningPointObservation {
  nominalLoad_L: number | string;
  indicatedVal_I: number | string;
  turningPoint_dL: number | string;
  zeroError_E0?: number | string;
}

export interface CalculatedObservationResult {
  nominalLoad_L: number;
  indicatedVal_I: number;
  turningPoint_dL: number;
  calculated_P: number;
  rawError_E: number;
  zeroError_E0: number;
  correctedError_Ec: number;
  applicableMpe: number;
  complianceStatus: 'PASS' | 'FAIL';
  mpeTier: 'TIER_1' | 'TIER_2' | 'TIER_3';
}

export class MetrologyEngine {
  /**
   * OIML R 76-1:2006 Table 6: Maximum Permissible Errors on initial verification
   * Returns statutory MPE in units of verification scale interval (e)
   */
  public static getTable6MpeFactor(accuracyClass: AccuracyClass, loadInDivisions: Decimal): Decimal {
    const m = loadInDivisions.abs();

    switch (accuracyClass) {
      case 'CLASS_I':
        if (m.lte(50000)) return new Decimal(0.5);
        if (m.lte(200000)) return new Decimal(1.0);
        return new Decimal(1.5);

      case 'CLASS_II':
        if (m.lte(5000)) return new Decimal(0.5);
        if (m.lte(20000)) return new Decimal(1.0);
        return new Decimal(1.5);

      case 'CLASS_III':
        if (m.lte(500)) return new Decimal(0.5);
        if (m.lte(2000)) return new Decimal(1.0);
        return new Decimal(1.5);

      case 'CLASS_IIII':
        if (m.lte(50)) return new Decimal(0.5);
        if (m.lte(200)) return new Decimal(1.0);
        return new Decimal(1.5);

      default:
        return new Decimal(1.0);
    }
  }

  /**
   * Clause A.4.4.3: Turning point error calculation
   * P = I + 0.5e - dL
   * E = P - L
   * Ec = E - E0
   */
  public static evaluateTurningPoint(
    obs: TurningPointObservation,
    verificationInterval_e: number | string,
    accuracyClass: AccuracyClass = 'CLASS_II'
  ): CalculatedObservationResult {
    const L = new Decimal(obs.nominalLoad_L);
    const I = new Decimal(obs.indicatedVal_I);
    const dL = new Decimal(obs.turningPoint_dL);
    const E0 = new Decimal(obs.zeroError_E0 || 0);
    const e = new Decimal(verificationInterval_e);

    // Clause A.4.4.3: P = I + 0.5e - dL
    const P = I.plus(e.times(0.5)).minus(dL);

    // Error before zero correction: E = P - L
    const E = P.minus(L);

    // Corrected error: Ec = E - E0
    const Ec = E.minus(E0);

    // Table 6 MPE
    const divisions_m = L.abs().dividedBy(e);
    const mpeFactor = this.getTable6MpeFactor(accuracyClass, divisions_m);
    const applicableMpe = mpeFactor.times(e);

    // Compliance: |Ec| <= MPE
    const isCompliant = Ec.abs().lte(applicableMpe.plus(0.0000001));

    let tier: 'TIER_1' | 'TIER_2' | 'TIER_3' = 'TIER_1';
    if (mpeFactor.equals(1.0)) tier = 'TIER_2';
    else if (mpeFactor.equals(1.5)) tier = 'TIER_3';

    return {
      nominalLoad_L: L.toNumber(),
      indicatedVal_I: I.toNumber(),
      turningPoint_dL: dL.toNumber(),
      calculated_P: P.toNumber(),
      rawError_E: E.toNumber(),
      zeroError_E0: E0.toNumber(),
      correctedError_Ec: Ec.toNumber(),
      applicableMpe: applicableMpe.toNumber(),
      complianceStatus: isCompliant ? 'PASS' : 'FAIL',
      mpeTier: tier,
    };
  }

  /**
   * Clause 3.6.2 & A.4.7.1–3: Eccentricity evaluation
   * Max deviation |P_quadrant - P_center| must not exceed 1.0 e
   */
  public static evaluateEccentricity(
    centerP: number,
    quadrantPValues: { quadrant: string; calculated_P: number }[],
    verificationInterval_e: number
  ): { maxDeviation: number; tolerance_e: number; isCompliant: boolean } {
    const e = new Decimal(verificationInterval_e);
    let maxDiff = new Decimal(0);

    for (const q of quadrantPValues) {
      const diff = new Decimal(q.calculated_P).minus(centerP).abs();
      if (diff.gt(maxDiff)) {
        maxDiff = diff;
      }
    }

    return {
      maxDeviation: maxDiff.toNumber(),
      tolerance_e: e.toNumber(),
      isCompliant: maxDiff.lte(e.plus(0.0000001)),
    };
  }

  /**
   * Clause 3.7.1: Reference standard uncertainty check
   * Standard weights expanded uncertainty U must satisfy: U <= 1/3 MPE
   */
  public static validateStandardUncertainty(
    expandedUncertainty_U: number,
    applicableMpe: number
  ): { isAcceptable: boolean; maxAllowedUncertainty: number } {
    const maxAllowed = new Decimal(applicableMpe).dividedBy(3);
    const u = new Decimal(expandedUncertainty_U);
    return {
      isAcceptable: u.lte(maxAllowed.plus(0.0000001)),
      maxAllowedUncertainty: maxAllowed.toNumber(),
    };
  }

  /**
   * Evaluates an entire series of weighing load observations.
   */
  public static evaluateWeighingSeries(
    observations: TurningPointObservation[],
    verificationInterval_e: number | string,
    accuracyClass: AccuracyClass = 'CLASS_II'
  ): {
    rows: CalculatedObservationResult[];
    allPassed: boolean;
    maxObservedError: number;
  } {
    const rows = observations.map((obs) =>
      this.evaluateTurningPoint(obs, verificationInterval_e, accuracyClass)
    );
    const allPassed = rows.every((r) => r.complianceStatus === 'PASS');
    const maxObservedError = rows.length > 0 ? Math.max(...rows.map((r) => Math.abs(r.correctedError_Ec))) : 0;
    return { rows, allPassed, maxObservedError };
  }
}
