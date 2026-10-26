/**
 * js/engine/objectives.js
 * Victory and defeat condition checks for each encounter type:
 * escort, hold_gate, protect_lantern, and defeat_boss_or_reach.
 */

export function checkBattleStatus(chapter, battleState) {
  const { allies, enemies, currentTurn, board } = battleState;

  const livingAllies = allies.filter(u => u.hp > 0 && u.role !== 'npc' && u.role !== 'objective');
  const livingEnemies = enemies.filter(u => u.hp > 0);

  // Universal loss: all controllable player units defeated
  if (livingAllies.length === 0) {
    return { finished: true, victory: false, reason: '我方全軍覆沒，守夜失敗！' };
  }

  // Check objective-specific rules
  switch (chapter.objectiveType) {
    case 'escort': {
      const cart = allies.find(u => u.id === (chapter.escortTargetId || 'lantern_cart'));
      if (!cart || cart.hp <= 0) {
        return { finished: true, victory: false, reason: '引路燈車受創損毀，護送失敗！' };
      }
      if (currentTurn > chapter.maxTurns) {
        return { finished: true, victory: false, reason: `超過了限定的 ${chapter.maxTurns} 回合，夜霧吞沒了前路！` };
      }
      // Check if cart has reached destination
      const goal = chapter.escortGoal || { rowMax: 2, colMin: 6 };
      if (cart.x >= goal.colMin && cart.y <= goal.rowMax) {
        return { finished: true, victory: true, reason: '引路燈車平安抵達彼岸，成功突破夜霧！' };
      }
      // Or if all enemies routed
      if (livingEnemies.length === 0) {
        return { finished: true, victory: true, reason: '全殲渡口敵騎，前路暢通無阻！' };
      }
      break;
    }

    case 'hold_gate': {
      // Check if any enemy is currently on a gate tile
      const gateTiles = chapter.gateTiles || [{ x: 4, y: 6 }, { x: 5, y: 6 }];
      for (const enemy of livingEnemies) {
        for (const g of gateTiles) {
          if (enemy.x === g.x && enemy.y === g.y) {
            return { finished: true, victory: false, reason: '城門失守！夜霧之軍已踏破關卡！' };
          }
        }
      }

      // Check if survived required turns
      if (currentTurn >= chapter.maxTurns) {
        return { finished: true, victory: true, reason: `成功堅守雄關 ${chapter.maxTurns} 回合！天邊已露曙光！` };
      }

      // Or if all enemies routed
      if (livingEnemies.length === 0) {
        return { finished: true, victory: true, reason: '全殲攻關魔物，雄關安然無恙！' };
      }
      break;
    }

    case 'protect_lantern': {
      const lantern = allies.find(u => u.id === (chapter.objectiveTargetId || 'market_lantern'));
      if (!lantern || lantern.hp <= 0) {
        return { finished: true, victory: false, reason: '市集中央鎮心神燈熄滅，市街陷入永暗！' };
      }

      // Check if survived required turns
      if (currentTurn >= chapter.maxTurns) {
        return { finished: true, victory: true, reason: `神燈長明不熄，成功守護市集 ${chapter.maxTurns} 回合！` };
      }

      // Or if all enemies routed
      if (livingEnemies.length === 0) {
        return { finished: true, victory: true, reason: '市集暗處的匿影妖邪已被盡數肅清！' };
      }
      break;
    }

    case 'defeat_boss_or_reach': {
      const boss = enemies.find(u => u.id === (chapter.bossId || 'iron_general'));
      // Boss defeated condition
      if (boss && boss.hp <= 0) {
        return { finished: true, victory: true, reason: '玄鐵巨將已被斬落陣前，守夜人威震群峰！' };
      }

      // Reach shrine exit condition
      const exitTiles = chapter.exitTiles || [{ x: 4, y: 0 }, { x: 5, y: 0 }];
      for (const ally of livingAllies) {
        for (const e of exitTiles) {
          if (ally.x === e.x && ally.y === e.y) {
            return { finished: true, victory: true, reason: '守夜先鋒突破重圍，成功登頂神壇出口！' };
          }
        }
      }

      if (currentTurn > chapter.maxTurns) {
        return { finished: true, victory: false, reason: '天池絕頂迷霧遮天，耗盡回合未能破陣！' };
      }
      break;
    }

    default: {
      if (livingEnemies.length === 0) {
        return { finished: true, victory: true, reason: '全殲敵軍，大獲全勝！' };
      }
      break;
    }
  }

  return { finished: false };
}
