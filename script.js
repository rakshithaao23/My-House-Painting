
const TOTAL_HOUSES = 100;

const COLORS = [
  "#ff6b6b", "#ff9f43", "#ffd93d", "#6bcb77",
  "#4d96ff", "#845ec2", "#ff78c4", "#65d6ce",
  "#a8dadc", "#caffbf", "#ffc6ff", "#bdb2ff",
  "#f4a261", "#90be6d", "#ffffff", "#b7b7b7"
];

const COLOR_NAMES = [
  "Red", "Orange", "Yellow", "Green",
  "Blue", "Purple", "Pink", "Turquoise",
  "Light blue", "Mint", "Light pink", "Lavender",
  "Peach", "Leaf green", "White", "Grey"
];

const STORAGE_KEY = "happyHousePaintingWorld_v1";

let activeHouse = 1;
let activeSide = "Front";
let selectedColor = COLORS[0];
let brushSize = 1;
let isPainting = false;
let lastPaintedPart = null;
let undoStack = [];

function emptyHouse() {
  return {
    name: "",
    completed: false,
    sides: {
      Front: {},
      Back: {},
      Left: {},
      Right: {}
    }
  };
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.houses)) {
      return saved;
    }
  } catch (error) {
    console.warn("Could not load saved progress.", error);
  }

  return { houses: [null, ...Array.from({ length: TOTAL_HOUSES }, emptyHouse)] };
}

let progress = loadProgress();

function normalizeProgress() {
  if (!Array.isArray(progress.houses)) progress.houses = [];
  progress.houses[0] = null;

  for (let i = 1; i <= TOTAL_HOUSES; i++) {
    if (!progress.houses[i]) {
      progress.houses[i] = emptyHouse();
    } else {
      const old = progress.houses[i];
      if (!old.sides) old.sides = {};
      for (const side of ["Front", "Back", "Left", "Right"]) {
        if (!old.sides[side]) old.sides[side] = {};
      }
      if (typeof old.name !== "string") old.name = "";
      if (typeof old.completed !== "boolean") old.completed = false;
    }
  }
}

normalizeProgress();

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    showMessage("Your browser could not save progress. Check available storage.");
  }
}

function getHouse(number = activeHouse) {
  return progress.houses[number];
}

function isUnlocked(number) {
  if (number === 1) return true;
  return getHouse(number - 1).completed;
}

function countCompleted() {
  let total = 0;
  for (let i = 1; i <= TOTAL_HOUSES; i++) {
    if (getHouse(i).completed) total++;
  }
  return total;
}

const houseGrid = document.getElementById("houseGrid");
const houseCanvas = document.getElementById("houseCanvas");
const houseNameInput = document.getElementById("houseNameInput");
const nameMessage = document.getElementById("nameMessage");
const actionMessage = document.getElementById("actionMessage");
const houseTitle = document.getElementById("houseTitle");
const houseNumber = document.getElementById("houseNumber");
const houseStatus = document.getElementById("houseStatus");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const progressMessage = document.getElementById("progressMessage");
const colorPalette = document.getElementById("colorPalette");
const customColor = document.getElementById("customColor");
const selectedColorName = document.getElementById("selectedColorName");
const brushSizeInput = document.getElementById("brushSize");
const brushSizeLabel = document.getElementById("brushSizeLabel");

