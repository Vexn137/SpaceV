const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pauseMenu = document.getElementById('pauseMenu');

const clamp = (val, min, max) => Math.min(Math.max(val, min), max)

let killedBosses = []
let nextBoss = null

let loadedImages = {
  bullets: {},
  bosses: {},
  particles: {},
  items: {}
}

const shipImage = new Image();
shipImage.src = 'assets/ships/ship.png';

let bulletImages = {
  bullet: 'bullet.png',
  chicle: 'chicle.png',
  tenis_ball: 'tenis_ball.png',
  pea: 'pea.png',
  bone: 'bone.png',
  realistic: 'realistic.png',
}
for (const [key, scr] of Object.entries(bulletImages)) {
  const img = new Image();
  img.src = 'assets/bullets/' + bulletImages[key];
  loadedImages['bullets'][key] = img;
}

let itemImages = {
  hamburbur: 'hamburbur.png',
  monster: 'monster.png',
  bolas: 'bolas.png'
}
for (const [key, scr] of Object.entries(itemImages)) {
  const img = new Image();
  img.src = 'assets/items/' + itemImages[key];
  loadedImages['items'][key] = img;
}

let particleImages = {
  bg_particle1: 'bg_particle1.png',
  bg_particle2: 'bg_particle2.png',
  bg_particle3: 'bg_particle3.png',
  warning: 'warning.png'
}
for (const [key, scr] of Object.entries(particleImages)) {
  const img = new Image();
  img.src = 'assets/particles/' + particleImages[key];
  loadedImages['particles'][key] = img;
}

let bossImages = {
  oscar: {
    oscar: 'oscar.png',
    oscar_muejeje: 'oscar_muejeje.png'
  },
  sans: {
    sans: 'sans.png',
    sans_angry: 'sans_angry.png',
    sans_dead: 'sans_dead.png',
    mortadela: 'mortadela.png'
  },
  franco: {
    franco: 'franco.png',
    ataquen: 'ataquen.png',
    fuego: 'fuego.png',
    talk0: 'talk0.png',
    talk1: 'talk1.png',
    talk2: 'talk2.png',
    españoles: 'españoles.png',
    el: 'el.png',
    ha: 'ha.png',
    muerto: 'muerto.png',
    ['...']: '....png'
  }
}
for (const [key, scr] of Object.entries(bossImages)) {
  for (const [ckey, scr] of Object.entries(bossImages[key])) {
    const img = new Image();
    img.src = 'assets/enemies/bosses/' + key + '/' + bossImages[key][ckey];

    loadedImages['bosses'][key] = loadedImages['bosses'][key] || {}
    loadedImages['bosses'][key][ckey] = img;
  }
}

/*
for (const [key, scr] of Object.entries(bossImages)) {
  const img = new Image();
  img.src = 'assets/enemies/bosses/' + key + bossImages[key];
  loadedImages['bosses'][key][bossImages[key]] = img;
}*/

const backgroundImage = new Image();
backgroundImage.src = 'assets/images/background.png';

let backgroundY = 0; // Initial y-coordinate of the background
let backgroundParticles = [];

let backgroundAlpha = 0.5; // Adjust this value between 0 (fully transparent) and 1 (fully opaque)

function drawBackground() {
  ctx.globalAlpha = backgroundAlpha; // Set the transparency for the background images

  // Draw the background images
  ctx.drawImage(backgroundImage, 0, backgroundY, canvas.width, canvas.height);
  ctx.drawImage(backgroundImage, 0, backgroundY - canvas.height, canvas.width, canvas.height);

  ctx.globalAlpha = 1; // Reset the transparency to default (fully opaque)
}

function createBackgroundParticle() {
  const particleSize = 20; // Adjust the size as needed
  
  const particle = {
    x: Math.random() * canvas.width, // Random x position within canvas width
    y: -0, // Start at the top of the canvas
    dx: (Math.random() * 2 - 1)/2.5, // Random horizontal velocity
    dy: (Math.random() * 2 + 1)/2.5, // Random vertical velocity (positive to make particles fall)
    size: particleSize, // Particle size
    image: loadedImages['particles']['bg_particle'+(Math.floor(Math.random() * 2)+1)] // Random preloaded image
  };
  backgroundParticles.push(particle);
}

let bgparticleAlpha = 0.5; // Adjust this value between 0 (fully transparent) and 1 (fully opaque)

function drawBackgroundParticles() {
  ctx.globalAlpha = bgparticleAlpha; // Set the transparency for the background particles

  backgroundParticles.forEach(particle => {
    ctx.drawImage(particle.image, particle.x, particle.y, particle.size, particle.size);
  });

  ctx.globalAlpha = 1; // Reset the transparency to default (fully opaque)
}

function moveBackgroundParticles() {
  backgroundParticles.forEach(particle => {
    particle.x += particle.dx; // Move horizontally
    particle.y += particle.dy; // Move vertically
    
    // If particle goes below the canvas, reset its position to the top
    if (particle.y > canvas.height) {
      particle.x = Math.random() * canvas.width;
      particle.y = 0;
    }
  });
}

function moveBackground() {
  backgroundY += 0.5; // Adjust the speed of the background scrolling
  if (backgroundY >= canvas.height) {
    backgroundY = 0; // Reset background position once it scrolls out of the canvas
  }
}

let ship = {
  x: canvas.width / 2 - 15,
  y: canvas.height - 50,
  width: 25,
  height: 25,
  dx: 3.5,
  dy: 3,
  img: shipImage,
  effects: [],
  bullets: [],
  damage: 25,
  fireRate: 15,
  fireCooldown: 0,
  bulletCount: 1,
  maxHealth: 100,
  health: 100, // Add health property
  immunity: false, // Track ship's immunity status
  immunityDuration: 100, // Duration of immunity effect (in game frames)
  immunityTimer: 0 // Timer for immunity effect
};

let items = [];
let enemies = [];
let particles = []; // New particles array

let gameOver = false;

let bossdelay = 5000
let nextboss = 4000
let score = 0;

let rightPressed = false;
let leftPressed = false;
let upPressed = false;
let downPressed = false;
let spacePressed = false;
let isPaused = false;

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);
window.addEventListener('blur', windowBlurHandler);

document.addEventListener('keydown', function(event) {
  if (event.key === 'c' || event.key === 'C') {
    let input = prompt("Enter the setting you want to change or type 'help' for options:");
    if (input) {
      let setting = input.trim().toLowerCase();
      switch (setting) {
        case 'dx':
          ship.dx = parseFloat(prompt("Enter new dx value:"));
          break;
        case 'dy':
          ship.dy = parseFloat(prompt("Enter new dy value:"));
          break;
        case 'firerate':
          ship.fireRate = parseInt(prompt("Enter new fire rate value:"));
          break;
        case 'shipsize':
          let newSize = parseInt(prompt("Enter new ship size value:"));
          ship.width = ship.height = newSize;
          break;
        case 'bulletcount':
          ship.bulletCount = parseInt(prompt("Enter new bullet count value:"));
          break;
        case 'speed':
          let newSpeed = parseFloat(prompt("Enter new speed value:"));
          ship.dx = ship.dy = newSpeed;
          break;
        case 'help':
          alert("Available options:\n- dx: Change ship's horizontal speed\n- dy: Change ship's vertical speed\n- firerate: Change ship's fire rate\n- shipsize: Change ship's size\n- bulletcount: Change the number of bullets\n- speed: Change both horizontal and vertical speed simultaneously");
          break;
        default:
          alert("Invalid setting!");
          break;
      }
    }
  }
});

