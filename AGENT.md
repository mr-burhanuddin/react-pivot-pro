# Pivot Table Engine — AI Agent Instructions

You are building a production-grade React + TypeScript pivot table library.

## Core Principles

- Headless-first (no UI in core)
- Plugin-based architecture
- Fully typed APIs
- Performance-first (memoization, caching)
- Extensible and composable

## DO NOT:

- Write large monolithic components
- Mix UI with logic
- Use `any`
- Duplicate logic across plugins

## ALWAYS:

- Create reusable hooks
- Use functional composition
- Use feature plugins
- Keep modules independent

## Folder Discipline

- core = logic only
- plugins = isolated features
- hooks = React bindings
- ui = optional components

## Output Rules

- Only generate code for requested module
- Do not modify unrelated files
- Ensure all code compiles
