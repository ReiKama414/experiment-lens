/**
 * Experiment Lens - High-Precision Statistical Engine
 * Provides two-sample proportion tests, Wilson & Newcombe confidence intervals,
 * SRM (Sample Ratio Mismatch) Chi-square test, sample size & power curves,
 * and Bayesian conjugate Beta-Binomial posterior estimations.
 */

import type {
  Variant,
  ProportionCI,
  ComparisonResult,
  SRMResult,
  HypothesisDirection,
  PowerCalculationInput,
  PowerCalculationResult,
  BusinessImpactInput,
  BusinessImpactResult,
} from '../types/experiment';

// -------------------------------------------------------------
// Fundamental Distributions and Special Functions
// -------------------------------------------------------------

/**
 * Error function erf(x) via Abramowitz & Stegun 7.1.26 approximation
 * Maximum error: 1.5 x 10^-7
 */
export function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const a = Math.abs(x);

  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const t = 1.0 / (1.0 + p * a);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-a * a);

  return sign * y;
}

/**
 * Standard Normal Probability Density Function (PDF)
 */
export function normalPDF(z: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);
}

/**
 * Standard Normal Cumulative Distribution Function Phi(z)
 */
export function normalCDF(z: number): number {
  if (z < -8) return 0;
  if (z > 8) return 1;
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/**
 * Inverse Normal Cumulative Distribution Function (Quantile function)
 * Uses Peter J. Acklam's rational approximation (error < 1.15e-9)
 */
export function inverseNormalCDF(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  const a = [
    -3.969683028665376e1,
    2.209460984245205e2,
    -2.759285104469687e2,
    1.38357751867269e2,
    -3.066479806614716e1,
    2.506628277459239,
  ];

  const b = [
    -5.447609879822406e1,
    1.615858368580409e2,
    -1.556989798598866e2,
    6.680131188771972e1,
    -1.328068155288572e1,
  ];

  const c = [
    -7.784894002430293e-3,
    -3.223964580411365e-1,
    -2.400758277161838,
    -2.549732539343734,
    4.374664141464968,
    2.938163982698783,
  ];

  const d = [
    7.784695709041462e-3,
    3.224671290700398e-1,
    2.445134137142996,
    3.754408661907416,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number;
  let r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
}

/**
 * Log-Gamma function via Lanczos approximation (g=7, n=9)
 */
export function logGamma(z: number): number {
  const p = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109583652625,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  z -= 1;
  let x = p[0];
  for (let i = 1; i < 9; i++) {
    x += p[i] / (z + i);
  }

  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * Regularized lower incomplete gamma function P(a, x) = gamma(a, x) / Gamma(a)
 */
export function regularizedGammaP(a: number, x: number): number {
  if (x <= 0) return 0;
  if (a <= 0) return 1;

  if (x < a + 1) {
    let sum = 1 / a;
    let term = 1 / a;
    for (let n = 1; n < 200; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-12) break;
    }
    return Math.exp(-x + a * Math.log(x) - logGamma(a)) * sum;
  } else {
    let b = x + 1 - a;
    let c = 1 / 1e-30;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i < 200; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = b + an / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-12) break;
    }
    const q = Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
    return Math.max(0, Math.min(1, 1 - q));
  }
}

/**
 * Chi-Square Cumulative Distribution Function P(X <= x)
 */
export function chiSquareCDF(x: number, df: number): number {
  if (x <= 0) return 0;
  return regularizedGammaP(df / 2, x / 2);
}

/**
 * Chi-Square Survival Function (p-value for right tail test) P(X >= x)
 */
export function chiSquarePValue(x: number, df: number): number {
  return Math.max(0, Math.min(1, 1 - chiSquareCDF(x, df)));
}

// -------------------------------------------------------------
// Proportion Confidence Intervals
// -------------------------------------------------------------

export function calculateWaldCI(conversions: number, visitors: number, alpha: number): ProportionCI {
  if (visitors <= 0) return { lower: 0, upper: 0, center: 0 };
  const p = conversions / visitors;
  const z = inverseNormalCDF(1 - alpha / 2);
  const se = Math.sqrt((p * (1 - p)) / visitors);
  return {
    center: p,
    lower: Math.max(0, p - z * se),
    upper: Math.min(1, p + z * se),
  };
}