function keyDownHandler(e) {
  if (e.key == 'Right' || e.key == 'ArrowRight' || e.key == 'd' || e.key == 'D') {
    rightPressed = true;
  } else if (e.key == 'Left' || e.key == 'ArrowLeft' || e.key == 'a' || e.key == 'A') {
    leftPressed = true;
  } else if (e.key == 'Up' || e.key == 'ArrowUp' || e.key == 'w' || e.key == 'W') {
    upPressed = true;
  } else if (e.key == 'Down' || e.key == 'ArrowDown' || e.key == 's' || e.key == 'S') {
    downPressed = true;
  } else if (e.key == 'Escape') {
    e.preventDefault();
    togglePause();
  } else if (e.key == ' ') {
    e.preventDefault();
    spacePressed = true;
  }
}
function keyUpHandler(e) {
  if (e.key == 'Right' || e.key == 'ArrowRight' || e.key == 'd' || e.key == 'D') {
    rightPressed = false;
  } else if (e.key == 'Left' || e.key == 'ArrowLeft' || e.key == 'a' || e.key == 'A') {
    leftPressed = false;
  } else if (e.key == 'Up' || e.key == 'ArrowUp' || e.key == 'w' || e.key == 'W') {
    upPressed = false;
  } else if (e.key == 'Down' || e.key == 'ArrowDown' || e.key == 's' || e.key == 'S') {
    downPressed = false;
  } else if (e.key == ' ') {
    spacePressed = false;
  }
}

function windowBlurHandler() {
  if (!isPaused) {
    togglePause();
  }
}

function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    pauseMenu.classList.remove('hidden');
  } else {
    pauseMenu.classList.add('hidden');
  }
}

function drawShip() {
  if (!ship.immunity || (ship.immunityTimer % 10 < 5)) { // Make ship blink every 10 frames
    ctx.drawImage(ship.img, ship.x, ship.y, ship.width, ship.height);
  }
}
function moveShip() {
  let moveX = 0;
  let moveY = 0;

  if (rightPressed && ship.x < canvas.width - ship.width) {
    moveX = ship.dx;
  }
  if (leftPressed && ship.x > 0) {
    moveX = -ship.dx;
  }
  if (upPressed && ship.y > 0) {
    moveY = -ship.dy;
  }
  if (downPressed && ship.y < canvas.height - ship.height) {
    moveY = ship.dy;
  }

  if (moveX !== 0 && moveY !== 0) {
    moveX *= Math.sqrt(0.5);
    moveY *= Math.sqrt(0.5);
  }

  ship.x += moveX;
  ship.y += moveY;
}

// Define the health bar dimensions and position
const healthBar = {
  x: 10,
  y: 30,
  width: 100, // Adjust this value to change the width of the health bar
  height: 10 // Adjust this value to change the height of the health bar
};

// Function to draw the health bar
function drawHealthBar() {
  const healthPercentage = ship.health / 100;
  const healthWidth = healthBar.width * healthPercentage;

  // Draw the background of the health bar (empty health)
  ctx.fillStyle = 'red';
  ctx.fillRect(healthBar.x, healthBar.y, healthBar.width, healthBar.height);

  // Draw the current health
  ctx.fillStyle = 'green';
  ctx.fillRect(healthBar.x, healthBar.y, healthWidth, healthBar.height);

  // Optional: Draw the border of the health bar
  ctx.strokeStyle = 'black';
  ctx.strokeRect(healthBar.x, healthBar.y, healthBar.width, healthBar.height);
}

function createBullet() {
  const bulletSpread = Math.PI / 6; // Smaller bullet spread angle
  const angleIncrement = ship.bulletCount > 1 ? bulletSpread / (ship.bulletCount - 1) : 0;
  const initialAngle = ship.bulletCount > 1 ? -bulletSpread / 2 : 0;

  for (let i = 0; i < ship.bulletCount; i++) {
    let bullet = {
      x: ship.x + ship.width / 2 - 3,
      y: ship.y,
      width: 6,
      height: 15,
      speed: 4,
      angle: initialAngle + i * angleIncrement,
      img: loadedImages['bullets']['bullet']
    };

    // Calculate horizontal and vertical components of bullet velocity
    bullet.dx = bullet.speed * Math.sin(bullet.angle);
    bullet.dy = -bullet.speed * Math.cos(bullet.angle);

    ship.bullets.push(bullet);
  }
}

