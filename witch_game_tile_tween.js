// Example by https://twitter.com/awapblog

var game = new Phaser.Game(800, 600, Phaser.CANVAS, '', { preload: preload, create: create, update: update, render: render });


//DEBUG STUFF
var result;

//GENERAL STUFF
var TILE_SIZE = 25;
var TILE_SPACING = 0;
var TILE_SIZE_SPACED = TILE_SIZE + TILE_SPACING;
var BOARD_COLS;
var BOARD_ROWS;


const DIRECTION_N  = new Phaser.Point( 0, -1);
const DIRECTION_NE = new Phaser.Point( 1, -1);
const DIRECTION_E  = new Phaser.Point( 1,  0);
const DIRECTION_SE = new Phaser.Point( 1,  1);
const DIRECTION_S  = new Phaser.Point( 0,  1);
const DIRECTION_SW = new Phaser.Point(-1,  1);
const DIRECTION_W  = new Phaser.Point(-1,  0);
const DIRECTION_NW = new Phaser.Point(-1, -1);

//KID STUFF

var kid;
var kidState;

var scareCountdown;
//TODO: probably shouldn't be global
var breatheIn;
var breatheOut;
var finalBreatheIn;
var finalBreatheOut;

//Tiles traversed in a second
var NORMAL_MOVE_SPEED = .5;
var SCARED_MOVE_SPEED = 1.2;

const STATE_WANDERING = 0;
const STATE_SCAREDSEEING = 5;
const STATE_SCAREDRUNNING = 1;
const STATE_SIGNSEEING = 6;
const STATE_SIGNAPPROACHING = 2;
const STATE_SIGNREADING = 3;
const STATE_SIGNFOLLOWING = 4;
const STATE_

var kidDirection;

var TILEs;

function preload() {

    game.load.spritesheet("TILES", "assets/sprites/Grid.png", TILE_SIZE, TILE_SIZE);

    game.load.image('hauntedtree', 'assets/sprites/Haunted_Tree.png');
    game.load.image("grid", 'assets/sprites/Grid.png');
    game.load.atlas('kid_spritesheet', 'assets/sprites/kid_spritesheet.png', 'assets/sprites/kid_spritesheet.json');
    game.load.image('witch_hut_1', "assets/sprites/witch_hut_1.png");
    game.load.image('sign', "assets/sprites/Sign.png");
}

function create() {

    //BOARD SETUP
    game.stage.backgroundColor = 0x465243;
    spawnBoard();
    game.time.create();

    //KID SETUP
    kid = createKid(new Phaser.Point(28,10));

    hauntedtrees = game.add.group();

    game.input.onDown.add(addHauntedTree, this);

    cursors = game.input.keyboard.createCursorKeys();
    hauntedtreecursor = game.add.sprite(25, 25, 'hauntedtree');
    hauntedtreecursor.alpha = .3;
    cursorsprite = hauntedtreecursor;
    continueOnKid(kid);
}

function addHauntedTree() {
    var cursorGridPosX = getGridPosSingle(game.input.mousePointer.x);
    var cursorGridPosY = getGridPosSingle(game.input.mousePointer.y);

    var hauntedtree = hauntedtrees.create(0, 0, 'hauntedtree');
    hauntedtree.anchor.x = .5;
    hauntedtree.anchor.y = .5;
    setGridLocation(hauntedtree, new Phaser.Point(cursorGridPosX, cursorGridPosY));
    hauntedtree.name = 'hauntedtree';

    //listen to surrounding tiles

    var surroundingTiles = getSurroundingTiles(1, getGridPosOfObject(hauntedtree));
    log("Adding around " + getGridPosOfObject(hauntedtree).x + ", " + getGridPosOfObject(hauntedtree).y + ".");
    for (tile of surroundingTiles) {
      tile.onVisit.add(scare, this, 1, kid, hauntedtree, tile);

    }
}

function scare(context, kidforsomereason, timeforsomereason, visitingKid, hauntedTree, visitedTile) {
      //TODO: Order variables were input doesn't seem to match how they are output here. Is this a PHASER bug?
      var kidRelativeToTree = Phaser.Point.subtract(kidGridLocation(kid), getGridPosOfObject(hauntedTree));
      var newDirection = kidRelativeToTree;
      kidDirection = newDirection;
      kidBecomeScared(kid);
        //prevents other lower priority actions from taking effect
      //TODO: Handle simultaneous scare corner case (overlapping scare areas of two trees)
      visitedTile.onVisit.halt();
}

function kidBecomeScared(kid) {


  kidState = STATE_SCAREDSEEING;

  kid.frameName = 'ScaredKid.png';
  var jumpUp = game.add.tween(kid.scale);
  var jumpDown = game.add.tween(kid.scale);
  jumpUp.to({x: .35, y: .35}, 130, Phaser.Easing.Linear.None);
  jumpDown.to({x: .25, y: .25}, 130, Phaser.Easing.Linear.None);
  jumpUp.chain(jumpDown);

  jumpDown.onComplete.add(function() {
      kidState = STATE_SCAREDRUNNING;



      breatheHeavily();
      scareCountdown = 3;
      continueOnKid(kid);
      }
  );

  jumpUp.start();
}

