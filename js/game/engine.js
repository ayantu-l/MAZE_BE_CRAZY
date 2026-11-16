// it shared tools for positions, sprites and visual effects 
import { COLOURS, DARKNESS, ECHO, GUN, PLAYER, SCREEN, TIMING } from "./constants.js";

// finds the distance between two positions
export function distanceBetween(first, second) {
  const across = second.horizontal - first.horizontal;
  const down = second.vertical - first.vertical;
  return Math.hypot(across, down);
}

// a new position and all moved by an offset
export function moveBy(position, offset) {
  return {
    horizontal: position.horizontal + offset.horizontal,
    vertical: position.vertical + offset.vertical,
  };
}

// it multiply the horizontal and vertical values by a number
export function scaleBy(position, factor) {
  return {
    horizontal: position.horizontal * factor,
    vertical: position.vertical * factor,
  };
}

// it's keeps a number between a lowest and a highest value
export function clamp(value, lowest, highest) {
  return Math.max(lowest, Math.min(value, highest));
}

// it finds which direction an object is mostly moving
export function directionName(offset) {
  if (Math.abs(offset.horizontal) >= Math.abs(offset.vertical)) {
    return offset.horizontal < 0 ? "left" : "right";
  }
  return offset.vertical < 0 ? "up" : "down";
}


// choose which picture in a sprite sheet to show
class Animator {
  // spec is an entry of sprites firstName is the animation to start with
  constructor(spec, firstName) {
    this.spec = spec;
    this.name = firstName;
    this.seconds = 0;
  }

  // Switches to another animation nothing will happens if it is already playing
  play(name) {
    if (name !== this.name) {
      this.name = name;
      this.seconds = 0;
    }
  }
// adds the time passed to the animation timer
  tick(seconds) {
    this.seconds += seconds;
  }


  // find the current frame in the sprite sheet
  get frame() {
    const animation = this.spec.animations[this.name];
        // time x frames per second gives the animation frame
    let step = Math.floor(this.seconds * animation.fps);
    if (animation.loop) {
      step = step % animation.frames;
    } else {
      step = Math.min(step, animation.frames - 1);
    }
    return animation.row * this.spec.columns + step;
  }
}

// it stores shared drawing and animation code for characters.
export class Entity {
  constructor(image, spec, position, firstAnimation) {
    this.image = image;
    this.spec = spec;
    this.animator = new Animator(spec, firstAnimation);
    this.position = { horizontal: position.horizontal, vertical: position.vertical };
  }
  // return the character display scale.
  get size() {
    return 1;
  }

 // it will convert a game position into a screen position.
  screenPosition(camera) {
    return moveBy(this.position, scaleBy(camera, -1));
  }

  // it will draw the current picture so that the feet stand on the screen position
  draw(context, camera) {
    const frameSize = this.spec.frameSize;
    const frame = this.animator.frame;
    const feet = this.screenPosition(camera);
    const width = frameSize.width * this.size;
    const height = frameSize.height * this.size;

    // Which part of the sheet to cut out
    const sourceLeft = (frame % this.spec.columns) * frameSize.width;
    const sourceTop = Math.floor(frame / this.spec.columns) * frameSize.height;

    // Where to draw it
    const left = feet.horizontal - width * this.spec.feet.horizontal;
    const top = feet.vertical - height * this.spec.feet.vertical;

    context.drawImage(this.image, sourceLeft, sourceTop, frameSize.width, frameSize.height, left, top, width, height);
  }
}

// it draws text with a black outline so that it can be read on every maze
export function drawText(context, text, position, size, colour, align) {
  context.font = "bold " + size + "px " + SCREEN.font;
  context.textAlign = align;
  context.lineWidth = 4;
  context.strokeStyle = COLOURS.outline;
  context.strokeText(text, position.horizontal, position.vertical);
  context.fillStyle = colour;
  context.fillText(text, position.horizontal, position.vertical);
}

// it make the maze dark except near the player
export class Darkness {
  constructor(light) {
    this.light = light;
  }

  // it draws the cover with the hole at centre on the screen
  draw(context, centre, time) {
    const flicker = 1 + Math.sin(time / 90) * 0.015 + Math.sin(time / 37) * 0.01;
    const outer = DARKNESS.outerRadius * this.light * flicker;
    const inner = DARKNESS.innerRadius * this.light * flicker;

    // clear in the middle then darker and darker towards the edge
    const gradient = context.createRadialGradient(centre.horizontal, centre.vertical, 0, centre.horizontal, centre.vertical, outer);
    gradient.addColorStop(0, COLOURS.darknessClear);
    gradient.addColorStop(inner / outer, COLOURS.darknessClear);
    gradient.addColorStop(0.62, COLOURS.darknessMid);
    gradient.addColorStop(1, COLOURS.darknessEdge);
    context.fillStyle = gradient;
    context.fillRect(0, 0, SCREEN.width, SCREEN.height);
  }
}

// echo the timing of the ability and the map of the whole maze
export class Echo {
  // Starts ready to use
  constructor() {
    this.endsAt = 0;
    this.readyAt = 0;
  }

