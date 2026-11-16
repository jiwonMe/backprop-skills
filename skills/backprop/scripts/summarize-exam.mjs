#!/usr/bin/env node
// Client-side aggregation only. No network access or mathematical verification.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';

export function summarizeExam(input) {
  const fail = message => { throw new Error(message); };
  if (!input || input.version !== 'exam-ledger-v1' || !Array.isArray(input.items)) fail('Expected exam-ledger-v1 with items array');
  const items = input.items;
  if (items.length > 1000) fail('Maximum 1000 items');
  if (input.expected_count !== null && (!Number.isSafeInteger(input.expected_count) || input.expected_count < items.length)) fail('expected_count must be null or an integer >= received items');
  const ids = new Set();
  const levels = ['algebra', 'conditions', 'boundaries', 'enumeration'];
  const counts = { reviewed: 0, deferred: 0, failed: 0, pending: 0 };
  const units = Object.create(null), mutations = Object.create(null);
  const metrics = Object.fromEntries(levels.map(k => [k, { sum: 0, known: 0, mean: null }]));
  let delayed = 0, delayedKnown = 0, marks = 0, marksKnown = 0;
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id)) fail('Item IDs must be nonempty and unique');
    ids.add(item.id);
    if (!Object.hasOwn(counts, item.status)) fail(`Invalid status: ${item.id}`);
    counts[item.status]++;
    if (typeof item.source_ref !== 'string' || !item.source_ref.trim()) fail(`Missing source_ref: ${item.id}`);
    if (item.marks_tenths !== null) {
      if (!Number.isSafeInteger(item.marks_tenths) || item.marks_tenths < 0 || item.marks_tenths > 10000) fail(`Invalid marks_tenths: ${item.id}`);
      marks += item.marks_tenths; marksKnown++;
    }
    for (const field of ['unit', 'mutation']) if (item[field] !== null && (typeof item[field] !== 'string' || !item[field].trim())) fail(`Invalid ${field}: ${item.id}`);
    if (item.delayed_pruning !== null && typeof item.delayed_pruning !== 'boolean') fail(`Invalid delayed_pruning: ${item.id}`);
    if (item.delayed_pruning === true && (typeof item.pruning_evidence !== 'string' || !item.pruning_evidence.trim())) fail(`Missing pruning evidence: ${item.id}`);
    if (item.mutation !== null && (typeof item.comparison_ref !== 'string' || !item.comparison_ref.trim())) fail(`Mutation needs inspected comparison_ref: ${item.id}`);
    if (!item.levels || levels.some(k => item.levels[k] !== null && ![0, 1, 2].includes(item.levels[k]))) fail(`Levels must be 0, 1, 2 or null: ${item.id}`);
    if (item.status !== 'reviewed') continue;
    if (item.unit !== null) units[item.unit] = (units[item.unit] ?? 0) + 1;
    if (item.mutation !== null) mutations[item.mutation] = (mutations[item.mutation] ?? 0) + 1;
    if (item.delayed_pruning !== null) { delayedKnown++; if (item.delayed_pruning) delayed++; }
    for (const k of levels) if (item.levels[k] !== null) { metrics[k].known++; metrics[k].sum += item.levels[k]; }
  }
  for (const metric of Object.values(metrics)) metric.mean = metric.known ? metric.sum / metric.known : null;
  return {
    version: 'exam-summary-v1', received: items.length, expected: input.expected_count,
    missing: input.expected_count === null ? null : input.expected_count - items.length,
    status_counts: counts, marks: { known_items: marksKnown, total_tenths: marks },
    units: { counts: units, known_items: Object.values(units).reduce((a, b) => a + b, 0), eligible_items: counts.reviewed },
    mutations: { counts: mutations, known_items: Object.values(mutations).reduce((a, b) => a + b, 0), eligible_items: counts.reviewed },
    delayed_pruning: { count: delayed, known_items: delayedKnown, eligible_items: counts.reviewed, percent_of_known: delayedKnown ? 100 * delayed / delayedKnown : null },
    metric_rubric: 'client-quantized-0-2-v1; not empirically calibrated', metrics,
    warning: 'Aggregation validates ledger shape and arithmetic, not evidence truth, source identity or mathematical correctness.',
  };
}
if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) {
  try {
    if (!process.argv[2]) throw new Error('Usage: node scripts/summarize-exam.mjs <exam-ledger.json>');
    console.log(JSON.stringify(summarizeExam(JSON.parse(await readFile(process.argv[2], 'utf8'))), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
