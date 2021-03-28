/**
 * model 
 */
 
class GameState {
  constructor(numberOfColors, numberOfExtraTubes, tubeHeight) {
    console.log('GameState.constructor(numberOfColors=' + numberOfColors + ', numberOfExtraTubes=' + numberOfExtraTubes + ', tubeHeight=' + tubeHeight +')')
    this.numberOfColors = numberOfColors
    this.numberOfExtraTubes = numberOfExtraTubes
    this.tubeHeight = tubeHeight
    this.numberOfTubes = this.numberOfColors + this.numberOfExtraTubes
    this.tubes = new Array(this.numberOfTubes)  
  }
  
  clone() {
    console.log('GameState.clone()')
    var miniMe = new GameState(this.numberOfColors, this.numberOfExtraTubes, this.tubeHeight)
    for(var i = 0; i < this.numberOfTubes; i++) {
      miniMe.tubes[i] = this.tubes[i].clone()
    }
    return miniMe 
  }
  
  newGame() {
    console.log('GameState.newGame()')
    this.initTubes()
    this.randomizeBalls()
    //this.emptyExtraTubes()
    this.mixTubes()
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
    for(var c = 0; c < 30; c++) {
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
   * plays Game backwards
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
    
    /* Bullshit
    var numberOfMovements = this.numberOfTubes * this.tubeHeight * 8
    for(var c = 0; c < numberOfMovements; c++) {
      var donor = this.getNoneEmptyTubeIndex()
      var recipient = this.getNoneFullTubeIndex()
      var color = this.tubes[donor].removeBall()
      this.tubes[recipient].addBall(color)
    }
    */
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
  
  moveBall(donorIndex, receiverIndex) {
    console.log('moveBall from ' + donorIndex + ' to ' + receiverIndex)
    var color = this.tubes[donorIndex].removeBall()
    this.tubes[receiverIndex].addBall(color)
    return color
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
    if(this.isEmpty()) {
      return false
    }
    if(this.fillLevel == 1) {
      return true
    }
    if(this.colorOfHighestBall() == this.colorOfSecondHighestBall()) {
      return true
    }
    return false
  }
  
  isReverseReceiverCandidate() {
    return !(this.isFull())
  }
}