/**
 * model / state of the game
 */
 
class GameState {
  constructor(numberOfColors, numberOfExtraTubes, tubeHeight) {
    console.debug('GameState.constructor(numberOfColors=' + numberOfColors + ', numberOfExtraTubes=' + numberOfExtraTubes + ', tubeHeight=' + tubeHeight +')');
    this.numberOfColors = numberOfColors;
    this.numberOfExtraTubes = numberOfExtraTubes;
    this.tubeHeight = tubeHeight;
    this.numberOfTubes = this.numberOfColors + this.numberOfExtraTubes;
    this.tubes = new Array(this.numberOfTubes);
    this.moveLog = [];
  }
  
  clone() {
    console.debug('GameState.clone()');
    var miniMe = new GameState(this.numberOfColors, this.numberOfExtraTubes, this.tubeHeight);
    for(var i = 0; i < this.numberOfTubes; i++) {
      miniMe.tubes[i] = this.tubes[i].clone();
    }
    miniMe.moveLog = this.moveLog;
    return miniMe;
  }
  
  newGame() {
    console.debug('GameState.newGame()');
    this.initTubes();
    this.randomizeBallsMany();
    //this.emptyExtraTubes()
    this.mixTubes();
  }
  
  /**
   * adds an extra tube,
   * which makes solving the puzzle much easier
   */
  cheat() {
    var n = new Tube(this.tubeHeight);
    n.fillWithOneColor(0);
    this.tubes.push(n);
    this.numberOfTubes++;
    this.numberOfExtraTubes++;
  }

  /**
    * liefert true, wenn das Spiel beendet / das Puzzle gelöst ist,
    * also jede Röhren entweder leer oder gelöst ist.
    */
  isSolved() {
	for(var i = 0; i < this.numberOfTubes; i++) {
      //console.debug('i=' + i);
	  if(!(this.tubes[i].isEmpty() || this.tubes[i].isSolved())) {
		//console.debug('tube ' + i + ' is not empty or solved');
        return false;
      }
      //console.debug('tube ' + i + ' is not solved');
	}
	//console.debug('puzzle is solved');
	return true;
  }
  
  initTubes() {
    console.debug('initTubes()');
    // gefüllte Röhren
    for(var i = 0; i < this.numberOfColors; i++) {
      // Roehre mit Index 0 hat Farbe 1, etc...
      var initialColor = i + 1;
      //console.debug('initialColor: ' + initialColor)
      this.tubes[i] = new Tube(this.tubeHeight);
      this.tubes[i].fillWithOneColor(initialColor);
    }
    // leere Röhren
    for(var i = this.numberOfColors; i < this.numberOfTubes; i++) {
      // keine Farbe
      //console.debug('initialColor: 0')
      this.tubes[i] = new Tube(this.tubeHeight);
      this.tubes[i].fillWithOneColor(0);
    }
  }
  
  /**
   * vertauscht Röhren untereinander zufällig
   */
  mixTubes() {
    console.debug('mixTubes()')
    for(var c = 0; c < this.numberOfTubes * 3; c++) {
      var i = this.randomInt(this.numberOfTubes);
      var j = this.randomInt(this.numberOfTubes);
      this.swapTubes(i, j);
    }  
  }
  
  /**
   * tauscht 2 Röhren
   */
  swapTubes(index1, index2) {
    var tmp = this.tubes[index1];
    this.tubes[index1] = this.tubes[index2];
    this.tubes[index2] = tmp;
  }
  
  /**
   * plays Game backwards with only a few moves.
   * Warning! This leads to easy solvable puzzles.
   */
  randomizeBalls() {
    //console.debug('randomizeBalls()');
    
    /* Es ist egal, ob erst reverse Geber oder Nehmer ausgewählt wird.
     * Es besteht keine Abhängigkeit zur Ball-Farbe.
     * Ein unsinniger Zug geht immer, nämlich wenn Geber und Nehmer gleich sind.
     * Hin und her zwischen einer (oder mehreren) leeren Röhre und
     * einer (oder mehreren) Röhre mit oberstem Ball in gleicher Farbe geht endlos.
     */
    //while(true) {
    var maxMoves = this.numberOfTubes * this.tubeHeight;
    var i;
    for(i = 0; i < maxMoves; i++) { 
      var rdcs = this.reverseDonorCandidates();
      //console.debug('rdcs.length=' + rdcs.length)
      if(rdcs.length <= 1) {
        break;
      }
      var reverseDonor = this.selectOneRandomly(rdcs);
      var rrcs = this.reverseReceiverCandidates();
      var reverseReceiver = this.selectOneRandomly(rrcs);
      this.moveBall(reverseDonor, reverseReceiver);
    }
    console.debug('reverse moves: ' + i);
  }
  
