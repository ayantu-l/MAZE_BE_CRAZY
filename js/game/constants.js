// Settings shared by the whole game. Everything is grouped in objects so it can be changed in one place.
// A position is always an object like horizontal, vertical , measured in game pixels.

// The maze pictures are drawn scale times bigger than the files. For route finding the maze is cut into squares of cellPixels picture pixels. Monsters keep afeMargin squares away from every wall.
export const SCREEN = { width: 1280, height: 720, font: '"Courier New", Courier, monospace' };

export const MAZE_GRID = { scale: 1.5, cellPixels: 4 };
export const TILE_SIZE = MAZE_GRID.cellPixels * MAZE_GRID.scale;

export const DIRECTIONS = {
  left: { horizontal: -1, vertical: 0 },
  right: { horizontal: 1, vertical: 0 },
  up: { horizontal: 0, vertical: -1 },
  down: { horizontal: 0, vertical: 1 },
};

// The four squares next to a grid square as a step in columns and rows
export const NEIGHBOUR_STEPS = Object.values(DIRECTIONS).map(({ horizontal, vertical }) => ({
  columns: horizontal,
  rows: vertical,
}));

// Sprite sheets: the file, the size of one picture, the number of columns, where the feet are inside one
// picture (0 to 1) and every animation (row of the sheet, number of pictures, speed and whether it repeats).
export const SPRITES = {
  player: {
    file: "images/player.png",
    frameSize: { width: 90, height: 118 },
    columns: 7,
    feet: { horizontal: 0.5, vertical: 0.9661 },
    animations: {
      "idle-down": { row: 0, frames: 3, fps: 4, loop: true },
      "walk-down": { row: 1, frames: 5, fps: 10, loop: true },
      "idle-right": { row: 2, frames: 5, fps: 4, loop: true },
      "walk-right": { row: 3, frames: 6, fps: 10, loop: true },
      "idle-left": { row: 4, frames: 5, fps: 4, loop: true },
      "walk-left": { row: 5, frames: 6, fps: 10, loop: true },
      "idle-up": { row: 6, frames: 5, fps: 4, loop: true },
      "walk-up": { row: 7, frames: 7, fps: 10, loop: true },
      "shoot-down": { row: 8, frames: 4, fps: 14, loop: true },
      "shoot-right": { row: 9, frames: 3, fps: 14, loop: true },
      "shoot-left": { row: 10, frames: 3, fps: 14, loop: true },
      "shoot-up": { row: 11, frames: 3, fps: 14, loop: true },
      "hurt": { row: 12, frames: 3, fps: 8, loop: true },
      "die": { row: 13, frames: 4, fps: 6, loop: false },
    },
  },
  monster: {
    file: "images/monster.png",
    frameSize: { width: 148, height: 107 },
    columns: 6,
    feet: { horizontal: 0.5, vertical: 0.9626 },
    animations: {
      "idle-down": { row: 0, frames: 3, fps: 4, loop: true },
      "walk-down": { row: 1, frames: 4, fps: 6, loop: true },
      "run-down": { row: 2, frames: 6, fps: 10, loop: true },
      "walk-right": { row: 3, frames: 2, fps: 5, loop: true },
      "walk-left": { row: 4, frames: 2, fps: 5, loop: true },
      "walk-up": { row: 5, frames: 3, fps: 6, loop: true },
      "attack-down": { row: 6, frames: 4, fps: 10, loop: true },
      "attack-right": { row: 7, frames: 4, fps: 10, loop: true },
      "attack-left": { row: 8, frames: 4, fps: 10, loop: true },
      "attack-up": { row: 9, frames: 4, fps: 10, loop: true },
      "hurt": { row: 10, frames: 3, fps: 10, loop: true },
      "die": { row: 11, frames: 3, fps: 5, loop: false },
    },
  },
};

// The player body is the small box at his feet that touches the walls. `muzzle` is where a bullet leaves
// the gun for every direction, measured from his feet in sprite pixels.
export const PLAYER = {
  size: 1.1,
  health: 100,
  body: { halfWidth: 16, height: 14 },
  muzzle: {
    right: { horizontal: 24, vertical: -57 },
    left: { horizontal: -22, vertical: -56 },
    up: { horizontal: 10, vertical: -90 },
    down: { horizontal: 0, vertical: -34 },
  },
};

