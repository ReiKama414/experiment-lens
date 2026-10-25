import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ExperimentRecord } from '../types/experiment';
import { PRESET_EXPERIMENTS } from '../utils/presets';

interface ExperimentLensDB extends DBSchema {
  experiments: {
    key: string;
    value: ExperimentRecord;
    indexes: {
      'by-updated': number;
      'by-status': string;
      'by-name': string;
    };
  };
}

const DB_NAME = 'experiment_lens_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ExperimentLensDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<ExperimentLensDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ExperimentLensDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('experiments')) {
          const store = db.createObjectStore('experiments', { keyPath: 'id' });
          store.createIndex('by-updated', 'updatedAt');
          store.createIndex('by-status', 'status');
          store.createIndex('by-name', 'name');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Initializes database and seeds preset experiments if the database is empty.
 */
export async function initializeDatabase(): Promise<void> {
  const db = await getDB();
  const count = await db.count('experiments');
  if (count === 0) {
    const now = Date.now();
    const tx = db.transaction('experiments', 'readwrite');
    for (let i = 0; i < PRESET_EXPERIMENTS.length; i++) {
      const preset = PRESET_EXPERIMENTS[i];
      const record: ExperimentRecord = {
        id: preset.id,
        name: preset.name,
        metricName: preset.settings.metricName,
        description: preset.description,
        status: i === 0 ? 'concluded' : i === 2 ? 'running' : 'draft',
        createdAt: now - (PRESET_EXPERIMENTS.length - i) * 86400000,
        updatedAt: now - (PRESET_EXPERIMENTS.length - i) * 3600000,
        variants: preset.variants,
        settings: preset.settings,
        tags: [preset.tag],
      };
      await tx.store.put(record);
    }
    await tx.done;
  }
}

/**
 * Retrieves all experiments with optional search and status filtering.
 */
export async function getAllExperiments(
  searchQuery?: string,
  statusFilter?: string
): Promise<ExperimentRecord[]> {
  const db = await getDB();
  let records = await db.getAllFromIndex('experiments', 'by-updated');
  // Sort descending by updatedAt
  records.reverse();

  if (statusFilter && statusFilter !== 'all') {
    records = records.filter((r) => r.status === statusFilter);
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim();
    records = records.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.metricName.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.tags && r.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }

  return records;
}

/**
 * Retrieves a single experiment by ID.
 */
export async function getExperimentById(id: string): Promise<ExperimentRecord | undefined> {
  const db = await getDB();
  return db.get('experiments', id);
}

/**
 * Saves or updates an experiment record.
 */
export async function saveExperiment(record: ExperimentRecord): Promise<void> {
  const db = await getDB();
  const toSave: ExperimentRecord = {
    ...record,
    updatedAt: Date.now(),
  };
  await db.put('experiments', toSave);
}

/**
 * Deletes an experiment by ID.
 */
export async function deleteExperiment(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('experiments', id);
}

/**
 * Duplicates an existing experiment.
 */
export async function duplicateExperiment(id: string): Promise<ExperimentRecord> {
  const db = await getDB();
  const original = await db.get('experiments', id);
  if (!original) {
    throw new Error(`Experiment ${id} not found`);
  }

  const now = Date.now();
  const duplicated: ExperimentRecord = {
    ...original,
    id: `exp-${now}-${Math.random().toString(36).substring(2, 7)}`,
    name: `${original.name} (副本)`,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  await db.put('experiments', duplicated);
  return duplicated;
}

/**
 * Exports all experiments as an array.
 */
export async function exportAllExperiments(): Promise<ExperimentRecord[]> {
  const db = await getDB();
  return db.getAll('experiments');
}

/**
 * Imports multiple experiment records with validation and conflict resolution.
 */
export async function importExperiments(
  records: any[]
): Promise<{ importedCount: number; errors: string[] }> {
  const db = await getDB();
  const tx = db.transaction('experiments', 'readwrite');
  let importedCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const raw = records[i];
    if (!raw || typeof raw !== 'object') {
      errors.push(`第 ${i + 1} 筆資料非有效物件`);
      continue;
    }

    if (!raw.name || typeof raw.name !== 'string') {
      errors.push(`第 ${i + 1} 筆資料缺少名稱 (name)`);
      continue;
    }

    if (!Array.isArray(raw.variants) || raw.variants.length < 2) {
      errors.push(`第 ${i + 1} 筆「${raw.name}」變體組數少於 2 組`);
      continue;
    }

    const cleanVariants = raw.variants.map((v: any, vIdx: number) => ({
      id: v.id || `var-${Date.now()}-${vIdx}`,
      name: v.name || `組別 ${vIdx + 1}`,
      visitors: Math.max(0, parseInt(v.visitors) || 0),
      conversions: Math.max(0, parseInt(v.conversions) || 0),
      expectedTrafficPercent: parseFloat(v.expectedTrafficPercent) || 50,
      isControl: Boolean(v.isControl),
      notes: v.notes || '',
    }));

    // Ensure at least one control
    if (!cleanVariants.some((v: any) => v.isControl)) {
      cleanVariants[0].isControl = true;
    }

    const now = Date.now();
    const cleanRecord: ExperimentRecord = {
      id: raw.id || `exp-${now}-${Math.random().toString(36).substring(2, 7)}`,
      name: String(raw.name),
      metricName: raw.metricName ? String(raw.metricName) : '轉換率',
      description: raw.description ? String(raw.description) : '',
      status: ['draft', 'running', 'concluded', 'archived'].includes(raw.status)
        ? raw.status
        : 'draft',
      createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : now,
      updatedAt: now,
      variants: cleanVariants,
      settings: {
        experimentName: raw.settings?.experimentName || String(raw.name),
        metricName: raw.settings?.metricName || raw.metricName || '轉換率',
        confidenceLevel: raw.settings?.confidenceLevel || 0.95,
        hypothesisDirection: raw.settings?.hypothesisDirection || 'two-sided',
        useContinuityCorrection: Boolean(raw.settings?.useContinuityCorrection),
        enableMultipleTestingCorrection: Boolean(raw.settings?.enableMultipleTestingCorrection),
      },
      tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    };

    await tx.store.put(cleanRecord);
    importedCount++;
  }

  await tx.done;
  return { importedCount, errors };
}
