// Select all primary-key indicators, reset button, column elements,
// table-delete buttons, and table cards from the DOM.

let rows = document.querySelectorAll(".row .pk");
let reset = document.querySelector(".reset");
let columns = document.querySelectorAll(".column");
let allTableDelete = document.querySelectorAll(".table-delete");
let allTableCards = document.querySelectorAll(".table-card");


// Add click handlers to primary-key indicators.
// Clicking a column sends its table name and column name to the backend
// to set or unset the primary key, then reloads the page.
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

// Add editing behavior to each column name.
// Clicking enables inline editing. When editing ends, the new column name
// is sent to the backend if it differs from the original name.
// Pressing Enter finishes editing by triggering the blur event.

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

// Get the canvas element and its parent container.
// The canvas is used to draw relationship connectors between tables.

const canvasEl = document.querySelector("canvas");
const canvasContainer = document.querySelector(".canvas");

// Resize the canvas to match the dimensions of its parent container.
// This keeps the drawing area aligned with the ER diagram layout.

function resizeCanvas() {
  canvasEl.width = canvasContainer.offsetWidth;
  canvasEl.height = canvasContainer.offsetHeight;
}

// Convert an element's viewport coordinates into coordinates
// relative to the canvas container.
// Also return the element's width and height.

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

// Generate a unique color for each table using evenly spaced hues.
// These colors help distinguish connectors belonging to different tables.
const tableNames = Object.keys(tablesData);
const tableColors = {};
tableNames.forEach((name, i) => {
  const hue = Math.round((360 / tableNames.length) * i);
  tableColors[name] = `hsla(${hue}, 70%, 50%, 0.85)`;
});


// Draw foreign-key connectors on the canvas.
// For every stored FK relationship, locate the source and target columns,
// calculate their positions, and draw a Bézier curve between them.
// Skip relationships if either column element cannot be found.
function drawConnectors() {
  resizeCanvas();
  const ctx = canvasEl.getContext("2d");
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  for (const [tableName, content] of Object.entries(tablesData)) {
    const table = document.querySelector(`.table-${tableName} h2`);
    table.style = `background-color:${tableColors[tableName]}`;
    for (const [fkcolumn, refTable] of Object.entries(content.fk)) {
      const sourceEl = document.getElementById(`${tableName}-${fkcolumn}`);
      const targetEl = document.getElementById(`${refTable}-${fkcolumn}`);

      if (!sourceEl || !targetEl) continue;

      const source = canvasCoords(sourceEl);
      const target = canvasCoords(targetEl);

      let sx = source.x;
      let sy = source.y + parseInt(source.height / 2);

      let tx = target.x;
      let ty = target.y + parseInt(target.height / 2);

      
      let dir = 1;
      if(sx>tx){
        dir = -1;
        tx = tx + targetEl.parentElement.getBoundingClientRect().width;
      }
      else{
        sx = sx + sourceEl.parentElement.getBoundingClientRect().width;
      }
      
      let cpOffset = Math.abs(sx - tx) * 0.5;
      const arrowOffest = 10;

      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, 360);

      ctx.moveTo(sx, sy);
      if(sx>tx){
        cpOffset = -cpOffset;
      }
      ctx.lineTo(sx + cpOffset, sy);
      ctx.lineTo(sx + cpOffset, ty);
      ctx.lineTo(tx, ty);
      
      ctx.moveTo(sx + 2*arrowOffest*dir,sy);
      ctx.lineTo(sx+arrowOffest*dir,sy-arrowOffest);
      ctx.moveTo(sx + 2*arrowOffest*dir,sy);
      ctx.lineTo(sx+arrowOffest*dir,sy+arrowOffest);
      // ctx.bezierCurveTo(sx + cpOffset, sy, tx - cpOffset, ty, tx, ty);
      ctx.strokeStyle = tableColors[tableName];
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

// Draw all foreign-key connectors when the script runs.
drawConnectors();

// Add a click handler to the reset button.
// Send a reset request to the backend and reload the page afterward.
reset.addEventListener("click", () => {
  fetch("/reset").then(() => {
    location.reload();
  });
});



// Placeholder function for updating column names.
// Currently, it only logs a variable named 'name' to the console.
function updateColumnsName(content) {
  console.log(name);
}

// Add delete handlers to all table-delete buttons.
// Clicking a button identifies its parent table card, sends the table name
// to the backend for deletion, and reloads the page afterward.
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


// Attempt to initialize table dragging when a table card is clicked.
// WARNING: The current infinite while loop freezes the browser.
// Replace this with proper mousedown, mousemove, and mouseup handling.

 class TableDrag {
  constructor(tableCard) {
    this.tableCard = tableCard;
    this.lastX = 0;
    this.lastY = 0;
    
    // Store mouse start positions per drag session
    this.mouseX = 0;
    this.mouseY = 0;
    
    // Track active coordinates for the current frame
    this.currentX = 0;
    this.currentY = 0;
  }

  // Use arrow function syntax to auto-bind 'this' to the class instance
  onMove = (event) => {
    const deltaX = event.clientX - this.mouseX;
    const deltaY = event.clientY - this.mouseY;
    
    this.currentX = this.lastX + deltaX;
    this.currentY = this.lastY + deltaY;
    
    this.tableCard.style.transform = `translate(${this.currentX}px, ${this.currentY}px)`;
    
    if (typeof drawConnectors === 'function') {
      drawConnectors();
    }
  };

  main() {
    this.tableCard.addEventListener("mousedown", (event) => {
      // Record starting positions
      this.mouseX = event.clientX;
      this.mouseY = event.clientY; 
      
      // Add global listeners
      window.addEventListener('mousemove', this.onMove);

      // Clean up on release
      window.addEventListener('mouseup', () => {
        // Permanently save the last dropped position
        this.lastX = this.currentX;
        this.lastY = this.currentY;
        
        window.removeEventListener('mousemove', this.onMove);
      }, { once: true }); // { once: true } auto-deletes this listener after running once
    });
  }
}

// Looped instantiations remain exactly the same!
allTableCards.forEach((tableCard) => {
  const dragObject = new TableDrag(tableCard);
  dragObject.main();
});
