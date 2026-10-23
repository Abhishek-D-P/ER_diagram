(() => {
  const exportPngButton = document.querySelector("#export-png");
  const exportSvgButton = document.querySelector("#export-svg");
  const diagram = document.querySelector(".canvas");
  const connectorCanvas = diagram?.querySelector("canvas");

  if (!exportPngButton || !exportSvgButton || !diagram || !connectorCanvas) return;

  function copyComputedStyles(source, target) {
    const computed = window.getComputedStyle(source);
    let css = "";
    for (const property of computed) {
      css += property + ":" + computed.getPropertyValue(property) + ";";
    }
    target.setAttribute("style", css);

    // Computed styles are copied because the exported SVG is a standalone file
    // and cannot depend on this page's external stylesheet.
    const sourceChildren = source.children;
    const targetChildren = target.children;
    for (let i = 0; i < sourceChildren.length; i += 1) {
      if (targetChildren[i]) copyComputedStyles(sourceChildren[i], targetChildren[i]);
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function buildSvg() {
    const cards = Array.from(diagram.querySelectorAll(".table-card"));
    if (cards.length === 0) {
      throw new Error("Upload at least one CSV table before exporting the diagram.");
    }

    const containerRect = diagram.getBoundingClientRect();
    const cardRects = cards.map((card) => card.getBoundingClientRect());
    const positions = cardRects.map((rect) => ({
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top,
      width: rect.width,
      height: rect.height,
    }));

    // Include the connector canvas and any table moved beyond the original grid.
    const minX = Math.min(0, ...positions.map((p) => p.x));
    const minY = Math.min(0, ...positions.map((p) => p.y));
    const maxX = Math.max(diagram.scrollWidth, ...positions.map((p) => p.x + p.width));
    const maxY = Math.max(diagram.scrollHeight, ...positions.map((p) => p.y + p.height));
    const width = Math.ceil(maxX - minX);
    const height = Math.ceil(maxY - minY);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("xmlns:xhtml", "http://www.w3.org/1999/xhtml");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const background = document.createElementNS(svg.namespaceURI, "rect");
    background.setAttribute("width", String(width));
    background.setAttribute("height", String(height));
    background.setAttribute("fill", "#f4f6f9");
    svg.appendChild(background);

    // Preserve the existing connector drawing as an embedded image.
    if (connectorCanvas.width > 0 && connectorCanvas.height > 0) {
      const connectorImage = document.createElementNS(svg.namespaceURI, "image");
      connectorImage.setAttribute("x", String(-minX));
      connectorImage.setAttribute("y", String(-minY));
      connectorImage.setAttribute("width", String(connectorCanvas.width));
      connectorImage.setAttribute("height", String(connectorCanvas.height));
      connectorImage.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "href",
        connectorCanvas.toDataURL("image/png")
      );
      svg.appendChild(connectorImage);
    }

    cards.forEach((card, index) => {
      const position = positions[index];
      const foreignObject = document.createElementNS(svg.namespaceURI, "foreignObject");
      foreignObject.setAttribute("x", String(position.x - minX));
      foreignObject.setAttribute("y", String(position.y - minY));
      foreignObject.setAttribute("width", String(position.width));
      foreignObject.setAttribute("height", String(position.height));

      const clone = card.cloneNode(true);
      clone.querySelectorAll(".table-delete").forEach((button) => button.remove());
      copyComputedStyles(card, clone);
      clone.style.setProperty("margin", "0", "important");
      clone.style.setProperty("transform", "none", "important");
      clone.style.setProperty("width", "100%", "important");
      clone.style.setProperty("height", "100%", "important");
      clone.style.setProperty("box-sizing", "border-box", "important");

      // Remove inline edit state from any column currently being edited.
      clone.querySelectorAll("[contenteditable]").forEach((element) => {
        element.removeAttribute("contenteditable");
      });

      const xhtml = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
      xhtml.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
      xhtml.style.width = "100%";
      xhtml.style.height = "100%";
      xhtml.appendChild(clone);
      foreignObject.appendChild(xhtml);
      svg.appendChild(foreignObject);
    });

    return new XMLSerializer().serializeToString(svg);
  }

  function exportSvg() {
    try {
      const source = buildSvg();
      downloadBlob(new Blob([source], { type: "image/svg+xml;charset=utf-8" }), "er-diagram.svg");
    } catch (error) {
      window.alert(error.message || "Could not export the ER diagram as SVG.");
    }
  }

  function exportPng() {
    try {
      const source = buildSvg();
      const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);
      const image = new Image();

      image.onload = () => {
        try {
          const viewBox = source.match(/viewBox="0 0 (\d+) (\d+)"/);
          const width = Number(viewBox?.[1]);
          const height = Number(viewBox?.[2]);
          if (!width || !height) throw new Error("The diagram has invalid dimensions.");

          const canvas = document.createElement("canvas");
          const scale = Math.min(3, 2400 / width, 2400 / height);
          canvas.width = Math.max(1, Math.round(width * scale));
          canvas.height = Math.max(1, Math.round(height * scale));
          const context = canvas.getContext("2d");
          context.fillStyle = "#f4f6f9";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((pngBlob) => {
            if (pngBlob) downloadBlob(pngBlob, "er-diagram.png");
            else window.alert("The browser could not create a PNG image.");
          }, "image/png");
        } catch (error) {
          window.alert(error.message || "Could not export the ER diagram as PNG.");
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        window.alert("Your browser could not render the diagram for PNG export. Try SVG export instead.");
      };
      image.src = objectUrl;
    } catch (error) {
      window.alert(error.message || "Could not export the ER diagram as PNG.");
    }
  }

  exportPngButton.addEventListener("click", exportPng);
  exportSvgButton.addEventListener("click", exportSvg);
})();
