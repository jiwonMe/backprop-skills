# Backprop v2.1 MathJSON AST & 7 Invariants Quick Reference

## 1. Seven Hard Invariants (Server-Enforced)

1. **`IR_BOUNDARY_LEAK` (Invariant 1)**: `problem_ir` may reference ONLY stem-given symbols (`is_given_in_stem: true`). Never place intermediate substitution variables or solved unknown values in `problem_ir`.
2. **`NON_COMPOSITIONAL_AST` (Invariant 2)**: Never use shortcut string tags. Compose `Interval(lo, hi, leftClosedBool, rightClosedBool)`, `SetImage(fn, set)`, `RootSet(eqOrExpr, var, domainSet)`, `SetCardinality(set, "DISTINCT" | "WITH_MULTIPLICITY")`, and quantifiers `BinderForAll` / `BinderExists`.
3. **`MISSING_IFF_OBLIGATION_PAIR` & `MISSING_DOMAIN_GUARD` (Invariant 3)**:
   - Every `Divide`, `Log`, `Ln`, even `Sqrt`/`Root`, and `Tan` with variable expressions requires `domain_guards` on `problem_ir.objects` AND a `DOMAIN_GUARD` obligation in `proof_ir.obligations`.
   - Every `LogicIff` assumption requires BOTH `IFF_SUFFICIENCY` and `IFF_NECESSITY` obligations.
4. **`RESOLVED_EXPR_IS_CONSTANT` (Invariant 4)**: `resolved_object_ast` and `canonical_seeds[].canonical_ast` MUST be non-constant mathematical expressions/functions/equations, even when the final problem answer is a scalar number. Derive the scalar answer at the end via `BRIDGE_GOAL_EVALUATION`.
5. **`DIMENSION_DOMAIN_MISMATCH` (Invariant 5)**: Never assign `continuous_dimension > 0` when all remaining `unknown_parameters` belong to discrete `N` / `Z` domains.
6. **Verification Monotonicity (Invariant 6)**: Never mark `GOAL_TERMINAL` as `"verified"` while any `OPEN` obligation remains, and never derive `"verified"` conclusions from `"unverified"`/`"unsupported"` premises. `is_delayed_pruning: true` is valid ONLY on `"refuted"` claims.
7. **`ZERO_FLOAT_VIOLATION` (Invariant 7)**: No floating-point or scientific literals (`0.5`, `1.0`, `1e-3`) anywhere in JSON/JSONL. Use reduced coprime `["Rational", p, q]` (`q > 1`) for rationals and `0 | 1 | 2` integers for quantized friction/compression levels.

## 2. Phase-1 Supported Kontology Courses (`curriculum_framework:kr_2022`)

- `course:common_math_1` (공통수학1)
- `course:common_math_2` (공통수학2)
- `course:algebra` (대수)
- `course:calculus_1` (미적분Ⅰ)
- `course:calculus_2` (미적분Ⅱ)

Always query `https://www.kontology.com/mcp` (`search_entities`, `get_concept_overview`, `get_prerequisites`, `plan_problem`, `find_problems`) so every `concept:*`, `achievement_standard:*`, `solution_pattern:*`, `skill:*`, and `misconception:*` CURIE is active and within the declared course scope.

## 3. 100% Connected Hypergraph Rules (`proof_ir`)

- In-degree 0 claims MUST be `ANCHOR` claims tied to `problem_ir` (`SYMBOL_DOMAIN | OBJECT_DEF | ASSUMPTION | BRANCH_CONDITION`).
- Exactly 1 claim must be `GOAL_TERMINAL` in `"ctx_root"` with out-degree 0.
- Every claim and inference must be constructively reachable forward from `ANCHOR` claims AND backward from `GOAL_TERMINAL` (single connected DAG component).
- Branching must use `BRIDGE_CASE_SPLIT_EXHAUSTIVE` → branch steps / `BRIDGE_CONTRADICTION_REFUTE` → `BRIDGE_CASE_MERGE` back into the parent context.
