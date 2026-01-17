import { ThemeConfig } from './types';

export const TILE_SIZE = 48; // Pixels
export const VIEWPORT_WIDTH = 15; // Tiles
export const VIEWPORT_HEIGHT = 11; // Tiles

export const THEMES: Record<string, ThemeConfig> = {
  ASH_CAVERNS: {
    name: "Ash Caverns",
    wallColor: "bg-stone-800",
    floorColor: "bg-stone-700",
    ambientColor: "rgba(60, 20, 10, 0.4)",
    bossName: "The Ashbound Knight"
  },
  FORGOTTEN_CATACOMBS: {
    name: "Forgotten Catacombs",
    wallColor: "bg-slate-900",
    floorColor: "bg-slate-800",
    ambientColor: "rgba(10, 20, 50, 0.4)",
    bossName: "Cinder Wyrm"
  },
  EMBER_SANCTUM: {
    name: "Ember Sanctum",
    wallColor: "bg-orange-950",
    floorColor: "bg-orange-900",
    ambientColor: "rgba(100, 30, 0, 0.5)",
    bossName: "The Ember Choir"
  }
};

export const INITIAL_PLAYER_STATS = {
  hp: 100,
  maxHp: 100,
  stamina: 100,
  maxStamina: 100,
  ember: 0,
  maxEmber: 100,
  strength: 10
};

export const XP_TO_LEVEL = 100;

export const COMBAT = {
  LIGHT_ATTACK_COST: 10,
  HEAVY_ATTACK_COST: 25,
  DODGE_COST: 15,
  EMBER_ABILITY_COST: 50,
  STAMINA_REGEN: 1,
  EMBER_GAIN_ON_HIT: 5
};