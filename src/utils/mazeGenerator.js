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

  // Float between 0 and 1
  random() {
    return this.next();
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
 * @returns {Object} Maze data including grid, walls, start, exit positions, and modifiers
 */
export function generateMaze(width = 35, height = 35, seed = Date.now(), exitDistance = 25) {
  const rng = new SeededRandom(seed);
  const cellSize = 4; // Increased cell size for wider track

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

  // Generate modifiers
  const modifiers = generateModifiers(grid, width, height, startX, startY, exitX, exitY, rng, cellSize);

  // Convert grid to wall segments for 3D rendering
  const walls = generateWallSegments(grid, width, height, cellSize);

  return {
    grid,
    walls,
    modifiers,
    width,
    height,
    start: { x: startX, y: startY },
    exit: { x: exitX, y: exitY },
    cellSize,
  };
}

/**
 * Generate random modifiers in the maze
 */
function generateModifiers(grid, width, height, startX, startY, exitX, exitY, rng, cellSize) {
  const modifiers = [];
  const minModifiers = 40;
  const maxModifiers = 60;
  const count = minModifiers + Math.floor(rng.random() * (maxModifiers - minModifiers));
  const types = ['speed', 'jump', 'wisp'];

  const offsetX = -width * cellSize / 2;
  const offsetY = -height * cellSize / 2;

  let placed = 0;
  let attempts = 0;

  while (placed < count && attempts < 100) {
    attempts++;
    const x = Math.floor(rng.random() * width);
    const y = Math.floor(rng.random() * height);

    // Don't place on start or exit
    if ((x === startX && y === startY) || (x === exitX && y === exitY)) continue;

    // Don't place if already occupied (simple check)
    const exists = modifiers.some(m => Math.abs(m.gridX - x) < 2 && Math.abs(m.gridY - y) < 2);
    if (exists) continue;

    const type = types[Math.floor(rng.random() * types.length)];
    const worldX = x * cellSize + cellSize / 2 + offsetX;
    const worldZ = y * cellSize + cellSize / 2 + offsetY;

    modifiers.push({
      id: `mod_${placed}`,
      type,
      gridX: x,
      gridY: y,
      position: [worldX, 0.5, worldZ], // y=0.5 (floating height)
      active: true
    });
    placed++;
  }

  return modifiers;
}

/**
 * Solve maze using BFS to find path from start to end
 * Returns array of world positions for the path wisp
 */
export function solveMaze(startPos, endPos, mazeData) {
  const { grid, width, height, cellSize } = mazeData;
  const startGrid = worldToGrid(startPos.x, startPos.z, mazeData);
  const endGrid = worldToGrid(endPos.x, endPos.z, mazeData);

  // BFS Queue: [x, y, path]
  const queue = [[startGrid.x, startGrid.y, []]];
  const visited = new Set();
  visited.add(`${startGrid.x},${startGrid.y}`);

  while (queue.length > 0) {
    const [x, y, path] = queue.shift();
    const currentPath = [...path, { x, y }];

    if (x === endGrid.x && y === endGrid.y) {
      // Convert grid path to world positions
      return currentPath.map(p => gridToWorld(p.x, p.y, mazeData));
    }

    const cell = grid[y][x];
    const neighbors = [];

    if (!cell.north) neighbors.push({ x, y: y - 1 });
    if (!cell.south) neighbors.push({ x, y: y + 1 });
    if (!cell.east) neighbors.push({ x: x + 1, y });
    if (!cell.west) neighbors.push({ x: x - 1, y });

    for (const n of neighbors) {
      const key = `${n.x},${n.y}`;
      if (!visited.has(key) && n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
        visited.add(key);
        queue.push([n.x, n.y, currentPath]);
      }
    }
  }

  return []; // No path found
}


/**
 * Generate wall segments from the maze grid
 * Returns array of wall positions and dimensions
 */
function generateWallSegments(grid, width, height, cellSize) {
  const walls = [];
  const wallThickness = 0.3; // Slightly thicker
  const wallHeight = 2.5; // Taller walls

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
 * @param {boolean} canJump - If true, ignores collision check
 */
export function checkCollision(worldX, worldZ, mazeData, radius = 0.6) {
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
