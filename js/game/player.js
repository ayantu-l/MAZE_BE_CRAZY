// The player the Gun (rule 1, Weapon Overheat) and the Player who walks, shoots and is hurt.
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

// Gun: keeps the heat of the weapon and its upgrade level.
// Ammo is unlimited, but firing too fast fills the heat bar and jams the gun for 5 seconds.
export class Gun {
  constructor() {
    this.heat = 0;
    this.jammedUntil = 0;
    this.nextShotAt = 0;
  }

  // True while the gun is jammed
  isJammed(time) {
    return time < this.jammedUntil;
  }

  // Seconds left until the jam is over
  jamSecondsLeft(time) {
    return Math.max(0, (this.jammedUntil - time) / 1000);
  }

  // Called every frame: the heat goes down by itself. While jammed the heat bar slowly empties.
  cool(time, seconds) {
    if (this.isJammed(time)) {
      this.heat = (GUN.maxHeat * (this.jammedUntil - time)) / GUN.jamMs;
    } else {
      this.heat = Math.max(0, this.heat - GUN.coolPerSecond * seconds);
    }
  }

  // Tries to fire Returns wait (cannot fire now), shot (fired) or jam (fired and the gun jammed).
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


// Player the hero. Walks with W A S D or the arrow keys and shoots with the space bar.
export class Player extends Entity {
  // position is where his feet start stats has the speed, the gun level and the health
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

  // The player is a little bigger than his sprite sheet
  get size() {
    return PLAYER.size;
  }

  // Called every frame: walk, shoot, move the bullets and pick the right animation.
  // Returns the outcome of the gun (wait, shot or jam) so the level can play the matching sound.
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

  // Reads the keys and moves the player, one direction at a time so that he slides along walls
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

    // The player faces the way he walks, and walking diagonally is not faster than walking straight
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

  // Fires one bullet in the direction the player faces, if the gun allows it. Returns the outcome of the gun.
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

  // Chooses the animation hurt, shooting, walking or standing still
  chooseAnimation(time) {
    if (time < this.timers.hurtUntil) {
      this.animator.play("hurt");
    } else if (time < this.timers.shootUntil) {
      this.animator.play(`shoot-${this.facing}`);
    } else {
      this.animator.play(`${this.isMoving ? "walk" : "idle"}-${this.facing}`);
    }
  }

  // Shows the hurt animation for a moment
  markHurt(time) {
    this.timers.hurtUntil = time + TIMING.hurtMs;
  }

  // The player is dead play the death animation once
  die() {
    this.isDead = true;
    this.animator.play("die");
  }

  // Draws the bullets
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
