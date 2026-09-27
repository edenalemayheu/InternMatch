# InternMatch — Documentation

This folder contains the full specification for InternMatch, intended to be read alongside the project's root [`README.md`](../README.md). Each document covers one concern in depth so an AI coding assistant (or a human contributor) can implement a feature correctly without needing the full project context loaded at once.

## Index

| Document | Covers |
|---|---|
| [`requirements.md`](./requirements.md) | Functional and non-functional requirements |
| [`usecase.md`](./usecase.md) | Use cases per actor (Student, Company, Admin) |
| [`database.md`](./database.md) | Full database schema, types, relationships, indexes |
| [`ui-foundation-spec.md`](./ui-foundation-spec.md) | Design system: color palette, typography, spacing, components |
| [`folder-structure.md`](./folder-structure.md) | Project directory layout (frontend + backend) |
| [`api/endpoints.md`](./api/endpoints.md) | Full REST API specification |
| [`frontend-specification/pages.md`](./frontend-specification/pages.md) | Page-by-page UI and behavior spec |
| [`function-level-specification/matching-algorithm.md`](./function-level-specification/matching-algorithm.md) | Matching algorithm logic, pseudocode, edge cases |
| [`function-level-specification/admin-and-auth.md`](./function-level-specification/admin-and-auth.md) | Admin controls, round-phase system, auth flow |

## How to use these docs (for an AI coding assistant)

1. Read the root `README.md` first for the product concept and round timeline.
2. Read `requirements.md` and `usecase.md` to understand what must be built and for whom.
3. Read `database.md` before writing any backend code that touches data.
4. Read `ui-foundation-spec.md` before writing any component or page — colors, spacing, and typography should come from this file, not be invented ad hoc.
5. Read `api/endpoints.md` before wiring frontend calls or writing backend routes.
6. Read `frontend-specification/pages.md` for what each page must contain.
7. Read `function-level-specification/*.md` for the matching algorithm and admin/auth logic specifically — these are the two most detail-sensitive parts of the system.
