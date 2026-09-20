import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecording, regionsFor, sampleValue, traceSegments, valueAt } from '../app/replay-data.ts';

const sample = (t, values = [3, 20, 5, 0, 4, 6, 7, 8], valid = true) => ({ t, valid, n: values, shear: values, proximity: [40, 0, 20, 80, 100], direction: null });
const recording = (samples = [sample(0)]) => ({ duration: 1, max_age_ms: 100, preview_fps: 15, force_unit_N: .01, labels: Array(8).fill('\u4e2d\u6587'), cameras: [{ id: 'head', label: '\u5934\u90e8\u53cc\u76ee' }, { id: 'left_wrist', label: '\u5de6\u8155' }, { id: 'right_wrist', label: '\u53f3\u8155' }], hands: { left: samples, right: samples } });

test('cached recording labels are rendered in English without changing sensor data', () => {
  const original = recording(), normalized = normalizeRecording(original);
  assert.deepEqual(normalized.labels, ['Little finger', 'Ring finger', 'Middle finger', 'Index finger', 'Thumb', 'Palm right', 'Palm center', 'Palm left']);
  assert.deepEqual(normalized.cameras.map(c => c.label), ['Stereo head camera', 'Left wrist camera', 'Right wrist camera']);
  assert.equal(normalized.hands, original.hands);
  assert.equal(original.cameras[0].label, '\u5934\u90e8\u53cc\u76ee');
});

test('each trace uses its own region instead of the maximum across regions', () => {
  const rows = [sample(0), sample(.03, [0, 10, 60, 0, 0, 0, 0, 0])];
  assert.deepEqual(traceSegments(rows, 'n', 0, .01, 100), [[{ t: 0, value: .03 }, { t: .03, value: 0 }]]);
  assert.deepEqual(traceSegments(rows, 'n', 1, .01, 100), [[{ t: 0, value: .2 }, { t: .03, value: .1 }]]);
});

test('force values convert to N while proximity stays in raw units', () => {
  assert.equal(sampleValue(sample(0), 'shear', 1, .01), .2);
  assert.equal(sampleValue(sample(0), 'proximity', 0, .01), 40);
  assert.equal(sampleValue(sample(0), 'proximity', 1, .01), 0);
  assert.equal(regionsFor('proximity').length, 5);
  assert.equal(sampleValue(sample(0), 'proximity', 5, .01), null);
  assert.equal(regionsFor('n').length, 8);
});

test('invalid samples, missing values and long gaps break a trace without inserting zeros', () => {
  const rows = [sample(0), sample(.03, undefined, false), sample(.06), sample(.26), { ...sample(.29), n: null }, sample(.32)];
  assert.deepEqual(traceSegments(rows, 'n', 0, .01, 100).map(segment => segment.map(p => p.t)), [[0], [.06], [.26], [.32]]);
  assert.equal(sampleValue(sample(0, [NaN]), 'n', 0, .01), null);
  assert.equal(sampleValue(sample(0, []), 'n', 0, .01), null);
});

test('cursor readings use the latest past sample and expire without looking ahead', () => {
  const data = recording([sample(.1), sample(.4, [50])]);
  assert.equal(valueAt(data, 'left', 'n', 0, .09), null);
  assert.equal(valueAt(data, 'left', 'n', 0, .2), .03);
  assert.equal(valueAt(data, 'left', 'n', 0, .201), null);
  assert.equal(valueAt(data, 'left', 'n', 0, .4), .5);
});

test('an invalid latest sample is unavailable even when an older sample was valid', () => {
  const data = recording([sample(0), sample(.03, undefined, false)]);
  assert.equal(valueAt(data, 'right', 'n', 0, .04), null);
});
