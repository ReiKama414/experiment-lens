import { useState, useMemo, useEffect, useRef } from 'react';
import type {
  Variant,
  ExperimentSettings,
  ExperimentStatus,
  ExperimentRecord,
} from './types/experiment';
import { runTwoSampleTest, applyBenjaminiHochberg, calculateSRM } from './utils/stats';
import { PRESET_EXPERIMENTS } from './utils/presets';
import type { PresetExperiment } from './utils/presets';
import { parseStateFromUrl } from './utils/urlState';
import type { ExperimentStateSnapshot } from './utils/urlState';
import { Header } from './components/Header';
import { TabNav } from './components/layout/TabNav';
import type { ActiveWorkbenchTab } from './components/layout/TabNav';
import { StatusBar } from './components/layout/StatusBar';
import { VariantTable } from './components/VariantTable';
import { ResultsOverview } from './components/ResultsOverview';
import { VisualDistributions } from './components/VisualDistributions';
import { StatisticalDeepDive } from './components/StatisticalDeepDive';
import { SampleSizeCalculator } from './components/SampleSizeCalculator';
import { BusinessValueGuardrails } from './components/BusinessValueGuardrails';
import { ShareExportModal } from './components/ShareExportModal';
import { VerificationModal } from './components/VerificationModal';
import { ExperimentManagerModal } from './components/ExperimentManagerModal';
import { runStatisticalVerificationSuite } from './utils/statsVerification';
import {
  initializeDatabase,
  saveExperiment,
  getAllExperiments,
  getExperimentById,
} from './db/indexedDB';
import { Tag } from 'lucide-react';

export function App() {
  // Try initializing state from URL hash if available, else default to first preset
  const [initialData] = useState(() => {
    const fromUrl = parseStateFromUrl();
    if (fromUrl) {
      return {
        name: fromUrl.experimentName || 'URL 載入之實驗',
        metric: fromUrl.metricName || '轉換率',
        variants: fromUrl.variants,
        settings: fromUrl.settings,
      };
    }
    const defaultPreset = PRESET_EXPERIMENTS[0];
    return {
      name: defaultPreset.name,
      metric: defaultPreset.settings.metricName,
      variants: defaultPreset.variants,
      settings: defaultPreset.settings,
    };
  });

  const [currentId, setCurrentId] = useState<string>(`exp-${Date.now()}`);
  const [status, setStatus] = useState<ExperimentStatus>('running');
  const [lastSavedTime, setLastSavedTime] = useState<number | undefined>(undefined);

  const [settings, setSettings] = useState<ExperimentSettings>(initialData.settings);
  const [variants, setVariants] = useState<Variant[]>(initialData.variants);
  const [activeTab, setActiveTab] = useState<ActiveWorkbenchTab>('analysis');

  // Modals state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);

  // Self-verification summary
  const [verificationSummary, setVerificationSummary] = useState(() =>
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
        // Preserve createdAt / tags / description of an already-stored record
        // so auto-save does not wipe metadata edited elsewhere (e.g. CSV import tags).
        const existing = await getExperimentById(currentId);
        const record: ExperimentRecord = {
          id: currentId,
          name: settings.experimentName,
          metricName: settings.metricName,
          status,
          createdAt: existing?.createdAt ?? Date.now(),
          updatedAt: Date.now(),
          variants,
          settings,
          description: existing?.description,
          tags: existing?.tags,
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

  // Handle Preset Selection
  const handleSelectPreset = (preset: PresetExperiment) => {
    setCurrentId(`exp-${Date.now()}`);
    setSettings(preset.settings);
    setVariants(preset.variants);
    setStatus('running');
  };

  // Handle Select from Database
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
      experimentName: '未命名 A/B 測試',
      metricName: '點擊率 (CTR)',
      confidenceLevel: 0.95,
      hypothesisDirection: 'two-sided',
      useContinuityCorrection: false,
      enableMultipleTestingCorrection: false,
    };
    const newVariants: Variant[] = [
      {
        id: `var-${now}-1`,
        name: '對照組 A (Control)',
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-150">
      {/* 1. Top Header */}
      <Header
        currentExperimentName={settings.experimentName}
        onSelectPreset={handleSelectPreset}
        onNewExperiment={handleNewExperiment}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        verificationPassed={verificationSummary.failed === 0}
        totalVerificationTests={verificationSummary.total}
        lastSavedTime={lastSavedTime}
      />

      {/* 2. Analytical Workbench Tabs (Aligned with insight-canvas TabNav style) */}
      <TabNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasSrmAlert={srm.hasMismatch}
        variantCount={variants.length}
      />

      {/* 3. Main Container (Expanded to max-w-[1700px] per insight-canvas layout) */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-4 md:p-6 pb-14 sm:pb-16 min-w-0 space-y-5">
        {/* Experiment Title & Meta Banner */}
        <div
          data-testid="app-title-banner"
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors"
        >
          <div data-testid="app-title-info" className="flex-1 space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={settings.experimentName}
                onChange={(e) => handleUpdateSettings({ experimentName: e.target.value })}
                className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition w-full sm:w-auto font-mono"
                placeholder="輸入測試實驗名稱..."
                aria-label="實驗名稱"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ExperimentStatus)}
                aria-label="實驗狀態"
                className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[11px] rounded-md px-2 py-0.5 font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="draft">DRAFT (草稿)</option>
                <option value="running">RUNNING (進行中)</option>
                <option value="concluded">CONCLUDED (已結案)</option>
                <option value="archived">ARCHIVED (已封存)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>目標指標:</span>
              <input
                type="text"
                value={settings.metricName}
                onChange={(e) => handleUpdateSettings({ metricName: e.target.value })}
                className="font-medium text-zinc-800 dark:text-zinc-200 bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition text-xs font-mono"
                placeholder="例如：付款轉換率"
                aria-label="目標指標名稱"
              />
            </div>
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

      {/* 4. Bottom Status Bar (Insight Canvas Workbench Footer Architecture) */}
      <StatusBar
        variants={variants}
        srm={srm}
        onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
        verificationPassed={verificationSummary.failed === 0}
      />

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
