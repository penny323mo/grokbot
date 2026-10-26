/**
 * js/app.js
 * Main controller connecting engine, sound, rendering, state persistence, and grokbot integration.
 */

import { RNG } from "./engine/rng.js";
import { Battle } from "./engine/battle.js";
import { RunMap } from "./engine/map.js";
import { TownManager } from "./engine/town.js";
import { SoundEngine } from "./audio.js";
import { UIRenderer } from "./render/ui.js";
import { SVG_ART } from "./render/art.js";
import { STARTING_DECK_STANDARD, STARTING_DECK_BLAZING, getCardById, CARD_CATALOGUE, CARD_TYPES, getCardTypeLabel } from "./engine/cards.js";
import { DIFFICULTIES, ASCENSION_LEVELS } from "./engine/constants.js";
import { RELICS_CATALOGUE } from "./engine/relics.js";

class LanternWatchApp {
  constructor() {
    this.sound = new SoundEngine();
    this.town = new TownManager();
    this.ui = new UIRenderer(this.sound);
    this.rng = new RNG(Date.now());

    // Active Run State
    this.activeRun = null;
    this.activeBattle = null;
    this.selectedDifficulty = DIFFICULTIES.STANDARD;
    this.selectedAscension = 0;

    this.init();
  }

  init() {
    this.ui.renderTitleHero();
    this.updateTopBar();
    this.setupEventListeners();
    this.checkContinueRun();

    // Minor #9: Update mute button opacities on startup based on persisted sound settings
    const btnMusic = document.getElementById("btnToggleMusic");
    if (btnMusic) btnMusic.style.opacity = this.sound.musicMuted ? "0.4" : "1";
    const btnSfx = document.getElementById("btnToggleSfx");
    if (btnSfx) btnSfx.style.opacity = this.sound.sfxMuted ? "0.4" : "1";

    // Minor #10: Check first-time tutorial (do NOT set seen flag until user dismisses)
    if (!localStorage.getItem("lantern_watch_tutorial_seen")) {
      document.getElementById("modalTutorial").classList.add("active");
    }

    // Play calm town music on title
    this.sound.playMusic("town");
  }

  updateTopBar() {
    const coins = this.activeRun ? this.activeRun.coins : 50;
    this.ui.renderTopResources(coins, this.town.starLanterns);
  }

  checkContinueRun() {
    const saved = this.town.loadActiveRun();
    const btnContinue = document.getElementById("btnContinueRun");
    if (saved && btnContinue) {
      btnContinue.style.display = "inline-flex";
    } else if (btnContinue) {
      btnContinue.style.display = "none";
    }
  }

