var step = 20;
var tetrisManager;
var fallSpeed = 20;
var gameHeight = 20 * step;
var gameWidth = 10 * step;
var uiWidth = 100;
var uiLineWidth = 8;
var soundManager;
var scoreManager;
var levelManager;
var retryButton;
var nameInput;

var nextShape = new Event("nextShape");
var handleFullRow = new Event("handleFullRow");

class TetrisManager {
    constructor() {
        this.shapes = new Array();
        this.shapeGenerator = new ShapeGenerator();
        this.fallingShape = this.shapeGenerator.randomShape();
    }

    nextShape() {
        this.shapes.push(this.fallingShape);
        this.fallingShape = this.shapeGenerator.randomShape();
        this.handleFullRow();
    }

    deleteRows(rows) {
        var pixelCount = 0;
        rows.forEach(function (row) {
            this.shapes.forEach(function (shape) {
                shape.pixels.forEach(function (pixel) {
                    if (pixel.y === row) {
                        pixelCount += shape.pixels.splice(shape.pixels.indexOf(pixel), 1).length;
                    }
                });
            });
        }, this);
    }

    getFullRows() {
        //duplicate
        var pixels = new Array();
        this.shapes.forEach(function (shape) {
            shape.pixels.forEach(function (pixel) {
                pixels.push(pixel);
            });
        });

        // sort pixels
        var ySortedPixels = pixels.sort(function (a, b) {
            return a.y - b.y;
        });

        var rows = new Array();
        var rowCount = gameWidth / step;
        var previousY = ySortedPixels[0].y;
        var consequentialY = 1;
        for (var i = 1; i < ySortedPixels.length; i++) {
            if (ySortedPixels[i].y === previousY) {
                consequentialY++;
                if (consequentialY === rowCount) {
                    rows.push(ySortedPixels[i].y);
                }
            } else {
                consequentialY = 1;
                previousY = ySortedPixels[i].y;
            }
        }
        return rows;
    }

    letTheOtherShapesFall(deletedRows) {
        deletedRows.forEach(function (deletedRow) {
            this.shapes.forEach(function (shape) {
                shape.pixels.forEach(function (pixel) {
                    if (pixel.y < deletedRow) {
                        pixel.y += step;
                    }
                });
            });
        }, this);
    }

    handleFullRow() {
        var rows = this.getFullRows();
        if (rows.length > 0) {
            this.deleteRows(rows);
            this.deleteRows(rows);
            this.letTheOtherShapesFall(rows);
            var lineClearedEvent = new CustomEvent("lineCleared", { detail: rows.length });
            dispatchEvent(lineClearedEvent);
        }
    }

    quickFall() {
        this.fallingShape.isFallingQuickly = true;
    }

    checkForGameEnd(fallingShapePixel, pixel) {
        if ((fallingShapePixel.y <= 2 * step) && (pixel.y === fallingShapePixel.y + step)) {
            console.log("stopped");
            var endGameEvent = new Event("endGame");
            dispatchEvent(endGameEvent);
        }
    }
}

class Pixel {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class ShapeGenerator {
    constructor() {
        this.newBags();
    }

    static newBag() {
        var x = 80;
        var bag = new Array();
        bag.push(new SquareShape(x, 0));
        bag.push(new LineShape(x, 0));
        bag.push(new SShape(x, 0));
        bag.push(new ZShape(x, 0));
        bag.push(new LShape(x, 0));
        bag.push(new JShape(x, 0));
        bag.push(new TShape(x, 0));
        return bag;
    }

    newBags() {
        this.bag = ShapeGenerator.newBag();
        this.secondBag = ShapeGenerator.newBag();
        this.randomizeBags();
    }

    randomizeBags() {
        ShapeGenerator.randomizeBag(this.bag);
        ShapeGenerator.randomizeBag(this.secondBag);
    }
    static randomizeBag(bag) {
        var currentIndex = bag.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = bag[currentIndex];
            bag[currentIndex] = bag[randomIndex];
            bag[randomIndex] = temporaryValue;
        }
    }

    randomShape() {
        var shape = this.bag.pop();
        if (this.bag.length === 0) {
            var tempBag = this.secondBag;
            this.secondBag = ShapeGenerator.newBag();
            this.bag = this.secondBag;
        }
        return shape;
    }

