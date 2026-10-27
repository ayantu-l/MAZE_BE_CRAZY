// Game page loads the game files, then lets the player start a level with the level buttons.
import { Assets } from "./game/assets.js";
import { GameScene } from "./game/gamescene.js";

const canvas = document.getElementById("game-canvas");
const menu = document.getElementById("level-selection");
const container = document.getElementById("game-container");
const buttons = document.querySelectorAll(".level-btn");

// Shows the level menu and hides the game
function showMenu() {
  menu.hidden = false;
  container.hidden = true;
}

// The level buttons start disabled and are enabled when everything is loaded
const assets = new Assets();
assets.load().then(() => {
  const game = new GameScene(canvas, assets);
  game.onExit = showMenu;

  buttons.forEach((button) => {
    button.disabled = false;
    button.addEventListener("click", () => {
      game.startLevel(Number(button.dataset.level));
      menu.hidden = true;
      container.hidden = false;
    });
  });
});

// Pressing F switches between the small game window and the full screen
document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "f" && !container.hidden) {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }
});
