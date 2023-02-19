import { GameState, Move } from "./balla-model.js";
let originalGameState = null;
let gameState = null;
let donorIndex = null;
let donorRow = null;
const ballRadius = 40;
const ballRadiusInside = ballRadius - 0.5;
const ballDiameter = ballRadius * 2;
const ballPadding = 4;
const tubeWidth = ballDiameter + ballPadding * 2;
const tubeLowerCornerRadius = 26;
const tubePadding = 8;
const bounce = 20;
const svgNS = 'http://www.w3.org/2000/svg';
function removeElement(element) {
    if (element != null) {
        var parent = element.parentNode;
        if (parent != null) {
            parent.removeChild(element);
        }
    }
}
function tubeHeight() {
    if (gameState == null)
        throw new Error('gameState is null');
    return ballDiameter * gameState.tubeHeight + ballPadding;
}
function boardWidth() {
    if (gameState == null)
        throw new Error('gameState is null');
    return gameState.numberOfTubes * tubeWidth + (gameState.numberOfTubes - 1) * tubePadding;
}
function boardHeight() {
    if (gameState == null)
        throw new Error('gameState is null');
    return (gameState.tubeHeight + 1) * ballDiameter + ballPadding;
}
function newGame() {
    var element = document.getElementById("numberOfColors");
    var numberOfColors = parseInt(element.value);
    element = document.getElementById("numberOfExtraTubes");
    var numberOfExtraTubes = parseInt(element.value);
    element = document.getElementById("tubeHeight");
    var tubeHeight = parseInt(element.value);
    originalGameState = new GameState(numberOfColors, numberOfExtraTubes, tubeHeight);
    originalGameState.newGame();
    gameState = originalGameState.clone();
}
function normalMove(move) {
    holeBall(move.to);
}
function undoMove(move) {
    if (donorIndex == null) {
        liftAndHoleBall(move);
    }
    else {
        if (donorIndex == move.from) {
            holeBall(move.to);
        }
        else {
            dropBall();
            liftAndHoleBall(move);
        }
    }
}
function liftBall(from) {
    if (gameState == null)
        throw new Error('gameState is null');
    donorIndex = from;
    donorRow = gameState.tubes[from].fillLevel - 1;
    removeBall(donorIndex, donorRow);
    var fromText = `  from \{\n    cy: ${ballY(donorRow)}px; \n  \}`;
    var toText = `  to \{\n    cy: ${ballRadius}px; \n  \}`;
    var keyframes = `@keyframes liftBallAnimation \{\n${fromText}\n${toText}\n\}`;
    var styleText = `${keyframes}\n`;
    var styleElement = document.getElementById('liftStyle');
    if (styleElement == null)
        throw new Error('styleElement is null');
    var node = document.createTextNode(styleText);
    styleElement.innerHTML = '';
    styleElement.appendChild(node);
    var ball = createLiftedBall(from);
    removeClass('liftBallAnimation');
    ball.classList.add('liftBallAnimation');
    var puzzle = document.getElementById('puzzleGroup');
    if (puzzle == null)
        throw new Error('puzzle is null');
    var boundingBoxId = 'tubeBoundingBox_' + from;
    var boundingBox = document.getElementById(boundingBoxId);
    puzzle.insertBefore(ball, boundingBox);
}
function liftAndHoleBall(move) {
    if (gameState == null)
        throw new Error('gameState is null');
    var fromRow = gameState.tubes[move.from].fillLevel;
    var toRow = gameState.tubes[move.to].fillLevel - 1;
    removeBall(move.from, fromRow);
    var fromText = `  0% \{cx: ${ballX(move.from)}px; cy: ${ballY(fromRow)}px;\}`;
    var betweenText1 = `  26% \{cx: ${ballX(move.from)}px; cy: ${ballRadius}px;\}`;
    var betweenText2 = `  53% \{cx: ${ballX(move.to)}px; cy: ${ballRadius}px;\}`;
    var toText = `  80% \{cx: ${ballX(move.to)}px; cy: ${ballY(toRow)}px;\}`;
    var bounceText = `  90% \{cy: ${ballY(toRow) - bounce}px;\}`;
    var backText = `  100% \{cy: ${ballY(toRow)}px;\}`;
    var keyframes = `@keyframes undoBallKeyframes \{\n${fromText}\n${betweenText1}\n${betweenText2}\n${toText}\n${bounceText}\n${backText}\n\}`;
    var styleText = `${keyframes}\n`;
    var styleElement = document.getElementById('undoStyle');
    if (styleElement == null)
        throw new Error('undoElement is null');
    var node = document.createTextNode(styleText);
    styleElement.innerHTML = '';
    styleElement.appendChild(node);
    var ball = createBall(move.to, toRow);
    removeClass('undoBallAnimation');
    ball.classList.add('undoBallAnimation');
    var puzzle = document.getElementById('puzzleGroup');
    if (puzzle == null)
        throw new Error('puzzle is null');
    var boundingBoxId = 'tubeBoundingBox_' + move.to;
    var boundingBox = document.getElementById(boundingBoxId);
    puzzle.insertBefore(ball, boundingBox);
}
function removeClass(name) {
    var elements = document.getElementsByClassName(name);
    if (elements != null) {
        for (var i = 0; i < elements.length; i++) {
            elements[i].classList.remove(name);
        }
    }
}
function removeBall(columnIndex, rowIndex) {
    var ball = document.getElementById(ballId(columnIndex, rowIndex));
    removeElement(ball);
}
function removeLiftedBall() {
    var ball = document.getElementById('liftedBall');
    removeElement(ball);
}
function dropBall() {
    if (donorRow == null)
        throw new Error('donorRow is null');
    removeLiftedBall();
    var fromText = `  0% \{cy: ${ballRadius}px;\}`;
    var toText = `  80% \{cy: ${ballY(donorRow)}px;\}`;
    var bounceText = `  90% \{cy: ${ballY(donorRow) - bounce}px;\}`;
    var backText = `  100% \{cy: ${ballY(donorRow)}px;\}`;
    var keyframes = `@keyframes dropBallKeyframes \{\n${fromText}\n${toText}\n${bounceText}\n${backText}\n\}`;
    var styleText = `${keyframes}\n`;
    var styleElement = document.getElementById('dropStyle');
    if (styleElement == null)
        throw new Error('styleElement is null');
    var node = document.createTextNode(styleText);
    styleElement.innerHTML = '';
    styleElement.appendChild(node);
    if (donorIndex == null)
        throw new Error('donorIndex is null');
    var ball = createBall(donorIndex, donorRow);
    removeClass('dropBallAnimation');
    ball.classList.add('dropBallAnimation');
    var puzzle = document.getElementById('puzzleGroup');
    if (puzzle == null)
        throw new Error('puzzle is null');
    var boundingBoxId = 'tubeBoundingBox_' + donorIndex;
    var boundingBox = document.getElementById(boundingBoxId);
    puzzle.insertBefore(ball, boundingBox);
    donorIndex = null;
    donorRow = null;
}
function holeBall(to) {
    if (gameState == null)
        throw new Error('gameState is null');
    if (donorIndex == null)
        throw new Error('donorIndex is null');
    removeLiftedBall();
    var toRow = gameState.tubes[to].fillLevel - 1;
    var distance0 = Math.abs(to - donorIndex);
    var distance1 = gameState.tubeHeight - toRow;
    var fract = distance0 / (distance0 + distance1);
    var percent = fract * 80;
    var fromText = `  0% \{cx: ${ballX(donorIndex)}px; cy: ${ballRadius}px;\}`;
    var betweenText = `  ${percent}% \{cx: ${ballX(to)}px; cy: ${ballRadius}px;\}`;
    var toText = `  80% \{cy: ${ballY(toRow)}px;\}`;
    var bounceText = `  90% \{cy: ${ballY(toRow) - bounce}px;\}`;
    var backText = `  100% \{cy: ${ballY(toRow)}px;\}`;
    var keyframes = `@keyframes holeBallKeyframes \{\n${fromText}\n${betweenText}\n${toText}\n${bounceText}\n${backText}\n\}`;
    var styleText = `${keyframes}\n`;
    var styleElement = document.getElementById('holeStyle');
    if (styleElement == null)
        throw new Error('donorIndex is null');
    var node = document.createTextNode(styleText);
    styleElement.innerHTML = '';
    styleElement.appendChild(node);
    var ball = createBall(to, toRow);
    removeClass('holeBallAnimation');
    ball.classList.add('holeBallAnimation');
    var puzzle = document.getElementById('puzzleGroup');
    if (puzzle == null)
        throw new Error('puzzle is null');
    var boundingBox = document.getElementById('tubeBoundingBox_' + to);
    puzzle.insertBefore(ball, boundingBox);
    donorIndex = null;
    donorRow = null;
}
function clickOnTube(clickedCol) {
    if (gameState == null)
        throw new Error('gameState is null');
    if (donorIndex == null) {
        if (!gameState.tubes[clickedCol].isEmpty()) {
            liftBall(clickedCol);
        }
    }
    else {
        if (gameState.isMoveAllowed(donorIndex, clickedCol)) {
            var move = new Move(donorIndex, clickedCol);
            gameState.moveBallAndLog(move);
            normalMove(move);
            if (gameState.moveLog.length != 0) {
                var undoButton = document.getElementById('undoButton');
                if (undoButton == null)
                    throw new Error('undoButton is null');
                undoButton.disabled = false;
            }
            if (gameState.isSolved()) {
                alert('😀 Genial! Sie haben das Puzzle gelöst. 😀');
                newGame();
                resetGameView();
            }
        }
        else {
            dropBall();
            liftBall(clickedCol);
        }
    }
}
function ballX(col) {
    return col * (tubeWidth + tubePadding) + ballRadius + ballPadding;
}
function ballY(row) {
    if (gameState == null)
        throw new Error('gameState is null');
    return (gameState.tubeHeight - row) * ballDiameter + ballRadius;
}
function ballId(col, row) {
    return `ball_${col}_${row}`;
}
function createBall(col, row) {
    if (gameState == null)
        throw new Error('gameState is null');
    var ball = document.createElementNS(svgNS, 'circle');
    ball.setAttributeNS(null, 'cx', ballX(col).toString());
    ball.setAttributeNS(null, 'cy', ballY(row).toString());
    ball.setAttributeNS(null, 'r', ballRadiusInside.toString());
    ball.id = ballId(col, row);
    var className = 'ball' + gameState.getColorAt(col, row);
    ball.classList.add(className);
    ball.classList.add('balla');
    return ball;
}
function createLiftedBall(from) {
    if (gameState == null)
        throw new Error('gameState is null');
    var ball = document.createElementNS(svgNS, 'circle');
    ball.setAttributeNS(null, 'cx', ballX(from).toString());
    ball.setAttributeNS(null, 'cy', ballRadius.toString());
    ball.setAttributeNS(null, 'r', ballRadiusInside.toString());
    ball.id = 'liftedBall';
    var tube = gameState.tubes[from];
    var color = tube.colorOfHighestBall();
    var className = 'ball' + color;
    ball.classList.add(className);
    ball.classList.add('balla');
    return ball;
}
function createTube(col) {
    var tubePath = document.createElementNS(svgNS, 'path');
    var left = col * (tubeWidth + tubePadding);
    var upperLeft = `${left},${ballDiameter}`;
    var verticalHeight = tubeHeight() - tubeLowerCornerRadius;
    var archLeft = `a${tubeLowerCornerRadius},${tubeLowerCornerRadius} 0 0 0 ${tubeLowerCornerRadius},${tubeLowerCornerRadius}`;
    var archRight = `a${tubeLowerCornerRadius},${tubeLowerCornerRadius} 0 0 0 ${tubeLowerCornerRadius},${tubeLowerCornerRadius * -1}`;
    var path = `M${upperLeft} v${verticalHeight} ${archLeft} h${tubeWidth - tubeLowerCornerRadius * 2} ${archRight} v${verticalHeight * -1} z`;
    tubePath.setAttributeNS(null, 'd', path);
    tubePath.classList.add('tube');
    return tubePath;
}
function createBoundingBox(col) {
    var tubeBoundingBox = document.createElementNS(svgNS, 'rect');
    var left = col * (tubeWidth + tubePadding);
    tubeBoundingBox.setAttribute('x', left.toString());
    tubeBoundingBox.setAttribute('y', '0');
    tubeBoundingBox.setAttribute('width', tubeWidth.toString());
    tubeBoundingBox.setAttribute('height', (tubeHeight() + ballDiameter).toString());
    tubeBoundingBox.id = 'tubeBoundingBox_' + col;
    tubeBoundingBox.classList.add('tubeBoundingBox');
    tubeBoundingBox.addEventListener('click', (event) => {
        if (event.target == null)
            throw new Error('event.target is null');
        var clickedCol = parseInt(event.target.id.split('_')[1]);
        clickOnTube(clickedCol);
    });
    return tubeBoundingBox;
}
function resetGameView() {
    if (gameState == null)
        throw new Error('gameState is null');
    var svg = document.createElementNS(svgNS, 'svg');
    svg.id = 'puzzleImage';
    svg.setAttribute('width', boardWidth().toString());
    svg.setAttribute('height', boardHeight().toString());
    var styleIds = ['liftStyle', 'dropStyle', 'holeStyle', 'undoStyle'];
    for (var i = styleIds.length - 1; i >= 0; i--) {
        var styleId = styleIds[i];
        var styleElement = document.createElementNS(svgNS, 'style');
        styleElement.id = styleId;
        svg.appendChild(styleElement);
    }
    var puzzle = document.createElementNS(svgNS, 'g');
    puzzle.id = 'puzzleGroup';
    svg.appendChild(puzzle);
    for (var col = 0; col < gameState.numberOfTubes; col++) {
        var tubeElement = createTube(col);
        puzzle.appendChild(tubeElement);
    }
    for (var col = 0; col < gameState.numberOfTubes; col++) {
        var tube = gameState.tubes[col];
        for (var row = (tube.fillLevel - 1); row >= 0; row--) {
            var ball = createBall(col, row);
            puzzle.appendChild(ball);
        }
        var tubeBoundingBox = createBoundingBox(col);
        puzzle.appendChild(tubeBoundingBox);
    }
    var board = document.getElementById('board');
    if (board == null)
        throw new Error('board is null');
    board.textContent = '';
    donorIndex = null;
    board.appendChild(svg);
    var undoButton = document.getElementById('undoButton');
    if (undoButton == null)
        throw new Error('undoButton is null');
    undoButton.disabled = true;
    scaleBoard();
}
function scaleBoard() {
    var header = document.getElementById('kopf');
    if (header == null)
        throw new Error('header is null');
    var svg = document.getElementById('puzzleImage');
    if (svg == null)
        throw new Error('svg is null');
    var puzzleGroup = document.getElementById('puzzleGroup');
    if (puzzleGroup == null)
        throw new Error('puzzleGroup is null');
    var maxBoardHeight = window.innerHeight - header.offsetHeight - 20;
    var maxBoardWidth = window.innerWidth - 20;
    var maxScalingHeight = maxBoardHeight / boardHeight();
    var maxScalingWidth = maxBoardWidth / boardWidth();
    var scalingFactor = Math.min(maxScalingHeight, maxScalingWidth);
    var newBoardWidth = boardWidth() * scalingFactor;
    var newBoardHeight = boardHeight() * scalingFactor;
    svg.setAttributeNS(null, 'height', newBoardHeight.toString());
    svg.setAttributeNS(null, 'width', newBoardWidth.toString());
    puzzleGroup.setAttributeNS(null, 'transform', `scale(${scalingFactor})`);
}
document.addEventListener('DOMContentLoaded', function () {
    console.info('document loaded');
    var startButton = document.getElementById('startButton');
    startButton.addEventListener('click', function () {
        newGame();
        resetGameView();
    });
    var resetButton = document.getElementById('resetButton');
    resetButton.addEventListener('click', function () {
        if (originalGameState == null)
            throw new Error('originalGameState is null');
        gameState = originalGameState.clone();
        resetGameView();
    });
    var undoButton = document.getElementById('undoButton');
    undoButton.addEventListener('click', function () {
        if (gameState == null)
            throw new Error('gameState is null');
        if (gameState.moveLog.length == 0) {
            alert('Zug zurück ist nicht möglich!');
            return;
        }
        var backwardMove = gameState.undoLastMove();
        undoMove(backwardMove);
        if (gameState.moveLog.length == 0) {
            undoButton.disabled = true;
        }
    });
    var cheatButton = document.getElementById('cheatButton');
    cheatButton.addEventListener('click', function () {
        if (gameState == null)
            throw new Error('gameState is null');
        gameState.cheat();
        resetGameView();
    });
    var startForm = document.getElementById('startForm');
    startForm.addEventListener('submit', function (event) {
        event.preventDefault();
    });
    window.addEventListener('resize', function () {
        scaleBoard();
    });
    newGame();
    resetGameView();
});