export function calculateWilsonCI(
  conversions: number,
  visitors: number,
  alpha: number
): ProportionCI {
  if (visitors <= 0) return { lower: 0, upper: 0, center: 0 };
  const p = conversions / visitors;
  const z = inverseNormalCDF(1 - alpha / 2);
  const z2 = z * z;

  const denominator = 1 + z2 / visitors;
  const center = (p + z2 / (2 * visitors)) / denominator;
  const margin =
    (z / denominator) * Math.sqrt((p * (1 - p)) / visitors + z2 / (4 * visitors * visitors));

  return {
    center: p,
    lower: Math.max(0, center - margin),
    upper: Math.min(1, center + margin),
  };
}

export function calculateNewcombeCI(
  conversionsA: number,
  visitorsA: number,
  conversionsB: number,
  visitorsB: number,
  alpha: number
): ProportionCI {
  const pA = visitorsA > 0 ? conversionsA / visitorsA : 0;
  const pB = visitorsB > 0 ? conversionsB / visitorsB : 0;
  const diff = pB - pA;

  const ciA = calculateWilsonCI(conversionsA, visitorsA, alpha);
  const ciB = calculateWilsonCI(conversionsB, visitorsB, alpha);

  const lA = ciA.lower;
  const uA = ciA.upper;
  const lB = ciB.lower;
  const uB = ciB.upper;

  const lower = diff - Math.sqrt(Math.pow(pB - lB, 2) + Math.pow(uA - pA, 2));
  const upper = diff + Math.sqrt(Math.pow(uB - pB, 2) + Math.pow(pA - lA, 2));

  return {
    center: diff,
    lower: Math.max(-1, lower),
    upper: Math.min(1, upper),
  };
}

export function calculateRelativeLiftCI(
  conversionsA: number,
  visitorsA: number,
  conversionsB: number,
  visitorsB: number,
  alpha: number
): ProportionCI {
  const pA = conversionsA / visitorsA;
  const pB = conversionsB / visitorsB;

  if (pA <= 0 || pB <= 0 || conversionsA === 0 || conversionsB === 0) {
    const rel = pA > 0 ? (pB - pA) / pA : 0;
    return { lower: 0, upper: 0, center: rel };
  }

  const relativeRisk = pB / pA;
  const logRR = Math.log(relativeRisk);
  const z = inverseNormalCDF(1 - alpha / 2);

  const seLogRR = Math.sqrt(
    (visitorsA - conversionsA) / (visitorsA * conversionsA) +
      (visitorsB - conversionsB) / (visitorsB * conversionsB)
  );

  const lowerLog = logRR - z * seLogRR;
  const upperLog = logRR + z * seLogRR;

  return {
    center: relativeRisk - 1,
    lower: Math.exp(lowerLog) - 1,
    upper: Math.exp(upperLog) - 1,
  };
}

// -------------------------------------------------------------
// Two-Sample Hypothesis Testing
// -------------------------------------------------------------

