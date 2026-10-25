import { useState, useMemo, useEffect, useRef } from 'react';
import type {
  Variant,
  ExperimentSettings,
  ExperimentRecord,
  ExperimentStatus,
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
import {
  initializeDatabase,
  getAllExperiments,
  saveExperiment,
} from './db/indexedDB';
import { Header } from './components/Header';
import { VariantTable } from './components/VariantTable';
import { ResultsOverview } from './components/ResultsOverview';
import { VisualDistributions } from './components/VisualDistributions';
import { StatisticalDeepDive } from './components/StatisticalDeepDive';
import { SampleSizeCalculator } from './components/SampleSizeCalculator';
import { BusinessValueGuardrails } from './components/BusinessValueGuardrails';
import { VerificationModal } from './components/VerificationModal';
import { ShareExportModal } from './components/ShareExportModal';
import { ExperimentManagerModal } from './components/ExperimentManagerModal';
import {
  BarChart3,
  Calculator,
  ShieldAlert,
  Tag,
  CheckCircle2,
} from 'lucide-react';

export function App() {
  const defaultPreset = PRESET_EXPERIMENTS[0];

  const [currentId, setCurrentId] = useState<string>(() => {
    const urlState = parseStateFromUrl();
    if (urlState) return `exp-${Date.now()}`;
    return defaultPreset.id;
  });

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

  const [status, setStatus] = useState<ExperimentStatus>('concluded');
  const [activeTab, setActiveTab] = useState<'analysis' | 'power' | 'business'>('analysis');
  const [lastSavedTime, setLastSavedTime] = useState<number | undefined>(undefined);

  // Modals state
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);

  // Self-verification suite
  const [verificationSummary, setVerificationSummary] = useState<VerificationSuiteSummary>(() =>
    runStatisticalVerificationSuite()
  );

  const handleRefreshVerification = () => {
    setVerificationSummary(runStatisticalVerificationSuite());
  };

  // Initialize DB on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase();
        // If not loaded from URL, try loading most recent experiment from IndexedDB
        const urlState = parseStateFromUrl();
        if (!urlState) {
          const list = await getAllExperiments();
          if (list.length > 0) {
            const first = list[0];
            setCurrentId(first.id);
            setSettings(first.settings);
            setVariants(first.variants);
            setStatus(first.status);
            setLastSavedTime(first.updatedAt);
          }
        }
      } catch (err) {
        console.warn('IndexedDB initialization failed, falling back to in-memory state', err);
      }
    };
    init();
  }, []);

  // Debounced Auto-save to IndexedDB
  const saveTimeoutRef = useRef<any>(null);
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const record: ExperimentRecord = {
          id: currentId,
          name: settings.experimentName,
          metricName: settings.metricName,
          status,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          variants,
          settings,
        };
        await saveExperiment(record);
        setLastSavedTime(Date.now());
      } catch (e) {
        // Fallback silently if storage unavailable in restricted sandbox
      }
    }, 600);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [currentId, settings, variants, status]);

  // Handle Preset selection
  const handleSelectPreset = (preset: PresetExperiment) => {
    setCurrentId(preset.id);
    setSettings(preset.settings);
    setVariants(preset.variants);
    setStatus('concluded');
  };

  // Handle Load from Record (from DB)
  const handleSelectRecord = (record: ExperimentRecord) => {
    setCurrentId(record.id);
    setSettings(record.settings);
    setVariants(record.variants);
    setStatus(record.status);
    setLastSavedTime(record.updatedAt);
  };

  // Handle Create New Experiment
  const handleNewExperiment = () => {
    const now = Date.now();
    const newId = `exp-${now}`;
    const newSettings: ExperimentSettings = {
      experimentName: '全新 A/B 測試',
      metricName: '轉換率',
      confidenceLevel: 0.95,
      hypothesisDirection: 'two-sided',
      useContinuityCorrection: false,
      enableMultipleTestingCorrection: false,
    };
    const newVariants: Variant[] = [
      {
        id: `var-${now}-1`,
        name: '對照組 (Control)',
        visitors: 10000,
        conversions: 500,
        expectedTrafficPercent: 50,
        isControl: true,
      },
      {
        id: `var-${now}-2`,
        name: '實驗組 B (Treatment)',
        visitors: 10000,
        conversions: 550,
        expectedTrafficPercent: 50,
        isControl: false,
      },
    ];

    setCurrentId(newId);
    setSettings(newSettings);
    setVariants(newVariants);
    setStatus('draft');
  };

  // Handle Load from snapshot (from share modal or file)
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

  const primaryComparison = comparisons[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onSelectPreset={handleSelectPreset}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        verificationPassed={verificationSummary.failed === 0}
        totalVerificationTests={verificationSummary.total}
        lastSavedTime={lastSavedTime}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Experiment Title & Meta Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={settings.experimentName}
                onChange={(e) => handleUpdateSettings({ experimentName: e.target.value })}
                className="text-base font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none transition w-full sm:w-auto"
                placeholder="輸入測試實驗名稱..."
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ExperimentStatus)}
                className="bg-slate-800 border border-slate-700 text-[11px] rounded px-2 py-0.5 font-mono text-slate-300 focus:outline-none"
              >
                <option value="draft">DRAFT (草稿)</option>
                <option value="running">RUNNING (進行中)</option>
                <option value="concluded">CONCLUDED (已結案)</option>
                <option value="archived">ARCHIVED (已封存)</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Tag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>目標指標:</span>
              <input
                type="text"
                value={settings.metricName}
                onChange={(e) => handleUpdateSettings({ metricName: e.target.value })}
                className="font-medium text-slate-200 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none transition text-xs"
                placeholder="例如：付款轉換率"
              />
            </div>
          </div>

          {/* Workbench Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold self-start sm:self-auto shrink-0">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-3 py-1.5 rounded-md transition flex items-center space-x-1.5 ${
                activeTab === 'analysis'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>A/B 檢定分析</span>
            </button>

            <button
              onClick={() => setActiveTab('power')}
              className={`px-3 py-1.5 rounded-md transition flex items-center space-x-1.5 ${
                activeTab === 'power'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>樣本量與檢定力</span>
            </button>

            <button
              onClick={() => setActiveTab('business')}
              className={`px-3 py-1.5 rounded-md transition flex items-center space-x-1.5 ${
                activeTab === 'business'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>商業價值與假設檢驗</span>
            </button>
          </div>
        </div>

        {/* Tab 1: A/B Analysis & Decisions */}
        {activeTab === 'analysis' && (
          <div className="space-y-5">
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

            {/* Visual Distributions (ECharts Bell curves & Forest plot) */}
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
      <footer className="bg-slate-900 border-t border-slate-800 text-xs text-slate-500 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <span className="text-slate-300 font-semibold">
              Experiment Lens · 專業級 A/B 測試分析工作台
            </span>
            <p>
              雙樣本比例 Z 檢定 · Newcombe Hybrid Score · Wilson 區間 · Pearson χ² SRM · ECharts 視覺化 · IndexedDB 本機儲存
            </p>
          </div>
          <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
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

      {/* IndexedDB Experiment Manager Modal */}
      <ExperimentManagerModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        currentExperimentId={currentId}
        onSelectExperiment={handleSelectRecord}
        onNewExperiment={handleNewExperiment}
      />
    </div>
  );
}

export default App;
