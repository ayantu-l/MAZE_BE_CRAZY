// it controls how monsters moves, chased and attacks
import { MONSTER, NEIGHBOUR_STEPS, SPRITES, TIMING } from "./constants.js";
import { Entity, directionName, distanceBetween, moveBy, scaleBy } from "./engine.js";

// it will gives each monster movement, health and attacks
export class Enemy extends Entity {
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
  get size() {
    return MONSTER.size;
  }

  // it decides whether to hunt, bite or keep moving in the same direction
  update(time, seconds, player, routes) {
    this.animator.tick(seconds);
    if (this.isDying) {
      return false;
    }

  // the measures how far the monster is from the player
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

  // it will be true when the player is within biting range 
  isCloseByPath(distance, routes) {
    const steps = routes.stepsTo(routes.squareAt(this.position));
    return distance < MONSTER.biteRange && (steps < 0 || steps * routes.tileSize < MONSTER.biteRange * 1.5);
  }

  // moves towards the middle of the target square When it gets there
  walk(seconds, routes) {
    const offset = {
      horizontal: this.target.horizontal - this.position.horizontal,
      vertical: this.target.vertical - this.position.vertical,
    };
     // measure how far the monster is from its next target
    const remaining = Math.hypot(offset.horizontal, offset.vertical);
    if (remaining < MONSTER.arriveDistance) {
      this.chooseNextSquare(routes);
      return;
    }

  // it move only as far as speed time without passing the target
    const speed = this.isHunting ? this.stats.speed : this.stats.speed * MONSTER.wanderSpeedFactor;
    this.position = moveBy(this.position, scaleBy(offset, Math.min(remaining, speed * seconds) / remaining));
    this.facing = directionName(offset);
  }

  // chooses the next square a hunting monster takes the neighbour closest to the player
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

  // it shows true when the step goes back the way the monster came from
  isBehind(step) {
    return this.lastStep !== null && step.columns === -this.lastStep.columns && step.rows === -this.lastStep.rows;
  }

  // chooses the animation attacking, hurt, running or walking
  chooseAnimation(time) {
    if (time < this.timers.attackUntil) {
      this.animator.play("attack-" + this.facing);
    } else if (time < this.timers.hurtUntil) {
      this.animator.play("hurt");
    } else if (this.isHunting && this.facing === "down") {
      this.animator.play("run-down");
    } else {
      this.animator.play("walk-" + this.facing);
    }
  }
// it showsrue when the point is inside the monster body used for bullets
  isHitBy(point) {
    const centre = moveBy(this.position, { horizontal: 0, vertical: -MONSTER.hitHeight * this.size });
    return distanceBetween(point, centre) < MONSTER.hitRadius * this.size;
  }

// the monster is hit and returns true when it died
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

  // it checks whether the monster has finished dying
  isGone(time) {
    return this.isDying && time - this.timers.diedAt > MONSTER.fadeAfterMs;
  }

  // draws the monster a dying monster slowly fades away when it dies 
  draw(context, camera, time) {
    context.globalAlpha = this.isDying ? Math.max(0, 1 - (time - this.timers.diedAt) / MONSTER.fadeAfterMs) : 1;
    super.draw(context, camera);
    context.globalAlpha = 1;
  }
}
