// The maze of one level the walls (CollisionMap), the route finding (RouteGrid) and the Maze that joins them.
import { MAZE_GRID, NEIGHBOUR_STEPS, PLAYER, SCREEN, TILE_SIZE } from "./constants.js";
import { distanceBetween, scaleBy } from "./engine.js";

// CollisionMap answers is this point inside a wall? for the player, the bullets and the monster
// White pixels of the map are floor, black pixels are walls.
// mapImage has the same size as the maze picture, so the walls match the picture exactly.
// scale is how much bigger the picture is drawn in the game.
class CollisionMap {

  constructor(mapImage, scale) {
    this.scale = scale;
    this.size = { width: mapImage.width, height: mapImage.height };

    const canvas = document.createElement("canvas");
    canvas.width = this.size.width;
    canvas.height = this.size.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(mapImage, 0, 0);
    const { data } = context.getImageData(0, 0, this.size.width, this.size.height);

// One entry per pixel true for floor Every pixel takes 4 numbers (red, green, blue, alpha) in `data`.
    this.floor = [];
    const pixelCount = this.size.width * this.size.height;
    for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
      this.floor.push(data[pixelIndex * 4] > 128);
    }
  }

  // True when the map pixel is floor (outside the map counts as wall)
  isFloorPixel({ column, row }) {
    const inside = column >= 0 && row >= 0 && column < this.size.width && row < this.size.height;
    return inside && this.floor[row * this.size.width + column];
  }

  // True when the game position is inside a wall
  isWall(position) {
    return !this.isFloorPixel({
      column: Math.floor(position.horizontal / this.scale),
      row: Math.floor(position.vertical / this.scale),
    });
  }

  // True when the player body would touch a wall if his feet were at this position.
  // The body is checked with a grid of 3 x 3 points.
  isBlocked(feet) {
    const { halfWidth, height } = PLAYER.body;
    for (const side of [-1, 0, 1]) {
      for (const bodyLevel of [0, 1, 2]) {
        const point = {
          horizontal: feet.horizontal + side * halfWidth,
          vertical: feet.vertical - (bodyLevel * height) / 2,
        };
        if (this.isWall(point)) {
          return true;
        }
      }
    }
    return false;
  }
}

// RouteGri knows which squares are floor which are safe and how far every square is from a start square.
class RouteGrid {
  // Builds the grids from the collision map
  constructor(collisionMap) {
    this.tileSize = TILE_SIZE;
    const { cellPixels } = MAZE_GRID;
    this.columns = Math.floor(collisionMap.size.width / cellPixels);
    this.rows = Math.floor(collisionMap.size.height / cellPixels);

    // One entry per square true when the square is floor (white), false when it is a wall (black).
    // A square is floor when the pixel in its middle is floor.   
    this.floor = [];
    for (let squareIndex = 0; squareIndex < this.columns * this.rows; squareIndex++) {
      const centrePixel = {
        column: (squareIndex % this.columns) * cellPixels + cellPixels / 2,
        row: Math.floor(squareIndex / this.columns) * cellPixels + cellPixels / 2,
      };
      this.floor.push(collisionMap.isFloorPixel(centrePixel));
    }
  // Used by the path search how many steps each square is from the start, and the list of squares to visit
    this.steps = new Int32Array(this.columns * this.rows);
    this.queue = new Int32Array(this.columns * this.rows);
  }

  // The square that lies `step` away from `square`
  neighbour(square, step) {
    return { column: square.column + step.columns, row: square.row + step.rows };
  }

  // Converts between a square and its number in the lists
  indexOf(square) {
    return square.row * this.columns + square.column;
  }

  // The square that has this number in the lists
  squareOf(index) {
    return { column: index % this.columns, row: Math.floor(index / this.columns) };
  }

  // True when the square lies inside the maze
  contains(square) {
    return square.column >= 0 && square.row >= 0 && square.column < this.columns && square.row < this.rows;
  }

  // True when the square is floor
  isFloor(square) {
    return this.contains(square) && this.floor[this.indexOf(square)];
  }

