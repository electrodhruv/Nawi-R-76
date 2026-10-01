/**
 * Frontend API Client for Standalone Express Backend Service
 *
 * Communicates with the Express backend (default: http://localhost:5000)
 * directly or through Next.js rewrites (/api/backend, /api/metrology, /api/standards).
 */

export interface BackendHealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  database: {
    configured: boolean;
    type: string;
    connected?: boolean;
    poolStatus?: {
      total: number;
      idle: number;
      waiting: number;
    };
  };
}

export interface BackendTurningPointResponse {
  calculated_P: number;
  error_E: number;
  turningPoint_dL: number;
}

export interface BackendSeriesEvaluationResponse {
  step: number;
  nominalLoad: number;
  indicatedValue: number;
  turningPoint_dL: number;
  calculated_P: number;
  error_E: number;
  zeroError_E0: number;
  correctedError_Ec: number;
  mpe: number;
  isPass: boolean;
  remarks: string;
}

export interface BackendEccentricityResponse {
  maxError: number;
  maxDifference: number;
  allowableDifference: number;
  isCompliant: boolean;
  points: Array<{
    position: string;
    load: number;
    indication: number;
    error_E: number;
    diffFromCenter: number;
    isPass: boolean;
  }>;
}

export interface BackendStandardRecord {
  id: string;
  standard_id?: string;
  code?: string;
  serial_number?: string;
  serialNumber?: string;
  name: string;
  weight_class?: string;
  weightClass?: string;
  nominal_mass?: number;
  nominalMass?: number;
  unit: string;
  expanded_uncertainty?: number;
  expandedUncertainty?: number;
  coverage_factor?: number;
  coverageFactor?: number;
  certificate_number?: string;
  certificateNumber?: string;
  calibration_date?: string;
  calibrationDate?: string;
  valid_until?: string;
  validUntil?: string;
  calibrated_by?: string;
  calibratedBy?: string;
  status: string;
}

class BackendClient {
  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      // In the browser, route through relative rewrites or direct backend URL
      return '';
    }
    return process.env.BACKEND_URL || 'http://localhost:5000';
  }

  /**
   * Performs healthcheck check against the backend service
   */
  async checkHealth(): Promise<BackendHealthResponse | null> {
    try {
      const url = `${this.getBaseUrl()}/api/backend/health`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return null;
      return (await res.json()) as BackendHealthResponse;
    } catch {
      return null;
    }
  }

  /**
   * Fetches reference standards from backend database / fallback
   */
  async getStandards(): Promise<BackendStandardRecord[]> {
    try {
      const url = `${this.getBaseUrl()}/api/standards`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.standards || data;
    } catch (err) {
      console.warn('[BackendClient] Failed to fetch standards from backend:', err);
      return [];
    }
  }

  /**
   * Calculates turning point and intrinsic error via backend metrology engine
   */
  async calculateTurningPoint(
    load: number,
    indicatedValue: number,
    deltaL: number,
    scaleInterval_d: number
  ): Promise<BackendTurningPointResponse> {
    const url = `${this.getBaseUrl()}/api/metrology/calculate-turning-point`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ load, indicatedValue, deltaL, scaleInterval_d }),
    });
    if (!res.ok) {
      throw new Error(`Turning point calculation failed with status ${res.status}`);
    }
    return (await res.json()) as BackendTurningPointResponse;
  }

  /**
   * Evaluates an entire weighing series using backend OIML R 76-1 Table 6 rules
   */
  async evaluateSeries(params: {
    observations: Array<{ load: number; indication: number; deltaL: number }>;
    scaleInterval_d: number;
    verificationInterval_e: number;
    accuracyClass: string;
  }): Promise<BackendSeriesEvaluationResponse[]> {
    const url = `${this.getBaseUrl()}/api/metrology/evaluate-series`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`Series evaluation failed with status ${res.status}`);
    }
    const data = await res.json();
    return data.evaluatedRows || [];
  }

  /**
   * Evaluates eccentricity test observations via backend
   */
  async evaluateEccentricity(params: {
    observations: Array<{ position: string; load: number; indication: number; deltaL?: number }>;
    verificationInterval_e: number;
    receptorType?: string;
  }): Promise<BackendEccentricityResponse> {
    const url = `${this.getBaseUrl()}/api/metrology/evaluate-eccentricity`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`Eccentricity evaluation failed with status ${res.status}`);
    }
    return (await res.json()) as BackendEccentricityResponse;
  }

  /**
   * Validates standard weight calibration uncertainty against verification scale interval e
   */
  async validateUncertainty(
    standardUncertainty: number,
    verificationInterval_e: number
  ): Promise<{ isCompliant: boolean; maxAllowedUncertainty: number; ratio: number }> {
    const url = `${this.getBaseUrl()}/api/metrology/validate-uncertainty`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ standardUncertainty, verificationInterval_e }),
    });
    if (!res.ok) {
      throw new Error(`Uncertainty validation failed with status ${res.status}`);
    }
    return (await res.json()) as { isCompliant: boolean; maxAllowedUncertainty: number; ratio: number };
  }
}

export const backendClient = new BackendClient();