  // True while the map is shown
  isActive(time) {
    return time < this.endsAt;
  }

  // tries to use the echo returns true when it started
  use(time) {
    if (time < this.readyAt) {
      return false;
    }
    this.endsAt = time + ECHO.durationMs;
    this.readyAt = time + ECHO.cooldownMs;
    return true;
  }

  // Text for the hud ready running or recharging
  statusText(time) {
    if (this.isActive(time)) {
      return "ECHO!";
    }
    if (time >= this.readyAt) {
      return "[E] ECHO READY";
    }
    return "ECHO " + Math.ceil((this.readyAt - time) / 1000) + "s";
  }

  // draws one dot on the map position is a place in the maze,the map is shown at corner
  drawDot(context, position, colour, radius, maze, corner, shown) {
    context.fillStyle = colour;
    context.beginPath();
    context.arc(
      corner.horizontal + (position.horizontal / maze.size.width) * shown.width,
      corner.vertical + (position.vertical / maze.size.height) * shown.height,
      radius, 0, Math.PI * 2
    );
    context.fill();
  }

  // it draws the whole maze shrunk to fit the screen with dots for the exit the monsters and the player
  draw(context, level) {
    const maze = level.maze;
    const fit = Math.min(SCREEN.width / maze.image.width, SCREEN.height / maze.image.height) * 0.94;
    const shown = { width: maze.image.width * fit, height: maze.image.height * fit };
    const corner = { horizontal: (SCREEN.width - shown.width) / 2, vertical: (SCREEN.height - shown.height) / 2 };

    context.fillStyle = COLOURS.echoBack;
    context.fillRect(0, 0, SCREEN.width, SCREEN.height);
    context.drawImage(maze.image, corner.horizontal, corner.vertical, shown.width, shown.height);

    this.drawDot(context, maze.exit, COLOURS.good, 9, maze, corner, shown);
    for (const monster of level.monsters) {
      if (!monster.isDying) {
        this.drawDot(context, monster.position, COLOURS.monsterDot, 7, maze, corner, shown);
      }
    }
    this.drawDot(context, level.player.position, COLOURS.text, 7, maze, corner, shown);
  }
}

// draw the health, weapon heat, score and messages
export class Hud {
  // Starts without a notice
  constructor() {
    this.noticeText = "";
    this.noticeColour = COLOURS.text;
    this.noticeUntil = 0;
  }

  // shows a short message near the top of the screen that fades away
  flash(message, colour, time) {
    this.noticeText = message;
    this.noticeColour = colour;
    this.noticeUntil = time + TIMING.noticeMs;
  }

// draw a bar using the current value.
  drawBar(context, area, fraction, fill, back) {
    context.fillStyle = back;
    context.fillRect(area.left, area.top, area.width, area.height);
    context.fillStyle = fill;
    context.fillRect(area.left, area.top, area.width * Math.min(1, fraction), area.height);
  }

  // it draws everything from the state of the level objects on the cnavas
  draw(context, level, time) {
    const player = level.player;
    const gun = player.gun;
    const jammed = gun.isJammed(time);
    const right = SCREEN.width - 16;
    const bottom = SCREEN.height - 16;

    // The two bars
    this.drawBar(context, { left: 46, top: 12, width: 200, height: 16 }, player.health / PLAYER.health, COLOURS.health, COLOURS.healthBack);
    const heatColour = jammed ? COLOURS.jammed : COLOURS.heat;
    this.drawBar(context, { left: 70, top: 38, width: 176, height: 12 }, gun.heat / GUN.maxHeat, heatColour, COLOURS.heatBack);

    // the texts on the left
    drawText(context, "HP", { horizontal: 16, vertical: 26 }, 14, COLOURS.text, "left");
    if (jammed) {
      drawText(context, "JAM " + Math.ceil(gun.jamSecondsLeft(time)), { horizontal: 16, vertical: 50 }, 14, COLOURS.warning, "left");
    } else {
      drawText(context, "HEAT", { horizontal: 16, vertical: 50 }, 14, COLOURS.text, "left");
    }
    drawText(context, level.echo.statusText(time), { horizontal: 16, vertical: bottom }, 18, COLOURS.text, "left");

    // The texts on the right
    drawText(context, String(level.score), { horizontal: right, vertical: 30 }, 24, COLOURS.good, "right");
    drawText(context, "LEVEL " + level.number + "  " + level.definition.name.toUpperCase(), { horizontal: right, vertical: 56 }, 16, COLOURS.muted, "right");
    drawText(context, "WASD: MOVE  SPACE: SHOOT  E: ECHO  F: FULLSCREEN  ESC: MENU", { horizontal: right, vertical: bottom }, 14, COLOURS.muted, "right");

    // The notice fades out during its last 700 milliseconds
    if (time < this.noticeUntil) {
      context.globalAlpha = Math.min(1, (this.noticeUntil - time) / 700);
      drawText(context, this.noticeText, { horizontal: SCREEN.width / 2, vertical: 110 }, 24, this.noticeColour, "center");
      context.globalAlpha = 1;
    }
  }
}