  setupEventListeners() {
    // Navigation / Sound
    document.getElementById("btnNavHome").onclick = () => {
      this.sound.playSfx("tap");
      if (this.activeBattle && this.activeBattle.status === "ongoing") {
        this.ui.showConfirmModal("返回主選單", "目前戰鬥正在進行中，進度已為您自動保存。確定返回嗎？", () => {
          if (this.activeRun) {
            this.activeRun.battleState = this.activeBattle.serializeState();
            this.town.saveActiveRun(this.activeRun);
          }
          this.ui.showScreen("screenTitle");
          this.sound.playMusic("town");
          this.checkContinueRun();
        });
      } else {
        this.ui.showScreen("screenTitle");
        this.sound.playMusic("town");
        this.checkContinueRun();
      }
    };

    document.getElementById("btnToggleMusic").onclick = () => {
      const active = this.sound.toggleMusic();
      document.getElementById("btnToggleMusic").style.opacity = active ? "1" : "0.4";
    };

    document.getElementById("btnToggleSfx").onclick = () => {
      const active = this.sound.toggleSfx();
      document.getElementById("btnToggleSfx").style.opacity = active ? "1" : "0.4";
    };

    document.getElementById("btnUndo").onclick = () => {
      if (this.activeBattle) {
        const success = this.activeBattle.undo();
        if (success) {
          this.sound.playSfx("tap");
          this.ui.selectedHandIndex = null;
          this.ui.validTargetCoords = [];
          if (this.activeRun) {
            this.activeRun.battleState = this.activeBattle.serializeState();
            this.town.saveActiveRun(this.activeRun);
          }
          this.renderCurrentBattle();
        }
      }
    };

    // Title Screen Buttons
    document.getElementById("btnStartAdventure").onclick = () => {
      this.sound.playSfx("tap");
      this.ui.showScreen("screenDifficulty");
      // Show starting deck selector if Pavilion is unlocked
      if (this.town.unlockedDecks.includes("deck_blazing")) {
        const deckChoiceWrap = document.getElementById("deckChoiceWrap");
        if (deckChoiceWrap) deckChoiceWrap.style.display = "block";
      }
      // Show ascension selector if won before
      if (this.town.highestAscension > 0) {
        document.getElementById("ascensionWrap").style.display = "block";
      }
    };

    document.getElementById("btnContinueRun").onclick = () => {
      this.sound.playSfx("tap");
      this.resumeSavedRun();
    };

    document.getElementById("btnOpenTown").onclick = () => {
      this.sound.playSfx("tap");
      this.ui.showScreen("screenTown");
      this.ui.renderTown(this.town, (bldgId) => this.handleBuild(bldgId));
    };

    document.getElementById("btnOpenCompendium").onclick = () => {
      this.sound.playSfx("tap");
      this.ui.showScreen("screenCompendium");
      this.ui.renderCompendium("guardians");
    };

    // Difficulty Selection
    document.querySelectorAll("#screenDifficulty [data-diff]").forEach((btn) => {
      btn.onclick = () => {
        const diffKey = btn.dataset.diff.toUpperCase();
        this.selectedDifficulty = DIFFICULTIES[diffKey] || DIFFICULTIES.STANDARD;
        const ascSelect = document.getElementById("selectAscension");
        this.selectedAscension = ascSelect ? parseInt(ascSelect.value, 10) || 0 : 0;
        this.startNewRun();
      };
    });

    document.getElementById("btnBackFromDiff").onclick = () => {
      this.sound.playSfx("tap");
      this.ui.showScreen("screenTitle");
    };

    document.getElementById("btnBackFromTown").onclick = () => {
      this.sound.playSfx("tap");
      this.ui.showScreen("screenTitle");
    };

    document.getElementById("btnBackFromComp").onclick = () => {
      this.sound.playSfx("tap");
      this.ui.showScreen("screenTitle");
    };

    document.getElementById("tabCompGuardians").onclick = () => {
      this.sound.playSfx("tap");
      this.ui.renderCompendium("guardians");
    };
    document.getElementById("tabCompEnemies").onclick = () => {
      this.sound.playSfx("tap");
      this.ui.renderCompendium("enemies");
    };

    // Battle End Turn
    document.getElementById("btnEndTurn").onclick = () => {
      if (this.activeBattle && this.activeBattle.status === "ongoing") {
        this.sound.playSfx("tap");
        this.ui.selectedHandIndex = null;
        this.ui.validTargetCoords = [];
        this.activeBattle.endPlayerTurn();
        this.handleBattleEvents();
        this.renderCurrentBattle();

        if (this.activeBattle.status === "victory") {
          this.handleBattleVictory();
        } else if (this.activeBattle.status === "defeat") {
          this.handleBattleDefeat();
        }
      }
    };

    // Modal Close Buttons
    document.getElementById("btnCloseSheet").onclick = () => this.ui.closeUnitInfo();
    document.getElementById("btnSkipTutorial").onclick = () => {
      localStorage.setItem("lantern_watch_tutorial_seen", "1");
      document.getElementById("modalTutorial").classList.remove("active");
    };
    document.getElementById("btnCloseTutorial").onclick = () => {
      localStorage.setItem("lantern_watch_tutorial_seen", "1");
      document.getElementById("modalTutorial").classList.remove("active");
    };
    document.getElementById("btnCloseUpgradeModal").onclick = () => {
      document.getElementById("modalUpgradeCard").classList.remove("active");
    };
  }