    nextShapes() {
        var nextShapes = new Array();
        var j = 0;
        for (var i = 0; i < 3; i++) {
            if (this.bag[this.bag.length - 1 - i]) {
                nextShapes.push(this.bag[this.bag.length - 1 - i]);
            } else {
                nextShapes.push(this.secondBag[this.secondBag.length - 1 - j]);
                j++;
            }
        }
        return nextShapes;
    }

    showNextShapes() {
        var nextShapes = this.nextShapes();
        var j = 0;
        for (var i = 0; i < 3; i++) {
            var nextShape = nextShapes[i];
            var shape;
            if (nextShape instanceof SquareShape) {
                shape = new SquareShape(gameWidth + uiWidth / 2 - step / 2, 5 * step * (i) + step / 2);
            } else if (nextShape instanceof LineShape) {
                shape = new LineShape(gameWidth + uiWidth / 2, 5 * step * (i) + step / 2);
            } else if (nextShape instanceof SShape) {
                shape = new SShape(gameWidth + uiWidth / 2, 5 * step * (i) + step / 2);
            } else if (nextShape instanceof ZShape) {
                shape = new ZShape(gameWidth + uiWidth / 2, 5 * step * (i) + step / 2);
            } else if (nextShape instanceof LShape) {
                shape = new LShape(gameWidth + uiWidth / 2, 5 * step * (i) + step / 2);
            } else if (nextShape instanceof JShape) {
                shape = new JShape(gameWidth + uiWidth / 2, 5 * step * (i) + step / 2);
            } else if (nextShape instanceof TShape) {
                shape = new TShape(gameWidth + uiWidth / 2, 5 * step * (i) + step / 2);
            }
            shape.draw();
        }
    }
}

class Shape {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    move(direction) {
        if (!this.isFallingQuickly) {
            var rightBlocked = this.pixels.some(function (pixel) {
                return (pixel.x + step >= gameWidth);
            });
            var leftBlocked = this.pixels.some(function (pixel) {
                return (pixel.x <= 0);
            });

            var canMove = ((direction === "left") && !leftBlocked) || ((direction === "right") && !rightBlocked);

            if (canMove) {
                this.pixels.forEach(function (pixel) {
                    if (direction === "right") {
                        pixel.x += step;
                    } else if (direction === "left") {
                        pixel.x -= step;
                    }
                });
            }
        }
    }

    draw() {
        fill(this.color);
        stroke("black");
        strokeWeight(2);
        this.pixels.forEach(function (pixel) {
            rect(pixel.x, pixel.y, step, step);
        });
    }

    fall() {
        var highestY = 0;
        this.pixels.forEach(function (pixel) {
            if (pixel.y > highestY) {
                highestY = pixel.y;
            }
        });
        if (highestY + step >= gameHeight) {
            dispatchEvent(nextShape);
            dispatchEvent(handleFullRow);
        } else {
            this.pixels.forEach(function (pixel) {
                pixel.y += fallSpeed;
            });
        }
    }
}

class LineShape extends Shape {
    constructor(x, y) {
        super(x, y);
        this.x = x;
        this.y = y;
        this.pixels = new Array();
        this.orientation = "vertical";
        this.pixels.push(new Pixel(x, y));
        this.pixels.push(new Pixel(x, y + step));
        this.pixels.push(new Pixel(x, y + 2 * step));
        this.pixels.push(new Pixel(x, y + 3 * step));
        this.isFallingQuickly = false;
        this.color = color(92, 126, 205); // blue
    }

    rotatedPixels() {
        var rotatedPixels = new Array();
        var x = this.pixels[1].x;
        var y = this.pixels[1].y;
        if (this.orientation === "vertical") {
            rotatedPixels.push(new Pixel(x - step, y));
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x + step, y));
            rotatedPixels.push(new Pixel(x + 2 * step, y));
        } else {
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x, y + step));
            rotatedPixels.push(new Pixel(x, y + 2 * step));
            rotatedPixels.push(new Pixel(x, y + 3 * step));
        }
        return rotatedPixels;
    }

    rotate() {
        if (!this.isFallingQuickly) {
            this.pixels = this.rotatedPixels();
            if (this.orientation === "vertical") {
                this.orientation = "horizontal";
            } else {
                this.orientation = "vertical";
            }
        }
    }

}