  /**
   * plays game backwards with many moves
   */
  randomizeBallsMany() {
	var lastMove = null;
    var maxMoves = this.numberOfTubes * this.tubeHeight * 3;
    var i;
    for(i = 0; i < maxMoves; i++) {
      var possibleMoves = this.allPossibleBackwardMoves(lastMove);
      //console.debug('i: ' + i + ', possibleMoves: ' + JSON.stringify(possibleMoves));
      if(possibleMoves.length == 0) {
        break;
      }
      var lottery = this.lottery(possibleMoves);
      if(lottery.length == 0) {
        break;
      }
      //console.debug('i: ' + i + ', lottery: ' + JSON.stringify(lottery))
      var move = this.selectOneRandomly(lottery);
      //console.debug('selected move ' + JSON.stringify(move));
      this.moveBall(move);
      lastMove = move;
    }
    //console.debug('randomize finished with number of backward moves: ' + i);
  }
  
  /**
   * liefert eine Liste mit allen möglichen Zügen,
   * wenn das Spiel rückwärts gespielt wird.
   * ausgenommen ist der letzte Zug rückwärts (hin und her macht wenig Sinn)
   */
  allPossibleBackwardMoves(lastMove) {
    var allMoves = [];
    for(var from = 0; from < this.numberOfTubes; from++) {
      if(this.tubes[from].isReverseDonorCandidate()) {
        for(var to = 0; to < this.numberOfTubes; to++) {
          if(this.tubes[to].isReverseReceiverCandidate()) {
            if(from != to) {
	          var move = new Move(from, to);
              if(!move.backwards().isEqual(lastMove)) {
                allMoves.push(move);
              }
            }
          }
        }
      }
    }
    return allMoves
  }

  multiPush(array, element, number) {
	for(var i = 0; i < number; i++) {
		array.push(element);
	}
  }
  
  /**
   * Bewertet alle Rückwärts-Züge und gibt entsprechende Anzahl Lose in die Urne.
   */
  lottery(allMoves) {
	var lots = [];
	for(var i = 0; i < allMoves.length; i++) {
	  var move = allMoves[i];
      var rate = this.rateBackwardMove(move);
      //console.debug('rate: ' + rate);
      this.multiPush(lots, move, rate);
    }
    return lots;
  }
  
  /**
   * Bewertet einen Rückwärts-Zug
   * returns: niedrige Zahl: schlecht, hoche Zahl: gut
   * Kategorie a: Zug auf einfarbige Säule anderer Farbe (weitere Unterteilung nach Höhe der Säule)
   * Kategorie b: Zug auf andersfarbigen Ball, der darunter keinen gleichfarbigen Ball hat
   * Kategorie c: Zug in leere Röhre
   * Kategorie d: Zug auf gleichfarbigen Ball
   * todo: Kategorie e: Zug mit andersfarbigem Ball, auf einen Ball der darunter einen gleichfarbigen hat,
   *   aber nicht alle in der Ziel-Röhre gleichfarbig sind (kompliziert)
   */
  rateBackwardMove(move) {
    //console.debug('move ' + JSON.stringify(move));

    // Zug in leere Röhre
	if(this.tubes[move.to].isEmpty()) {
	  //console.debug('Zug in leere Röhre');
      return 50;
    }

    // Zug auf gleichfarbigen Ball
    var ballColor = this.tubes[move.from].colorOfHighestBall();
    var targetColor = this.tubes[move.to].colorOfHighestBall();
    // console.debug('ballColor ' + ballColor + '== targetColor ' + targetColor + '?');
    if(targetColor == ballColor) {
      //console.debug('Zug auf gleichfarbigen Ball');
      return 50
    }

    // Zug auf einfarbige Säule anderer Farbe (weitere Unterteilung nach Höhe der Säule)
    var n = this.tubes[move.to].unicolor();
    //console.debug('unicolor: ' + n);
    if(n > 1) {
	  var points = this.tubeHeight - n - 1;
	  //console.debug('Zug auf einfarbige Säule anderer Farbe :-( Punkte: ' + points);
      return points;
    }

    // Zug auf andersfarbigen Ball, der darunter keinen gleichfarbigen Ball hat
    //console.debug('Zug auf andersfarbigen Ball, der darunter keinen gleichfarbigen Ball hat');
    return 40;
  }


