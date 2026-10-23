const rows = document.querySelectorAll(".row .pk");
const reset = document.querySelector(".reset");
const columns = document.querySelectorAll(".column");
const allTableDelete = document.querySelectorAll(".table-delete");

rows.forEach((row) => {
  row.addEventListener("click", () => {
    const tableCard = row.closest(".table-card");
    const tableName = tableCard.querySelector("h2").textContent.trim();
    const pkColumn = row.id.split("-").at(-1);

    fetch("/set-pk", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: tableName, pk: pkColumn }),
    }).then(() => location.reload());
  });
});

columns.forEach((column) => {
  column.addEventListener("click", () => {
    column.contentEditable = "true";
    column.focus();
  });

  column.addEventListener("blur", () => {
    column.contentEditable = "false";
    const row = column.closest(".row");
    const pk = row.querySelector(".pk");
    const [tableName, oldColumn] = pk.id.split("-");
    const newColumn = column.childNodes[0].textContent.trim();

    if (newColumn === oldColumn) return;

    fetch("/rename-column", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: tableName,
        old_name: oldColumn,
        new_name: newColumn,
      }),
    }).then(() => location.reload());
  });

  column.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      column.blur();
    }
  });
});

const canvasEl = document.querySelector("canvas");
const canvasContainer = document.querySelector(".canvas");

/** Resize the overlay to cover the complete diagram canvas. */
function resizeCanvas() {
  canvasEl.width = canvasContainer.clientWidth;
  canvasEl.height = canvasContainer.clientHeight;
}

/** Get an element's coordinates relative to the diagram container. */
function canvasCoords(element) {
  const rect = element.getBoundingClientRect();
  const containerRect = canvasContainer.getBoundingClientRect();

  return {
    x: rect.left - containerRect.left,
    y: rect.top - containerRect.top,
    width: rect.width,
    height: rect.height,
  };
}

/** Draw a path with small rounded 90-degree corners. */
function drawRoundedOrthogonalPath(ctx, points, radius = 8) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const previous = points[i - 1];
    const current = points[i];
    const next = points[i + 1];

    const incomingLength = Math.hypot(
      current.x - previous.x,
      current.y - previous.y
    );
    const outgoingLength = Math.hypot(
      next.x - current.x,
      next.y - current.y
    );
    const cornerRadius = Math.min(radius, incomingLength / 2, outgoingLength / 2);

    const beforeCorner = {
      x: current.x - Math.sign(current.x - previous.x) * cornerRadius,
      y: current.y - Math.sign(current.y - previous.y) * cornerRadius,
    };
    const afterCorner = {
      x: current.x + Math.sign(next.x - current.x) * cornerRadius,
      y: current.y + Math.sign(next.y - current.y) * cornerRadius,
    };

    ctx.lineTo(beforeCorner.x, beforeCorner.y);
    ctx.quadraticCurveTo(current.x, current.y, afterCorner.x, afterCorner.y);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
}

/**
 * Pick the side of each table that faces the other table.
 * This keeps relationships from starting at the table center.
 */
function getConnectorEndpoints(sourceEl, targetEl) {
  const source = canvasCoords(sourceEl);
  const target = canvasCoords(targetEl);

  const sourceCenter = {
    x: source.x + source.width / 2,
    y: source.y + source.height / 2,
  };
  const targetCenter = {
    x: target.x + target.width / 2,
    y: target.y + target.height / 2,
  };

  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  // Use left/right edges when tables are mostly side-by-side.
  if (Math.abs(dx) >= Math.abs(dy)) {
    const sourceOnLeft = dx >= 0;
    return {
      start: {
        x: sourceOnLeft ? source.x + source.width : source.x,
        y: sourceCenter.y,
      },
      end: {
        x: sourceOnLeft ? target.x : target.x + target.width,
        y: targetCenter.y,
      },
      horizontalFirst: true,
    };
  }

  // Use top/bottom edges when tables are mostly vertically aligned.
  const sourceOnTop = dy >= 0;
  return {
    start: {
      x: sourceCenter.x,
      y: sourceOnTop ? source.y + source.height : source.y,
    },
    end: {
      x: targetCenter.x,
      y: sourceOnTop ? target.y : target.y + target.height,
    },
    horizontalFirst: false,
  };
}

/** Draw clean, muted, rounded right-angle connectors for all foreign keys. */
function drawConnectors() {
  if (!canvasEl || !canvasContainer) return;

  resizeCanvas();
  const ctx = canvasEl.getContext("2d");
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

  ctx.strokeStyle = "#64748b";
  ctx.fillStyle = "#64748b";
  ctx.lineWidth = 1.8;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const [tableName, content] of Object.entries(tablesData)) {
    for (const [fkColumn, refTable] of Object.entries(content.fk || {})) {
      const sourceEl = document.getElementById(`${tableName}-${fkColumn}`);

      // A foreign key can reference a differently named primary-key column.
      const referencedPk = tablesData[refTable]?.pk;
      const targetEl = referencedPk
        ? document.getElementById(`${refTable}-${referencedPk}`)
        : null;

      if (!sourceEl || !targetEl) continue;

      // Anchor to the full column row, not the tiny PK label cell.
      const sourceRow = sourceEl.closest(".row");
      const targetRow = targetEl.closest(".row");
      if (!sourceRow || !targetRow) continue;

      const { start, end, horizontalFirst } = getConnectorEndpoints(
        sourceRow,
        targetRow
      );

      // Use a midpoint lane to create a tidy orthogonal route.
      const points = horizontalFirst
        ? [
            start,
            { x: (start.x + end.x) / 2, y: start.y },
            { x: (start.x + end.x) / 2, y: end.y },
            end,
          ]
        : [
            start,
            { x: start.x, y: (start.y + end.y) / 2 },
            { x: end.x, y: (start.y + end.y) / 2 },
            end,
          ];

      drawRoundedOrthogonalPath(ctx, points);
      ctx.stroke();

      // Small endpoint dots make each relationship easier to follow.
      for (const point of [start, end]) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

drawConnectors();

// Redraw connectors when the viewport or table layout changes.
window.addEventListener("resize", drawConnectors);
if ("ResizeObserver" in window) {
  const diagramObserver = new ResizeObserver(drawConnectors);
  diagramObserver.observe(canvasContainer);
  document.querySelectorAll(".table-card").forEach((card) => {
    diagramObserver.observe(card);
  });
}

if (reset) {
  reset.addEventListener("click", () => {
    fetch("/reset").then(() => location.reload());
  });
}

allTableDelete.forEach((tableDelete) => {
  tableDelete.addEventListener("click", () => {
    const tableCard = tableDelete.closest(".table-card");
    const tableToDelete = tableCard.querySelector("h2").textContent.trim();

    fetch("delete-card", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableToDelete }),
    }).then(() => location.reload());
  });
});
