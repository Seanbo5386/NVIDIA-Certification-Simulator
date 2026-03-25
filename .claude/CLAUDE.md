# Project Guidelines

## Bug Fixing

When fixing bugs, verify the fix actually works before moving on. If a fix doesn't work on the first attempt, investigate the root cause more deeply rather than applying surface-level patches.

Before fixing a bug, first reproduce it: explain exactly what's happening, why it's happening, and what the correct behavior should be. Then propose a fix with your confidence level.

## TypeScript

This is a TypeScript project. Always use TypeScript conventions, types, and strict mode compliance. Check for type errors before committing.

## Dev Server

After making changes, always verify the dev server starts cleanly. Check for port conflicts and clear Turbopack cache if needed (`rm -rf .next` or equivalent).

## Tone & Style

When writing git commit messages and PR descriptions, keep the tone professional but authentic — avoid grandiose or marketing-style language.

## Testing

Always run the full test suite after making changes. If tests fail, fix them before committing. Pay attention to test expectations that may need updating when features change (e.g., step counts, mock data).

## Task Focus

Tackle one task fully (including verification) before moving to the next to avoid interrupted/partial work. If given multiple tasks, confirm which one to start with and complete it fully before moving on.

## Exploration

Use task agents for codebase exploration. Leverage sub-agents for exploration phases to keep the main conversation focused on implementation. Be explicit about using task agents for reading/understanding code, then report back with a summary before making changes.
