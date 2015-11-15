// Example by https://twitter.com/awapblog


const BOARD_WIDTH = 800;
const BOARD_HEIGHT = 600;

var game = new Phaser.Game(BOARD_WIDTH, BOARD_HEIGHT, Phaser.CANVAS, '', { preload: preload, create: create, update: update, render: render });


//TODO: Make it so you can't put sign on hauntedtree and vice versa
//DEBUG STUFF
var result;

//GENERAL STUFF
var TILE_SIZE = 25;
var TILE_SPACING = 0;
var TILE_SIZE_SPACED = TILE_SIZE + TILE_SPACING;
var BOARD_COLS;
var BOARD_ROWS;

var Direction = {
   N:  new Phaser.Point( 0, -1),
  NE:  new Phaser.Point( 1, -1),
   E:  new Phaser.Point( 1,  0),
  SE:  new Phaser.Point( 1,  1),
   S:  new Phaser.Point( 0,  1),
  SW:  new Phaser.Point(-1,  1),
   W:  new Phaser.Point(-1,  0),
  NW:  new Phaser.Point(-1, -1)
}

//KID STUFF

var kid;
var kidState;

var scareCountdown;
var followCountdown;
//TODO: probably shouldn't be global
var breatheIn;
var breatheOut;
var finalBreatheIn;
var finalBreatheOut;
var consider;
var stopConsidering;
var wander;

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

const PRECEDENCE_SCARE = 5;
const PRECEDENCE_SIGNCENTER = 3;
const PRECEDENCE_SIGNAROUND = 2;
const PRECEDENCE_NOTHINGTOSEE = 0;

var hauntedtreecursor;
var signcursor;
const CURSORMODE_HAUNTEDTREE = 0;
const CURSORMODE_SIGNPENDING = 1;
const CURSORMODE_SIGNDIRECTIONPICKING = 2;

var pendingSignLoc;


var kidDirection;
var lastSignKidSaw;

var TILEs;

//related to line drawing
var bmd;
var line;

function preload() {

    game.load.spritesheet("TILES", "assets/sprites/Grid.png", TILE_SIZE, TILE_SIZE);

    game.load.image('hauntedtree', 'assets/sprites/Haunted_Tree.png');
    game.load.image("grid", 'assets/sprites/Grid.png');
    game.load.atlas('kid_spritesheet', 'assets/sprites/kid_spritesheet.png', 'assets/sprites/kid_spritesheet.json');
    game.load.image('witch_hut_1', "assets/sprites/witch_hut_1.png");
    game.load.image('sign', "assets/sprites/Sign.png");
}



function clearLine() {
  bmd.clear();
}

function drawLine(){
  if (cursorMode == CURSORMODE_SIGNDIRECTIONPICKING) {



  var pendingSignPixelLoc = locationToPixelCenter(pendingSignLoc);
  line = new Phaser.Line(pendingSignPixelLoc.x, pendingSignPixelLoc.y, game.input.x, game.input.y);

  // bmd.clear();
  // bmd.ctx.beginPath();
  // bmd.ctx.moveTo(pendingSignPixelLoc.x, pendingSignPixelLoc.y);
  // bmd.ctx.lineTo(game.input.x, game.input.y);
  // bmd.ctx.lineWidth = 2;
  // bmd.ctx.stroke();
  // bmd.ctx.closePath();
  // bmd.render();

  //TODO: has to be a better way to do this

  //TODO: probably should be elsewhere
  cursorsprite.angle = snapAngleToCardinalDirection(Phaser.Math.radToDeg(line.angle));
  xMonitor = Phaser.Math.radToDeg(line.angle);
  yMonitor = Phaser.Math.radToDeg(line.angle);
}
  //bmd.refreshBuffer();
};

