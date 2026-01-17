import React from 'react';
import { Stats, LogMessage } from '../types';
import { Heart, Zap, Flame, Scroll } from 'lucide-react';

interface HUDProps {
  stats: Stats;
  level: number;
  logs: LogMessage[];
  floor: number;
}

const HUD: React.FC<HUDProps> = ({ stats, level, logs, floor }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mt-4 p-4 bg-stone-900 border-t-2 border-stone-700 flex flex-col md:flex-row gap-4 text-stone-300 font-sans">
      {/* Stats Panel */}
      <div className="flex-1 space-y-3">
        <div className="flex justify-between items-center mb-2">
           <h2 className="text-xl fantasy-font text-orange-500">Bearer (Lvl {level})</h2>
           <span className="text-xs text-stone-500 uppercase tracking-widest">Floor {floor}</span>
        </div>

        {/* Health */}
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-red-500" />
          <div className="flex-1 h-4 bg-stone-800 rounded-full overflow-hidden relative border border-stone-700">
            <div 
              className="h-full bg-red-700 transition-all duration-300" 
              style={{ width: `${(stats.hp / stats.maxHp) * 100}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
              {stats.hp} / {stats.maxHp}
            </span>
          </div>
        </div>

        {/* Stamina */}
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-green-500" />
          <div className="flex-1 h-3 bg-stone-800 rounded-full overflow-hidden relative border border-stone-700">
            <div 
              className="h-full bg-green-700 transition-all duration-100" 
              style={{ width: `${(stats.stamina / stats.maxStamina) * 100}%` }}
            />
          </div>
        </div>

        {/* Ember */}
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-orange-500 animate-pulse" />
          <div className="flex-1 h-4 bg-stone-800 rounded-full overflow-hidden relative border border-stone-700 ember-glow">
            <div 
              className="h-full bg-orange-600 transition-all duration-500" 
              style={{ width: `${(stats.ember / stats.maxEmber) * 100}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
               EMBER HYMN
            </span>
          </div>
        </div>
      </div>

      {/* Action Log */}
      <div className="flex-1 bg-black/40 p-2 rounded border border-stone-800 h-32 overflow-y-auto flex flex-col-reverse">
        {logs.slice().reverse().map((log) => (
          <div key={log.id} className={`text-xs mb-1 ${
            log.type === 'combat' ? 'text-red-300' :
            log.type === 'loot' ? 'text-yellow-300' :
            log.type === 'lore' ? 'text-purple-300 italic' :
            'text-stone-400'
          }`}>
             {log.type === 'lore' && <Scroll size={10} className="inline mr-1" />}
             {log.text}
          </div>
        ))}
        {logs.length === 0 && <span className="text-stone-600 text-xs text-center italic mt-4">The dungeon is silent...</span>}
      </div>
    </div>
  );
};

export default HUD;