function showMessage(message) {
  actionMessage.textContent = message;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderHouseGrid() {
  let html = "";

  for (let i = 1; i <= TOTAL_HOUSES; i++) {
    const house = getHouse(i);
    const locked = !isUnlocked(i);
    const active = i === activeHouse;
    const displayName = house.name || `House ${i}`;

    let classes = "level-card";
    if (locked) classes += " locked";
    if (active) classes += " active";
    if (house.completed) classes += " completed";

    const icon = locked ? "🔒" : house.completed ? "🏆" : "🏡";
    const status = locked ? "Locked" : house.completed ? "Completed" : `Level ${i}`;

    html += `
      <button class="${classes}" data-house="${i}"
              ${locked ? "disabled" : ""}
              title="${escapeHTML(displayName)}">
        <span class="house-icon">${icon}</span>
        <span><strong>${i}</strong></span>
        <span class="level-name">${escapeHTML(displayName)}</span>
        <span class="level-name">${status}</span>
      </button>
    `;
  }

  houseGrid.innerHTML = html;
}

function renderProgress() {
  const completed = countCompleted();
  progressText.textContent = `${completed} of ${TOTAL_HOUSES} houses completed`;
  progressBar.style.width = `${completed}%`;

  if (completed === TOTAL_HOUSES) {
    progressMessage.textContent = "🎉 Amazing! You completed all 100 houses!";
  } else {
    progressMessage.textContent =
      `Keep painting! ${TOTAL_HOUSES - completed} houses still to go.`;
  }
}

function renderHeading() {
  const house = getHouse();
  houseNumber.textContent = `HOUSE ${activeHouse}`;
  houseTitle.textContent = house.name || `My House ${activeHouse}`;
  houseNameInput.value = house.name || "";

  houseStatus.textContent = house.completed ? "Completed ⭐" : "In progress";
  houseStatus.classList.toggle("done", house.completed);

  nameMessage.textContent = house.name
    ? `✨ Your house is called "${house.name}".`
    : "Choose a special name for your house!";
}

function renderSideButtons() {
  document.querySelectorAll(".side-button").forEach(button => {
    button.classList.toggle("active", button.dataset.side === activeSide);
  });
}

function renderAll() {
  renderHouseGrid();
  renderProgress();
  renderHeading();
  renderSideButtons();
  renderHouse();
}

function part(id, shape, attributes, label) {
  const fill = getHouse().sides[activeSide][id] || "#ffffff";
  return `<${shape} class="paint-part" data-part="${id}" aria-label="${label}"
    tabindex="0" fill="${fill}" ${attributes}></${shape}>`;
}

function renderHouse() {
  const sides = {
    Front: `
      ${part("sky", "rect", 'x="0" y="0" width="500" height="390"', "Sky")}
      ${part("sun", "circle", 'cx="420" cy="62" r="27"', "Sun")}
      ${part("cloud", "path", 'd="M55 80 C35 80 35 55 55 55 C60 30 94 32 101 53 C122 49 135 76 116 83 Z"', "Cloud")}
      ${part("grass", "rect", 'x="0" y="300" width="500" height="90"', "Grass")}
      ${part("walls", "rect", 'x="105" y="160" width="290" height="178"', "House walls")}
      ${part("roof", "polygon", 'points="75,168 250,55 425,168"', "Roof")}
      ${part("chimney", "rect", 'x="324" y="91" width="34" height="65"', "Chimney")}
      ${part("leftWindow", "rect", 'x="132" y="205" width="66" height="63"', "Left window")}
      ${part("rightWindow", "rect", 'x="302" y="205" width="66" height="63"', "Right window")}
      ${part("door", "rect", 'x="218" y="237" width="64" height="101"', "Door")}
      ${part("steps", "polygon", 'points="203,338 297,338 313,354 187,354"', "Steps")}
      ${part("knob", "circle", 'cx="269" cy="290" r="4"', "Door knob")}
      <path class="house-outline" fill="none" pointer-events="none"
        d="M165 236 V205 H165 M165 236 H198 M250 237 V338 M132 236 H198 M132 205 H198 M165 205 V268 M132 236 V268 M302 236 H368 M335 205 V268 M302 205 H368 M302 205 V268 M302 268 H368"/>
    `,
    Back: `
      ${part("sky", "rect", 'x="0" y="0" width="500" height="390"', "Sky")}
      ${part("sun", "circle", 'cx="420" cy="62" r="27"', "Sun")}
      ${part("cloud", "path", 'd="M55 80 C35 80 35 55 55 55 C60 30 94 32 101 53 C122 49 135 76 116 83 Z"', "Cloud")}
      ${part("grass", "rect", 'x="0" y="300" width="500" height="90"', "Grass")}
      ${part("walls", "rect", 'x="105" y="160" width="290" height="178"', "Back walls")}
      ${part("roof", "polygon", 'points="75,168 250,55 425,168"', "Roof")}
      ${part("chimney", "rect", 'x="324" y="91" width="34" height="65"', "Chimney")}
      ${part("backWindow", "rect", 'x="145" y="210" width="70" height="65"', "Back window")}
      ${part("backDoor", "rect", 'x="270" y="237" width="64" height="101"', "Back door")}
      ${part("backKnob", "circle", 'cx="320" cy="290" r="4"', "Door knob")}
    `,
    Left: `
      ${part("sky", "rect", 'x="0" y="0" width="500" height="390"', "Sky")}
      ${part("sun", "circle", 'cx="420" cy="62" r="27"', "Sun")}
      ${part("cloud", "path", 'd="M55 80 C35 80 35 55 55 55 C60 30 94 32 101 53 C122 49 135 76 116 83 Z"', "Cloud")}
      ${part("grass", "rect", 'x="0" y="300" width="500" height="90"', "Grass")}
      ${part("walls", "polygon", 'points="140,165 360,165 360,338 140,338"', "Side walls")}
      ${part("roof", "polygon", 'points="115,165 250,68 385,165"', "Roof")}
      ${part("sideWindow", "rect", 'x="210" y="207" width="78" height="65"', "Side window")}
      ${part("sideDoor", "rect", 'x="290" y="237" width="52" height="101"', "Side door")}
      ${part("steps", "polygon", 'points="280,338 350,338 365,354 265,354"', "Steps")}
    `,
    Right: `
      ${part("sky", "rect", 'x="0" y="0" width="500" height="390"', "Sky")}
      ${part("sun", "circle", 'cx="420" cy="62" r="27"', "Sun")}
      ${part("cloud", "path", 'd="M55 80 C35 80 35 55 55 55 C60 30 94 32 101 53 C122 49 135 76 116 83 Z"', "Cloud")}
      ${part("grass", "rect", 'x="0" y="300" width="500" height="90"', "Grass")}
      ${part("walls", "polygon", 'points="140,165 360,165 360,338 140,338"', "Side walls")}
      ${part("roof", "polygon", 'points="115,165 250,68 385,165"', "Roof")}
      ${part("sideWindow", "rect", 'x="165" y="207" width="78" height="65"', "Side window")}
      ${part("sideDoor", "rect", 'x="255" y="237" width="52" height="101"', "Side door")}
      ${part("steps", "polygon", 'points="245,338 315,338 330,354 230,354"', "Steps")}
    `
  };

  houseCanvas.innerHTML = sides[activeSide];
  houseCanvas.querySelectorAll(".paint-part").forEach(element => {
    element.style.strokeWidth = "3";
  });
}

function renderPalette() {
  colorPalette.innerHTML = "";

  COLORS.forEach((color, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "color-swatch";
    button.style.backgroundColor = color;
    button.title = COLOR_NAMES[index];
    button.setAttribute("aria-label", COLOR_NAMES[index]);
    button.classList.toggle("selected", selectedColor.toLowerCase() === color.toLowerCase());

    button.addEventListener("click", () => {
      selectedColor = color;
      customColor.value = color;
      updateSelectedColor();
      renderPalette();
    });

    colorPalette.appendChild(button);
  });

  updateSelectedColor();
}

function updateSelectedColor() {
  const found = COLORS.findIndex(color =>
    color.toLowerCase() === selectedColor.toLowerCase()
  );

  selectedColorName.textContent =
    found >= 0 ? COLOR_NAMES[found] : selectedColor.toUpperCase();
}

function takeUndoSnapshot() {
  undoStack.push(JSON.stringify(getHouse().sides[activeSide]));
  if (undoStack.length > 50) undoStack.shift();
}

function paintPart(element) {
  if (!element || !element.classList.contains("paint-part")) return;

  const id = element.dataset.part;
  if (!id || lastPaintedPart === id) return;

  lastPaintedPart = id;
  takeUndoSnapshot();
  getHouse().sides[activeSide][id] = selectedColor;
  element.setAttribute("fill", selectedColor);
  saveProgress();
}

houseCanvas.addEventListener("pointerdown", event => {
  const element = event.target.closest(".paint-part");
  if (!element) return;

  event.preventDefault();
  isPainting = true;
  lastPaintedPart = null;
  paintPart(element);
});

houseCanvas.addEventListener("pointermove", event => {
  if (!isPainting) return;

  const element = document.elementFromPoint(event.clientX, event.clientY);
  if (element && houseCanvas.contains(element)) {
    const partElement = element.closest(".paint-part");
    if (partElement) paintPart(partElement);
  }
});

window.addEventListener("pointerup", () => {
  isPainting = false;
  lastPaintedPart = null;
});

window.addEventListener("pointercancel", () => {
  isPainting = false;
  lastPaintedPart = null;
});

houseCanvas.addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") &&
      event.target.classList.contains("paint-part")) {
    event.preventDefault();
    paintPart(event.target);
  }
});

houseGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-house]");
  if (!button) return;

  const number = Number(button.dataset.house);
  if (!number || !isUnlocked(number)) return;

  activeHouse = number;
  activeSide = "Front";
  undoStack = [];
  showMessage("");
  renderAll();
});

document.querySelectorAll(".side-button").forEach(button => {
  button.addEventListener("click", () => {
    activeSide = button.dataset.side;
    undoStack = [];
    renderAll();
  });
});

document.getElementById("saveHouseName").addEventListener("click", () => {
  const newName = houseNameInput.value.trim();

  if (!newName) {
    nameMessage.textContent = "Please type a name first! 😊";
    houseNameInput.focus();
    return;
  }

  getHouse().name = newName.slice(0, 30);
  saveProgress();
  renderAll();
  nameMessage.textContent = `🎉 Your house is now called "${getHouse().name}"!`;
  showMessage("House name saved!");
});

houseNameInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    document.getElementById("saveHouseName").click();
  }
});

customColor.addEventListener("input", () => {
  selectedColor = customColor.value;
  updateSelectedColor();
  renderPalette();
});

brushSizeInput.addEventListener("input", () => {
  brushSize = Number(brushSizeInput.value);
  const labels = { 1: "Normal", 2: "Large", 3: "Extra large" };
  brushSizeLabel.textContent = labels[brushSize] || "Normal";
});

