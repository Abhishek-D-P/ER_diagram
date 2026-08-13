Here's your backlog. Each **Epic** has **Stories**, and each Story has **Subtasks**. Work top-to-bottom — each epic builds on the previous.

---

## Epic 1 — Multi-file Upload & Schema Building
> *Goal: User uploads all CSVs at once, app builds full schema*

**Story 1.1 — Multi-file upload**
- [ ] Change `<input type="file">` to accept `multiple` files
- [ ] Update `/upload` route to loop through `request.files.getlist("file")`
- [ ] Save each file as a separate entry in `tables` dict

**Story 1.2 — Detect data types**
- [ ] For each column, infer type from pandas dtype (`int64` → INT, `object` → VARCHAR, `float64` → FLOAT, `datetime64` → DATE)
- [ ] Store in schema as `table_dict[name]["types"]`
- [ ] Display type next to column name in the HTML

---

## Epic 2 — Auto-detect Primary Keys
> *Goal: App guesses PKs using heuristics, user can override*

**Story 2.1 — PK heuristic logic**
- [ ] Check for columns named `id`, `<table>_id`, or `<table>Id`
- [ ] Check uniqueness: `col.nunique() == len(data)`
- [ ] Check no nulls: `col.isnull().sum() == 0`
- [ ] Set the best candidate as `pk` in schema

**Story 2.2 — PK override (already partially done)**
- [ ] Keep existing click-to-set-PK behavior
- [ ] Add visual indicator that PK was "auto-detected" vs "user-set" (e.g. different dot color)

---

## Epic 3 — Auto-detect Foreign Keys
> *Goal: App detects FK relationships across tables*

**Story 3.1 — FK heuristic: name matching**
- [ ] For each column in table A, check if its name matches `<other_table>_id` or matches a PK column name in another table
- [ ] Build a candidate FK list

**Story 3.2 — FK heuristic: value matching**
- [ ] For candidate FKs, check if all values in column A exist in the referenced PK column (subset check)
- [ ] Score candidates: name match + value match = high confidence

**Story 3.3 — Store FK relationships**
- [ ] Store as `table_dict[name]["fk"] = [{"column": "customer_id", "references": {"table": "customer", "column": "customer_id"}}]`
- [ ] Persist to `schema.json`

---

## Epic 4 — Draw ER Diagram with Connectors
> *Goal: Render tables with lines showing FK relationships*

**Story 4.1 — Canvas setup**
- [ ] Position `.canvas` as relative container, `<canvas>` as absolute overlay
- [ ] Set canvas `width`/`height` attributes from parent dimensions
- [ ] Write `canvasCoords()` helper to translate viewport → canvas coords

**Story 4.2 — Auto-draw FK connectors**
- [ ] On page load, read FK data (pass from Flask as JSON or embed in HTML)
- [ ] For each FK, find the source `<li>` and target `<li>` elements
- [ ] Draw bezier curve from source column right-edge → target column left-edge

**Story 4.3 — Manual connector editing**
- [ ] User can drag from one column to another to add an FK
- [ ] Right-click or double-click a line to remove an FK
- [ ] POST changes to a `/set-fk` route
    
---

## Epic 5 — User Editing & Polish
> *Goal: Let users correct auto-detected schema*

**Story 5.1 — Edit column names**
- [ ] Click column name → inline text input to rename
- [ ] POST rename to backend, update schema

**Story 5.2 — Delete tables/columns**
- [ ] Add delete (✕) button on table cards and columns
- [ ] POST deletion to backend

**Story 5.3 — Drag to reposition tables**
- [ ] Make `.table-card` draggable (mousedown/mousemove/mouseup)
- [ ] Redraw connectors on drag
- [ ] Store positions in schema (optional)

---

## Epic 6 — Export
> *Goal: Output the ER diagram as something useful*

**Story 6.1 — Export as SQL**
- [ ] Generate `CREATE TABLE` statements from schema (columns, types, PK, FK constraints)
- [ ] Download as `.sql` file

**Story 6.2 — Export as image**
- [ ] Use `canvas.toDataURL()` to capture the diagram
- [ ] Or use a library like html2canvas for the full view
- [ ] Download as PNG

**Story 6.3 — Export as JSON schema**
- [ ] Download `schema.json` directly

---

### Suggested order
**Epic 1 → 2 → 3 → 4 → 5 → 6**

Start with **Story 1.1** — multi-file upload is the foundation for everything else.
