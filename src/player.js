import { abilities } from "./data/abilities.js";
import { characters } from "./data/characters.js";
import { weapons } from "./data/weapons.js";
import { angleTo, clamp, distance, normalize, pushCircleOutOfRect } from "./utils/math.js";

const P1_CONTROLS = {
  moveUp: "moveUp",
  moveDown: "moveDown",
  moveLeft: "moveLeft",
  moveRight: "moveRight",
  dash: "dash",
  autoAimAttack: "autoAimAttack",
  ability: "ability",
  extraAbility: "extraAbility",
  interact: "interact"
};

const P2_CONTROLS = {
  moveUp: "p2MoveUp",
  moveDown: "p2MoveDown",
  moveLeft: "p2MoveLeft",
  moveRight: "p2MoveRight",
  dash: "p2Dash",
  autoAimAttack: "p2AutoAimAttack",
  ability: "p2Ability",
  extraAbility: "p2ExtraAbility",
  interact: "p2Interact"
};

export class Player {
  constructor(character, stageRoom, options = {}) {
    this.character = character;
    this.playerIndex = options.playerIndex ?? 0;
    this.label = options.label ?? `P${this.playerIndex + 1}`;
    this.controls = options.controls ?? (this.playerIndex === 1 ? P2_CONTROLS : P1_CONTROLS);
    this.x = stageRoom.width / 2 + (options.spawnOffsetX ?? 0);
    this.y = stageRoom.height / 2;
    this.radius = 24;
    this.hp = character.maxHp;
    this.maxHp = character.maxHp;
    this.facing = 0;
    this.lastMove = { x: 1, y: 0 };
    this.classWeapon = weapons[character.fixedWeapon] ?? weapons[character.starterWeapons?.[0]] ?? weapons.ironSaber;
    this.secretWeapon = null;
    this.baseDamage = character.baseDamage ?? 1;
    this.attackTimer = 0;
    this.dashTimer = 0;
    this.dashing = 0;
    this.invulnerable = 0;
    this.abilityCooldowns = {};
    this.abilityState = null;
    this.extraAbilityId = null;
    this.extraAbilityCooldown = 0;
    this.canMannequinTransform = character.id === "mannequin";
    this.transformEntry = {
      active: false,
      buffer: "",
      timer: 0
    };
    this.score = 0;
    this.gold = 0;
    this.materials = {
      weapon: 0,
      weaponCore: 0,
      hero: 0
    };
    this.blueprints = {
      weaponEvolution: false,
      heroAscension: false
    };
    this.questlines = {
      hidden: {
        started: false,
        stage: null,
        progress: 0
      }
    };
    this.inventoryMessage = "";
    this.isMoving = false;
    this.animationTime = 0;
    this.slowed = 0;
    this.statBonuses = {
      attackDamage: 0,
      attackSpeed: 0,
      moveSpeed: 0,
      dashCooldown: 0,
      abilityCooldown: 0
    };
    this.abilityMods = {
      pullRadius: 0,
      smashRadius: 0,
      smashDamage: 0,
      netRadius: 0,
      netDuration: 0,
      netDamage: 0
    };
    this.passives = new Set();
    this.abilityUpgrades = new Set();
    this.weaponEvolution = {
      damageBonus: 0,
      abilityId: null,
      completed: false,
      blueprintId: null
    };
    this.pets = [];
    this.rewardHistory = [];
    this.lastReward = null;
    this.reviveAvailable = false;
    this.dashStrikeReady = false;
  }

  get weapon() {
    return this.secretWeapon ?? this.classWeapon ?? weapons.ironSaber;
  }

  get ability() {
    return this.character.abilityId ? abilities[this.character.abilityId] : null;
  }

  hasUltimateWeapon() {
    return true;
  }

  equippedClassBonus() {
    return !this.secretWeapon;
  }

  hasReward(id) {
    return this.rewardHistory.includes(id);
  }