class SquareShape extends Shape {
    constructor(x, y) {
        super(x, y);
        this.pixels = new Array();
        this.pixels.push(new Pixel(x, y));
        this.pixels.push(new Pixel(x, y + step));
        this.pixels.push(new Pixel(x + step, y + step));
        this.pixels.push(new Pixel(x + step, y));
        this.isFallingQuickly = false;
        this.color = color(255, 250, 65); // yellow
    }

    rotatedPixels() {
        return this.pixels;
    }

    rotate() {

    }
}

class SShape extends Shape {
    constructor(x, y) {
        super(x, y);
        this.pixels = new Array();
        this.pixels.push(new Pixel(x, y));
        this.pixels.push(new Pixel(x, y + step));
        this.pixels.push(new Pixel(x + step, y));
        this.pixels.push(new Pixel(x - step, y + step));
        this.isFallingQuickly = false;
        this.color = color(255, 28, 28); // red
    }

    rotatedPixels() {
        var rotatedPixels = new Array();
        var x = this.pixels[1].x;
        var y = this.pixels[1].y;
        if (this.orientation === "vertical") {
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x, y + step));
            rotatedPixels.push(new Pixel(x + step, y));
            rotatedPixels.push(new Pixel(x - step, y + step));
        } else {
            rotatedPixels.push(new Pixel(x, y - step));
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x + step, y));
            rotatedPixels.push(new Pixel(x + step, y + step));
        }
        return rotatedPixels;
    }

    rotate() {
        if (!this.isFallingQuickly) {
            this.pixels = this.rotatedPixels();
            if (this.orientation === "vertical") {
                this.orientation = "horizontal";
            } else {
                this.orientation = "vertical";
            }
        }
    }
}

class ZShape extends Shape {
    constructor(x, y) {
        super(x, y);
        this.pixels = new Array();
        this.pixels.push(new Pixel(x, y));
        this.pixels.push(new Pixel(x - step, y));
        this.pixels.push(new Pixel(x, y + step));
        this.pixels.push(new Pixel(x + step, y + step));
        this.isFallingQuickly = false;
        this.color = color(28, 255, 28); // green
    }

    rotatedPixels() {
        var rotatedPixels = new Array();
        var x = this.pixels[1].x;
        var y = this.pixels[1].y;
        if (this.orientation === "vertical") {
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x - step, y));
            rotatedPixels.push(new Pixel(x, y + step));
            rotatedPixels.push(new Pixel(x + step, y + step));
        } else {
            rotatedPixels.push(new Pixel(x + step, y));
            rotatedPixels.push(new Pixel(x + step, y + step));
            rotatedPixels.push(new Pixel(x, y + step));
            rotatedPixels.push(new Pixel(x, y + 2 * step));
        }
        return rotatedPixels;
    }

    rotate() {
        if (!this.isFallingQuickly) {
            this.pixels = this.rotatedPixels();
            if (this.orientation === "vertical") {
                this.orientation = "horizontal";
            } else {
                this.orientation = "vertical";
            }
        }
    }
}

class LShape extends Shape {
    constructor(x, y) {
        super(x, y);
        this.pixels = new Array();
        this.pixels.push(new Pixel(x, y + step));
        this.pixels.push(new Pixel(x + step, y + step));
        this.pixels.push(new Pixel(x - step, y + step));
        this.pixels.push(new Pixel(x + step, y));
        this.orientation = "horizontal1";
        this.isFallingQuickly = false;
        this.color = color(255, 212, 34); // orange
    }

    rotatedPixels() {
        var rotatedPixels = new Array();
        var x = this.pixels[0].x;
        var y = this.pixels[0].y;
        if (this.orientation === "horizontal1") {
            //vertical1
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x, y - step));
            rotatedPixels.push(new Pixel(x, y + step));
            rotatedPixels.push(new Pixel(x + step, y + step));
        } else if (this.orientation === "vertical1") {
            // horizontal2
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x - step, y));
            rotatedPixels.push(new Pixel(x + step, y));
            rotatedPixels.push(new Pixel(x - step, y + step));
        } else if (this.orientation === "horizontal2") {
            // vertical2
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x, y + step));
            rotatedPixels.push(new Pixel(x, y - step));
            rotatedPixels.push(new Pixel(x - step, y - step));
        } else if (this.orientation === "vertical2") {
            // horizontal1
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x + step, y));
            rotatedPixels.push(new Pixel(x - step, y));
            rotatedPixels.push(new Pixel(x + step, y - step));
        }
        return rotatedPixels;
    }

    rotate() {
        if (!this.isFallingQuickly) {
            this.pixels = this.rotatedPixels();
            if (this.orientation === "horizontal1") {
                this.orientation = "vertical1";
            } else if (this.orientation === "vertical1") {
                this.orientation = "horizontal2";
            } else if (this.orientation === "horizontal2") {
                this.orientation = "vertical2";
            } else if (this.orientation === "vertical2") {
                this.orientation = "horizontal1";
            }
        }
    }
}

