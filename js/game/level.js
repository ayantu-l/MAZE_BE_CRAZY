// Level one maze with its player, monsters echo, darkness and HUD. It runs the rules of the game.
import { COLOURS, DARKNESS, ECHO, EXIT, GUN, LEVELS, SCORE, SCREEN, TIMING } from "./constants.js";
import { Darkness, Echo, Hud, clamp, distanceBetween, moveBy, scaleBy } from "./engine.js";
import { Enemy } from "./enemy.js";
import { Maze } from "./maze.js";
import { Player } from "./player.js";

// Used instead of the keyboard when the player must not react to keys (he is dying)
const NO_KEYS = { isDown: () => false, wasPressed: () => false };

// Level one maze with its player, monsters and rules.
// status is playing, dying (the death animation), complete (reached the exit) or dead.
 // number is the level number, carried is what the player brings from the last level (score, health )
export class Level {
  constructor(number, assets, sounds, carried, time) {
    this.number = number;
    this.definition = LEVELS[number - 1];
    this.images = assets.images;
    this.sounds = sounds;
    this.maze = new Maze(this.images[`maze${number}`], this.images[`map${number}`], this.definition);
    this.player = new Player(this.images.player, this.maze.entrance, {
      speed: this.definition.playerSpeed,
      health: carried.health,
    });

    const { routes } = this.maze;
    this.monsters = [];
    const monsterSpawns = this.maze.pickSpawns(this.definition.monsterCount);
    for (const spawnPosition of monsterSpawns) {
      const floorSquare = routes.floorSquareAt(spawnPosition);
      const monsterPosition = routes.centreOf(floorSquare);
      this.monsters.push(new Enemy(this.images.monster, monsterPosition, this.definition.monsterStats));
    }
    this.echo = new Echo();
    this.darkness = new Darkness(this.definition.light);
    this.hud = new Hud();

    this.score = carried.score;
    this.status = "playing";
    this.startedAt = time;
    this.dyingUntil = 0;
    this.nextGrowlAt = 0;
    this.nextRouteUpdateAt = 0;
    this.routeOrigin = null;
    this.hud.flash(`LEVEL ${number}: ${this.definition.name.toUpperCase()}`, COLOURS.danger, time);
  }

  // What the player takes to the next level
  get carried() {
    return { score: this.score, health: this.player.health };
  }

  // The top left corner of what the screen shows the player is in the middle but never beyond the maze
  get camera() {
    const { position } = this.player;
    return {
      horizontal: clamp(position.horizontal - SCREEN.width / 2, 0, this.maze.size.width - SCREEN.width),
      vertical: clamp(position.vertical - SCREEN.height / 2, 0, this.maze.size.height - SCREEN.height),
    };
  }

  // Moves everything forward by seconds time is the game clock in milliseconds.
  update(time, seconds, keys) {
    const input = this.status === "dying" ? NO_KEYS : keys;
    this.handleGun(this.player.update(time, seconds, input, this.maze.collision), time);
    if (input.wasPressed("e") && this.echo.use(time)) {
      this.startEcho(time);
    }

    this.refreshRoutes(time);
    for (const monster of this.monsters) {
      if (monster.update(time, seconds, this.player, this.maze.routes)) {
        this.hurtPlayer(monster.stats.damage, time);
      }
    }
    this.growlWhenHunted(time);
    this.monsters = this.monsters.filter((monster) => !monster.isGone(time));

    this.checkBulletHits(time);
    this.checkExit(time);
    if (this.status === "dying" && time >= this.dyingUntil) {
      this.status = "dead";
    }
  }

  // Plays the sound that belongs to what the gun just did
  handleGun(outcome, time) {
    if (outcome === "wait") {
      return;
    }
    this.sounds.play("shoot");
    if (outcome === "jam") {
      this.sounds.play("jam");
      this.hud.flash("GUN JAMMED! 5 seconds...", COLOURS.warning, time);
    }
  }

  // Rule 3 the echo alerts every monster
  startEcho(time) {
    this.sounds.play("echo");
    this.hud.flash("ECHO! They know where you are.", COLOURS.echo, time);
    this.monsters.forEach((monster) => {
      monster.timers.alertUntil = time + ECHO.alertMs;
    });
  }

