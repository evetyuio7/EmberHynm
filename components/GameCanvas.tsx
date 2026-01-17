import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DungeonLevel, Entity, EntityType, Position, TileType } from '../types';
import { TILE_SIZE, VIEWPORT_HEIGHT, VIEWPORT_WIDTH, THEMES } from '../constants';
import { Ghost, Sword, Flame, Lock, User, Skull, AlertCircle, Sparkles } from 'lucide-react';

interface GameCanvasProps {
  dungeon: DungeonLevel;
  playerPos: Position;
  entities: Entity[];
  playerEntity: Entity;
  onTileClick: (x: number, y: number) => void;
  attackingId: string | null;
  hitEffect: Position | null;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  dungeon, 
  playerPos, 
  entities, 
  playerEntity,
  onTileClick,
  attackingId,
  hitEffect
}) => {
  const theme = THEMES[dungeon.theme];

  // Calculate viewport (camera)
  const startX = Math.max(0, Math.min(playerPos.x - Math.floor(VIEWPORT_WIDTH / 2), dungeon.width - VIEWPORT_WIDTH));
  const startY = Math.max(0, Math.min(playerPos.y - Math.floor(VIEWPORT_HEIGHT / 2), dungeon.height - VIEWPORT_HEIGHT));

  const visibleTiles = [];

  for (let y = 0; y < VIEWPORT_HEIGHT; y++) {
    for (let x = 0; x < VIEWPORT_WIDTH; x++) {
      const globalX = startX + x;
      const globalY = startY + y;
      
      let tileType = TileType.VOID;
      let isDiscovered = false;
      
      if (globalY < dungeon.height && globalX < dungeon.width) {
        tileType = dungeon.tiles[globalY][globalX];
        isDiscovered = dungeon.discovered[globalY][globalX];
      }

      visibleTiles.push({
        x, y, globalX, globalY, tileType, isDiscovered
      });
    }
  }

  // Render Helpers
  const getTileStyle = (type: TileType, discovered: boolean) => {
    if (!discovered && type !== TileType.VOID) return "bg-black";
    
    switch (type) {
      case TileType.WALL: return theme.wallColor;
      case TileType.FLOOR: return theme.floorColor;
      case TileType.DOOR: return "bg-orange-900 border-2 border-orange-500";
      case TileType.SAFE_ZONE: return "bg-emerald-900";
      default: return "bg-black";
    }
  };

  return (
    <div 
      className="relative overflow-hidden rounded-lg shadow-2xl border-4 border-stone-800"
      style={{
        width: VIEWPORT_WIDTH * TILE_SIZE,
        height: VIEWPORT_HEIGHT * TILE_SIZE,
      }}
    >
        {/* Render Tiles */}
        {visibleTiles.map((tile) => (
          <div
            key={`${tile.globalX}-${tile.globalY}`}
            onClick={() => onTileClick(tile.globalX, tile.globalY)}
            className={`absolute ${getTileStyle(tile.tileType, tile.isDiscovered)} transition-colors duration-500`}
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              left: tile.x * TILE_SIZE,
              top: tile.y * TILE_SIZE,
            }}
          >
             {/* Fog of War / Lighting overlay */}
             {tile.isDiscovered && tile.tileType !== TileType.WALL && (
                 <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-transparent to-black pointer-events-none" />
             )}
             
             {/* Decor for Door */}
             {tile.tileType === TileType.DOOR && tile.isDiscovered && (
               <div className="w-full h-full flex items-center justify-center text-orange-400">
                  <Lock size={20} />
               </div>
             )}
          </div>
        ))}

        {/* Render Entities (Relative to Viewport) */}
        <AnimatePresence>
            {/* Player */}
            <motion.div
              initial={false}
              animate={{
                left: (playerPos.x - startX) * TILE_SIZE,
                top: (playerPos.y - startY) * TILE_SIZE,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute z-20 flex items-center justify-center pointer-events-none"
              style={{ width: TILE_SIZE, height: TILE_SIZE }}
            >
              <div className="relative text-white drop-shadow-[0_0_8px_rgba(255,165,0,0.8)]">
                <User size={32} />
                {attackingId === 'player' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1.5, rotate: [0, 45, 0] }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-4 -right-4 text-orange-400"
                  >
                    <Sword size={24} />
                  </motion.div>
                )}
                {/* Ember Light Source */}
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-[-1]"
                  style={{
                    width: TILE_SIZE * 5,
                    height: TILE_SIZE * 5,
                    background: `radial-gradient(circle, ${theme.ambientColor} 0%, transparent 70%)`
                  }}
                />
              </div>
            </motion.div>

            {/* Enemies & Objects */}
            {entities.map(entity => {
              if (entity.isDead) return null;
              
              // Only render if within viewport bounds
              const relX = entity.pos.x - startX;
              const relY = entity.pos.y - startY;

              if (relX < 0 || relX >= VIEWPORT_WIDTH || relY < 0 || relY >= VIEWPORT_HEIGHT) return null;
              
              // Don't show enemies in undiscovered tiles
              if (!dungeon.discovered[entity.pos.y][entity.pos.x]) return null;

              return (
                <motion.div
                  key={entity.id}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: 1,
                    left: relX * TILE_SIZE,
                    top: relY * TILE_SIZE
                  }}
                  className={`absolute z-10 flex items-center justify-center pointer-events-none ${entity.color || 'text-red-500'}`}
                  style={{ width: TILE_SIZE, height: TILE_SIZE }}
                >
                   {entity.type === EntityType.ENEMY && <Ghost size={24} />}
                   {entity.type === EntityType.BOSS && (
                     <motion.div 
                        animate={{ scale: [1, 1.1, 1] }} 
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-red-600 drop-shadow-lg"
                     >
                       <Skull size={36} />
                     </motion.div>
                   )}
                   {entity.type === EntityType.CHEST && <div className="text-yellow-500"><Sparkles size={20} /></div>}
                   
                   {/* Health Bar for entities */}
                   {entity.type !== EntityType.CHEST && entity.type !== EntityType.EXIT && (
                     <div className="absolute -bottom-1 w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-red-600" 
                         style={{ width: `${(entity.stats.hp / entity.stats.maxHp) * 100}%` }}
                       />
                     </div>
                   )}
                </motion.div>
              );
            })}
        </AnimatePresence>
        
        {/* Hit Effects */}
        <AnimatePresence>
          {hitEffect && (
             <motion.div
               initial={{ opacity: 1, scale: 0.5 }}
               animate={{ opacity: 0, scale: 2 }}
               exit={{ opacity: 0 }}
               className="absolute z-50 pointer-events-none"
               style={{
                 left: (hitEffect.x - startX) * TILE_SIZE,
                 top: (hitEffect.y - startY) * TILE_SIZE,
                 width: TILE_SIZE,
                 height: TILE_SIZE,
               }}
             >
                <div className="w-full h-full flex items-center justify-center text-orange-300">
                  <Flame size={32} />
                </div>
             </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
};

export default GameCanvas;