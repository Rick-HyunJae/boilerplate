---
name: comment-patterns
description: |
    Use when writing, reviewing, or refactoring comments and JSDoc in TypeScript/TSX/config files,
    especially when deciding whether to add, move, format, or remove comments, or when applying the
    project's WHY-only comment rules. Use for prompts like "주석 달아줘", "JSDoc 정리해줘",
    "주석 규칙 확인해줘", or any task that asks for comment cleanup, comment style, or comment examples.
---

# Commenting Guidelines

Use this skill when comments are part of the task. The goal is to keep comments
small, useful, and non-redundant.

## What comments should do

- Explain WHY, not WHAT.
- Capture hidden constraints, surprising behavior, or non-obvious design
  choices.
- Help the next reader avoid guessing.

## What to avoid

- Repeating code that already explains itself.
- Adding comments just because the file feels "too quiet".
- Inline property comments for object literals.
- Commenting barrel `index.ts` files.

## JSDoc rules

- Prefer JSDoc for exported functions, hooks, config objects, and non-obvious
  exported types.
- Put the JSDoc on the top-level declaration.
- Keep tag groups readable with blank lines between distinct blocks.
- Do not end comment sentences with a period.

## Inline comment rules

- Use `//` only when the explanation belongs inside a component body or at a
  plugin / utility integration point.
- Use `/* ... */` for multi-line explanation blocks only when JSDoc is not the
  right shape.
- Keep inline comments short and context-specific.

## How to work with the bundled examples

- Read `assets/templates/` when you need a ready-to-copy skeleton.
- Read `assets/examples/` when you need a concrete good/bad example.
- Prefer adapting the template structure instead of inventing a new comment
  style on the fly.

## Reference material

- `references/policy.md` contains the full rule set and decision notes.

