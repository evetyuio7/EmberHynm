import { DungeonLevel, TileType, Entity, EntityType, Position } from '../types';
import { v4 as uuidv4 } from 'uuid'; // Just pretending to use uuid, using random string actually
import { THEMES } from '../constants';

const generateId = () => Math.random().toString(36).substr(2, 9);

function createEmptyMap(width: number, height: number): TileType[][] {
  return Array(height).fill(null).map(() => Array(width).fill(TileType.WALL));
}

// Simple Room Placer Algorithm
export function generateDungeon(level: number): DungeonLevel {
  const width = 40;
  const height = 40;
  const tiles = createEmptyMap(width, height);
  const entities: Entity[] = [];
  const rooms: { x: number, y: number, w: number, h: number }[] = [];

  const themeKeys = Object.keys(THEMES);
  const themeKey = themeKeys[(level - 1) % themeKeys.length] as DungeonLevel['theme'];
  
  // 1. Generate Rooms
  const numRooms = 8 + Math.floor(Math.random() * 5);
  
  for (let i = 0; i < numRooms; i++) {
    const w = 4 + Math.floor(Math.random() * 6);
    const h = 4 + Math.floor(Math.random() * 6);
    const x = 1 + Math.floor(Math.random() * (width - w - 2));
    const y = 1 + Math.floor(Math.random() * (height - h - 2));

    const newRoom = { x, y, w, h };
    
    // Check overlap
    const overlap = rooms.some(r => 
      x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y
    );

    if (!overlap) {
      rooms.push(newRoom);
      for (let ry = y; ry < y + h; ry++) {
        for (let rx = x; rx < x + w; rx++) {
          tiles[ry][rx] = TileType.FLOOR;
        }
      }
    }
  }

  // 2. Connect Rooms (Corridors)
  for (let i = 0; i < rooms.length - 1; i++) {
    const r1 = rooms[i];
    const r2 = rooms[i + 1];

    const c1 = { x: Math.floor(r1.x + r1.w / 2), y: Math.floor(r1.y + r1.h / 2) };
    const c2 = { x: Math.floor(r2.x + r2.w / 2), y: Math.floor(r2.y + r2.h / 2) };

    // Horizontal corridor
    const xStart = Math.min(c1.x, c2.x);
    const xEnd = Math.max(c1.x, c2.x);
    for (let x = xStart; x <= xEnd; x++) {
      tiles[c1.y][x] = TileType.FLOOR;
    }

    // Vertical corridor
    const yStart = Math.min(c1.y, c2.y);
    const yEnd = Math.max(c1.y, c2.y);
    for (let y = yStart; y <= yEnd; y++) {
      tiles[y][c2.x] = TileType.FLOOR;
    }
  }

  // 3. Place Entities
  const startRoom = rooms[0];
  const endRoom = rooms[rooms.length - 1];
  
  const startPos = { 
    x: Math.floor(startRoom.x + startRoom.w/2), 
    y: Math.floor(startRoom.y + startRoom.h/2) 
  };
  
  // Safe zone at start
  tiles[startPos.y][startPos.x] = TileType.SAFE_ZONE;

  const exitPos = { 
    x: Math.floor(endRoom.x + endRoom.w/2), 
    y: Math.floor(endRoom.y + endRoom.h/2) 
  };
  tiles[exitPos.y][exitPos.x] = TileType.DOOR;

  // Enemies
  rooms.forEach((room, index) => {
    if (index === 0) return; // No enemies in start room

    // Boss in last room
    if (index === rooms.length - 1) {
       entities.push({
        id: generateId(),
        type: EntityType.BOSS,
        name: THEMES[themeKey].bossName,
        pos: { x: exitPos.x - 1, y: exitPos.y }, // Next to exit
        isDead: false,
        stats: {
          hp: 200 + (level * 50),
          maxHp: 200 + (level * 50),
          stamina: 999,
          maxStamina: 999,
          ember: 100,
          maxEmber: 100,
          strength: 15 + (level * 2)
        },
        bossPhase: 1
      });
      return;
    }

    // Regular enemies
    const enemyCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < enemyCount; i++) {
       const ex = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
       const ey = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
       
       // Don't spawn on walls (sanity check)
       if (tiles[ey][ex] !== TileType.FLOOR) continue;

       const isElite = Math.random() > 0.8;
       
       entities.push({
         id: generateId(),
         type: EntityType.ENEMY,
         name: isElite ? "Elite Cinderguard" : "Ash Walker",
         pos: { x: ex, y: ey },
         isDead: false,
         color: isElite ? 'text-red-400' : 'text-stone-400',
         stats: {
           hp: isElite ? 60 + (level * 20) : 30 + (level * 10),
           maxHp: isElite ? 60 + (level * 20) : 30 + (level * 10),
           stamina: 50,
           maxStamina: 50,
           ember: 0,
           maxEmber: 0,
           strength: isElite ? 8 + level : 5 + level
         }
       });
    }
    
    // Traps/Loot
    if (Math.random() > 0.7) {
       const tx = room.x + Math.floor(Math.random() * room.w);
       const ty = room.y + Math.floor(Math.random() * room.h);
       if (tiles[ty][tx] === TileType.FLOOR) {
         entities.push({
           id: generateId(),
           type: EntityType.CHEST,
           name: "Ancient Cache",
           pos: { x: tx, y: ty },
           isDead: false,
           stats: { ...INITIAL_STATS, hp: 1 } // Dummy stats
         });
       }
    }
  });

  const discovered = Array(height).fill(null).map(() => Array(width).fill(false));

  return {
    level,
    theme: themeKey,
    tiles,
    entities,
    startPos,
    exitPos,
    width,
    height,
    discovered
  };
}

const INITIAL_STATS = {
    hp: 1, maxHp: 1, stamina: 1, maxStamina: 1, ember: 0, maxEmber: 1, strength: 1
};