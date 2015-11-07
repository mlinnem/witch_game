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

var NORMAL_MOVE_SPEED = 15;
var SCARED_MOVE_SPEED = 35;

const STATE_NORMAL = 0;
const STATE_SCAREDSEEING = 5;
const STATE_SCAREDRUNNING = 1;
const STATE_SIGNSEEING = 6;
const STATE_SIGNAPPROACHING = 2;
const STATE_SIGNREADING = 3;
const STATE_SIGNFOLLOWING = 4;

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
    kid = createKid(new Phaser.Point(0,0));

    hauntedtrees = game.add.group();

    game.input.onDown.add(addHauntedTree, this);

    cursors = game.input.keyboard.createCursorKeys();
    hauntedtreecursor = game.add.sprite(0, 0, 'hauntedtree');
    hauntedtreecursor.alpha = .3;
    cursorsprite = hauntedtreecursor;

    continueOnKid(kid);
}

function addHauntedTree() {
    var cursorGridPosX = getGridPosSingle(game.input.mousePointer.x);
    var cursorGridPosY = getGridPosSingle(game.input.mousePointer.y);

    var spritePixelTopLeft = locationToPixelTopLeft(new Phaser.Point(cursorGridPosX, cursorGridPosY));
    var hauntedtree = hauntedtrees.create(0, 0, 'hauntedtree');
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
      moveTo(kid, Phaser.Point.add(kidGridLocation(kid),kidDirection));
      //prevents other lower priority actions from taking effect
      //TODO: Handle simultaneous scare corner case (overlapping scare areas of two trees)
      visitedTile.onVisit.halt();
}

function continueOn(the_this, visitingKid, visitedTile) {
  //Will redirect to that speciic kid's continue on function if this is ever object oriented
  continueOnKid(visitingKid);
}

function continueOnKid(kid) {
moveTo(kid, Phaser.Point.add(kidGridLocation(kid), kidDirection));
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
  kidState = "Wandering";
  kidDirection = DIRECTION_SE;
  setGridLocation(kid, location);
  return kid;
}

function setGridLocation(thing, gridLocation) {
  var pixelLocation = locationToPixelTopLeft(gridLocation);
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
  return new Phaser.Point(tile.x + TILE_SIZE / 2, tile.y + TILE_SIZE / 2);
}


function update() {
  cursorsprite.x = lockToGrid(game.input.mousePointer.x);
  cursorsprite.y = lockToGrid(game.input.mousePointer.y);
}

function moveTo(kid, gridLoc) {
  var tile = getTILE(gridLoc);
  var move = game.add.tween(kid);
  var kidCenterOffset = TILE_SIZE / 2; //Need to offset since we're moving x and y, not kid center to tile
  move.to({x: spriteCenter(tile).x - kidCenterOffset, y: spriteCenter(tile).y - kidCenterOffset}, 2000, Phaser.Easing.Linear.None);
  move.onComplete.addOnce(kidReactToSurroundings, this, kid, tile);
  move.start();
  log("kid moving to " + getGridPosOfObject(tile).x + ", " + getGridPosOfObject(tile).y);
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

function checkKidMoved(kid) {

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
            var TILE = TILEs.create(i * TILE_SIZE_SPACED, j * TILE_SIZE_SPACED, "TILES");
            TILE.name = 'TILE' + i.toString() + 'x' + j.toString();
            TILE.inputEnabled = true;
            TILE.onVisit = new Phaser.Signal();
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

    TILE.posX = posX;
    TILE.posY = posY;
    TILE.id = calcTILEId(posX, posY);

}

// the TILE id is used by getTILE() to find specific TILEs in the group
// each position on the board has a unique id
function calcTILEId(posX, posY) {

    return posX + posY * BOARD_COLS;

}