function create() {

    //BOARD SETUP
    game.stage.backgroundColor = 0x465243;
    spawnBoard();
    game.time.create();

    //KID SETUP
    kid = createKid(new Phaser.Point(28,10));

    //OTHER OBJECTS SETUP
    hauntedtrees = game.add.group();
    signs = game.add.group();

    bmd = game.add.bitmapData(BOARD_WIDTH,BOARD_HEIGHT);
    line = new Phaser.Line(0,0,0,0);
    var color = 'grey';
    //
    bmd.ctx.beginPath();
    bmd.ctx.lineWidth = "1";
    bmd.ctx.strokeStyle = color;
    bmd.alpha = .5;
    bmd.ctx.stroke();

    sprite = game.add.sprite(0, 0, bmd);

    setupCursors();




    //START GAME
    continueOnKid(kid);

    oneKey = game.input.keyboard.addKey(Phaser.Keyboard.ONE);
    oneKey.onDown.add(cursorModeHauntedTree, this);
    twoKey = game.input.keyboard.addKey(Phaser.Keyboard.TWO);
    twoKey.onDown.add(cursorModeSignPending, this);

    game.input.onDown.add(triggerClickEvent, this);
    game.input.onUp.add(triggerUpClickEvent, this);

}

function snapAngleToCardinalDirection(angle) {
  if (angle < 0) {
    angle = 360 + angle;
  }
  var result;

  var remainder = angle % 45;
  if (remainder > 45/2) {
    result = angle + (45 - remainder);
  } else {
    result = angle - (remainder);
  }

  return result;
}

function setupCursors() {
  //CURSOR SETUP
  cursors = game.input.keyboard.createCursorKeys();
  hauntedtreecursor = game.add.sprite(25, 25, 'hauntedtree');
  hauntedtreecursor.alpha = .3;
  hauntedtreecursor.anchor.x = .5;
  hauntedtreecursor.anchor.y = .5;

  signcursor = game.add.sprite(25, 35, 'sign');
  signcursor.alpha = .3;
  signcursor.anchor.x = .5;
  signcursor.anchor.y = .5;

  cursorsprite = hauntedtreecursor;
  cursorModeHauntedTree();
}

function triggerClickEvent() {
  switch (cursorMode) {
    case CURSORMODE_HAUNTEDTREE:
        tryToAdd(addHauntedTree, getCursorGridLoc);
        break;
    case CURSORMODE_SIGNPENDING:
      cursorModeSignDirectionPicking();
      cursorMode = CURSORMODE_SIGNDIRECTIONPICKING;
      break;
  }
}

function triggerUpClickEvent() {
  switch (cursorMode) {
    case CURSORMODE_SIGNDIRECTIONPICKING:
        tryToAdd(addSign, function() { return pendingSignLoc });
        clearLine();
        cursorModeSignPending();
        break;
  }
}

function cursorModeHauntedTree() {
  cursorsprite.alpha = 0;
  cursorMode = CURSORMODE_HAUNTEDTREE;
  cursorsprite = hauntedtreecursor;
  cursorsprite.alpha = .3;
}

function cursorModeSignPending() {
  cursorsprite.alpha = 0;
  cursorMode = CURSORMODE_SIGNPENDING;
  cursorsprite = signcursor;
  cursorsprite.scale.x = 1;
  cursorsprite.scale.y = 1;
  cursorsprite.alpha = .3;
}

function cursorModeSignDirectionPicking() {
  cursorsprite.alpha = 0;
  cursorMode = CURSORMODE_SIGNDIRECTIONPICKING;
  cursorsprite = signcursor;
  cursorsprite.alpha = .7;
  cursorsprite.scale.x = 2.5;
  cursorsprite.scale.y = 2.5;
  pendingSignLoc = getCursorGridLoc();
}

function tryToAdd(addFunction, whereToAddFunc) {
  var whereToAdd = whereToAddFunc.apply(this);
  if (! visibleToKid(whereToAdd)) {
    addFunction.apply(this, [whereToAdd]);
    return true;
  } else {
    return false;
  }
}

