// Game page: loads the game files, connects the level buttons to the game and shows or hides the menu.
import { Assets } from "./game/assets.js";
import { GameScene } from "./game/gamescene.js";

const canvas = document.getElementById("game-canvas");
const menu = document.getElementById("level-selection");
const container = document.getElementById("game-container");
const message = document.getElementById("game-message");
const buttons = document.querySelectorAll(".level-btn");

const assets = new Assets();
let game = null;

// Shows the level menu again (the game calls this when it ends)
function showMenu() {
  menu.hidden = false;
  container.hidden = true;
}

// Load everything first; the level buttons only work when this has finished.
message.textContent = "Loading game files...";
assets.load()
  .then(() => {
    game = new GameScene(canvas, assets);
    game.onExit = showMenu;
    message.textContent = "Choose a maze to begin.";
  })
  .catch((error) => {
    message.textContent = `The game could not start: ${error.message}`;
  });

// F switches between the small game window and the full screen (only while a level is shown)
document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() !== "f" || container.hidden) {
    return;
  }
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    container.requestFullscreen();
  }
});

// Every level button starts its level with a fresh score
buttons.forEach((button) => {
  button.addEventListener("click", () => {
    if (game !== null) {
      menu.hidden = true;
      container.hidden = false;
      game.startLevel(Number(button.dataset.level));
    }
  });
});
