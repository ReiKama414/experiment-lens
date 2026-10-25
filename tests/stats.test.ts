import { describe, it, expect } from 'vitest';
import {
  normalCDF,
  inverseNormalCDF,
  calculateWilsonCI,
  calculateNewcombeCI,
  calculateRelativeLiftCI,
  runTwoSampleTest,
  calculateSRM,
  calculateSampleSize,
  estimateBetaBinomialPosterior,
  applyBenjaminiHochberg,
} from '../src/utils/stats';
import type { Variant } from '../src/types/experiment';

describe('Statistical Engine Unit Tests', () => {
  it('computes standard normal CDF and inverse CDF with high precision', () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 6);
    expect(normalCDF(1.959964)).toBeCloseTo(0.975, 4);
    expect(normalCDF(-1.959964)).toBeCloseTo(0.025, 4);

    expect(inverseNormalCDF(0.975)).toBeCloseTo(1.959964, 3);
    expect(inverseNormalCDF(0.995)).toBeCloseTo(2.575829, 3);
    expect(inverseNormalCDF(0.5)).toBeCloseTo(0, 5);
  });

  it('calculates Wilson score interval correctly including boundary edge cases', () => {
    // Normal case: x=10, n=100
    const w1 = calculateWilsonCI(10, 100, 0.05);
    expect(w1.lower).toBeGreaterThan(0.05);
    expect(w1.upper).toBeLessThan(0.18);
    expect(w1.center).toBeCloseTo(0.1, 5);

    // Boundary edge case: x=0, n=50 (Wald collapses to [0, 0], Wilson does not)
    const w0 = calculateWilsonCI(0, 50, 0.05);
    expect(w0.lower).toBe(0);
    expect(w0.upper).toBeGreaterThan(0.05);
    expect(w0.upper).toBeLessThan(0.1);

    // Boundary edge case: x=50, n=50
    const wFull = calculateWilsonCI(50, 50, 0.05);
    expect(wFull.upper).toBe(1);
    expect(wFull.lower).toBeGreaterThan(0.9);
  });

  it('calculates Newcombe hybrid score interval for proportion differences', () => {
    // Diff: 0.20 - 0.10 = +0.10
    const newc = calculateNewcombeCI(10, 100, 20, 100, 0.05);
    expect(newc.center).toBeCloseTo(0.1, 5);
    expect(newc.lower).toBeGreaterThan(0);
    expect(newc.upper).toBeLessThan(0.22);
  });

  it('calculates relative lift and Delta method CI correctly', () => {
    // Control: 10%, Treatment: 13% -> Relative lift = +30%
    const rel = calculateRelativeLiftCI(100, 1000, 130, 1000, 0.05);
    expect(rel.center).toBeCloseTo(0.3, 4);
    expect(rel.lower).toBeGreaterThan(0.01);
    expect(rel.upper).toBeLessThan(0.7);
  });

  it('runs two-sample pooled Z-test and computes exact p-values', () => {
    const ctrl: Variant = { id: 'c', name: 'Control', visitors: 1000, conversions: 100, isControl: true };
    const trt: Variant = { id: 't', name: 'Treatment', visitors: 1000, conversions: 130, isControl: false };

    const res = runTwoSampleTest(ctrl, trt, 0.05, 'two-sided', false);
    expect(res.zScore).toBeCloseTo(2.1027, 2);
    expect(res.pValue).toBeCloseTo(0.0355, 2);
    expect(res.isSignificant).toBe(true);
    expect(res.absoluteLift).toBeCloseTo(0.03, 5);
  });

  it('detects Sample Ratio Mismatch (SRM) with Pearson Chi-Square test', () => {
    // Normal 50:50 split
    const normalVariants: Variant[] = [
      { id: '1', name: 'A', visitors: 5010, conversions: 250, expectedTrafficPercent: 50, isControl: true },
      { id: '2', name: 'B', visitors: 4990, conversions: 250, expectedTrafficPercent: 50, isControl: false },
    ];
    const srmNormal = calculateSRM(normalVariants);
    expect(srmNormal.hasMismatch).toBe(false);
    expect(srmNormal.warningLevel).toBe('none');

    // Mismatched 50:50 split (10,000 vs 9,400)
    const brokenVariants: Variant[] = [
      { id: '1', name: 'A', visitors: 10000, conversions: 500, expectedTrafficPercent: 50, isControl: true },
      { id: '2', name: 'B', visitors: 9400, conversions: 470, expectedTrafficPercent: 50, isControl: false },
    ];
    const srmBroken = calculateSRM(brokenVariants);
    expect(srmBroken.hasMismatch).toBe(true);
    expect(srmBroken.pValue).toBeLessThan(0.001);
    expect(srmBroken.warningLevel).toBe('severe');
  });

  it('estimates required sample size and power curves correctly', () => {
    const calc = calculateSampleSize({
      baselineRate: 0.05,
      mdeType: 'relative',
      mdeValue: 10,
      alpha: 0.05,
      power: 0.8,
      trafficRatio: 1.0,
      dailyTraffic: 5000,
    });

    expect(calc.sampleSizePerVariant).toBeGreaterThan(28000);
    expect(calc.sampleSizePerVariant).toBeLessThan(35000);
    expect(calc.totalSampleSize).toBeGreaterThan(58000);
    expect(calc.totalSampleSize).toBeLessThan(68000);
    expect(calc.powerCurve.length).toBeGreaterThan(10);
  });

  it('computes Bayesian posterior win probability and loss', () => {
    const bayes = estimateBetaBinomialPosterior(100, 1000, 140, 1000);
    expect(bayes.probBBeatsA).toBeGreaterThan(0.95);
    expect(bayes.expectedLossB).toBeLessThan(0.005);
  });

  it('applies Benjamini-Hochberg FDR multi-comparison adjustment', () => {
    const ctrl: Variant = { id: 'c', name: 'Control', visitors: 1000, conversions: 100, isControl: true };
    const t1: Variant = { id: 't1', name: 'T1', visitors: 1000, conversions: 110, isControl: false };
    const t2: Variant = { id: 't2', name: 'T2', visitors: 1000, conversions: 140, isControl: false };

    const comp1 = runTwoSampleTest(ctrl, t1, 0.05);
    const comp2 = runTwoSampleTest(ctrl, t2, 0.05);

    const adjusted = applyBenjaminiHochberg([comp1, comp2]);
    expect(adjusted[0].adjustedPValue).toBeDefined();
    expect(adjusted[1].adjustedPValue).toBeDefined();
    expect(adjusted[0].adjustedPValue!).toBeGreaterThanOrEqual(comp1.pValue);
  });
});