  /**
   * sehr einfaches Kriterium
   */
  isGoodBackwardMove(move) {
    //console.debug('move: ' + JSON.stringify(move))
    return !this.tubes[move.to].isUnicolor();
  }
  
  /**
   * Vertauscht Bälle zufällig.
   * Warnung! Das kann zu unlösbaren Aufgaben führen.
   */
  randomizeBallsUnsolvable() {
    var numberOfMovements = this.numberOfTubes * this.tubeHeight * 8;
    for(var c = 0; c < numberOfMovements; c++) {
      var donor = this.getNoneEmptyTubeIndex();
      var recipient = this.getNoneFullTubeIndex();
      var color = this.tubes[donor].removeBall();
      this.tubes[recipient].addBall(color);
    }
  }
  
  /**
   * liefert ein zufälliges Array Element
   */
  selectOneRandomly(a) {
    //console.debug('selectOneRandomly from ' + JSON.stringify(a))
    var randomIndex = this.randomInt(a.length);
    //console.debug('randomIndex=' + randomIndex)
    return a[randomIndex];
  }
  
  /**
   * liefert einen Array mit Röhren-Indexen, von denen gezogen werden darf,
   * wenn das Spiel rückwärts gespielt wird.
   */  
  reverseReceiverCandidates() {
    var a = [];
    //console.debug('this.numberOfTubes=' + this.numberOfTubes)
    for(var i = 0; i < this.numberOfTubes; i++) {
      //console.debug('reverse receiver candidate?' + i)
      if(this.tubes[i].isReverseReceiverCandidate()) {
        a.push(i);
      }
    }
    //console.debug('reverse receiver candidates = ' + JSON.stringify(a))
    return a;
  }
  
  /**
   * liefert einen Array mit Röhren-Indexen, zu denen gezogen werden darf,
   * wenn das Spiel rückwärts gespielt wird.
   */
  reverseDonorCandidates() {
    var a = [];
    //console.debug('this.numberOfTubes=' + this.numberOfTubes)
    for(var i = 0; i < this.numberOfTubes; i++) {
      //console.debug('reverse donor candidate?' + i)
      if(this.tubes[i].isReverseDonorCandidate()) {
        a.push(i);
      }
    }
    //console.debug('reverse donor candidates = ' + JSON.stringify(a))
    return a;
  }
  
  emptyExtraTubes() {
    // Todo
  }
  
  /**
   * liefert eine Ganzzahl zwischen 0 und (max - 1)
   */
  randomInt(max) {
    return Math.floor(Math.random() * max);
  }

  /**
   * moves a ball from one tube to another
   * (the tubes may be the same, but that doesn't make much sense)
   */  
  moveBall(move) {
	//console.debug('moveBall(' + JSON.stringify(move) + ')');
	var color = this.tubes[move.from].removeBall();
    this.tubes[move.to].addBall(color);
  }
  
  /**
   * moves a ball and logs for possible undo operation
   */
  moveBallAndLog(move) {
    // Es ist kein echter Spielzug,
    // wenn Quelle zu Ziel gleich sind. 
    if(move.to != move.from) {
      this.moveBall(move);
      this.moveLog.push(move);
      //console.debug('moveLog: ' + JSON.stringify(this.moveLog));
    }
  }
  
  /**
   * undoes last move, according to log
   */
  undoLastMove() {
    var forwardMove = this.moveLog.pop();
    var backwardMove = forwardMove.backwards();
    this.moveBall(backwardMove);
    return backwardMove;
  }
  
  // kompliziertes Regelwerk
  isMoveAllowed(from, to) {
    // kann keinen Ball aus leerer Röhre nehmen
    if(this.tubes[from].isEmpty()) {
      return false;
    }
    // sonst geht's immer, wenn Quelle und Ziel gleich sind 
    if(to == from) {
      return true;
    }
    // Ziel-Tube ist voll
    if(this.tubes[to].isFull()) {
      return false;
    }
    // oberster Ball hat selbe Farbe oder Ziel-Röhre ist leer
    if(this.isSameColor(from, to) || this.tubes[to].isEmpty()) {
      return true;
    }
    return false; 
  }
  
