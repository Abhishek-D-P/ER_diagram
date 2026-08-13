let rows = document.querySelectorAll(".row .pk");
let reset = document.querySelector(".reset");
let columns = document.querySelectorAll(".column");
let allTableDelete = document.querySelectorAll(".table-delete");
let allTableCards = document.querySelectorAll(".table-card");

rows.forEach((row) => {
  row.addEventListener("click", () => {
    tableCard = row.closest(".table-card");

    tableName = tableCard.querySelector("h2").textContent.trim();
    pkColumn = row.id.split("-").at(-1);
    console.log(pkColumn);
    fetch("/set-pk", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ table: tableName, pk: pkColumn }),
    }).then(() => {
      location.reload();
    });
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
      body: JSON.stringify({ table: tableName, old_name: oldColumn, new_name: newColumn }),
    }).then(() => {
      location.reload();
    });
  });
  column.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      column.blur();
    }
  });
});

const canvasEl = document.querySelector("canvas");
const canvasContainer = document.querySelector(".canvas");

function resizeCanvas() {
  canvasEl.width = canvasContainer.offsetWidth;
  canvasEl.height = canvasContainer.offsetHeight;
}

function canvasCoords(el) {
  const rect = el.getBoundingClientRect();
  const containerRect = canvasContainer.getBoundingClientRect();

  return {
    x: rect.left - containerRect.left,
    y: rect.top - containerRect.top,
    width: rect.width,
    height: rect.height,
  };
}

// Generate unique color per table using evenly spaced hues
const tableNames = Object.keys(tablesData);
const tableColors = {};
tableNames.forEach((name, i) => {
  const hue = Math.round((360 / tableNames.length) * i);
  tableColors[name] = `hsla(${hue}, 70%, 50%, 0.85)`;
});

function drawConnectors() {
  resizeCanvas();
  const ctx = canvasEl.getContext("2d");
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  for (const [tableName, content] of Object.entries(tablesData)) {
    for (const [fkcolumn, refTable] of Object.entries(content.fk)) {
      const sourceEl = document.getElementById(`${tableName}-${fkcolumn}`);
      const targetEl = document.getElementById(`${refTable}-${fkcolumn}`);

      if (!sourceEl || !targetEl) continue;

      const source = canvasCoords(sourceEl);
      const target = canvasCoords(targetEl);

      const sx = source.x;
      const sy = source.y + parseInt(source.height / 2);

      const tx = target.x;
      const ty = target.y + parseInt(target.height / 2);

      const cpOffset = Math.abs(sx - tx) * 0.5;

      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, 360);
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(sx + cpOffset, sy, tx - cpOffset, ty, tx, ty);
      ctx.strokeStyle = tableColors[tableName];
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

drawConnectors();

reset.addEventListener("click", () => {
  fetch("/reset").then(() => {
    location.reload();
  });
});

function updateColumnsName(content) {
  console.log(name);
}


allTableDelete.forEach((tableDelete) =>{
    tableDelete.addEventListener("click",()=>{
        tableCard = tableDelete.closest(".table-card");
        tableToDelete = tableCard.querySelector("h2").textContent.trim();
        fetch("delete-card",{
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tableToDelete: tableToDelete}),
        }).then(()=>{
            location.reload();
        })
    });
});

allTableCards.forEach((tableCard)=>{
    tableCard.addEventListener("mousedown",(event)=>{
        while(true){
        coords = {"x":event.clientX,"y":event.clientY};
        tableCard.top = coords.x;
        tableCard.left = coords.y;
        console.log(coords);
        }
    });
});