class JShape extends Shape {
    constructor(x, y) {
        super(x, y);
        this.pixels = new Array();
        this.pixels.push(new Pixel(x, y + step));
        this.pixels.push(new Pixel(x + step, y + step));
        this.pixels.push(new Pixel(x - step, y + step));
        this.pixels.push(new Pixel(x - step, y));
        this.orientation = "horizontal1";
        this.isFallingQuickly = false;
        this.color = color(255, 16, 192); // pink
    }

    rotatedPixels() {
        var rotatedPixels = new Array();
        var x = this.pixels[0].x;
        var y = this.pixels[0].y;
        if (this.orientation === "horizontal1") {
            // vertical1
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x, y - step));
            rotatedPixels.push(new Pixel(x, y + step));
            rotatedPixels.push(new Pixel(x + step, y - step));
        } else if (this.orientation === "vertical1") {
            // horizontal2
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x - step, y));
            rotatedPixels.push(new Pixel(x + step, y));
            rotatedPixels.push(new Pixel(x + step, y + step));
        } else if (this.orientation === "horizontal2") {
            // vertical2
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x, y - step));
            rotatedPixels.push(new Pixel(x, y + step));
            rotatedPixels.push(new Pixel(x - step, y + step));
        } else if (this.orientation === "vertical2") {
            // horizontal1
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x + step, y));
            rotatedPixels.push(new Pixel(x - step, y));
            rotatedPixels.push(new Pixel(x - step, y - step));
        }
        return rotatedPixels;
    }

    rotate() {
        if (!this.isFallingQuickly) {
            this.pixels = this.rotatedPixels();
            if (this.orientation === "horizontal1") {
                this.orientation = "vertical1";
            } else if (this.orientation === "vertical1") {
                this.orientation = "horizontal2";
            } else if (this.orientation === "horizontal2") {
                this.orientation = "vertical2";
            } else if (this.orientation === "vertical2") {
                this.orientation = "horizontal1";
            }
        }
    }
}

class TShape extends Shape {
    constructor(x, y) {
        super(x, y);
        this.pixels = new Array();
        this.orientation = "up";
        this.pixels.push(new Pixel(x, y));
        this.pixels.push(new Pixel(x, y + step));
        this.pixels.push(new Pixel(x - step, y + step));
        this.pixels.push(new Pixel(x + step, y + step));
        this.isFallingQuickly = false;
        this.color = color(208, 16, 255); // purple
    }

    rotatedPixels() {
        var rotatedPixels = new Array();
        var x = this.pixels[1].x;
        var y = this.pixels[1].y;
        if (this.orientation === "up") {
            rotatedPixels.push(new Pixel(x + step, y));
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x, y - step));
            rotatedPixels.push(new Pixel(x, y + step));
        } else if (this.orientation === "right") {
            rotatedPixels.push(new Pixel(x, y + step));
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x - step, y));
            rotatedPixels.push(new Pixel(x + step, y));
        } else if (this.orientation === "down") {
            rotatedPixels.push(new Pixel(x - step, y));
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x, y - step));
            rotatedPixels.push(new Pixel(x, y + step));
        } else if (this.orientation === "left") {
            rotatedPixels.push(new Pixel(x, y));
            rotatedPixels.push(new Pixel(x, y + step));
            rotatedPixels.push(new Pixel(x - step, y + step));
            rotatedPixels.push(new Pixel(x + step, y + step));
        }
        return rotatedPixels;
    }

    rotate() {
        if (!this.isFallingQuickly) {
            this.pixels = this.rotatedPixels();
            if (this.orientation === "up") {
                this.orientation = "right";
            } else if (this.orientation === "right") {
                this.orientation = "down";
            } else if (this.orientation === "down") {
                this.orientation = "left";
            } else if (this.orientation === "left") {
                this.orientation = "up";
            }
        }
    }
}