  // The square that holds a game position
  squareAt(position) {
    return { column: Math.floor(position.horizontal / this.tileSize), row: Math.floor(position.vertical / this.tileSize) };
  }

  // The game position in the middle of a square
  centreOf(square) {
    return { horizontal: (square.column + 0.5) * this.tileSize, vertical: (square.row + 0.5) * this.tileSize };
  }

  floorSquareAt(position) {
    const square = this.squareAt(position);
    const next = [{ columns: 0, rows: 0 }, ...NEIGHBOUR_STEPS].map((step) => this.neighbour(square, step));
    return next.find((candidate) => this.isFloor(candidate)) ?? square;
  }

  // Counts how many steps every safe square is away from start (breadth first search).
  // Squares that cannot be reached get -1.
  measureFrom(start) {
    this.steps.fill(-1);
    let head = 0;
    let tail = 0;
    this.steps[this.indexOf(start)] = 0;
    this.queue[tail++] = this.indexOf(start);

    while (head < tail) {
      const current = this.squareOf(this.queue[head++]);
      const currentSteps = this.steps[this.indexOf(current)];
      for (const step of NEIGHBOUR_STEPS) {
        const nextSquare = this.neighbour(current, step);
        if (this.isFloor(nextSquare) && this.steps[this.indexOf(nextSquare)] === -1) {
          this.steps[this.indexOf(nextSquare)] = currentSteps + 1;
          this.queue[tail++] = this.indexOf(nextSquare);
        }
      }
    }
  }

  // Steps from the last start square to square (-1 when it cannot be reached)
  stepsTo(square) {
    return this.contains(square) ? this.steps[this.indexOf(square)] : -1;
  }

 sampleFloorSquares() {
    const samples = [];
    for (let squareIndex = 0; squareIndex < this.floor.length; squareIndex++) {
      if (!this.floor[squareIndex]) {
        continue;
      }
      const square = this.squareOf(squareIndex);
      if (square.column % 3 === 0 && square.row % 3 === 0) {
        samples.push({ square, position: this.centreOf(square) });
      }
    }
    return samples;
  }
}

// Maze puts the picture the collision map and the route grid together.
export class Maze {
  // image is the maze picture mapImage the black and white map, level an entry of LEVELS
  constructor(image, mapImage, level) {
    this.image = image;
    this.size = { width: image.width * MAZE_GRID.scale, height: image.height * MAZE_GRID.scale };
    this.entrance = scaleBy(level.entrance, MAZE_GRID.scale);
    this.exit = scaleBy(level.exit, MAZE_GRID.scale);
    this.collision = new CollisionMap(mapImage, MAZE_GRID.scale);
    this.routes = new RouteGrid(this.collision);
  }

  // Chooses count places for monsters. They must be reachable, far from the entrance and the exit and as far away from each other as possible.
  pickSpawns(count) {
    this.routes.measureFrom(this.routes.floorSquareAt(this.entrance));
    const candidates = this.routes.sampleFloorSquares().filter(({ square, position }) =>
      this.routes.stepsTo(square) > 90 && distanceBetween(position, this.exit) > 250
    );

    // Every new monster goes to the candidate whose nearest monster is the furthest away
    const chosen = [this.entrance];
    return Array.from({ length: count }, () => {
      const best = candidates.reduce((winner, candidate) => {
        const gap = Math.min(...chosen.map((other) => distanceBetween(candidate.position, other)));
        return gap > winner.gap ? { position: candidate.position, gap } : winner;
      }, { position: this.entrance, gap: -1 });
      chosen.push(best.position);
      return best.position;
    });
  }

  // Draws the part of the picture that the camera sees camera is the top left corner in game pixels.
  draw(context, camera) {
    const { scale } = MAZE_GRID;
    context.drawImage(
      this.image,
      camera.horizontal / scale, camera.vertical / scale, SCREEN.width / scale, SCREEN.height / scale,
      0, 0, SCREEN.width, SCREEN.height
    );
  }
}

