var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var boundingClientRect = canvas.getBoundingClientRect();

var boardSize = 640;
var cellSize = boardSize / 8;
canvas.height = boardSize; canvas.width = boardSize;

var initialOrder = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];

var BOARD = [];
var selectedPiece = null;

// value of each piece
var V = {
  "king": 10,
  "queen": 9,
  "rook": 5,
  "bishop": 4, // THIS IS WRONG, SHOULD BE 3
  "knight": 3,
  "pawn": 1
}

// class for a Cell
class C {
  constructor(rank, file, type, isWhite) {
    this.file = file;
    this.rank = rank;
    this.type = type;
    this.value = V[type];
    this.isWhite = isWhite;
  }
}

// #region helper functions
function indexToRankFile(index) {
  var rank = Math.floor(index/8);
  var file = index % 8;
  
  return { rank: rank, file: file };
}

function rankFileToIndex(rank, file) {
  return (rank * 8) + file;
}

function getValidMoves(c) {
  switch (c.type) {
    case "rook": return getRookMoves(c.rank, c.file, c.isWhite);
    case "knight": return getKnightMoves(c.rank, c.file, c.isWhite);
    case "bishop": return getBishopMoves(c.rank, c.file, c.isWhite);
    case "queen": return getQueenMoves(c.rank, c.file, c.isWhite);
    case "king": return getKingMoves(c.rank, c.file, c.isWhite);
    case "pawn": return getPawnMoves(c.rank, c.file, c.isWhite);
  }
}

// initialise pieces on the board
function setupInitialBoard() {
  // add white non-pawns
  initialOrder.forEach((piece, index) => {
    BOARD.push(new C(1, index+1, piece, true));
  });
  // add white pawns
  for(var file = 1; file <= 8; file++) {
    BOARD.push(new C(2, file, "pawn", true));
  }
  // add middle ranks
  for (var rank = 3; rank <= 6; rank++) {
    for (var file = 1; file <= 8; file++) {
      BOARD.push(new C(rank, file));
    }
  }
  // add black pawns
  for(var file = 1; file <= 8; file++) {
    BOARD.push(new C(7, file, "pawn", false));
  }
  // add black non-pawns
  initialOrder.forEach((piece, index) => {
    BOARD.push(new C(8, index+1, piece, true));
  });
}

function drawBoard() {
  context.clearRect(0, 0, boardSize, boardSize);
  var y = 0;
  var x = 0;
  context.beginPath();
  for (var i = 0; i <= 10; i++) {
    context.moveTo(x, y);
    context.lineTo(x + boardSize, y);
    context.stroke();
    y += cellSize;
  }

  y = 0;
  for (var i = 0; i <= 10; i++) {
    context.moveTo(x, y);
    context.lineTo(x, y + boardSize);
    context.stroke();
    x += cellSize;
  }
}
// #endregion

function populateBoard() {
  context.font = "14px serif";

  var highlightedMoves = !selectedPiece ? [] :
    getValidMoves(selectedPiece);

  BOARD.forEach(function (cell) {
    if (highlightedMoves.filter((move) => move.rank == cell.rank && move.file == cell.file).length) {
      context.fillStyle = "#99aa99";
      context.fillRect(
        (cell.file * cellSize - cellSize),
        (cell.rank * cellSize - cellSize), cellSize, cellSize);
    }

    if (selectedPiece.rank == cell.rank && selectedPiece.file == cell.file) {
      context.fillStyle = "#9999aa";
      context.fillRect(
        (cell.file * cellSize - cellSize),
        (cell.rank * cellSize - cellSize), cellSize, cellSize);
    }

    context.strokeText(
      (cell.type || "").toUpperCase(),
      (cell.file * cellSize) - 60,
      (cell.rank * cellSize) - 35);
  });
}

function addClickSelect() {
  canvas.addEventListener('click', function(e) {
    var rank = Math.floor(e.clientY / cellSize);
    var file = Math.floor(e.clientX / cellSize);
    selectedPiece = BOARD[rankFileToIndex(rank, file)];
    drawBoard();
    populateBoard();
  }, false);
}


setupInitialBoard();
drawBoard();
// set selected piece
selectedPiece = BOARD[55];
populateBoard();
addClickSelect();










// FUNCTIONS TO GET MOVES FOR EACH PEICE
function getPawnMoves(rank, file, isWhite) {
  var moves = [];
  var rankDirection = isWhite ? 1 : -1;
  var hasMoved = rank !== (isWhite ? 2 : 7);
  if (!hasMoved) {
    moves.push({ rank: rank + (2*rankDirection), file: file });
  }
  moves.push({ rank: rank + rankDirection, file: file });
  return moves;
}

function getRookMoves(rank, file, isWhite) {
  var moves = [];

  for(var i=0; i <= 8; i++) {
    moves.push({ rank: rank, file: i });
    moves.push({ rank: i, file: file });
  }
  moves.filter((move) => move.rank === file && move.file === move.file);
  return moves;
}

function getKnightMoves(rank, file, isWhite) {
  var moves = [];
  moves.push({ rank: rank+2, file: file+1 });
  moves.push({ rank: rank+2, file: file-1 });
  moves.push({ rank: rank-2, file: file+1 });
  moves.push({ rank: rank-2, file: file-1 });
  moves.push({ rank: rank+1, file: file+2 });
  moves.push({ rank: rank+1, file: file-2 });
  moves.push({ rank: rank-1, file: file+2 });
  moves.push({ rank: rank-1, file: file-2 });

  moves = moves.filter((move) => move.rank >= 1
                      && move.rank <= 8
                      && move.file >= 1
                      && move.file <= 8);

  return moves;
}

function getBishopMoves(rank, file, isWhite) {
  var moves = [];
  // var distanceFromEdge = Math.min(rank)

  for(var i=1; i <= 7; i++) {
    moves.push({ rank: rank+i, file: file+i });
    moves.push({ rank: rank+i, file: file-i });
    moves.push({ rank: rank-i, file: file+i });
    moves.push({ rank: rank-i, file: file-i });
  }

  moves.filter((move) => move.rank >= 1
                      && move.rank <= 8
                      && move.file >= 1
                      && move.file <= 8);
  return moves;
}

function getQueenMoves(rank, file, isWhite) {
  return getRookMoves(rank, file, isWhite).concat(getBishopMoves(rank, file, isWhite));
}

function getKingMoves(rank, file, isWhite) {
  var moves = [];
  moves.push({ rank: rank+1, file: file });
  moves.push({ rank: rank-1, file: file });
  moves.push({ rank: rank, file: file+1 });
  moves.push({ rank: rank, file: file-1 });

  moves.filter((move) => move.rank >= 1
                      && move.rank <= 8
                      && move.file >= 1
                      && move.file <= 8);
  return moves;
}