  /**
   * Testet, ob die beiden oberen Kugeln, die gleiche Farbe haben.
   */
  isSameColor(index1, index2) {
    var color1 = this.tubes[index1].colorOfHighestBall();
    var color2 = this.tubes[index2].colorOfHighestBall();
    return color1 == color2;
  }

}

class Tube {
  constructor(tubeHeight) {
    this.tubeHeight = tubeHeight;
    this.cells = new Array(tubeHeight);
  }
  
  fillWithOneColor(initialColor) {
    for(let i = 0; i < this.tubeHeight; i++) {
      /*
       * 0 bedeutet, das Feld ist leer
       * andere Zahlen sind Index im Farb-Array 
       */
      this.cells[i] = initialColor;
    }
    this.fillLevel = initialColor == 0?0:this.tubeHeight;  
  }
  
  clone() {
    var miniMe = new Tube(this.tubeHeight);
    for(let i = 0; i < this.tubeHeight; i++) {
      miniMe.cells[i] = this.cells[i];
    }
    miniMe.fillLevel = this.fillLevel;
    return miniMe;
  }
  
  isFull() {
    return this.fillLevel == this.tubeHeight;
  }
  
  isEmpty() {
    return this.fillLevel == 0;
  }
  
  addBall(color) {
	if(this.isFull()) {
		throw 'tube is already full';
	}
    this.cells[this.fillLevel] = color;
    this.fillLevel++;
  }
  
  removeBall() {
	if(this.isEmpty()) {
		throw 'tube is already empty';
	}
    this.fillLevel--;
    var color = this.cells[this.fillLevel];
    // 0 ist die Farbe für leere Zelle
    this.cells[this.fillLevel] = 0;
    return color;
  }
  
  colorOfHighestBall() {
	var color = this.cells[this.fillLevel - 1];
	//console.debug('fillLevel: ' + this.fillLevel + ', color of highest ball:' + color)
    return color;
  }
  
  colorOfSecondHighestBall() {
    return this.cells[this.fillLevel - 2];
  }
  
  /**
    * Der Spielstand reflektiert den Stand nach dem Vorwärts-Spielzug.
    * Daher ist die Berechnung bei einem Rückwärts-Spielzug anders.
    */
  isReverseDonorCandidate() {
    // aus einer leeren Röhre kann kein Zug erfolgen
    if(this.isEmpty()) {
      return false;
    }
    // vorwärts gedacht: auf den Boden der leeren Röhre kann immer gezogen werden
    if(this.fillLevel == 1) {
      return true;
    }
    // vorwärts gedacht: Zug auf gleiche Farbe ist erlaubt
    if(this.colorOfHighestBall() == this.colorOfSecondHighestBall()) {
      return true;
    }
    return false;
  }
  
  /**
    * rückwärts gedacht: Es kann überall hingezogen werden,
    * außer die Röhre ist schon voll 
    */
  isReverseReceiverCandidate() {
    return !(this.isFull());
  }
  
  /**
   * Gibt Anzhal der Bälle zurück, wenn alle die gleiche Farbe haben.
   * Gibt null zurück, wenn Röhre leer ist oder die Bälle unterschiedliche Farbe haben.
   * Gibt 1 zurück, wenn nur ein Ball in der Röhre ist.
   */
   unicolor() {
     if(this.isEmpty()) {
	   //console.debug('unicolor: Sonderfall leer')
       return 0;
     }
     if(this.fillLevel == 1) {
	   //console.debug('unicolor: Sonderfall 1')
	   return 1;
     }
     var color = this.cells[0];
     var i;
     for(i = 1; i < this.fillLevel; i++) {
       if(this.cells[i] != color) {
	     //console.debug('unicolor: unterschiedlich')
         return 0;
       }
     }
     //console.debug('unicolor: i=' + i)
     return i;
   }

  /**
   * liefert wahr, wenn die Röhre gelöst ist,
   * also die Röhre voll ist und alle Bälle die gleiche Farbe haben.
   */
  isSolved() {
	if(!this.isFull()) {
		return false;
	}
	var color = this.cells[0]
	for(var i = 1; i < this.tubeHeight; i++) {
	  if(this.cells[i] != color) {
		return false;
	  }
      return true;
	}
  }
}

class Move {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }

  backwards() {
	var retro = new Move(this.to, this.from);
	return retro;
  }

  isEqual(otherMove) {
	if(otherMove == null) {
	  return false;
	}
	return (this.from == otherMove.from) && (this.to == otherMove.to);   
  }
 }