function getCursorGridLoc() {
  var cursorGridPosX = getGridPosSingle(game.input.mousePointer.x);
  var cursorGridPosY = getGridPosSingle(game.input.mousePointer.y);
  var cursorGridPos = new Phaser.Point(cursorGridPosX, cursorGridPosY);
  return cursorGridPos;
}

function visibleToKid(gridPositionInQuestion) {
  var kidGridPos = getGridPosOfObject(kid);
  var surroundingTiles = getSurroundingTiles(1, kidGridPos);
  var isVisibleToKid = false;
  for (tile of surroundingTiles) {
    var tileGridPos = getGridPosOfObject(tile);
    if (tileGridPos.x == gridPositionInQuestion.x && tileGridPos.y == gridPositionInQuestion.y) {
      isVisibleToKid = true;
      break;
    }
  }
  return isVisibleToKid;
}

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDirection() {
  return new Phaser.Point(getRandomIntInclusive(-1, 1), getRandomIntInclusive(-1, 1));
}

function setSignDirection(sign, dir) {
  sign.direction = dir;
//sign points right by default, so we start with E as 0
if (dir.equals(Direction.E)) { sign.angle = 0; } else if
(dir.equals(Direction.SE)) { sign.angle = 45; } else if
(dir.equals(Direction.S)) { sign.angle = 90; } else if
(dir.equals(Direction.SW)) { sign.angle = 135; } else if
(dir.equals(Direction.W)) { sign.angle = 180; } else if
(dir.equals(Direction.NW)) { sign.angle = 225; } else if
(dir.equals(Direction.N)) { sign.angle = 270; } else if
(dir.equals(Direction.NE)) { sign.angle = 315; }
}

function angleToDirection(unSnappedAngle) {
  var angle = snapAngleToCardinalDirection(unSnappedAngle);
  switch(angle) {
    case 0:
    return Direction.E;
    case 45:
    return Direction.SE;
    case 90:
    return Direction.S;
    case 135:
    return Direction.SW;
    case 180:
    return Direction.W;
    case 225:
    return Direction.NW;
    case 270:
    return Direction.N;
    case 315:
    return Direction.NE;
    default:
    log("Defaulted in angleToDirection");
    return Direction.E;
  }
}

function addSign(gridPositionToAddTo) {

    var sign = signs.create(0, 0, 'sign');
    sign.anchor.x = .5;
    sign.anchor.y = .5;
    setGridLocation(sign, gridPositionToAddTo);
    sign.name = 'sign';
    //TODO: Angle handling here is a bit of a hack
    setSignDirection(sign, angleToDirection(cursorsprite.angle));


    //listen to surrounding tiles

    var surroundingTiles = getSurroundingTiles(1, getGridPosOfObject(sign));
    log("Adding sign around " + getGridPosOfObject(sign).x + ", " + getGridPosOfObject(sign).y + ".");
    for (tile of surroundingTiles) {
      if (getGridPosOfObject(tile).equals(getGridPosOfObject(sign))) {
        tile.onVisit.add(seeSign, this, PRECEDENCE_SIGNCENTER, kid, sign, tile);
    } else {
        tile.onVisit.add(seeSign, this, PRECEDENCE_SIGNAROUND, kid, sign, tile);
    }
    }
}

function addHauntedTree(gridPositionToAddTo) {
  var hauntedtree = hauntedtrees.create(0, 0, 'hauntedtree');
  hauntedtree.anchor.x = .5;
  hauntedtree.anchor.y = .5;
  setGridLocation(hauntedtree, gridPositionToAddTo);
  hauntedtree.name = 'hauntedtree';

  //listen to surrounding tiles

  var surroundingTiles = getSurroundingTiles(1, getGridPosOfObject(hauntedtree));
  log("Adding around " + getGridPosOfObject(hauntedtree).x + ", " + getGridPosOfObject(hauntedtree).y + ".");
  for (tile of surroundingTiles) {
    tile.onVisit.add(scare, this, PRECEDENCE_SCARE, kid, hauntedtree, tile);
  }
}

