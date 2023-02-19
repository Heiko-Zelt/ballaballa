"use strict";
var GameState = (function () {
    function GameState(numberOfColors, numberOfExtraTubes, tubeHeight) {
        console.debug('GameState.constructor(numberOfColors=' + numberOfColors + ', numberOfExtraTubes=' + numberOfExtraTubes + ', tubeHeight=' + tubeHeight + ')');
        this.numberOfColors = numberOfColors;
        this.numberOfExtraTubes = numberOfExtraTubes;
        this.tubeHeight = tubeHeight;
        this.numberOfTubes = this.numberOfColors + this.numberOfExtraTubes;
        this.tubes = new Array(this.numberOfTubes);
        this.moveLog = [];
    }
    GameState.prototype.clone = function () {
        console.debug('GameState.clone()');
        var miniMe = new GameState(this.numberOfColors, this.numberOfExtraTubes, this.tubeHeight);
        for (var i = 0; i < this.numberOfTubes; i++) {
            miniMe.tubes[i] = this.tubes[i].clone();
        }
        miniMe.moveLog = this.moveLog;
        return miniMe;
    };
    GameState.prototype.newGame = function () {
        console.debug('GameState.newGame()');
        this.initTubes();
        this.randomizeBallsMany();
        this.mixTubes();
    };
    GameState.prototype.cheat = function () {
        var n = new Tube(this.tubeHeight);
        n.fillWithOneColor(0);
        this.tubes.push(n);
        this.numberOfTubes++;
        this.numberOfExtraTubes++;
    };
    GameState.prototype.isSolved = function () {
        for (var i = 0; i < this.numberOfTubes; i++) {
            if (!(this.tubes[i].isEmpty() || this.tubes[i].isSolved())) {
                return false;
            }
        }
        return true;
    };
    GameState.prototype.initTubes = function () {
        console.debug('initTubes()');
        for (var i = 0; i < this.numberOfColors; i++) {
            var initialColor = i + 1;
            this.tubes[i] = new Tube(this.tubeHeight);
            this.tubes[i].fillWithOneColor(initialColor);
        }
        for (var i = this.numberOfColors; i < this.numberOfTubes; i++) {
            this.tubes[i] = new Tube(this.tubeHeight);
            this.tubes[i].fillWithOneColor(0);
        }
    };
    GameState.prototype.mixTubes = function () {
        console.debug('mixTubes()');
        for (var c = 0; c < this.numberOfTubes * 3; c++) {
            var i = this.randomInt(this.numberOfTubes);
            var j = this.randomInt(this.numberOfTubes);
            this.swapTubes(i, j);
        }
    };
    GameState.prototype.swapTubes = function (index1, index2) {
        var tmp = this.tubes[index1];
        this.tubes[index1] = this.tubes[index2];
        this.tubes[index2] = tmp;
    };
    GameState.prototype.randomizeBalls = function () {
        var maxMoves = this.numberOfTubes * this.tubeHeight;
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
    };
    GameState.prototype.randomizeBallsMany = function () {
        var lastMove = null;
        var maxMoves = this.numberOfTubes * this.tubeHeight * 3;
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
    };
    GameState.prototype.allPossibleBackwardMoves = function (lastMove) {
        var allMoves = [];
        for (var from = 0; from < this.numberOfTubes; from++) {
            if (this.tubes[from].isReverseDonorCandidate()) {
                for (var to = 0; to < this.numberOfTubes; to++) {
                    if (this.tubes[to].isReverseReceiverCandidate()) {
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
    };
    GameState.prototype.multiPush = function (array, element, number) {
        for (var i = 0; i < number; i++) {
            array.push(element);
        }
    };
    GameState.prototype.lottery = function (allMoves) {
        var lots = [];
        for (var i = 0; i < allMoves.length; i++) {
            var move = allMoves[i];
            var rate = this.rateBackwardMove(move);
            this.multiPush(lots, move, rate);
        }
        return lots;
    };
    GameState.prototype.rateBackwardMove = function (move) {
        if (this.tubes[move.to].isEmpty()) {
            return 50;
        }
        var ballColor = this.tubes[move.from].colorOfHighestBall();
        var targetColor = this.tubes[move.to].colorOfHighestBall();
        if (targetColor == ballColor) {
            return 50;
        }
        var n = this.tubes[move.to].unicolor();
        if (n > 1) {
            var points = this.tubeHeight - n - 1;
            return points;
        }
        return 40;
    };
    GameState.prototype.selectOneRandomly = function (a) {
        var randomIndex = this.randomInt(a.length);
        return a[randomIndex];
    };
    GameState.prototype.reverseReceiverCandidates = function () {
        var a = [];
        for (var i = 0; i < this.numberOfTubes; i++) {
            if (this.tubes[i].isReverseReceiverCandidate()) {
                a.push(i);
            }
        }
        return a;
    };
    GameState.prototype.reverseDonorCandidates = function () {
        var a = [];
        for (var i = 0; i < this.numberOfTubes; i++) {
            if (this.tubes[i].isReverseDonorCandidate()) {
                a.push(i);
            }
        }
        return a;
    };
    GameState.prototype.emptyExtraTubes = function () {
    };
    GameState.prototype.randomInt = function (max) {
        return Math.floor(Math.random() * max);
    };
    GameState.prototype.moveBall = function (move) {
        var color = this.tubes[move.from].removeBall();
        this.tubes[move.to].addBall(color);
    };
    GameState.prototype.moveBallAndLog = function (move) {
        if (move.to != move.from) {
            this.moveBall(move);
            this.moveLog.push(move);
        }
    };
    GameState.prototype.undoLastMove = function () {
        var forwardMove = this.moveLog.pop();
        if (forwardMove == undefined) {
            throw new Error("No move in move log to be undone!");
        }
        var backwardMove = forwardMove.backwards();
        this.moveBall(backwardMove);
        return backwardMove;
    };
    GameState.prototype.isMoveAllowed = function (from, to) {
        if (this.tubes[from].isEmpty()) {
            return false;
        }
        if (to == from) {
            return true;
        }
        if (this.tubes[to].isFull()) {
            return false;
        }
        if (this.isSameColor(from, to) || this.tubes[to].isEmpty()) {
            return true;
        }
        return false;
    };
    GameState.prototype.isSameColor = function (index1, index2) {
        var color1 = this.tubes[index1].colorOfHighestBall();
        var color2 = this.tubes[index2].colorOfHighestBall();
        return color1 == color2;
    };
    return GameState;
}());
var Tube = (function () {
    function Tube(tubeHeight) {
        this.tubeHeight = tubeHeight;
        this.cells = new Array(tubeHeight);
        this.fillLevel = 0;
    }
    Tube.prototype.fillWithOneColor = function (initialColor) {
        for (var i = 0; i < this.tubeHeight; i++) {
            this.cells[i] = initialColor;
        }
        this.fillLevel = initialColor == 0 ? 0 : this.tubeHeight;
    };
    Tube.prototype.clone = function () {
        var miniMe = new Tube(this.tubeHeight);
        for (var i = 0; i < this.tubeHeight; i++) {
            miniMe.cells[i] = this.cells[i];
        }
        miniMe.fillLevel = this.fillLevel;
        return miniMe;
    };
    Tube.prototype.isFull = function () {
        return this.fillLevel == this.tubeHeight;
    };
    Tube.prototype.isEmpty = function () {
        return this.fillLevel == 0;
    };
    Tube.prototype.addBall = function (color) {
        if (this.isFull()) {
            throw 'tube is already full';
        }
        this.cells[this.fillLevel] = color;
        this.fillLevel++;
    };
    Tube.prototype.removeBall = function () {
        if (this.isEmpty()) {
            throw 'tube is already empty';
        }
        this.fillLevel--;
        var color = this.cells[this.fillLevel];
        this.cells[this.fillLevel] = 0;
        return color;
    };
    Tube.prototype.colorOfHighestBall = function () {
        var color = this.cells[this.fillLevel - 1];
        return color;
    };
    Tube.prototype.colorOfSecondHighestBall = function () {
        return this.cells[this.fillLevel - 2];
    };
    Tube.prototype.isReverseDonorCandidate = function () {
        if (this.isEmpty()) {
            return false;
        }
        if (this.fillLevel == 1) {
            return true;
        }
        if (this.colorOfHighestBall() == this.colorOfSecondHighestBall()) {
            return true;
        }
        return false;
    };
    Tube.prototype.isReverseReceiverCandidate = function () {
        return !(this.isFull());
    };
    Tube.prototype.unicolor = function () {
        if (this.isEmpty()) {
            return 0;
        }
        if (this.fillLevel == 1) {
            return 1;
        }
        var color = this.cells[0];
        var i;
        for (i = 1; i < this.fillLevel; i++) {
            if (this.cells[i] != color) {
                return 0;
            }
        }
        return i;
    };
    Tube.prototype.isSolved = function () {
        if (!this.isFull()) {
            return false;
        }
        var color = this.cells[0];
        for (var i = 1; i < this.tubeHeight; i++) {
            if (this.cells[i] != color) {
                return false;
            }
        }
        return true;
    };
    return Tube;
}());
var Move = (function () {
    function Move(from, to) {
        this.from = from;
        this.to = to;
    }
    Move.prototype.backwards = function () {
        var retro = new Move(this.to, this.from);
        return retro;
    };
    Move.prototype.isEqual = function (otherMove) {
        if (otherMove == null) {
            return false;
        }
        return (this.from == otherMove.from) && (this.to == otherMove.to);
    };
    return Move;
}());