  // ================= RUN LIFECYCLE =================
  startNewRun() {
    this.sound.playSfx("summon");
    const runMap = new RunMap(this.rng.fork());
    const perks = this.town.getTownPerks();

    let startingDeck = [...STARTING_DECK_STANDARD];
    const deckSelect = document.getElementById("selectStartingDeck");
    if (this.town.unlockedDecks.includes("deck_blazing") && deckSelect && deckSelect.value === "blazing") {
      startingDeck = [...STARTING_DECK_BLAZING];
    }

    // Town Forge Perk: 1 free upgrade on start
    if (perks.startUpgradeCard > 0) {
      const card = getCardById(startingDeck[0]);
      if (card && card.upgrade) {
        startingDeck[0] = card.upgrade.id;
      }
    }

    const baseLanternHp = this.selectedDifficulty.lanternHp + (perks.lanternHpBonus || 0);

    this.activeRun = {
      difficulty: this.selectedDifficulty,
      ascension: this.selectedAscension,
      deck: startingDeck,
      relics: [],
      coins: 50,
      currentNight: 1,
      currentNodeId: "n1_l0",
      mapNodes: runMap.nodes,
      visitedNodes: [],
      lanternHp: [baseLanternHp, baseLanternHp, baseLanternHp],
      maxLanternHp: baseLanternHp,
      battleState: null
    };

    this.town.saveActiveRun(this.activeRun);
    this.updateTopBar();
    this.enterNode("n1_l0");
  }

  resumeSavedRun() {
    const saved = this.town.loadActiveRun();
    if (!saved) return;
    this.activeRun = saved;
    this.selectedDifficulty = saved.difficulty || DIFFICULTIES.STANDARD;
    this.selectedAscension = saved.ascension || 0;
    this.updateTopBar();

    // Check if there is an ongoing battle to restore directly mid-fight
    if (saved.battleState) {
      try {
        const battleData = typeof saved.battleState === "string" ? JSON.parse(saved.battleState) : saved.battleState;
        if (battleData && battleData.status === "ongoing") {
          this.activeBattle = Battle.deserialize(battleData, this.rng.fork());
          this.sound.playMusic("battle");
          const nightNum = battleData.battleNode ? battleData.battleNode.night : saved.currentNight;
          const nodeName = battleData.battleNode ? battleData.battleNode.name : "霧夜戰局";
          document.getElementById("battleNightBadge").textContent = `第 ${nightNum} 夜 · ${nodeName}`;
          this.ui.showScreen("screenBattle");
          this.ui.selectedHandIndex = null;
          this.ui.validTargetCoords = [];
          this.renderCurrentBattle();
          return;
        }
      } catch (e) {
        console.warn("[App] Could not resume mid-battle snapshot:", e);
      }
    }

    this.enterNode(saved.currentNodeId);
  }

  renderMapScreen() {
    this.ui.showScreen("screenMap");
    this.sound.playMusic("town");
    document.getElementById("txtCurrentNight").textContent = `第 ${this.activeRun.currentNight} 夜`;

    const container = document.getElementById("containerMapNodes");
    if (!container) return;
    container.innerHTML = "";

    const currentNode = this.activeRun.mapNodes.find((n) => n.id === this.activeRun.currentNodeId);
    const availableNextIds = currentNode ? currentNode.nextNodes : [];

    // Group nodes by night
    for (let night = 1; night <= 8; night++) {
      const rowNodes = this.activeRun.mapNodes.filter((n) => n.night === night);
      const rowEl = document.createElement("div");
      rowEl.className = "map-row";

      rowNodes.forEach((node) => {
        const btn = document.createElement("button");
        btn.type = "button";
        const isCurrent = node.id === this.activeRun.currentNodeId;
        const isVisited = this.activeRun.visitedNodes.includes(node.id);
        const isAvailable = availableNextIds.includes(node.id) || (night === 1 && !isVisited);

        btn.className = `map-node-btn ${isAvailable ? "available" : ""} ${isVisited ? "visited" : ""}`;

        let iconSvg = SVG_ART.icons.sword;
        if (node.type === "elite") iconSvg = SVG_ART.icons.boss;
        if (node.type === "shop") iconSvg = SVG_ART.icons.tea;
        if (node.type === "rest") iconSvg = SVG_ART.icons.hotspring;
        if (node.type === "event") iconSvg = SVG_ART.icons.shrine;
        if (node.type === "boss") iconSvg = SVG_ART.icons.boss;

        btn.innerHTML = `<span class="map-node-icon" style="display:inline-flex;width:18px;height:18px;margin-bottom:2px;">${iconSvg}</span><span style="font-size:10px;">${node.name}</span>`;

        if (isAvailable) {
          btn.onclick = () => {
            this.sound.playSfx("tap");
            this.enterNode(node.id);
          };
        }

        rowEl.appendChild(btn);
      });

      container.appendChild(rowEl);
    }
  }

