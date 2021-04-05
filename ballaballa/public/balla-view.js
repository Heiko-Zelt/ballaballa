/**
 * View / User-Interface
 */

/**
 * Spielstand zu Anfang des Spieles
 */
let originalGameState = null;

/**
 * aktueller Spielstand
 */
let gameState = null;

/**
 * welche Spalte wurde zuerst geklickt
 */
let donorIndex = null;

/**
 * auf welcher Höhe lag der oberste Ball bevor er angehoben wurde.
 * (nur für den Fall, dass ein Zug abgebrochen wird und er wieder gesenkt wird.)
 */
let donorRow = null;

/**
 * positions of original game board / puzzle without scaling
 */
let ballRadius = 40;
let ballRadiusInside = ballRadius - 0.5;
let ballDiameter = ballRadius * 2;
let ballPadding = 4;
let tubeWidth = ballDiameter + ballPadding * 2;
let tubeLowerCornerRadius = 26;
let tubePadding = 8;
let bounce = 20;

let svgNS = 'http://www.w3.org/2000/svg';

function tubeHeight() {
	return ballDiameter * gameState.tubeHeight + ballPadding;
}

function boardWidth() {
	return gameState.numberOfTubes * tubeWidth + (gameState.numberOfTubes - 1) * tubePadding
}

function boardHeight() {
	return (gameState.tubeHeight + 1) * ballDiameter + ballPadding;
}

function newGame() {
	var numberOfColors = parseInt(document.getElementById("numberOfColors").value);
	var numberOfExtraTubes = parseInt(document.getElementById("numberOfExtraTubes").value);
	var tubeHeight = parseInt(document.getElementById("tubeHeight").value);
	//console.debug('numberOfColors: ' + numberOfColors + ', numberOfExtraTubes: ' + numberOfExtraTubes + ', tubeHeight: ' + tubeHeight);
	originalGameState = new GameState(numberOfColors, numberOfExtraTubes, tubeHeight);
	//console.debug('originalGameState after constr: ' + JSON.stringify(originalGameState));
	originalGameState.newGame();
	//console.debug('originalGameState after newGame(): ' + JSON.stringify(originalGameState));
	gameState = originalGameState.clone();
	//console.debug('gameState: ' + JSON.stringify(gameState));
}

/**
 * Passt die Benutzer-Oberfläche an den neuen Spielstand an.
 * from: Spalten Index Geber
 * to:   Spalten Index Empfaenger
 * from == donorIndex
 */
function normalMove(move) {
	console.debug('normal move from ' + move.from + ' to ' + move.to);

	// Ball einlochen
	holeBall(move.to);
}

/**
 * Move backwards. 3 cases:
 * A ball may be in lifted state or not.
 * A lifted ball may be the right or the wrong ball.
 */
function undoMove(move) {
	console.debug('undo move from ' + move.from + ' to ' + move.to);

	if (donorIndex == null) {
		//console.debug('Ball anheben und einlochen in einer Animation');
		liftAndHoleBall(move);
	} else {
		if (donorIndex == move.from) {
			//console.debug('der richtige Ball schwebt schon');
			holeBall(move.to);
		} else {
			//console.debug('der falsche Ball schwebt. 2 Animationen.');
			dropBall(donorIndex);
			liftAndHoleBall(move);
		}
	}
}


function randomIdentifier() {
	return 'r' + Math.random().toString(36).substring(2, 15)
}

/**
 * from gibt die Spalte an
 */
