// Game page loads the game files, then lets the player start a level with the level buttons.
import { Assets } from "./game/assets.js";
import { GameScene } from "./game/gamescene.js";

const canvas = document.getElementById("game-canvas");
const menu = document.getElementById("level-selection");
const container = document.getElementById("game-container");
const buttons = document.querySelectorAll(".level-btn");

const assets = new Assets();
const loading = assets.load();
let game = null;

// Shows the level menu and hides the game
function showMenu() {
  menu.hidden = false;
  container.hidden = true;
}

// The files start loading as soon as the page opens. The buttons work at once: when a button is pressed
// before the loading has finished, the level starts as soon as the files are ready.
  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      await loading;
      if (game === null) {
        game = new GameScene(canvas, assets);
        game.onExit = showMenu;
      }
      game.startLevel(Number(button.dataset.level));
      menu.hidden = true;
      container.hidden = false;
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
