// Game page loads the game files, then lets the player start a level with the level buttons.
import { Assets } from "./game/assets.js";
import { GameScene } from "./game/gamescene.js";

// gamePage connects the level menu and the canvas to the game
class GamePage {
  constructor() {
    this.menu = document.getElementById("level-selection");
    this.container = document.getElementById("game-container");
    this.assets = new Assets();
    this.loading = this.assets.load();
    this.game = null;

    // each level button starts its level
    document.querySelectorAll(".level-btn").forEach((button) => {
      button.addEventListener("click", () => this.startLevel(Number(button.dataset.level)));
    });

    // F switches full screen on and off
    document.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "f" && !this.container.hidden) {
        this.toggleFullscreen();
      }
    });
  }

  //waits for the files then starts the chosen level
  async startLevel(number) {
    await this.loading;
    if (this.game === null) {
      this.game = new GameScene(document.getElementById("game-canvas"), this.assets);
      this.game.onExit = () => this.showMenu();
    }
    this.game.startLevel(number);
    this.menu.hidden = true;
    this.container.hidden = false;
  }

  // shows the level menu and hides the game
  showMenu() {
    this.menu.hidden = false;
    this.container.hidden = true;
  }

  // turns full screen on or off
  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.container.requestFullscreen();
    }
  }
}

new GamePage();