  enterNode(nodeId) {
    const node = this.activeRun.mapNodes.find((n) => n.id === nodeId);
    if (!node) return;

    this.activeRun.currentNodeId = node.id;
    this.activeRun.currentNight = node.night;
    if (!this.activeRun.visitedNodes.includes(node.id)) {
      this.activeRun.visitedNodes.push(node.id);
    }
    this.town.saveActiveRun(this.activeRun);

    if (node.type === "battle" || node.type === "elite" || node.type === "boss") {
      this.startBattle(node);
    } else if (node.type === "shop") {
      this.openShopScreen();
    } else if (node.type === "rest") {
      this.openRestScreen();
    } else if (node.type === "event") {
      this.openEventScreen();
    }
  }

  // ================= BATTLE FLOW =================
  startBattle(battleNode) {
    this.sound.playMusic("battle");
    this.activeBattle = new Battle({
      rng: this.rng.fork(),
      difficulty: this.activeRun.difficulty,
      ascension: this.activeRun.ascension,
      deck: this.activeRun.deck,
      relics: this.activeRun.relics,
      townPerks: this.town.getTownPerks(),
      initialLanternHp: this.activeRun.lanternHp,
      maxLanternHp: this.activeRun.maxLanternHp,
      battleNode
    });

    this.activeRun.battleState = this.activeBattle.serializeState();
    this.town.saveActiveRun(this.activeRun);

    document.getElementById("battleNightBadge").textContent = `第 ${battleNode.night} 夜 · ${battleNode.name}`;
    this.ui.showScreen("screenBattle");
    this.ui.selectedHandIndex = null;
    this.ui.validTargetCoords = [];
    this.renderCurrentBattle();
  }

  renderCurrentBattle() {
    if (!this.activeBattle) return;
    this.ui.selectedGuardian = this.selectedGuardian;
    this.ui.renderBattle(
      this.activeBattle,
      (x, y) => this.handleTileTap(x, y),
      (index, card) => this.handleCardTap(index, card),
      (unit) => this.ui.openUnitInfo(unit)
    );
  }

  handleCardTap(handIndex, card) {
    this.selectedGuardian = null;
    if (this.ui.selectedHandIndex === handIndex) {
      // Tap again to cancel
      this.sound.playSfx("tap");
      this.ui.selectedHandIndex = null;
      this.ui.validTargetCoords = [];
      this.renderCurrentBattle();
      return;
    }

    // Select card
    this.sound.playSfx("card_select");
    this.ui.selectedHandIndex = handIndex;
    this.calculateValidTargetTiles(card);
    this.renderCurrentBattle();
  }

  calculateValidTargetTiles(card) {
    this.ui.validTargetCoords = [];
    if (!this.activeBattle) return;

    for (let y = 0; y < this.activeBattle.board.rows; y++) {
      for (let x = 0; x < this.activeBattle.board.cols; x++) {
        if (this.activeBattle.validateCardTarget(card, x, y)) {
          this.ui.validTargetCoords.push({ x, y });
        }
      }
    }
  }