/* Undo the last painting action on the current side. */
document.getElementById("undoButton").addEventListener("click", () => {
  if (!undoStack.length) {
    showMessage("Nothing to undo on this side yet.");
    return;
  }

  try {
    getHouse().sides[activeSide] = JSON.parse(undoStack.pop());
    saveProgress();
    renderHouse();
    showMessage("↩️ Last painting action undone!");
  } catch (error) {
    showMessage("Undo could not be completed.");
  }
});

/* Reset only the currently selected side. */
document.getElementById("resetSideButton").addEventListener("click", () => {
  if (!confirm(`Reset the ${activeSide.toLowerCase()} of this house?`)) return;

  getHouse().sides[activeSide] = {};
  undoStack = [];
  saveProgress();
  renderHouse();
  showMessage(`${activeSide} side reset.`);
});

/* Reset all sides of the selected house, keeping its name. */
document.getElementById("resetHouseButton").addEventListener("click", () => {
  if (!confirm("Reset all painted sides of this house? Its name will stay.")) return;

  getHouse().sides = {
    Front: {},
    Back: {},
    Left: {},
    Right: {}
  };
  getHouse().completed = false;

  undoStack = [];
  saveProgress();
  renderAll();
  showMessage("House painting reset. You can start again!");
});

/* Complete the current house and unlock the next one. */
document.getElementById("finishHouseButton").addEventListener("click", () => {
  const house = getHouse();

  if (house.completed) {
    showMessage("This house is already completed. Great job! ⭐");
    return;
  }

  if (!confirm(`Finish ${house.name || `House ${activeHouse}`} and unlock the next level?`)) {
    return;
  }

  house.completed = true;
  saveProgress();
  renderAll();

  if (activeHouse < TOTAL_HOUSES) {
    showMessage(`🎉 House ${activeHouse} completed! House ${activeHouse + 1} is unlocked!`);
  } else {
    showMessage("🏆 Incredible! You finished all 100 houses!");
  }
});

/* Export the current side as a PNG image. */
document.getElementById("savePngButton").addEventListener("click", () => {
  const svgClone = houseCanvas.cloneNode(true);
  svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svgClone.setAttribute("width", "1000");
  svgClone.setAttribute("height", "780");

  const svgText = new XMLSerializer().serializeToString(svgClone);
  const blob = new Blob([svgText], {
    type: "image/svg+xml;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 780;

    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    URL.revokeObjectURL(url);

    canvas.toBlob(pngBlob => {
      if (!pngBlob) {
        showMessage("Sorry, the PNG could not be created.");
        return;
      }

      const downloadUrl = URL.createObjectURL(pngBlob);
      const link = document.createElement("a");
      const safeName = (getHouse().name || `House-${activeHouse}`)
        .replace(/[^a-z0-9-_ ]/gi, "")
        .trim()
        .replace(/\s+/g, "-");

      link.href = downloadUrl;
      link.download = `${safeName || `House-${activeHouse}`}-${activeSide}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      showMessage("🖼️ Your PNG is ready!");
    }, "image/png");
  };

  image.onerror = () => {
    URL.revokeObjectURL(url);
    showMessage("Sorry, the image could not be saved.");
  };

  image.src = url;
});

/* Start the website. */
renderPalette();
renderAll();
