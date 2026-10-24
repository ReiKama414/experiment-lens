export interface Variant {
  id: string;
  name: string;
  visitors: number;
  conversions: number;
  expectedTrafficPercent?: number; // For SRM check (default 50 or 100/N)
  isControl?: boolean;
}

export type HypothesisDirection = 'two-sided' | 'greater' | 'less';

export interface ConfidenceLevelOption {
  label: string;
  value: number; // e.g. 0.95
  alpha: number; // e.g. 0.05
}

export interface ProportionCI {
  lower: number;
  upper: number;
  center: number;
}

export interface VariantStats {
  id: string;
  name: string;
  isControl: boolean;
  visitors: number;
  conversions: number;
  conversionRate: number; // p_hat
  wilsonCI: ProportionCI;
  waldCI: ProportionCI;
  standardError: number;
}

export interface ComparisonResult {
  controlId: string;
  variantId: string;
  variantName: string;
  // Lift metrics
  absoluteLift: number; // p_B - p_A
  absoluteLiftWaldCI: ProportionCI;
  absoluteLiftNewcombeCI: ProportionCI;
  relativeLift: number; // (p_B - p_A) / p_A
  relativeLiftCI: ProportionCI;
  // Test statistics
  zScore: number;
  zScoreContinuity: number;
  pooledSE: number;
  unpooledSE: number;
  pValue: number; // based on chosen direction
  pValueTwoSided: number;
  pValueOneSidedGreater: number;
  pValueOneSidedLess: number;
  isSignificant: boolean;
  // Multiple test adjusted p-value (Bonferroni / Benjamini-Hochberg)
  adjustedPValue?: number;
  // Bayesian metric
  probBBeatsA: number;
  expectedLossA: number; // if we choose A and B is better
  expectedLossB: number; // if we choose B and A is better
}

export interface SRMResult {
  chiSquare: number;
  pValue: number;
  degreesOfFreedom: number;
  hasMismatch: boolean; // pValue < 0.001
  warningLevel: 'none' | 'moderate' | 'severe';
  expectedVisitors: Record<string, number>;
}

export interface ExperimentSettings {
  confidenceLevel: number; // default 0.95
  hypothesisDirection: HypothesisDirection;
  useContinuityCorrection: boolean;
  enableMultipleTestingCorrection: boolean;
  experimentName: string;
  metricName: string;
}

export interface PowerCalculationInput {
  baselineRate: number; // 0 - 1 (e.g. 0.05 for 5%)
  mdeType: 'relative' | 'absolute';
  mdeValue: number; // e.g. 10 for 10% relative or 0.005 for 0.5% absolute
  alpha: number; // 0.05
  power: number; // 0.80
  trafficRatio: number; // 1.0 (50:50)
  dailyTraffic: number; // for duration calculation
}

export interface PowerCalculationResult {
  treatmentRate: number;
  sampleSizePerVariant: number;
  totalSampleSize: number;
  estimatedDays: number;
  powerCurve: Array<{
    sampleSize: number;
    power: number;
    powerPercentage: number;
  }>;
}

export interface BusinessImpactInput {
  monthlyTraffic: number;
  averageOrderValue: number;
  profitMarginPercent: number;
  engineeringCost: number;
}

export interface BusinessImpactResult {
  monthlyAdditionalConversions: number;
  monthlyAdditionalRevenue: number;
  monthlyAdditionalGrossProfit: number;
  breakEvenMonths: number;
  isEconomicallyViable: boolean;
}
