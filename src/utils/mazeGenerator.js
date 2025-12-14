/**
 * Procedural Maze Generator using Recursive Backtracking
 * Generates an infinite-feeling maze with a single exit
 */

// Seeded random number generator for deterministic maze generation
class SeededRandom {
  constructor(seed = 12345) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// Directions for maze navigation
const DIRECTIONS = [
  { dx: 0, dy: -1, wall: 'north', opposite: 'south' }, // Up
  { dx: 1, dy: 0, wall: 'east', opposite: 'west' },   // Right
  { dx: 0, dy: 1, wall: 'south', opposite: 'north' }, // Down
  { dx: -1, dy: 0, wall: 'west', opposite: 'east' },  // Left
];

/**
 * Generate a maze using recursive backtracking
 * @param {number} width - Width of the maze in cells
 * @param {number} height - Height of the maze in cells
 * @param {number} seed - Random seed for deterministic generation
 * @param {number} exitDistance - Minimum distance from start for exit placement
 * @returns {Object} Maze data including grid, walls, start, and exit positions
 */
export function generateMaze(width = 25, height = 25, seed = Date.now(), exitDistance = 20) {
  const rng = new SeededRandom(seed);

  // Initialize grid - each cell tracks which walls are present
  const grid = [];
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = {
        visited: false,
        north: true,
        south: true,
        east: true,
        west: true,
      };
    }
  }

  // Track distances from start for exit placement
  const distances = [];
  for (let y = 0; y < height; y++) {
    distances[y] = [];
    for (let x = 0; x < width; x++) {
      distances[y][x] = 0;
    }
  }

  // Start position at center
  const startX = Math.floor(width / 2);
  const startY = Math.floor(height / 2);

  // Recursive backtracking to carve the maze
  function carve(x, y, distance) {
    grid[y][x].visited = true;
    distances[y][x] = distance;

    const shuffledDirs = rng.shuffle(DIRECTIONS);

    for (const dir of shuffledDirs) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !grid[ny][nx].visited) {
        // Remove walls between current and next cell
        grid[y][x][dir.wall] = false;
        grid[ny][nx][dir.opposite] = false;

        carve(nx, ny, distance + 1);
      }
    }
  }

  // Start carving from the center
  carve(startX, startY, 0);

  // Find exit position (furthest cell from start, at edge if possible)
  let exitX = startX;
  let exitY = startY;
  let maxDistance = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isEdge = x === 0 || x === width - 1 || y === 0 || y === height - 1;
      const dist = distances[y][x];

      // Prefer edge cells with maximum distance
      if (dist > maxDistance && dist >= exitDistance) {
        if (isEdge || dist > maxDistance + 5) {
          maxDistance = dist;
          exitX = x;
          exitY = y;
        }
      }
    }
  }

  // If no suitable exit found, use furthest cell
  if (maxDistance === 0) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (distances[y][x] > maxDistance) {
          maxDistance = distances[y][x];
          exitX = x;
          exitY = y;
        }
      }
    }
  }

  // Convert grid to wall segments for 3D rendering
  const walls = generateWallSegments(grid, width, height);

  return {
    grid,
    walls,
    width,
    height,
    start: { x: startX, y: startY },
    exit: { x: exitX, y: exitY },
    cellSize: 2, // Each cell is 2 units wide
  };
}

/**
 * Generate wall segments from the maze grid
 * Returns array of wall positions and dimensions
 */
function generateWallSegments(grid, width, height) {
  const walls = [];
  const cellSize = 2;
  const wallThickness = 0.2;
  const wallHeight = 1.6;

  // Offset to center the maze
  const offsetX = -width * cellSize / 2;
  const offsetY = -height * cellSize / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      const worldX = x * cellSize + offsetX;
      const worldZ = y * cellSize + offsetY;

      // North wall
      if (cell.north) {
        walls.push({
          position: [worldX + cellSize / 2, wallHeight / 2, worldZ],
          size: [cellSize + wallThickness, wallHeight, wallThickness],
        });
      }

      // West wall
      if (cell.west) {
        walls.push({
          position: [worldX, wallHeight / 2, worldZ + cellSize / 2],
          size: [wallThickness, wallHeight, cellSize + wallThickness],
        });
      }

      // Add boundary walls for edge cells
      if (y === height - 1 && cell.south) {
        walls.push({
          position: [worldX + cellSize / 2, wallHeight / 2, worldZ + cellSize],
          size: [cellSize + wallThickness, wallHeight, wallThickness],
        });
      }

      if (x === width - 1 && cell.east) {
        walls.push({
          position: [worldX + cellSize, wallHeight / 2, worldZ + cellSize / 2],
          size: [wallThickness, wallHeight, cellSize + wallThickness],
        });
      }
    }
  }

  return walls;
}

/**
 * Convert grid position to world position
 */
export function gridToWorld(gridX, gridY, mazeData) {
  const offsetX = -mazeData.width * mazeData.cellSize / 2;
  const offsetZ = -mazeData.height * mazeData.cellSize / 2;

  return {
    x: gridX * mazeData.cellSize + mazeData.cellSize / 2 + offsetX,
    z: gridY * mazeData.cellSize + mazeData.cellSize / 2 + offsetZ,
  };
}

/**
 * Convert world position to grid position
 */
export function worldToGrid(worldX, worldZ, mazeData) {
  const offsetX = -mazeData.width * mazeData.cellSize / 2;
  const offsetZ = -mazeData.height * mazeData.cellSize / 2;

  return {
    x: Math.floor((worldX - offsetX) / mazeData.cellSize),
    y: Math.floor((worldZ - offsetZ) / mazeData.cellSize),
  };
}

/**
 * Check if a world position collides with a wall
 */
export function checkCollision(worldX, worldZ, mazeData, radius = 0.3) {
  const gridPos = worldToGrid(worldX, worldZ, mazeData);
  const { x: gx, y: gy } = gridPos;

  // Check if out of bounds
  if (gx < 0 || gx >= mazeData.width || gy < 0 || gy >= mazeData.height) {
    return true;
  }

  const cell = mazeData.grid[gy][gx];
  const cellWorldPos = gridToWorld(gx, gy, mazeData);

  // Local position within cell (relative to cell center)
  const localX = worldX - cellWorldPos.x;
  const localZ = worldZ - cellWorldPos.z;

  const halfCell = mazeData.cellSize / 2;
  const wallBuffer = radius + 0.1;

  // Check collision with each wall
  if (cell.north && localZ < -halfCell + wallBuffer) return true;
  if (cell.south && localZ > halfCell - wallBuffer) return true;
  if (cell.west && localX < -halfCell + wallBuffer) return true;
  if (cell.east && localX > halfCell - wallBuffer) return true;

  return false;
}

export default generateMaze;