  handleTileTap(x, y) {
    if (!this.activeBattle) return;

    // 1. If a hand card is selected, play it
    if (this.ui.selectedHandIndex !== null) {
      const handIndex = this.ui.selectedHandIndex;
      const cardId = this.activeBattle.hand[handIndex];
      const card = getCardById(cardId);

      const result = this.activeBattle.playCard(handIndex, x, y);
      if (result.success) {
        this.sound.playSfx(card.type === CARD_TYPES.SUMMON ? "summon" : "card_play");
        this.ui.selectedHandIndex = null;
        this.ui.validTargetCoords = [];
        this.handleBattleEvents();
        if (this.activeBattle.status === "ongoing") {
          this.activeRun.battleState = this.activeBattle.serializeState();
          this.town.saveActiveRun(this.activeRun);
        }
        this.renderCurrentBattle();

        if (this.activeBattle.status === "victory") {
          this.handleBattleVictory();
        } else if (this.activeBattle.status === "defeat") {
          this.handleBattleDefeat();
        }
      } else {
        this.sound.playSfx("tap");
      }
      return;
    }

    // 2. If a friendly guardian was already selected, check if player tapped a valid destination
    if (this.selectedGuardian) {
      const isTargetValid = this.ui.validTargetCoords.some((c) => c.x === x && c.y === y);
      if (isTargetValid) {
        const moveRes = this.activeBattle.moveGuardian(this.selectedGuardian, x, y);
        if (moveRes.success) {
          this.sound.playSfx("tap");
          this.selectedGuardian = null;
          this.ui.validTargetCoords = [];
          this.handleBattleEvents();
          if (this.activeBattle.status === "ongoing") {
            this.activeRun.battleState = this.activeBattle.serializeState();
            this.town.saveActiveRun(this.activeRun);
          }
          this.renderCurrentBattle();
          return;
        }
      }

      // If clicked the same unit again, open its info modal
      if (this.selectedGuardian.x === x && this.selectedGuardian.y === y) {
        const g = this.selectedGuardian;
        this.selectedGuardian = null;
        this.ui.validTargetCoords = [];
        this.renderCurrentBattle();
        this.ui.openUnitInfo(g);
        return;
      }

      // Deselect
      this.selectedGuardian = null;
      this.ui.validTargetCoords = [];
    }

    // 3. Select an unmoved friendly guardian on the board to move
    const unit = this.activeBattle.board.getUnitAt(x, y);
    if (unit && unit.isGuardian && !unit.hasMoved) {
      this.selectedGuardian = unit;
      this.sound.playSfx("tap");
      this.ui.validTargetCoords = [];
      const maxMove = unit.move + (unit.moveBonus || 0);
      for (let r = 0; r < this.activeBattle.board.rows; r++) {
        for (let c = 0; c < this.activeBattle.board.cols; c++) {
          if (this.activeBattle.board.isEmpty(c, r)) {
            const dist = Math.abs(c - unit.x) + Math.abs(r - unit.y);
            if (dist <= maxMove && dist > 0) {
              this.ui.validTargetCoords.push({ x: c, y: r });
            }
          }
        }
      }
      this.renderCurrentBattle();
      return;
    }

    this.renderCurrentBattle();
  }

  handleBattleEvents() {
    if (!this.activeBattle) return;
    while (this.activeBattle.events.length > 0) {
      const ev = this.activeBattle.events.shift();
      if (ev.type === "damage") {
        this.ui.showDamageNumber(ev.unit.x, ev.unit.y, ev.damage);
        this.sound.playSfx("hit");
      } else if (ev.type === "lantern_hit") {
        this.ui.shakeScreen();
        this.sound.playSfx("lantern_damage");
      } else if (ev.type === "lantern_healed" || ev.type === "heal") {
        this.sound.playSfx("heal");
      } else if (ev.type === "unit_pushed") {
        this.sound.playSfx("push");
      }
    }
  }

  getAvailableCards() {
    return CARD_CATALOGUE.filter((c) => {
      if (c.unitId && !this.town.unlockedUnits.includes(c.unitId)) {
        return false;
      }
      return true;
    });
  }