export function runTwoSampleTest(
  control: Variant,
  treatment: Variant,
  alpha: number,
  direction: HypothesisDirection = 'two-sided',
  useContinuity: boolean = false
): ComparisonResult {
  const nA = control.visitors;
  const xA = control.conversions;
  const nB = treatment.visitors;
  const xB = treatment.conversions;

  const pA = nA > 0 ? xA / nA : 0;
  const pB = nB > 0 ? xB / nB : 0;
  const absoluteLift = pB - pA;
  const relativeLift = pA > 0 ? (pB - pA) / pA : 0;

  const unpooledSE = Math.sqrt((pA * (1 - pA)) / nA + (pB * (1 - pB)) / nB);

  const pPool = (xA + xB) / (nA + nB);
  const pooledSE = Math.sqrt(pPool * (1 - pPool) * (1 / nA + 1 / nB));

  const zScore = pooledSE > 0 ? absoluteLift / pooledSE : 0;

  const ccAdjustment = 0.5 * (1 / nA + 1 / nB);
  let adjustedDiff = absoluteLift;
  if (Math.abs(absoluteLift) > ccAdjustment) {
    adjustedDiff = absoluteLift > 0 ? absoluteLift - ccAdjustment : absoluteLift + ccAdjustment;
  } else {
    adjustedDiff = 0;
  }
  const zScoreContinuity = pooledSE > 0 ? adjustedDiff / pooledSE : 0;

  const activeZ = useContinuity ? zScoreContinuity : zScore;

  const pValueTwoSided = 2 * (1 - normalCDF(Math.abs(activeZ)));
  const pValueOneSidedGreater = 1 - normalCDF(activeZ);
  const pValueOneSidedLess = normalCDF(activeZ);

  let pValue: number;
  let isSignificant: boolean;

  if (direction === 'greater') {
    pValue = pValueOneSidedGreater;
    isSignificant = pValue < alpha && absoluteLift > 0;
  } else if (direction === 'less') {
    pValue = pValueOneSidedLess;
    isSignificant = pValue < alpha && absoluteLift < 0;
  } else {
    pValue = pValueTwoSided;
    isSignificant = pValue < alpha;
  }

  const zCrit = inverseNormalCDF(1 - alpha / 2);
  const absoluteLiftWaldCI: ProportionCI = {
    center: absoluteLift,
    lower: absoluteLift - zCrit * unpooledSE,
    upper: absoluteLift + zCrit * unpooledSE,
  };
  const absoluteLiftNewcombeCI = calculateNewcombeCI(xA, nA, xB, nB, alpha);
  const relativeLiftCI = calculateRelativeLiftCI(xA, nA, xB, nB, alpha);

  const bayes = estimateBetaBinomialPosterior(xA, nA, xB, nB);

  return {
    controlId: control.id,
    variantId: treatment.id,
    variantName: treatment.name,
    absoluteLift,
    absoluteLiftWaldCI,
    absoluteLiftNewcombeCI,
    relativeLift,
    relativeLiftCI,
    zScore,
    zScoreContinuity,
    pooledSE,
    unpooledSE,
    pValue,
    pValueTwoSided,
    pValueOneSidedGreater,
    pValueOneSidedLess,
    isSignificant,
    probBBeatsA: bayes.probBBeatsA,
    expectedLossA: bayes.expectedLossA,
    expectedLossB: bayes.expectedLossB,
  };
}

// -------------------------------------------------------------
// Sample Ratio Mismatch (SRM) Test
// -------------------------------------------------------------

export function calculateSRM(variants: Variant[]): SRMResult {
  const k = variants.length;
  if (k < 2) {
    return {
      chiSquare: 0,
      pValue: 1,
      degreesOfFreedom: 0,
      hasMismatch: false,
      warningLevel: 'none',
      expectedVisitors: {},
    };
  }

  const totalObserved = variants.reduce((sum, v) => sum + v.visitors, 0);
  const totalWeight = variants.reduce(
    (sum, v) => sum + (v.expectedTrafficPercent !== undefined ? v.expectedTrafficPercent : 100 / k),
    0
  );

  let chiSquare = 0;
  const expectedVisitors: Record<string, number> = {};

  for (const v of variants) {
    const weight =
      v.expectedTrafficPercent !== undefined ? v.expectedTrafficPercent : 100 / k;
    const expected = (weight / totalWeight) * totalObserved;
    expectedVisitors[v.id] = expected;

    if (expected > 0) {
      chiSquare += Math.pow(v.visitors - expected, 2) / expected;
    }
  }

  const degreesOfFreedom = k - 1;
  const pValue = chiSquarePValue(chiSquare, degreesOfFreedom);

  let warningLevel: 'none' | 'moderate' | 'severe' = 'none';
  if (pValue < 0.001) {
    warningLevel = 'severe';
  } else if (pValue < 0.01) {
    warningLevel = 'moderate';
  }

  return {
    chiSquare,
    pValue,
    degreesOfFreedom,
    hasMismatch: warningLevel !== 'none',
    warningLevel,
    expectedVisitors,
  };
}

