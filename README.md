# Backprop Agent Skills

Official public skill package for **Backprop** — private mathematics problem OCR ingestion, v2.1 ProblemIR/ProofIR verification (paired with [Kontology MCP](https://www.kontology.com/mcp)), and hybrid problem lineage matching.

## Install via `npx skills`

```sh
npx skills add jiwonMe/backprop-skills
```

Or install specifically for your agent globally:

```sh
npx skills add jiwonMe/backprop-skills --skill backprop -g
```

## Required MCP Server Configuration

Register both `backprop` and companion `kontology` HTTP MCP servers in your coding agent (`.mcp.json` / client settings), then complete browser OAuth sign-in on first call to `backprop`:

```json
{
  "mcpServers": {
    "backprop": {
      "type": "http",
      "url": "https://hkipchhocpwdewfunpxl.supabase.co/functions/v1/mcp"
    },
    "kontology": {
      "type": "http",
      "url": "https://www.kontology.com/mcp"
    }
  }
}
```

## Included Skills

- **[backprop](./skills/backprop/SKILL.md)** (`v0.3.1`):
  - **Self-Update Check**: Calls `check_skill_update` via MCP or runs `node skills/backprop/scripts/check-update.mjs` against `https://hkipchhocpwdewfunpxl.supabase.co/functions/v1/mcp/skill-version` once per session and upgrades via `npx skills update backprop` when outdated.
  - **Milestone 1 (OCR)**: `ingest_ocr_json`, `find_import`, `get_document`, `list_problems`, `get_problem`.
  - **Milestone 2 (v2.1 IR & Provenance Engine)**: 6-turn server-guided state machine (`v21_start_session` → `v21_submit_problem_ir` → `v21_submit_obligations` → `v21_submit_proof_graph` → `v21_finalize_record` → `v21_match_lineage`) + fast-path `v21_ingest_jsonl_line`.

## License

MIT