  handleBattleVictory() {
    this.sound.playSfx("victory");
    const perks = this.town.getTownPerks();
    let earnedCoins = 20;
    if (perks.coinBonus) earnedCoins = Math.floor(earnedCoins * (1 + perks.coinBonus));

    let earnedStars = 3;
    if (this.activeBattle.hasRelic("relic_star_lantern_pouch")) earnedStars += 3;

    this.activeRun.coins += earnedCoins;
    this.town.addStarLanterns(earnedStars);

    // Persist run-level lantern HP across battles
    this.activeRun.lanternHp = this.activeBattle.lanterns.map((l) => l.hp);
    this.activeRun.battleState = null;
    this.town.saveActiveRun(this.activeRun);

    this.updateTopBar();

    // Show Reward Screen
    this.ui.showScreen("screenReward");
    document.getElementById("rewardCoins").textContent = earnedCoins;
    document.getElementById("rewardStars").textContent = earnedStars;

    // Pick 3 random card reward options gated by unlocked units
    const rewardContainer = document.getElementById("rewardCardsRow");
    rewardContainer.innerHTML = "";
    const pool = this.getAvailableCards();
    const shuffled = this.rng.shuffle(pool);
    const rewardOptions = shuffled.slice(0, 3);
    let selectedRewardCardId = rewardOptions[0].id;

    rewardOptions.forEach((c, idx) => {
      const cardEl = document.createElement("div");
      cardEl.className = `card-item ${idx === 0 ? "selected" : ""}`;
      cardEl.style.width = "85px";
      cardEl.style.height = "120px";
      cardEl.innerHTML = `
        <div class="card-header-mini">
          <div class="card-cost-badge">${c.cost}</div>
          <div class="card-type-tag">${getCardTypeLabel(c.type)}</div>
        </div>
        <div class="card-title-mini" style="font-size:12px;">${c.name}</div>
        <div class="card-desc-mini" style="font-size:10px;">${c.desc}</div>
      `;
      cardEl.onclick = () => {
        this.sound.playSfx("tap");
        rewardContainer.querySelectorAll(".card-item").forEach((ci) => ci.classList.remove("selected"));
        cardEl.classList.add("selected");
        selectedRewardCardId = c.id;
      };
      rewardContainer.appendChild(cardEl);
    });

    document.getElementById("btnClaimReward").onclick = () => {
      this.sound.playSfx("tap");
      this.activeRun.deck.push(selectedRewardCardId);
      this.town.saveActiveRun(this.activeRun);

      if (this.activeRun.currentNight >= 8) {
        // Run completely won!
        this.handleFullRunVictory();
      } else {
        this.renderMapScreen();
      }
    };
  }

  handleBattleDefeat() {
    this.sound.playSfx("defeat");
    this.town.recordRunResult(false, this.activeRun.currentNight, 0, this.activeRun.ascension);
    this.town.clearActiveRun();
    this.ui.showAlertModal("守夜失守", "燈籠全數熄滅，小鎮被濃霧籠罩……但你的守夜努力為小鎮帶來了星燈！", () => {
      this.ui.showScreen("screenTitle");
      this.sound.playMusic("town");
      this.checkContinueRun();
    });
  }

  handleFullRunVictory() {
    this.town.recordRunResult(true, 8, 10, this.activeRun.ascension);
    this.town.clearActiveRun();
    this.ui.showAlertModal("守夜大捷", "黎明破曉！你成功守護了燈籠小鎮的八個夜晚，擊退了夜霧魔王！解鎖了更高進階難度！", () => {
      this.ui.showScreen("screenTitle");
      this.sound.playMusic("town");
      this.checkContinueRun();
    });
  }

