export class GameState {
    constructor(_numberOfColors, _numberOfExtraTubes, _tubeHeight) {
        this._numberOfColors = _numberOfColors;
        this._numberOfExtraTubes = _numberOfExtraTubes;
        this._tubeHeight = _tubeHeight;
        console.debug('GameState.constructor(numberOfColors=' + _numberOfColors + ', numberOfExtraTubes=' + _numberOfExtraTubes + ', tubeHeight=' + _tubeHeight + ')');
        this._numberOfTubes = _numberOfColors + this._numberOfExtraTubes;
        this._tubes = new Array(this._numberOfTubes);
        this._moveLog = [];
    }
    get numberOfColors() {
        return this._numberOfColors;
    }
    get numberOfExtraTubes() {
        return this._numberOfExtraTubes;
    }
    get tubeHeight() {
        return this._tubeHeight;
    }
    get numberOfTubes() {
        return this._numberOfTubes;
    }
    get tubes() {
        return this._tubes;
    }
    get moveLog() {
        return this._moveLog;
    }
    getColorAt(col, row) {
        return this._tubes[col].getColorAt(row);
    }
    clone() {
        console.debug('GameState.clone()');
        var miniMe = new GameState(this._numberOfColors, this._numberOfExtraTubes, this._tubeHeight);
        for (var i = 0; i < this._numberOfTubes; i++) {
            miniMe._tubes[i] = this._tubes[i].clone();
        }
        miniMe._moveLog = this._moveLog;
        return miniMe;
    }
    newGame() {
        console.debug('GameState.newGame()');
        this.initTubes();
        this.randomizeBallsMany();
        this.mixTubes();
    }
    cheat() {
        var n = new Tube(this._tubeHeight);
        n.fillWithOneColor(0);
        this._tubes.push(n);
        this._numberOfTubes++;
        this._numberOfExtraTubes++;
    }
    isSolved() {
        for (var i = 0; i < this._numberOfTubes; i++) {
            if (!(this._tubes[i].isEmpty() || this._tubes[i].isSolved())) {
                return false;
            }
        }
        return true;
    }
    initTubes() {
        console.debug('initTubes()');
        for (var i = 0; i < this._numberOfColors; i++) {
            var initialColor = i + 1;
            this._tubes[i] = new Tube(this._tubeHeight);
            this._tubes[i].fillWithOneColor(initialColor);
        }
        for (var i = this._numberOfColors; i < this._numberOfTubes; i++) {
            this._tubes[i] = new Tube(this._tubeHeight);
            this._tubes[i].fillWithOneColor(0);
        }
    }
    mixTubes() {
        console.debug('mixTubes()');
        for (var c = 0; c < this._numberOfTubes * 3; c++) {
            var i = this.randomInt(this._numberOfTubes);
            var j = this.randomInt(this._numberOfTubes);
            this.swapTubes(i, j);
        }
    }
    swapTubes(index1, index2) {
        var tmp = this._tubes[index1];
        this._tubes[index1] = this._tubes[index2];
        this._tubes[index2] = tmp;
    }
    randomizeBalls() {
        var maxMoves = this._numberOfTubes * this._tubeHeight;
        var i;
        for (i = 0; i < maxMoves; i++) {
            var rdcs = this.reverseDonorCandidates();
            if (rdcs.length <= 1) {
                break;
            }
            var reverseDonor = this.selectOneRandomly(rdcs);
            var rrcs = this.reverseReceiverCandidates();
            var reverseReceiver = this.selectOneRandomly(rrcs);
            this.moveBall(new Move(reverseDonor, reverseReceiver));
        }
        console.debug('reverse moves: ' + i);
    }
    randomizeBallsMany() {
        var lastMove = null;
        var maxMoves = this._numberOfTubes * this._tubeHeight * 3;
        var i;
        for (i = 0; i < maxMoves; i++) {
            var possibleMoves = this.allPossibleBackwardMoves(lastMove);
            if (possibleMoves.length == 0) {
                break;
            }
            var lottery = this.lottery(possibleMoves);
            if (lottery.length == 0) {
                break;
            }
            var move = this.selectOneRandomly(lottery);
            this.moveBall(move);
            lastMove = move;
        }
    }
    allPossibleBackwardMoves(lastMove) {
        var allMoves = [];
        for (var from = 0; from < this._numberOfTubes; from++) {
            if (this._tubes[from].isReverseDonorCandidate()) {
                for (var to = 0; to < this._numberOfTubes; to++) {
                    if (this._tubes[to].isReverseReceiverCandidate()) {
                        if (from != to) {
                            var move = new Move(from, to);
                            if (!move.backwards().isEqual(lastMove)) {
                                allMoves.push(move);
                            }
                        }
                    }
                }
            }
        }
        return allMoves;
    }
    multiPush(array, element, number) {
        for (var i = 0; i < number; i++) {
            array.push(element);
        }
    }
    lottery(allMoves) {
        var lots = [];
        for (var i = 0; i < allMoves.length; i++) {
            var move = allMoves[i];
            var rate = this.rateBackwardMove(move);
            this.multiPush(lots, move, rate);
        }
        return lots;
    }
    rateBackwardMove(move) {
        if (this._tubes[move.to].isEmpty()) {
            return 50;
        }
        var ballColor = this._tubes[move.from].colorOfHighestBall();
        var targetColor = this._tubes[move.to].colorOfHighestBall();
        if (targetColor == ballColor) {
            return 50;
        }
        var n = this._tubes[move.to].unicolor();
        if (n > 1) {
            var points = this._tubeHeight - n - 1;
            return points;
        }
        return 40;
    }
    selectOneRandomly(a) {
        var randomIndex = this.randomInt(a.length);
        return a[randomIndex];
    }
    reverseReceiverCandidates() {
        var a = [];
        for (var i = 0; i < this._numberOfTubes; i++) {
            if (this._tubes[i].isReverseReceiverCandidate()) {
                a.push(i);
            }
        }
        return a;
    }
    reverseDonorCandidates() {
        var a = [];
        for (var i = 0; i < this._numberOfTubes; i++) {
            if (this._tubes[i].isReverseDonorCandidate()) {
                a.push(i);
            }
        }
        return a;
    }
    emptyExtraTubes() {
    }
    randomInt(max) {
        return Math.floor(Math.random() * max);
    }
    moveBall(move) {
        var color = this._tubes[move.from].removeBall();
        this._tubes[move.to].addBall(color);
    }
    moveBallAndLog(move) {
        if (move.to != move.from) {
            this.moveBall(move);
            this._moveLog.push(move);
        }
    }
    undoLastMove() {
        var forwardMove = this._moveLog.pop();
        if (forwardMove == undefined) {
            throw new Error("No move in move log to be undone!");
        }
        var backwardMove = forwardMove.backwards();
        this.moveBall(backwardMove);
        return backwardMove;
    }
    isMoveAllowed(from, to) {
        if (this._tubes[from].isEmpty()) {
            return false;
        }
        if (to == from) {
            return true;
        }
        if (this._tubes[to].isFull()) {
            return false;
        }
        if (this.isSameColor(from, to) || this._tubes[to].isEmpty()) {
            return true;
        }
        return false;
    }
    isSameColor(index1, index2) {
        var color1 = this._tubes[index1].colorOfHighestBall();
        var color2 = this._tubes[index2].colorOfHighestBall();
        return color1 == color2;
    }
}
export class Tube {
    constructor(_tubeHeight) {
        this._tubeHeight = _tubeHeight;
        this._cells = new Array(_tubeHeight);
        this._fillLevel = 0;
    }
    get fillLevel() {
        return this._fillLevel;
    }
    getColorAt(row) {
        return this._cells[row];
    }
    fillWithOneColor(initialColor) {
        for (let i = 0; i < this._tubeHeight; i++) {
            this._cells[i] = initialColor;
        }
        this._fillLevel = initialColor == 0 ? 0 : this._tubeHeight;
    }
    clone() {
        var miniMe = new Tube(this._tubeHeight);
        for (let i = 0; i < this._tubeHeight; i++) {
            miniMe._cells[i] = this._cells[i];
        }
        miniMe._fillLevel = this._fillLevel;
        return miniMe;
    }
    isFull() {
        return this._fillLevel == this._tubeHeight;
    }
    isEmpty() {
        return this._fillLevel == 0;
    }
    addBall(color) {
        if (this.isFull()) {
            throw 'tube is already full';
        }
        this._cells[this._fillLevel] = color;
        this._fillLevel++;
    }
    removeBall() {
        if (this.isEmpty()) {
            throw 'tube is already empty';
        }
        this._fillLevel--;
        var color = this._cells[this._fillLevel];
        this._cells[this._fillLevel] = 0;
        return color;
    }
    colorOfHighestBall() {
        var color = this._cells[this._fillLevel - 1];
        return color;
    }
    colorOfSecondHighestBall() {
        return this._cells[this._fillLevel - 2];
    }
    isReverseDonorCandidate() {
        if (this.isEmpty()) {
            return false;
        }
        if (this._fillLevel == 1) {
            return true;
        }
        if (this.colorOfHighestBall() == this.colorOfSecondHighestBall()) {
            return true;
        }
        return false;
    }
    isReverseReceiverCandidate() {
        return !(this.isFull());
    }
    unicolor() {
        if (this.isEmpty()) {
            return 0;
        }
        if (this._fillLevel == 1) {
            return 1;
        }
        var color = this._cells[0];
        var i;
        for (i = 1; i < this._fillLevel; i++) {
            if (this._cells[i] != color) {
                return 0;
            }
        }
        return i;
    }
    isSolved() {
        if (!this.isFull()) {
            return false;
        }
        var color = this._cells[0];
        for (var i = 1; i < this._tubeHeight; i++) {
            if (this._cells[i] != color) {
                return false;
            }
        }
        return true;
    }
}
export class Move {
    constructor(_from, _to) {
        this._from = _from;
        this._to = _to;
    }
    get from() {
        return this._from;
    }
    get to() {
        return this._to;
    }
    backwards() {
        var retro = new Move(this._to, this._from);
        return retro;
    }
    isEqual(otherMove) {
        if (otherMove == null) {
            return false;
        }
        return (this._from == otherMove._from) && (this._to == otherMove._to);
    }
}
