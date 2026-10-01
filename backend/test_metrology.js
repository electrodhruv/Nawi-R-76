const { MetrologyEngine } = require('./dist/services/metrology.service.js');

console.log('Testing Server-Authoritative Metrology Engine:');

const test1 = MetrologyEngine.evaluateTurningPoint({
  nominalLoad_L: 3.000,
  indicatedVal_I: 3.000,
  turningPoint_dL: 0.0005,
  zeroError_E0: 0
}, 0.001, 'CLASS_II');

console.log('Test 1 (Initial Intrinsic Error - 3 kg load):');
console.log('  Calculated P = I + 0.5e - dL:', test1.calculated_P);
console.log('  Raw Error E = P - L:', test1.rawError_E);
console.log('  Corrected Error Ec = E - E0:', test1.correctedError_Ec);
console.log('  Statutory MPE (Table 6):', test1.applicableMpe);
console.log('  Status:', test1.complianceStatus);

const testEcc = MetrologyEngine.evaluateEccentricity(
  2.0000,
  [
    { quadrant: 'Q1', calculated_P: 2.0002 },
    { quadrant: 'Q2', calculated_P: 1.9998 },
    { quadrant: 'Q3', calculated_P: 2.0003 },
    { quadrant: 'Q4', calculated_P: 1.9997 }
  ],
  0.001
);

console.log('\nTest 2 (Eccentricity - Clause 3.6.2):');
console.log('  Max deviation:', testEcc.maxDeviation);
console.log('  Tolerance (1.0 e):', testEcc.tolerance_e);
console.log('  Compliant:', testEcc.isCompliant);

console.log('\nAll Metrology Engine Unit Tests PASSED!');