  // ================= SHOP (茶館) =================
  openShopScreen() {
    this.ui.showScreen("screenShop");
    document.getElementById("shopCoins").textContent = this.activeRun.coins;

    const cardsContainer = document.getElementById("shopCardsList");
    cardsContainer.innerHTML = "";
    const perks = this.town.getTownPerks();

    // 3 Cards for sale gated by unlocked units
    const pool = this.getAvailableCards();
    const shopCards = this.rng.shuffle(pool).slice(0, 3);
    shopCards.forEach((c) => {
      const price = 30;
      const cardEl = document.createElement("div");
      cardEl.className = "card-item";
      cardEl.style.width = "80px";
      cardEl.style.height = "115px";
      cardEl.innerHTML = `
        <div class="card-header-mini">
          <div class="card-cost-badge">${c.cost}</div>
          <div class="card-type-tag">${getCardTypeLabel(c.type)}</div>
        </div>
        <div class="card-title-mini">${c.name}</div>
        <div class="card-desc-mini">${c.desc}</div>
        <div style="font-size:10px;font-weight:700;color:var(--color-ink-accent);text-align:right;margin-top:2px;">
          <span style="display:inline-flex;width:11px;height:11px;vertical-align:middle;">${SVG_ART.icons.coin}</span> ${price}
        </div>
      `;
      cardEl.onclick = () => {
        if (this.activeRun.coins >= price) {
          this.sound.playSfx("card_play");
          this.activeRun.coins -= price;
          this.activeRun.deck.push(c.id);
          this.town.saveActiveRun(this.activeRun);
          cardEl.style.opacity = "0.3";
          cardEl.onclick = null;
          document.getElementById("shopCoins").textContent = this.activeRun.coins;
          this.updateTopBar();
        } else {
          this.ui.showAlertModal("提示", "銅錢不足！");
        }
      };
      cardsContainer.appendChild(cardEl);
    });

    // 2 Relics for sale
    const relicsContainer = document.getElementById("shopRelicsList");
    relicsContainer.innerHTML = "";
    const shopRelics = this.rng.shuffle(RELICS_CATALOGUE).filter((r) => !this.activeRun.relics.includes(r.id)).slice(0, 2);

    shopRelics.forEach((r) => {
      const relicRow = document.createElement("div");
      relicRow.className = "building-card";
      relicRow.innerHTML = `
        <div class="bldg-info">
          <div class="bldg-name"><span style="display:inline-flex;width:14px;height:14px;vertical-align:middle;">${SVG_ART.icons.star}</span> ${r.name}</div>
          <div class="bldg-desc">${r.desc}</div>
        </div>
        <button type="button" class="btn-build"><span style="display:inline-flex;width:12px;height:12px;vertical-align:middle;">${SVG_ART.icons.coin}</span> ${r.price}</button>
      `;
      relicRow.querySelector(".btn-build").onclick = () => {
        if (this.activeRun.coins >= r.price) {
          this.sound.playSfx("heal");
          this.activeRun.coins -= r.price;
          this.activeRun.relics.push(r.id);
          this.town.saveActiveRun(this.activeRun);
          relicRow.style.opacity = "0.4";
          relicRow.querySelector(".btn-build").disabled = true;
          document.getElementById("shopCoins").textContent = this.activeRun.coins;
          this.updateTopBar();
        } else {
          this.ui.showAlertModal("提示", "銅錢不足！");
        }
      };
      relicsContainer.appendChild(relicRow);
    });

    // Card Removal Service
    const removeCost = perks.freeCardRemoval > 0 ? 0 : 50;
    document.getElementById("txtRemoveCardDesc").textContent = removeCost === 0 ? "免費（老茶樹特許）" : `費用：${removeCost} 銅錢`;
    document.getElementById("btnShopRemoveCard").onclick = () => {
      if (this.activeRun.coins >= removeCost && this.activeRun.deck.length > 5) {
        this.openCardUpgradeModal((cardId, idx) => {
          this.activeRun.deck.splice(idx, 1);
          this.activeRun.coins -= removeCost;
          this.town.saveActiveRun(this.activeRun);
          this.sound.playSfx("tap");
          document.getElementById("modalUpgradeCard").classList.remove("active");
          document.getElementById("shopCoins").textContent = this.activeRun.coins;
          this.updateTopBar();
        });
      } else if (this.activeRun.deck.length <= 5) {
        this.ui.showAlertModal("提示", "牌組至少需保留 5 張牌！");
      } else {
        this.ui.showAlertModal("提示", "銅錢不足！");
      }
    };

    document.getElementById("btnLeaveShop").onclick = () => {
      this.sound.playSfx("tap");
      this.town.saveActiveRun(this.activeRun);
      this.renderMapScreen();
    };
  }

