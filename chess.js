var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var boundingClientRect = canvas.getBoundingClientRect();

var boardSize = 640;
var cellSize = boardSize / 8;
canvas.height = boardSize; canvas.width = boardSize;

var initialOrder = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];

var BOARD = [];
var whitePieces = [];
var blackPieces = [];
var selectedPiece = null;
var iAmWhite = true;

// value of each piece
var V = {
  "king": 10,
  "queen": 9,
  "rook": 5,
  "bishop": 3,
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
  return ((rank-1) * 8) + file - 1;
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
    var piece = new C(1, index+1, piece, true);
    whitePieces.push(piece);
    BOARD.push(piece);
  });
  // add white pawns
  for(var file = 1; file <= 8; file++) {
    var piece = new C(2, file, "pawn", true);
    whitePieces.push(piece);
    BOARD.push(piece);
  }
  // add middle ranks
  for (var rank = 3; rank <= 6; rank++) {
    for (var file = 1; file <= 8; file++) {
      BOARD.push(new C(rank, file));
    }
  }
  // add black pawns
  for(var file = 1; file <= 8; file++) {
    var piece = new C(7, file, "pawn", false);
    blackPieces.push(piece);
    BOARD.push(piece);
  }
  // add black non-pawns
  initialOrder.forEach((piece, index) => {
    var piece = new C(8, index+1, piece, false);
    blackPieces.push(piece);
    BOARD.push(piece);
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

    if (selectedPiece?.rank == cell.rank && selectedPiece?.file == cell.file) {
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

function addClickEvent() {
  canvas.addEventListener('click', function(e) {
    var rank = Math.ceil(e.clientY / cellSize);
    var file = Math.ceil(e.clientX / cellSize);
    selectedPiece = BOARD[rankFileToIndex(rank, file)];
    drawBoard();
    populateBoard();
  }, false);
}

var threatenedPieces = [] // TODO: get pieces that are threatened by an enemy piece
function getNextMove(isWhite) {
  var move = null;
  var bestScore = null;
  var bestPiece = null;
  var pieces = isWhite ? whitePieces : blackPieces;
  pieces.forEach((piece) => {
    var result = evaluatePiece(piece);
    if (!bestScore || bestScore < result.score) {
      bestScore = result.score;
      move = result.move;
      bestPiece = result.piece;
    }
  })
  return { piece: bestPiece, move: move }; 
}

function evaluatePiece(piece) {
  var moves = getValidMoves(piece);
  var bestMove = null;
  var bestScore = null;
  moves.forEach((move) => {
    var score = evaluateMove(move, piece);
    if (!bestScore || bestScore < score) {
      bestScore = score;
      bestMove = move;
    }
  })
  return { move: bestMove, score: bestScore, piece: piece };
}

function evaluateMove(move, piece) {
  var score = 0;
  var pieceValue = V[piece.type];
  var targetCell = BOARD[rankFileToIndex(move.rank, move.file)];
  var isThreatenedBefore = false // TODO: is currently threatened by an enemy piece
  var threateningPiece = null;
  var isAttacking = targetCell.type && targetCell.isWhite != iAmWhite;
  var isThreatenedAfter = false // TODO: will be threatened after move

  if (isThreatenedAfter && isAttacking) { // it's a trade
    var tradeValue = V[targetCell.type] - pieceValue;
    score = tradeValue;
  } else if (isAttacking) { // it's a free capture
    score = V[threateningPiece.type] - pieceValue;
  } else if (isThreatenedAfter) { // it's a terrible idea
    score = pieceValue * -1;
  } else if (isThreatenedBefore) { // it's escaping danger
    var getGuardingPiece = null; // TODO: get piece that is guarding this one
    if (getGuardingPiece) { // it's a potential trade
      var tradeValue = V[getGuardingPiece.type];
      score = tradeValue;
    } else { // it's unguarded and must flee
      score = pieceValue;
    }
  }

  var movingToProtect = threatenedPieces.filter((p) => {
    return p.rank == move.rank && p.file == move.file;
  })[0];
  if (movingToProtect) { // it's moving to protect another piece
    score = V[movingToProtect.type];
  }

  if (!isThreatenedBefore && !isAttacking) { // it's just moving for the sake of it
    // trying to occupy space near the centre of the board
    if ((move.rank == 4 || move.rank == 5) && (move.file == 4 || move.file == 5)) {
      score += 0.75;
    } else if ((move.rank > 2 || move.rank < 7) && (move.file > 2 || move.file < 7)) {
      score += 0.5;
    } else if ((move.rank > 1 || move.rank < 8) && (move.file > 1 || move.file < 8)) {
      score += 0.25
    }
  }

  return score;
}

setupInitialBoard();
drawBoard();
// set selected piece
// selectedPiece = BOARD[55];
populateBoard();
addClickEvent();










// FUNCTIONS TO GET MOVES FOR EACH PEICE
function getPawnMoves(rank, file, isWhite) {
  var rankDirection = isWhite ? 1 : -1;
  var move = { rank: rank + rankDirection, file: file };
  if (!moveIsBlocked(move)) {
    var moves = [];
    var hasMoved = rank !== (isWhite ? 2 : 7);
    moves.push(move);
    if (!hasMoved) {
      moves.push({ rank: rank + (2*rankDirection), file: file });
    }
  }
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
                      && move.file <= 8
                      && !moveIsBlocked(move));

  return moves;
}

function getRookMoves(rank, file, isWhite) {
  var moves = [];
  var expandXUp = true;
  var expandXDown = true;
  var expandYUp = true;
  var expandYDown = true;

  var i = 1;
  while (expandXUp || expandXDown || expandYUp || expandYDown) {
    expandXUp = rank - 1 >= 1 && !moveIsBlocked({ rank: rank - 1, file: file });
    expandXDown = rank + 1 <= 8 && !moveIsBlocked({ rank: rank + 1, file: file });
    expandYUp = file - 1 >= 1 && !moveIsBlocked({ rank: rank, file: file - 1 });
    expandYDown = file + 1 <= 8 && !moveIsBlocked({ rank: rank, file: file + 1 });
    
    if (expandXUp) {
      moves.push({ rank: rank - 1, file: i });
    }
    if (expandXDown) {
      moves.push({ rank: rank + 1, file: i });
    }
    if (expandYUp) {
      moves.push({ rank: rank, file: i - 1 });
    }
    if (expandYDown) {
      moves.push({ rank: rank, file: i + 1 });
    }

    i++;
  }
  return moves;
}

function getBishopMoves(rank, file, isWhite) {
  var moves = [];
  var expandXUp = true;
  var expandXDown = true;
  var expandYUp = true;
  var expandYDown = true;

  var i = 1;
  while (expandXUp || expandXDown || expandYUp || expandYDown) {
    expandXUp = rank - 1 >= 1 && file - 1 >= 1 && !moveIsBlocked({ rank: rank - 1, file: file - 1 });
    expandXDown = rank + 1 <= 8 && file - 1 >= 1 && !moveIsBlocked({ rank: rank + 1, file: file - 1 });
    expandYUp = rank - 1 >= 1 && file + 1 >= 1 && !moveIsBlocked({ rank: rank - 1, file: file + 1 });
    expandYDown = rank + 1 <= 8 && file + 1 >= 1 && !moveIsBlocked({ rank: rank + 1, file: file + 1 });
    
    if (expandXUp) {
      moves.push({ rank: rank - 1, file: file - 1 });
    }
    if (expandXDown) {
      moves.push({ rank: rank + 1, file: file - 1 });
    }
    if (expandYUp) {
      moves.push({ rank: rank - 1, file: file + 1 });
    }
    if (expandYDown) {
      moves.push({ rank: rank + 1, file: file + 1 });
    }

    i++;
  }
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

  moves = moves.filter((move) => move.rank >= 1
                      && move.rank <= 8
                      && move.file >= 1
                      && move.file <= 8
                      && !moveIsBlocked(move));
  return moves;
}

function moveIsBlocked(move) {
  return !!BOARD[rankFileToIndex(move.rank, move.file)]?.type;
}