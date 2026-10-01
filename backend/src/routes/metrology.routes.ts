import { Router, Request, Response } from 'express';
import { MetrologyEngine, AccuracyClass } from '../services/metrology.service';

export const metrologyRouter = Router();

/**
 * POST /api/metrology/calculate-turning-point
 * Evaluates OIML R 76-1:2006 Clause A.4.4.3 turning point:
 * P = I + 0.5e - dL
 * E = P - L
 * Ec = E - E0
 */
metrologyRouter.post('/calculate-turning-point', (req: Request, res: Response) => {
  try {
    const {
      nominalLoad_L,
      indicatedVal_I,
      turningPoint_dL,
      zeroError_E0,
      verificationInterval_e,
      accuracyClass,
    } = req.body;

    if (nominalLoad_L === undefined || indicatedVal_I === undefined || turningPoint_dL === undefined) {
      return res.status(400).json({
        error: 'Missing required parameters: nominalLoad_L, indicatedVal_I, turningPoint_dL',
      });
    }

    const result = MetrologyEngine.evaluateTurningPoint(
      {
        nominalLoad_L,
        indicatedVal_I,
        turningPoint_dL,
        zeroError_E0: zeroError_E0 || 0,
      },
      verificationInterval_e || 0.001,
      (accuracyClass as AccuracyClass) || 'CLASS_II'
    );

    return res.json({
      success: true,
      standard: 'OIML R 76-1:2006 Clause A.4.4.3',
      result,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/metrology/evaluate-series
 * Batch evaluates an array of weighing test observations
 */
metrologyRouter.post('/evaluate-series', (req: Request, res: Response) => {
  try {
    const { observations, verificationInterval_e, accuracyClass } = req.body;

    if (!Array.isArray(observations) || observations.length === 0) {
      return res.status(400).json({ error: 'observations must be a non-empty array' });
    }

    const result = MetrologyEngine.evaluateWeighingSeries(
      observations,
      verificationInterval_e || 0.001,
      (accuracyClass as AccuracyClass) || 'CLASS_II'
    );

    return res.json({
      success: true,
      standard: 'OIML R 76-1:2006 Clause A.4.4',
      ...result,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/metrology/evaluate-eccentricity
 * Evaluates Clause 3.6.2 & A.4.7 eccentricity loading tolerances
 */
metrologyRouter.post('/evaluate-eccentricity', (req: Request, res: Response) => {
  try {
    const { centerP, quadrantPValues, verificationInterval_e } = req.body;

    if (centerP === undefined || !Array.isArray(quadrantPValues)) {
      return res.status(400).json({ error: 'centerP and quadrantPValues array are required' });
    }

    const result = MetrologyEngine.evaluateEccentricity(
      Number(centerP),
      quadrantPValues,
      Number(verificationInterval_e || 0.001)
    );

    return res.json({
      success: true,
      standard: 'OIML R 76-1:2006 Clause 3.6.2 & A.4.7',
      result,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/metrology/validate-uncertainty
 * Clause 3.7.1: Verification weights expanded uncertainty U <= 1/3 MPE
 */
metrologyRouter.post('/validate-uncertainty', (req: Request, res: Response) => {
  try {
    const { expandedUncertainty_U, applicableMpe } = req.body;

    if (expandedUncertainty_U === undefined || applicableMpe === undefined) {
      return res.status(400).json({ error: 'expandedUncertainty_U and applicableMpe are required' });
    }

    const result = MetrologyEngine.validateStandardUncertainty(
      Number(expandedUncertainty_U),
      Number(applicableMpe)
    );

    return res.json({
      success: true,
      standard: 'OIML R 76-1:2006 Clause 3.7.1',
      result,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
