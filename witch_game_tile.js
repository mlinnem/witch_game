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


const DIRECTION_N = 0;
const DIRECTION_NE = 1;
const DIRECTION_E = 2;
const DIRECTION_SE = 3;
const DIRECTION_S = 4;
const DIRECTION_SW = 5;
const DIRECTION_W = 6;
const DIRECTION_NW = 7;

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
    game.stage.backgroundColor = 0x465243;
    game.physics.startSystem(Phaser.Physics.ARCADE);
    // fill the screen with as many TILEs as possible
    spawnBoard();

    kid = createKid(8,8);

    // currently selected TILE starting position. used to stop player form moving TILEs too far.
    selectedTILEStartPos = { x: 0, y: 0 };


    hauntedtrees = game.add.group();

    game.input.onDown.add(addHauntedTree, this);

    //game.input.addMoveCallback(slideTILE, this);

    cursors = game.input.keyboard.createCursorKeys();
    hauntedtreecursor = game.add.sprite(0, 0, 'hauntedtree');
    hauntedtreecursor.alpha = .3;
    cursorsprite = hauntedtreecursor;

}

function addHauntedTree() {
    var cursorTILEPosX = getTILEPos(game.input.mousePointer.x);
    var cursorTILEPosY = getTILEPos(game.input.mousePointer.y);

    var spriteX = game.input.mousePointer.x - (game.input.mousePointer.x % TILE_SIZE);
    var spriteY = game.input.mousePointer.y - (game.input.mousePointer.y % TILE_SIZE);

    var hauntedtree = hauntedtrees.create(spriteX, spriteY, 'hauntedtree');
    hauntedtree.gridX = cursorTILEPosX;
    hauntedtree.gridY = cursorTILEPosY;
    hauntedtree.name = 'hauntedtree';

    //listen to surrounding tiles

    var surroundingTiles = getSurroundingTiles(1, hauntedtree.gridX, hauntedtree.gridY);
    for (tile of surroundingTiles) {
      tile.onVisit.add(scare, this, 0, hauntedtree);
    }
}

function scare(visitingKid, hauntedTree) {
      result = "SCARE ENACTED!";
      var diffX = kid.gridX - hauntedTree.gridX;
      var diffY = kid.gridY - hauntedTree.gridY;
      if (diffX == -1 && diffY == -1) {
        //Kid is on NW side of tree
        setDirection(kid, DIRECTION_NW);
      }
      else if (diffX == 1 && diffY == 1) {
        //Kid is on SE side of tree
        setDirection(kid,DIRECTION_SE);
        result = "MOVE IT SE!";
      }

      // kid.x = lockToGrid(kid.x + kid.body.halfWidth);
      // kid.y = lockToGrid(kid.y + kid.body.halfWidth);
      // kid.body.velocity.setTo(SCARED_MOVE_SPEED * x, SCARED_MOVE_SPEED * y);
      // kid.body.velocity.setMagnitude(SCARED_MOVE_SPEED);
      // result = "" + x + "" + y;
      // kid.frameName = 'Kid_Scared';
      // kidState = "Scared";
      // if (backToNormalEvent != null) {
      //     game.time.events.remove(backToNormalEvent);
      //     backToNormalEvent == null;
      // }
      // backToNormalEvent = game.time.events.add(Phaser.Timer.SECOND * 3, backToNormal, this);

}

function getSurroundingTiles(distance, x, y) {
  var surroundingTiles = [];
  for (var i = distance * -1; i <= distance; i++) {
    for (var j = distance * -1; j <= distance; j++) {
      var possibleTile = getTILE(x + i, y + j);
      if (possibleTile != null) {
        surroundingTiles.push(possibleTile);
      }
    }
  }
  return surroundingTiles;
}

function createKid(tileX, tileY) {
  var kid = game.add.sprite(0, 0, 'kid_spritesheet', 'Kid_Normal');
  kidState = "Normal";
  game.physics.enable(kid, Phaser.Physics.ARCADE);
  kid.body.x = tileX * TILE_SIZE;
  kid.body.y = tileY * TILE_SIZE;
  kid.body.setSize(25, 25, 50, 50);
  kid.gridX = tileX;
  kid.gridY = tileY;
  setDirection(kid, DIRECTION_SE);
  return kid;
}

