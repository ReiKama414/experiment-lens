import { useState, useMemo } from 'react';
import type {
  Variant,
  ExperimentSettings,
} from './types/experiment';
import {
  runTwoSampleTest,
  calculateSRM,
  applyBenjaminiHochberg,
} from './utils/stats';
import {
  runStatisticalVerificationSuite,
} from './utils/statsVerification';
import type { VerificationSuiteSummary } from './utils/statsVerification';
import { parseStateFromUrl } from './utils/urlState';
import type { ExperimentStateSnapshot } from './utils/urlState';
import { PRESET_EXPERIMENTS } from './utils/presets';
import type { PresetExperiment } from './utils/presets';
import { Header } from './components/Header';
import { VariantTable } from './components/VariantTable';
import { ResultsOverview } from './components/ResultsOverview';
import { VisualDistributions } from './components/VisualDistributions';
import { StatisticalDeepDive } from './components/StatisticalDeepDive';
import { SampleSizeCalculator } from './components/SampleSizeCalculator';
import { BusinessValueGuardrails } from './components/BusinessValueGuardrails';
import { VerificationModal } from './components/VerificationModal';
import { ShareExportModal } from './components/ShareExportModal';
import {
  BarChart3,
  Calculator,
  ShieldAlert,
  Tag,
  CheckCircle2,
} from 'lucide-react';

export function App() {
  const defaultPreset = PRESET_EXPERIMENTS[0];

  const [settings, setSettings] = useState<ExperimentSettings>(() => {
    const urlState = parseStateFromUrl();
    if (urlState && urlState.settings) {
      return urlState.settings;
    }
    return defaultPreset.settings;
  });

  const [variants, setVariants] = useState<Variant[]>(() => {
    const urlState = parseStateFromUrl();
    if (urlState && urlState.variants) {
      return urlState.variants;
    }
    return defaultPreset.variants;
  });

  const [activeTab, setActiveTab] = useState<'analysis' | 'power' | 'business'>('analysis');

  // Modals state
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Self-verification suite
  const [verificationSummary, setVerificationSummary] = useState<VerificationSuiteSummary>(() =>
    runStatisticalVerificationSuite()
  );

  const handleRefreshVerification = () => {
    setVerificationSummary(runStatisticalVerificationSuite());
  };

  const handleSelectPreset = (preset: PresetExperiment) => {
    setSettings(preset.settings);
    setVariants(preset.variants);
  };

  const handleLoadSnapshot = (snapshot: ExperimentStateSnapshot) => {
    if (snapshot.settings) setSettings(snapshot.settings);
    if (snapshot.variants) setVariants(snapshot.variants);
  };

  const handleUpdateSettings = (partial: Partial<ExperimentSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  // Statistical Computations
  const control = useMemo(() => {
    return variants.find((v) => v.isControl) || variants[0];
  }, [variants]);

  const rawComparisons = useMemo(() => {
    const others = variants.filter((v) => v.id !== control.id);
    const alpha = 1 - settings.confidenceLevel;

    return others.map((t) =>
      runTwoSampleTest(
        control,
        t,
        alpha,
        settings.hypothesisDirection,
        settings.useContinuityCorrection
      )
    );
  }, [control, variants, settings.confidenceLevel, settings.hypothesisDirection, settings.useContinuityCorrection]);

  const comparisons = useMemo(() => {
    if (settings.enableMultipleTestingCorrection && rawComparisons.length > 1) {
      return applyBenjaminiHochberg(rawComparisons);
    }
    return rawComparisons;
  }, [rawComparisons, settings.enableMultipleTestingCorrection]);

  // Sample Ratio Mismatch (SRM)
  const srm = useMemo(() => {
    return calculateSRM(variants);
  }, [variants]);

  // Primary comparison for business impact
  const primaryComparison = comparisons[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        onSelectPreset={handleSelectPreset}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
        verificationPassed={verificationSummary.failed === 0}
        totalVerificationTests={verificationSummary.total}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Experiment Title & Meta Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={settings.experimentName}
                onChange={(e) => handleUpdateSettings({ experimentName: e.target.value })}
                className="text-lg font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none transition w-full sm:w-auto"
                placeholder="輸入測試實驗名稱..."
              />
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Tag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>關鍵目標指標 (Metric):</span>
              <input
                type="text"
                value={settings.metricName}
                onChange={(e) => handleUpdateSettings({ metricName: e.target.value })}
                className="font-medium text-slate-200 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none transition"
                placeholder="例如：付款轉換率"
              />
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold self-start sm:self-auto shrink-0">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'analysis'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>A/B 檢定分析</span>
            </button>

            <button
              onClick={() => setActiveTab('power')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'power'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>樣本量與檢定力</span>
            </button>

            <button
              onClick={() => setActiveTab('business')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'business'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>商業價值與假設檢驗</span>
            </button>
          </div>
        </div>

        {/* Tab 1: A/B Analysis & Decisions */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Variant Table Inputs */}
            <VariantTable
              variants={variants}
              onChangeVariants={setVariants}
              confidenceLevel={settings.confidenceLevel}
            />

            {/* Results Overview & Statistical Cards */}
            <ResultsOverview
              variants={variants}
              comparisons={comparisons}
              srm={srm}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />

            {/* Visual Distributions (Bell curves & CI error bars) */}
            <VisualDistributions
              variants={variants}
              comparisons={comparisons}
            />

            {/* Deep Dive Collapsible */}
            <StatisticalDeepDive
              variants={variants}
              comparisons={comparisons}
              srm={srm}
              settings={settings}
            />
          </div>
        )}

        {/* Tab 2: Sample Size & Power Planner */}
        {activeTab === 'power' && (
          <SampleSizeCalculator
            initialBaselineRate={
              control && control.visitors > 0 ? control.conversions / control.visitors : 0.05
            }
          />
        )}

        {/* Tab 3: Business Value & Guardrails */}
        {activeTab === 'business' && (
          <BusinessValueGuardrails primaryComparison={primaryComparison} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-xs text-slate-500 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <span className="text-slate-300 font-semibold">
              Experiment Lens · A/B 測試分析工具
            </span>
            <p>
              採用 Newcombe Hybrid Score、Wilson Interval、Pearson χ² SRM 與 Benjamini-Hochberg FDR 校正。
            </p>
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <button
              onClick={() => setIsVerificationModalOpen(true)}
              className="hover:text-blue-400 transition underline underline-offset-2 flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>通過 9 項統計數學基準測試</span>
            </button>
            <span>·</span>
            <span>支援 GitHub Pages 靜態部署</span>
          </div>
        </div>
      </footer>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        summary={verificationSummary}
        onRefresh={handleRefreshVerification}
      />

      {/* Share & Export Modal */}
      <ShareExportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        variants={variants}
        comparisons={comparisons}
        srm={srm}
        settings={settings}
        businessImpact={null}
        onLoadSnapshot={handleLoadSnapshot}
      />
    </div>
  );
}

export default App;
