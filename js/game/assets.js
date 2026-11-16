// it loads the game pictures and play sounds from constats 
import { LEVELS, PICTURES, SOUND_VOLUMES, SPRITES } from "./constants.js";

// load all the images and sounds before the game start
export class Assets {
  constructor() {
    this.images = {};
    this.sounds = {};
  }

  // loads one images and stores it under name  and fails with a clear message when the file is not thier
  loadImage(name, path) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        this.images[name] = image;
        resolve();
      };
      image.onerror = () => reject(new Error("Cannot load the picture " + path));
      image.src = path;
    });
  }

  // loads all sprite sheets mazes and maps and also creates the sounds
  async load() {
    const files = [
      ["player", SPRITES.player.file],
      ["monster", SPRITES.monster.file],
      ...Object.entries(PICTURES),
    ];

    for (let levelIndex = 0; levelIndex < LEVELS.length; levelIndex++) {
      const level = LEVELS[levelIndex];
      files.push(["maze" + (levelIndex + 1), level.mazeFile]);
      files.push(["map" + (levelIndex + 1), level.mapFile]);
    }

    await Promise.all(files.map(([name, filePath]) => this.loadImage(name, filePath)));

    for (const soundName of Object.keys(SOUND_VOLUMES)) {
      const sound = new Audio("../images/sounds/" + soundName + ".wav");
      sound.preload = "auto";
      this.sounds[soundName] = sound;
    }
  }
}

//  it plays the sounds that assets loaded and controles backgrond music
export class SoundManager {
  constructor(sounds) {
    this.sounds = sounds;
    this.isMusicOn = false;
  }

    // plays a one song only if the sound is there 
  play(name) {
    if (isMuted()) {
      return;
    }
    const copy = this.sounds[name].cloneNode();
    copy.volume = SOUND_VOLUMES[name];
    copy.play().catch(() => {});
  }

  // it start the music loop of the level
  startMusic() {
    this.sounds.explore.loop = true;
    this.sounds.explore.volume = SOUND_VOLUMES.explore;
    this.isMusicOn = true;
    this.followSoundButton();
  }

  // stops the music and resets it
  stopMusic() {
    this.isMusicOn = false;
    this.sounds.explore.pause();
    this.sounds.explore.currentTime = 0;
  }

  // matchs the music to the sound of the button
  followSoundButton() {
    const music = this.sounds.explore;
    if (this.isMusicOn && !isMuted()) {
      if (music.paused) {
        music.play().catch(() => {});
      }
    } else if (!music.paused) {
      music.pause();
    }
  }
}
