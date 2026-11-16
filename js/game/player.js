// the movement of the player, shoot bullets and update health
import { DIRECTIONS, GUN, PLAYER, SPRITES, TIMING } from "./constants.js";
import { Entity, directionName, moveBy, scaleBy } from "./engine.js";

// The keys that walk the player in each direction
const KEY_BINDINGS = {
  left: ["a", "arrowleft"],
  right: ["d", "arrowright"],
  up: ["w", "arrowup"],
  down: ["s", "arrowdown"],
};

// The key that fires the gun
const FIRE_KEY = " ";


// control when the player can shoot and when the gun jams
export class Gun {
  constructor() {
    this.heat = 0;
    this.jammedUntil = 0;
    this.nextShotAt = 0;
  }

  // check if the weapon is still jamme
  isJammed(time) {
    return time < this.jammedUntil;
  }

  // calaculate how many Seconds left until the jam is over
  jamSecondsLeft(time) {
    return Math.max(0, (this.jammedUntil - time) / 1000);
  }

  // it called every frame the heat goes down by itself while jammed the heat bar slowly emptie
  cool(time, seconds) {
    if (this.isJammed(time)) {
      this.heat = (GUN.maxHeat * (this.jammedUntil - time)) / GUN.jamMs;
    } else {
      this.heat = Math.max(0, this.heat - GUN.coolPerSecond * seconds);
    }
  }

  // checkes if the gun can fire, then add heat
  fire(time) {
    if (this.isJammed(time) || time < this.nextShotAt) {
      return "wait";
    }
    this.nextShotAt = time + GUN.delayMs;
    this.heat += GUN.heatPerShot;
    if (this.heat < GUN.maxHeat) {
      return "shot";
    }
    this.heat = GUN.maxHeat;
    this.jammedUntil = time + GUN.jamMs;
    return "jam";
  }
  }

// handles player movement, shooting and animations
export class Player extends Entity {
  // it shows the position is where his feet start stats has the speed and the health
  constructor(image, position, { speed, health }) {
    super(image, SPRITES.player, position, "idle-down");
    this.speed = speed;
    this.gun = new Gun();
    this.health = health;
    this.facing = "right";
    this.isMoving = false;
    this.isDead = false;
    this.timers = { hurtUntil: 0, shootUntil: 0 };
    this.bullets = [];
  }

 // return the player sprite size
  get size() {
    return PLAYER.size;
  }

 // it updates movement, bullets, gun heat and animation
  update(time, seconds, keys, collision) {
    this.gun.cool(time, seconds);
    this.moveBullets(time, seconds, collision);
    this.animator.tick(seconds);
    if (this.isDead) {
      return "wait";
    }

    this.walk(seconds, keys, collision);
    const outcome = keys.isDown(FIRE_KEY) ? this.shoot(time) : "wait";
    this.chooseAnimation(time);
    return outcome;
  }

  // Reads the keys and moves the playe in one direction at a time so that he slides along walls
  walk(seconds, keys, collision) {
    let movement = { horizontal: 0, vertical: 0 };
    for (const directionName of Object.keys(KEY_BINDINGS)) {
      const directionKeys = KEY_BINDINGS[directionName];
      if (keys.isDown(...directionKeys)) {
        movement = moveBy(movement, DIRECTIONS[directionName]);
      }
    }
    const strength = Math.hypot(movement.horizontal, movement.vertical);
    this.isMoving = strength > 0;
    if (!this.isMoving) {
      return;
    }

    // the player faces the way he walks and walking diagonally is not faster than walking straight
    this.facing = directionName(movement);
    const step = scaleBy(movement, (this.speed * seconds) / strength);

    for (const axis of ["horizontal", "vertical"]) {
      const nextPosition = { ...this.position };
      nextPosition[axis] += step[axis];
      if (!collision.isBlocked(nextPosition)) {
        this.position = nextPosition;
      }
    }
  }

// creates a bullet in the direction the player faces
  shoot(time) {
    const outcome = this.gun.fire(time);
    if (outcome === "wait") {
      return outcome;
    }

    const direction = DIRECTIONS[this.facing];
    const muzzle = moveBy(scaleBy(PLAYER.muzzle[this.facing], PLAYER.size), scaleBy(direction, GUN.muzzleReach));
    this.bullets.push({
      position: moveBy(this.position, muzzle),
      velocity: scaleBy(direction, GUN.bulletSpeed),
      angle: Math.atan2(direction.vertical, direction.horizontal),
      firedAt: time,
    });
    this.timers.shootUntil = time + TIMING.shootMs;
    return outcome;
  }
// moves every bullet and removes the ones that hit a wall or flew too long
  moveBullets(time, seconds, collision) {
    const activeBullets = [];
    for (const bullet of this.bullets) {
      bullet.position = moveBy(bullet.position, scaleBy(bullet.velocity, seconds));
      const hasExpired = time - bullet.firedAt > GUN.bulletLifeMs;
      const hitWall = collision.isWall(bullet.position);
      if (!hasExpired && !hitWall) {
        activeBullets.push(bullet);
      }
    }
    this.bullets = activeBullets;
  }

  // it chooses the animation hurt, shooting, walking or standing still
  chooseAnimation(time) {
    if (time < this.timers.hurtUntil) {
      this.animator.play("hurt");
    } else if (time < this.timers.shootUntil) {
      this.animator.play("shoot-" + this.facing);
    } else {
      this.animator.play((this.isMoving ? "walk" : "idle") + "-" + this.facing);
    }
  }

  // shows the hurt animation for a moment
  markHurt(time) {
    this.timers.hurtUntil = time + TIMING.hurtMs;
  }

  // the player is dead play the death animation once
  die() {
    this.isDead = true;
    this.animator.play("die");
  }

   // draws bullets at their current positions
  drawBullets(context, camera, image) {
    this.bullets.forEach((bullet) => {
      const onScreen = moveBy(bullet.position, scaleBy(camera, -1));
      const size = { width: image.width * GUN.bulletScale, height: image.height * GUN.bulletScale };
      context.save();
      context.translate(onScreen.horizontal, onScreen.vertical);
      context.rotate(bullet.angle);
      context.drawImage(image, -size.width / 2, -size.height / 2, size.width, size.height);
      context.restore();
    });
  }
}
