/**
 * js/engine/map.js
 * Branching 8-night adventure map, node types, and run progression state.
 */

export const NODE_TYPES = {
  BATTLE: "battle",
  ELITE: "elite",
  SHOP: "shop",     // 茶館 (Tea House)
  REST: "rest",     // 溫泉 (Hot Spring)
  EVENT: "event",   // 神龕事件 (Shrine Event)
  BOSS: "boss"      // 最終 Boss
};

export class RunMap {
  constructor(rng) {
    this.rng = rng;
    this.nodes = [];
    this.generateMap();
  }

  generateMap() {
    this.nodes = [];
    const totalNights = 8;

    // Define structure for each night
    for (let night = 1; night <= totalNights; night++) {
      let laneCount = 3;
      if (night === 1 || night === 8) laneCount = 1; // Single start and single boss

      for (let lane = 0; lane < laneCount; lane++) {
        const id = `n${night}_l${lane}`;
        let type = NODE_TYPES.BATTLE;
        let name = "霧怪巡邏";

        if (night === 1) {
          type = NODE_TYPES.BATTLE;
          name = "初臨霧夜";
        } else if (night === 3) {
          type = NODE_TYPES.SHOP;
          name = "老街茶館";
        } else if (night === 4) {
          type = NODE_TYPES.ELITE;
          name = "濃霧精英";
        } else if (night === 5) {
          type = NODE_TYPES.REST;
          name = "溫泉暖湯";
        } else if (night === 6) {
          type = lane === 1 ? NODE_TYPES.EVENT : NODE_TYPES.BATTLE;
          name = lane === 1 ? "荒野神龕" : "幽暗竹道";
        } else if (night === 7) {
          type = lane === 0 ? NODE_TYPES.ELITE : NODE_TYPES.BATTLE;
          name = lane === 0 ? "巨獸狂襲" : "霧怪集結";
        } else if (night === 8) {
          type = NODE_TYPES.BOSS;
          name = "決戰黎明 (Boss)";
        } else {
          // Night 2
          type = lane === 2 ? NODE_TYPES.EVENT : NODE_TYPES.BATTLE;
          name = lane === 2 ? "古亭偶遇" : "竹林伏擊";
        }

        const node = {
          id,
          night,
          lane,
          type,
          name,
          nextNodes: []
        };
        this.nodes.push(node);
      }
    }

    // Connect nodes between night N and night N+1
    for (let night = 1; night < totalNights; night++) {
      const currentLevel = this.nodes.filter((n) => n.night === night);
      const nextLevel = this.nodes.filter((n) => n.night === night + 1);

      for (const curr of currentLevel) {
        if (nextLevel.length === 1) {
          // Converge to single node (Boss or night 2)
          curr.nextNodes.push(nextLevel[0].id);
        } else if (currentLevel.length === 1) {
          // Diverge from single start to all 3 lanes
          curr.nextNodes = nextLevel.map((n) => n.id);
        } else {
          // Connect to same lane and adjacent lanes
          for (const next of nextLevel) {
            if (Math.abs(curr.lane - next.lane) <= 1) {
              curr.nextNodes.push(next.id);
            }
          }
        }
      }
    }
  }

  getNode(nodeId) {
    return this.nodes.find((n) => n.id === nodeId) || null;
  }
}
