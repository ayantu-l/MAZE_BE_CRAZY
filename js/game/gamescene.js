// GameScene runs a whole play session This file also holds the Keyboard and the ScoreBoard it uses.
import { COLOURS, FRESH_START, LEVELS, SCREEN, TIMING } from "./constants.js";
import { drawText } from "./engine.js";
import { SoundManager } from "./assets.js";
import { Level } from "./level.js";

// Keys that would scroll the page if the browser got them
const PAGE_KEYS = [" ", "arrowup", "arrowdown", "arrowleft", "arrowright"];

// Keyboard listens to the whole window.
class Keyboard {
  // shouldBlockPageKeys is a function that says whether the page may not scroll right now
  constructor(shouldBlockPageKeys) {
    this.held = new Set();
    this.pressed = new Set();

    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (PAGE_KEYS.includes(key) && shouldBlockPageKeys()) {
        event.preventDefault();
      }
      if (!event.repeat) {
        this.pressed.add(key);
      }
      this.held.add(key);
    });
    window.addEventListener("keyup", (event) => this.held.delete(event.key.toLowerCase()));
    // Forget all keys when the window loses focus, so the player never keeps walking by himself
    window.addEventListener("blur", () => this.held.clear());
  }

  // True while any of the keys is held down
  isDown(...keys) {
    return keys.some((key) => this.held.has(key));
  }

  // True once for every new press of any of the keys
  wasPressed(...keys) {
    const result = keys.some((key) => this.pressed.has(key));
    keys.forEach((key) => this.pressed.delete(key));
    return result;
  }

  // Forgets presses that happened while nobody listened (for example in the menu)
  forgetPresses() {
    this.pressed.clear();
  }
}

// ScoreBoardreads and writes the list of scores.
class ScoreBoard {
  // Saves the score and tells what happened guest (nobody is logged in) saved (a first score or a new personal best) or kept (the old score is higher)
  save(score) {
    const email = getSession();
    const user = getUsers().find((registered) => registered.email === email);
    if (user === undefined) {
      return "guest";
    }

    const scores = getScores();
    const entry = scores.find((saved) => saved.email === user.email);
    if (entry === undefined) {
      saveScores([...scores, { email: user.email, name: user.fullName, score }]);
      return "saved";
    }
    if (score <= entry.score) {
      return "kept";
    }
    saveScores(scores.map((saved) => (saved === entry ? { ...saved, name: user.fullName, score } : saved)));
    return "saved";
  }
}

// What the end screen says about the saved score
const SAVE_MESSAGES = {
  guest: "Log in to save your score in the rankings.",
  saved: "New personal best! Saved to the rankings.",
  kept: "Your best score is higher. Nothing was changed.",
};

// GameScene tate is menu, playing, between (the banner between two levels) or end.
export class GameScene {
  // canvas is the game canvas, `assets` holds the loaded pictures and sounds
  constructor(canvas, assets) {
    this.context = canvas.getContext("2d");
    this.assets = assets;
    this.sounds = new SoundManager(assets.sounds);
    this.keys = new Keyboard(() => this.state === "playing");
    this.scoreBoard = new ScoreBoard();

    this.state = "menu";
    this.time = 0;
    this.lastFrame = 0;
    this.level = null;
    this.bannerUntil = 0;
    this.result = { won: false, save: "guest" };

    // The menu is shown by game.js it sets this function
    this.onExit = () => {};
    requestAnimationFrame((stamp) => this.loop(stamp));
  }

  // Starts level number (1 to 3) carried is what the player brings from the last level.
  startLevel(number, carried = FRESH_START) {
    this.keys.forgetPresses();
    this.level = new Level(number, this.assets, this.sounds, carried, this.time);
    this.state = "playing";
    this.sounds.startMusic();
    this.draw();
  }

  // Goes back to the menu
  quit() {
    this.sounds.stopMusic();
    this.state = "menu";
    this.onExit();
  }

  // Called by the browser for every frame The clock only moves in small steps, even after a pause.
  loop(stamp) {
    const seconds = this.lastFrame === 0 ? 0 : Math.min((stamp - this.lastFrame) / 1000, 0.05);
    this.lastFrame = stamp;
    this.time += seconds * 1000;
    this.update(seconds);
    this.sounds.followSoundButton();
    this.draw();
    requestAnimationFrame((next) => this.loop(next));
  }

  // Moves the game forward Escape leaves a level reaching the exit goes on; dying ends the game.
  update(seconds) {
    if (this.state === "playing") {
      this.level.update(this.time, seconds, this.keys);
      if (this.keys.wasPressed("escape")) {
        this.quit();
      } else if (this.level.status === "dead") {
        this.finish(false);
      } else if (this.level.status === "complete") {
        this.completeLevel();
      }
    } else if (this.state === "between" && this.time >= this.bannerUntil) {
      this.startLevel(this.level.number + 1, this.level.carried);
    } else if (this.state === "end" && this.keys.wasPressed("r", "enter")) {
      this.quit();
    }
  }

  // Shows the banner and goes on with the next level or ends the game after the last one
  completeLevel() {
    if (this.level.number < LEVELS.length) {
      this.state = "between";
      this.bannerUntil = this.time + TIMING.bannerMs;
    } else {
      this.finish(true);
    }
  }

  // Ends the game saves the score and shows the end screen
  finish(won) {
    this.state = "end";
    this.sounds.stopMusic();
    this.result = { won, save: this.scoreBoard.save(this.level.score) };
  }

  // Draws the level with the banner or the end screen on top when they are shown
  draw() {
    const { number, score } = this.level ?? {};
    if (this.state === "between") {
      this.level.draw(this.context, this.time);
      this.drawScreen(COLOURS.bannerBack, [
        { text: `LEVEL ${number} COMPLETE`, vertical: 350, size: 48, colour: COLOURS.good },
        { text: `SCORE ${score}`, vertical: 405, size: 28, colour: COLOURS.text },
      ]);
    } else if (this.state === "end") {
      const { won, save } = this.result;
      this.drawScreen(COLOURS.endBack, [
        { text: won ? "YOU ESCAPED!" : "GAME OVER", vertical: 260, size: 64, colour: won ? COLOURS.good : COLOURS.danger },
        { text: `FINAL SCORE: ${score}`, vertical: 340, size: 30, colour: COLOURS.text },
        { text: SAVE_MESSAGES[save], vertical: 395, size: 20, colour: COLOURS.muted },
        { text: "PRESS R TO CHOOSE A LEVEL", vertical: 470, size: 24, colour: COLOURS.text },
      ]);
    } else if (this.state === "playing") {
      this.level.draw(this.context, this.time);
    }
  }

  // Covers the screen with a colour and writes centred lines on it
  drawScreen(background, lines) {
    this.context.fillStyle = background;
    this.context.fillRect(0, 0, SCREEN.width, SCREEN.height);
    for (const line of lines) {
      const position = { horizontal: SCREEN.width / 2, vertical: line.vertical };
      drawText(this.context, line.text, position, line.size, line.colour, "center");
    }
  }
}
