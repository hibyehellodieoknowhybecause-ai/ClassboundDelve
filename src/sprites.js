export const spriteSheets = {
  swordsman: {
    src: "./assets/sprites/swordsman.png",
    frameWidth: 64,
    frameHeight: 64,
    drawWidth: 96,
    drawHeight: 96,
    animations: {
      idle: { row: 0, frames: 4, fps: 5 },
      walk: { row: 1, frames: 4, fps: 8 },
      attack: { row: 2, frames: 4, fps: 12 },
      whirlwind: { row: 3, frames: 8, fps: 18 },
      hurt: { row: 4, frames: 2, fps: 6 }
    }
  },
  archer: {
    src: "./assets/sprites/archer.png",
    frameWidth: 64,
    frameHeight: 64,
    drawWidth: 88,
    drawHeight: 88,
    animations: {
      idle: { row: 0, frames: 4, fps: 5 },
      walk: { row: 1, frames: 4, fps: 8 },
      attack: { row: 2, frames: 4, fps: 12 },
      ability: { row: 3, frames: 8, fps: 16 },
      hurt: { row: 4, frames: 2, fps: 6 }
    }
  },
  bossBroadcaster: {
    src: "./assets/sprites/boss_broadcaster.png",
    frameWidth: 64,
    frameHeight: 64,
    drawWidth: 96,
    drawHeight: 96,
    animations: {
      idle: { row: 0, frames: 4, fps: 5 },
      walk: { row: 1, frames: 4, fps: 8 },
      micDrop: { row: 2, frames: 6, fps: 12 },
      table: { row: 3, frames: 6, fps: 10 },
      phone: { row: 4, frames: 6, fps: 12 },
      liveStream: { row: 5, frames: 8, fps: 14 },
      hurt: { row: 6, frames: 2, fps: 6 }
    }
  }
};

export function loadSpriteImages(definitions) {
  const images = {};

  for (const [id, definition] of Object.entries(definitions)) {
    const image = new Image();
    image.src = definition.src;
    images[id] = {
      ...definition,
      image,
      loaded: false
    };
    image.addEventListener("load", () => {
      images[id].loaded = true;
    });
    image.addEventListener("error", () => {
      images[id].loaded = false;
    });
  }

  return images;
}
