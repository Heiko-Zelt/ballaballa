/**
 * model / state of the game
 */
 
class GameState {
  constructor(numberOfColors, numberOfExtraTubes, tubeHeight) {
    console.log('GameState.constructor(numberOfColors=' + numberOfColors + ', numberOfExtraTubes=' + numberOfExtraTubes + ', tubeHeight=' + tubeHeight +')')
    this.numberOfColors = numberOfColors
    this.numberOfExtraTubes = numberOfExtraTubes
    this.tubeHeight = tubeHeight
    this.numberOfTubes = this.numberOfColors + this.numberOfExtraTubes
    this.tubes = new Array(this.numberOfTubes)
    this.moveLog = []  
  }
  
  clone() {
    console.log('GameState.clone()')
    var miniMe = new GameState(this.numberOfColors, this.numberOfExtraTubes, this.tubeHeight)
    for(var i = 0; i < this.numberOfTubes; i++) {
      miniMe.tubes[i] = this.tubes[i].clone()
    }
    miniMe.moveLog = this.moveLog
    return miniMe
  }
  
  newGame() {
    console.log('GameState.newGame()')
    this.initTubes()
    this.randomizeBallsMany()
    //this.emptyExtraTubes()
    this.mixTubes()
  }
  
  /**
   * adds an extra tube,
   * which makes solving the puzzle much easier
   */
  cheat() {
    var n = new Tube(this.tubeHeight)
    n.fillWithOneColor(0)
    this.tubes.push(n)
    this.numberOfTubes++;
    this.numberOfExtraTubes++;
  }
  
  initTubes() {
    console.log('initTubes()')
    // gefüllte Röhren
    for(var i = 0; i < this.numberOfColors; i++) {
      // Roehre mit Index 0 hat Farbe 1, etc...
      var initialColor = i + 1
      console.log('initialColor: ' + initialColor)
      this.tubes[i] = new Tube(this.tubeHeight)
      this.tubes[i].fillWithOneColor(initialColor)
    }
    // leere Röhren
    for(var i = this.numberOfColors; i < this.numberOfTubes; i++) {
      // keine Farbe
      console.log('initialColor: 0')
      this.tubes[i] = new Tube(this.tubeHeight)
      this.tubes[i].fillWithOneColor(0)
    }
  }
  
  /**
   * vertauscht Röhren untereinander zufällig
   */
  mixTubes() {
    console.log('mixTubes()')
    for(var c = 0; c < this.numberOfTubes * 2; c++) {
      var i = this.randomInt(this.numberOfTubes)
      var j = this.randomInt(this.numberOfTubes)
      this.swapTubes(i, j)
    }  
  }
  
  /**
   * tauscht 2 Röhren
   */
  swapTubes(index1, index2) {
    var tmp = this.tubes[index1]
    this.tubes[index1] = this.tubes[index2]
    this.tubes[index2] = tmp
  }
  
  /**
   * plays Game backwards with only a few moves.
   * Warning! This leads to easy solvable puzzles.
   */
  randomizeBalls() {
    console.log('randomizeBalls()')
    
    /* Es ist egal, ob erst reverse Geber oder Nehmer ausgewählt wird.
     * Es besteht keine Abhängigkeit zur Ball-Farbe.
     * Ein unsinniger Zug geht immer, nämlich wenn Geber und Nehmer gleich sind.
     * Hin und her zwischen einer (oder mehreren) leeren Röhre und
     * einer (oder mehreren) Röhre mit oberstem Ball in gleicher Farbe geht endlos.
     */
    //while(true) {
    var maxMoves = this.numberOfTubes * this.tubeHeight
    var i
    for(i = 0; i < maxMoves; i++) { 
      var rdcs = this.reverseDonorCandidates()
      //console.log('rdcs.length=' + rdcs.length)
      if(rdcs.length <= 1) {
        break
      }
      var reverseDonor = this.selectOneRandomly(rdcs)
      var rrcs = this.reverseReceiverCandidates()
      var reverseReceiver = this.selectOneRandomly(rrcs)
      this.moveBall(reverseDonor, reverseReceiver)
    }
    console.log('reverse moves: ' + i)
  }
  
  /**
   * plays game backwards with many moves
   */
  randomizeBallsMany() {
    var maxMoves = this.numberOfTubes * this.tubeHeight
    var i;
    for(i = 0; i < maxMoves; i++) {
      var possibleMoves = this.allPossibleBackwardMoves()
      console.log('i: ' + i + ', possibleMoves: ' + JSON.stringify(possibleMoves))
      if(possibleMoves.length == 0) {
        break
      }
      var catMoves = this.categorizeBackwardMoves(possibleMoves)
      var move = this.selectMove(catMoves)
      this.moveBall(move)
    }
    console.log('finished with number of moves: ' + i)
  }
  
