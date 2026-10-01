import { Router, Request, Response } from 'express';
import { dbPool } from '../config/database';

export const standardsRouter = Router();

// Fallback standards when database is unmigrated or temporarily offline
const DEFAULT_STANDARDS = [
  {
    id: 'std-001',
    standard_code: 'STD-WT-001',
    description: 'Primary Precision Mass Set E2 (1mg - 10kg)',
    standard_type: 'MASS_STANDARD',
    weight_class: 'E2',
    nominal_range: '1 mg to 10 kg',
    expanded_uncertainty_u: 0.05,
    certificate_number: 'NABL-CAL-2026-0891',
    calibrated_by: 'National Physical Laboratory (NPL), New Delhi',
    calibration_date: '2025-04-01',
    valid_until: '2027-03-31',
    status: 'VALID',
    location: 'Metrology Vault Alpha, Bay 1',
  },
  {
    id: 'std-002',
    standard_code: 'STD-WT-002',
    description: 'Working Standard Mass Set F1 (100g - 50kg)',
    standard_type: 'MASS_STANDARD',
    weight_class: 'F1',
    nominal_range: '100 g to 50 kg',
    expanded_uncertainty_u: 0.15,
    certificate_number: 'RRSL-CAL-2026-0112',
    calibrated_by: 'Regional Reference Standard Laboratory, Ahmedabad',
    calibration_date: '2025-06-15',
    valid_until: '2026-12-31',
    status: 'VALID',
    location: 'Heavy Pan Testing Station',
  },
  {
    id: 'std-003',
    standard_code: 'STD-WT-003',
    description: 'Cast Iron Roller Weights M1 (500kg - 20,000kg)',
    standard_type: 'MASS_STANDARD',
    weight_class: 'M1',
    nominal_range: '500 kg to 20,000 kg',
    expanded_uncertainty_u: 5.0,
    certificate_number: 'RRSL-CAL-2025-0988',
    calibrated_by: 'Regional Reference Standard Laboratory, Ahmedabad',
    calibration_date: '2025-01-10',
    valid_until: '2027-01-09',
    status: 'VALID',
    location: 'Outdoor Weighbridge Bay 3',
  },
  {
    id: 'std-004',
    standard_code: 'STD-ENV-001',
    description: 'Vaisala PTU300 Digital Barometer / Thermo-Hygrometer',
    standard_type: 'BAROMETER',
    weight_class: 'NOT_APPLICABLE',
    nominal_range: '500-1100 hPa / 0-100% RH / -40 to +60 °C',
    expanded_uncertainty_u: 0.1,
    certificate_number: 'ENV-CAL-2026-0044',
    calibrated_by: 'National Accreditation Board for Testing and Calibration',
    calibration_date: '2026-01-05',
    valid_until: '2027-01-04',
    status: 'VALID',
    location: 'Metrology Cleanroom Bench 02',
  },
];

/**
 * GET /api/standards
 * Retrieves all reference standards from PostgreSQL/Supabase, with fallback
 */
standardsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT id, standard_code, description, standard_type, weight_class, nominal_range,
             expanded_uncertainty_u, certificate_number, calibrated_by, calibration_date,
             valid_until, status, location
      FROM reference_standards
      ORDER BY standard_code ASC;
    `;
    const result = await dbPool.query(query);

    if (result.rows && result.rows.length > 0) {
      return res.json({
        source: 'database',
        count: result.rows.length,
        standards: result.rows,
      });
    }

    // If table exists but is empty, return default seeds
    return res.json({
      source: 'fallback_seed',
      count: DEFAULT_STANDARDS.length,
      standards: DEFAULT_STANDARDS,
    });
  } catch (err: any) {
    // If database connection is down, return fallback gracefully
    return res.json({
      source: 'fallback_offline',
      databaseError: err.message,
      count: DEFAULT_STANDARDS.length,
      standards: DEFAULT_STANDARDS,
    });
  }
});

/**
 * GET /api/standards/:code
 * Retrieves a single standard by code
 */
standardsRouter.get('/:code', async (req: Request, res: Response) => {
  const code = String(req.params.code);
  try {
    const query = `SELECT * FROM reference_standards WHERE standard_code = $1 LIMIT 1;`;
    const result = await dbPool.query(query, [code]);

    if (result.rows && result.rows.length > 0) {
      return res.json({ success: true, standard: result.rows[0] });
    }

    const fallback = DEFAULT_STANDARDS.find((s) => s.standard_code.toLowerCase() === code.toLowerCase());
    if (fallback) {
      return res.json({ success: true, standard: fallback });
    }

    return res.status(404).json({ error: `Standard ${code} not found.` });
  } catch (err: any) {
    const fallback = DEFAULT_STANDARDS.find((s) => s.standard_code.toLowerCase() === code.toLowerCase());
    if (fallback) {
      return res.json({ success: true, standard: fallback, notice: 'Returned from fallback cache' });
    }
    return res.status(500).json({ error: err.message });
  }
});