function update() {
  cursorsprite.x = lockToGrid(game.input.mousePointer.x);
  cursorsprite.y = lockToGrid(game.input.mousePointer.y);

  if (null != kid.body) {
  kidActualTileX = getTILEPos(kid.body.center.x);
  kidActualTileY = getTILEPos(kid.body.center.y);

  if (kid.gridX != kidActualTileX || kid.gridY != kidActualTileY) {
    kid.gridX = kidActualTileX;
    kid.gridY = kidActualTileY;

    var tileMovedInto = getTILE(kid.gridX, kid.gridY);
    tileMovedInto.onVisit.dispatch(kid);
    result = "" + kid.gridX + ", " + kid.gridY
  }
  }

  //result = "" + cursorsprite.x + ", " + cursorsprite.y;
}

function setDirection(kid, direction) {
  switch (direction) {
    case DIRECTION_SE:
      kid.body.velocity.setTo(NORMAL_MOVE_SPEED, NORMAL_MOVE_SPEED);
      kid.body.velocity.setMagnitude(NORMAL_MOVE_SPEED);
      kidDirection = DIRECTION_SE;
      break;
    case DIRECTION_NW:
      kid.body.velocity.setTo(-NORMAL_MOVE_SPEED, -NORMAL_MOVE_SPEED);
      kid.body.velocity.setMagnitude(NORMAL_MOVE_SPEED);
      kidDirection = DIRECTION_NW;
      break;
  }
}

function render() {
  game.debug.spriteInfo(kid, 32,32);
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
            //TILE.events.onInputDown.add(selectTILE, this);
            //TILE.events.onInputUp.add(releaseTILE, this);
            //randomizeTILEColor(TILE);
            setTILEPos(TILE, i, j); // each TILE has a position on the board
        }
    }

}

// find a TILE on the board according to its position on the board
function getTILE(posX, posY) {

    return TILEs.iterate("id", calcTILEId(posX, posY), Phaser.Group.RETURN_CHILD);

}