// Weapon Overheat ammo is unlimited, but every shot heats the gun. A full gun jams for jamMs.
// Every upgrade (rule 2) makes the gun shoot faster and heat up less, up to maxLevel.
export const GUN = {
  damage: 1,
  delayMs: 230,
  heatPerShot: 13,
  bulletSpeed: 650,
  bulletLifeMs: 900,
  muzzleReach: 12,
  bulletScale: 0.8,
  maxHeat: 100,
  coolPerSecond: 28,
  jamMs: 5000,
};

// Echo show the whole maze, but every monster learns where the player is.
export const ECHO = { durationMs: 3000, cooldownMs: 15000, alertMs: 8000 };

// The monsters The hit circle is in sprite pixels and is multiplied by the size.
export const MONSTER = {
  size: 0.95,
  seeRange: 600,
  biteRange: 85,
  biteDelayMs: 900,
  hitRadius: 50,
  hitHeight: 40,
  wanderSpeedFactor: 0.6,
  arriveDistance: 1.5,
  fadeAfterMs: 1200,
};

export const SCORE = { kill: 100, levelBonus: 200, timeBonus: 150 };

// The levels (to add the next one, copy the object below and change the values, see the README).
// Positions are in pixels of the maze picture: the entrance is the gap in the left wall, the exit the gap in the right wall. Every level has more and tougher monsters and less light.
export const LEVELS = [
  {
    name: "Stone Dungeon",
    mazeFile: "images/mazes/level1.png",
    mapFile: "images/maps/level1.png",
    light: 1.0,
    playerSpeed: 130,
    monsterCount: 6,
    monsterStats: { health: 3, speed: 45, damage: 8 },
    entrance: { horizontal: 40, vertical: 562 },
    exit: { horizontal: 1214, vertical: 562 },
  },
];

// The exit of a maze. The level is finished when the player comes closer than `reach`.
export const EXIT = { reach: 60, scale: 1.3, lift: 20, glowRadius: 120 };

// Short times in milliseconds
export const TIMING = {
  hurtMs: 250,
  shootMs: 250,
  attackMs: 400,
  deathDelayMs: 1500,
  bannerMs: 2200,
  noticeMs: 2500,
  growlGapMs: 3500,
  routeRefreshMs: 150,
};

// The size of the light around the player. Both circles are multiplied by the light of the level.
export const DARKNESS = { outerRadius: 520, innerRadius: 150, lift: 40 };

// The volume of every sound file in the sounds folder (0 to 1). "explore" is the music loop.
export const SOUND_VOLUMES = {
  shoot: 0.35, hit: 0.5, hurt: 0.6, jam: 0.7, echo: 0.7, win: 0.8, die: 0.8, growl: 0.4, explore: 0.5,
};

// Pictures that are not sprite sheets or mazes
export const PICTURES = { bullet: "images/bullet.png", exit: "images/exit.png" };

// Colours used for texts, bars and the darkness. They are written in css/style.css (the --game-... variables)
// and read from there, so all colours of the website and the game are in one place.
const cssStyle = getComputedStyle(document.documentElement);

// Reads one colour variable from the stylesheet
function cssColour(name) {
  return cssStyle.getPropertyValue(name).trim();
}

export const COLOURS = {
  text: cssColour("--game-text"),
  muted: cssColour("--game-muted"),
  good: cssColour("--game-good"),
  danger: cssColour("--game-danger"),
  warning: cssColour("--game-warning"),
  health: cssColour("--game-health"),
  healthBack: cssColour("--game-health-back"),
  heat: cssColour("--game-heat"),
  heatBack: cssColour("--game-heat-back"),
  jammed: cssColour("--game-jammed"),
  echo: cssColour("--game-echo"),
  outline: cssColour("--game-outline"),
  echoBack: cssColour("--game-echo-back"),
  monsterDot: cssColour("--game-monster-dot"),
  bannerBack: cssColour("--game-banner-back"),
  endBack: cssColour("--game-end-back"),
  darknessClear: cssColour("--game-darkness-clear"),
  darknessMid: cssColour("--game-darkness-mid"),
  darknessEdge: cssColour("--game-darkness-edge"),
  exitGlow: cssColour("--game-exit-glow"),
  exitGlowClear: cssColour("--game-exit-glow-clear"),
};

// What the player takes from one level to the next
export const FRESH_START = { score: 0, health: PLAYER.health };