  abilityValue(key) {
    return (this.ability?.[key] ?? 0) + (this.abilityMods[key] ?? 0);
  }

  abilityCooldownMax() {
    if (!this.ability) {
      return 0;
    }
    return this.ability.cooldown * (1 - Math.min(0.55, this.statBonuses.abilityCooldown));
  }

  abilityCooldownValue() {
    return this.ability ? this.abilityCooldowns[this.ability.id] ?? 0 : 0;
  }

  setAbilityCooldown(value) {
    if (!this.ability) {
      return;
    }
    this.abilityCooldowns[this.ability.id] = Math.max(0, value);
  }

  extraAbilityCooldownMax() {
    return this.character.classId === "swordsman" ? 7.5 : 6.5;
  }

  weaponCooldown() {
    return (this.weapon?.cooldown ?? 0.45) * (1 - Math.min(0.65, this.statBonuses.attackSpeed));
  }

  attackDamageBonus() {
    if (this.secretWeapon) {
      return 0;
    }
    return (this.weapon?.damageBonus ?? 0) + this.weaponEvolution.damageBonus;
  }

  attackDamage() {
    if (this.weapon?.kind === "nuke") {
      return this.weapon.damage ?? 9999;
    }
    return this.baseDamage * (1 + this.statBonuses.attackDamage + this.attackDamageBonus());
  }

