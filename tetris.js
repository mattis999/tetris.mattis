// Globale Variablen für Benutzer und Spielstand
let username = "";
let punkte = 0;
let highscore = 0;
let aktuelleGeschwindigkeit = 500; // Startgeschwindigkeit in ms
const geschwindigkeitsStufe = 500; // Punkte bis zur nächsten Erhöhung
const geschwindigkeitsSchritt = 0.05; // Wie viel Sekunden (0.05s) schneller

const nextCanvas = document.getElementById('nextPiece'); // <canvas id="nextPiece">
const nextCtx = nextCanvas.getContext('2d');
let naechsteFigur = null;

// Spielfeld-Parameter
const reihen = 20;
const spalten = 10;
const blockGroesse = 24;

// Farben für die verschiedenen Tetris-Steine (Arcade-ähnlich)
const farben = [
  null, // 0 = leer
  "#e43b44", // 1: rot
  "#00e756", // 2: grün
  "#29adff", // 3: blau
  "#fff024", // 4: gelb
  "#00cfff", // 5: cyan
  "#ff77a8", // 6: magenta
  "#f58231", // 7: orange
];

// Definition der Tetris-Steine (Matrizen für jede Form)
const formen = [
  [],
  [ // I-Form
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  [ // O-Form
    [2, 2],
    [2, 2]
  ],
  [ // T-Form
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0]
  ],
  [ // S-Form
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0]
  ],
  [ // Z-Form
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0]
  ],
  [ // J-Form
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0]
  ],
  [ // L-Form
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0]
  ]
];

// Spielfeld und aktuelle Figur
let spielfeld = [];
let aktuelleFigur = null;
let spielLaeuft = false;
let timer;

// Canvas zum Zeichnen des Spiels
const canvas = document.getElementById('spielfeld');
const ctx = canvas.getContext('2d');

// === Anmeldung ===
function anmelden() {
  const name = document.getElementById('username').value.trim();
  if (name.length === 0) {
    alert("Bitte gib einen Benutzernamen ein!");
    return;
  }
  username = name;
  document.getElementById('login').style.display = 'none';
  document.getElementById('spielbereich').style.display = 'flex';
  document.getElementById('spieler').innerText = "SPIELER: " + username.toUpperCase();
  highscore = ladeHighscore();
  document.getElementById('highscore').innerText = highscore.toString().padStart(2, '0');
  neuesSpiel();
}

// === Highscore laden ===
function ladeHighscore() {
  const hs = localStorage.getItem('tetris_highscore_' + username);
  return hs ? parseInt(hs) : 0;
}

// === Highscore speichern ===
function speichereHighscore() {
  if (punkte > highscore) {
    localStorage.setItem('tetris_highscore_' + username, punkte);
    highscore = punkte;
    document.getElementById('highscore').innerText = highscore.toString().padStart(2, '0');
  }
}

// === Spielfeld initialisieren ===
function initSpielfeld() {
  spielfeld = [];
  for (let y = 0; y < reihen; y++) {
    spielfeld[y] = [];
    for (let x = 0; x < spalten; x++) {
      spielfeld[y][x] = 0;
    }
  }
}

// === Starte ein neues Spiel ===
function neuesSpiel() {
  punkte = 0;
  aktuelleGeschwindigkeit = 500; // Geschwindigkeit zurücksetzen
  document.getElementById('punkte').innerText = punkte.toString().padStart(2, '0');
  initSpielfeld();
  naechsteFigur = null;
  neueFigur();
  spielLaeuft = true;
  if (timer) clearInterval(timer);
  timer = setInterval(spielTick, aktuelleGeschwindigkeit);
  zeichneSpielfeld();
  zeichneNextPiece();
  hideGameOver();
}

// === Hilfsfunktion für Zufallsfigur ===
function generiereZufallsFigur() {
  const typ = Math.floor(Math.random() * 7) + 1;
  return {
    matrix: formen[typ].map(zeile => zeile.slice()), // Tiefe Kopie
    x: Math.floor(spalten / 2) - 2,
    y: 0,
    typ: typ
  };
}