  // ================= REST (溫泉) =================
  openRestScreen() {
    this.ui.showScreen("screenRest");

    document.getElementById("btnRestRepairLantern").onclick = () => {
      this.sound.playSfx("heal");
      if (this.activeRun && this.activeRun.lanternHp) {
        for (let i = 0; i < this.activeRun.lanternHp.length; i++) {
          if (this.activeRun.lanternHp[i] > 0) {
            this.activeRun.lanternHp[i] = Math.min(this.activeRun.maxLanternHp, this.activeRun.lanternHp[i] + 2);
          }
        }
        this.town.saveActiveRun(this.activeRun);
      }
      this.ui.showAlertModal("修復燈籠", "全體燈籠耐久獲得修復（+2 耐久）！", () => {
        this.renderMapScreen();
      });
    };

    document.getElementById("btnRestUpgradeCard").onclick = () => {
      this.openCardUpgradeModal((cardId, idx) => {
        const c = getCardById(cardId);
        if (c && c.upgrade) {
          this.activeRun.deck[idx] = c.upgrade.id;
          this.town.saveActiveRun(this.activeRun);
          this.sound.playSfx("heal");
          document.getElementById("modalUpgradeCard").classList.remove("active");
          this.ui.showAlertModal("磨礪心境", `已將【${c.name}】強化為【${c.upgrade.name}】！`, () => {
            this.renderMapScreen();
          });
        }
      });
    };
  }

  openCardUpgradeModal(onSelectCard) {
    const modal = document.getElementById("modalUpgradeCard");
    const container = document.getElementById("upgradeCardsGrid");
    container.innerHTML = "";

    this.activeRun.deck.forEach((cardId, idx) => {
      const c = getCardById(cardId);
      if (!c) return;

      const cardEl = document.createElement("div");
      cardEl.className = "card-item";
      cardEl.style.width = "75px";
      cardEl.style.height = "105px";
      cardEl.innerHTML = `
        <div class="card-header-mini">
          <div class="card-cost-badge">${c.cost}</div>
          <div class="card-type-tag">${c.isUpgraded ? "強化" : getCardTypeLabel(c.type)}</div>
        </div>
        <div class="card-title-mini">${c.name}</div>
      `;
      cardEl.onclick = () => onSelectCard(cardId, idx);
      container.appendChild(cardEl);
    });

    modal.classList.add("active");
  }

  // ================= EVENT (神龕事件) =================
  openEventScreen() {
    this.ui.showScreen("screenEvent");
    const choices = document.getElementById("containerEventChoices");
    choices.innerHTML = "";

    const btn1 = document.createElement("button");
    btn1.type = "button";
    btn1.className = "btn-main";
    btn1.innerHTML = "<span>奉納 20 銅錢，祈求神火加持</span>";
    btn1.onclick = () => {
      if (this.activeRun.coins >= 20) {
        this.activeRun.coins -= 20;
        if (!this.activeRun.relics.includes("relic_ancestral_flint")) {
          this.activeRun.relics.push("relic_ancestral_flint");
        }
        this.town.saveActiveRun(this.activeRun);
        this.sound.playSfx("heal");
        this.ui.showAlertModal("神火加持", "石龕迸發暖光，你獲得了珍奇信物【祖傳打火石】！", () => {
          this.renderMapScreen();
        });
      } else {
        this.ui.showAlertModal("提示", "銅錢不足！");
      }
    };

    const btn2 = document.createElement("button");
    btn2.type = "button";
    btn2.className = "btn-secondary";
    btn2.innerHTML = "<span>靜坐沉思，調勻氣息（燈籠生命全滿）</span>";
    btn2.onclick = () => {
      if (this.activeRun && this.activeRun.lanternHp) {
        for (let i = 0; i < this.activeRun.lanternHp.length; i++) {
          this.activeRun.lanternHp[i] = this.activeRun.maxLanternHp;
        }
        this.town.saveActiveRun(this.activeRun);
      }
      this.sound.playSfx("heal");
      this.ui.showAlertModal("靜坐沉思", "身心沉靜，夜霧悄然散開，全體燈籠耐久完全回復！", () => {
        this.renderMapScreen();
      });
    };

    choices.appendChild(btn1);
    choices.appendChild(btn2);
  }

  // ================= TOWN BUILDING =================
  handleBuild(bldgId) {
    const success = this.town.build(bldgId);
    if (success) {
      this.sound.playSfx("summon");
      this.ui.renderTown(this.town, (id) => this.handleBuild(id));
      this.updateTopBar();
    } else {
      this.ui.showAlertModal("提示", "星燈不足或已經建造！");
    }
  }
}

// Start application once DOM ready
window.addEventListener("DOMContentLoaded", () => {
  window.app = new LanternWatchApp();
});
