# Copilot Instruction (Tunnel GMAO)

Repository-specific rules synthesized from project documentation and prior conversations. Apply these over the general instructions.

## Sources of Truth

- Always conform to docs/tech/CONVENTIONS.md and related docs under docs/ and \_archive_analysis/; do not deviate without approval.
- Respect jsconfig alias @/\* for imports; avoid deep relative paths.

## Code Style & Structure

- Import order (mandatory): React core; React Router; external libs; UI libs (Radix); icons; custom components; hooks; utilities; config.
- No emojis in source; use Lucide React icons instead.
- Components in src/components/common/ must include PropTypes and full JSDoc (@fileoverview, @module, @component, @example). Keep files under 200 lines and complexity <= 10.
- Extract helpers/constants for non-trivial logic; name helpers with verbs and constants in SCREAMING_SNAKE_CASE.
- Prefer subcomponents for repeated UI blocks; keep naming consistent with parent.
- Use idiomatic, natural naming (avoid robotic/verbose AI patterns). Comments only when explaining non-obvious intent.

## UI/UX Standards

- Forms (inline or standalone) use blue backgrounds var(--blue-2) with border var(--blue-6); headers include icon size 20 and bold title size 3; buttons: primary blue "Enregistrer" and secondary gray "Annuler" size 2.
- Inputs must have visible borders, bold labels, required marks, clear focus states, and accessible aria attributes. No browser alerts/confirm/prompt; use project notification components.
- Suggestion dropdowns: position absolute above the field, onMouseDown with preventDefault, small close delay on blur, z-index 10000, max height ~220px.
- Avoid long unpaginated lists; consider pagination for >100 items. Use Radix responsive props and breakpoints (initial, xs, sm, md, lg, xl).

## Hooks & Data Fetching

- Hook order: useState, useRef, router hooks, custom hooks, useMemo, useCallback, useEffect. Protect against double-run with refs in StrictMode.
- Use useApiCall/useApiMutation patterns; prefer executeSilent for refresh without loaders; parallelize requests with Promise.all when safe.

## Naming & Files

- Components/Pages PascalCase; hooks camelCase; utilities/config camelCase; folders kebab-case. Booleans prefixed is/has; callbacks on*/handle*. Config/constants SCREAMING_SNAKE_CASE.

## Error Handling & Notifications

- Use ErrorDisplay for errors with retry; inline field errors show icon + text; global notifications via Callout with standardized colors (red/amber/green/blue). No console noise or leftover debug logs.

## Security & Data

- Sanitize/strip HTML via utilities for rendered content. Validate inputs (e.g., email regex). Never hardcode secrets; use import.meta.env variables.

## Performance

- Memoize expensive derives with useMemo/useCallback; avoid redundant fetches; lazy-load tab content; keep components lean and avoid over-engineering.

## Documentation & Changelog

- Update docs when behavior or contracts change. For changelog entries, follow docs/tech/CONVENTIONS.md rules: user-visible impact only, no technical self-justification, correct stability flag, and patch template for single simple changes.

## Testing & Verification

- Run npm run build and lint before delivery; remove console logs. Add or update tests when logic changes (structure under src/**tests**). Provide manual test notes for loading, errors, validation, responsive, and accessibility states.

## Git Discipline

- Use conventional commits (type(scope): subject). Avoid introducing new dependencies unless approved; never revert user changes in unrelated files.
