window.onload = function () {
    var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });
    function preload() {
        game.load.image('hauntedtree', 'assets/sprites/Haunted_Tree.png');
        game.load.image("grid", 'assets/sprites/Grid.png');
        game.load.atlas('kid_spritesheet', 'assets/sprites/kid_spritesheet.png', 'assets/sprites/kid_spritesheet.json');
        game.load.image('witch_hut_1', "assets/sprites/witch_hut_1.png");
        game.load.image('sign', "assets/sprites/Sign.png");
    }
    var NORMAL_MOVE_SPEED = 15;
    var SCARED_MOVE_SPEED = 35;

    var GRID_SIZE = 25;
    var BOARD_COLS;
    var BOARD_ROWS;

    var kid;
    var kidState;
    const STATE_NORMAL = 0;
    const STATE_SCAREDSEEING = 5;
    const STATE_SCAREDRUNNING = 1;
    const STATE_SIGNSEEING = 6;
    const STATE_SIGNAPPROACHING = 2;
    const STATE_SIGNREADING = 3;
    const STATE_SIGNFOLLOWING = 4;

    var kidDirection;

    const DIRECTION_N = 0;
    const DIRECTION_NE = 1;
    const DIRECTION_E = 2;
    const DIRECTION_SE = 3;
    const DIRECTION_S = 4;
    const DIRECTION_SW = 5;
    const DIRECTION_W = 6;
    const DIRECTION_NW = 7;

    var hauntedtrees;
    var witch_hut_1;
    var cursors;
    var cursorsprite;
    var hauntedtreecursor;
    var result;
    var backToNormalEvent;
    var backgroundSprite;
    var signs;

    var collisionCount: number;

    var lockedX;
    var lockedY;
    var lockedSignX;
    var lockedSignY;

    function create() {
        collisionCount = 0;
        //game.physics.startSystem(Phaser.Physics.ARCADE);
        game.stage.backgroundColor = 0x465243;
        backgroundSprite = game.add.tileSprite(0, 0, game.width, game.height, 'grid');
        backgroundSprite.alpha = 0.4;
        kid = game.add.sprite(400, 300, 'kid_spritesheet', 'Kid_Normal');
        kidState = "Normal";
      //  game.physics.enable(kid, Phaser.Physics.ARCADE);
        kid.body.collideWorldBounds = true;
        kid.body.setSize(25, 25, 50, 50);
        kid.body.velocity.setTo(20, 20);
        kid.body.velocity.setMagnitude(NORMAL_MOVE_SPEED);
        witch_hut_1 = game.add.sprite(600, 400, 'witch_hut_1');
        //game.physics.enable(witch_hut_1, Phaser.Physics.ARCADE);
        witch_hut_1.body.immovable = true;

        hauntedtrees = game.add.group();
        hauntedtrees.enableBody = true;

        signs = game.add.group();
        signs.enableBody = true;

        cursors = game.input.keyboard.createCursorKeys();
        hauntedtreecursor = game.add.sprite(0, 0, 'hauntedtree');
        hauntedtreecursor.alpha = .3;
        cursorsprite = hauntedtreecursor;

        //TODO: Add sign cursor stuff, different sign modes

        game.input.onDown.add(addHauntedTree, this);
    }
    function addHauntedTree() {
        var cursorTILEPosX = getTILEPos(game.input.mousePointer.x);
        var cursorTILEPosY = getTILEPos(game.input.mousePointer.y);

        var x = game.input.mousePointer.x - (game.input.mousePointer.x % GRID_SIZE);
        var y = game.input.mousePointer.y - (game.input.mousePointer.y % GRID_SIZE);
        var hauntedtree = hauntedtrees.create(x, y, 'hauntedtree');
        hauntedtree.name = 'hauntedtree';
        hauntedtree.body.moves = false;
        hauntedtree.body.setSize(27, 27, -1, -1);
    }

    function addSign() {
        var x = game.input.mousePointer.x - (game.input.mousePointer.x % GRID_SIZE);
        var y = game.input.mousePointer.y - (game.input.mousePointer.y % GRID_SIZE);
        var sign = signs.create(x, y, 'sign');
        sign.name = 'sign';
        sign.body.moves = false;
        sign.body.setSize(27, 27, -1, -1);
        sign.body.customSeparateX = true;
        sign.body.customSeparateY = true;
    }

    // fill the screen with as many TILEs as possible
