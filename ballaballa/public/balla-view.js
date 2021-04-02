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

function newGame() {
	var numberOfColors = parseInt(document.getElementById("numberOfColors").value)
	var numberOfExtraTubes = parseInt(document.getElementById("numberOfExtraTubes").value)
	var tubeHeight = parseInt(document.getElementById("tubeHeight").value)
	console.log('numberOfColors: ' + numberOfColors + ', numberOfExtraTubes: ' + numberOfExtraTubes + ', tubeHeight: ' + tubeHeight)
	originalGameState = new GameState(numberOfColors, numberOfExtraTubes, tubeHeight)
	console.log('originalGameState after constr: ' + JSON.stringify(originalGameState))
	originalGameState.newGame()
	console.log('originalGameState after newGame(): ' + JSON.stringify(originalGameState))
	gameState = originalGameState.clone()
	console.log('gameState: ' + JSON.stringify(gameState))
}

/**
 * Passt die Benutzer-Oberfläche an den neuen Spielstand an.
 * from: Spalten Index Geber
 * to:   Spalten Index Empfaenger
 * from == donorIndex
 */
function normalMove(move) {
	console.log('normal move from ' + move.from + ' to ' + move.to)

	// Der Zug wurde schon ausgeführt. Deswegen ergibt sich die Farbe aus dem Zielfeld.
	console.log('Erhöhten Ball nicht mehr anzeigen.')
	removeLiftedBall()

	// Ball einlochen
	holeBall(move.to)

	// globale Variable
	donorIndex = null
}

/**
 * move backwards.
 * a ball may be in lifted state or not.
 */
function undoMove(move) {
	console.log('undo move from ' + move.from + ' to ' + move.to)
	if(donorIndex != null) {
		console.log('Quell-Ball ist oben. Zug abbrechen. Erhöhten Ball fallen lassen.')
		dropBall(move.to)
	}
	var row = gameState.tubes[move.from].fillLevel
	console.log('ball wegnehmen von ' + move.from + ', ' + row)
	removeBall(move.from, row)

	// Ball einlochen
	holeBall(move.to)

	// globale Variable
	donorIndex = null
}

/**
 * Zweiter Teil eines Zuges, nämlich den Ball einlochen
 */
function holeBall(to) {
	console.log('holeBall(to=' + to + ')')
	var color = gameState.tubes[to].colorOfHighestBall()
	var receiverCellId = 'cell_' + to + '_' + (gameState.tubes[to].fillLevel - 1)
	console.log('receiverCellId=' + receiverCellId)
	var receiverElement = document.getElementById(receiverCellId)
	receiverElement.classList.remove('ball0')
	receiverElement.classList.add('ball' + color)
}

function liftBall(from) {
	// Globale Variablen
	donorIndex = from
	donorRow = gameState.tubes[from].fillLevel - 1

	console.log('liftBall(from=' + from + ')')
	console.log('tube=' + JSON.stringify(gameState.tubes[from]))

	// Ball oben anzeigen
	var lifted = document.getElementById('lifted_' + from)
	var color = gameState.tubes[from].colorOfHighestBall()
	var className = 'ball' + color
	console.log('className=' + className)
	lifted.classList.remove('ball0')
	lifted.classList.add(className)
	console.log('lifted.classList' + JSON.stringify(lifted.classList))

	// Ball unten nicht mehr anzeigen
	donorRow = gameState.tubes[from].fillLevel - 1
	console.log('donorRow=' + donorRow)
	removeBall(from, donorRow)
}

/**
 * bewegt einen Ball von der erhöhten Position zur Normal-Position zurück.
 * weil ein Zug abgebrochen wird oder
 * es sich um einen Undo-Zug handelt und noch ein Ball in der Luft schwebte.
 * Vorsicht: verwendet die globale Variable donorIndex
 */
function dropBall() {
	console.log('dropBall() donorIndex=' + donorIndex + ', donorRow=' + donorRow)

	removeLiftedBall()

	// Ball unten wieder anzeigen
	reapearBall()
}

/**
 * entfernt Klassen ball1, ball2, ..., ball13
 */
function removeBallColorClass(elementToHide) {
	for (var i = 1; i <= 13; i++) {
		elementToHide.classList.remove('ball' + i)
	}
}

/**
 * Ball unten nicht mehr anzeigen
 * weil er angehoben wurde oder bei einem Undo-Move
 */
function removeBall(columnIndex, rowIndex) {
	console.log('removeBall(columnIndex=' + columnIndex + ', rowIndex=' + rowIndex + ')')
	var hidden = document.getElementById('cell_' + columnIndex + '_' + rowIndex)
	removeBallColorClass(hidden)
	hidden.classList.add('ball0')
}

/**
 * ein Ball wird wieder angezeigt, nachdem er erhöht war.
 * verwendet die globalen Variablen donorIndex und donorRow.
 */
function reapearBall() {
	console.log('>>>>>> reapearBall() donorIndex=' + donorIndex)
	var color = gameState.tubes[donorIndex].cells[donorRow]

	var cellId = 'cell_' + donorIndex + '_' + donorRow
	console.log('cellId=' + cellId)
	var hidden = document.getElementById(cellId)
	hidden.classList.remove('ball0')

	var className = 'ball' + color
	hidden.classList.add(className)

	// globale Variablen
	donorIndex = null
	donorRow = null
}

