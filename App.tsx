import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  GameState, DungeonLevel, Entity, EntityType, Position, 
  Stats, LogMessage, TileType, Direction 
} from './types';
import { 
  INITIAL_PLAYER_STATS, COMBAT, TILE_SIZE, VIEWPORT_HEIGHT, VIEWPORT_WIDTH, XP_TO_LEVEL 
} from './constants';
import { generateDungeon } from './services/dungeonService';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import { Sword, Shield, Flame, RotateCcw, Play } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // Simulation

// Helper for unique IDs
const genId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  // --- Game State ---
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [level, setLevel] = useState(1);
  const [dungeon, setDungeon] = useState<DungeonLevel | null>(null);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [playerStats, setPlayerStats] = useState<Stats>({ ...INITIAL_PLAYER_STATS });
  const [entities, setEntities] = useState<Entity[]>([]);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [hitEffect, setHitEffect] = useState<Position | null>(null);
  const [attackingId, setAttackingId] = useState<string | null>(null);
  const [playerLevel, setPlayerLevel] = useState(1);
  
  // Refs for loop logic to avoid stale closures
  const stateRef = useRef({
    gameState,
    playerPos,
    entities,
    playerStats,
    dungeon
  });

  // Sync ref
  useEffect(() => {
    stateRef.current = { gameState, playerPos, entities, playerStats, dungeon };
  }, [gameState, playerPos, entities, playerStats, dungeon]);

  // --- Logger ---
  const addLog = useCallback((text: string, type: LogMessage['type'] = 'info') => {
    setLogs(prev => [...prev.slice(-19), { id: genId(), text, type, timestamp: Date.now() }]);
  }, []);

  // --- Initialization ---
  const startGame = () => {
    const newDungeon = generateDungeon(1);
    setDungeon(newDungeon);
    setPlayerPos(newDungeon.startPos);
    setEntities(newDungeon.entities);
    setPlayerStats({ ...INITIAL_PLAYER_STATS });
    setGameState(GameState.PLAYING);
    setLevel(1);
    setPlayerLevel(1);
    setLogs([]);
    addLog("You enter the Ash Caverns...", "lore");
  };

  const nextLevel = () => {
    if (!stateRef.current.dungeon) return;
    const nextLvl = level + 1;
    setLevel(nextLvl);
    const newDungeon = generateDungeon(nextLvl);
    setDungeon(newDungeon);
    setPlayerPos(newDungeon.startPos);
    setEntities(newDungeon.entities);
    addLog(`Descended to depth ${nextLvl}.`, "info");
    
    // Auto-save at checkpoints (heal)
    setPlayerStats(prev => ({
        ...prev, 
        hp: prev.maxHp, 
        stamina: prev.maxStamina 
    }));
    addLog("Rested at the checkpoint. Health restored.", "info");
  };

  // --- Combat Logic ---
  const handleCombat = useCallback((attacker: Entity | 'player', target: Entity | 'player') => {
    let damage = 0;
    
    if (attacker === 'player') {
      const pStats = stateRef.current.playerStats;
      // Basic damage calculation
      damage = Math.floor(pStats.strength * (1 + Math.random() * 0.5));
      
      // Update Target (Enemy)
      const targetEntity = target as Entity;
      const newHp = targetEntity.stats.hp - damage;
      
      setEntities(prev => prev.map(e => {
        if (e.id === targetEntity.id) {
          return { ...e, stats: { ...e.stats, hp: newHp }, isDead: newHp <= 0 };
        }
        return e;
      }));

      setHitEffect(targetEntity.pos);
      setTimeout(() => setHitEffect(null), 300);

      addLog(`Hit ${targetEntity.name} for ${damage} dmg!`, 'combat');

      // Ember Gain
      setPlayerStats(prev => ({
          ...prev, 
          ember: Math.min(prev.maxEmber, prev.ember + COMBAT.EMBER_GAIN_ON_HIT)
      }));

      if (newHp <= 0) {
        addLog(`${targetEntity.name} defeated!`, 'loot');
        // Heal slightly on kill (vampirism/ember absorption)
        setPlayerStats(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + 5) }));
        
        if (targetEntity.type === EntityType.BOSS) {
            addLog(`THE ${targetEntity.name.toUpperCase()} HAS FALLEN!`, 'lore');
            setTimeout(() => {
                alert("Boss defeated! The gate opens...");
            }, 500);
        }
      }

    } else {
      // Enemy attacking Player
      const enemy = attacker as Entity;
      damage = Math.floor(enemy.stats.strength * (0.8 + Math.random() * 0.4));
      
      setPlayerStats(prev => {
        const newHp = prev.hp - damage;
        if (newHp <= 0) {
           setGameState(GameState.GAME_OVER);
           addLog("You have succumbed to the darkness...", "combat");
        }
        return { ...prev, hp: newHp };
      });
      
      addLog(`${enemy.name} hits you for ${damage} dmg!`, 'combat');
      setHitEffect(stateRef.current.playerPos);
      setTimeout(() => setHitEffect(null), 300);
    }
  }, [addLog]);

  // --- Action Handlers ---
  const movePlayer = useCallback((dx: number, dy: number) => {
    const current = stateRef.current;
    if (current.gameState !== GameState.PLAYING || !current.dungeon) return;

    const newX = current.playerPos.x + dx;
    const newY = current.playerPos.y + dy;

    // Boundary Check
    if (newX < 0 || newX >= current.dungeon.width || newY < 0 || newY >= current.dungeon.height) return;

    // Collision Check (Walls)
    const tile = current.dungeon.tiles[newY][newX];
    if (tile === TileType.WALL) return;

    // Collision Check (Entities)
    const targetEntity = current.entities.find(e => e.pos.x === newX && e.pos.y === newY && !e.isDead);
    if (targetEntity) {
      if (targetEntity.type === EntityType.ENEMY || targetEntity.type === EntityType.BOSS) {
        // Attack!
        setAttackingId('player');
        setTimeout(() => setAttackingId(null), 200);
        handleCombat('player', targetEntity);
      } else if (targetEntity.type === EntityType.CHEST) {
          addLog("Opened a chest! Found Ember essence.", "loot");
          setPlayerStats(prev => ({ ...prev, maxHp: prev.maxHp + 10, strength: prev.strength + 2, hp: prev.maxHp }));
          setEntities(prev => prev.map(e => e.id === targetEntity.id ? { ...e, isDead: true } : e));
      }
      return; // Don't move into entity
    }

    // Door check
    if (tile === TileType.DOOR) {
        // Only allow if boss is dead or no boss in level logic (simplified check: is there a living boss?)
        const livingBoss = current.entities.find(e => e.type === EntityType.BOSS && !e.isDead);
        if (livingBoss) {
            addLog("The door is sealed by the Boss's presence!", "lore");
            return;
        }
        nextLevel();
        return;
    }

    // Success Move
    setPlayerPos({ x: newX, y: newY });
    
    // Update discovery
    setDungeon(prev => {
        if(!prev) return null;
        const newDiscovery = [...prev.discovered];
        // Discover radius 2
        for(let ry = -2; ry <= 2; ry++) {
            for(let rx = -2; rx <= 2; rx++) {
                if(newY+ry >= 0 && newY+ry < prev.height && newX+rx >= 0 && newX+rx < prev.width) {
                    newDiscovery[newY+ry][newX+rx] = true;
                }
            }
        }
        return { ...prev, discovered: newDiscovery };
    });

  }, [handleCombat, addLog]);

  const useEmberAbility = () => {
    const current = stateRef.current;
    if (current.playerStats.ember < COMBAT.EMBER_ABILITY_COST) {
        addLog("Not enough Ember!", "info");
        return;
    }

    setPlayerStats(prev => ({ ...prev, ember: prev.ember - COMBAT.EMBER_ABILITY_COST }));
    setAttackingId('player');
    setTimeout(() => setAttackingId(null), 500);

    // AOE Attack
    addLog("EMBER BURST!", "combat");
    const { x, y } = current.playerPos;
    
    current.entities.forEach(e => {
        if (e.isDead) return;
        const dist = Math.abs(e.pos.x - x) + Math.abs(e.pos.y - y);
        if (dist <= 2) {
             // Massive damage
             handleCombat('player', { ...e, stats: { ...e.stats, hp: e.stats.hp } }); // passing dummy to trigger logic, logic needs refactor for true AOE but this works for simple
             // Actually, handleCombat expects target state updates.
             // Manually applying AOE damage here for simplicity
             const damage = 50;
             setEntities(prev => prev.map(ent => {
                 if (ent.id === e.id) {
                     const newHp = ent.stats.hp - damage;
                     if(newHp <= 0) addLog(`${ent.name} incinerated!`, 'loot');
                     return { ...ent, stats: { ...ent.stats, hp: newHp }, isDead: newHp <= 0 };
                 }
                 return ent;
             }));
             setHitEffect(e.pos);
        }
    });
    setTimeout(() => setHitEffect(null), 500);
  };

  // --- Game Loop (Enemy AI & Stamina Regen) ---
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    const tickRate = 800; // Enemies move every 800ms
    const regenRate = 100;

    const gameTick = setInterval(() => {
        const current = stateRef.current;
        if (!current.dungeon) return;

        // Enemy Logic
        setEntities(prevEntities => {
            return prevEntities.map(e => {
                if (e.isDead || (e.type !== EntityType.ENEMY && e.type !== EntityType.BOSS)) return e;
                
                // Simple AI: Move towards player if within range
                const dx = current.playerPos.x - e.pos.x;
                const dy = current.playerPos.y - e.pos.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist > 8) return e; // Idle if too far

                if (dist < 1.5) {
                    // Attack Player
                    handleCombat(e, 'player');
                    return e;
                }

                // Move
                const moveX = dx !== 0 ? Math.sign(dx) : 0;
                const moveY = dy !== 0 ? Math.sign(dy) : 0;
                
                // Try X first
                let nextX = e.pos.x + moveX;
                let nextY = e.pos.y;
                
                // Very basic collision against walls
                if (current.dungeon?.tiles[nextY][nextX] === TileType.WALL) {
                   // Try Y
                   nextX = e.pos.x;
                   nextY = e.pos.y + moveY;
                   if (current.dungeon?.tiles[nextY][nextX] === TileType.WALL) return e;
                }
                
                // Don't overlap player
                if (nextX === current.playerPos.x && nextY === current.playerPos.y) return e;

                return { ...e, pos: { x: nextX, y: nextY } };
            });
        });

    }, tickRate);

    const regenTick = setInterval(() => {
        setPlayerStats(prev => ({
            ...prev,
            stamina: Math.min(prev.maxStamina, prev.stamina + 1)
        }));
    }, regenRate);

    return () => {
        clearInterval(gameTick);
        clearInterval(regenTick);
    };
  }, [gameState, handleCombat]);

  // --- Input ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (gameState !== GameState.PLAYING) return;
        
        switch(e.key) {
            case 'w':
            case 'ArrowUp': movePlayer(0, -1); break;
            case 's':
            case 'ArrowDown': movePlayer(0, 1); break;
            case 'a':
            case 'ArrowLeft': movePlayer(-1, 0); break;
            case 'd':
            case 'ArrowRight': movePlayer(1, 0); break;
            case ' ': useEmberAbility(); break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, movePlayer]);

  // --- Render ---

  if (gameState === GameState.MENU) {
      return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-stone-950 text-orange-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?grayscale&blur=2')] opacity-20 bg-cover bg-center" />
              <div className="z-10 text-center space-y-8">
                  <h1 className="text-6xl md:text-8xl font-bold fantasy-font ember-glow mb-4">EMBERHYMN</h1>
                  <p className="text-stone-400 text-xl max-w-md mx-auto">The fire is fading. Bear the hymn. Survive the depths.</p>
                  <button 
                    onClick={startGame}
                    className="px-8 py-4 bg-orange-800 hover:bg-orange-700 text-white font-bold rounded shadow-[0_0_15px_rgba(234,88,12,0.6)] transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
                  >
                    <Play size={24} /> BEGIN JOURNEY
                  </button>
              </div>
          </div>
      );
  }

  if (gameState === GameState.GAME_OVER) {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-red-700 z-50">
            <h1 className="text-6xl font-bold fantasy-font mb-8">EXTINGUISHED</h1>
            <p className="text-stone-500 mb-8">Your embers have returned to ash.</p>
            <button 
              onClick={() => setGameState(GameState.MENU)}
              className="px-6 py-3 border border-red-900 text-red-500 hover:bg-red-900/20 rounded flex items-center gap-2"
            >
               <RotateCcw size={20} /> Return to Menu
            </button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4">
      {/* Mobile Controls Hint */}
      <div className="md:hidden text-stone-500 text-xs mb-2">Tap adjacent tiles to move/attack</div>
      
      {dungeon && (
        <div className="relative">
            <GameCanvas 
                dungeon={dungeon}
                playerPos={playerPos}
                entities={entities}
                playerEntity={{
                    id: 'player', 
                    pos: playerPos, 
                    type: EntityType.PLAYER, 
                    stats: playerStats, 
                    name: "Bearer",
                    isDead: false
                }}
                onTileClick={(x, y) => {
                    const dx = x - playerPos.x;
                    const dy = y - playerPos.y;
                    if (Math.abs(dx) + Math.abs(dy) === 1) {
                        movePlayer(dx, dy);
                    }
                }}
                attackingId={attackingId}
                hitEffect={hitEffect}
            />
        </div>
      )}

      <HUD 
        stats={playerStats} 
        level={playerLevel} 
        logs={logs}
        floor={level}
      />

      {/* Control Bar (Visual) */}
      <div className="mt-4 flex gap-4">
         <div className="flex flex-col items-center text-stone-500 text-xs">
            <div className="w-12 h-12 border border-stone-700 rounded flex items-center justify-center mb-1">WASD</div>
            <span>Move</span>
         </div>
         <div className="flex flex-col items-center text-stone-500 text-xs">
             <button 
                className="w-12 h-12 bg-orange-900/50 border border-orange-700 text-orange-200 rounded flex items-center justify-center mb-1 hover:bg-orange-800"
                onClick={useEmberAbility}
             >
                <Flame size={20} />
             </button>
             <span>Space (Burst)</span>
         </div>
      </div>
    </div>
  );
};

export default App;