function breatheHeavily() {
  //breathe heavily
  breatheIn = game.add.tween(kid.scale);
  breatheOut = game.add.tween(kid.scale);
  breatheIn.to({x: .30, y: .30}, 320, Phaser.Easing.Sinusoidal.In);
 breatheOut.to({x: .25, y: .25},320, Phaser.Easing.Sinusoidal.Out);
  breatheIn.chain(breatheOut);
  breatheOut.onComplete.add(breatheHeavily);
  breatheIn.start();
  log("Breathing heavily");
}

function stopBreathingHeavily() {
  breatheIn.stop(false);
  breatheOut.stop(false);
  //final exhale
  finalBreatheIn = game.add.tween(kid.scale);
  finalBreatheOut = game.add.tween(kid.scale);
  finalBreatheIn.to({x: .29, y: .29}, 800, Phaser.Easing.Sinusoidal.In);
  finalBreatheOut.to({x: .25, y: .25}, 1300, Phaser.Easing.Sinusoidal.Out);
  finalBreatheIn.chain(finalBreatheOut);
  finalBreatheIn.start();
  log("stoppin");
}

function kidStopScared(kid) {
  stopBreathingHeavily();
  kidState = STATE_WANDERING;
  kid.frameName = "NormalKid.png";
}

function considerHowToDealWithWall(kid, whereToMove) {
  lookConsidering(kid);

  game.time.events.add(600, function() {
    decideOnDirectionAndMove(kid, whereToMove);
   },
    this);
}

function lookConsidering(kid) {
    var consider = game.add.tween(kid.scale);
    consider.to({x: .25, y: .22}, 80, Phaser.Easing.Linear.None);
    consider.start();
}

function lookDecidedOnDirection() {
    var stopConsidering = game.add.tween(kid.scale);
    stopConsidering.to({x: .25, y: .25}, 100, Phaser.Easing.Linear.In);
    stopConsidering.start();
}

function decideOnDirectionAndMove(kid, whereToMove) {
    lookDecidedOnDirection();
    kidDirection = calculateDirectionOffEdge(kid, whereToMove);
    var newWhereToMove = Phaser.Point.add(kidGridLocation(kid), kidDirection);
    moveTo(kid, newWhereToMove, NORMAL_MOVE_SPEED);
}

function continueOn(the_this, visitingKid, visitedTile) {
  //Will redirect to that specific kid's continue on function if this is ever object oriented
  continueOnKid(visitingKid);
}

function continueOnKid(kid) {
  //TODO: is this right place for this?
  if (kidState == STATE_SCAREDRUNNING && scareCountdown == 0) {
    kidStopScared(kid);
  }

  switch(kidState) {
    case STATE_WANDERING:
      var whereToMove = Phaser.Point.add(kidGridLocation(kid), kidDirection);
      if (willHitEdge(kid, whereToMove)) {
        considerHowToDealWithWall(kid, whereToMove);
      } else {
        moveTo(kid, whereToMove, NORMAL_MOVE_SPEED);
      }
      break;
    case STATE_SCAREDRUNNING:
      scareCountdown -= 1;
      var whereToMove = Phaser.Point.add(kidGridLocation(kid), kidDirection);
      if (willHitEdge(kid, whereToMove)) {
        kidDirection = calculateDirectionOffEdge(kid, whereToMove);
        var newWhereToMove = Phaser.Point.add(kidGridLocation(kid), kidDirection);
        moveTo(kid, newWhereToMove, SCARED_MOVE_SPEED);
      } else {
        moveTo(kid, whereToMove, SCARED_MOVE_SPEED);
      }
      break;
  }

}

function kidGridLocation(kid) {
    return getGridPosOfObject(kid);
}

function getSurroundingTiles(distance, position) {
  var surroundingTiles = [];
  for (var i = distance * -1; i <= distance; i++) {
    for (var j = distance * -1; j <= distance; j++) {
      var possibleTile = getTILE(new Phaser.Point(position.x + i, position.y + j));
      if (possibleTile != null) {
        surroundingTiles.push(possibleTile);
      }
    }
  }
  return surroundingTiles;
}

function createKid(location) {
  var kid = game.add.sprite(0, 0, 'kid_spritesheet', 'NormalKid.png');
  kid.scale.setTo(.25, .25); //TODO: scale down in the export, since this leads to fuzziness
  kidState = STATE_WANDERING;
  kidDirection = DIRECTION_SE;
  setGridLocation(kid, location);
  kid.anchor.x = 0.5;
  kid.anchor.y = 0.5;
  return kid;
}