/**
 * erhöhten Ball nicht mehr anzeigen
 * verwendet die globale Variable donorIndex
 */
function removeLiftedBall() {
	console.log('removeLiftedBall() donorIndex=' + donorIndex)
	var lifted = document.getElementById('lifted_' + donorIndex)
	removeBallColorClass(lifted)
	lifted.classList.add('ball0')
	console.log('lifted.classList' + JSON.stringify(lifted.classList))
}

function clickOnTube(clickedCol) {
	console.log('clicked column: ' + clickedCol)
	if (donorIndex == null) {
		if (!gameState.tubes[clickedCol].isEmpty()) {
			liftBall(clickedCol)
		}
	} else {
		if (gameState.isMoveAllowed(donorIndex, clickedCol)) {
			console.log('move from ' + donorIndex + ' to ' + clickedCol)
			var move = new Move(donorIndex, clickedCol)
			gameState.moveBallAndLog(move)
			normalMove(move)
			if (gameState.moveLog.length != 0) {
				var undoButton = document.getElementById('undoButton')
				undoButton.disabled = false
			}
			if(gameState.isSolved()) {
				alert('😀 Sie haben das Puzzle gelöst. 😀')
				newGame()
		        resetGameView()
			}
		} else {
			console.log('Wechsel!!!!')
			// Ball wieder runter
			dropBall(donorIndex)
			// dafür anderer Ball hoch
			liftBall(clickedCol)
		}
	}
}

function resetGameView() {
	var board = document.getElementById("board")
	var cellTemplate = document.getElementById("cellTemplate")
	var tubeTemplate = document.getElementById("tubeTemplate")
	var boardTemplate = document.getElementById("boardTemplate")
	//console.log('boardTemplate: ' + boardTemplate);
	//var cellTemplateImg = cellTemplate.content.querySelector('img');

	console.log('numberOfTubes: ' + gameState.numberOfTubes)
	boardClone = document.importNode(boardTemplate, true)
	var boardCloneTr = boardClone.content.querySelector('tr')
	for (var col = 0; col < gameState.numberOfTubes; col++) {
		var tubeClone = document.importNode(tubeTemplate, true)
		var tubeCloneTable = tubeClone.content.querySelector('tbody')
		var but = tubeClone.content.querySelector('table')
		but.id = 'but_' + col
		but.addEventListener('click', function() {
			var clickedCol = parseInt(this.id.split('_')[1])
			clickOnTube(clickedCol)
		})
		tubeCloneTable.id = 'tube_' + col
		var tube = gameState.tubes[col]
		//console.log('tube: ', tube)

		// leere Zelle über dem eigentlichen Spielfeld
		var cellClone = document.importNode(cellTemplate, true)
		var liftedBalla = cellClone.content.querySelector('.balla')
		liftedBalla.classList.add('ball0')
		liftedBalla.id = 'lifted_' + col
		tubeCloneTable.appendChild(cellClone.content)

		for (var row = (gameState.tubeHeight - 1); row >= 0; row--) {
			//img.svg....style=
			cellClone = document.importNode(cellTemplate, true)
			var balla = cellClone.content.querySelector('.balla')
			//console.log('balla: ', balla)
			className = 'ball' + tube.cells[row]
			//console.log('className: ', className)
			balla.classList.add(className)
			balla.id = 'cell_' + col + '_' + row
			//var child1 = tubeCloneTable.firstChild
			//tubeCloneTable.insertBefore(cellClone.content, child1)
			tubeCloneTable.appendChild(cellClone.content)
		}

		//console.log('append Tube')
		boardCloneTr.appendChild(tubeClone.content);
	}
	board.textContent = '';
	donorIndex = null
	board.appendChild(boardClone.content);

	var undoButton = document.getElementById('undoButton')
	undoButton.disabled = true
}

document.addEventListener('DOMContentLoaded', function() {
	console.log('document loaded')

	var startButton = document.getElementById('startButton')
	startButton.addEventListener('click', function() {
		newGame()
		resetGameView()
	})

	var resetButton = document.getElementById('resetButton')
	resetButton.addEventListener('click', function() {
		gameState = originalGameState.clone()
		resetGameView()
	})

	var undoButton = document.getElementById('undoButton')
	undoButton.addEventListener('click', function() {
		if (gameState.moveLog.length == 0) {
			alert('nicht möglich')
			return
		}
		var backwardMove = gameState.undoLastMove()
		undoMove(backwardMove)
		if (gameState.moveLog.length == 0) {
			undoButton.disabled = true
		}
	})

	var cheatButton = document.getElementById('cheatButton')
	cheatButton.addEventListener('click', function() {
		gameState.cheat()
		resetGameView()
	})

	var startForm = document.getElementById('startForm')
	startForm.addEventListener('submit', function(event) {
		console.log('form submit')
		// don't submit form and reload page
		event.preventDefault()
	})

	newGame()
	resetGameView()
})