function liftBall(from) {
	//removeStyles();

	// Globale Variablen
	donorIndex = from;
	donorRow = gameState.tubes[from].fillLevel - 1;

	removeBall(donorIndex, donorRow);
	removeAnimation('liftBallAnimation');

	var fromText = `  from \{\n    cy: ${ballY(donorRow)}px; \n  \}`
	var toText = `  to \{\n    cy: ${ballRadius}px; \n  \}`
	var keyframes = `@keyframes liftBallAnimation \{\n${fromText}\n${toText}\n\}`
	var styleText = `${keyframes}\n`
	//console.debug(styleText);

	var styleElement = document.getElementById('liftStyle');
	var node = document.createTextNode(styleText);
	styleElement.innerHTML = '';
	styleElement.appendChild(node);

	//console.debug('liftBall(from=' + from + ')');
	//console.debug('tube=' + JSON.stringify(gameState.tubes[from]));

	var ball = createLiftedBall(from);
	puzzle = document.getElementById('puzzleGroup');

	var boundingBoxId = 'tubeBoundingBox_' + from;
	//console.debug('insert before boundingBoxId=' + boundingBoxId);
	var boundingBox = document.getElementById(boundingBoxId);
	//console.debug('insert before boundingBoxId=' + boundingBox);
	puzzle.insertBefore(ball, boundingBox);

}

/**
 * Rückwärtszug
 */
function liftAndHoleBall(move) {
	var fromRow = gameState.tubes[move.from].fillLevel
	var toRow = gameState.tubes[move.to].fillLevel - 1

	//console.debug('ball wegnehmen von ' + move.from + ', ' + fromRow);
	removeBall(move.from, fromRow);
	removeAnimation('undoAnimation');

	var ball = createBall(move.to, toRow);
	ball.style.animationName = 'undoAnimation';
	ball.style.animationDuration = '0.5s';
	ball.style.animationTimingFunction = 'linear';
	ball.style.animationFillMode = 'forwards';
	puzzle = document.getElementById('puzzleGroup');
	var boundingBoxId = 'tubeBoundingBox_' + move.to;
	//console.debug('insert before boundingBoxId=' + boundingBoxId);
	var boundingBox = document.getElementById(boundingBoxId);
	//console.debug('insert before boundingBoxId=' + boundingBox);
	puzzle.insertBefore(ball, boundingBox);

	var fromText = `  0% \{cx: ${ballX(move.from)}px; cy: ${ballY(fromRow)}px;\}`
	var betweenText1 = `  26% \{cx: ${ballX(move.from)}px; cy: ${ballRadius}px;\}`
	var betweenText2 = `  53% \{cx: ${ballX(move.to)}px; cy: ${ballRadius}px;\}`
	var toText = `  80% \{cx: ${ballX(move.to)}px; cy: ${ballY(toRow)}px;\}`
	var bounceText = `  90% \{cy: ${ballY(toRow) - bounce}px;\}`
	var backText = `  100% \{cy: ${ballY(toRow)}px;\}`
	var keyframes = `@keyframes undoAnimation \{\n${fromText}\n${betweenText1}\n${betweenText2}\n${toText}\n${bounceText}\n${backText}\n\}`
	var styleText = `${keyframes}\n`
	//console.debug(styleText);

	var styleElement = document.getElementById('undoStyle');
	var node = document.createTextNode(styleText);
	styleElement.innerHTML = '';
	styleElement.appendChild(node);
}

/**
 * entfernt alle styles von allen Bällen (normale und angehobener) mit angegebem Animations-Name.
 * also auch eine eventuell vohandene Animation
 * Beim Klick auf "falsche" Röhre muss Ball anheben und senken gleichzeitig erfolgen.
 * 2 Animationen gleichzeitig!
 */
function removeAnimations(names) {
	allBalls = document.getElementsByClassName('balla');
	for (var i = 0; i < allBalls.length; i++) {
		var ball = allBalls[i];
		var style = ball.style;
		if (style != null) {
			if (names.includes(style.animationName)) {
				ball.removeAttribute('style');
			}
		}
	}
}

function removeAnimation(name) {
	allBalls = document.getElementsByClassName('balla');
	for (var i = 0; i < allBalls.length; i++) {
		var ball = allBalls[i];
		var style = ball.style;
		if (style != null) {
			if (style.animationName != null) {
				if (name == style.animationName) {
					ball.removeAttribute('style');
				}
			}
		}
	}
}

/**
 * Ball unten nicht mehr anzeigen
 * weil er angehoben wurde oder bei einem Undo-Move
 */
