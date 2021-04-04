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
 * original game board / puzzle size without scaling
 */
let boardWidth = null;
let boardHeight = null;

function newGame() {
	var numberOfColors = parseInt(document.getElementById("numberOfColors").value);
	var numberOfExtraTubes = parseInt(document.getElementById("numberOfExtraTubes").value);
	var tubeHeight = parseInt(document.getElementById("tubeHeight").value);
	console.log('numberOfColors: ' + numberOfColors + ', numberOfExtraTubes: ' + numberOfExtraTubes + ', tubeHeight: ' + tubeHeight);
	originalGameState = new GameState(numberOfColors, numberOfExtraTubes, tubeHeight);
	console.log('originalGameState after constr: ' + JSON.stringify(originalGameState));
	originalGameState.newGame();
	console.log('originalGameState after newGame(): ' + JSON.stringify(originalGameState));
	gameState = originalGameState.clone();
	console.log('gameState: ' + JSON.stringify(gameState));
}

/**
 * Passt die Benutzer-Oberfläche an den neuen Spielstand an.
 * from: Spalten Index Geber
 * to:   Spalten Index Empfaenger
 * from == donorIndex
 */
function normalMove(move) {
	console.log('normal move from ' + move.from + ' to ' + move.to);

	// Der Zug wurde schon ausgeführt. Deswegen ergibt sich die Farbe aus dem Zielfeld.
	console.log('Erhöhten Ball nicht mehr anzeigen.');
	removeLiftedBall();

	// Ball einlochen
	holeBall(move.to);

	// globale Variable
	donorIndex = null;
}

/**
 * move backwards.
 * a ball may be in lifted state or not.
 */
function undoMove(move) {
	console.log('undo move from ' + move.from + ' to ' + move.to);
	if (donorIndex != null) {
		console.log('Quell-Ball ist oben. Zug abbrechen. Erhöhten Ball fallen lassen.');
		dropBall(move.to);
	}
	var row = gameState.tubes[move.from].fillLevel;
	console.log('ball wegnehmen von ' + move.from + ', ' + row);
	removeBall(move.from, row);

	// Ball einlochen
	holeBall(move.to);

	// globale Variable
	donorIndex = null;
}

/**
 * Zweiter Teil eines Zuges, nämlich den Ball einlochen
 */
function holeBall(to) {
	console.log('holeBall(to=' + to + ')');
	var color = gameState.tubes[to].colorOfHighestBall();
	var receiverBallId = 'ball_' + to + '_' + (gameState.tubes[to].fillLevel - 1);
	console.log('receiverBallId=' + receiverBallId);
	var receiverElement = document.getElementById(receiverBallId);
	receiverElement.classList.remove('ball0');
	receiverElement.classList.add('ball' + color);
}

function liftBall(from) {
	// Globale Variablen
	donorIndex = from;
	donorRow = gameState.tubes[from].fillLevel - 1;

	console.log('liftBall(from=' + from + ')');
	console.log('tube=' + JSON.stringify(gameState.tubes[from]));

	// Ball oben anzeigen
	var lifted = document.getElementById('lifted_' + from);
	var color = gameState.tubes[from].colorOfHighestBall();
	var className = 'ball' + color;
	console.log('className=' + className);
	lifted.classList.remove('ball0');
	lifted.classList.add(className);
	console.log('lifted.classList' + JSON.stringify(lifted.classList));

	// Ball unten nicht mehr anzeigen
	donorRow = gameState.tubes[from].fillLevel - 1;
	console.log('donorRow=' + donorRow);
	removeBall(from, donorRow);
}

/**
 * bewegt einen Ball von der erhöhten Position zur Normal-Position zurück.
 * weil ein Zug abgebrochen wird oder
 * es sich um einen Undo-Zug handelt und noch ein Ball in der Luft schwebte.
 * Vorsicht: verwendet die globale Variable donorIndex
 */
function dropBall() {
	console.log('dropBall() donorIndex=' + donorIndex + ', donorRow=' + donorRow);

	removeLiftedBall();

	// Ball unten wieder anzeigen
	reapearBall();
}

/**
 * entfernt Klassen ball1, ball2, ..., ball13
 */
function removeBallColorClass(elementToHide) {
	for (var i = 1; i <= 13; i++) {
		elementToHide.classList.remove('ball' + i);
	}
}