class SoundManager {
    constructor() {
        soundFormats("mp3", "ogg");
        this.theme = loadSound("tetrisTheme.mp3");
        this.lineCleared = loadSound("lineCleared.mp3");
        this.toc = loadSound("toc.mp3");
    }

    playTheme() {
        this.theme.setVolume(0.2);
        this.theme.loop();
    }

    playLineCleared() {
        this.lineCleared.setVolume(0.6);
        this.lineCleared.play();
    }

    playToc() {
        this.toc.setVolume(0.2);
        this.toc.play();
    }

    stopTheme() {
        this.theme.stop();
    }
}

class ScoreManager {
    constructor(levelManager) {
        this.score = 0;
        this.levelManager = levelManager;
    }

    incrementScore(nLine) {
        var pointsPerLine = [0, 40, 100, 300, 1200];
        var previousScore = this.score;
        this.score += pointsPerLine[nLine] * (this.levelManager.level + 1);
        //console.log("score and level", this.score, this.levelManager.level);
        this.levelManager.setLevel(floor(this.score / 1000));
    }

    showScore() {
        textSize(32);
        fill(color(55, 55, 55));
        textAlign(CENTER);
        text(this.score, gameWidth + uiLineWidth + uiWidth / 2, gameHeight - 10);
    }
}

class LevelManager {
    constructor() {
        this.levels = [20, 17, 15, 13, 11, 9, 7, 6, 5, 4, 3];
        this.level = 0;
        this.slowFactor = this.levels[this.level];
    }

    setLevel(level) {
        this.level = level;
        if (this.level > 10) {
            this.level = 10;
        }
        this.slowFactor = this.levels[this.level];
    }

    showLevel() {
        textSize(16);
        fill(color(55, 55, 55));
        textAlign(CENTER);
        text(this.level, gameWidth + uiLineWidth + uiWidth / 2, gameHeight - 50);
    }
}

function preload() {
    soundManager = new SoundManager();
}

function keyPressed() {
    // clean this
    if (keyCode === RIGHT_ARROW) {
        var canMove = true;
        tetrisManager.shapes.forEach(function (shape) {
            shape.pixels.forEach(function (pixel) {
                tetrisManager.fallingShape.pixels.forEach(function (fallingPixel) {
                    if ((fallingPixel.x + step === pixel.x) && (fallingPixel.y === pixel.y)) {
                        canMove = false;
                        console.log(pixel);
                    }
                });
            });
        });
        if (canMove) {
            tetrisManager.fallingShape.move("right");
        }
        return false;
    } else if (keyCode === LEFT_ARROW) {
        var canMove = true;
        tetrisManager.shapes.forEach(function (shape) {
            shape.pixels.forEach(function (pixel) {
                tetrisManager.fallingShape.pixels.forEach(function (fallingPixel) {
                    if ((fallingPixel.x === pixel.x + step) && (fallingPixel.y === pixel.y)) {
                        canMove = false;
                    }
                });
            });
        });
        if (canMove) {
            tetrisManager.fallingShape.move("left");
        }
        return false;
    } else if (keyCode === DOWN_ARROW) {
        tetrisManager.quickFall();
        return false;
    } else if (keyCode === UP_ARROW) {
        var canRotate = true;
        var needsToMoveRight = 0;
        var needsToMoveLeft = 0;
        var rotatedPixels = tetrisManager.fallingShape.rotatedPixels();

        tetrisManager.shapes.forEach(function (shape) {
            shape.pixels.forEach(function (pixel) {
                rotatedPixels.forEach(function (rotatedShapePixel) {
                    if ((rotatedShapePixel.x === pixel.x) && (rotatedShapePixel.y === pixel.y)) {
                        console.log("Can't rotate because it collides with another shape");
                        canRotate = false;
                    }
                });
            });
        });

        rotatedPixels.forEach(function (rotatedShapePixel) {
            if (rotatedShapePixel.x + step > gameWidth) {
                console.log("collides with RIGHT border");
                needsToMoveLeft++;
            }
            if (rotatedShapePixel.y + step >= gameHeight) {
                console.log("collides with BOTTOM border");
                canRotate = false;
            }
            if (rotatedShapePixel.x < 0) {
                console.log("collides with LEFT border");
                needsToMoveRight++;
            }
        });
        if (canRotate) {
            tetrisManager.fallingShape.rotate();
            if (needsToMoveRight > 0) {
                tetrisManager.fallingShape.pixels.forEach(function (pixel) {
                    pixel.x += step * needsToMoveRight;
                });
            } else if (needsToMoveLeft > 0) {
                tetrisManager.fallingShape.pixels.forEach(function (pixel) {
                    pixel.x -= (step * needsToMoveLeft);
                });
            }
        }
        return false;
    }
}