function setGridLocation(thing, gridLocation) {
  var pixelLocation = locationToPixelCenter(gridLocation);
  thing.x = pixelLocation.x;
  thing.y = pixelLocation.y;
  //thing.gridLocation = gridLocation;
}


function locationToPixelCenter(location) {
  return new Phaser.Point(location.x * TILE_SIZE + TILE_SIZE / 2, location.y * TILE_SIZE + TILE_SIZE / 2);
}
function locationToPixelTopLeft(location) {
  return new Phaser.Point(location.x * TILE_SIZE, location.y * TILE_SIZE);

}

function spriteCenter(tile) {
  return new Phaser.Point(tile.x, tile.y);
}


function update() {
  cursorsprite.x = lockToGrid(game.input.mousePointer.x);
  cursorsprite.y = lockToGrid(game.input.mousePointer.y);
}

function moveTo(kid, gridLoc, speed) {
  var tile = getTILE(gridLoc);
  var move = game.add.tween(kid);
  move.to({x: locationToPixelCenter(gridLoc).x, y: locationToPixelCenter(gridLoc).y}, 1000 / speed, Phaser.Easing.Linear.None);
  move.onComplete.addOnce(kidReactToSurroundings, this, kid, tile);
  move.start();
  log("kid moving to " + getGridPosOfObject(tile).x + ", " + getGridPosOfObject(tile).y);
}

function calculateDirectionOffEdge(kid, movingTo) {
  var flipEW = 1, flipNS = 1;
  if (movingTo.x >= BOARD_COLS || movingTo.x < 0) {
    flipEW = -1;
  }
  if (movingTo.y >= BOARD_ROWS || movingTo.y < 0) {
    flipNS = -1;
  }
  var newDirection = new Phaser.Point(kidDirection.x * flipEW, kidDirection.y * flipNS);
  return newDirection;
}

function willHitEdge(kid, movingTo) {
  return movingTo.x >= BOARD_COLS || movingTo.y >= BOARD_ROWS || movingTo.x < 0 || movingTo.y < 0;
}

function render() {
  game.debug.text(result, 32,32);
}

function log(message) {
  result = message + "; " + result;
}

function kidReactToSurroundings() {
  var tileKidIsIn = getTILE(kidGridLocation(kid));
  log("Reacting to " + getGridPosOfObject(tileKidIsIn).x + ", " + getGridPosOfObject(tileKidIsIn).y + "listeners: " + tileKidIsIn.onVisit.getNumListeners());
  tileKidIsIn.onVisit.dispatch(this, kid, tileKidIsIn);
}


function testereeno() {
  log("BLAM!");
}

function lockToGrid(coord) {
    return coord - (coord % TILE_SIZE);
}


// fill the screen with as many TILEs as possible
function spawnBoard() {

    BOARD_COLS = Math.floor(game.world.width / TILE_SIZE_SPACED);
    BOARD_ROWS = Math.floor(game.world.height / TILE_SIZE_SPACED);

    TILEs = game.add.group();

    for (var i = 0; i < BOARD_COLS; i++)
    {
        for (var j = 0; j < BOARD_ROWS; j++)
        {
            var TILE = TILEs.create(0, 0, "TILES");
            TILE.name = 'TILE' + i.toString() + 'x' + j.toString();
            TILE.inputEnabled = true;
            TILE.onVisit = new Phaser.Signal();
            TILE.anchor.x = .5;
            TILE.anchor.y = .5;
            //If no other action takes precedence, kid continues on from the tile by default.
            TILE.onVisit.add(continueOn, this, -1, TILE);
            //TILE.events.onInputDown.add(selectTILE, this);
            //TILE.events.onInputUp.add(releaseTILE, this);
            //randomizeTILEColor(TILE);
            setTILEPos(TILE, i, j); // each TILE has a position on the board
        }
    }

}

// find a TILE on the board according to its position on the board
function getTILE(gridLoc) {

    return TILEs.iterate("id", calcTILEId(gridLoc.x, gridLoc.y), Phaser.Group.RETURN_CHILD);

}

// convert world coordinates to board position
function getGridPosSingle(num) {

    return Math.floor(num / TILE_SIZE);

}

function getGridPosOfPixel(coordinate) {
  return new Phaser.Point(Math.floor(coordinate.x/TILE_SIZE), Math.floor(coordinate.y/TILE_SIZE));
}

function getGridPosOfObject(object) {
  //Objects are judged to be located wherever their center pixel is located in the grid
  return getGridPosOfPixel(spriteCenter(object));
}

// set the position on the board for a TILE
function setTILEPos(TILE, posX, posY) {
    setGridLocation(TILE, new Phaser.Point(posX, posY));
    TILE.posX = posX;
    TILE.posY = posY;
    TILE.id = calcTILEId(posX, posY);

}

// the TILE id is used by getTILE() to find specific TILEs in the group
// each position on the board has a unique id
function calcTILEId(posX, posY) {

    return posX + posY * BOARD_COLS;

}