function removeBall(columnIndex, rowIndex) {
	console.debug('removeBall(columnIndex=' + columnIndex + ', rowIndex=' + rowIndex + ')');
	var ball = document.getElementById(ballId(columnIndex, rowIndex));
	ball.parentNode.removeChild(ball);
}

/**
 * erhöhten Ball nicht mehr anzeigen
 */
function removeLiftedBall() {
	console.debug('removeLiftedBall()');
	var ball = document.getElementById('liftedBall');
	if (ball != null) {
		ball.parentNode.removeChild(ball);
	}
}

/**
 * bewegt einen Ball von der erhöhten Position zur Normal-Position zurück.
 * weil ein Zug abgebrochen wird oder
 * es sich um einen Undo-Zug handelt und noch ein Ball in der Luft schwebte.
 * Vorsicht: verwendet die globale Variable donorIndex
 *
 * ein Ball wird wieder angezeigt, nachdem er erhöht war.
 * verwendet die globalen Variablen donorIndex und donorRow.
 */
function dropBall() {
	//console.debug('dropBall() donorIndex=' + donorIndex + ', donorRow=' + donorRow);

	removeLiftedBall();
	removeAnimation('dropBallAnimation');

	var fromText = `  0% \{cy: ${ballRadius}px;\}`;
	var toText = `  80% \{cy: ${ballY(donorRow)}px;\}`;
	var bounceText = `  90% \{cy: ${ballY(donorRow) - bounce}px;\}`;
	var backText = `  100% \{cy: ${ballY(donorRow)}px;\}`;
	var keyframes = `@keyframes dropBallAnimation \{\n${fromText}\n${toText}\n${bounceText}\n${backText}\n\}`;
	var styleText = `${keyframes}\n`
	//console.debug(styleText);
	var styleElement = document.getElementById('dropStyle');
	var node = document.createTextNode(styleText);
	styleElement.innerHTML = '';
	styleElement.appendChild(node);

	var ball = createBall(donorIndex, donorRow);
	ball.style.animationName = 'dropBallAnimation';
	ball.style.animationDuration = '0.3s';
	ball.style.animationTimingFunction = 'linear';
	ball.style.animationFillMode = 'forwards';
	puzzle = document.getElementById('puzzleGroup');
	var boundingBoxId = 'tubeBoundingBox_' + donorIndex;
	//console.debug('insert before boundingBoxId=' + boundingBoxId);
	var boundingBox = document.getElementById(boundingBoxId);
	//console.debug('insert before boundingBoxId=' + boundingBox);
	puzzle.insertBefore(ball, boundingBox);

	// globale Variablen
	donorIndex = null;
	donorRow = null;
}

/**
 * Zweiter Teil eines Zuges, nämlich den Ball einlochen
 */
function holeBall(to) {
	//console.debug('holeBall() donorIndex=' + donorIndex + ', donorRow=' + donorRow);
	removeLiftedBall();
	removeAnimation('holeBallAnimation');

	var toRow = gameState.tubes[to].fillLevel - 1;

	var fromText = `  0% \{cx: ${ballX(donorIndex)}px; cy: ${ballRadius}px;\}`
	var betweenText = `  40% \{cx: ${ballX(to)}px; cy: ${ballRadius}px;\}`
	var toText = `  80% \{cy: ${ballY(toRow)}px;\}`
	var bounceText = `  90% \{cy: ${ballY(toRow) - bounce}px;\}`
	var backText = `  100% \{cy: ${ballY(toRow)}px;\}`
	var keyframes = `@keyframes holeBallAnimation \{\n${fromText}\n${betweenText}\n${toText}\n${bounceText}\n${backText}\n\}`
	var styleText = `${keyframes}\n`
	//console.debug(styleText);
	var styleElement = document.getElementById('holeStyle');
	var node = document.createTextNode(styleText);
	styleElement.innerHTML = '';
	styleElement.appendChild(node);

	var ball = createBall(to, toRow);
	ball.style.animationName = 'holeBallAnimation';
	ball.style.animationDuration = '0.4s';
	ball.style.animationTimingFunction = 'linear';
	ball.style.animationFillMode = 'forwards';
	puzzle = document.getElementById('puzzleGroup');
	var boundingBox = document.getElementById('tubeBoundingBox_' + to);
	puzzle.insertBefore(ball, boundingBox);

	// globale Variablen
	donorIndex = null;
	donorRow = null;
}

