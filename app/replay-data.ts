export type Sample = { t: number; valid: boolean; n: number[] | null; shear: number[] | null; direction: (number | null)[] | null; proximity: number[] | null };
export type Camera = { id: string; label: string; video: string; poster: string; times: number[] };
export type Recording = { episode: string; duration: number; outcome: string; technical_valid: boolean; max_age_ms: number; preview_fps: number; force_unit_N: number; labels: string[]; cameras: Camera[]; hands: Record<string, Sample[]> };
export type Metric = 'n' | 'shear' | 'proximity';
export type Hand = 'left' | 'right';
export type TracePoint = { t: number; value: number };

// The exported Inspire G2 channels have this fixed order. Display labels belong
// to the English UI, not to cached recording metadata.
export const REGION_LABELS = ['Little finger', 'Ring finger', 'Middle finger', 'Index finger', 'Thumb', 'Palm right', 'Palm center', 'Palm left'];
export const METRIC_LABELS = { n: 'Normal force', shear: 'Shear force', proximity: 'Proximity' };
const CAMERA_LABELS: Record<string, string> = { head: 'Stereo head camera', left_wrist: 'Left wrist camera', right_wrist: 'Right wrist camera' };

export function normalizeRecording(data: Recording): Recording {
  return { ...data, labels: [...REGION_LABELS], cameras: data.cameras.map(camera => ({ ...camera, label: CAMERA_LABELS[camera.id] || 'Camera' })) };
}

export function regionsFor(metric: Metric) { return REGION_LABELS.slice(0, metric === 'proximity' ? 5 : 8); }
export function unitFor(metric: Metric) { return metric === 'proximity' ? 'raw' : 'N'; }

export function previous<T>(items: T[], t: number, time: (item: T) => number): T | undefined {
  let lo = 0, hi = items.length;
  while (lo < hi) { const mid = (lo + hi) >>> 1; if (time(items[mid]) <= t) lo = mid + 1; else hi = mid; }
  return items[lo - 1];
}

export function sampleValue(sample: Sample | undefined, metric: Metric, region: number, forceUnit: number): number | null {
  if (!sample?.valid || region < 0 || region >= regionsFor(metric).length) return null;
  const value = sample[metric]?.[region];
  return typeof value === 'number' && Number.isFinite(value) ? value * (metric === 'proximity' ? 1 : forceUnit) : null;
}

export function valueAt(data: Recording, hand: Hand, metric: Metric, region: number, time: number) {
  const sample = previous(data.hands[hand] || [], time, s => s.t);
  if (!sample || (time - sample.t) * 1000 > data.max_age_ms + 1e-6) return null;
  return sampleValue(sample, metric, region, data.force_unit_N);
}

export function traceSegments(samples: Sample[], metric: Metric, region: number, forceUnit: number, maxAgeMs: number): TracePoint[][] {
  const segments: TracePoint[][] = [];
  let segment: TracePoint[] | undefined;
  let lastTime = -Infinity;
  for (const sample of samples) {
    const value = sampleValue(sample, metric, region, forceUnit);
    if (value === null) { segment = undefined; lastTime = -Infinity; continue; }
    if (!segment || (sample.t - lastTime) * 1000 > maxAgeMs + 1e-6) {
      segment = []; segments.push(segment);
    }
    segment.push({ t: sample.t, value });
    lastTime = sample.t;
  }
  return segments;
}