//TODO: Figure out why these first 3 variables are put into the function
function seeSign(context, kidforsomereason, tileforsomereason, visitingKid, sign, visitedTile) {
      var signRelativeToKid = Phaser.Point.subtract(getGridPosOfObject(sign), kidGridLocation(kid));
      if (kidState == STATE_SIGNAPPROACHING && sign == lastSignKidSaw && signRelativeToKid.equals(new Phaser.Point(0,0))) {
        //Kid is seeing the sign he was approaching, at his current location
        kidReadSign(kid, sign);
        visitedTile.onVisit.halt();
      } else if (sign != lastSignKidSaw) {
      //TODO: Should this be here or in the function below?
      var newDirection = signRelativeToKid;
      kidDirection = newDirection;
      kidNoticeSign(kid, sign);
      visitedTile.onVisit.halt();
      }
      //prevents other lower priority actions from taking effect
    }

function kidLookWandering(kid) {
  wander = game.add.tween(kid.scale);
  wander.to({x: .25, y: .25}, 100, Phaser.Easing.Sinusoidal.In);
  wander.start();
}

function scare(context, kidforsomereason, tileforsomereason, visitingKid, hauntedTree, visitedTile) {
  //TODO: Figure out why these first 3 variables are put into the function
  var kidRelativeToTree = Phaser.Point.subtract(kidGridLocation(kid), getGridPosOfObject(hauntedTree));
  var newDirection = kidRelativeToTree;
  kidDirection = newDirection;
  kidBecomeScared(kid);
    //prevents other lower priority actions from taking effect
  //TODO: Handle simultaneous scare corner case (overlapping scare areas of two trees)
  visitedTile.onVisit.halt();
}

function kidBecomeScared(kid) {


  stopAllAnimations();
  kidState = STATE_SCAREDSEEING;

  kid.frameName = 'ScaredKid.png';
  var jumpUp = game.add.tween(kid.scale);
  var jumpDown = game.add.tween(kid.scale);
  jumpUp.to({x: .35, y: .35}, 130, Phaser.Easing.Linear.None);
  jumpDown.to({x: .25, y: .25}, 130, Phaser.Easing.Linear.None);
  jumpUp.chain(jumpDown);

  jumpDown.onComplete.add(function() {
      kidState = STATE_SCAREDRUNNING;

      lookBreatheHeavily();
      scareCountdown = 3;
      continueOnKid(kid);
      }
  );

  jumpUp.start();
}

function kidNoticeSign(kid, sign) {
  stopAllAnimations();
  kidState = STATE_SIGNSEEING;
  kidLookConsidering(kid);
  game.time.events.add(600, function() {
    if (getGridPosOfObject(kid).equals(getGridPosOfObject(sign))) {
      kidReadSign(kid, sign);
    } else {
      kidApproachSign(kid, sign);
    }
   },
    this);
}

//TODO: Test side by side signs pointing at each other
function kidApproachSign(kid, sign) {
  kidState = STATE_SIGNAPPROACHING;
  lastSignKidSaw = sign;
  kidLookConsidering(kid);
  continueOnKid(kid);
}

function kidReadSign(kid, sign) {
  stopAllAnimations();
  kidState = STATE_SIGNREADING;
  kidLookConsidering(kid);
  game.time.events.add(600, function() {
    kidState = STATE_SIGNFOLLOWING;
    followCountdown = 2;
    log("Kid should be following sign");
    kidFaceSignDirection(kid, sign);
    kidLookWandering(kid);
    continueOnKid(kid);
   },
    this);
}

function kidFaceSignDirection(kid, sign) {
  //TODO: Make this real.
  kidDirection = sign.direction;
}

