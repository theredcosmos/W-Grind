# Project Constitution (gemini.md)

## Data Schemas
```json
{
  "id": "string (unique identifier)",
  "title": "string (Question title)",
  "url": "string (Link to LeetCode)",
  "pattern": "string (e.g., Two Pointers, Sliding Window)",
  "subpattern": "string",
  "difficulty": "string (Easy, Medium, Hard)",
  "companies": ["string"]
}
```

## Behavioral Rules
- System Pilot Identity: Prioritize reliability over speed, deterministic self-healing automation.
- B.L.A.S.T Protocol: Blueprint, Link, Architect, Stylize, Trigger.
- A.N.T 3-Layer Architecture: Architecture (SOPs), Navigation (Decision Making), Tools (Python scripts).
- Data-First Rule: Define JSON Data Schema before building any tools.
- Deliverables vs Intermediates: Local `.tmp/` for intermediates, Global for Payload.

## Architectural Invariants
- Layer 1: SOPs in markdown.
- Layer 2: Routing via LLM.
- Layer 3: Deterministic python scripts in `tools/`.
- No scripts in `tools/` until Discovery and Schema are defined.
- Errors must be analyzed, patched, tested, and architecture updated.