function drawBullets() {
  ship.bullets.forEach(bullet => {
    ctx.drawImage(bullet.img, bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

function moveBullets() {
  ship.bullets.forEach(bullet => {
    bullet.x += bullet.dx;
    bullet.y += bullet.dy;
  });

  ship.bullets = ship.bullets.filter(bullet => bullet.y >= 0);
}

function updateEffects() {
  ship.effects.forEach((effect, effectIndex) => {

    if (effect.first == null) {
      effect.start(effect);
      effect.first = true;
    }
    effect.step(effect);

    effect.duration--;
    if (effect.duration <= 0) {
      effect.end(effect);
      ship.effects.splice(effectIndex, 1);
    }
  });

  ship.bullets = ship.bullets.filter(bullet => bullet.y >= 0);
}

let bossSpawned = false;
let BOSS_TYPE = null;

// Define boss properties
const BOSS_PROPERTIES = {
  health: 2500 // Adjust boss health as needed
};

function drawBossHealthBar(enemy) {
  //const boss = enemies.find(enemy => enemy.type === ENEMY_TYPES.BOSS); // Find the boss enemy
  if (enemy) {
    const healthPercentage = enemy.health / enemy.maxHealth;
    const barWidth = 200;
    const barHeight = 10;
    const x = canvas.width / 2 - barWidth / 2;
    const y = 50;
    
    // Draw background of health bar
    ctx.fillStyle = 'gray';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Draw actual health bar
    ctx.fillStyle = 'red';
    ctx.fillRect(x, y, barWidth * healthPercentage, barHeight);
  }
}

function Boss(x, y, n) {
  BOSS_TYPE = n

  this.x = x;
  this.y = y;
  this.dx = 0; // Adjust the horizontal speed of the boss enemy
  this.dy = 1.5; // Adjust the vertical speed of the boss enemy
  this.type = ENEMY_TYPES.BOSS;
  this.score = 500

  this.onCollide = function(enemy) {
    dealDamageToShip(25)
  }

  this.moveStopPosition = canvas.height * 0.225; // Adjusted stop position
  this.shootCooldown = 100; // Adjusted shoot cooldown

  this.isDead = false;

  this.img = loadedImages['bosses']['oscar']['oscar']
  if (n == 'oscar') {
    this.width = 100; // Adjust the width of the boss enemy
    this.height = 100; // Adjust the height of the boss enemy
    this.maxHealth = 2500;
    this.health = 2500; // Adjust the health of the boss enemy

    this.img = loadedImages['bosses']['oscar']['oscar']

    this.currentAbility = null
    this.rotation = 0

    this.onDeath = function(enemy) {
      enemy.isDead = true;
    }

    this.function = function(enemy) {
      if (enemy.shootCooldown <= 0) {
        let rdm = Math.random()
        enemy.img = loadedImages['bosses']['oscar']['oscar']

        if (enemy.currentAbility == 'gyro') {

          if (enemy.rotation >= 360 | enemy.rotation <= -720) {
            enemy.rotation = 0;
            enemy.shootCooldown = 90; // Reset shoot cooldown
            enemy.currentAbility = null
          } else {
            let bullet = {
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              width: 15,
              height: 15,
              dy: Math.sin(enemy.rotation)*1.5, // Adjusted bullet speed
              dx: Math.cos(enemy.rotation)*1.5,
              img: loadedImages['bullets']['chicle']
            };
            enemyBullets.push(bullet);
            enemy.rotation += enemy.rotation < 0 ? -10 : 10
            enemy.shootCooldown = 2.5;
          }

        } else if (rdm > .825) {
          enemy.rotation += Math.random()*20 - 10
          enemy.currentAbility = 'gyro'
          enemy.shootCooldown = 5;
          
        } else if (rdm > .05) {
          let shootx = enemy.x + enemy.width / 2
          let shooty = enemy.y + enemy.height / 2

          let shipx = ship.x + ship.width / 2
          let shipy = ship.y + ship.height / 2

          let x=shipx-shootx,y=shipy-shooty;
          let length = Math.sqrt(x**2+y**2);
          //Then divide the x and y by the length.
          x = x/length;
          y = y/length;

          let bullet = {
            x: shootx - 7.5,
            y: shooty - 7.5,
            width: 15,
            height: 15,
            dy: y*2, // Adjusted bullet speed
            dx: x*2,
            img: loadedImages['bullets']['chicle']
          };
          enemyBullets.push(bullet);

          enemy.shootCooldown = 12.5; // Reset shoot cooldown
        } else {
          enemy.img = loadedImages['bosses']['oscar']['oscar_muejeje']

          enemies.push(new Enemy(canvas.width+30, 0, ENEMY_TYPES.FOLLOWER));
          enemies.push(new Enemy(0-30, 0, ENEMY_TYPES.FOLLOWER));
          enemy.shootCooldown = 150; // Reset shoot cooldown
        }
      } else {
        enemy.shootCooldown--; // Decrease shoot cooldown timer
      }
    }

  } else if (n == 'sans') {
    this.width = 80; // Adjust the width of the boss enemy
    this.height = 100; // Adjust the height of the boss enemy
    this.maxHealth = 2250;
    this.health = 2250; // Adjust the health of the boss enemy

    this.img = loadedImages['bosses']['sans']['sans']

    this.warnedTick = 0;
    this.targetx = 0;
    this.targety = 0;

    this.directionCooldown = 100;

    this.onDeath = function(enemy) {
      const particle = {
        x: enemy.x,
        y: enemy.y,
        dx: Math.random()*4 -2,
        dy: -5,
        dr: 0.75,
        ay: .4,
        rotation: 0,
        color: `rgba(150, ${Math.random() * 100}, 0, 1)`,
        width: 80,
        height: 80,
        lifespan: 300,
        img: loadedImages['bosses']['sans']['sans_dead']
      };
  
      particles.push(particle);
      enemy.isDead = true;
    }

    this.function = function(enemy) {
      let isAngry = enemy.health < 1000

      if (enemy.directionCooldown <= 0) {
        enemy.dx = (Math.random()>.5 ? 1 : -1) * ((Math.random())*(isAngry?4:2)+(isAngry?.75:0))
        enemy.directionCooldown = 50;
      } else {
        enemy.directionCooldown--
      }
      if (enemy.x+enemy.width/2 < 50) {
        enemy.dx = (Math.random())*(isAngry?4:2)+(isAngry?.75:0)
      } else if (enemy.x+enemy.width/2 > canvas.width-50) {
        enemy.dx = -(Math.random())*(isAngry?4:2)-(isAngry?.75:0)
      }

      enemy.img = isAngry ? loadedImages['bosses']['sans']['sans_angry'] : loadedImages['bosses']['sans']['sans']
      if (enemy.shootCooldown <= 0) {
        let rdm = Math.random()

        if (rdm > .7 && enemy.warnedTick == 0) {

          let bullet = {
            x: ship.x+ship.width/2-75,
            y: -25,
            width: 150,
            height: 30,
            dy: 1.45, // Adjusted bullet speed
            dx: 0,
            img: loadedImages['bullets']['bone']
          };
          enemyBullets.push(bullet);

          enemy.shootCooldown = isAngry ? 50 : 120; // Reset shoot cooldown
        } else if (Math.random() > .4 && enemy.warnedTick == 0) {

          let fromRight = ship.x - canvas.width/2 < 0

          let bullet = {
            x: fromRight ? canvas.width+30+30 : -30,
            y: ship.y+ship.height/2-75,
            width: 30,
            height: 125,
            dy: 0, // Adjusted bullet speed
            dx: fromRight ? -1.4 : 1.4,
            lifeTime: 500,
            img: loadedImages['bullets']['bone']
          };

          enemyBullets.push(bullet);

          enemy.shootCooldown = isAngry ? 45 : 105; // Reset shoot cooldown
        } else {

          if (enemy.warnedTick >= 75) {
            let bullet = {
              x: enemy.targetx-45,
              y: enemy.targety-45,
              width: isAngry ? 100 : 80,
              height: isAngry ? 100 : 80,
              dy: 0, // Adjusted bullet speed
              dx: 0,
              destroyOnCollide: false,
              lifeTime: isAngry ? 40 : 75,
              img: loadedImages['bosses']['sans']['mortadela']
            };
            enemyBullets.push(bullet);

            enemy.warnedTick = 0
            enemy.shootCooldown = isAngry ? 15 : 100; // Reset shoot cooldown

          } else if (enemy.warnedTick == 0) {
            enemy.targetx = ship.x+ship.width/2
            enemy.targety = ship.y+ship.height/2
            createWarningEffect(ship.x+ship.width/2, ship.y+ship.height)

            enemy.warnedTick++
          } else {
            enemy.warnedTick++
          }
        }
      } else {
        enemy.shootCooldown--; // Decrease shoot cooldown timer
      }
    }
  } else if (n == 'franco') {
    this.width = 90; // Adjust the width of the boss enemy
    this.height = 125; // Adjust the height of the boss enemy
    this.maxHealth = 2000;
    this.health = 2000; // Adjust the health of the boss enemy

    this.img = loadedImages['bosses']['franco']['franco']

    this.directionCooldown = 100;

    this.isDying = false;
    this.deathTick = 400;

    this.talking = 0;

    this.moveStopPosition = canvas.height * 0.165; // Adjusted stop position

    this.function = function (enemy) {
      if (enemy.isDying) {
        if (enemy.deathTick <= 0) {
          const particle = {
            x: enemy.x,
            y: enemy.y,
            dx: 0,
            dy: 1,
            dr: 0,
            ay: 0,
            alpha: 1,
            da: -1/300,
            rotation: 0,
            color: `rgba(150, ${Math.random() * 100}, 0, 1)`,
            width: enemy.width,
            height: enemy.height,
            lifespan: 300,
            img: loadedImages['bosses']['franco']['...']
          };
      
          particles.push(particle);

          enemy.isDead = true;

        } else {
          enemy.deathTick--;

          if (enemy.deathTick < 25) {
            enemy.img = loadedImages['bosses']['franco']['...'];
          } else if (enemy.deathTick < 125) {
            enemy.img = loadedImages['bosses']['franco']['muerto'];
            ctx.fillText('muerto', canvas.width/2, canvas.height/2);
          } else if (enemy.deathTick < 175) {
            enemy.img = loadedImages['bosses']['franco']['ha'];
            ctx.fillText('ha', canvas.width/2, canvas.height/2);
          } else if (enemy.deathTick < 275) {
            enemy.img = loadedImages['bosses']['franco']['el'];
            ctx.fillText('franco', canvas.width/2, canvas.height/2);
          } else if (enemy.deathTick < 375) {
            enemy.img = loadedImages['bosses']['franco']['españoles'];
            ctx.fillText('españoles', canvas.width/2, canvas.height/2);
          } else {
            enemy.img = loadedImages['bosses']['franco']['...'];
          }
        }
      } else {
        if (enemy.talking > 0) {
          let mod = enemy.talking%70
          if (mod > 55) {
            enemy.img = loadedImages['bosses']['franco']['talk1'];
          } else if (mod > 20) {
            enemy.img = loadedImages['bosses']['franco']['talk2'];
          } else if (mod > 10) {
            enemy.img = loadedImages['bosses']['franco']['talk1'];
          } else {
            enemy.img = loadedImages['bosses']['franco']['talk0'];
          }

          enemy.talking--
        }

        if (enemy.shootCooldown <= 0) {
          let rdm = Math.random()
          enemy.img = loadedImages['bosses']['franco']['franco']
  
          if (rdm > 0.35) {

            enemy.img = loadedImages['bosses']['franco']['ataquen']
  
            for (let i = 0; i < 8; i++) {
              enemies.push(new Enemy(20 + Math.random()*(canvas.width-20), -Math.random()*250-20, ENEMY_TYPES.TROPAFRANCA));
            }
            enemy.shootCooldown = 200; // Reset shoot cooldown
          } else if (rdm > 0.1) {

            enemy.img = loadedImages['bosses']['franco']['fuego']

            for (let i = 0; i < 3; i++) {
              enemies.push(new Enemy(50 + Math.random()*(canvas.width-50), -Math.random()*150-20, ENEMY_TYPES.FRANCOTIRADORFRANCO));
            }

            for (let i = 0; i < 8; i++) {
              let bullet = {
                x: 10 + Math.random()*(canvas.width-10),
                y: -Math.random()*600-10,
                width: 5,
                height: 10,
                dy: 5, // Adjusted bullet speed
                dx: 0,
                img: loadedImages['bullets']['realistic']
              };
              enemyBullets.push(bullet);
            }

            enemy.shootCooldown = 210; // Reset shoot cooldown
          } else {
            for (let i = 0; i < 6; i++) {
              enemies.push(new Enemy(10+i/6*(canvas.width), -Math.random()*200-20, ENEMY_TYPES.BARRERAFRANCA));
            }

            enemy.talking = 205;
            enemy.shootCooldown = 210; // Reset shoot cooldown
          }
        } else {
          enemy.shootCooldown--; // Decrease shoot cooldown timer
        }
      }
    }

    this.onDeath = function(enemy) {
      this.width = 150; // Adjust the width of the boss enemy
      this.height = 150; // Adjust the height of the boss enemy
      this.isDying = true;
    }
  }
}

// Create a boss enemy
function createBoss() {
  const x = canvas.width / 2 - 50; // Adjust the initial x position of the boss enemy
  const y = -100; // Adjust the initial y position of the boss enemy

  let options = []
  while (nextBoss == null) {
    let t = ['oscar', 'sans', 'franco']
    t = t.filter(b => killedBosses.findIndex((element) => element == b) == -1);

    var index = Math.floor(Math.random() * t.length);
    nextBoss = t[index]
    if (!nextBoss) {
      killedBosses = [];
    }
  }

  enemies.push(new Boss(x, y, nextBoss));
  nextBoss = null
}

const ENEMY_TYPES = {
  NORMAL: 'normal',
  TANK: 'tank',
  SWEEP: 'sweep',
  SHOOTER: 'shooter',
  SNIPER: 'sniper',
  FOLLOWER: 'follower',
  INVISIBLE: 'invisible',
  CREEPER: 'creeper',
  NEUTRALIST: 'neutralist',

  TROPAFRANCA: 'tropafranca',
  FRANCOTIRADORFRANCO: 'francotiradorfranco',
  BARRERAFRANCA: 'barrerafranca',

  BOSS: 'boss'
};

const enemyImages = {
  [ENEMY_TYPES.NORMAL]: 'assets/enemies/normal.png',
  [ENEMY_TYPES.TANK]: 'assets/enemies/tank.png',
  [ENEMY_TYPES.SWEEP]: 'assets/enemies/sweep.png',
  [ENEMY_TYPES.SHOOTER]: 'assets/enemies/shooter.png',
  [ENEMY_TYPES.SNIPER]: 'assets/enemies/sniper.png',
  [ENEMY_TYPES.FOLLOWER]: 'assets/enemies/follower.png',
  [ENEMY_TYPES.INVISIBLE]: 'assets/enemies/invisible.png',
  [ENEMY_TYPES.NEUTRALIST]: 'assets/enemies/neutralist.png',
  ['neutralist_mad']: 'assets/enemies/neutralist_mad.png',
  [ENEMY_TYPES.TROPAFRANCA]: 'assets/enemies/tropafranca.png',
  [ENEMY_TYPES.FRANCOTIRADORFRANCO]: 'assets/enemies/francotiradorfranco.png',
  [ENEMY_TYPES.BARRERAFRANCA]: 'assets/enemies/barrerafranca.png',
  [ENEMY_TYPES.CREEPER]: 'assets/enemies/creeper.png',
}

let loadedEnemyImages = [];
for (const [key, scr] of Object.entries(enemyImages)) {
  const img = new Image();
  img.src = enemyImages[key];
  loadedEnemyImages[key] = img;
}

const ENEMY_PROPERTIES = {
  [ENEMY_TYPES.NORMAL]: {
    score: 100,
    health: 100,

    chance: 100,
    spawnScore: 0,
    despawnScore: 6000
  },
  [ENEMY_TYPES.TANK]: {
    score: 250,
    health: 250,
    dx: 0,
    dy: .5,
    width: 65,
    height: 40,
    img: loadedEnemyImages[ENEMY_TYPES.TANK],

    chance: 60,
    spawnScore: 1750
  },
  [ENEMY_TYPES.SWEEP]: {
    score: 200,
    health: 300,
    x: ship,
    dx: 0,
    dy: 5,
    width: 60,
    height: 35,
    img: loadedEnemyImages[ENEMY_TYPES.SWEEP],

    chance: 25,
    spawnScore: 3000,
  },
  [ENEMY_TYPES.SHOOTER]: {
    score: 150,
    health: 100,
    width: 30,
    height: 30,
    moveStopPosition:canvas.height * 0.15, // Adjusted stop position
    shootCooldown: 50, // Adjusted shoot cooldown
    img: loadedEnemyImages[ENEMY_TYPES.SHOOTER],

    function: function (enemy) {
      if (enemy.y >= enemy.moveStopPosition) {
        if (enemy.shootCooldown <= 0) {
          let bullet = createEnemyBullet(enemy);
          bullet['img'] = loadedImages['bullets']['pea'];
          bullet['width'] = 10;
          bullet['height'] = 10;

          enemy.shootCooldown = 95; // Reset shoot cooldown
          enemy.height += 9.5
        } else {
          enemy.height -= 0.1
          enemy.shootCooldown--; // Decrease shoot cooldown timer
        }
      }
    },

    chance: 75,
    spawnScore: 750,
  },
  [ENEMY_TYPES.SNIPER]: {
    score: 200,
    health: 150,
    moveStopPosition:canvas.height * 0.15, // Adjusted stop position
    shootCooldown: 100, // Adjusted shoot cooldown
    aim: true,
    img: loadedEnemyImages[ENEMY_TYPES.SNIPER],

    function: function (enemy) {
      if (enemy.y >= enemy.moveStopPosition) {
        if (enemy.shootCooldown <= 0) {
          let bullet = createEnemyBullet(enemy);
          bullet['img'] = loadedImages['bullets']['tenis_ball'];
          bullet['width'] = 7;
          bullet['height'] = 7;

          let shootx = enemy.x + enemy.width / 2
          let shooty = enemy.y + enemy.height / 2

          let shipx = ship.x + ship.width / 2
          let shipy = ship.y + ship.height / 2

          let x=shipx-shootx,y=shipy-shooty;
          let length = Math.sqrt(x**2+y**2);
          //Then divide the x and y by the length.
          x = x/length*3;
          y = y/length*3;

          bullet.x = shootx
          bullet.y = shooty

          bullet.dx = x
          bullet.dy = y

          enemy.shootCooldown = 125; // Reset shoot cooldown
        } else {
          enemy.shootCooldown--; // Decrease shoot cooldown timer
        }
      }
    },

    chance: 40,
    spawnScore: 5000,
  },
  [ENEMY_TYPES.INVISIBLE]: {
    score: 150,
    health: 75,
    width: 35,
    height: 35,
    dx: 0,
    dy: 1.35,
    img: loadedEnemyImages[ENEMY_TYPES.INVISIBLE],
    invisibility: 0,

    function: function (enemy) {
      enemy.invisibility++
      if (enemy.invisibility < 200) { 
        
        
      } else if (enemy.invisibility >= 200) {
        enemy.invisibility = 0
      }

      enemy.alpha = Math.abs((100-enemy.invisibility)/100)
    },

    chance: 35,
    spawnScore: 3000,
  },
  [ENEMY_TYPES.FOLLOWER]: {
    score: 200,
    health: 100,
    dx: 1.45,
    dy: 1.45,
    follow: true,
    img: loadedEnemyImages[ENEMY_TYPES.FOLLOWER],

    chance: 30,
    spawnScore: 4000,
  },
  [ENEMY_TYPES.CREEPER]: {
    score: 175,
    health: 50,
    dx: 2.15,
    dy: 2.15,
    follow: true,
    img: loadedEnemyImages[ENEMY_TYPES.CREEPER],

    tick: 0,

    onCollide: function (enemy) {
      
    },

    function: function (enemy) {
      distx = Math.abs(ship.x-enemy.x);
      disty = Math.abs(ship.y-enemy.y);

      if ((distx < ship.width/2 + enemy.width/2 && disty < ship.height/2 + enemy.height/2) | (enemy.tick > 0)) {
        enemy.dx = clamp(enemy.dx-.05, 0, 10);
        enemy.dy = clamp(enemy.dy-.05, 0, 10);
        enemy.width += 0.375;
        enemy.height += 0.375;
        enemy.tick++
      }
      if (enemy.tick > 35) {

        createExplosionEffect(enemy.x+enemy.width/2, enemy.y+enemy.height/2);

        if (distx < ship.width/2 + enemy.width/2 && disty < ship.height/2 + enemy.height/2) {
          dealDamageToShip(30)
        }

        enemies.splice(enemies.findIndex((element) => element == enemy), 1); // Remove enemy
      }
    },

    chance: 40,
    spawnScore: 6000,
  },
  [ENEMY_TYPES.NEUTRALIST]: {
    score: 50,
    health: 200,
    dx: 1,
    dy: 1,
    follow: false,
    img: loadedEnemyImages[ENEMY_TYPES.NEUTRALIST],

    function: function (enemy) {
      if (enemy.health < 200) {
        enemy.dx = 3
        enemy.dy = 3
        enemy.follow = true
        enemy.img = loadedEnemyImages['neutralist_mad']

        enemies.forEach(partner => {
          if (partner.type == ENEMY_TYPES.NEUTRALIST) {
            partner.dx = 3
            partner.dy = 3
            partner.follow = true
            partner.img = loadedEnemyImages['neutralist_mad']
          }
        })
      }
    },

    chance: 10,
    spawnScore: 7000,
  },

  [ENEMY_TYPES.TROPAFRANCA]: {
    score: 15,
    health: 125,

    dx: 0,
    dy: 2.5,
    width: 35,
    height: 40,

    img: loadedEnemyImages[ENEMY_TYPES.TROPAFRANCA],

    chance: 0,
  },
  [ENEMY_TYPES.FRANCOTIRADORFRANCO]: {
    score: 150,
    health: 75,

    dx: 0,
    dy: 2,
    width: 30,
    height: 30,

    moveStopPosition: canvas.height * 0.425, // Adjusted stop position
    shootCooldown: 150, // Adjusted shoot cooldown

    function: function (enemy) {
      if (enemy.y >= enemy.moveStopPosition) {
        if (enemy.shootCooldown <= 0) {
          let bullet = createEnemyBullet(enemy);
          bullet['img'] = loadedImages['bullets']['realistic'];
          bullet['width'] = 5;
          bullet['height'] = 10;
          bullet.dy = 4,

          enemy.shootCooldown = 125; // Reset shoot cooldown
          enemy.height += 12.5
        } else {
          enemy.height -= 0.1
          enemy.shootCooldown--; // Decrease shoot cooldown timer
        }
      }
    },

    img: loadedEnemyImages[ENEMY_TYPES.FRANCOTIRADORFRANCO],

    chance: 0,
  },
  [ENEMY_TYPES.BARRERAFRANCA]: {
    score: 10,
    health: 150,

    moveStopPosition: canvas.height * 0.5, // Adjusted stop position

    dx: 0,
    dy: 3.5,
    width: 55,
    height: 40,

    img: loadedEnemyImages[ENEMY_TYPES.BARRERAFRANCA],

    chance: 0,
  },

  [ENEMY_TYPES.BOSS]: {
    score: 2500,
    health: 100
  }
};

function Enemy(x, y, type) {
  this.x = x;
  this.y = y;
  this.width = 30;
  this.height = 30;
  this.dx = 0;
  this.dy = 1;
  this.type = type;
  
  this.health = 100;
  this.score = 100;

  this.img = loadedEnemyImages[ENEMY_TYPES.NORMAL]

  let properties = ENEMY_PROPERTIES[type]
  for (var key in properties){
    this[key] = properties[key]
  }

  if (this.x === ship) {
    this.x = ship.x
  }
  if (this.y === ship) {
    this.y = ship.y
  }
}

function randomEnemyType() {
  let randomType = ENEMY_TYPES.NORMAL

  let maxchance = 0
  for (const [key, scr] of Object.entries(ENEMY_PROPERTIES)) {
    if (ENEMY_PROPERTIES[key].chance != null) {
      maxchance += ENEMY_PROPERTIES[key].chance
    }
  }

  rdm = Math.random() * maxchance
  i = 0
  for (const [key, scr] of Object.entries(ENEMY_PROPERTIES)) {
    if (ENEMY_PROPERTIES[key].chance != null 
      && (ENEMY_PROPERTIES[key].spawnScore != null && ENEMY_PROPERTIES[key].spawnScore <= score)
      && (ENEMY_PROPERTIES[key].despawnScore == null || ENEMY_PROPERTIES[key].despawnScore >= score)
    ) {
      i += ENEMY_PROPERTIES[key].chance
      if (rdm <= i) { 
        randomType = key
        break
      }
    }
  }

  return randomType
}

function createEnemy() {
  let randomType = randomEnemyType()

  const x = Math.random() * (canvas.width - 30);
  const y = -30;

  enemies.push(new Enemy(x, y, randomType));
}

let enemyBullets = []; // Define enemyBullets array

function moveEnemies() {

  enemies.forEach((enemy, enemyIndex) => {
    if (enemy.isDead == true) {
      if (enemy.type == ENEMY_TYPES.BOSS) {
        nextboss = score + bossdelay
        killedBosses.push(BOSS_TYPE)
        bossSpawned = false
        items.push(new Item(enemy.x+enemy.width/2, enemy.y+enemy.height/2, randomItemType()));
      }
      enemies.splice(enemyIndex, 1);
    } else {
      if (enemy.moveStopPosition) {
        if (enemy.y < enemy.moveStopPosition) {
          enemy.y += enemy.dy; // For other enemy types, just move downwards
        }
        enemy.x += enemy.dx;
      }
      else if (enemy.follow) {
        let enemyx = enemy.x
        let enemyy = enemy.y 
  
        let shipx = ship.x
        let shipy = ship.y
  
        let x=shipx-enemyx, y=shipy-enemyy;
        let length = Math.sqrt(x**2+y**2);
  
        x = x/length;
        y = y/length;
  
        enemy.x += x*enemy.dx;
        enemy.y += y*enemy.dy; // For other enemy types, just move downwards
      } else {
        //enemy.x += enemy.dx;
        enemy.y += enemy.dy; // For other enemy types, just move downwards
      }
      
      if (enemy.function) {
        enemy.function(enemy);
      }
    }
  });

  enemies = enemies.filter(enemy => enemy.y <= canvas.height);
}

function drawEnemies() {
  enemies.forEach(enemy => {

    ctx.save();
    if (enemy.rotation != null) {
      ctx.translate(enemy.x+enemy.width/2, enemy.y+enemy.height/2);
      ctx.rotate(enemy.rotation * (Math.PI/180));
      ctx.translate(-enemy.x-enemy.width/2, -enemy.y-enemy.height/2);
    }
    if (enemy.alpha) {
      ctx.globalAlpha = enemy.alpha; // Set the transparency for the background images
    }
  
    if (enemy.rotation != null) {
      ctx.drawImage(enemy.img, enemy.x, enemy.y, enemy.width, enemy.height);
    } else {
      ctx.drawImage(enemy.img, enemy.x, enemy.y, enemy.width, enemy.height);
    }

    ctx.restore();
    ctx.globalAlpha = 1; // Reset the transparency to default (fully opaque)
    // Draw boss health bar if boss is spawned
    if (bossSpawned && enemy.type === ENEMY_TYPES.BOSS) {
      drawBossHealthBar(enemy);
    }
  });
}

function drawEnemyBullets() {
  enemyBullets.forEach(bullet => {
    ctx.drawImage(bullet.img, bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

function moveEnemyBullets() {
  enemyBullets.forEach((bullet, index) => {

    bullet.x += bullet.dx;
    bullet.y += bullet.dy;

    if (bullet.lifeTime != null) {
      bullet.lifeTime--
      if (bullet.lifeTime <= 0) {
        enemyBullets.splice(index, 1);
      }
    }
  });

  enemyBullets = enemyBullets.filter(bullet => bullet.y <= canvas.height);
}

function createEnemyBullet(enemy) {
  let bullet = {
    x: enemy.x + enemy.width / 2 - 3,
    y: enemy.y + enemy.height,
    width: 6,
    height: 15,
    dx: 0,
    dy: 2, // Adjusted bullet speed
    img: loadedImages['bullets']['bullet']
  };
  enemyBullets.push(bullet);
  return bullet
}

function healShip(amount) {
  ship.health += amount; // Reduce ship health by the specified amount
  
  ship.health = Math.min(ship.health, ship.maxHealth)
}

function dealDamageToShip(damage) {
  if (!ship.immunity) {
    ship.health -= damage; // Reduce ship health by the specified amount
    ship.immunity = true; // Set ship immunity
    ship.immunityTimer = ship.immunityDuration; // Start immunity timer
    
    if (ship.health <= 0) {
      ship.health = 0; // Ensure ship health doesn't go below zero
      
      // Handle ship death logic
      gameOver = true; // Set game over flag
    }
  }
}

const ITEM_TYPES = {
  HAMBURBUR: 'hamburbur',
  MONSTER: 'monster',
  BOLAS: 'bolas',
};

const ITEM_PROPERTIES = {
  [ITEM_TYPES.HAMBURBUR]: {

    onCollide: function(item) {
      healShip(25);
      createEatEffect(item.x + item.width / 2, item.y + item.height / 2); // Generate hit effect at bullet's center
    },
    chance: 100,
    spawnScore: 0,

    img: loadedImages['items'][ITEM_TYPES.HAMBURBUR]
  },
  [ITEM_TYPES.MONSTER]: {

    onCollide: function(item) {

      let effect = {
        duration: 500,
        start: function(effect) {
          ship.fireRate -= 4
        },
        step: function(effect) {

        },
        end: function(effect) {
          ship.fireRate += 4
        },
      }

      ship.effects.push(effect)
      createEatEffect(item.x + item.width / 2, item.y + item.height / 2); // Generate hit effect at bullet's center
    },
    chance: 150,
    spawnScore: 100,

    img: loadedImages['items'][ITEM_TYPES.MONSTER]
  },
  [ITEM_TYPES.BOLAS]: {

    onCollide: function(item) {

      let effect = {
        duration: 500,
        start: function(effect) {
          ship.bulletCount += 2
          ship.damage *= 2
        },
        step: function(effect) {

        },
        end: function(effect) {
          ship.fireRate -= 2
          ship.damage /= 2
        },
      }

      ship.effects.push(effect)
      createEatEffect(item.x + item.width / 2, item.y + item.height / 2); // Generate hit effect at bullet's center
    },
    chance: 150,
    spawnScore: 100,

    img: loadedImages['items'][ITEM_TYPES.BOLAS]
  }
}

function Item(x, y, type) {
  this.x = x;
  this.y = y;
  this.width = 30;
  this.height = 30;
  this.dx = 0;
  this.dy = .5;
  this.type = type;

  this.img = loadedImages['items'][ITEM_TYPES.HAMBURBUR]

  let properties = ITEM_PROPERTIES[type]
  for (var key in properties){
    this[key] = properties[key]
  }
}

function drawItems() {
  items.forEach(item => {
    ctx.drawImage(item.img, item.x, item.y, item.width, item.height);
  });
}

function moveItems() {
  items.forEach((item, index) => {

    item.x += item.dx;
    item.y += item.dy;

    if (item.lifeTime != null) {
      item.lifeTime--
      if (item.lifeTime <= 0) {
        items.splice(index, 1);
      }
    }
  });

  items = items.filter(item => item.y <= canvas.height);
}

function randomItemType() {
  let randomType = ITEM_TYPES.HAMBURBUR

  let maxchance = 0
  for (const [key, scr] of Object.entries(ITEM_PROPERTIES)) {
    if (ITEM_PROPERTIES[key].chance != null) {
      maxchance += ITEM_PROPERTIES[key].chance
    }
  }

  rdm = Math.random() * maxchance
  i = 0
  for (const [key, scr] of Object.entries(ITEM_PROPERTIES)) {
    if (ITEM_PROPERTIES[key].chance != null 
      && (ITEM_PROPERTIES[key].spawnScore != null && ITEM_PROPERTIES[key].spawnScore <= score)
      && (ITEM_PROPERTIES[key].despawnScore == null || ITEM_PROPERTIES[key].despawnScore >= score)
    ) {
      i += ITEM_PROPERTIES[key].chance
      if (rdm <= i) { 
        randomType = key
        break
      }
    }
  }

  return randomType
}

function createItem() {
  let randomType = randomItemType()

  const x = Math.random() * (canvas.width - 30);
  const y = -30;

  items.push(new Item(x, y, randomType));
}

function checkCollisions() {
  // Hit and kill logic for ship bullets hitting enemies
  items.forEach((item, itemIndex) => {

    if (
      item.x < ship.x + ship.width &&
      item.x + item.width > ship.x &&
      item.y < ship.y + ship.height &&
      item.y + item.height > ship.y
    ) {
      if (item.onCollide != null) {
        item.onCollide(item);
      }
      items.splice(itemIndex, 1); // Remove enemy bullet
    }
  });

  ship.bullets.forEach(bullet => {
    enemies.forEach((enemy, enemyIndex) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        let damage = ship.damage/ship.bulletCount
        enemy.health -= damage; // Reduce enemy health when hit by a ship bullet
        ship.bullets.splice(ship.bullets.indexOf(bullet), 1); // Remove ship bullet
        if (enemy.health <= 0 && !enemy.isDying) {
          if (enemy.onDeath != null) {
             enemy.onDeath(enemy);
          }
          if (Math.random()*80 <= 1 && enemy.type != ENEMY_TYPES.BOSS) {
            items.push(new Item(enemy.x+enemy.width/2, enemy.y+enemy.height/2, randomItemType()));
          }
          if (enemy.type != ENEMY_TYPES.BOSS) { 
            enemies.splice(enemyIndex, 1); // Remove enemy if health reaches zero
          }
          score += enemy.score; // Increase score based on enemy type
        } else {
          score += Math.floor(damage/10); // Increase score for hitting an enemy
        }
        createHitEffect(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
      }
    });
  });

  // Collision detection logic for ship bullets with enemy bullets
  ship.bullets.forEach(shipBullet => {
    /*
    enemyBullets.forEach((enemyBullet, bulletIndex) => {
      if (
        shipBullet.x < enemyBullet.x + enemyBullet.width &&
        shipBullet.x + shipBullet.width > enemyBullet.x &&
        shipBullet.y < enemyBullet.y + enemyBullet.height &&
        shipBullet.y + shipBullet.height > enemyBullet.y
      ) {
        ship.bullets.splice(ship.bullets.indexOf(shipBullet), 1); // Remove ship bullet
        enemyBullets.splice(bulletIndex, 1); // Remove enemy bullet

        // Generate hit effect particles at collision point
        createHitEffect(shipBullet.x + shipBullet.width / 2, shipBullet.y + shipBullet.height / 2);
      }
    });
    */
  });

  // Collision detection logic for enemy bullets with ship
  enemyBullets.forEach((enemyBullet, bulletIndex) => {

    if (!ship.immunity && // Check if ship is not immune
      enemyBullet.x < ship.x + ship.width &&
      enemyBullet.x + enemyBullet.width > ship.x &&
      enemyBullet.y < ship.y + ship.height &&
      enemyBullet.y + enemyBullet.height > ship.y
    ) {
      dealDamageToShip(25); // Deal damage to the ship
      if (enemyBullet.destroyOnCollide != false) { 
        enemyBullets.splice(bulletIndex, 1); // Remove enemy bullet
      }
      createHitEffect(enemyBullet.x + enemyBullet.width / 2, enemyBullet.y + enemyBullet.height / 2); // Generate hit effect at bullet's center
    }
  });

  // Collision detection logic for ship with enemies
  enemies.forEach((enemy, enemyIndex) => {
    if (!ship.immunity && // Check if ship is not immune
      ship.x < enemy.x + enemy.width &&
      ship.x + ship.width > enemy.x &&
      ship.y < enemy.y + enemy.height &&
      ship.y + ship.height > enemy.y
    ) {
      if (enemy['onCollide'] != null) {
        enemy.onCollide(enemy)
      } else {
        dealDamageToShip(25); // Deal damage to the ship
        enemies.splice(enemyIndex, 1); // Remove enemy
        createHitEffect(ship.x + ship.width / 2, ship.y + ship.height / 2); // Generate hit effect at ship's center
      }
    }
  });
  
  // Update ship's immunity timer
  if (ship.immunity) {
    ship.immunityTimer--;
    if (ship.immunityTimer <= 0) {
      ship.immunity = false; // End ship immunity when timer reaches zero
    }
  }
}

function createHitEffect(x, y) {
  const numParticles = 10;
  const particleSize = 3;

  for (let i = 0; i < numParticles; i++) {
    const particle = {
      x: x,
      y: y,
      rotation: 0,
      dx: Math.random() * 2 - 1,
      dy: Math.random() * 2 - 1,
      dr: 0,
      alpha: 1,
      da: -1/60,
      color: `rgba(255, ${Math.random() * 255}, 0, 1)`,
      width: particleSize,
      height: particleSize,
      lifespan: Math.random() * 30
    };

    particles.push(particle);
  }
}

function createEatEffect(x, y) {
  let numParticles = 6;
  let particleSize = 6;

  for (let i = 0; i < numParticles; i++) {
    particleSize = Math.random()*6 + 4
    const particle = {
      x: x,
      y: y,
      rotation: 0,
      dx: Math.random() * 2 - 1,
      dy: Math.random() * 2 - 1,
      dr: 0,
      alpha: 1,
      da: -1/50,
      color: `rgba(255, ${Math.random() * 255}, 0, 1)`,
      width: particleSize,
      height: particleSize,
      lifespan: Math.random() * 50,
      img: loadedImages['items']['hamburbur']
    };

    particles.push(particle);
  }
}

function createExplosionEffect(x, y) {
  let numParticles = 10;
  let particleSize = 7;

  for (let i = 0; i < numParticles; i++) {
    const particle = {
      x: x,
      y: y,
      dx: (Math.random() * 2 - 1)*1.25,
      dy: (Math.random() * 2 - 1)*1.25,
      dr: 0,
      rotation: 0,
      color: `rgba(150, ${Math.random() * 100}, 0, 1)`,
      width: particleSize,
      height: particleSize,
      lifespan: Math.random() * 35
    };

    particles.push(particle);
  }

  numParticles = 18;
  particleSize = 3;

  for (let i = 0; i < numParticles; i++) {
    const particle = {
      x: x,
      y: y,
      dx: Math.random() * 2 - 1,
      dy: Math.random() * 2 - 1,
      dr: 0,
      rotation: 0,
      color: `rgba(200, ${Math.random() * 200}, 0, 1)`,
      width: particleSize,
      height: particleSize,
      lifespan: Math.random() * 30
    };

    particles.push(particle);
  }
}

function createWarningEffect(x, y) {

  let particle = {
    x: x-15,
    y: y-15,
    dx: 0,
    dy: 0,
    dr: 0,
    color: `rgba(255, ${Math.random() * 0}, 0, 1)`,
    width: 50,
    height: 50,
    rotation: 0,
    img: loadedImages['particles']['warning'],
    lifespan: Math.random() * 100
  };

  particles.push(particle);
}

function drawParticles() {
  particles.forEach(particle => {

    ctx.save();
    if (particle.rotation != null) {
      ctx.translate(particle.x+particle.width/2, particle.y+particle.height/2);
      ctx.rotate(particle.rotation * (Math.PI/180));
      ctx.translate(-particle.x-particle.width/2, -particle.y-particle.height/2);
    }
    if (particle.alpha) {
      ctx.globalAlpha = particle.alpha; // Set the transparency for the background images
    }

    if (particle.img != null) {
      ctx.drawImage(particle.img, particle.x, particle.y, particle.width, particle.height);
    } else {
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.width, particle.height);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  });
}

function updateParticles() {
  particles.forEach((particle, index) => {
    particle.dx += particle.ax || 0;
    particle.dy += particle.ay || 0;
    particle.dr += particle.ar || 0;

    particle.x += particle.dx;
    particle.y += particle.dy;
    particle.rotation += particle.dr;
    particle.alpha += particle.da || 0;

    particle.lifespan--;

    if (particle.lifespan <= 0) {
      particles.splice(index, 1); // Remove particle if lifespan ends
    }
  });
}

function drawScore() {
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.fillText('Score: ' + score, 10, 20); // Draw score in the top-left corner
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

let enemyCooldown = 0; // Initialize enemy cooldown

function gameLoop() {
	if (gameOver) {
    drawGameOverScreen();
    return; // Stop game loop if game is over
  }
	
  if (!isPaused) {
    clearCanvas();
    moveBackground(); // Move the background
    drawBackground(); // Draw the background
    if (Math.random() < 0.00025) {
      createBackgroundParticle();
    }
    moveBackgroundParticles();
	  drawBackgroundParticles();

    updateEffects();
	
    drawShip();
    moveShip();
    if (spacePressed && ship.fireCooldown <= 0) {
      createBullet();
      ship.fireCooldown = ship.fireRate;
    }
    ship.fireCooldown--;
    drawBullets();
    moveBullets();
    drawEnemies();
    moveEnemies();
	  drawEnemyBullets();
    moveEnemyBullets();
    drawItems();
    moveItems();
    checkCollisions();
    drawParticles(); // Draw particles
    updateParticles(); // Update particles
	
	  drawScore();
    drawHealthBar(); // Draw the health bar

    // Enemy cooldown mechanism
    if (enemyCooldown <= 0 && !bossSpawned) {
      if (score >= nextboss) {
        createBoss(); // Spawn boss enemy when score reaches 1000
        bossSpawned = true;
      } else {
        createEnemy();
        enemyCooldown = clamp(150 - score/1000, 10, 1000); // Set enemy cooldown interval (adjust as needed)
      }
    } else {
      enemyCooldown--; // Decrease enemy cooldown timer
    }
  }
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  // Reset ship properties
  ship.health = 100;
  ship.immunity = false;
  ship.immunityTimer = 0;
  ship.bulletCount = 1; // Reset bullet count
  
  // Destroy all entities in the game
  enemies = [];
  enemyBullets = [];
  items = [];
  
  // Reset particles array
  particles = [];
  
  // Reset other game state variables
  score = 0;
  gameOver = false;
  // Reset any other variables you need to reset
}

function drawGameOverScreen() {
  // Draw game over screen
  // ctx.fillStyle = 'black';
  // ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2 - 20);

  // Draw restart button
  ctx.fillStyle = 'red';
  ctx.fillRect(canvas.width / 2 - 60, canvas.height / 2 + 20, 120, 40);

  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText('Restart', canvas.width / 2 - 30, canvas.height / 2 + 45);

  // Add event listener for restart button click
  canvas.addEventListener('click', restartGame);
}

function restartGame(event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // Check if restart button is clicked
  if (
    mouseX >= canvas.width / 2 - 60 &&
    mouseX <= canvas.width / 2 + 60 &&
    mouseY >= canvas.height / 2 + 20 &&
    mouseY <= canvas.height / 2 + 60
  ) {
    // Reset game variables
    resetGame();

    // Remove event listener
    canvas.removeEventListener('click', restartGame);

    // Restart game loop
    gameLoop();
  }
}

Promise.all([
  new Promise((resolve, reject) => {
    ship.img.onload = resolve;
    ship.img.onerror = reject;
  })
]).then(() => {
  gameLoop();
}).catch(error => {
  console.error('Failed to load image:', error);
});
