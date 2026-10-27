// The engine small helpers and the building blocks the game is made of.
//   helpers  - distance, moving and scaling positions (a position is horizontal, vertical )
//   Animator and Entity - an animated sprite at a position (the base of the player and the monsters)
//   drawText, Darkness, Echo, Hud - everything that is drawn over the maze
import { COLOURS, DARKNESS, ECHO, GUN, PLAYER, SCREEN, TIMING } from "./constants.js";

// How far apart two positions are
export function distanceBetween(first, second) {
  const across = second.horizontal - first.horizontal;
  const down = second.vertical - first.vertical;
  return Math.hypot(across, down);
}

// A new position, moved by an offset
export function moveBy(position, offset) {
  return {
    horizontal: position.horizontal + offset.horizontal,
    vertical: position.vertical + offset.vertical,
  };
}

// A new position, multiplied by a number
export function scaleBy(position, factor) {
  return {
    horizontal: position.horizontal * factor,
    vertical: position.vertical * factor,
  };
}

// Keeps a number between a lowest and a highest value
export function clamp(value, lowest, highest) {
  return Math.max(lowest, Math.min(value, highest));
}

// The main direction of an offset left, ight, up or down
export function directionName(offset) {
  if (Math.abs(offset.horizontal) >= Math.abs(offset.vertical)) {
    return offset.horizontal < 0 ? "left" : "right";
  }
  return offset.vertical < 0 ? "up" : "down";
}

// Animator plays one animation at a time and tells which picture of the sheet to show.
class Animator {
  // spec is an entry of SPRITES, firstName is the animation to start with
  constructor(spec, firstName) {
    this.spec = spec;
    this.name = firstName;
    this.seconds = 0;
  }

  // Switches to another animation (nothing happens if it is already playing)
  play(name) {
    if (name !== this.name) {
      this.name = name;
      this.seconds = 0;
    }
  }

  // Moves the animation forward in time
  tick(seconds) {
    this.seconds += seconds;
  }

  // The number of the picture to show now (the sheet is counted row by row)
  get frame() {
    const animation = this.spec.animations[this.name];
    let step = Math.floor(this.seconds * animation.fps);
    if (animation.loop) {
      step = step % animation.frames;
    } else {
      step = Math.min(step, animation.frames - 1);
    }
    return animation.row * this.spec.columns + step;
  }
}

// Entity the base of the player and the monsters. It has a position (the feet) and an animated sprite.
export class Entity {
  //imag` is the sprite sheet, spec an entry of SPRITES, position where the feet are
  constructor(image, spec, position, firstAnimation) {
    this.image = image;
    this.spec = spec;
    this.animator = new Animator(spec, firstAnimation);
    this.position = { horizontal: position.horizontal, vertical: position.vertical };
  }

  // How much bigger than the sheet the sprite is drawn (the player and the monsters change this)
  get size() {
    return 1;
  }

  // Where the feet are on the screen camera is the top left corner of what the screen shows.
  screenPosition(camera) {
    return moveBy(this.position, scaleBy(camera, -1));
  }

  // Draws the current picture so that the feet stand on the screen position
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

// Draws text with a black outline so that it can be read on every maze
export function drawText(context, text, position, size, colour, align) {
  context.font = `bold ${size}px ${SCREEN.font}`;
  context.textAlign = align;
  context.lineWidth = 4;
  context.strokeStyle = COLOURS.outline;
  context.strokeText(text, position.horizontal, position.vertical);
  context.fillStyle = colour;
  context.fillText(text, position.horizontal, position.vertical);
}

// Darkness a black cover with a clear hole around the player. The light flickers a little.
// light makes the hole bigger (1) or smaller (less than 1)
export class Darkness {
  constructor(light) {
    this.light = light;
  }