// -------------------------------------------------------------
// Bayesian Estimation (Beta-Binomial Conjugate)
// -------------------------------------------------------------

export function estimateBetaBinomialPosterior(
  xA: number,
  nA: number,
  xB: number,
  nB: number,
  samples: number = 30000
): { probBBeatsA: number; expectedLossA: number; expectedLossB: number } {
  const alphaA = 1 + xA;
  const betaA = 1 + (nA - xA);
  const alphaB = 1 + xB;
  const betaB = 1 + (nB - xB);

  if (nA >= 50 && nB >= 50) {
    const meanA = alphaA / (alphaA + betaA);
    const varA = (alphaA * betaA) / (Math.pow(alphaA + betaA, 2) * (alphaA + betaA + 1));
    const meanB = alphaB / (alphaB + betaB);
    const varB = (alphaB * betaB) / (Math.pow(alphaB + betaB, 2) * (alphaB + betaB + 1));

    const diffMean = meanB - meanA;
    const diffSD = Math.sqrt(varA + varB);

    if (diffSD > 0) {
      const z = diffMean / diffSD;
      const probBBeatsA = normalCDF(z);

      const phiZ = normalPDF(z);
      const expectedLossA = Math.max(0, diffMean * normalCDF(z) + diffSD * phiZ);
      const expectedLossB = Math.max(0, -diffMean * normalCDF(-z) + diffSD * phiZ);

      return {
        probBBeatsA: Math.max(0, Math.min(1, probBBeatsA)),
        expectedLossA,
        expectedLossB,
      };
    }
  }

  let bWins = 0;
  let lossA = 0;
  let lossB = 0;

  for (let i = 0; i < samples; i++) {
    const drawA = sampleBeta(alphaA, betaA);
    const drawB = sampleBeta(alphaB, betaB);

    if (drawB > drawA) {
      bWins++;
      lossA += drawB - drawA;
    } else {
      lossB += drawA - drawB;
    }
  }

  return {
    probBBeatsA: bWins / samples,
    expectedLossA: lossA / samples,
    expectedLossB: lossB / samples,
  };
}

function sampleGamma(shape: number): number {
  if (shape < 1) {
    return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let z = 0;
    let v = 0;
    do {
      const u1 = Math.random();
      const u2 = Math.random();
      z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      v = 1 + c * z;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * z * z * z * z) return d * v;
    if (Math.log(u) < 0.5 * z * z + d * (1 - v + Math.log(v))) return d * v;
  }
}

function sampleBeta(alpha: number, beta: number): number {
  const x = sampleGamma(alpha);
  const y = sampleGamma(beta);
  return x / (x + y);
}

// -------------------------------------------------------------
// Sample Size and Power Estimation
// -------------------------------------------------------------