function spawnBoard() {

    BOARD_COLS = Phaser.Math.floor(game.world.width / GRID_SIZE);
    BOARD_ROWS = Phaser.Math.floor(game.world.height / GRID_SIZE);

    tiles = game.add.group();

    for (var i = 0; i < BOARD_COLS; i++)
    {
        for (var j = 0; j < BOARD_ROWS; j++)
        {
            var tile = tiles.create(i * GRID_SIZE, j * GRID_SIZE, "TILES");
            tile.name = 'tile' + i.toString() + 'x' + j.toString();
            tile.inputEnabled = true;
          //  tile.events.onInputDown.add(selectTILE, this);
          //  tile.events.onInputUp.add(releaseTILE, this);
            setTilePos(TILE, i, j); // each TILE has a position on the board
        }
    }

}

    function update() {

        //check to see if kid should change behavior
          //is kid in range of something that would change it, based on his current state?
          //if so, change it
        //execute behavior

        game.physics.arcade.collide(kid, witch_hut_1, hutCollisionHandler);
        game.physics.arcade.collide(kid, hauntedtrees, treeCollisionHandler);
        game.physics.arcade.collide(kid, signs, signCollisionHandler);
        cursorsprite.x = lockToGrid(game.input.mousePointer.x);
        cursorsprite.y = lockToGrid(game.input.mousePointer.y);
        log("" + cursorsprite.x + "  ,  " + "" + cursorsprite.y);
    }
    function hutCollisionHandler(kid, hut) {
        var diffX = kid.body.center.x - hut.body.center.x;
        var diffY = kid.body.center.y - hut.body.center.y;
        var x = 0;
        var y = 0;
        if (diffX > 0) {
            x = -1;
        }
        if (diffX <= 0) {
            x = 1;
        }
        if (diffY > 0) {
            y = -1;
        }
        if (diffY <= 0) {
            y = 1;
        }
        kid.body.velocity.setTo(NORMAL_MOVE_SPEED * x, NORMAL_MOVE_SPEED * y);
        kid.body.velocity.setMagnitude(NORMAL_MOVE_SPEED);
        log("" + x + "  ,  " + "" + y);
    }
    function treeCollisionHandler(kid, hauntedTree) {
        var diffX = kid.body.center.x - hauntedTree.body.center.x;
        var diffY = kid.body.center.y - hauntedTree.body.center.y;
        var x = 0;
        var y = 0;
        if (diffX > (GRID_SIZE / 2)) {
            x = 1;
        }
        if (diffX < -(GRID_SIZE / 2)) {
            x = -1;
        }
        if (diffY > (GRID_SIZE / 2)) {
            y = -1;
        }
        if (diffY < -(GRID_SIZE / 2)) {
            y = 1;
        }
        kid.x = lockToGrid(kid.x + kid.body.halfWidth);
        kid.y = lockToGrid(kid.y + kid.body.halfWidth);
        kid.body.velocity.setTo(SCARED_MOVE_SPEED * x, SCARED_MOVE_SPEED * y);
        kid.body.velocity.setMagnitude(SCARED_MOVE_SPEED);
        result = "" + x + "" + y;
        kid.frameName = 'Kid_Scared';
        kidState = "Scared";
        if (backToNormalEvent != null) {
            game.time.events.remove(backToNormalEvent);
            backToNormalEvent == null;
        }
        backToNormalEvent = game.time.events.add(Phaser.Timer.SECOND * 3, backToNormal, this);
    }

    function signCollisionHandler(kid, sign) {
      collisionCount += 1;
      var diffX = kid.body.center.x - sign.body.center.x;
      var diffY = kid.body.center.y - sign.body.center.y;
      var x = 0;
      var y = 0;
      //result = "Collided";
      switch (kidState) {
        case "Normal":
        //result = "Triggered switch normal";
        kid.x = lockToGrid(kid.x + kid.body.halfWidth);
        kid.y = lockToGrid(kid.y + kid.body.halfWidth);

        kidState = "DrawnToSign";
        // Kid is right of sign
        if (diffX > 0) {
          //Go left
            x = -1;
        }
        // Kid is on or left of sign
        if (diffX <= 0) {
          //Go right
            x = 1;
        }
        // Kid is below sign
        if (diffY > 0) {
          //Go up
            y = -1;
        }
        // Kid is on or above sign
        if (diffY <= 0) {
          //Go down
            y = 1;
        }
          break;
        case "Scared":
          break;
        case "DrawnToSign":
        //Change to only trigger once, not every frame, when drawn in?
        // Kid is left of sign
        // Kid is right of sign

        if (diffX > 0) {
          //Go left
            x = -1;
        }
        // Kid is on or left of sign
        if (diffX <= 0) {
          //Go right
            x = 1;
        }
        // Kid is below sign
        if (diffY > 0) {
          //Go up
            y = -1;
        }
        // Kid is on or above sign
        if (diffY <= 0) {
          //Go down
            y = 1;
        }

        lockedX = lockToGrid(kid.x + kid.body.halfWidth);
        lockedY = lockToGrid(kid.y + kid.body.halfWidth);

        lockedSignX = lockToGrid(sign.x + sign.body.halfWidth);
        lockedSignY = lockToGrid(sign.y + sign.body.halfWidth);



        if (lockedX == lockedSignX) {
          x = 0;
          result = "YLock";
        }

        if (lockedY == lockedSignY) {
          y = 0;
          result = "XLock";
        }

          break;
        case "FollowingSign":
          break;
        default:
      }


      kid.body.velocity.setTo(NORMAL_MOVE_SPEED * x, NORMAL_MOVE_SPEED * y);
      kid.body.velocity.setMagnitude(NORMAL_MOVE_SPEED);
    //  result = "" + x + "  ,  " + "" + y;
    }

    function render() {
      game.debug.text("" + collisionCount, 32,32);
        //game.debug.text("" + lockedX + " " + lockedY + ", " + lockedSignX + " " + lockedSignY, 32, 32);
    }
    function lockToGrid(coord) {
        return coord - (coord % GRID_SIZE);
    }
    function backToNormal() {
        kid.frameName = "Kid_Normal";
        kidState = "Normal";
        kid.body.velocity.setMagnitude(NORMAL_MOVE_SPEED);
        backToNormalEvent = null;
    }

    //LOGGING

    function log(message: String) {
      result = message + "\n" + result;
    }
};