// === Neue Figur erzeugen ===
function neueFigur() {
  if (naechsteFigur === null) {
    naechsteFigur = generiereZufallsFigur();
  }
  aktuelleFigur = naechsteFigur;
  aktuelleFigur.x = Math.floor(spalten / 2) - 2;
  aktuelleFigur.y = 0;
  naechsteFigur = generiereZufallsFigur();

  if (kollidiert(aktuelleFigur.matrix, aktuelleFigur.x, aktuelleFigur.y)) {
    spielLaeuft = false;
    clearInterval(timer);
    speichereHighscore();
    showGameOver();
  }

  zeichneNextPiece();
}

// === Funktion um nächsten Stein zu zeichnen ===
function zeichneNextPiece() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!naechsteFigur) return;
  const m = naechsteFigur.matrix;
  const size = m.length;
  const block = blockGroesse;
  const offsetX = Math.floor((nextCanvas.width - size * block) / 2);
  const offsetY = Math.floor((nextCanvas.height - size * block) / 2);

  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) {
      if (m[y][x] !== 0) {
        nextCtx.fillStyle = farben[naechsteFigur.typ];
        nextCtx.fillRect(offsetX + x * block, offsetY + y * block, block, block);
        nextCtx.strokeStyle = "#fff";
        nextCtx.lineWidth = 2;
        nextCtx.strokeRect(offsetX + x * block, offsetY + y * block, block, block);
      }
    }
  }
}

// === Kollisionsprüfung ===
function kollidiert(matrix, posX, posY) {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (
        matrix[y][x] !== 0 &&
        (
          posY + y < 0 ||
          posY + y >= reihen ||
          posX + x < 0 ||
          posX + x >= spalten ||
          spielfeld[posY + y][posX + x] !== 0
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

// === Figur fixieren und Reihen prüfen ===
function figurFixieren() {
  const m = aktuelleFigur.matrix;
  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) {
      if (m[y][x] !== 0) {
        const feldY = aktuelleFigur.y + y;
        const feldX = aktuelleFigur.x + x;
        if (feldY >= 0 && feldY < reihen && feldX >= 0 && feldX < spalten) {
          spielfeld[feldY][feldX] = aktuelleFigur.typ;
        }
      }
    }
  }
  reihenPruefen();
  neueFigur();
}

// === Volle Reihen löschen und Punkte vergeben ===
function reihenPruefen() {
  let reihenGeloescht = 0;
  outer: for (let y = spielfeld.length - 1; y >= 0; y--) {
    for (let x = 0; x < spalten; x++) {
      if (spielfeld[y][x] === 0) {
        continue outer;
      }
    }
    // Komplette Reihe gefunden, löschen
    spielfeld.splice(y, 1);
    spielfeld.unshift(Array(spalten).fill(0));
    reihenGeloescht++;
    y++;
  }
  if (reihenGeloescht > 0) {
    punkte += [0, 100, 300, 700, 1500][reihenGeloescht];
    document.getElementById('punkte').innerText = punkte.toString().padStart(2, '0');
    aktualisiereGeschwindigkeit();
  }
}

// === Geschwindigkeit aktualisieren ===
function aktualisiereGeschwindigkeit() {
  // Für je 500 Punkte um 0.2s schneller!
  const stufen = Math.floor(punkte / geschwindigkeitsStufe);
  const neueGeschwindigkeit = Math.max(100, 500 - stufen * geschwindigkeitsSchritt * 1000); // min. 100ms
  if (neueGeschwindigkeit !== aktuelleGeschwindigkeit) {
    aktuelleGeschwindigkeit = neueGeschwindigkeit;
    clearInterval(timer);
    timer = setInterval(spielTick, aktuelleGeschwindigkeit);
  }
}

// === Figur drehen ===
function dreheFigur() {
  const m = aktuelleFigur.matrix;
  // Transponieren und dann Zeilen umkehren
  const gedreht = m[0].map((_, i) => m.map(row => row[i])).reverse();
  // Prüfen, ob Drehung möglich ist
  if (!kollidiert(gedreht, aktuelleFigur.x, aktuelleFigur.y)) {
    aktuelleFigur.matrix = gedreht;
  }
}

// === Spieltick: Figur nach unten bewegen oder fixieren ===
function spielTick() {
  if (!spielLaeuft) return;
  if (!kollidiert(aktuelleFigur.matrix, aktuelleFigur.x, aktuelleFigur.y + 1)) {
    aktuelleFigur.y++;
  } else {
    figurFixieren();
    speichereHighscore();
  }
  zeichneSpielfeld();
}

// === Spielfeld und aktuelle Figur zeichnen ===
function zeichneSpielfeld() {
  // Raster zeichnen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Hintergrund mit Gitter (dunkles Raster)
  ctx.save();
  ctx.strokeStyle = "#a958f340";
  ctx.lineWidth = 1;
  for (let x = 0; x <= spalten; x++) {
    ctx.beginPath();
    ctx.moveTo(x * blockGroesse, 0);
    ctx.lineTo(x * blockGroesse, reihen * blockGroesse);
    ctx.stroke();
  }
  for (let y = 0; y <= reihen; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * blockGroesse);
    ctx.lineTo(spalten * blockGroesse, y * blockGroesse);
    ctx.stroke();
  }
  ctx.restore();

  // Spielfeld zeichnen
  for (let y = 0; y < reihen; y++) {
    for (let x = 0; x < spalten; x++) {
      if (spielfeld[y][x] !== 0) {
        zeichneBlock(x, y, farben[spielfeld[y][x]]);
      }
    }
  }
  // Aktuelle Figur zeichnen
  const m = aktuelleFigur.matrix;
  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) {
      if (m[y][x] !== 0) {
        zeichneBlock(aktuelleFigur.x + x, aktuelleFigur.y + y, farben[aktuelleFigur.typ]);
      }
    }
  }
}