  // Draws the cover with the hole at `centre` on the screen
  draw(context, centre, time) {
    const flicker = 1 + Math.sin(time / 90) * 0.015 + Math.sin(time / 37) * 0.01;
    const outer = DARKNESS.outerRadius * this.light * flicker;
    const inner = DARKNESS.innerRadius * this.light * flicker;

    // Clear in the middle then darker and darker towards the edge
    const gradient = context.createRadialGradient(centre.horizontal, centre.vertical, 0, centre.horizontal, centre.vertical, outer);
    gradient.addColorStop(0, COLOURS.darknessClear);
    gradient.addColorStop(inner / outer, COLOURS.darknessClear);
    gradient.addColorStop(0.62, COLOURS.darknessMid);
    gradient.addColorStop(1, COLOURS.darknessEdge);
    context.fillStyle = gradient;
    context.fillRect(0, 0, SCREEN.width, SCREEN.height);
  }
}

// Echo the timing of the ability and the map of the whole maze.
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

  // Tries to use the echo Returns true when it started.
  use(time) {
    if (time < this.readyAt) {
      return false;
    }
    this.endsAt = time + ECHO.durationMs;
    this.readyAt = time + ECHO.cooldownMs;
    return true;
  }

  // Text for the HU ready, running or recharging
  statusText(time) {
    if (this.isActive(time)) {
      return "ECHO!";
    }
    if (time >= this.readyAt) {
      return "[E] ECHO READY";
    }
    return `ECHO ${Math.ceil((this.readyAt - time) / 1000)}s`;
  }

  // Draws one dot on the map osition is a place in the maze, the map is shown at corner.
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

  // Draws the whole maze, shrunk to fit the screen, with dots for the exit, the monsters and the player
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

// Hud the health bar, the gun heat bar, texts and short notices, fixed to the screen.
export class Hud {
  // Starts without a notice
  constructor() {
    this.noticeText = "";
    this.noticeColour = COLOURS.text;
    this.noticeUntil = 0;
  }

  // Shows a short message near the top of the screen that fades away
  flash(message, colour, time) {
    this.noticeText = message;
    this.noticeColour = colour;
    this.noticeUntil = time + TIMING.noticeMs;
  }

  // Draws a bar back is the empty bar and fill covers fraction (0 to 1) of it
  drawBar(context, area, fraction, fill, back) {
    context.fillStyle = back;
    context.fillRect(area.left, area.top, area.width, area.height);
    context.fillStyle = fill;
    context.fillRect(area.left, area.top, area.width * Math.min(1, fraction), area.height);
  }

  // Draws everything from the state of the level
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

    // The texts on the left
    drawText(context, "HP", { horizontal: 16, vertical: 26 }, 14, COLOURS.text, "left");
    if (jammed) {
      drawText(context, `JAM ${Math.ceil(gun.jamSecondsLeft(time))}`, { horizontal: 16, vertical: 50 }, 14, COLOURS.warning, "left");
    } else {
      drawText(context, "HEAT", { horizontal: 16, vertical: 50 }, 14, COLOURS.text, "left");
    }
    drawText(context, level.echo.statusText(time), { horizontal: 16, vertical: bottom }, 18, COLOURS.text, "left");

    // The texts on the right
    drawText(context, String(level.score), { horizontal: right, vertical: 30 }, 24, COLOURS.good, "right");
    drawText(context, `LEVEL ${level.number}  ${level.definition.name.toUpperCase()}`, { horizontal: right, vertical: 56 }, 16, COLOURS.muted, "right");
    drawText(context, "WASD: MOVE  SPACE: SHOOT  E: ECHO  F: FULLSCREEN  ESC: MENU", { horizontal: right, vertical: bottom }, 14, COLOURS.muted, "right");

    // The notice fades out during its last 700 milliseconds
    if (time < this.noticeUntil) {
      context.globalAlpha = Math.min(1, (this.noticeUntil - time) / 700);
      drawText(context, this.noticeText, { horizontal: SCREEN.width / 2, vertical: 110 }, 24, this.noticeColour, "center");
      context.globalAlpha = 1;
    }
  }
}
