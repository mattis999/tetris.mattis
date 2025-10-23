// ==============================
// TETRIS SPIEL – KOMMENTIERTE VERSION
// ==============================

// Globale Variablen für Benutzername und Punkteverwaltung
let username = "";
let punkte = 0;
let highscore = 0;
let aktuelleGeschwindigkeit = 500; // Startgeschwindigkeit in Millisekunden (je kleiner, desto schneller)
const geschwindigkeitsStufe = 500; // Punkteabstand bis zur nächsten Geschwindigkeitserhöhung
const geschwindigkeitsSchritt = 0.05; // Schrittweite für Geschwindigkeitssteigerung (in Sekunden)

// Canvas für die Vorschau des nächsten Steins
const nextCanvas = document.getElementById('nextPiece');
const nextCtx = nextCanvas.getContext('2d');
let naechsteFigur = null; // speichert die nächste Figur

// Spielfeld-Einstellungen
const reihen = 20;          // Anzahl der Reihen im Spielfeld
const spalten = 10;         // Anzahl der Spalten im Spielfeld
const blockGroesse = 24;    // Größe eines Blocks in Pixeln

// Farben für die verschiedenen Tetris-Steine
const farben = [
  null,          // 0 = kein Block
  "#e43b44",     // 1: Rot (I)
  "#00e756",     // 2: Grün (O)
  "#29adff",     // 3: Blau (T)
  "#fff024",     // 4: Gelb (S)
  "#00cfff",     // 5: Cyan (Z)
  "#ff77a8",     // 6: Magenta (J)
  "#f58231",     // 7: Orange (L)
];

// Definition der Tetris-Figuren als 2D-Matrizen
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

// Variablen für das Spielfeld und die aktuelle Figur
let spielfeld = [];         // 2D-Array für das Spielfeld
let aktuelleFigur = null;   // Objekt für die aktuell fallende Figur
let spielLaeuft = false;    // Status, ob das Spiel aktiv läuft
let timer;                  // Intervall-Timer für die Fall-Logik

// Canvas für das Spielfeld
const canvas = document.getElementById('spielfeld');
const ctx = canvas.getContext('2d');

// ==============================
// ANMELDE-FUNKTION
// ==============================
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

// ==============================
// HIGHSCORE-VERWALTUNG
// ==============================
function ladeHighscore() {
  // Lade Highscore aus dem lokalen Speicher, benutzerspezifisch
  const hs = localStorage.getItem('tetris_highscore_' + username);
  return hs ? parseInt(hs) : 0;
}

function speichereHighscore() {
  // Speicher neuen Highscore, wenn aktueller Score besser ist
  if (punkte > highscore) {
    localStorage.setItem('tetris_highscore_' + username, punkte);
    highscore = punkte;
    document.getElementById('highscore').innerText = highscore.toString().padStart(2, '0');
  }
}

// ==============================
// FELD INITIALISIEREN
// ==============================
function initSpielfeld() {
  // Erzeugt ein leeres Spielfeld (2D-Array)
  spielfeld = [];
  for (let y = 0; y < reihen; y++) {
    spielfeld[y] = [];
    for (let x = 0; x < spalten; x++) {
      spielfeld[y][x] = 0;
    }
  }
}

// ==============================
// NEUES SPIEL STARTEN
// ==============================
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

// ==============================
// ZUFALLSFIGUR GENERIEREN
// ==============================
function generiereZufallsFigur() {
  const typ = Math.floor(Math.random() * 7) + 1; // Zufallszahl 1..7
  return {
    matrix: formen[typ].map(zeile => zeile.slice()), // Tiefe Kopie der Matrix
    x: Math.floor(spalten / 2) - 2, // Start in der Mitte
    y: 0,
    typ: typ
  };
}

// ==============================
// NEUE FIGUR INS SPIEL HOLEN
// ==============================
function neueFigur() {
  if (naechsteFigur === null) {
    naechsteFigur = generiereZufallsFigur();
  }
  aktuelleFigur = naechsteFigur;
  aktuelleFigur.x = Math.floor(spalten / 2) - 2;
  aktuelleFigur.y = 0;
  naechsteFigur = generiereZufallsFigur();

  // Wenn direkt nach dem Einfügen eine Kollision → Game Over
  if (kollidiert(aktuelleFigur.matrix, aktuelleFigur.x, aktuelleFigur.y)) {
    spielLaeuft = false;
    clearInterval(timer);
    speichereHighscore();
    showGameOver();
  }

  zeichneNextPiece();
}

// ==============================
// VORSCHAU DES NÄCHSTEN BLOCKS
// ==============================
function zeichneNextPiece() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!naechsteFigur) return;
  const m = naechsteFigur.matrix;
  const size = m.length;
  const block = blockGroesse;
  // zentrierte Darstellung im Vorschau-Canvas
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