// === Einzelnen Block zeichnen ===
function zeichneBlock(x, y, farbe) {
  ctx.fillStyle = farbe;
  ctx.fillRect(x * blockGroesse + 1, y * blockGroesse + 1, blockGroesse - 2, blockGroesse - 2);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.strokeRect(x * blockGroesse + 1, y * blockGroesse + 1, blockGroesse - 2, blockGroesse - 2);
}

// === Tastatursteuerung ===
document.addEventListener('keydown', function(e) {
  if (!spielLaeuft && document.getElementById('gameover-overlay').style.display === 'flex') {
    neuesSpiel();
    return;
  }
  if (!spielLaeuft) return;
  switch (e.key) {
    case "ArrowLeft":
      if (!kollidiert(aktuelleFigur.matrix, aktuelleFigur.x - 1, aktuelleFigur.y)) {
        aktuelleFigur.x--;
        zeichneSpielfeld();
      }
      break;
    case "ArrowRight":
      if (!kollidiert(aktuelleFigur.matrix, aktuelleFigur.x + 1, aktuelleFigur.y)) {
        aktuelleFigur.x++;
        zeichneSpielfeld();
      }
      break;
    case "ArrowDown":
      if (!kollidiert(aktuelleFigur.matrix, aktuelleFigur.x, aktuelleFigur.y + 1)) {
        aktuelleFigur.y++;
        zeichneSpielfeld();
      }
      break;
    case "ArrowUp":
      dreheFigur();
      zeichneSpielfeld();
      break;
  }
});

// Game Over Overlay
function showGameOver() {
  const overlay = document.getElementById('gameover-overlay');
  overlay.style.display = 'flex';
}
function hideGameOver() {
  const overlay = document.getElementById('gameover-overlay');
  overlay.style.display = 'none';
}