  /**
   * selects a good move if possible,
   * otherwise a bad move
   * (There must be at least one possible move)
   */
  selectMove(catMoves) {
    var goodMoves = catMoves[0]
    var badMoves = catMoves[1]
    console.log('goodMoves: ', JSON.stringify(goodMoves))
    console.log('badMoves: ', JSON.stringify(badMoves))
    var move = (goodMoves.length != 0)?this.selectOneRandomly(goodMoves):this.selectOneRandomly(badMoves)
    console.log('selected: ', JSON.stringify(move))
    return move
  } 
  
  /**
   * liefert eine Liste mit allen möglichen Zügen,
   * wenn das Spiel rückwärts gespielt wird.
   */
  allPossibleBackwardMoves() {
    var allMoves = []
    for(var from = 0; from < this.numberOfTubes; from++) {
      if(this.tubes[from].isReverseDonorCandidate()) {
        for(var to = 0; to < this.numberOfTubes; to++) {
          if(this.tubes[to].isReverseReceiverCandidate()) {
            if(from != to) {
              allMoves.push(new Move(from, to))
            }
          }
        }
      }
    }
    return allMoves
  }
  
  /**
   * Teilt alle Rückwärts-Züge in Kategorien ein
   */
  categorizeBackwardMoves(allMoves) {
    var goodMoves = []
    var badMoves = []
    allMoves.forEach(function(move) {
      if(this.isGoodBackwardMove(move)) {
        goodMoves.push(move)
      } else {
        badMoves.push(move)
      }
    }, this)
    return [goodMoves, badMoves]
  }
  
  /**
   * sehr einfaches Kriterium
   */
  isGoodBackwardMove(move) {
    //console.log('move: ' + JSON.stringify(move))
    return !this.tubes[move.to].isUnicolor()
  }
  
  /**
   * Vertauscht Bälle zufällig.
   * Warnung! Das kann zu unlösbaren Aufgaben führen.
   */
  randomizeBallsUnsolvable() {
    var numberOfMovements = this.numberOfTubes * this.tubeHeight * 8
    for(var c = 0; c < numberOfMovements; c++) {
      var donor = this.getNoneEmptyTubeIndex()
      var recipient = this.getNoneFullTubeIndex()
      var color = this.tubes[donor].removeBall()
      this.tubes[recipient].addBall(color)
    }
  }
  
  /**
   * liefert ein zufälliges Array Element
   */
  selectOneRandomly(a) {
    //console.log('selectOneRandomly from ' + JSON.stringify(a))
    var randomIndex = this.randomInt(a.length)
    //console.log('randomIndex=' + randomIndex)
    return a[randomIndex]
  }
  
  /**
   * liefert einen Array mit Röhren-Indexen, von denen gezogen werden darf,
   * wenn das Spiel rückwärts gespielt wird.
   */  
  reverseReceiverCandidates() {
    var a = []
    //console.log('this.numberOfTubes=' + this.numberOfTubes)
    for(var i = 0; i < this.numberOfTubes; i++) {
      //console.log('reverse receiver candidate?' + i)
      if(this.tubes[i].isReverseReceiverCandidate()) {
        a.push(i)
      }
    }
    //console.log('reverse receiver candidates = ' + JSON.stringify(a))
    return a
  }
  
  /**
   * liefert einen Array mit Röhren-Indexen, zu denen gezogen werden darf,
   * wenn das Spiel rückwärts gespielt wird.
   */
  reverseDonorCandidates() {
    var a = []
    //console.log('this.numberOfTubes=' + this.numberOfTubes)
    for(var i = 0; i < this.numberOfTubes; i++) {
      //console.log('reverse donor candidate?' + i)
      if(this.tubes[i].isReverseDonorCandidate()) {
        a.push(i)
      }
    }
    //console.log('reverse donor candidates = ' + JSON.stringify(a))
    return a
  }
  
  emptyExtraTubes() {
    // Todo
  }
  
  /*
  getNoneEmptyTubeIndex() {
    do {
      var i = this.randomTubeIndex()
    } while(this.tubes[i].isEmpty())
    return i
  }
  
  getNoneFullTubeIndex() {
    do {
      var i = this.randomTubeIndex()
    } while(this.tubes[i].isFull())
    return i  
  }
  
  randomTubeIndex() {
    return Math.floor(Math.random() * this.numberOfTubes)
  }
  */
  
  /**
   * liefert eine Ganzzahl zwischen 0 und (max - 1)
   */
  randomInt(max) {
    return Math.floor(Math.random() * max)
  }

  /**
   * moves a ball from one tube to another
   * (the tubes may be the same, but that doesn't make much sense)
   */  
  moveBall(move) {
	console.log('moveBall(' + JSON.stringify(move) + ')')
	var color = this.tubes[move.from].removeBall()
    this.tubes[move.to].addBall(color)
  }
  
