# Client exam report ledger

Use the exam-wide workflow in SKILL.md. The report ledger is a local artifact, not a new Backprop RPC payload. It complements the per-problem IR and must not be inserted as extra fields into strict v2.1 JSON. The bundled script never calls a server or model.

Run `node <skill-dir>/scripts/summarize-exam.mjs exam-ledger.json` to aggregate a frozen ledger. Keep private source contents in the user's authorized workspace; do not publish the ledger. Raw floating-point scores are not accepted as extracted levels; resulting means and percentages are computed by the script. Display rounded values with the denominator and rubric, not as calibrated measurements.

```json
{
  "version": "exam-ledger-v1",
  "expected_count": 1,
  "items": [{
    "id": "paper-a/page-1/item-1",
    "source_ref": "paper-a.pdf, page 1, printed item 1",
    "status": "reviewed",
    "marks_tenths": 42,
    "unit": "Quadratic inequalities",
    "delayed_pruning": null,
    "pruning_evidence": null,
    "mutation": null,
    "comparison_ref": null,
    "levels": {"algebra": 1, "conditions": 1, "boundaries": 2, "enumeration": 0}
  }]
}
```

- `expected_count`: null if the full paper count is unknown; otherwise an integer at least as large as the received unique item count.
- `status`: reviewed, deferred, failed or pending. Only reviewed items contribute to analytical aggregates. Marks coverage counts all received items with known printed marks.
- `marks_tenths`: printed points times ten, or null. Do not infer missing points from an assumed paper total.
- `unit`: one primary unit per item, or null. If multiple units apply, preserve them separately in the report; this primary distribution is mutually exclusive.
- `delayed_pruning`: true only with an actual branch/candidate/rejection argument in `pruning_evidence`; false only after review; null for unknown.
- `mutation`: a primary observed relation to an inspected comparison item, with `comparison_ref`; null when the original is unknown. A relation does not establish historical author intent.
- Levels: 0 low, 1 moderate, 2 high, null unknown. Algebra: direct evaluation / multi-step manipulation / substantial parameter elimination. Conditions: direct / one quantifier or simple range / nested quantifiers or coupled conditional constraints. Boundaries: no special endpoint issue / explicit endpoint check / several interacting endpoints or lattice restrictions. Enumeration: no separate case enumeration / 3-5 cases / 6+ cases; 1-2 simple cases can remain 0 if handled directly. These are reporting conventions, not measured student difficulty.

Every non-null classification must be backed by source/proof evidence in the report appendix. The script only checks that references are present, not that they are true. It does not compute mark-weighted distributions or certify proofs; derive additional views explicitly from the same ledger and disclose their method.

## Report structure

1. Coverage and reliability.
2. Executive profile with observed unit/reasoning distributions.
3. Full item table, including deferred and missing-source items.
4. Reasoning-chain and object/condition/target comparison.
5. Demonstrated branch rejection versus hypothetical student mistakes.
6. Computation burdens and checked, curriculum-appropriate alternatives.
7. Evidence-based preparation recommendations, not inferred author intent.
8. Audit appendix with metric versions, denominators, source references and uncertainty.

Never reproduce example school metrics as measured values. One exam is not a longitudinal school profile. Student error rates, completion time, speedup and grade separation require empirical evidence. Generated practice exams require a separate user request and independent validation.
