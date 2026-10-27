// Assets loads every picture and sound once; the SoundManager plays them.
// Assets will keeps the loaded pictures in this.images and the sounds in this.sounds.
import { LEVELS, PICTURES, SOUND_VOLUMES, SPRITES } from "./constants.js";

export class Assets {
  constructor() {
    this.images = {};
    this.sounds = {};
  }

  // Loads one picture and stores it under name fails with a clear message when the file is missing
  loadImage(name, path) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        this.images[name] = image;
        resolve();
      };
      image.onerror = () => reject(new Error(`Cannot load the picture ${path}`));
      image.src = path;
    });
  }

  // Loads all sprite sheets, mazes and maps and creates the sounds
  async load() {
    const files = [
      ["player", SPRITES.player.file],
      ["monster", SPRITES.monster.file],
      ...Object.entries(PICTURES),
    ];

    for (let levelIndex = 0; levelIndex < LEVELS.length; levelIndex++) {
      const level = LEVELS[levelIndex];
      files.push([`maze${levelIndex + 1}`, level.mazeFile]);
      files.push([`map${levelIndex + 1}`, level.mapFile]);
    }

    await Promise.all(files.map(([name, filePath]) => this.loadImage(name, filePath)));

    for (const soundName of Object.keys(SOUND_VOLUMES)) {
      const sound = new Audio(`sounds/${soundName}.wav`);
      sound.preload = "auto";
      this.sounds[soundName] = sound;
    }
  }
}

// SoundManager plays the sounds that Assets loaded and follows the sound button.
export class SoundManager {
  constructor(sounds) {
    this.sounds = sounds;
    this.isMusicOn = false;
  }

    // Plays a sound effect once, unless the sound is switched off
  play(name) {
    if (isMuted()) {
      return;
    }
    const copy = this.sounds[name].cloneNode();
    copy.volume = SOUND_VOLUMES[name];
    copy.play().catch(() => {});
  }

  startMusic() {
    this.sounds.explore.loop = true;
    this.sounds.explore.volume = SOUND_VOLUMES.explore;
    this.isMusicOn = true;
    this.followSoundButton();
  }

  stopMusic() {
    this.isMusicOn = false;
    this.sounds.explore.pause();
    this.sounds.explore.currentTime = 0;
  }

  // Pauses or resumes the music to macth the sound butto
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