  /**
   * moves a ball and logs for possible undo operation
   */
  moveBallAndLog(move) {
    // Es ist kein echter Spielzug,
    // wenn Quelle zu Ziel gleich sind. 
    if(move.to != move.from) {
      this.moveBall(move)
      this.moveLog.push(move)
      console.log('moveLog: ' + JSON.stringify(this.moveLog))
    }
  }
  
  /**
   * undoes last move, according to log
   */
  undoLastMove() {
    var forwardMove = this.moveLog.pop()
    var backwardMove = new Move(forwardMove.to, forwardMove.from)
    this.moveBall(backwardMove)
    return backwardMove
  }
  
  // kompliziertes Regelwerk
  isMoveAllowed(from, to) {
    // kann keinen Ball aus leerer Röhre nehmen
    if(this.tubes[from].isEmpty()) {
      return false
    }
    // sonst geht's immer, wenn Quelle und Ziel gleich sind 
    if(to == from) {
      return true
    }
    // Ziel-Tube ist voll
    if(this.tubes[to].isFull()) {
      return false
    }
    // oberster Ball hat selbe Farbe oder Ziel-Röhre ist leer
    if(this.isSameColor(from, to) || this.tubes[to].isEmpty()) {
      return true
    }
    return false 
  }
  
  /**
   * Testet, ob die beiden oberen Kugeln, die gleiche Farbe haben.
   */
  isSameColor(index1, index2) {
    var color1 = this.tubes[index1].colorOfHighestBall()
    var color2 = this.tubes[index2].colorOfHighestBall()
    return color1 == color2
  }

}

class Tube {
  constructor(tubeHeight) {
    this.tubeHeight = tubeHeight
    this.cells = new Array(tubeHeight)
  }
  
  fillWithOneColor(initialColor) {
    for(let i = 0; i < this.tubeHeight; i++) {
      /*
       * 0 bedeutet, das Feld ist leer
       * andere Zahlen sind Index im Farb-Array 
       */
      this.cells[i] = initialColor
    }
    this.fillLevel = initialColor == 0?0:this.tubeHeight  
  }
  
  clone() {
    var miniMe = new Tube(this.tubeHeight)
    for(let i = 0; i < this.tubeHeight; i++) {
      miniMe.cells[i] = this.cells[i]
    }
    miniMe.fillLevel = this.fillLevel
    return miniMe
  }
  
  isFull() {
    return this.fillLevel == this.tubeHeight
  }
  
  isEmpty() {
    return this.fillLevel == 0
  }
  
  /*
  isPartiallyFilled() {
    return (this.fillLevel != this.tubeHeight) && (this.fillLevel != 0) 
  }
  */
  
  addBall(color) {
    this.cells[this.fillLevel] = color
    this.fillLevel++
  }
  
  removeBall() {
    this.fillLevel--
    var color = this.cells[this.fillLevel]
    // 0 ist die Farbe für leere Zelle
    this.cells[this.fillLevel] = 0
    return color
  }
  
  colorOfHighestBall() {
    return this.cells[this.fillLevel - 1]
  }
  
  colorOfSecondHighestBall() {
    return this.cells[this.fillLevel - 2]
  }
  
  /**
    * Der Spielstand reflektiert den Stand nach dem Vorwärts-Spielzug.
    * Daher ist die Berechnung bei einem Rückwärts-Spielzug anders.
    */
  isReverseDonorCandidate() {
    // aus einer leeren Röhre kann kein Zug erfolgen
    if(this.isEmpty()) {
      return false
    }
    // vorwärts gedacht: auf den Boden der leeren Röhre kann immer gezogen werden
    if(this.fillLevel == 1) {
      return true
    }
    // vorwärts gedacht: Zug auf gleiche Farbe ist erlaubt
    if(this.colorOfHighestBall() == this.colorOfSecondHighestBall()) {
      return true
    }
    return false
  }
  
  /**
    * rückwärts gedacht: Es kann überall hingezogen werden,
    * außer die Röhre ist schon voll 
    */
  isReverseReceiverCandidate() {
    return !(this.isFull())
  }
  
  /**
   * Gibt wahr zurück, wenn mindestens 2 Kugeln in der Röhre sind
   * und alle die gleiche Farbe haben
   */
   isUnicolor() {
     //null oder nur eine Kugel zählt als falsch
     if(this.fillLevel <= 1) {
       return false
     }
     var color = this.cells[0]
     for(var i = 1; i < this.fillLevel; i++) {
       if(this.cells[i] != color) {
         return false
       }
     } 
     return true
   }
}

class Move {
  constructor(from, to) {
    this.from = from
    this.to = to
  }
}