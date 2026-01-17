export enum GameState {
  MENU,
  PLAYING,
  GAME_OVER,
  VICTORY,
  PAUSED
}

export enum Direction {
  UP, DOWN, LEFT, RIGHT
}

export enum EntityType {
  PLAYER,
  ENEMY,
  BOSS,
  NPC,
  CHEST,
  TRAP,
  EXIT
}

export enum TileType {
  WALL = 0,
  FLOOR = 1,
  VOID = 2,
  DOOR = 3,
  SAFE_ZONE = 4
}

export interface Position {
  x: number;
  y: number;
}

export interface Stats {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  ember: number; // Mana/Special
  maxEmber: number;
  strength: number; // Damage scaling
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Position;
  stats: Stats;
  name: string;
  isDead: boolean;
  sprite?: string; // Icon name or character
  color?: string;
  bossPhase?: number;
}

export interface LogMessage {
  id: string;
  text: string;
  type: 'info' | 'combat' | 'loot' | 'lore';
  timestamp: number;
}

export interface DungeonLevel {
  level: number;
  theme: 'ASH_CAVERNS' | 'FORGOTTEN_CATACOMBS' | 'EMBER_SANCTUM';
  tiles: TileType[][];
  entities: Entity[];
  startPos: Position;
  exitPos: Position;
  width: number;
  height: number;
  discovered: boolean[][];
}

export type ThemeConfig = {
  name: string;
  wallColor: string;
  floorColor: string;
  ambientColor: string;
  bossName: string;
}