  update(dt, input, camera, room, combat) {
    if (this.hp <= 0) {
      this.isMoving = false;
      return;
    }

    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.dashTimer = Math.max(0, this.dashTimer - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    for (const abilityId of Object.keys(this.abilityCooldowns)) {
      this.abilityCooldowns[abilityId] = Math.max(0, this.abilityCooldowns[abilityId] - dt);
    }
    this.extraAbilityCooldown = Math.max(0, this.extraAbilityCooldown - dt);
    this.slowed = Math.max(0, this.slowed - dt);

    const worldMouse = {
      x: input.mouse.x / (camera.scale ?? 1) + camera.x,
      y: input.mouse.y / (camera.scale ?? 1) + camera.y
    };
    this.facing = angleTo(this, worldMouse);

    const move = normalize(
      (input.isDown(this.controls.moveRight) ? 1 : 0) - (input.isDown(this.controls.moveLeft) ? 1 : 0),
      (input.isDown(this.controls.moveDown) ? 1 : 0) - (input.isDown(this.controls.moveUp) ? 1 : 0)
    );
    this.isMoving = move.x !== 0 || move.y !== 0;
    if (this.isMoving) {
      this.lastMove = move;
    }
    this.animationTime += dt;

    if (input.wasPressed(this.controls.dash) && this.dashTimer <= 0) {
      this.dashing = 0.16;
      this.invulnerable = 0.28;
      this.dashTimer = this.character.dashCooldown * (1 - Math.min(0.55, this.statBonuses.dashCooldown));
      if (this.passives.has("sageDashStrike")) {
        this.dashStrikeReady = true;
      }
    }

    const slowMultiplier = this.slowed > 0 ? 0.58 : 1;
    const speedBonus = 1 + this.statBonuses.moveSpeed;
    const speed = (this.dashing > 0 ? this.character.dashSpeed : this.character.speed) * speedBonus * slowMultiplier;
    this.dashing = Math.max(0, this.dashing - dt);
    this.x += move.x * speed * dt;
    this.y += move.y * speed * dt;
    for (const obstacle of room.obstacles) {
      pushCircleOutOfRect(this, obstacle);
    }
    this.x = clamp(this.x, room.margin + this.radius, room.width - room.margin - this.radius);
    this.y = clamp(this.y, room.margin + this.radius, room.height - room.margin - this.radius);

    if (!this.game?.stage?.isLobby && input.isDown(this.controls.autoAimAttack) && this.attackTimer <= 0) {
      const targetEnemy = this.nearestEnemy();
      if (targetEnemy) {
        this.facing = angleTo(this, targetEnemy);
        this.attack(combat, targetEnemy);
      } else if (input.wasPressed(this.controls.autoAimAttack)) {
        combat.floatText(this.x, this.y - 42, "No target", "#afa89e");
      }
    }

    if (!this.game?.stage?.isLobby && input.wasPressed(this.controls.ability)) {
      this.tryUseAbility(combat, worldMouse);
    }

    if (this.canMannequinTransform && !this.transformEntry.active && input.wasPressed(this.controls.extraAbility)) {
      this.startMannequinTransform(combat);
    } else {
      this.updateMannequinTransform(dt, input, combat);
    }

    if (!this.game?.stage?.isLobby && !this.canMannequinTransform && input.wasPressed(this.controls.extraAbility)) {
      this.tryUseExtraAbility(combat);
    }

    if (this.abilityState) {
      this.updateAbility(dt, combat);
    }

    this.updatePets(dt, combat);
  }

  startMannequinTransform(combat) {
    this.transformEntry.active = true;
    this.transformEntry.buffer = "";
    this.transformEntry.timer = 2.35;
    combat.floatText(this.x, this.y - 58, "Type swor or arch", "#f6f1e8");
  }

  updateMannequinTransform(dt, input, combat) {
    if (!this.transformEntry.active) {
      return;
    }

    this.transformEntry.timer -= dt;
    for (const typed of input.typedCharacters) {
      if (typed === "backspace") {
        this.transformEntry.buffer = this.transformEntry.buffer.slice(0, -1);
        continue;
      }
      if (/^[a-z]$/.test(typed)) {
        this.transformEntry.buffer = `${this.transformEntry.buffer}${typed}`.slice(0, 4);
      }
    }

    const character = this.transformCharacterFromBuffer();
    if (character) {
      this.transformMannequinInto(character, combat);
      return;
    }

    if (this.transformEntry.timer <= 0) {
      const typed = this.transformEntry.buffer || "...";
      this.transformEntry.active = false;
      this.transformEntry.buffer = "";
      combat.floatText(this.x, this.y - 58, `No form: ${typed}`, "#afa89e");
    }
  }

  transformCharacterFromBuffer() {
    const buffer = this.transformEntry.buffer.toLowerCase();
    if (buffer.length < 4) {
      return null;
    }
    return characters.find((character) => character.id.slice(0, 4) === buffer || character.role.toLowerCase().slice(0, 4) === buffer) ?? null;
  }

  transformMannequinInto(character, combat) {
    const hpRatio = this.maxHp > 0 ? this.hp / this.maxHp : 1;
    this.character = character;
    this.maxHp = character.maxHp;
    this.hp = Math.max(1, Math.min(this.maxHp, Math.round(this.maxHp * hpRatio)));
    this.classWeapon = weapons[character.fixedWeapon] ?? weapons[character.starterWeapons?.[0]] ?? weapons.sparkPistol;
    this.secretWeapon = null;
    this.baseDamage = character.baseDamage ?? this.baseDamage;
    this.abilityState = null;
    this.transformEntry.active = false;
    this.transformEntry.buffer = "";
    this.inventoryMessage = `${character.name} form`;
    this.extraAbilityId = null;
    this.extraAbilityCooldown = 0;
    combat.floatText(this.x, this.y - 64, `${character.role} form`, character.accent);
  }

  tryUseExtraAbility(combat) {
    if (!this.extraAbilityId) {
      combat.floatText(this.x, this.y - 42, "Evolution ability locked", "#afa89e");
      return;
    }
    if (this.extraAbilityCooldown > 0) {
      combat.floatText(this.x, this.y - 42, "Evolution cooling down", "#f2b85b");
      return;
    }

    if (this.extraAbilityId === "guardBreaker") {
      this.facing = Math.atan2(this.lastMove.y, this.lastMove.x);
      const start = { x: this.x, y: this.y };
      const dashDistance = 330;
      this.invulnerable = Math.max(this.invulnerable, 0.55);
      this.x += Math.cos(this.facing) * dashDistance;
      this.y += Math.sin(this.facing) * dashDistance;
      if (this.game?.stage?.room) {
        const room = this.game.stage.room;
        for (const obstacle of room.obstacles) {
          pushCircleOutOfRect(this, obstacle);
        }
        this.x = clamp(this.x, room.margin + this.radius, room.width - room.margin - this.radius);
        this.y = clamp(this.y, room.margin + this.radius, room.height - room.margin - this.radius);
      }
      combat.spawnSlash({
        owner: this,
        x: start.x,
        y: start.y,
        angle: this.facing,
        radius: dashDistance + 82,
        arc: 0.28,
        damage: this.attackDamage() * 2.35,
        knockback: 360,
        life: 0.2,
        classBonus: true
      });
      this.extraAbilityCooldown = this.extraAbilityCooldownMax();
      combat.floatText(this.x, this.y - 58, "Guard Breaker", this.character.accent);
      return;
    }

    if (this.extraAbilityId === "arrowStorm") {
      const target = this.nearestEnemy();
      if (!target) {
        combat.floatText(this.x, this.y - 42, "No target", "#afa89e");
        return;
      }
      const baseAngle = angleTo(this, target);
      for (let i = 0; i < 7; i += 1) {
        const offset = (i - 3) * 0.105;
        combat.spawnProjectile({
          owner: this,
          faction: "player",
          x: this.x + Math.cos(baseAngle + offset) * 28,
          y: this.y + Math.sin(baseAngle + offset) * 28,
          angle: baseAngle + offset,
          speed: 820,
          radius: 7,
          damage: this.attackDamage() * 0.58,
          life: 0.72,
          color: this.character.accent,
          icePatchOnEnd: {
            radius: 74,
            slow: 1.35,
            life: 2.4,
            color: this.character.accent
          }
        });
      }
      combat.spawnIcePatch({
        x: target.x,
        y: target.y,
        radius: 112,
        slow: 1.7,
        life: 3.3,
        color: this.character.accent
      });
      this.extraAbilityCooldown = this.extraAbilityCooldownMax();
      combat.floatText(target.x, target.y - 58, "Arrow Storm", this.character.accent);
    }
  }

  attack(combat, target) {
    const weapon = this.weapon;
    const damage = this.attackDamage() * (this.dashStrikeReady ? 1.3 : 1);
    this.attackTimer = this.weaponCooldown();

    if (weapon.kind === "nuke") {
      this.fireNuke(combat);
      this.dashStrikeReady = false;
      return;
    }

    if (weapon.kind === "melee") {
      combat.spawnSlash({
        owner: this,
        x: this.x,
        y: this.y,
        angle: this.facing,
        radius: weapon.range,
        arc: weapon.arc,
        damage,
        knockback: weapon.knockback,
        life: weapon.slashLife ?? 0.12,
        classBonus: !this.secretWeapon,
        hitAllInRange: weapon.hitAllInRange ?? false,
        slashStyle: weapon.slashStyle,
        color: weapon.slashColor,
        accent: weapon.slashAccent,
        hitTextColor: weapon.hitTextColor
      });
      this.dashStrikeReady = false;
      return;
    }

    const count = weapon.projectileCount ?? 1;
    const spread = weapon.spread ?? 0;
    for (let i = 0; i < count; i += 1) {
      const offset = count === 1 ? 0 : (i - (count - 1) / 2) * spread;
      combat.spawnProjectile({
        owner: this,
        faction: "player",
        x: this.x + Math.cos(this.facing) * 28,
        y: this.y + Math.sin(this.facing) * 28,
        angle: this.facing + offset + (Math.random() - 0.5) * spread * 0.2,
        speed: weapon.projectileSpeed,
        radius: weapon.rarity === "rare" ? 9 : 7,
        damage,
        life: weapon.projectileLife,
        slow: weapon.slow ?? 0,
        sprite: weapon.id === "elmLongbow" && this.character.classId === "archer" && !this.secretWeapon ? "iceArrow" : null,
        color: this.secretWeapon ? "#f2b85b" : this.character.accent
      });
    }
    this.dashStrikeReady = false;
  }

  nearestEnemy() {
    if (!this.game) {
      return null;
    }

    let best = null;
    let bestDistance = Infinity;
    for (const enemy of this.game.enemies) {
      if (enemy.hp <= 0) {
        continue;
      }
      const dist = distance(this, enemy);
      if (dist < bestDistance) {
        best = enemy;
        bestDistance = dist;
      }
    }
    return best;
  }

  fireNuke(combat) {
    if (!this.game) {
      return;
    }

    let hitCount = 0;
    for (const enemy of this.game.enemies) {
      if (enemy.hp > 0) {
        enemy.hp = 0;
        hitCount += 1;
        combat.floatText(enemy.x, enemy.y - enemy.radius, "NUKED", "#f2b85b");
      }
    }

    combat.screenShake = Math.max(combat.screenShake, hitCount > 0 ? 28 : 10);
    combat.floatText(this.x, this.y - 62, hitCount > 0 ? "Room erased" : "No targets", "#f2b85b");
  }

  tryUseAbility(combat, target) {
    if (!this.ability) {
      combat.floatText(this.x, this.y - 42, "No class ability", "#afa89e");
      return;
    }
    if (this.abilityCooldownValue() > 0) {
      combat.floatText(this.x, this.y - 42, "Cooling down", "#f2b85b");
      return;
    }

    const ability = this.ability;
    this.setAbilityCooldown(this.abilityCooldownMax());

    if (ability.id === "whirlwindSmash") {
      this.abilityState = {
        id: ability.id,
        timer: this.abilityValue("duration"),
        total: this.abilityValue("duration"),
        smashed: false
      };
      combat.floatText(this.x, this.y - 52, "Whirlwind!", this.character.accent);
      return;
    }

    if (ability.id === "giantNet") {
      const target = this.nearestEnemy();
      if (target) {
        this.facing = angleTo(this, target);
      }
      combat.spawnNet({
        owner: this,
        x: this.x + Math.cos(this.facing) * 32,
        y: this.y + Math.sin(this.facing) * 32,
        angle: this.facing,
        speed: this.abilityValue("projectileSpeed"),
        radius: this.abilityValue("projectileRadius"),
        netRadius: this.abilityValue("netRadius"),
        netDuration: this.abilityValue("netDuration"),
        damage: this.abilityValue("netDamage"),
        color: this.character.accent,
        thornBurst: this.abilityUpgrades.has("netThorns")
      });
      combat.floatText(this.x, this.y - 52, "Net launched!", this.character.accent);
    }
  }

  updateAbility(dt, combat) {
    const ability = this.ability;
    this.abilityState.timer -= dt;

    if (this.abilityState.id === "whirlwindSmash") {
      combat.pullEnemies(this, this.abilityValue("pullRadius"), ability.pullStrength, dt);
      if (this.abilityState.timer <= 0 && !this.abilityState.smashed) {
        this.abilityState.smashed = true;
        combat.areaDamage(this, this.abilityValue("smashRadius"), this.abilityValue("smashDamage"), 420);
        if (this.abilityUpgrades.has("whirlwindBlades")) {
          this.fireWhirlwindBlades(combat);
        }
        combat.screenShake = Math.max(combat.screenShake, 12);
      }
    }

    if (this.abilityState.timer <= -0.05) {
      this.abilityState = null;
    }
  }

  fireWhirlwindBlades(combat) {
    for (let i = 0; i < 8; i += 1) {
      combat.spawnProjectile({
        owner: this,
        faction: "player",
        x: this.x,
        y: this.y,
        angle: (Math.PI * 2 * i) / 8,
        speed: 620,
        radius: 8,
        damage: 22 * (1 + this.statBonuses.attackDamage),
        life: 0.62,
        color: this.character.accent
      });
    }
  }

  updatePets(dt, combat) {
    if (!this.game || this.pets.length === 0) {
      return;
    }

    for (let i = 0; i < this.pets.length; i += 1) {
      const pet = this.pets[i];
      pet.angle += dt * (1.7 + i * 0.18);
      pet.x = this.x + Math.cos(pet.angle + i * 2.1) * 48;
      pet.y = this.y + Math.sin(pet.angle + i * 2.1) * 34;
      pet.cooldown = Math.max(0, pet.cooldown - dt);

      if (pet.cooldown > 0) {
        continue;
      }

      const target = this.game.enemies
        .filter((enemy) => enemy.hp > 0 && distance(pet, enemy) < 520)
        .sort((a, b) => distance(pet, a) - distance(pet, b))[0];
      if (!target) {
        continue;
      }

      combat.spawnProjectile({
        owner: this,
        faction: "player",
        x: pet.x,
        y: pet.y,
        angle: angleTo(pet, target),
        speed: 680,
        radius: 6,
        damage: 12 * (1 + this.statBonuses.attackDamage),
        life: 0.75,
        color: pet.color
      });
      pet.cooldown = 1.05;
    }
  }

  takeDamage(amount) {
    if (this.hp <= 0) {
      return false;
    }

    if (this.character.classId === "swordsman" && this.abilityState?.id === "whirlwindSmash") {
      return false;
    }

    if (this.invulnerable > 0) {
      return false;
    }
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0 && this.reviveAvailable) {
      this.reviveAvailable = false;
      this.hp = Math.ceil(this.maxHp * 0.45);
      this.invulnerable = 1.2;
      return false;
    }
    this.invulnerable = 0.45;
    return true;
  }