export function calculateSampleSize(input: PowerCalculationInput): PowerCalculationResult {
  const { baselineRate, mdeType, mdeValue, alpha, power, trafficRatio, dailyTraffic } = input;

  const p1 = Math.max(0.0001, Math.min(0.9999, baselineRate));
  let p2: number;

  if (mdeType === 'relative') {
    p2 = p1 * (1 + mdeValue / 100);
  } else {
    p2 = p1 + mdeValue;
  }

  p2 = Math.max(0.0001, Math.min(0.9999, p2));
  const diff = Math.abs(p2 - p1);

  if (diff < 1e-7) {
    return {
      treatmentRate: p2,
      sampleSizePerVariant: Infinity,
      totalSampleSize: Infinity,
      estimatedDays: Infinity,
      powerCurve: [],
    };
  }

  const k = trafficRatio > 0 ? trafficRatio : 1.0;
  const zAlpha = inverseNormalCDF(1 - alpha / 2);
  const zBeta = inverseNormalCDF(power);

  const pBar = (p1 + k * p2) / (1 + k);
  const sd0 = Math.sqrt((1 + 1 / k) * pBar * (1 - pBar));
  const sd1 = Math.sqrt(p1 * (1 - p1) + (p2 * (1 - p2)) / k);

  const n1 = Math.ceil(Math.pow(zAlpha * sd0 + zBeta * sd1, 2) / Math.pow(diff, 2));
  const n2 = Math.ceil(n1 * k);
  const total = n1 + n2;

  const estimatedDays = dailyTraffic > 0 ? Math.ceil(total / dailyTraffic) : 0;

  const powerCurve: PowerCalculationResult['powerCurve'] = [];
  const minN = Math.max(10, Math.floor(n1 * 0.15));
  const maxN = Math.floor(n1 * 2.2);
  const steps = 30;
  const stepSize = Math.max(1, Math.floor((maxN - minN) / steps));

  for (let s = minN; s <= maxN; s += stepSize) {
    const s2 = s * k;
    const se0 = Math.sqrt((pBar * (1 - pBar) * (1 / s + 1 / s2)));
    const se1 = Math.sqrt((p1 * (1 - p1)) / s + (p2 * (1 - p2)) / s2);

    const zb = (diff - zAlpha * se0) / se1;
    const calculatedPower = normalCDF(zb);

    powerCurve.push({
      sampleSize: s,
      power: calculatedPower,
      powerPercentage: Math.round(calculatedPower * 1000) / 10,
    });
  }

  return {
    treatmentRate: p2,
    sampleSizePerVariant: n1,
    totalSampleSize: total,
    estimatedDays,
    powerCurve,
  };
}

// -------------------------------------------------------------
// Business Impact & Practical Significance
// -------------------------------------------------------------

export function calculateBusinessImpact(
  absoluteLift: number,
  input: BusinessImpactInput
): BusinessImpactResult {
  const { monthlyTraffic, averageOrderValue, profitMarginPercent, engineeringCost } = input;
  const marginRatio = Math.max(0, Math.min(1, profitMarginPercent / 100));

  const monthlyAdditionalConversions = monthlyTraffic * absoluteLift;
  const monthlyAdditionalRevenue = monthlyAdditionalConversions * averageOrderValue;
  const monthlyAdditionalGrossProfit = monthlyAdditionalRevenue * marginRatio;

  let breakEvenMonths = 0;
  if (monthlyAdditionalGrossProfit > 0) {
    breakEvenMonths = engineeringCost / monthlyAdditionalGrossProfit;
  } else if (engineeringCost === 0) {
    breakEvenMonths = 0;
  } else {
    breakEvenMonths = Infinity;
  }

  return {
    monthlyAdditionalConversions: Math.round(monthlyAdditionalConversions),
    monthlyAdditionalRevenue: Math.round(monthlyAdditionalRevenue * 100) / 100,
    monthlyAdditionalGrossProfit: Math.round(monthlyAdditionalGrossProfit * 100) / 100,
    breakEvenMonths: Math.round(breakEvenMonths * 10) / 10,
    isEconomicallyViable: monthlyAdditionalGrossProfit > 0 && breakEvenMonths <= 12,
  };
}

// -------------------------------------------------------------
// Multiple Testing Corrections
// -------------------------------------------------------------

export function applyBenjaminiHochberg(comparisons: ComparisonResult[]): ComparisonResult[] {
  const m = comparisons.length;
  if (m <= 1) {
    return comparisons.map((c) => ({ ...c, adjustedPValue: c.pValue }));
  }

  const indexed = comparisons.map((c, idx) => ({ ...c, originalIdx: idx }));
  indexed.sort((a, b) => a.pValue - b.pValue);

  const adjusted = new Array<number>(m);
  let minNext = 1.0;

  for (let i = m - 1; i >= 0; i--) {
    const rawP = indexed[i].pValue;
    const rank = i + 1;
    const candidate = Math.min(1, (rawP * m) / rank);
    minNext = Math.min(minNext, candidate);
    adjusted[i] = minNext;
  }

  const results = new Array<ComparisonResult>(m);
  for (let i = 0; i < m; i++) {
    const originalIdx = indexed[i].originalIdx;
    results[originalIdx] = {
      ...comparisons[originalIdx],
      adjustedPValue: adjusted[i],
    };
  }

  return results;
}