/**
 * mehrere Fälle:
 *   Ball schwebt nicht und...
 *     Röhre leer -> keine Aktion
 *     Röhre nicht leer -> Ball anheben 
 *   Ball schwebt und...
 *     Zug ist erlaubt -> normaler Zug (Sonderfall: Quelle und Ziel kann auch gleich sein)
 *     Zug ist nicht erlaubt -> Ballwechsel
 */
function clickOnTube(clickedCol) {
	console.debug('clicked column: ' + clickedCol);
	if (donorIndex == null) {
		if (!gameState.tubes[clickedCol].isEmpty()) {
			liftBall(clickedCol);
		}
	} else {
		if (gameState.isMoveAllowed(donorIndex, clickedCol)) {
			console.debug('move from ' + donorIndex + ' to ' + clickedCol);
			var move = new Move(donorIndex, clickedCol);
			gameState.moveBallAndLog(move);
			normalMove(move);
			if (gameState.moveLog.length != 0) {
				var undoButton = document.getElementById('undoButton');
				undoButton.disabled = false;
			}
			if (gameState.isSolved()) {
				//setTimeout(function() {
					alert('😀 Genial! Sie haben das Puzzle gelöst. 😀');
				//}, 0);
				newGame();
				resetGameView();
			}
		} else {
			//console.debug('Wechsel');
			// Ball wieder runter
			dropBall(donorIndex);
			// dafür anderer Ball hoch
			liftBall(clickedCol);
		}
	}
}

function ballX(col) {
	return col * (tubeWidth + tubePadding) + ballRadius + ballPadding
}

function ballY(row) {
	return (gameState.tubeHeight - row) * ballDiameter + ballRadius
}

function ballId(col, row) {
	return `ball_${col}_${row}`
}

function createBall(col, row) {
	//console.debug(`createBall(col=${col}, row=${row})`);
	var ball = document.createElementNS(svgNS, 'circle');
	ball.setAttributeNS(null, 'cx', ballX(col));
	ball.setAttributeNS(null, 'cy', ballY(row));
	ball.setAttributeNS(null, 'r', ballRadiusInside);
	ball.id = ballId(col, row);
	var tube = gameState.tubes[col];
	var className = 'ball' + tube.cells[row]; // color
	//console.debug('className: ', className)
	ball.classList.add(className);
	ball.classList.add('balla');
	return ball;
}

function createLiftedBall(from) {
	var ball = document.createElementNS(svgNS, 'circle');
	ball.setAttributeNS(null, 'cx', ballX(from));
	ball.setAttributeNS(null, 'cy', ballRadius);
	ball.setAttributeNS(null, 'r', ballRadiusInside);
	ball.id = 'liftedBall';
	var tube = gameState.tubes[from];
	var color = tube.colorOfHighestBall();
	var className = 'ball' + color
	//console.debug('className: ', className)
	ball.classList.add(className);
	ball.classList.add('balla');

	//var animationName = randomIdentifier();
	//var styleText = 'animation-name: ballAnimation; animation-duration: 0.4s; animation-timing-function: ease-out; animation-fill-mode: forwards;';
	ball.style.animationName = 'liftBallAnimation';
	ball.style.animationDuration = '0.3s';
	ball.style.animationTimingFunction = 'ease-out';
	ball.style.animationFillMode = 'forwards';
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
	//console.debug(path);
	tubePath.setAttributeNS(null, 'd', path);
	tubePath.classList.add('tube');
	return tubePath;
}