/**
 * Ball unten nicht mehr anzeigen
 * weil er angehoben wurde oder bei einem Undo-Move
 */
function removeBall(columnIndex, rowIndex) {
	console.log('removeBall(columnIndex=' + columnIndex + ', rowIndex=' + rowIndex + ')');
	var hidden = document.getElementById('ball_' + columnIndex + '_' + rowIndex);
	removeBallColorClass(hidden);
	hidden.classList.add('ball0');
}

/**
 * ein Ball wird wieder angezeigt, nachdem er erhöht war.
 * verwendet die globalen Variablen donorIndex und donorRow.
 */
function reapearBall() {
	console.log('>>>>>> reapearBall() donorIndex=' + donorIndex);
	var color = gameState.tubes[donorIndex].cells[donorRow];

	var ballId = `ball_${donorIndex}_${donorRow}`;
	console.log('ballId=' + ballId);
	var hidden = document.getElementById(ballId);
	hidden.classList.remove('ball0');

	var className = 'ball' + color;
	hidden.classList.add(className);

	// globale Variablen
	donorIndex = null;
	donorRow = null;
}

/**
 * erhöhten Ball nicht mehr anzeigen
 * verwendet die globale Variable donorIndex
 */
function removeLiftedBall() {
	console.log('removeLiftedBall() donorIndex=' + donorIndex);
	var lifted = document.getElementById('lifted_' + donorIndex);
	removeBallColorClass(lifted);
	lifted.classList.add('ball0');
	console.log('lifted.classList' + JSON.stringify(lifted.classList));
}

function clickOnTube(clickedCol) {
	console.log('clicked column: ' + clickedCol);
	if (donorIndex == null) {
		if (!gameState.tubes[clickedCol].isEmpty()) {
			liftBall(clickedCol);
		}
	} else {
		if (gameState.isMoveAllowed(donorIndex, clickedCol)) {
			console.log('move from ' + donorIndex + ' to ' + clickedCol);
			var move = new Move(donorIndex, clickedCol);
			gameState.moveBallAndLog(move);
			normalMove(move);
			if (gameState.moveLog.length != 0) {
				var undoButton = document.getElementById('undoButton');
				undoButton.disabled = false;
			}
			if (gameState.isSolved()) {
				alert('😀 Genial! Sie haben das Puzzle gelöst. 😀');
				newGame();
				resetGameView();
			}
		} else {
			console.log('Wechsel!!!!');
			// Ball wieder runter
			dropBall(donorIndex);
			// dafür anderer Ball hoch
			liftBall(clickedCol);
		}
	}
}