// ==============================
// KOLLISIONSERKENNUNG
// ==============================
function kollidiert(matrix, posX, posY) {
  // Prüft, ob die übergebene Matrix an Position (posX, posY) im Spielfeld kollidiert
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

// ==============================
// FIGUR FIXIEREN (AUF FELD LEGEN)
// ==============================
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

// ==============================
// VOLLE REIHEN SUCHEN/LÖSCHEN
// ==============================
function reihenPruefen() {
  let reihenGeloescht = 0;
  outer: for (let y = spielfeld.length - 1; y >= 0; y--) {
    for (let x = 0; x < spalten; x++) {
      if (spielfeld[y][x] === 0) {
        continue outer; // Nicht komplett belegt, nächste Reihe prüfen
      }
    }
    // Komplette Reihe gefunden, löschen und neue oben einfügen
    spielfeld.splice(y, 1);
    spielfeld.unshift(Array(spalten).fill(0));
    reihenGeloescht++;
    y++; // gleiche Zeile nochmal prüfen (da verschoben)
  }
  if (reihenGeloescht > 0) {
    // Punktevergabe je nach Anzahl gelöschter Reihen
    punkte += [0, 100, 300, 700, 1500][reihenGeloescht];
    document.getElementById('punkte').innerText = punkte.toString().padStart(2, '0');
    aktualisiereGeschwindigkeit();
  }
}

// ==============================
// GESCHWINDIGKEIT ANPASSEN
// ==============================
function aktualisiereGeschwindigkeit() {
  // Für je 500 Punkte um 0.2s schneller, mind. 100ms
  const stufen = Math.floor(punkte / geschwindigkeitsStufe);
  const neueGeschwindigkeit = Math.max(100, 500 - stufen * geschwindigkeitsSchritt * 1000);
  if (neueGeschwindigkeit !== aktuelleGeschwindigkeit) {
    aktuelleGeschwindigkeit = neueGeschwindigkeit;
    clearInterval(timer);
    timer = setInterval(spielTick, aktuelleGeschwindigkeit);
  }
}

// ==============================
// FIGUR DREHEN
// ==============================
function dreheFigur() {
  const m = aktuelleFigur.matrix;
  // Matrix transponieren und Zeilen umkehren (90° Drehung)
  const gedreht = m[0].map((_, i) => m.map(row => row[i])).reverse();
  if (!kollidiert(gedreht, aktuelleFigur.x, aktuelleFigur.y)) {
    aktuelleFigur.matrix = gedreht;
  }
}

// ==============================
// SPIELTICK (SPIEL-SCHRITT)
// ==============================
function spielTick() {
  if (!spielLaeuft) return;
  // Figur eins nach unten, oder fixieren falls nicht möglich
  if (!kollidiert(aktuelleFigur.matrix, aktuelleFigur.x, aktuelleFigur.y + 1)) {
    aktuelleFigur.y++;
  } else {
    figurFixieren();
    speichereHighscore();
  }
  zeichneSpielfeld();
}

// ==============================
// ALLES ZEICHNEN
// ==============================
function zeichneSpielfeld() {
  // Hintergrund und Gitter zeichnen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /*
  // Gitterlinien für das Spielfeld
  ctx.save();
  ctx.strokeStyle = "#a958f340";
  ctx.lineWidth = 0;
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
  */

  // Alle gesetzten Blöcke zeichnen
  for (let y = 0; y < reihen; y++) {
    for (let x = 0; x < spalten; x++) {
      if (spielfeld[y][x] !== 0) {
        zeichneBlock(x, y, farben[spielfeld[y][x]]);
      }
    }
  }
  // Aktuelle, fallende Figur zeichnen
  const m = aktuelleFigur.matrix;
  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) {
      if (m[y][x] !== 0) {
        zeichneBlock(aktuelleFigur.x + x, aktuelleFigur.y + y, farben[aktuelleFigur.typ]);
      }
    }
  }
}

// ==============================
// EINEN BLOCK ZEICHNEN
// ==============================
function zeichneBlock(x, y, farbe) {
  ctx.fillStyle = farbe;
  ctx.fillRect(x * blockGroesse + 1, y * blockGroesse + 1, blockGroesse - 2, blockGroesse - 2);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.strokeRect(x * blockGroesse + 1, y * blockGroesse + 1, blockGroesse - 2, blockGroesse - 2);
}

// ==============================
// TASTENSTEUERUNG
// ==============================
document.addEventListener('keydown', function(e) {
  // Bei GameOver: beliebige Taste startet neues Spiel
  if (!spielLaeuft && document.getElementById('gameover-overlay').style.display === 'flex') {
    neuesSpiel();
    return;
  }
  if (!spielLaeuft) return;
  switch (e.key) {
    case "ArrowLeft":
      // Nach links bewegen
      if (!kollidiert(aktuelleFigur.matrix, aktuelleFigur.x - 1, aktuelleFigur.y)) {
        aktuelleFigur.x--;
        zeichneSpielfeld();
      }
      break;
    case "ArrowRight":
      // Nach rechts bewegen
      if (!kollidiert(aktuelleFigur.matrix, aktuelleFigur.x + 1, aktuelleFigur.y)) {
        aktuelleFigur.x++;
        zeichneSpielfeld();
      }
      break;
    case "ArrowDown":
      // Nach unten (schneller fallen lassen)
      if (!kollidiert(aktuelleFigur.matrix, aktuelleFigur.x, aktuelleFigur.y + 1)) {
        aktuelleFigur.y++;
        zeichneSpielfeld();
      }
      break;
    case "ArrowUp":
      // Figur drehen
      dreheFigur();
      zeichneSpielfeld();
      break;
  }
});

// ==============================
// GAME OVER OVERLAY ANZEIGEN / VERSTECKEN
// ==============================
function showGameOver() {
  const overlay = document.getElementById('gameover-overlay');
  overlay.style.display = 'flex';
}
function hideGameOver() {
  const overlay = document.getElementById('gameover-overlay');
  overlay.style.display = 'none';
}