  equipWeapon(weapon) {
    const oldWeapon = this.weapon;
    this.secretWeapon = weapon;
    this.inventoryMessage = `${weapon.name} armed`;
    return oldWeapon;
  }

  heal(amount) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - before;
  }

  setCharacter(character) {
    this.character = character;
    this.radius = 24;
    this.hp = character.maxHp;
    this.maxHp = character.maxHp;
    this.classWeapon = weapons[character.fixedWeapon] ?? weapons.sparkPistol;
    this.secretWeapon = null;
    this.baseDamage = character.baseDamage ?? 1;
    this.attackTimer = 0;
    this.dashTimer = 0;
    this.dashing = 0;
    this.invulnerable = 0;
    this.abilityCooldowns = {};
    this.abilityState = null;
    this.extraAbilityId = null;
    this.extraAbilityCooldown = 0;
    this.canMannequinTransform = character.id === "mannequin";
    this.transformEntry = {
      active: false,
      buffer: "",
      timer: 0
    };
    this.inventoryMessage = `${character.name} selected`;
    this.slowed = 0;
    this.statBonuses = {
      attackDamage: 0,
      attackSpeed: 0,
      moveSpeed: 0,
      dashCooldown: 0,
      abilityCooldown: 0
    };
    this.abilityMods = {
      pullRadius: 0,
      smashRadius: 0,
      smashDamage: 0,
      netRadius: 0,
      netDuration: 0,
      netDamage: 0
    };
    this.passives = new Set();
    this.abilityUpgrades = new Set();
    this.weaponEvolution = {
      damageBonus: 0,
      abilityId: null,
      completed: false,
      blueprintId: null
    };
    this.pets = [];
    this.rewardHistory = [];
    this.lastReward = null;
    this.reviveAvailable = false;
    this.dashStrikeReady = false;
  }
}
