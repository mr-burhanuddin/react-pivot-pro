# AGENTS.md

# AI Operating Instructions

This repository contains a dedicated AI knowledge base located in:

```text
.ai/
```

Before performing any task, read the relevant documentation from `.ai`.

Do not rely on assumptions.

Repository documentation overrides generic model knowledge.

---

# Required Reading Order

Always read these files before making code changes.

## Core Documents

```text
.ai/PROJECT_RULES.md
.ai/ARCHITECTURE.md
.ai/AI_GUIDE.md
```

These files define:

* architecture
* coding standards
* project constraints
* implementation expectations
* approved patterns

---

## Context Documents

Read as needed:

```text
.ai/context/project-context.md
.ai/context/architecture-context.md
.ai/context/patterns-context.md
.ai/context/feature-map.md
.ai/context/glossary.md
```

These files contain compressed project knowledge optimized for AI agents.

---

## Persona Documents

Select the persona most relevant to the task.

```text
.ai/personas/architect.md
.ai/personas/frontend-engineer.md
.ai/personas/backend-engineer.md
.ai/personas/code-reviewer.md
.ai/personas/ai-first-builder.md
```

The selected persona guides implementation decisions.

When multiple personas apply:

1. Architect
2. Domain Engineer
3. Code Reviewer

---

# Task Workflow

For every task:

## Phase 1 — Understand

Identify:

* request
* affected features
* impacted modules

---

## Phase 2 — Load Context

Read:

* Core Documents
* Relevant Context Files
* Relevant Persona

---

## Phase 3 — Discover Existing Patterns

Before writing code:

Search for:

* similar components
* similar hooks
* similar services
* similar API integrations
* similar state management patterns

Prefer existing repository patterns over new patterns.

---

## Phase 4 — Implement

Follow:

1. PROJECT_RULES.md
2. ARCHITECTURE.md
3. Existing Repository Patterns

in that order.

---

## Phase 5 — Validate

Verify:

* architecture compliance
* type safety
* performance impact
* accessibility impact
* consistency with existing patterns

---

# Evidence-Based Development

Never assume.

If something cannot be proven from:

* code
* imports
* dependencies
* configuration
* documentation

state:

"Unable to determine from repository evidence."

Do not invent:

* architecture
* workflows
* business logic
* naming conventions
* design decisions

---

# Repository Rules

Follow repository conventions even if they differ from industry defaults.

Consistency is preferred over introducing new patterns.

Avoid architectural drift.

Avoid parallel implementations of existing solutions.

---

# Security Rules

Never expose or document:

```text
.env
.env.*
secrets.*
credentials.*
*.pem
*.key
```

Never output:

* tokens
* secrets
* passwords
* certificates
* private credentials

Sensitive files may be acknowledged but never used as implementation context.

---

# Documentation Location

All AI documentation lives under:

```text
.ai/
```

If documentation conflicts with implementation:

1. Verify actual code.
2. Treat code as source of truth.
3. Update documentation if necessary.

---

# Definition Of Done

A task is complete only if:

✓ Existing patterns were reviewed

✓ Architecture rules were followed

✓ No duplicate abstractions were introduced

✓ Type safety was maintained

✓ Changes align with repository conventions

✓ Documentation remains accurate
