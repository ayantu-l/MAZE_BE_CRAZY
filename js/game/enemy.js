// The monsters Enemy a maze creature that wanders, hunts and bites 
import { MONSTER, NEIGHBOUR_STEPS, SPRITES, TIMING } from "./constants.js";
import { Entity, directionName, distanceBetween, moveBy, scaleBy } from "./engine.js";

// Enemy walks from the middle of one safe square to the middle of the next.
// It wanders until it sees the player (or hears the echo), then follows the shortest way to him.
export class Enemy extends Entity {
  // stats holds the health, speed and damage of this levels monsters
  constructor(image, position, stats) {
    super(image, SPRITES.monster, position, "idle-down");
    this.stats = { ...stats };
    this.facing = "down";
    this.isHunting = false;
    this.isDying = false;
    this.target = { ...position };
    this.lastStep = null;
    this.timers = { diedAt: 0, alertUntil: 0, hurtUntil: 0, attackUntil: 0, nextBiteAt: 0 };
  }

  // The size of the picture it grows with every mutation
  get size() {
    return MONSTER.size;
  }

  // Called every frame. routes knows how many steps every square is from the player.
  // Returns true when the monster bit the player.
  update(time, seconds, player, routes) {
    this.animator.tick(seconds);
    if (this.isDying) {
      return false;
    }

    // A monster hunts when the player is close or when the echo told it where he is (rule 3)
    const distance = distanceBetween(this.position, player.position);
    this.isHunting = distance < MONSTER.seeRange || time < this.timers.alertUntil;

    const bites = !player.isDead && time >= this.timers.nextBiteAt && this.isCloseByPath(distance, routes);
    if (bites) {
      this.timers.nextBiteAt = time + MONSTER.biteDelayMs;
      this.timers.attackUntil = time + TIMING.attackMs;
    }

    this.walk(seconds, routes);
    this.chooseAnimation(time);
    return bites;
  }

  // True when the player is within biting range along the corridors so a monster cannot bite through a wall
  isCloseByPath(distance, routes) {
    const steps = routes.stepsTo(routes.squareAt(this.position));
    return distance < MONSTER.biteRange && (steps < 0 || steps * routes.tileSize < MONSTER.biteRange * 1.5);
  }

  // Moves towards the middle of the target square When it gets there, the next square is chosen.
  walk(seconds, routes) {
    const offset = {
      horizontal: this.target.horizontal - this.position.horizontal,
      vertical: this.target.vertical - this.position.vertical,
    };
    const remaining = Math.hypot(offset.horizontal, offset.vertical);
    if (remaining < MONSTER.arriveDistance) {
      this.chooseNextSquare(routes);
      return;
    }

    const speed = this.isHunting ? this.stats.speed : this.stats.speed * MONSTER.wanderSpeedFactor;
    this.position = moveBy(this.position, scaleBy(offset, Math.min(remaining, speed * seconds) / remaining));
    this.facing = directionName(offset);
  }

  // Chooses the next square A hunting monster takes the neighbour closest to the player
  // a wandering monster takes a random neighbour and does not turn bac
  chooseNextSquare(routes) {
    const here = routes.floorSquareAt(this.position);
    const options = [];
    for (const step of NEIGHBOUR_STEPS) {
      const square = routes.neighbour(here, step);
      if (routes.isFloor(square)) {
        options.push({ step, square });
      }
    }
    if (options.length === 0) {
      return;
    }

    let closest = null;
    if (this.isHunting) {
      for (const option of options) {
        const distance = routes.stepsTo(option.square);
        if (distance >= 0 && (closest === null || distance < routes.stepsTo(closest.square))) {
          closest = option;
        }
      }
    }

 const forwardOptions = options.filter((option) => !this.isBehind(option.step));
    const choices = forwardOptions.length > 0 ? forwardOptions : options;
    const randomIndex = Math.floor(Math.random() * choices.length);
    const choice = closest ?? choices[randomIndex];

    this.lastStep = choice.step;
    this.target = routes.centreOf(choice.square);
  }

  // True when the step goes back the way the monster came from
  isBehind(step) {
    return this.lastStep !== null && step.columns === -this.lastStep.columns && step.rows === -this.lastStep.rows;
  }

  // Chooses the animation: attacking, hurt, running or walking
  chooseAnimation(time) {
    if (time < this.timers.attackUntil) {
      this.animator.play(`attack-${this.facing}`);
    } else if (time < this.timers.hurtUntil) {
      this.animator.play("hurt");
    } else if (this.isHunting && this.facing === "down") {
      this.animator.play("run-down");
    } else {
      this.animator.play(`walk-${this.facing}`);
    }
  }
// True when the point is inside the monster's body used for bullets
  isHitBy(point) {
    const centre = moveBy(this.position, { horizontal: 0, vertical: -MONSTER.hitHeight * this.size });
    return distanceBetween(point, centre) < MONSTER.hitRadius * this.size;
  }

// The monster is hit Returns true when it died
  takeHit(damage, time) {
    this.stats.health -= damage;
    this.timers.hurtUntil = time + TIMING.hurtMs;
    if (this.stats.health > 0) {
      return false;
    }
    this.isDying = true;
    this.timers.diedAt = time;
    this.animator.play("die");
    return true;
  }

  // True when the death animation has been shown and the monster can be removed
  isGone(time) {
    return this.isDying && time - this.timers.diedAt > MONSTER.fadeAfterMs;
  }

  // Draws the monster a dying monster slowly fades away
  draw(context, camera, time) {
    context.globalAlpha = this.isDying ? Math.max(0, 1 - (time - this.timers.diedAt) / MONSTER.fadeAfterMs) : 1;
    super.draw(context, camera);
    context.globalAlpha = 1;
  }
}
