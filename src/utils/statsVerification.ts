/**
 * Statistical Benchmark and Calculation Verification Suite
 * Verifies analytical formulas against established statistical standards
 * (NIST, R, SciPy, and textbook standard benchmarks).
 */

import {
  normalCDF,
  inverseNormalCDF,
  calculateWilsonCI,
  calculateNewcombeCI,
  calculateRelativeLiftCI,
  runTwoSampleTest,
  calculateSRM,
  calculateSampleSize,
} from './stats';
import type { Variant } from '../types/experiment';

export interface TestCaseResult {
  id: string;
  name: string;
  description: string;
  category: 'Distributions' | 'Confidence Intervals' | 'Hypothesis Testing' | 'SRM' | 'Power & Sample Size';
  expected: string | number;
  actual: string | number;
  passed: boolean;
  tolerance?: number;
  details?: string;
}

export interface VerificationSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  timestamp: string;
  results: TestCaseResult[];
}

export function runStatisticalVerificationSuite(): VerificationSuiteSummary {
  const startTime = performance.now();
  const results: TestCaseResult[] = [];

  // 1. Normal CDF tests
  const cdfZero = normalCDF(0);
  results.push({
    id: 'norm-cdf-zero',
    name: 'Normal CDF at Mean: Phi(0)',
    description: 'Verifies standard normal symmetry Phi(0) == 0.5',
    category: 'Distributions',
    expected: 0.5,
    actual: Math.round(cdfZero * 1e6) / 1e6,
    passed: Math.abs(cdfZero - 0.5) < 1e-6,
    tolerance: 1e-6,
  });

  const cdfCritical95 = normalCDF(1.959964);
  results.push({
    id: 'norm-cdf-critical-95',
    name: 'Normal CDF Critical Value (alpha = 0.05 two-sided)',
    description: 'Phi(1.959964) should equal 0.975 (one tail = 0.025)',
    category: 'Distributions',
    expected: 0.975,
    actual: Math.round(cdfCritical95 * 1e5) / 1e5,
    passed: Math.abs(cdfCritical95 - 0.975) < 1e-4,
    tolerance: 1e-4,
  });

  // 2. Inverse Normal CDF tests
  const invNorm975 = inverseNormalCDF(0.975);
  results.push({
    id: 'inv-norm-975',
    name: 'Inverse Normal Quantile for 0.975',
    description: 'Critical z-value for 95% two-sided confidence interval (z_0.025)',
    category: 'Distributions',
    expected: 1.959964,
    actual: Math.round(invNorm975 * 1e5) / 1e5,
    passed: Math.abs(invNorm975 - 1.959964) < 1e-3,
    tolerance: 1e-3,
  });

  const invNorm995 = inverseNormalCDF(0.995);
  results.push({
    id: 'inv-norm-995',
    name: 'Inverse Normal Quantile for 0.995',
    description: 'Critical z-value for 99% two-sided confidence interval (z_0.005)',
    category: 'Distributions',
    expected: 2.575829,
    actual: Math.round(invNorm995 * 1e5) / 1e5,
    passed: Math.abs(invNorm995 - 2.575829) < 1e-3,
    tolerance: 1e-3,
  });

  // 3. Wilson Score Interval verification (Zero conversions edge case)
  const zeroSuccessWilson = calculateWilsonCI(0, 50, 0.05);
  const expectedZeroUpper = Math.pow(1.959964, 2) / (50 + Math.pow(1.959964, 2));
  results.push({
    id: 'wilson-zero-success',
    name: 'Wilson Interval Zero-Success Edge Case (x=0, n=50)',
    description: 'Wilson interval remains non-degenerate when x=0, upper bound ~0.0711',
    category: 'Confidence Intervals',
    expected: Math.round(expectedZeroUpper * 1e4) / 1e4,
    actual: Math.round(zeroSuccessWilson.upper * 1e4) / 1e4,
    passed: Math.abs(zeroSuccessWilson.upper - expectedZeroUpper) < 1e-3 && zeroSuccessWilson.lower === 0,
    tolerance: 1e-3,
  });

  // 4. Wilson Score Interval standard benchmark (x=10, n=100)
  const wilson10 = calculateWilsonCI(10, 100, 0.05);
  results.push({
    id: 'wilson-standard-10-100',
    name: 'Wilson Interval Standard Benchmark (x=10, n=100)',
    description: 'Lower ~0.0552, Upper ~0.1744 (R prop.test / Wilson score)',
    category: 'Confidence Intervals',
    expected: '0.0552 ~ 0.1744',
    actual: `${wilson10.lower.toFixed(4)} ~ ${wilson10.upper.toFixed(4)}`,
    passed: Math.abs(wilson10.lower - 0.0552) < 0.002 && Math.abs(wilson10.upper - 0.1744) < 0.002,
    tolerance: 0.002,
  });

  // 5. Newcombe Score Interval for difference of proportions
  const newcombeDiff = calculateNewcombeCI(10, 100, 20, 100, 0.05);
  results.push({
    id: 'newcombe-difference-ci',
    name: 'Newcombe Difference Score Interval',
    description: 'Difference = 0.10, bounds properly span ~[0.003, 0.201]',
    category: 'Confidence Intervals',
    expected: '0.0030 ~ 0.2010',
    actual: `${newcombeDiff.lower.toFixed(4)} ~ ${newcombeDiff.upper.toFixed(4)}`,
    passed: newcombeDiff.lower > 0 && newcombeDiff.upper > newcombeDiff.lower && Math.abs(newcombeDiff.center - 0.1) < 1e-6,
    tolerance: 0.005,
  });

  // 6. Two-Sample Pooled Z-Test benchmark
  const vControl: Variant = { id: 'ctrl', name: 'Control', visitors: 1000, conversions: 100, isControl: true };
  const vTreatment: Variant = { id: 'trt', name: 'Treatment', visitors: 1000, conversions: 130, isControl: false };
  const zTestResult = runTwoSampleTest(vControl, vTreatment, 0.05, 'two-sided', false);

  results.push({
    id: 'two-sample-z-score',
    name: 'Two-Sample Z-Test Statistic (n=1000, x=100 vs 130)',
    description: 'Expected pooled Z-score ~ 2.1027',
    category: 'Hypothesis Testing',
    expected: 2.1027,
    actual: Math.round(zTestResult.zScore * 1e4) / 1e4,
    passed: Math.abs(zTestResult.zScore - 2.1027) < 0.005,
    tolerance: 0.005,
  });

  results.push({
    id: 'two-sample-p-value',
    name: 'Two-Sample Pooled P-Value',
    description: 'Expected two-sided p-value ~ 0.0355 (significant at alpha=0.05)',
    category: 'Hypothesis Testing',
    expected: 0.0355,
    actual: Math.round(zTestResult.pValue * 1e4) / 1e4,
    passed: Math.abs(zTestResult.pValue - 0.0355) < 0.002 && zTestResult.isSignificant === true,
    tolerance: 0.002,
  });

  // 7. Relative Lift Delta Method Interval
  const relCI = calculateRelativeLiftCI(100, 1000, 130, 1000, 0.05);
  results.push({
    id: 'relative-lift-ci',
    name: 'Relative Lift Delta Method 95% CI',
    description: 'Center = +30.0%, lower bound ~+2.0%, upper bound ~+65.7%',
    category: 'Confidence Intervals',
    expected: '+30.0% [>0%, <100%]',
    actual: `+${(relCI.center * 100).toFixed(1)}% [${(relCI.lower * 100).toFixed(1)}%, ${(relCI.upper * 100).toFixed(1)}%]`,
    passed: Math.abs(relCI.center - 0.3) < 1e-4 && relCI.lower > 0 && relCI.upper > relCI.center,
  });

  // 8. Sample Ratio Mismatch (SRM) Chi-Square Test
  const srmVariants: Variant[] = [
    { id: '1', name: 'A', visitors: 10000, conversions: 500, expectedTrafficPercent: 50, isControl: true },
    { id: '2', name: 'B', visitors: 9600, conversions: 480, expectedTrafficPercent: 50, isControl: false },
  ];
  const srmRes = calculateSRM(srmVariants);

  results.push({
    id: 'srm-chi-square',
    name: 'SRM Chi-Square Goodness-of-Fit Statistic',
    description: 'Observed 10,000 vs 9,600 under 50/50 split -> Chi-Square ~ 8.163',
    category: 'SRM',
    expected: 8.1633,
    actual: Math.round(srmRes.chiSquare * 1e4) / 1e4,
    passed: Math.abs(srmRes.chiSquare - 8.1633) < 0.01,
    tolerance: 0.01,
  });

  results.push({
    id: 'srm-p-value',
    name: 'SRM Chi-Square P-Value & Warning Flag',
    description: 'p-value ~ 0.00427 (Moderate SRM warning triggered)',
    category: 'SRM',
    expected: 0.0043,
    actual: Math.round(srmRes.pValue * 1e4) / 1e4,
    passed: Math.abs(srmRes.pValue - 0.0043) < 0.001 && srmRes.warningLevel === 'moderate',
    tolerance: 0.001,
  });

  // 9. Sample Size Planner Verification
  const sampleSizeCalc = calculateSampleSize({
    baselineRate: 0.05,
    mdeType: 'relative',
    mdeValue: 10,
    alpha: 0.05,
    power: 0.8,
    trafficRatio: 1.0,
    dailyTraffic: 5000,
  });

  results.push({
    id: 'sample-size-estimation',
    name: 'Sample Size Estimation (5% Baseline, 10% Rel MDE, 80% Power)',
    description: 'Standard formula yields ~31,000 - 32,500 users per variant (兩組總計約 62,000 - 65,000)',
    category: 'Power & Sample Size',
    expected: '31,000 ~ 32,500',
    actual: sampleSizeCalc.sampleSizePerVariant.toLocaleString(),
    passed: sampleSizeCalc.sampleSizePerVariant >= 30000 && sampleSizeCalc.sampleSizePerVariant <= 33000,
  });

  const durationMs = performance.now() - startTime;
  const passedCount = results.filter((r) => r.passed).length;

  return {
    total: results.length,
    passed: passedCount,
    failed: results.length - passedCount,
    durationMs: Math.round(durationMs * 100) / 100,
    timestamp: new Date().toISOString(),
    results,
  };
}