  // Counts the steps from the players square to every square so monsters can find the way to him.
  // It is only redone when the player moves to another square and at most every 150 milliseconds.
  refreshRoutes(time) {
    const { routes } = this.maze;
    const square = routes.floorSquareAt(this.player.position);
    const isSameSquare = this.routeOrigin !== null
      && this.routeOrigin.column === square.column && this.routeOrigin.row === square.row;
    if (time < this.nextRouteUpdateAt || isSameSquare) {
      return;
    }
    routes.measureFrom(square);
    this.routeOrigin = square;
    this.nextRouteUpdateAt = time + TIMING.routeRefreshMs;
  }

  // A hunting monster growls now and then
  growlWhenHunted(time) {
    if (time >= this.nextGrowlAt && this.monsters.some((monster) => monster.isHunting)) {
      this.sounds.play("growl");
      this.nextGrowlAt = time + TIMING.growlGapMs;
    }
  }

  // A monster bites the player When the health is gone the death animation plays and the level ends.
  hurtPlayer(damage, time) {
    this.player.health = Math.max(0, this.player.health - damage);
    this.player.markHurt(time);
    this.sounds.play("hurt");
    if (this.player.health === 0 && this.status === "playing") {
      this.player.die();
      this.sounds.play("die");
      this.status = "dying";
      this.dyingUntil = time + TIMING.deathDelayMs;
    }
  }

  // Checks every bullet against the monsters. A hit hurts a monster and a killed monster gives points.
  checkBulletHits(time) {
    this.player.bullets = this.player.bullets.filter((bullet) => {
      const target = this.monsters.find((monster) => !monster.isDying && monster.isHitBy(bullet.position));
      if (target === undefined) {
        return true;
      }
      this.sounds.play("hit");
      if (target.takeHit(GUN.damage, time)) {
        this.score += SCORE.kill;

      }
      return false;
    });
  }

  // Completes the level when the player reaches the exit faster players get a bigger time bonus
  checkExit(time) {
    if (this.status !== "playing" || distanceBetween(this.player.position, this.maze.exit) > EXIT.reach) {
      return;
    }
    const seconds = Math.floor((time - this.startedAt) / 1000);
    this.score += SCORE.levelBonus + Math.max(0, SCORE.timeBonus - seconds);
    this.sounds.play("win");
    this.status = "complete";
  }

  // Draws the maze, the actors, the darkness, the HUD and (while it lasts) the echo
  draw(context, time) {
    const camera = this.camera;
    context.save();
    context.clearRect(0, 0, SCREEN.width, SCREEN.height);

    this.maze.draw(context, camera);
    this.drawExit(context, camera);
   
    // Monsters and the player are drawn from the back to the front so the lower one is in front
   const actors = [...this.monsters, this.player];
    actors.sort((first, second) => first.position.vertical - second.position.vertical);
    for (const actor of actors) {
      actor.draw(context, camera, time);
    }
    this.player.drawBullets(context, camera, this.images.bullet);

    const light = moveBy(this.player.screenPosition(camera), { horizontal: 0, vertical: -DARKNESS.lift });
    this.darkness.draw(context, light, time);
    this.drawExitGlow(context, camera);
    context.restore();

    this.hud.draw(context, this, time);
    if (this.echo.isActive(time)) {
      this.echo.draw(context, this);
    }
  }

  // The place on the screen where the exit picture is drawn
  exitOnScreen(camera) {
    return moveBy(moveBy(this.maze.exit, scaleBy(camera, -1)), { horizontal: 0, vertical: -EXIT.lift });
  }

  // Draws the exit picture
  drawExit(context, camera) {
    const image = this.images.exit;
    const size = { width: image.width * EXIT.scale, height: image.height * EXIT.scale };
    const centre = this.exitOnScreen(camera);
    context.drawImage(image, centre.horizontal - size.width / 2, centre.vertical - size.height / 2, size.width, size.height);
  }

  // A soft green glow over the darkness so that the exit can be seen from far away
  drawExitGlow(context, camera) {
    const centre = this.exitOnScreen(camera);
    const radius = EXIT.glowRadius;
    const glow = context.createRadialGradient(centre.horizontal, centre.vertical, 5, centre.horizontal, centre.vertical, radius);
    glow.addColorStop(0, COLOURS.exitGlow);
    glow.addColorStop(1, COLOURS.exitGlowClear);
    context.fillStyle = glow;
    context.fillRect(centre.horizontal - radius, centre.vertical - radius, radius * 2, radius * 2);
  }
}