function retry() {
    retryButton.remove();
    levelManager = new LevelManager();
    scoreManager = new ScoreManager(levelManager);
    tetrisManager = new TetrisManager();
    soundManager.playTheme();
    loop();
}

function saveScore(score) {
    console.log("posting", score);
    var name = nameInput.value();
    if (name.length > 0) {
        $.post("/addScore", { score: score, name: name }, function (data) {
            console.log("success", data);
        }).fail(function () {
            console.log("failed");
        });
    }
}

function getScores(callback) {
    console.log("getting scores");
    $.get("/scores", {}, function (scores) {
        console.log("scores", scores)
        callback(scores)
    }).fail(function () {
        console.log("failed to get scores");
    });
}

function createScoreboard(scores) {
    var previousTable = select("#scoreboardTable");
    if (previousTable) {
        previousTable.remove();
    }
    var table = createElement("table").id("scoreboardTable");
    var header = createElement("tr").parent(table);
    var th1 = createElement("th", "Name").parent(header);
    var th2 = createElement("th", "Score").parent(header);
    scores.forEach(function (score) {
        var tr = createElement("tr").parent(table);
        var thName = createElement("td", score.name).parent(tr);
        var thScore = createElement("td", score.score).parent(tr);
    });
}

function setup() {
    frameRate(30);
    createCanvas(gameWidth + uiWidth + uiLineWidth, gameHeight).parent("tetris");
    levelManager = new LevelManager();
    scoreManager = new ScoreManager(levelManager);
    soundManager.playTheme();
    addEventListener("lineCleared", function (arg) {
        soundManager.playLineCleared();
        scoreManager.incrementScore(arg.detail);
    });

    tetrisManager = new TetrisManager();

    addEventListener("nextShape", function () {
        tetrisManager.nextShape();
        soundManager.playToc();
    });
    addEventListener("endGame", function () {
        noLoop();
        if (!select("#retryButton")) {
            retryButton = createButton("Retry").parent("tetris").id("retryButton");
            retryButton.position(width / 2 - retryButton.width / 2, height / 2 - retryButton.height / 2);
            retryButton.mousePressed(retry);
            soundManager.stopTheme();
            saveScore(scoreManager.score);
            getScores(createScoreboard);
        }
    });

    nameInput = createInput().id("nameInput").parent("name");
    //nameInput.setAttribute("placeholder", "Your name");
    $(nameInput).attr("placeholder", "Your name");
    getScores(createScoreboard);
}


function draw() {
    background(50);
    // draw backgrounds
    fill(0, 0, 0);
    rect(0, 0, gameWidth + uiLineWidth, gameHeight);
    stroke(115, 115, 150);
    strokeWeight(uiLineWidth);
    fill(255, 255, 255);
    rect(gameWidth + uiLineWidth, 0, uiWidth, height);


    tetrisManager.fallingShape.draw();

    tetrisManager.shapes.forEach(function (shape) {
        shape.draw();
    });

    tetrisManager.shapes.forEach(function (shape) {
        shape.pixels.forEach(function (pixel) {
            tetrisManager.fallingShape.pixels.forEach(function (fallingShapePixel) {
                if ((pixel.x === fallingShapePixel.x) && (pixel.y === fallingShapePixel.y + step)) {
                    dispatchEvent(nextShape);
                    tetrisManager.checkForGameEnd(fallingShapePixel, pixel);
                }
            });
        });
    });
    if (tetrisManager.fallingShape.isFallingQuickly) {
        tetrisManager.fallingShape.fall();
    } else {
        if (frameCount % levelManager.slowFactor === 0) {
            tetrisManager.fallingShape.fall();
        }
    }
    tetrisManager.shapeGenerator.showNextShapes();
    scoreManager.showScore();
    levelManager.showLevel();
}