function lookBreatheHeavily() {
  //breathe heavily
  breatheIn = game.add.tween(kid.scale);
  breatheOut = game.add.tween(kid.scale);
  breatheIn.to({x: .30, y: .30}, 320, Phaser.Easing.Sinusoidal.In);
 breatheOut.to({x: .25, y: .25},320, Phaser.Easing.Sinusoidal.Out);
  breatheIn.chain(breatheOut);
  breatheOut.onComplete.add(lookBreatheHeavily);
  breatheIn.start();
  log("Breathing heavily");
}

function lookStopBreathingHeavily() {
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
  lookStopBreathingHeavily();
  kidState = STATE_WANDERING;
  kid.frameName = "NormalKid.png";
}

function kidStopFollowing(kid) {
  kidState = STATE_WANDERING;
  kid.frameName = "NormalKid.png";
  lastSignKidSaw = null;
}

function stopAllAnimations() {
  //TODO: Probably better way to do this
  if (null != breatheIn) {
    breatheIn.stop();
  }
    if (null != breatheOut) {
  breatheOut.stop();
}
  if (null != finalBreatheIn) {
  finalBreatheIn.stop();
}
  if (null != finalBreatheOut) {
  finalBreatheOut.stop();
}
  if (null != consider) {
  consider.stop();
}
  if (null != stopConsidering) {
  stopConsidering.stop();
}
}

function considerHowToDealWithWall(kid, whereToMove) {
  kidLookConsidering(kid);

  game.time.events.add(600, function() {
    decideOnDirectionAndMove(kid, whereToMove);
   },
    this);
}

function kidLookConsidering(kid) {
    consider = game.add.tween(kid.scale);
    consider.to({x: .25, y: .22}, 80, Phaser.Easing.Linear.None);
    consider.start();
}

function lookDecidedOnDirection() {
    stopConsidering = game.add.tween(kid.scale);
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
  if (kidState == STATE_SIGNFOLLOWING && followCountdown == 0) {
    kidStopFollowing(kid);
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
    case STATE_SIGNAPPROACHING:
      log("Approaching...");
      if (getGridPosOfObject(kid).equals(getGridPosOfObject(lastSignKidSaw))) {
        kidReadSign(kid);
      } else {
        var whereToMove = Phaser.Point.add(kidGridLocation(kid), kidDirection);
        moveTo(kid, whereToMove, NORMAL_MOVE_SPEED);
      }
      break;
    case STATE_SIGNFOLLOWING:
      log("Following...");
      followCountdown --;
      var whereToMove = Phaser.Point.add(kidGridLocation(kid), kidDirection);
      if (willHitEdge(kid, whereToMove)) {
        considerHowToDealWithWall(kid, whereToMove);
      } else {
        moveTo(kid, whereToMove, NORMAL_MOVE_SPEED);
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
  kidDirection = Direction.SW;
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


var xMonitor;
var yMonitor;

function update() {
  //TODO: This probably should be refactored somehow (too specific to sign)
  if (cursorMode != CURSORMODE_SIGNDIRECTIONPICKING) {
  var newCursorLoc = pixelToGridCenter(new Phaser.Point(game.input.mousePointer.x, game.input.mousePointer.y));
  cursorsprite.x = newCursorLoc.x;
  cursorsprite.y = newCursorLoc.y;
  //xMonitor =  game.input.mousePointer.x;
  //yMonitor = newCursorLoc.y;

}

  drawLine();
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
  log(xMonitor + ", " + yMonitor + " ... ;");

  //TODO: Gotta be a better way to do this
  if (cursorMode == CURSORMODE_SIGNDIRECTIONPICKING) {
    //game.debug.geom(line);
    game.debug.lineInfo(line, 32, 32);
  }
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
            TILE.onVisit.add(continueOn, this, PRECEDENCE_NOTHINGTOSEE, TILE);
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
  //xMonitor = coordinate.x;
  //yMonitor = coordinate.y;
  return new Phaser.Point(Math.floor(coordinate.x/TILE_SIZE), Math.floor(coordinate.y/TILE_SIZE));
}

function pixelToGridCenter(pixelLocation) {
  return locationToPixelCenter(getGridPosOfPixel(pixelLocation));
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
