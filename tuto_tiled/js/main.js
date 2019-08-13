var config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    physics:{
        default: 'arcade',
        arcade: {
            gravity: {y:500},
            debug: false
        }
    },
    scene: {
        key: 'main',
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var map;
var player;
var cursors;
var groundLayer, coinLayer, platformLayer;
var score = 0;
var text;

var jump;
var goldAudio;
var meow;
var catDeath;

var music;

var trapLayer;
var speed, slow, fear, fly;
function preload() {
    // map made with Tiled in JSON format
    this.load.tilemapTiledJSON('map', 'assets/map.json');
    // tiles in spritesheet 
    this.load.spritesheet('tiles', 'assets/tiles.png', {frameWidth: 70, frameHeight: 70});

    this.load.spritesheet('plateformes', 'assets/plateformes.png', {frameWidth: 70, frameHeight: 70});

    this.load.spritesheet('sea', 'assets/sea.png', {frameWidth: 70, frameHeight: 70});


    // simple bonus image
    this.load.image('coin', 'assets/coinGold.png');

    this.load.image('fish', 'assets/fish.png');

    this.load.image('choco', 'assets/choco.png');

    this.load.image('cucumber', 'assets/cucumber.png');

    this.load.image('bird', 'assets/bird.png')
    // player animations
    this.load.atlas('player', 'assets/player.png', 'assets/player.json');

    this.load.audio('jump', 'assets/frog_jump.mp3')

    this.load.audio('gold', 'assets/gold.mp3')

    this.load.audio('meow',  'assets/meow.mp3')

    this.load.audio('music',  'assets/main.mp3')

    this.load.audio('knife', 'assets/knife.mp3')

    this.load.audio('death', 'assets/death.mp3')

    this.load.audio('rocket', 'assets/rocket.mp3')

    this.load.audio('scream', 'assets/fear.mp3')

    this.load.audio('vomit', 'assets/vomit.mp3')

    this.load.audio('flute', 'assets/flute.mp3')

    this.load.image('spikeTrap', 'assets/spikeTrap.png');
    
}   
function create() {
    // load the map 
    map = this.make.tilemap({key: 'map'});
 
    // tiles for the ground layer
    var groundTiles = map.addTilesetImage('tiles');
    var platformTiles = map.addTilesetImage('plateformes');
    var seaTiles = map.addTilesetImage('sea');
    // create the ground layer
    groundLayer = map.createDynamicLayer('World', groundTiles, 0, 0);
    platformLayer = map.createDynamicLayer ('Plateformes', platformTiles, 0, 0);
    seaLayer = map.createDynamicLayer ('Sea', seaTiles, 0, 0);
    // the player will collide with this layer
    groundLayer.setCollisionByExclusion([-1]);
    platformLayer.setCollisionByExclusion([-1]);
 
    // coin image used as tileset
    var coinTiles = map.addTilesetImage('coin');
    // add coins as tiles
    coinLayer = map.createDynamicLayer('Coins', coinTiles, 0, 0);
 
    // set the boundaries of our game world
    this.physics.world.bounds.width = groundLayer.width;
    this.physics.world.bounds.height = groundLayer.height;
 
    // create the player sprite    
    player = this.physics.add.sprite(200, 200, 'player');
    player.setBounce(0.2); // our player will bounce from items
    player.setCollideWorldBounds(true); // don't go out of the map    
    
    // small fix to our player images, we resize the physics body object slightly
    player.body.setSize(player.width, player.height-8);
    
    // player will collide with the level tiles 
    this.physics.add.collider(groundLayer, player);
    this.physics.add.collider(platformLayer, player);
 
    coinLayer.setTileIndexCallback(17, collectCoin, this);
    // when the player overlaps with a tile with index 17, collectCoin 
    // will be called    
    this.physics.add.overlap(player, coinLayer);
    
    //spike
    var spikeTiles = map.addTilesetImage('spikeTrap');
    trapLayer = map.createDynamicLayer('Traps', spikeTiles, 0, 0);

    trapLayer.setTileIndexCallback(18, killPlayer, this);
    this.physics.add.overlap(player, trapLayer);
    // fin spike

    // bonus
    var fishTiles = map.addTilesetImage('fish');
    fishLayer = map.createDynamicLayer('Fish', fishTiles, 0, 0);

    fishLayer.setTileIndexCallback(34, collectFish, this);
    this.physics.add.overlap(player, fishLayer);
    //
    var chocoTiles = map.addTilesetImage('choco');
    chocoLayer = map.createDynamicLayer('Choco', chocoTiles, 0, 0);

    chocoLayer.setTileIndexCallback(35, collectChoco, this);
    this.physics.add.overlap(player, chocoLayer);
    //
    var cucumTiles = map.addTilesetImage('cucumber');
    cucumLayer = map.createDynamicLayer('Cucumber', cucumTiles, 0, 0);

    cucumLayer.setTileIndexCallback(36, collectCucum, this);
    this.physics.add.overlap(player, cucumLayer);
    //
    var birdTiles = map.addTilesetImage('bird');
    birdLayer = map.createDynamicLayer('Bird', birdTiles, 0, 0);

    birdLayer.setTileIndexCallback(37, collectBird, this);
    this.physics.add.overlap(player, birdLayer);
    // fin bonus
 
    // player walk animation
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNames('player', {prefix: 'p1_walk', start: 1, end: 11, zeroPad: 2}),
        frameRate: 10,
        repeat: -1
    });
    // idle with only one frame, so repeat is not neaded
    this.anims.create({
        key: 'idle',
        frames: [{key: 'player', frame: 'p1_stand'}],
        frameRate: 10,
    });
 
 
    cursors = this.input.keyboard.createCursorKeys();
 
    // set bounds so the camera won't go outside the game world
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // make the camera follow the player
    this.cameras.main.startFollow(player);
 
    // set background color, so the sky is not black    
    this.cameras.main.setBackgroundColor('#ccccff');

    text = this.add.text(20, 570, '0', {
        fontSize: '20px',
        fill: '#ffffff'
    })
    text.setScrollFactor(0);


    jump = this.sound.add('jump', {volume: 0.5});
    goldAudio = this.sound.add('gold', {volume: 0.3});
    meow = this.sound.add('meow', {volume:0.2});
    knife = this.sound.add('knife',{volume:1})
    catDeath = this.sound.add('death', {volume:0.9})
    rocket = this.sound.add('rocket', {volume:1})
    music  =this.sound.add('music', {volume: 0.2})
    scream  =this.sound.add('scream', {volume: 0.4})
    vomit  =this.sound.add('vomit', {volume: 1})
    flute  =this.sound.add('flute', {volume: 0.2})
    music.play();
}
function update(time, delta){
        if (cursors.left.isDown && fear == true){
            player.body.setVelocityX(0); // move left
            player.anims.play('idle', true)
            player.flipX= true;
        }else if(cursors.right.isDown && fear == true){
            player.body.setVelocityX(0); // move right
            player.anims.play('idle', true)
            player.flipX= false;

        }else if (cursors.left.isDown && speed == true){
            player.body.setVelocityX(-500); // move left
            player.anims.play('walk', true)
            player.flipX= true;
        }else if(cursors.right.isDown && speed == true){
            player.body.setVelocityX(500); // move right
            player.anims.play('walk', true)
            player.flipX= false;

        }else if (cursors.left.isDown && slow == true){
            player.body.setVelocityX(-75); // move left
            player.anims.play('walk', true)
            player.flipX= true;
        }else if(cursors.right.isDown && slow == true){
            player.body.setVelocityX(75); // move right
            player.anims.play('walk', true)
            player.flipX= false;

        }else if (cursors.left.isDown) // if the left arrow key is down
        {
            player.body.setVelocityX(-200); // move left
            player.anims.play('walk', true)
            player.flipX= true;
        }else if (cursors.right.isDown) // if the right arrow key is down
        {
            player.body.setVelocityX(200); // move right
            player.anims.play('walk', true)
            player.flipX= false;
        }else {
        player.body.setVelocityX(0);
        player.anims.play('idle', true);

        }
        if ((cursors.up.isDown) && player.body.onFloor())
        {
            player.body.setVelocityY(-500); // jump up
            player.anims.play('idle', true)
            jump.play()
        }else if((cursors.up.isDown) && fly==true){
            player.body.setVelocityY(-500); // jump up
            player.anims.play('idle', true)
            jump.play()
        }
/*
        if ((cursors.down.isDown) && fly==true){
            player.body.setVelocityY(200); // jump up
            player.anims.play('idle', true)
        }else if ((cursors.down.isDown)){
            player.anims.play('idle', true)
        }
*/
        if(cursors.space.isDown){
            meow.play()
        }
        //

        // début du speed

    // fin du speed
        this.physics.collide(player, groundLayer);
 
        if (player.body.onFloor() && player.falling) {
            player.falling = false;

        }
     
        // ... other stuff ...    
     
        if (player.body.velocity.y > 0) {
            player.falling = true;
        }
        //



    }
