Here's your backlog. Each **Epic** has **Stories**, and each Story has **Subtasks**. Statuses below are based on the current code in the default `master` branch, reviewed on 2026-10-23. "Partial" means some functionality exists but acceptance criteria are not fully met.

Status legend: **DONE** = implemented; **PARTIAL** = implemented incompletely or has a known defect; **TODO** = not implemented.

---

## Epic 1 — Multi-file Upload & Schema Building
> *Goal: User uploads all CSVs at once, app builds full schema*

**Story 1.1 — Multi-file upload — DONE**
- [x] Change `<input type="file">` to accept `multiple` files
- [x] Update `/upload` route to loop through uploaded files (current form and route use the field name `files`)
- [x] Save each file as a separate entry in `tables` dict

**Story 1.2 — Detect data types**
- [✅] For each column, infer type from pandas dtype (`int64` → INT, `object` → VARCHAR, `float64` → FLOAT, `datetime64` → DATE)
- [✅] Store in schema as `table_dict[name]["types"]`
- [✅] Display type next to column name in the HTML

---

## Epic 2 — Auto-detect Primary Keys
> *Goal: App guesses PKs using heuristics, user can override*

**Story 2.1 — PK heuristic logic — PARTIAL**
- [ ] Check for columns named `id`, `<table>_id`, or `<table>Id` (not implemented)
- [x] Check uniqueness: `col.nunique() == len(data)`
- [x] Check no nulls: `col.isnull().sum() == 0` (implemented using `isna().sum() == 0`)
- [ ] Rank candidates and select the best candidate; current code selects the first unique, non-null column, regardless of name

**Story 2.2 — PK override — PARTIAL**
- [x] Keep existing click-to-set-PK behavior
- [ ] Add visual indicator that PK was "auto-detected" vs "user-set" (only a general PK indicator exists)

---

## Epic 3 — Auto-detect Foreign Keys
> *Goal: App detects FK relationships across tables*

**Story 3.1 — FK heuristic: name matching — PARTIAL**
- [x] Detect when a column name matches another table's detected PK column name
- [ ] Support broader naming patterns such as `<other_table>_id` and build/rank an explicit candidate list

**Story 3.2 — FK heuristic: value matching — TODO**
- [ ] Check whether candidate FK values are a subset of referenced PK values
- [ ] Score candidates using both name and value matches

**Story 3.3 — Store FK relationships — PARTIAL**
- [x] Store detected FK mappings in each table's schema
- [x] Persist schema to `results/schema.json` after upload
- [ ] Use the planned structured FK format with explicit source column and referenced table/column; current format is a simpler column-to-table mapping
- [ ] Persist schema updates consistently after table deletion (the delete route currently does not write the JSON file)

---

## Epic 4 — Draw ER Diagram with Connectors
> *Goal: Render tables with lines showing FK relationships*

**Story 4.1 — Canvas setup — PARTIAL**
- [x] Use `.canvas` as a relative container and `<canvas>` as an absolute overlay
- [x] Set canvas dimensions from parent dimensions
- [x] Implement `canvasCoords()` to translate element positions relative to the canvas container

**Story 4.2 — Auto-draw FK connectors — PARTIAL**
- [x] Pass table/FK data from Flask to JavaScript as JSON
- [x] Find source and target column elements and draw Bézier connectors
- [ ] Validate connector endpoints for all FK cases; current code assumes the referenced PK has the same column name as the FK

**Story 4.3 — Manual connector editing — TODO**
- [ ] Drag from one column to another to add an FK
- [ ] Remove an FK by right-clicking or double-clicking its line
- [ ] POST changes to a `/set-fk` route

---

## Epic 5 — User Editing & Polish
> *Goal: Let users correct auto-detected schema*

**Story 5.1 — Edit column names — PARTIAL**
- [x] Click column name to edit inline
- [x] POST rename to backend and update the schema
- [ ] Handle names robustly and update all affected FK references; current implementation can break with hyphenated names and does not fully reconcile references in other tables

**Story 5.2 — Delete tables/columns — PARTIAL**
- [x] Add delete button on table cards
- [ ] Add delete buttons for individual columns
- [ ] Persist table deletion to `results/schema.json`
- [ ] Remove or repair foreign-key references when a table is deleted

**Story 5.3 — Drag to reposition tables — TODO (broken prototype)**
- [ ] Implement proper drag handling with `mousedown/mousemove/mouseup`
- [ ] Redraw connectors on drag
- [ ] Store positions in schema (optional)
- Note: current `mousedown` handler contains an infinite `while(true)` loop and should be removed/fixed before running this feature.

---

## Epic 6 — Export
> *Goal: Output the ER diagram as something useful*

**Story 6.1 — Export as SQL — TODO**
- [ ] Generate `CREATE TABLE` statements from schema (columns, types, PK, FK constraints)
- [ ] Download as `.sql` file

**Story 6.2 — Export as image — TODO**
- [ ] Capture the diagram as PNG using canvas or a full-page capture library
- [ ] Download as PNG

**Story 6.3 — Export as JSON schema — PARTIAL**
- [x] Write `results/schema.json` on upload and some schema edits
- [ ] Add a user-facing download of the JSON schema

---

### Suggested next steps
1. Fix the infinite loop in Story 5.3 immediately; it can freeze the browser when a table card receives `mousedown`.
2. Fix schema persistence and referential cleanup for table deletion.
3. Complete PK detection and value-based FK validation.
4. Finish connector editing, then implement exports.

