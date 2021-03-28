/**
 * View
 */

// Spielstand zu Anfang des Spieles
let originalGameState = null;
 
// aktueller Spielstand
let gameState = null;

// welche Spalte wurde zuerst geklickt
let donorIndex = null;

function newGame() {
  var numberOfColors =  parseInt(document.getElementById("numberOfColors").value)
  var numberOfExtraTubes =  parseInt(document.getElementById("numberOfExtraTubes").value)
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
 * from: Spalten Index Geber
 * to:   Spalten Index Empfaenger
 */
function move(from, to) {
  // Ball oben nicht mehr anzeigen
  var lifted = document.getElementById('lifted_' + from)
  var className = 'ball' + gameState.tubes[from].colorOfHighestBall()
  lifted.classList.remove(className)
  lifted.classList.add('ball0')
	    
  //console.log('move from ' + from + ' to ' + to)

  var donorCellId = 'cell_' + from + '_' + (gameState.tubes[from].fillLevel - 1)
  color = gameState.moveBall(from, to)
  var receiverCellId = 'cell_' + to + '_' + (gameState.tubes[to].fillLevel - 1)

  /*
  schwebt doch eh schon	        
  var donorElement = document.getElementById(donorCellId)
  donorElement.classList.remove('ball' + color)
  donorElement.classList.add('ball0')
  */
          
  // Ball einlochen
  var receiverElement = document.getElementById(receiverCellId)
  receiverElement.classList.remove('ball0')
  receiverElement.classList.add('ball' + color)
  
  // globale Variable
  donorIndex = null
}

function lift(from) {
  // Ball oben anzeigen
  var lifted = document.getElementById('lifted_' + from)
  var className = 'ball' + gameState.tubes[from].colorOfHighestBall()
  console.log('className=' + className)
  lifted.classList.remove('ball0')
  lifted.classList.add(className)
	      
  // Ball unten nicht mehr anzeigen
  var hidden = document.getElementById('cell_' + from + '_' + (gameState.tubes[from].fillLevel - 1))
  hidden.classList.remove(className)
  hidden.classList.add('ball0')
  
  // globale Variable
  donorIndex = from
}

function drop(from) {
  // Ball oben nicht mehr anzeigen
  var lifted = document.getElementById('lifted_' + from)
  var className = 'ball' + gameState.tubes[from].colorOfHighestBall()
  console.log('className=' + className)
  lifted.classList.remove(className)
  lifted.classList.add('ball0')
	      
  // Ball unten wieder anzeigen
  var hidden = document.getElementById('cell_' + from + '_' + (gameState.tubes[from].fillLevel - 1))
  hidden.classList.remove('ball0')
  hidden.classList.add(className)
  
  // globale Variable
  donorIndex = null
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
  for(var col = 0; col < gameState.numberOfTubes; col++) {
	var tubeClone = document.importNode(tubeTemplate, true)
    var tubeCloneTable = tubeClone.content.querySelector('tbody')
	var but = tubeClone.content.querySelector('table')
	but.id = 'but_' + col
	but.addEventListener('click', function() {
	  var clickedCol = parseInt(this.id.split('_')[1])
	  //console.log('clicked column: ' + clickedCol)
	  if(donorIndex == null) {
	    if(!gameState.tubes[clickedCol].isEmpty()) {
          lift(clickedCol)
	    }
	  } else {
	    if(gameState.isMoveAllowed(donorIndex, clickedCol)) {
	      move(donorIndex, clickedCol)
        } else {
          // Ball wieder runter
          drop(donorIndex)
          // dafür anderer Ball hoch
          lift(clickedCol)
        }
	  }
	})
	tubeCloneTable.id = "tube_" + col
	var tube = gameState.tubes[col]
	//console.log('tube: ', tube)
	
    // leere Zelle über dem eigentlichen Spielfeld
    var cellClone = document.importNode(cellTemplate, true)
    var liftedBalla = cellClone.content.querySelector('.balla')
    liftedBalla.classList.add('ball0')
    liftedBalla.id = "lifted_" + col 
    tubeCloneTable.appendChild(cellClone.content)	
	
	for(var row = (gameState.tubeHeight - 1); row >= 0; row--) {
	  //img.svg....style=
	  cellClone = document.importNode(cellTemplate, true)
	  var balla = cellClone.content.querySelector('.balla')
	  //console.log('balla: ', balla)
	  className = 'ball' + tube.cells[row]
	  //console.log('className: ', className)
	  balla.classList.add(className)
	  balla.id = "cell_" + col + "_" + row 
	  //var child1 = tubeCloneTable.firstChild
	  //tubeCloneTable.insertBefore(cellClone.content, child1)
	  tubeCloneTable.appendChild(cellClone.content)
    }
    
	//console.log("append Tube")
	boardCloneTr.appendChild(tubeClone.content);
  }
  board.textContent = '';
  donorIndex = null
  board.appendChild(boardClone.content);
}

document.addEventListener("DOMContentLoaded", function() {
  console.log("document loaded")
	
  let startButton = document.getElementById("startButton")
  startButton.addEventListener('click', function() {
    newGame()
    resetGameView()
  })
  
  let resetButton = document.getElementById("resetButton")
  resetButton.addEventListener('click', function() {
    gameState = originalGameState.clone()
    resetGameView()
  })
  
  let cheatButton = document.getElementById("cheatButton")
  cheatButton.addEventListener('click', function() {
    gameState.cheat()
    resetGameView()
  })
  
  let startForm = document.getElementById("startForm")
  startForm.addEventListener('submit', function(event) {
    console.log("form submit")
    // don't submit form and reload page
    event.preventDefault()
  })
  
  newGame()
  resetGameView()
})