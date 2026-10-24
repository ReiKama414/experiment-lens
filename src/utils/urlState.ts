import type {
  Variant,
  ExperimentSettings,
  PowerCalculationInput,
  BusinessImpactInput,
} from '../types/experiment';

export interface ExperimentStateSnapshot {
  version: number;
  experimentName: string;
  metricName: string;
  variants: Variant[];
  settings: ExperimentSettings;
  powerPlanner?: PowerCalculationInput;
  businessImpact?: BusinessImpactInput;
}

/**
 * Safe UTF-8 to Base64 encoder
 */
function utf8ToBase64(str: string): string {
  try {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  } catch (e) {
    console.error('Failed to encode base64', e);
    return '';
  }
}

/**
 * Safe Base64 to UTF-8 decoder
 */
function base64ToUtf8(str: string): string {
  try {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(str), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    console.error('Failed to decode base64', e);
    return '';
  }
}

/**
 * Encodes current experiment state to URL hash
 */
export function serializeStateToUrl(snapshot: ExperimentStateSnapshot): string {
  const jsonStr = JSON.stringify(snapshot);
  const base64 = utf8ToBase64(jsonStr);
  const url = new URL(window.location.href);
  url.hash = `exp=${base64}`;
  return url.toString();
}

/**
 * Parses experiment state from current URL hash
 */
export function parseStateFromUrl(): ExperimentStateSnapshot | null {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.includes('exp=')) return null;

    const match = hash.match(/exp=([A-Za-z0-9+/=]+)/);
    if (!match || !match[1]) return null;

    const base64 = match[1];
    const jsonStr = base64ToUtf8(base64);
    if (!jsonStr) return null;

    const snapshot = JSON.parse(jsonStr) as ExperimentStateSnapshot;
    if (snapshot && Array.isArray(snapshot.variants) && snapshot.variants.length > 0) {
      return snapshot;
    }
  } catch (err) {
    console.warn('Failed to parse experiment state from URL:', err);
  }
  return null;
}
