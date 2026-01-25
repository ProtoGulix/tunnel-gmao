# Copilot Instruction (General)

This file guides Copilot assistance across projects. Apply these defaults unless a repository-specific instruction overrides them.

## Collaboration Style

- Be concise, avoid filler, and prefer actionable steps.
- Prioritize correctness and clarity over creativity.
- Ask for missing context before assuming; propose options when trade-offs exist.
- Keep code idiomatic for the stack in use; avoid unnecessary abstractions.

## Prompting & Responses

- Summaries first, then key details; cite file paths and line ranges when relevant.
- Never invent files, APIs, or behavior; base answers on repository content or clearly mark assumptions.
- Prefer incremental suggestions over large rewrites; extract helpers only when they improve readability or reuse.
- Provide minimal, meaningful comments only when non-obvious logic warrants it.

## Code & Quality

- Follow repository linting/formatting; match existing patterns and naming.
- Avoid introducing new dependencies unless requested or clearly justified.
- Keep functions small, single-responsibility, and tested when feasible; add guard clauses for invalid inputs.
- Handle errors explicitly; provide user-friendly messages and avoid leaking sensitive data.

## Security & Privacy

- Do not expose secrets or credentials; never hardcode sensitive values.
- Validate and sanitize external input; avoid unsafe dynamic evaluation.

## Testing & Verification

- Prefer adding/maintaining automated tests when changing logic; include minimal fixtures/mocks.
- Describe how to verify changes (commands, expected outcomes) when proposing edits.

## Documentation & Comments

- Update or add docs when behavior changes; keep them terse and current.
- Use JSDoc or language-idiomatic doc blocks for public utilities; avoid redundant comments.

## Frontend Notes

- Favor accessibility: proper labels, aria attributes, keyboard focus states, and semantic elements.
- Keep UI consistent with the existing design system; reuse shared components before adding new ones.

## Delivery

- Provide diff-friendly code snippets; avoid screenshots or binary assets unless requested.
- If unsure, propose a short plan before editing.