function createBoundingBox(col) {
	var tubeBoundingBox = document.createElementNS(svgNS, 'rect');
	var left = col * (tubeWidth + tubePadding);
	tubeBoundingBox.setAttribute('x', left);
	tubeBoundingBox.setAttribute('y', 0);
	tubeBoundingBox.setAttribute('width', tubeWidth);
	tubeBoundingBox.setAttribute('height', tubeHeight() + ballDiameter);
	tubeBoundingBox.id = 'tubeBoundingBox_' + col;
	tubeBoundingBox.classList.add('tubeBoundingBox');
	tubeBoundingBox.addEventListener('click', function() {
		var clickedCol = parseInt(this.id.split('_')[1]);
		clickOnTube(clickedCol);
	});
	return tubeBoundingBox
}

function resetGameView() {
	var svg = document.createElementNS(svgNS, 'svg');
	svg.id = 'puzzleImage';
	svg.setAttribute('width', boardWidth());
	svg.setAttribute('height', boardHeight());

	var styleIds = ['liftStyle', 'dropStyle', 'holeStyle', 'undoStyle']
	for (var i = styleIds.length - 1; i >= 0; i--) {
		styleId = styleIds[i]
		var styleElement = document.createElementNS(svgNS, 'style');
		styleElement.id = styleId
		svg.appendChild(styleElement);
	}

	var puzzle = document.createElementNS(svgNS, 'g');
	puzzle.id = 'puzzleGroup';
	svg.appendChild(puzzle);

	/* background
	var rect = document.createElementNS(svgNS, 'rect')
	rect.setAttribute('x', 0)
	rect.setAttribute('y', 0)
	rect.setAttribute('width', boardWidth)
	rect.setAttribute('height', boardHeight)
	rect.setAttribute('fill', '#95B3D7')
	svg.appendChild(rect)
	*/

	// erst die Röhren als Hintergrund zeichnen
	for (var col = 0; col < gameState.numberOfTubes; col++) {
		var tube = createTube(col);
		puzzle.appendChild(tube);
	}

	// dann die Bälle und ihre zugehörige Röhren-Bounding-Box
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
	board.textContent = '';
	donorIndex = null;
	board.appendChild(svg);
	var undoButton = document.getElementById('undoButton');
	undoButton.disabled = true;
	scaleBoard();
}

function scaleBoard() {
	var header = document.getElementById('kopf');
	var svg = document.getElementById('puzzleImage');
	var puzzleGroup = document.getElementById('puzzleGroup');

	var maxBoardHeight = window.innerHeight - header.offsetHeight - 20;
	var maxBoardWidth = window.innerWidth - 20;
	//console.debug('maxBoardHeight: ' + maxBoardHeight);
	//console.debug('puzzleGroup: ' + puzzleGroup);
	var maxScalingHeight = maxBoardHeight / boardHeight();
	var maxScalingWidth = maxBoardWidth / boardWidth();
	var scalingFactor = Math.min(maxScalingHeight, maxScalingWidth);

	var newBoardWidth = boardWidth() * scalingFactor;
	var newBoardHeight = boardHeight() * scalingFactor;
	//console.debug('newBoardWidth: ' + newBoardWidth);

	svg.setAttributeNS(null, 'height', newBoardHeight);
	svg.setAttributeNS(null, 'width', newBoardWidth);
	puzzleGroup.setAttributeNS(null, 'transform', `scale(${scalingFactor})`);
}

document.addEventListener('DOMContentLoaded', function() {
	console.info('document loaded');

	var startButton = document.getElementById('startButton');
	startButton.addEventListener('click', function() {
		newGame();
		resetGameView();
	});

	var resetButton = document.getElementById('resetButton');
	resetButton.addEventListener('click', function() {
		gameState = originalGameState.clone();
		resetGameView();
	});

	var undoButton = document.getElementById('undoButton');
	undoButton.addEventListener('click', function() {
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
	cheatButton.addEventListener('click', function() {
		gameState.cheat();
		resetGameView();
	});

	var startForm = document.getElementById('startForm');
	startForm.addEventListener('submit', function(event) {
		console.debug('form submit');
		// don't submit form and reload page
		event.preventDefault();
	});

	window.addEventListener('resize', function() {
		scaleBoard();
	});

	newGame();
	resetGameView();
});