function resetGameView() {
	var ballRadius = 40;
	var ballRadiusInside = ballRadius - 0.5;
	var ballDiameter = ballRadius * 2;
	var ballPadding = 4;
	var tubeWidth = ballDiameter + ballPadding * 2;
	var tubeHeight = ballDiameter * gameState.tubeHeight;
	var tubeLowerCornerRadius = 26;
	var tubePadding = 8;
	boardWidth = gameState.numberOfTubes * tubeWidth + (gameState.numberOfTubes - 1) * tubePadding;
	boardHeight = (gameState.tubeHeight + 1) * ballDiameter + ballPadding;

	var svgNS = 'http://www.w3.org/2000/svg';
	var svg = document.createElementNS(svgNS, 'svg');
	svg.id='puzzleImage';
	svg.setAttribute('width', boardWidth);
	svg.setAttribute('height', boardHeight);
	
	var puzzle = document.createElementNS(svgNS, 'g');
	puzzle.id='puzzleGroup';
	svg.appendChild(puzzle);
	

	/*
	var rect = document.createElementNS(svgNS, 'rect')
	rect.setAttribute('x', 0)
	rect.setAttribute('y', 0)
	rect.setAttribute('width', boardWidth)
	rect.setAttribute('height', boardHeight)
	rect.setAttribute('fill', '#95B3D7')
	svg.appendChild(rect)
	*/

	for (var col = 0; col < gameState.numberOfTubes; col++) {
		var tube = gameState.tubes[col];
		var tubePath = document.createElementNS(svgNS, 'path');
		var left = col * (tubeWidth + tubePadding);
		//var right = (col + 1) * tubeWidth + col * tubePadding
		var upperLeft = `${left},${ballDiameter}`;
		//var lowerLeft = `${left},${boardHeight}`
		//var lowerRight = `${right},${boardHeight}`
		//var upperRight = `${right},${ballHeight}`
		//path = `M${upperLeft} v${tubeHeight - tubeLowerCornerRadius} l${tubeLowerCornerRadius},${tubeLowerCornerRadius} h${tubeWidth - tubeLowerCornerRadius} v${tubeHeight * -1} z`
		verticalHeight = tubeHeight - tubeLowerCornerRadius + ballPadding;
		archLeft = `a${tubeLowerCornerRadius},${tubeLowerCornerRadius} 0 0 0 ${tubeLowerCornerRadius},${tubeLowerCornerRadius}`;
		archRight = `a${tubeLowerCornerRadius},${tubeLowerCornerRadius} 0 0 0 ${tubeLowerCornerRadius},${tubeLowerCornerRadius * -1}`;
		path = `M${upperLeft} v${verticalHeight} ${archLeft} h${tubeWidth - tubeLowerCornerRadius * 2} ${archRight} v${verticalHeight * -1} z`;
		console.log(path);
		tubePath.setAttributeNS(null, 'd', path);
		tubePath.classList.add('tube');
		puzzle.appendChild(tubePath);

		var liftedBall = document.createElementNS(svgNS, 'circle');
		liftedBall.setAttributeNS(null, 'cx', col * (tubeWidth + tubePadding) + ballRadius + ballPadding);
		liftedBall.setAttributeNS(null, 'cy', ballRadius);
		liftedBall.setAttributeNS(null, 'r', ballRadiusInside);
		liftedBall.id = 'lifted_' + col;
		liftedBall.classList.add('balla');
		liftedBall.classList.add('ball0'); // invisible
		puzzle.appendChild(liftedBall);

		for (var row = (gameState.tubeHeight - 1); row >= 0; row--) {
			var ball = document.createElementNS(svgNS, 'circle');
			ball.setAttributeNS(null, 'cx', col * (tubeWidth + tubePadding) + ballRadius + ballPadding);
			ball.setAttributeNS(null, 'cy', (gameState.tubeHeight - row) * ballDiameter + ballRadius);
			ball.setAttributeNS(null, 'r', ballRadiusInside);
			ball.id = `ball_${col}_${row}`;
			className = 'ball' + tube.cells[row]; // color
			//console.log('className: ', className)
			ball.classList.add(className);
			ball.classList.add('balla');
			puzzle.appendChild(ball);
		}

		var tubeBoundingBox = document.createElementNS(svgNS, 'rect');
		tubeBoundingBox.setAttribute('x', left);
		tubeBoundingBox.setAttribute('y', ballDiameter);
		tubeBoundingBox.setAttribute('width', tubeWidth);
		tubeBoundingBox.setAttribute('height', tubeHeight);
		tubeBoundingBox.id = 'tubeBoundingBox_' + col;
		tubeBoundingBox.classList.add('tubeBoundingBox');
		tubeBoundingBox.addEventListener('click', function() {
			var clickedCol = parseInt(this.id.split('_')[1]);
			clickOnTube(clickedCol);
		})
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
	console.log('maxBoardHeight: ' + maxBoardHeight);
	console.log('puzzleGroup: ' + puzzleGroup);
	var maxScalingHeight = maxBoardHeight / boardHeight;
	var maxScalingWidth = maxBoardWidth / boardWidth;
	var scalingFactor = Math.min(maxScalingHeight, maxScalingWidth);
	
	var newBoardWidth = boardWidth * scalingFactor;
	var newBoardHeight = boardHeight * scalingFactor;
	console.log('newBoardWidth: ' + newBoardWidth);

	svg.setAttributeNS(null, 'height', newBoardHeight);
	svg.setAttributeNS(null, 'width', newBoardWidth);
	puzzleGroup.setAttributeNS(null, 'transform', `scale(${scalingFactor})`);
}

document.addEventListener('DOMContentLoaded', function() {
	console.log('document loaded');

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
			alert('nicht möglich');
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
	startForm.addEventListener('submit', function() {
		console.log('form submit');
		// don't submit form and reload page
		event.preventDefault();
	});

	window.addEventListener('resize', function() {
		scaleBoard();
	});

	newGame();
	resetGameView();

});