function collectCoin(sprite, tile){
    coinLayer.removeTileAt(tile.x, tile.y);
    score++;
    text.setText(score);
    goldAudio.play()
    return false;
}
function collectFish(sprite, tile){
    fishLayer.removeTileAt(tile.x, tile.y);
    speed = true;
    text.setText('poisson !!');
    rocket.play()
    setTimeout(function(){speed=false, text.setText('')}, 2000)
    return false;
}
function collectChoco(sprite, tile){
    chocoLayer.removeTileAt(tile.x, tile.y);
    slow = true;
    text.setText('Beurk chocolat !!');
    vomit.play()
    setTimeout(function(){slow=false, text.setText('')}, 2000)
    return false;
}
function collectCucum(sprite, tile){
    cucumLayer.removeTileAt(tile.x, tile.y);
    fear = true;
    if (fear){
        var frightened = setInterval(function(){player.body.setVelocityY(-5000)}, 100)
         // jump up
    }
    text.setText('Aaaaaaah un concombre !!');
    scream.play()
    setTimeout(function(){fear=false, clearInterval(frightened), text.setText('')}, 1800)
    return false;
}
function collectBird(sprite, tile){
    birdLayer.removeTileAt(tile.x, tile.y);
    fly = true;
    text.setText('Je voooole !!');
    flute.play()
    setTimeout(function(){fly=false, flute.stop(), text.setText('')}, 3000)
    return false;
}

function killPlayer (sprite, tile) {
    alive = false
    console.log('function call');
    this.physics.world.colliders.destroy();
    this.cameras.main.stopFollow();
    
    player.body.allowRotation = true
    player.body.angularVelocity = 1000
    player.body.setVelocityX((Math.random() * 1000)-500)
    player.body.setVelocityY(-200);  
    knife.play()
    catDeath.play()
}