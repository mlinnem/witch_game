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
    var kid;
    var kidState;
    var hauntedtrees;
    var witch_hut_1;
    var cursors;
    var cursorsprite;
    var hauntedtreecursor;
    var result;
    var backToNormalEvent;
    var backgroundSprite;
    var signs;
    var collisionCount;
    var lockedX;
    var lockedY;
    var lockedSignX;
    var lockedSignY;
    function create() {
        collisionCount = 0;
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.stage.backgroundColor = 0x465243;
        backgroundSprite = game.add.tileSprite(0, 0, game.width, game.height, 'grid');
        backgroundSprite.alpha = 0.4;
        kid = game.add.sprite(400, 300, 'kid_spritesheet', 'Kid_Normal');
        kidState = "Normal";
        game.physics.enable(kid, Phaser.Physics.ARCADE);
        kid.body.collideWorldBounds = true;
        kid.body.setSize(25, 25, 50, 50);
        kid.body.velocity.setTo(20, 20);
        kid.body.velocity.setMagnitude(NORMAL_MOVE_SPEED);
        witch_hut_1 = game.add.sprite(600, 400, 'witch_hut_1');
        game.physics.enable(witch_hut_1, Phaser.Physics.ARCADE);
        witch_hut_1.body.immovable = true;
        hauntedtrees = game.add.group();
        hauntedtrees.enableBody = true;
        signs = game.add.group();
        signs.enableBody = true;
        cursors = game.input.keyboard.createCursorKeys();
        hauntedtreecursor = game.add.sprite(0, 0, 'hauntedtree');
        hauntedtreecursor.alpha = .3;
        cursorsprite = hauntedtreecursor;
        game.input.onDown.add(addSign, this);
    }
    function addHauntedTree() {
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
    function update() {
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
        switch (kidState) {
            case "Normal":
                kid.x = lockToGrid(kid.x + kid.body.halfWidth);
                kid.y = lockToGrid(kid.y + kid.body.halfWidth);
                kidState = "DrawnToSign";
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
                break;
            case "Scared":
                break;
            case "DrawnToSign":
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
    }
    function render() {
        game.debug.text("" + collisionCount, 32, 32);
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
    function log(message) {
        result = message + "\n" + result;
    }
};
