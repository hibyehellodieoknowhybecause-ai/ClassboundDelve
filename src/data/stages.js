import { randomRange } from "../utils/math.js";

const themes = [
  {
    id: "forge",
    name: "Forge Vault",
    floor: "#202226",
    tile: "#2b2d31",
    wall: "#b56b34",
    obstacle: "#5b3a2c"
  },
  {
    id: "grove",
    name: "Root Shrine",
    floor: "#17231f",
    tile: "#20352d",
    wall: "#5ec28c",
    obstacle: "#38543d"
  },
  {
    id: "crypt",
    name: "Moon Crypt",
    floor: "#191c25",
    tile: "#242a39",
    wall: "#73a9ff",
    obstacle: "#3a4054"
  },
  {
    id: "rift",
    name: "Rift Cellar",
    floor: "#1f1825",
    tile: "#2f2438",
    wall: "#a747d9",
    obstacle: "#4a315c"
  }
];

export function createStage(stageNumber) {
  const isBoss = stageNumber % 5 === 0;
  const tier = Math.ceil(stageNumber / 5);
  const bossTier = Math.floor((stageNumber - 1) / 5);
  const enemyCount = isBoss ? 1 : Math.min(4 + stageNumber * 2 + bossTier * 2, 28);
  const theme = themes[(stageNumber - 1 + Math.floor(Math.random() * themes.length)) % themes.length];
  const room = {
    width: isBoss ? 2040 : Math.floor(randomRange(1720, 2140)),
    height: isBoss ? 1280 : Math.floor(randomRange(1020, 1320)),
    margin: 90,
    obstacles: []
  };
  room.obstacles = createObstacles(room, isBoss, stageNumber);

  return {
    number: stageNumber,
    name: isBoss ? `${theme.name} Boss ${tier}` : `${theme.name} ${stageNumber}`,
    isBoss,
    theme,
    bossTier,
    enemyCount,
    room,
    clearReward: isBoss ? 160 : 70 + stageNumber * 12,
    enemyHpMultiplier: 1 + stageNumber * 0.07 + bossTier * 0.35,
    enemyDamageMultiplier: 1 + stageNumber * 0.04 + bossTier * 0.22
  };
}

export function createLobbyStage() {
  const room = {
    width: 1560,
    height: 940,
    margin: 70,
    obstacles: [
      { x: 170, y: 160, w: 190, h: 82 },
      { x: 1160, y: 170, w: 230, h: 86 },
      { x: 160, y: 670, w: 250, h: 96 },
      { x: 1060, y: 662, w: 270, h: 98 },
      { x: 670, y: 130, w: 220, h: 70 }
    ]
  };

  return {
    number: "Lobby",
    name: "Classbound Lobby",
    isLobby: true,
    isBoss: false,
    theme: {
      id: "lobby",
      name: "Classbound Lobby",
      floor: "#181b1e",
      tile: "#22272b",
      wall: "#f2b85b",
      obstacle: "#4b3b31"
    },
    bossTier: 0,
    enemyCount: 0,
    room,
    clearReward: 0,
    enemyHpMultiplier: 1,
    enemyDamageMultiplier: 1
  };
}

export function createHiddenQuestStage() {
  const cellSize = 72;
  const cols = 29;
  const rows = 19;
  const margin = 54;
  const maze = createMaze(cols, rows);
  const room = {
    width: cols * cellSize + margin * 2,
    height: rows * cellSize + margin * 2,
    margin,
    obstacles: []
  };

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (maze[row][col]) {
        room.obstacles.push({
          x: margin + col * cellSize,
          y: margin + row * cellSize,
          w: cellSize,
          h: cellSize
        });
      }
    }
  }

  const start = cellCenter(1, 1, cellSize, margin);
  const sage = cellCenter(cols - 2, rows - 2, cellSize, margin);
  return {
    number: "Quest",
    name: "Sage's Dark Maze",
    isQuest: true,
    isBoss: false,
    theme: {
      id: "sageMaze",
      name: "Sage's Dark Maze",
      floor: "#07090b",
      tile: "#11171a",
      wall: "#f2b85b",
      obstacle: "#1d2528"
    },
    bossTier: 0,
    enemyCount: 0,
    room,
    clearReward: 0,
    enemyHpMultiplier: 1,
    enemyDamageMultiplier: 1,
    quest: {
      cellSize,
      cols,
      rows,
      wallMap: maze,
      start,
      sage,
      torches: [{ col: 1, row: 1, x: start.x, y: start.y }],
      lastTorchCell: { col: 1, row: 1 }
    }
  };
}

export function createDragonQuestStage() {
  const room = {
    width: 1880,
    height: 1180,
    margin: 90,
    obstacles: [
      { x: 260, y: 235, w: 190, h: 70 },
      { x: 1420, y: 250, w: 210, h: 76 },
      { x: 300, y: 810, w: 230, h: 82 },
      { x: 1320, y: 790, w: 250, h: 88 }
    ]
  };

  return {
    number: "Dragon",
    name: "Kingdom Dragon Lair",
    isQuest: true,
    isDragonQuest: true,
    isBoss: true,
    theme: {
      id: "dragonLair",
      name: "Kingdom Dragon Lair",
      floor: "#221716",
      tile: "#33211c",
      wall: "#d95757",
      obstacle: "#5a3828"
    },
    bossTier: 0,
    enemyCount: 1,
    room,
    clearReward: 0,
    enemyHpMultiplier: 1,
    enemyDamageMultiplier: 1,
    dragon: {
      spawn: { x: room.width / 2, y: room.height / 2 - 150 },
      playerStart: { x: room.width / 2, y: room.height - room.margin - 110 }
    }
  };
}

function createMaze(cols, rows) {
  const maze = Array.from({ length: rows }, () => Array.from({ length: cols }, () => true));
  const stack = [{ col: 1, row: 1 }];
  maze[1][1] = false;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = [
      { col: current.col + 2, row: current.row },
      { col: current.col - 2, row: current.row },
      { col: current.col, row: current.row + 2 },
      { col: current.col, row: current.row - 2 }
    ].filter((cell) => cell.col > 0 && cell.col < cols - 1 && cell.row > 0 && cell.row < rows - 1 && maze[cell.row][cell.col]);

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    maze[(current.row + next.row) / 2][(current.col + next.col) / 2] = false;
    maze[next.row][next.col] = false;
    stack.push(next);
  }

  return maze;
}

function cellCenter(col, row, cellSize, margin) {
  return {
    x: margin + col * cellSize + cellSize / 2,
    y: margin + row * cellSize + cellSize / 2
  };
}

function createObstacles(room, isBoss, stageNumber) {
  const obstacles = [];
  const count = isBoss ? 9 : 7 + Math.floor(Math.random() * 7) + Math.floor(stageNumber / 3);

  for (let i = 0; i < count; i += 1) {
    const wide = Math.random() < 0.55;
    const w = wide ? randomRange(130, 230) : randomRange(58, 96);
    const h = wide ? randomRange(52, 92) : randomRange(110, 190);
    const x = randomRange(room.margin + 100, room.width - room.margin - w - 100);
    const y = randomRange(room.margin + 80, room.height - room.margin - h - 80);

    const nearCenter = Math.abs(x - room.width / 2) < 250 && Math.abs(y - room.height / 2) < 190;
    const nearTopPortal = y < room.margin + 130 && Math.abs(x - room.width / 2) < 280;
    if (!nearCenter && !nearTopPortal) {
      obstacles.push({ x, y, w, h });
    }
  }

  return obstacles;
}