// convert world coordinates to board position
function getTILEPos(coordinate) {

    return Math.floor(coordinate / TILE_SIZE_SPACED);

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

// // select a TILE and remember its starting position
// function selectTILE(TILE, pointer) {
//
//     if (allowInput)
//     {
//         console.log('selectedTILE', TILE);
//         selectedTILE = TILE;
//         selectedTILEStartPos.x = TILE.posX;
//         selectedTILEStartPos.y = TILE.posY;
//     }
//
// }


// // since the TILEs are a spritesheet, their color is the same as the current frame number
// function getTILEColor(TILE) {
//
//     return TILE.frame;
//
// }

// // set the TILE spritesheet to a random frame
// function randomizeTILEColor(TILE) {
//
//     TILE.frame = game.rnd.integerInRange(0, TILE.animations.frameTotal - 1);
//
// }

// // TILEs can only be moved 1 square up/down or left/right
// function checkIfTILECanBeMovedHere(fromPosX, fromPosY, toPosX, toPosY) {
//
//     if (toPosX < 0 || toPosX >= BOARD_COLS || toPosY < 0 || toPosY >= BOARD_ROWS)
//     {
//         return false;
//     }
//
//     if (fromPosX === toPosX && fromPosY >= toPosY - 1 && fromPosY <= toPosY + 1)
//     {
//         return true;
//     }
//
//     if (fromPosY === toPosY && fromPosX >= toPosX - 1 && fromPosX <= toPosX + 1)
//     {
//         return true;
//     }
//
//     return false;
// }
//
// // count how many TILEs of the same color lie in a given direction
// // eg if moveX=1 and moveY=0, it will count how many TILEs of the same color lie to the right of the TILE
// // stops counting as soon as a TILE of a different color or the board end is encountered
// function countSameColorTILEs(startTILE, moveX, moveY) {
//
//     var curX = startTILE.posX + moveX;
//     var curY = startTILE.posY + moveY;
//     var count = 0;
//
//     while (curX >= 0 && curY >= 0 && curX < BOARD_COLS && curY < BOARD_ROWS && getTILEColor(getTILE(curX, curY)) === getTILEColor(startTILE))
//     {
//         count++;
//         curX += moveX;
//         curY += moveY;
//     }
//
//     return count;
//
// }
//
// // swap the position of 2 TILEs when the player drags the selected TILE into a new location
// function swapTILEPosition(TILE1, TILE2) {
//
//     var tempPosX = TILE1.posX;
//     var tempPosY = TILE1.posY;
//     setTILEPos(TILE1, TILE2.posX, TILE2.posY);
//     setTILEPos(TILE2, tempPosX, tempPosY);
//
// }
//
// // count how many TILEs of the same color are above, below, to the left and right
// // if there are more than 3 matched horizontally or vertically, kill those TILEs
// // if no match was made, move the TILEs back into their starting positions
// function checkAndKillTILEMatches(TILE, matchedTILEs) {
//
//     if (TILE !== null)
//     {
//         var countUp = countSameColorTILEs(TILE, 0, -1);
//         var countDown = countSameColorTILEs(TILE, 0, 1);
//         var countLeft = countSameColorTILEs(TILE, -1, 0);
//         var countRight = countSameColorTILEs(TILE, 1, 0);
//
//         var countHoriz = countLeft + countRight + 1;
//         var countVert = countUp + countDown + 1;
//
//         if (countVert >= MATCH_MIN)
//         {
//             killTILERange(TILE.posX, TILE.posY - countUp, TILE.posX, TILE.posY + countDown);
//         }
//
//         if (countHoriz >= MATCH_MIN)
//         {
//             killTILERange(TILE.posX - countLeft, TILE.posY, TILE.posX + countRight, TILE.posY);
//         }
//
//         if (countVert < MATCH_MIN && countHoriz < MATCH_MIN)
//         {
//             if (TILE.posX !== selectedTILEStartPos.x || TILE.posY !== selectedTILEStartPos.y)
//             {
//                 if (selectedTILETween !== null)
//                 {
//                     game.tweens.remove(selectedTILETween);
//                 }
//
//                 selectedTILETween = tweenTILEPos(TILE, selectedTILEStartPos.x, selectedTILEStartPos.y);
//
//                 if (tempShiftedTILE !== null)
//                 {
//                     tweenTILEPos(tempShiftedTILE, TILE.posX, TILE.posY);
//                 }
//
//                 swapTILEPosition(TILE, tempShiftedTILE);
//             }
//         }
//     }
//
// }
//
// // kill all TILEs from a starting position to an end position
// function killTILERange(fromX, fromY, toX, toY) {
//
//     fromX = Phaser.Math.clamp(fromX, 0, BOARD_COLS - 1);
//     fromY = Phaser.Math.clamp(fromY , 0, BOARD_ROWS - 1);
//     toX = Phaser.Math.clamp(toX, 0, BOARD_COLS - 1);
//     toY = Phaser.Math.clamp(toY, 0, BOARD_ROWS - 1);
//
//     for (var i = fromX; i <= toX; i++)
//     {
//         for (var j = fromY; j <= toY; j++)
//         {
//             var TILE = getTILE(i, j);
//             TILE.kill();
//         }
//     }
//
// }
//
// // move TILEs that have been killed off the board
// function removeKilledTILEs() {
//
//     TILEs.forEach(function(TILE) {
//         if (!TILE.alive) {
//             setTILEPos(TILE, -1,-1);
//         }
//     });
//
// }
//
// // animated TILE movement
// function tweenTILEPos(TILE, newPosX, newPosY, durationMultiplier) {
//
//     if (durationMultiplier === null || typeof durationMultiplier === 'undefined')
//     {
//         durationMultiplier = 1;
//     }
//
//     return game.add.tween(TILE).to({x: newPosX  * TILE_SIZE_SPACED, y: newPosY * TILE_SIZE_SPACED}, 100 * durationMultiplier, Phaser.Easing.Linear.None, true);
//
// }
//
// // look for TILEs with empty space beneath them and move them down
// function dropTILEs() {
//
//     var dropRowCountMax = 0;
//
//     for (var i = 0; i < BOARD_COLS; i++)
//     {
//         var dropRowCount = 0;
//
//         for (var j = BOARD_ROWS - 1; j >= 0; j--)
//         {
//             var TILE = getTILE(i, j);
//
//             if (TILE === null)
//             {
//                 dropRowCount++;
//             }
//             else if (dropRowCount > 0)
//             {
//                 setTILEPos(TILE, TILE.posX, TILE.posY + dropRowCount);
//                 tweenTILEPos(TILE, TILE.posX, TILE.posY, dropRowCount);
//             }
//         }
//
//         dropRowCountMax = Math.max(dropRowCount, dropRowCountMax);
//     }
//
//     return dropRowCountMax;
//
// }
//
// // look for any empty spots on the board and spawn new TILEs in their place that fall down from above
// function refillBoard() {
//
//     var maxTILEsMissingFromCol = 0;
//
//     for (var i = 0; i < BOARD_COLS; i++)
//     {
//         var TILEsMissingFromCol = 0;
//
//         for (var j = BOARD_ROWS - 1; j >= 0; j--)
//         {
//             var TILE = getTILE(i, j);
//
//             if (TILE === null)
//             {
//                 TILEsMissingFromCol++;
//                 TILE = TILEs.getFirstDead();
//                 TILE.reset(i * TILE_SIZE_SPACED, -TILEsMissingFromCol * TILE_SIZE_SPACED);
//                 randomizeTILEColor(TILE);
//                 setTILEPos(TILE, i, j);
//                 tweenTILEPos(TILE, TILE.posX, TILE.posY, TILEsMissingFromCol * 2);
//             }
//         }
//
//         maxTILEsMissingFromCol = Math.max(maxTILEsMissingFromCol, TILEsMissingFromCol);
//     }
//
//     game.time.events.add(maxTILEsMissingFromCol * 2 * 100, boardRefilled);
//
// }
//
// // when the board has finished refilling, re-enable player input
// function boardRefilled() {
//
//     allowInput = true;
//
// }


// function releaseTILE(selectedTILE) {
//
//     console.log('up from', selectedTILE);
//
//     // when the mouse is released with a TILE selected
//     // 1) check for matches
//     // 2) remove matched TILEs
//     // 3) drop down TILEs above removed TILEs
//     // 4) refill the board
//
//     checkAndKillTILEMatches(selectedTILE);
//
//     if (tempShiftedTILE !== null)
//     {
//         checkAndKillTILEMatches(tempShiftedTILE);
//     }
//
//     removeKilledTILEs();
//
//     var dropTILEDuration = dropTILEs();
//
//     // delay board refilling until all existing TILEs have dropped down
//     game.time.events.add(dropTILEDuration * 100, refillBoard);
//
//     allowInput = false;
//
//     selectedTILE = null;
//     tempShiftedTILE = null;
//
// }
//
// function slideTILE(pointer, x, y, fromClick) {
//
//     // check if a selected TILE should be moved and do it
//
//     if (selectedTILE && pointer.isDown)
//     {
//         var cursorTILEPosX = getTILEPos(x);
//         var cursorTILEPosY = getTILEPos(y);
//
//         if (checkIfTILECanBeMovedHere(selectedTILEStartPos.x, selectedTILEStartPos.y, cursorTILEPosX, cursorTILEPosY))
//         {
//             if (cursorTILEPosX !== selectedTILE.posX || cursorTILEPosY !== selectedTILE.posY)
//             {
//                 // move currently selected TILE
//                 if (selectedTILETween !== null)
//                 {
//                     game.tweens.remove(selectedTILETween);
//                 }
//
//                 selectedTILETween = tweenTILEPos(selectedTILE, cursorTILEPosX, cursorTILEPosY);
//
//                 TILEs.bringToTop(selectedTILE);
//
//                 // if we moved a TILE to make way for the selected TILE earlier, move it back into its starting position
//                 if (tempShiftedTILE !== null)
//                 {
//                     tweenTILEPos(tempShiftedTILE, selectedTILE.posX , selectedTILE.posY);
//                     swapTILEPosition(selectedTILE, tempShiftedTILE);
//                 }
//
//                 // when the player moves the selected TILE, we need to swap the position of the selected TILE with the TILE currently in that position
//                 tempShiftedTILE = getTILE(cursorTILEPosX, cursorTILEPosY);
//
//                 if (tempShiftedTILE === selectedTILE)
//                 {
//                     tempShiftedTILE = null;
//                 }
//                 else
//                 {
//                     tweenTILEPos(tempShiftedTILE, selectedTILE.posX, selectedTILE.posY);
//                     swapTILEPosition(selectedTILE, tempShiftedTILE);
//                 }
//             }
//         }
//     }
// }
