import { angleTo, clamp, distance, normalize, pushCircleOutOfRect, randomRange } from "./utils/math.js";

const broadcasterDialogue = {
  micDrop: [
    "Prove me wrong.",
    "Let's have the debate.",
    "Come to the mic.",
    "What are you afraid of?"
  ],
  table: [
    "Free speech wins.",
    "Set up the table.",
    "Debate me on campus.",
    "No safe spaces today."
  ],
  phone: [
    "Pull up the numbers.",
    "Look at the data.",
    "You're missing the point.",
    "That argument collapses."
  ],
  liveStream: [
    "We are live.",
    "Millions are watching.",
    "This is the turning point.",
    "Say it on camera."
  ]
};

const elonDialogue = {
  xPost: [
    "Who controls the memes, controls the Universe.",
    "The social media AI algorithms are basically dopamine maximizers.",
    "Let that sink in."
  ],
  autopilot: [
    "Defeating traffic is the ultimate boss battle.",
    "Even the most powerful humans in the world cannot defeat traffic.",
    "You want your net useful output to be maximized."
  ],
  flamethrower: [
    "Apparently, we are renaming it Not a Flamethrower.",
    "I put the art in fart.",
    "Any product that needs a manual to work is broken."
  ],
  doge: [
    "Dogecoin is the people's crypto.",
    "I'm not advising anyone to buy crypto or bet the farm on dogecoin.",
    "Due to inflation 420 has gone up by 69."
  ],
  starship: [
    "Born on Earth and die on Mars. Just hopefully not at impact.",
    "If humanity doesn't land on Mars in my lifetime, I would be very disappointed.",
    "We are the first species capable of self-annihilation."
  ]
};

const enemyKinds = {
  scout: {
    name: "Cinder Scout",
    radius: 22,
    hp: 52,
    speed: 142,
    damage: 10,
    color: "#d95757",
    sightRange: 520,
    loseRange: 760,
    leashRange: 680,
    touchCooldown: 0.62,
    wanderSpeed: 58,
    attackRange: 42,
    habit: "wanders until it sees you, then chases with small zigzags"
  },
  brute: {
    name: "Stone Brute",
    radius: 31,
    hp: 98,
    speed: 88,
    damage: 18,
    color: "#b56b34",
    sightRange: 450,
    loseRange: 720,
    leashRange: 620,
    touchCooldown: 0.78,
    wanderSpeed: 36,
    attackRange: 58,
    chargeRange: 360,
    windupTime: 0.48,
    chargeTime: 0.46,
    chargeSpeed: 3.7,
    habit: "slow chase, warning glow, then a straight charge"
  },
  ranger: {
    name: "Lantern Ranger",
    radius: 21,
    hp: 44,
    speed: 118,
    damage: 9,
    color: "#73a9ff",
    sightRange: 650,
    loseRange: 860,
    leashRange: 740,
    touchCooldown: 0.72,
    wanderSpeed: 44,
    attackRange: 520,
    preferredMin: 260,
    preferredMax: 440,
    windupTime: 0.28,
    habit: "keeps a preferred distance, strafes, and fires bolts"
  },
  bomber: {
    name: "Ash Bomber",
    radius: 24,
    hp: 62,
    speed: 156,
    damage: 20,
    color: "#f2b85b",
    sightRange: 520,
    loseRange: 780,
    leashRange: 680,
    touchCooldown: 0.7,
    wanderSpeed: 50,
    attackRange: 75,
    windupTime: 0.38,
    habit: "wanders, wakes up, rushes, then explodes after a warning"
  },
  supporter: {
    name: "Campus Supporter",
    radius: 19,
    hp: 42,
    speed: 126,
    damage: 7,
    color: "#476ac7",
    sightRange: 680,
    loseRange: 900,
    leashRange: 900,
    touchCooldown: 0.75,
    wanderSpeed: 42,
    attackRange: 430,
    windupTime: 0.22,
    habit: "keeps pressure with small pamphlet shots"
  },
  duelist: {
    name: "Ember Duelist",
    radius: 23,
    hp: 72,
    speed: 168,
    damage: 14,
    color: "#ef7d57",
    sightRange: 580,
    loseRange: 820,
    leashRange: 760,
    touchCooldown: 0.58,
    wanderSpeed: 56,
    attackRange: 58,
    chargeRange: 380,
    windupTime: 0.24,
    chargeTime: 0.34,
    chargeSpeed: 3.25,
    habit: "unlocked after boss 1; feints in, then lunges through the player"
  },
  seer: {
    name: "Rift Seer",
    radius: 22,
    hp: 58,
    speed: 106,
    damage: 11,
    color: "#a747d9",
    sightRange: 700,
    loseRange: 920,
    leashRange: 820,
    touchCooldown: 0.76,
    wanderSpeed: 38,
    attackRange: 560,
    preferredMin: 300,
    preferredMax: 520,
    windupTime: 0.34,
    habit: "unlocked after boss 2; keeps distance and casts slow homing bolts"
  },
  mender: {
    name: "Cinder Mender",
    radius: 24,
    hp: 76,
    speed: 112,
    damage: 8,
    color: "#5ec28c",
    sightRange: 660,
    loseRange: 900,
    leashRange: 800,
    touchCooldown: 0.8,
    wanderSpeed: 40,
    attackRange: 460,
    windupTime: 0.32,
    habit: "unlocked after boss 3; heals nearby enemies and fires support sparks"
  },
  shade: {
    name: "Moon Shade",
    radius: 21,
    hp: 64,
    speed: 150,
    damage: 15,
    color: "#7a7f91",
    sightRange: 620,
    loseRange: 880,
    leashRange: 840,
    touchCooldown: 0.62,
    wanderSpeed: 62,
    attackRange: 72,
    blinkRange: 430,
    windupTime: 0.2,
    habit: "unlocked after boss 4; blinks near the player before striking"
  },
  bulwark: {
    name: "Vault Bulwark",
    radius: 34,
    hp: 132,
    speed: 76,
    damage: 22,
    color: "#80664d",
    sightRange: 500,
    loseRange: 760,
    leashRange: 690,
    touchCooldown: 0.88,
    wanderSpeed: 28,
    attackRange: 92,
    windupTime: 0.55,
    habit: "unlocked after boss 5; advances slowly and releases shock rings"
  }
};

const postBossEnemyUnlocks = ["duelist", "seer", "mender", "shade", "bulwark"];
const ENEMY_REGEN_DELAY = 5;
const ENEMY_REGEN_RATE = 0.08;

export function createEnemies(stage) {
  const enemies = [];
  if (stage.isBoss) {
    enemies.push(createEnemy("boss", stage, stage.room.width / 2, stage.room.margin + 170));
    return enemies;
  }

  const kindCycle = ["scout", "ranger", "scout", "bomber", "brute"];
  const bossTier = stage.bossTier ?? Math.floor((stage.number - 1) / 5);
  const postBossKinds = postBossEnemyUnlocks.slice(0, Math.min(bossTier, postBossEnemyUnlocks.length));
  for (let i = 0; i < stage.enemyCount; i += 1) {
    const unlocked = stage.number < 3 ? ["scout"] : [...kindCycle, ...postBossKinds];
    const kind = unlocked[i % unlocked.length];
    const spawn = randomSpawn(stage.room);
    enemies.push(createEnemy(kind, stage, spawn.x, spawn.y));
  }
  return enemies;
}

export function createDragonEnemy(stage) {
  const spawn = stage.dragon?.spawn ?? { x: stage.room.width / 2, y: stage.room.height / 2 };
  return {
    type: "boss",
    bossKind: "dragon",
    name: "Kingdom Dragon",
    x: spawn.x,
    y: spawn.y,
    spawnX: spawn.x,
    spawnY: spawn.y,
    radius: 72,
    hp: 4200,
    maxHp: 4200,
    speed: 74,
    damage: 34,
    sightRange: Infinity,
    loseRange: Infinity,
    leashRange: Infinity,
    touchCooldown: 0.92,
    attackRange: Infinity,
    attackCooldown: 0,
    specialCooldown: 1.1,
    chargeTime: 0.5,
    chargeSpeed: 4.1,
    frozen: 0,
    slowed: 0,
    alert: true,
    state: "chase",
    stateTimer: 0,
    phase: 0,
    shieldTimer: 0,
    dragonShieldDown: 0,
    supporterTimer: Infinity,
    timeSinceHit: 0,
    regenerating: false,
    spriteAction: "idle",
    color: "#d95757",
    habit: "uses breath, fireballs, charges, and bites; gold bars stun it and break its shield"
  };
}

export function updateEnemies(enemies, players, dt, room, combat) {
  const livePlayers = Array.isArray(players) ? players.filter((player) => player.hp > 0) : [players].filter(Boolean);
  if (livePlayers.length === 0) {
    return;
  }
  const targets = [
    ...livePlayers,
    ...livePlayers.flatMap((player) => player.petTaunts ?? []).filter((taunt) => taunt.timer > 0)
  ];

  for (const enemy of enemies) {
    const player = nearestPlayer(enemy, targets);
    tickEnemyTimers(enemy, dt);
    updateEnemyRegeneration(enemy, dt);
    updateEnemyStatuses(enemy, dt, combat);
    updatePerception(enemy, player);

    if (enemy.frozen <= 0) {
      updateEnemyBrain(enemy, player, dt, room, combat, enemies);
    }

    for (const obstacle of room.obstacles) {
      pushCircleOutOfRect(enemy, obstacle);
    }
    enemy.x = clamp(enemy.x, room.margin + enemy.radius, room.width - room.margin - enemy.radius);
    enemy.y = clamp(enemy.y, room.margin + enemy.radius, room.height - room.margin - enemy.radius);
    enemy.angle = angleTo(enemy, player);

    tryTouchDamage(enemy, player, combat);
  }
}

function nearestPlayer(enemy, players) {
  return players.reduce((best, player) => (distance(enemy, player) < distance(enemy, best) ? player : best), players[0]);
}

function createEnemy(type, stage, x, y) {
  if (type === "boss") {
    const isBroadcaster = stage.number === 5;
    const isElon = stage.number === 10;
    return {
      type: "boss",
      bossKind: isBroadcaster ? "broadcaster" : isElon ? "elon" : "gatebreaker",
      name: isBroadcaster ? "Charlie Kirk, Campus Broadcaster" : isElon ? "Elon Musk, Market Volatility" : `Gatebreaker ${Math.ceil(stage.number / 5)}`,
      x,
      y,
      spawnX: x,
      spawnY: y,
      radius: isBroadcaster ? 42 : isElon ? 44 : 52,
      hp: (isBroadcaster ? 560 : isElon ? 680 : 470) * stage.enemyHpMultiplier,
      maxHp: (isBroadcaster ? 560 : isElon ? 680 : 470) * stage.enemyHpMultiplier,
      speed: isBroadcaster ? 78 : isElon ? 92 : 88,
      damage: (isBroadcaster ? 19 : isElon ? 22 : 23) * stage.enemyDamageMultiplier,
      sightRange: Infinity,
      loseRange: Infinity,
      leashRange: Infinity,
      touchCooldown: 0.8,
      attackRange: Infinity,
      attackCooldown: 0,
      specialCooldown: 1.6,
      frozen: 0,
      slowed: 0,
      alert: true,
      state: "chase",
      stateTimer: 0,
      phase: 0,
      shieldTimer: 0,
      supporterTimer: isBroadcaster ? 4.5 : Infinity,
      marketState: isElon ? "neutral" : null,
      marketTimer: 0,
      marketDamageBoost: false,
      marketDefenseTimer: 0,
      elonDoge: null,
      elonCoins: [],
      elonHazards: [],
      elonSpeedBuff: 0,
      podTimer: 0,
      timeSinceHit: 0,
      regenerating: false,
      spriteAction: "idle",
      color: isBroadcaster ? "#263a74" : isElon ? "#182748" : "#a747d9",
      habit: isBroadcaster ? "uses media-themed attacks and summons supporters" : isElon ? "fires X posts, clears lanes with cars, burns cones, drops Doge, and launches rockets" : "tracks the whole room and alternates bullet patterns"
    };
  }

  const base = enemyKinds[type] ?? enemyKinds.scout;
  return {
    ...base,
    type,
    x,
    y,
    spawnX: x,
    spawnY: y,
    hp: base.hp * stage.enemyHpMultiplier,
    maxHp: base.hp * stage.enemyHpMultiplier,
    damage: base.damage * stage.enemyDamageMultiplier,
    attackCooldown: randomRange(0.1, 0.7),
    specialCooldown: randomRange(0.6, 1.8),
    frozen: 0,
    slowed: 0,
    alert: type === "supporter",
    state: type === "supporter" ? "chase" : "wander",
    stateTimer: 0,
    timeSinceHit: 0,
    regenerating: false,
    wander: newWander(),
    strafeDir: Math.random() < 0.5 ? -1 : 1,
    charge: null
  };
}

function tickEnemyTimers(enemy, dt) {
  enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
  enemy.specialCooldown = Math.max(0, enemy.specialCooldown - dt);
  enemy.frozen = Math.max(0, enemy.frozen - dt);
  enemy.slowed = Math.max(0, (enemy.slowed ?? 0) - dt);
  enemy.shieldTimer = Math.max(0, (enemy.shieldTimer ?? 0) - dt);
  enemy.dragonShieldDown = Math.max(0, (enemy.dragonShieldDown ?? 0) - dt);
  enemy.marketTimer = Math.max(0, (enemy.marketTimer ?? 0) - dt);
  enemy.marketDefenseTimer = Math.max(0, (enemy.marketDefenseTimer ?? 0) - dt);
  enemy.elonSpeedBuff = Math.max(0, (enemy.elonSpeedBuff ?? 0) - dt);
  enemy.podTimer = Math.max(0, (enemy.podTimer ?? 0) - dt);
  enemy.supporterTimer = Math.max(0, (enemy.supporterTimer ?? 0) - dt);
  enemy.stateTimer = Math.max(0, enemy.stateTimer - dt);
  if (enemy.wander) {
    enemy.wander.timer -= dt;
  }
}

function updateEnemyRegeneration(enemy, dt) {
  enemy.timeSinceHit = (enemy.timeSinceHit ?? 0) + dt;
  enemy.regenerating = false;
  if (enemy.hp <= 0 || enemy.hp >= enemy.maxHp || enemy.timeSinceHit < ENEMY_REGEN_DELAY) {
    return;
  }

  enemy.regenerating = true;
  enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * ENEMY_REGEN_RATE * dt);
}

function updateEnemyStatuses(enemy, dt, combat) {
  if (enemy.poisoned?.timer > 0) {
    enemy.poisoned.timer -= dt;
    enemy.hp -= enemy.maxHp * enemy.poisoned.rate * dt;
    enemy.timeSinceHit = 0;
    enemy.regenerating = false;
    if (Math.random() < 0.02) {
      combat.floatText(enemy.x, enemy.y - enemy.radius - 12, "Poison", "#5ec28c");
    }
  }
  if (enemy.bleeding?.timer > 0) {
    enemy.bleeding.timer -= dt;
    enemy.hp -= enemy.maxHp * enemy.bleeding.rate * dt;
    enemy.timeSinceHit = 0;
    enemy.regenerating = false;
    if (Math.random() < 0.02) {
      combat.floatText(enemy.x, enemy.y - enemy.radius - 12, "Bleed", "#d95757");
    }
  }
  if (enemy.burning?.timer > 0) {
    enemy.burning.timer -= dt;
    enemy.hp -= enemy.maxHp * enemy.burning.rate * dt;
    enemy.timeSinceHit = 0;
    enemy.regenerating = false;
    if (Math.random() < 0.03) {
      combat.floatText(enemy.x, enemy.y - enemy.radius - 12, "Burn", "#ef7d57");
    }
  }
}

function updatePerception(enemy, player) {
  const playerDistance = distance(enemy, player);
  const spawnDistance = distance(enemy, { x: enemy.spawnX, y: enemy.spawnY });

  if (!enemy.alert && playerDistance <= enemy.sightRange) {
    enemy.alert = true;
    enemy.state = "chase";
  }

  if (enemy.alert && playerDistance > enemy.loseRange && spawnDistance > enemy.leashRange * 0.45) {
    enemy.alert = false;
    enemy.state = "return";
  }

  if (enemy.alert && spawnDistance > enemy.leashRange && playerDistance > enemy.sightRange * 0.7) {
    enemy.alert = false;
    enemy.state = "return";
  }
}

function updateEnemyBrain(enemy, player, dt, room, combat, enemies) {
  if (enemy.state === "return") {
    moveToward(enemy, { x: enemy.spawnX, y: enemy.spawnY }, dt, speedFor(enemy) * 0.9);
    if (distance(enemy, { x: enemy.spawnX, y: enemy.spawnY }) < 28) {
      enemy.state = "wander";
      enemy.wander = newWander();
    }
    return;
  }

  if (!enemy.alert) {
    updateWander(enemy, dt);
    return;
  }

  if (enemy.bossKind === "elon") {
    updateElonDoge(enemy, player, dt, combat, room);
    updateElonHazards(enemy, player, dt, combat);
    updateElonCoins(enemy, dt, combat);
  }

  if (enemy.state === "windup") {
    if (enemy.stateTimer <= 0) {
      finishWindup(enemy, player, combat, enemies, room);
    }
    return;
  }

  if (enemy.state === "charge") {
    updateCharge(enemy, dt);
    return;
  }

  if (enemy.type === "ranger") {
    updateRanger(enemy, player, dt, combat);
    return;
  }

  if (enemy.type === "brute") {
    updateBrute(enemy, player, dt, combat);
    return;
  }

  if (enemy.type === "bomber") {
    updateBomber(enemy, player, dt, combat);
    return;
  }

  if (enemy.type === "supporter") {
    updateSupporter(enemy, player, dt, combat);
    return;
  }

  if (enemy.type === "duelist") {
    updateDuelist(enemy, player, dt, combat);
    return;
  }

  if (enemy.type === "seer") {
    updateSeer(enemy, player, dt, combat);
    return;
  }

  if (enemy.type === "mender") {
    updateMender(enemy, player, dt, combat, enemies);
    return;
  }

  if (enemy.type === "shade") {
    updateShade(enemy, player, dt, combat);
    return;
  }

  if (enemy.type === "bulwark") {
    updateBulwark(enemy, player, dt, combat);
    return;
  }

  if (enemy.type === "boss") {
    if (enemy.bossKind === "dragon") {
      updateDragonBoss(enemy, player, dt, combat);
      return;
    }
    updateBoss(enemy, player, dt, combat, enemies, room);
    return;
  }

  updateScout(enemy, player, dt);
}

function updateWander(enemy, dt) {
  if (!enemy.wander || enemy.wander.timer <= 0) {
    enemy.wander = newWander();
  }

  const drift = normalize(enemy.spawnX - enemy.x, enemy.spawnY - enemy.y);
  const farFromSpawn = distance(enemy, { x: enemy.spawnX, y: enemy.spawnY }) > enemy.leashRange * 0.35;
  const dir = farFromSpawn ? drift : enemy.wander;
  const speed = enemy.wander.pause ? 0 : enemy.wanderSpeed;
  enemy.x += dir.x * speed * dt;
  enemy.y += dir.y * speed * dt;
}

function updateScout(enemy, player, dt) {
  const base = normalize(player.x - enemy.x, player.y - enemy.y);
  const zigzag = Math.sin(performance.now() / 280 + enemy.spawnX) * 0.34;
  const dir = normalize(base.x - base.y * zigzag, base.y + base.x * zigzag);
  enemy.x += dir.x * speedFor(enemy) * dt;
  enemy.y += dir.y * speedFor(enemy) * dt;
}

function updateRanger(enemy, player, dt, combat) {
  const dist = distance(enemy, player);
  const toPlayer = normalize(player.x - enemy.x, player.y - enemy.y);
  const strafe = { x: -toPlayer.y * enemy.strafeDir, y: toPlayer.x * enemy.strafeDir };
  let move = strafe;

  if (dist < enemy.preferredMin) {
    move = normalize(enemy.x - player.x + strafe.x * 0.5, enemy.y - player.y + strafe.y * 0.5);
  } else if (dist > enemy.preferredMax) {
    move = normalize(player.x - enemy.x + strafe.x * 0.35, player.y - enemy.y + strafe.y * 0.35);
  }

  enemy.x += move.x * speedFor(enemy) * dt;
  enemy.y += move.y * speedFor(enemy) * dt;

  if (enemy.specialCooldown <= 0 && dist <= enemy.attackRange) {
    startWindup(enemy, "shoot", enemy.windupTime, combat, "Aim");
  }

  if (Math.random() < 0.008) {
    enemy.strafeDir *= -1;
  }
}

function updateSupporter(enemy, player, dt, combat) {
  const dist = distance(enemy, player);
  if (dist > 260) {
    moveToward(enemy, player, dt, speedFor(enemy));
  }
  if (enemy.specialCooldown <= 0 && dist <= enemy.attackRange) {
    startWindup(enemy, "supporterPamphlet", enemy.windupTime, combat, "!");
  }
}

function updateBrute(enemy, player, dt, combat) {
  const dist = distance(enemy, player);
  if (enemy.specialCooldown <= 0 && dist <= enemy.chargeRange) {
    startWindup(enemy, "charge", enemy.windupTime, combat, "Charge");
    return;
  }
  moveToward(enemy, player, dt, speedFor(enemy));
}

function updateBomber(enemy, player, dt, combat) {
  const dist = distance(enemy, player);
  if (dist <= enemy.attackRange && enemy.specialCooldown <= 0) {
    startWindup(enemy, "explode", enemy.windupTime, combat, "Boom");
    return;
  }
  moveToward(enemy, player, dt, speedFor(enemy) * 1.12);
}

function updateDuelist(enemy, player, dt, combat) {
  const dist = distance(enemy, player);
  if (enemy.specialCooldown <= 0 && dist <= enemy.chargeRange) {
    startWindup(enemy, "charge", enemy.windupTime, combat, "Lunge");
    return;
  }
  moveToward(enemy, player, dt, speedFor(enemy) * 1.08);
}

function updateSeer(enemy, player, dt, combat) {
  const dist = distance(enemy, player);
  const toPlayer = normalize(player.x - enemy.x, player.y - enemy.y);
  const strafe = { x: -toPlayer.y * enemy.strafeDir, y: toPlayer.x * enemy.strafeDir };
  let move = strafe;

  if (dist < enemy.preferredMin) {
    move = normalize(enemy.x - player.x + strafe.x * 0.65, enemy.y - player.y + strafe.y * 0.65);
  } else if (dist > enemy.preferredMax) {
    move = normalize(player.x - enemy.x + strafe.x * 0.25, player.y - enemy.y + strafe.y * 0.25);
  }

  enemy.x += move.x * speedFor(enemy) * dt;
  enemy.y += move.y * speedFor(enemy) * dt;
  if (enemy.specialCooldown <= 0 && distance(enemy, player) <= enemy.attackRange) {
    startWindup(enemy, "seerBolt", enemy.windupTime, combat, "Hex");
  }
  if (Math.random() < 0.006) {
    enemy.strafeDir *= -1;
  }
}

function updateMender(enemy, player, dt, combat, enemies) {
  const wounded = enemies
    .filter((candidate) => candidate !== enemy && candidate.hp > 0 && candidate.hp < candidate.maxHp && distance(enemy, candidate) < 360)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];

  if (wounded && enemy.specialCooldown <= 0) {
    wounded.hp = Math.min(wounded.maxHp, wounded.hp + wounded.maxHp * 0.16);
    combat.floatText(wounded.x, wounded.y - wounded.radius, "Mended", "#5ec28c");
    enemy.specialCooldown = randomRange(2.4, 3.4);
  }

  const dist = distance(enemy, player);
  if (dist > 340) {
    moveToward(enemy, player, dt, speedFor(enemy) * 0.84);
  }
  if (enemy.attackCooldown <= 0 && dist <= enemy.attackRange) {
    shootAtPlayer(enemy, player, combat, 360, enemy.damage * 0.9, "#5ec28c");
    enemy.attackCooldown = randomRange(1.4, 2.1);
  }
}

function updateShade(enemy, player, dt, combat) {
  const dist = distance(enemy, player);
  if (enemy.specialCooldown <= 0 && dist <= enemy.blinkRange && dist > 130) {
    const angle = angleTo(player, enemy) + randomRange(-0.7, 0.7);
    enemy.x = player.x + Math.cos(angle) * 96;
    enemy.y = player.y + Math.sin(angle) * 96;
    combat.floatText(enemy.x, enemy.y - enemy.radius, "Blink", "#afa89e");
    enemy.specialCooldown = randomRange(2.6, 3.6);
    return;
  }
  moveToward(enemy, player, dt, speedFor(enemy) * 1.1);
}

function updateBulwark(enemy, player, dt, combat) {
  const dist = distance(enemy, player);
  if (enemy.specialCooldown <= 0 && dist <= 300) {
    startWindup(enemy, "bulwarkSlam", enemy.windupTime, combat, "Slam");
    return;
  }
  moveToward(enemy, player, dt, speedFor(enemy) * 0.86);
}

function updateBoss(enemy, player, dt, combat, enemies, room) {
  if (enemy.bossKind === "broadcaster") {
    updateBroadcasterBoss(enemy, player, dt, combat, enemies, room);
    return;
  }
  if (enemy.bossKind === "elon") {
    updateElonBoss(enemy, player, dt, combat, room);
    return;
  }

  const dist = distance(enemy, player);
  if (dist > 220) {
    moveToward(enemy, player, dt, speedFor(enemy));
  }
  if (enemy.specialCooldown <= 0) {
    startWindup(enemy, "bossPattern", enemy.hp < enemy.maxHp * 0.5 ? 0.36 : 0.52, combat, "Cast");
  }
}

function updateBroadcasterBoss(enemy, player, dt, combat, enemies, room) {
  const dist = distance(enemy, player);
  enemy.spriteAction = enemy.shieldTimer > 0 ? "table" : "idle";

  if (dist > 270) {
    moveToward(enemy, player, dt, speedFor(enemy));
    enemy.spriteAction = "walk";
  }

  if (enemy.supporterTimer <= 0) {
    const supporters = enemies.filter((candidate) => candidate.type === "supporter").length;
    if (supporters < 4) {
      const spawn = supportSpawn(room, enemy);
      enemies.push(createEnemy("supporter", { enemyHpMultiplier: 1, enemyDamageMultiplier: 1 }, spawn.x, spawn.y));
      combat.floatText(spawn.x, spawn.y - 28, "Supporter", "#73a9ff");
    }
    enemy.supporterTimer = randomRange(6.5, 8.5);
  }

  if (enemy.specialCooldown <= 0) {
    const cycle = ["micDrop", "table", "phone", "liveStream"];
    const action = cycle[enemy.phase % cycle.length];
    enemy.phase += 1;
    const windup = action === "liveStream" ? 0.72 : action === "table" ? 0.28 : 0.45;
    const label = {
      micDrop: "Mic Drop",
      table: "Campus Table",
      phone: "Barrage",
      liveStream: "LIVE"
    }[action];
    startWindup(enemy, action, windup, combat, label);
  }
}

function startWindup(enemy, nextAction, duration, combat, label) {
  enemy.state = "windup";
  enemy.nextAction = nextAction;
  enemy.stateTimer = duration;
  combat.floatText(enemy.x, enemy.y - enemy.radius, label, "#f2b85b");

  if (enemy.bossKind === "broadcaster" && broadcasterDialogue[nextAction]) {
    combat.speak(enemy, pickLine(broadcasterDialogue[nextAction]), {
      accent: nextAction === "liveStream" ? "#476ac7" : "#d95757",
      duration: nextAction === "liveStream" ? 2.15 : 1.7,
      offsetY: -enemy.radius - 72
    });
  }

  if (enemy.bossKind === "elon" && elonDialogue[nextAction]) {
    combat.speak(enemy, pickLine(elonDialogue[nextAction]), {
      accent: nextAction === "flamethrower" || nextAction === "starship" ? "#ef7d57" : "#73a9ff",
      duration: nextAction === "starship" ? 2.35 : 1.8,
      offsetY: -enemy.radius - 72
    });
  }
}

function finishWindup(enemy, player, combat, enemies = [], room = null) {
  if (enemy.nextAction === "xPost") {
    const direction = player.x >= enemy.x ? 0 : Math.PI;
    for (let i = -2; i <= 2; i += 1) {
      combat.spawnEnemyProjectile({
        x: enemy.x + Math.cos(direction) * 40,
        y: enemy.y + i * 22,
        angle: direction,
        speed: 760 + Math.abs(i) * 35,
        damage: consumeMarketDamage(enemy, enemy.damage * 0.46),
        radius: i === 0 ? 16 : 13,
        color: i === 0 ? "#d8f2ff" : "#43d9ff",
        life: 1.6,
        kind: "xPost",
        labelOnHit: "X-Post"
      });
    }
    enemy.specialCooldown = 0.82;
    enemy.state = "chase";
    return;
  }

  if (enemy.nextAction === "autopilot") {
    const arena = room ?? { width: 2040, height: 1280, margin: 90 };
    const laneSpacing = 150;
    const startY = arena.margin + 82;
    const endY = arena.height - arena.margin - 82;
    let laneIndex = 0;
    for (let y = startY; y <= endY; y += laneSpacing) {
      if (laneIndex % 2 !== enemy.phase % 2) {
        laneIndex += 1;
        continue;
      }
      const fromLeft = laneIndex % 4 !== 1;
      combat.spawnEnemyProjectile({
        x: fromLeft ? arena.margin - 90 : arena.width - arena.margin + 90,
        y,
        angle: fromLeft ? 0 : Math.PI,
        speed: 1240,
        damage: consumeMarketDamage(enemy, enemy.damage * 0.94),
        radius: 32,
        color: "#cfd8df",
        life: (arena.width - arena.margin * 2 + 240) / 1240,
        kind: "tesla",
        labelOnHit: "Traffic"
      });
      laneIndex += 1;
    }
    enemy.specialCooldown = 2.15;
    enemy.state = "chase";
    return;
  }

  if (enemy.nextAction === "flamethrower") {
    const angle = angleTo(enemy, player);
    enemy.elonHazards.push({
      id: `flame-${Math.random().toString(16).slice(2)}`,
      type: "flameCone",
      x: enemy.x,
      y: enemy.y,
      angle,
      radius: 380,
      arc: 1.02,
      timer: 1.75,
      total: 1.75,
      damagePerSecond: enemy.damage * 0.88
    });
    for (let i = 1; i <= 5; i += 1) {
      const spread = (i % 2 === 0 ? -0.22 : 0.22) * Math.ceil(i / 2);
      enemy.elonHazards.push({
        id: `flame-patch-${Math.random().toString(16).slice(2)}`,
        type: "flamePatch",
        x: enemy.x + Math.cos(angle + spread) * (92 + i * 48),
        y: enemy.y + Math.sin(angle + spread) * (92 + i * 48),
        radius: 58,
        timer: 3.1,
        total: 3.1,
        damagePerSecond: enemy.damage * 0.32
      });
    }
    enemy.specialCooldown = 1.7;
    enemy.state = "chase";
    return;
  }

  if (enemy.nextAction === "doge") {
    spawnDoge(enemy, player);
    enemy.specialCooldown = 2.7;
    enemy.state = "chase";
    return;
  }

  if (enemy.nextAction === "starship") {
    enemy.elonHazards.push({
      id: `rocket-${Math.random().toString(16).slice(2)}`,
      type: "rocket",
      x: player.x,
      y: player.y,
      timer: 2.45,
      total: 2.45,
      shockDone: false,
      plumeTick: 0
    });
    enemy.podTimer = 1.65;
    enemy.specialCooldown = 3.35;
    enemy.state = "chase";
    combat.screenShake = Math.max(combat.screenShake, 16);
    return;
  }

  if (enemy.nextAction === "dragonBreath") {
    const baseAngle = angleTo(enemy, player);
    for (let i = -3; i <= 3; i += 1) {
      combat.spawnEnemyProjectile({
        x: enemy.x + Math.cos(baseAngle) * 54,
        y: enemy.y + Math.sin(baseAngle) * 54,
        angle: baseAngle + i * 0.16,
        speed: 420,
        damage: enemy.damage * 0.48,
        radius: 15,
        color: "#ef7d57",
        life: 1.05,
        labelOnHit: "Burned"
      });
    }
    enemy.specialCooldown = 1.6;
    enemy.state = "chase";
    return;
  }

  if (enemy.nextAction === "dragonFireball") {
    const baseAngle = angleTo(enemy, player);
    for (let i = -1; i <= 1; i += 1) {
      combat.spawnEnemyProjectile({
        x: enemy.x,
        y: enemy.y,
        angle: baseAngle + i * 0.14,
        speed: 330,
        damage: enemy.damage * 0.72,
        radius: 20,
        color: "#f2b85b",
        homing: true,
        life: 1.75,
        labelOnHit: "Fireball"
      });
    }
    enemy.specialCooldown = 2.1;
    enemy.state = "chase";
    return;
  }

  if (enemy.nextAction === "dragonBite") {
    const hit = distance(enemy, player) <= enemy.radius + player.radius + 34 && player.takeDamage(enemy.damage * 1.45);
    if (hit) {
      combat.floatText(player.x, player.y - 46, `-${Math.round(enemy.damage * 1.45)}`, "#d95757");
      combat.screenShake = Math.max(combat.screenShake, 10);
    }
    enemy.specialCooldown = 1.2;
    enemy.state = "chase";
    return;
  }

  if (enemy.nextAction === "supporterPamphlet") {
    combat.spawnEnemyProjectile({
      x: enemy.x,
      y: enemy.y,
      angle: angleTo(enemy, player),
      speed: 430,
      damage: enemy.damage,
      radius: 7,
      color: "#f6f1e8",
      life: 1.0,
      labelOnHit: "Pamphlet"
    });
    enemy.specialCooldown = randomRange(1.3, 2.1);
    enemy.state = "chase";
    return;
  }

  if (enemy.nextAction === "micDrop") {
    enemy.spriteAction = "micDrop";
    const baseAngle = angleTo(enemy, player);
    for (let i = -1; i <= 1; i += 1) {
      combat.spawnEnemyProjectile({
        x: enemy.x,
        y: enemy.y,
        angle: baseAngle + i * 0.08,
        speed: 680,
        damage: enemy.damage * 0.42,
        radius: 14,
        color: "#f6f1e8",
        life: 0.75,
        labelOnHit: "!!!"
      });
    }
    enemy.specialCooldown = 1.45;
    enemy.state = "chase";
    return;
  }

  if (enemy.nextAction === "table") {
    enemy.spriteAction = "table";
    enemy.shieldTimer = 2.8;
    enemy.specialCooldown = 1.4;
    enemy.state = "chase";
    combat.floatText(enemy.x, enemy.y - enemy.radius, "Shield up", "#f6f1e8");
    return;
  }

  if (enemy.nextAction === "phone") {
    enemy.spriteAction = "phone";
    const baseAngle = angleTo(enemy, player);
    for (let i = 0; i < 9; i += 1) {
      combat.spawnEnemyProjectile({
        x: enemy.x + Math.cos(baseAngle) * 28,
        y: enemy.y + Math.sin(baseAngle) * 28,
        angle: baseAngle + (i - 4) * 0.12,
        speed: 400 + i * 22,
        damage: enemy.damage * 0.34,
        radius: 9,
        color: i % 3 === 0 ? "#73a9ff" : i % 3 === 1 ? "#f6f1e8" : "#d95757",
        slow: 1.35,
        homing: true,
        life: 1.4,
        labelOnHit: "Overwhelmed"
      });
    }
    enemy.specialCooldown = 1.9;
    enemy.state = "chase";
    return;
  }

  if (enemy.nextAction === "liveStream") {
    enemy.spriteAction = "liveStream";
    combat.screenShake = Math.max(combat.screenShake, 18);
    enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * 0.04);
    for (const ally of enemies) {
      if (ally.type === "supporter" && ally.hp > 0) {
        ally.hp = Math.min(ally.maxHp, ally.hp + ally.maxHp * 0.25);
      }
    }
    combat.floatText(enemy.x, enemy.y - enemy.radius, "The Live Stream", "#f2b85b");
    for (let i = 0; i < 16; i += 1) {
      combat.spawnEnemyProjectile({
        x: enemy.x,
        y: enemy.y,
        angle: (Math.PI * 2 * i) / 16,
        speed: 360,
        damage: enemy.damage * 0.36,
        radius: 10,
        color: i % 3 === 0 ? "#d95757" : i % 3 === 1 ? "#f6f1e8" : "#476ac7",
        slow: 1.4,
        life: 1.2,
        labelOnHit: "ON AIR!"
      });
    }
    enemy.specialCooldown = 3.6;
    enemy.state = "chase";
    return;
  }

  if (enemy.nextAction === "shoot") {
    shootAtPlayer(enemy, player, combat, 450, enemy.damage * 1.15, "#73a9ff");
    enemy.specialCooldown = randomRange(1.1, 1.7);
    enemy.state = "chase";
    return;
  }

  if (enemy.nextAction === "seerBolt") {
    const baseAngle = angleTo(enemy, player);
    for (let i = -1; i <= 1; i += 1) {
      combat.spawnEnemyProjectile({
        x: enemy.x,
        y: enemy.y,
        angle: baseAngle + i * 0.2,
        speed: 330,
        damage: enemy.damage,
        radius: 8,
        color: "#a747d9",
        homing: true,
        slow: 1.1,
        life: 1.55,
        labelOnHit: "Hexed"
      });
    }
    enemy.specialCooldown = randomRange(1.7, 2.4);
    enemy.state = "chase";
    return;
  }

  if (enemy.nextAction === "bulwarkSlam") {
    for (let i = 0; i < 10; i += 1) {
      combat.spawnEnemyProjectile({
        x: enemy.x,
        y: enemy.y,
        angle: (Math.PI * 2 * i) / 10,
        speed: 260,
        damage: enemy.damage * 0.54,
        radius: 10,
        color: "#b56b34",
        life: 0.85
      });
    }
    combat.screenShake = Math.max(combat.screenShake, 8);
    enemy.specialCooldown = randomRange(2.6, 3.4);
    enemy.state = "chase";
    return;
  }

  if (enemy.nextAction === "charge") {
    const dir = normalize(player.x - enemy.x, player.y - enemy.y);
    enemy.charge = { x: dir.x, y: dir.y, time: enemy.chargeTime };
    enemy.state = "charge";
    enemy.specialCooldown = randomRange(2.2, 3.2);
    return;
  }

  if (enemy.nextAction === "explode") {
    const hit = distance(enemy, player) <= enemy.attackRange + player.radius && player.takeDamage(enemy.damage * 1.3);
    if (hit) {
      combat.floatText(player.x, player.y - 46, `-${Math.round(enemy.damage * 1.3)}`, "#f2b85b");
    }
    combat.floatText(enemy.x, enemy.y - enemy.radius, "Boom", "#f2b85b");
    enemy.hp = 0;
    combat.screenShake = Math.max(combat.screenShake, 10);
    return;
  }

  if (enemy.nextAction === "bossPattern") {
    bossPattern(enemy, player, combat);
    enemy.specialCooldown = enemy.hp < enemy.maxHp * 0.5 ? randomRange(1.5, 2) : randomRange(2.1, 2.8);
    enemy.state = "chase";
  }
}

function updateDragonBoss(enemy, player, dt, combat) {
  const dist = distance(enemy, player);
  if (dist > 210) {
    moveToward(enemy, player, dt, speedFor(enemy));
  }

  if (enemy.specialCooldown > 0) {
    return;
  }

  const cycle = ["dragonBreath", "dragonFireball", "charge", "dragonBite"];
  const action = cycle[enemy.phase % cycle.length];
  enemy.phase += 1;
  const label = {
    dragonBreath: "Dragon Breath",
    dragonFireball: "Fireball",
    charge: "Charge",
    dragonBite: "Bite"
  }[action];
  const windup = action === "charge" ? 0.44 : action === "dragonBite" ? 0.24 : 0.52;
  startWindup(enemy, action, windup, combat, label);
}

function updateElonBoss(enemy, player, dt, combat, room) {
  const dist = distance(enemy, player);
  if (dist > 280 && enemy.podTimer <= 0) {
    moveToward(enemy, player, dt, speedFor(enemy));
  }

  if (enemy.specialCooldown > 0 || enemy.podTimer > 0) {
    return;
  }

  const cycle = ["xPost", "autopilot", "flamethrower", "doge", "xPost", "starship"];
  const action = cycle[enemy.phase % cycle.length];
  enemy.phase += 1;
  fluctuateMarket(enemy, combat);
  const label = {
    xPost: "X-Post Projectile",
    autopilot: "Autopilot Stampede",
    flamethrower: "Not-A-Flamethrower",
    doge: "To The Moon",
    starship: "Starship Launch"
  }[action];
  const windup = action === "starship" ? 0.95 : action === "autopilot" ? 0.72 : action === "flamethrower" ? 0.48 : 0.36;
  startWindup(enemy, action, windup, combat, label);
}

function fluctuateMarket(enemy, combat) {
  if (Math.random() < 0.5) {
    enemy.marketState = "green";
    enemy.marketDamageBoost = true;
    enemy.marketTimer = 3.2;
    combat.floatText(enemy.x, enemy.y - enemy.radius - 38, "Ticker green: +15% next attack", "#5ec28c");
    return;
  }
  enemy.marketState = "red";
  enemy.marketDefenseTimer = 3.2;
  enemy.marketTimer = 3.2;
  combat.floatText(enemy.x, enemy.y - enemy.radius - 38, "Ticker red: defense up", "#d95757");
}

function consumeMarketDamage(enemy, damage) {
  if (!enemy.marketDamageBoost) {
    return damage;
  }
  enemy.marketDamageBoost = false;
  return damage * 1.15;
}

function spawnDoge(enemy, player) {
  const angle = angleTo(enemy, player) + randomRange(-0.35, 0.35);
  enemy.elonDoge = {
    x: enemy.x,
    y: Math.max(130, enemy.y - 220),
    vx: Math.cos(angle) * 640,
    vy: Math.sin(angle) * 640,
    radius: 46,
    timer: 6.4,
    hitCooldown: 0
  };
}

function updateElonDoge(enemy, player, dt, combat, room) {
  const doge = enemy.elonDoge;
  if (!doge) {
    return;
  }
  doge.timer -= dt;
  doge.hitCooldown = Math.max(0, doge.hitCooldown - dt);
  doge.x += doge.vx * dt;
  doge.y += doge.vy * dt;
  if (doge.x < room.margin + doge.radius || doge.x > room.width - room.margin - doge.radius) {
    doge.vx *= -1;
    doge.x = clamp(doge.x, room.margin + doge.radius, room.width - room.margin - doge.radius);
    scatterElonCoins(enemy, doge.x, doge.y, 3);
  }
  if (doge.y < room.margin + doge.radius || doge.y > room.height - room.margin - doge.radius) {
    doge.vy *= -1;
    doge.y = clamp(doge.y, room.margin + doge.radius, room.height - room.margin - doge.radius);
    scatterElonCoins(enemy, doge.x, doge.y, 3);
  }
  if (doge.hitCooldown <= 0 && distance(doge, player) <= doge.radius + player.radius) {
    const hit = player.takeDamage(enemy.damage * 0.82);
    doge.hitCooldown = 0.55;
    scatterElonCoins(enemy, doge.x, doge.y, 9);
    if (hit) {
      combat.floatText(player.x, player.y - 46, "Doge!", "#f2b85b");
      combat.screenShake = Math.max(combat.screenShake, 8);
    }
  }
  if (doge.timer <= 0) {
    enemy.elonDoge = null;
  }
}

function scatterElonCoins(enemy, x, y, count = 7) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + randomRange(-0.18, 0.18);
    enemy.elonCoins.push({
      x: x + Math.cos(angle) * randomRange(28, 88),
      y: y + Math.sin(angle) * randomRange(28, 88),
      radius: 14,
      timer: 5.8,
      magnetDelay: 0.7,
      bob: Math.random() * Math.PI * 2
    });
  }
}

function updateElonCoins(enemy, dt, combat) {
  for (const coin of enemy.elonCoins) {
    coin.timer -= dt;
    coin.magnetDelay = Math.max(0, (coin.magnetDelay ?? 0) - dt);
    coin.bob += dt * 5;
    if (coin.magnetDelay <= 0) {
      const dir = normalize(enemy.x - coin.x, enemy.y - coin.y);
      coin.x += dir.x * 230 * dt;
      coin.y += dir.y * 230 * dt;
    }
    if (distance(enemy, coin) <= enemy.radius + coin.radius + 16) {
      coin.timer = 0;
      enemy.elonSpeedBuff = Math.max(enemy.elonSpeedBuff ?? 0, 3.1);
      combat.floatText(enemy.x, enemy.y - enemy.radius - 32, "Coin rush", "#f2b85b");
    }
  }
  enemy.elonCoins = enemy.elonCoins.filter((coin) => coin.timer > 0);
}

function updateElonHazards(enemy, player, dt, combat) {
  for (const hazard of enemy.elonHazards) {
    hazard.timer -= dt;
    if (hazard.type === "flameCone") {
      if (pointInCone(hazard, player)) {
        const hit = player.takeDamage(hazard.damagePerSecond * dt);
        if (hit && Math.random() < 0.08) {
          combat.floatText(player.x, player.y - 46, "Burn", "#ef7d57");
        }
      }
      continue;
    }
    if (hazard.type === "flamePatch") {
      if (distance(hazard, player) <= hazard.radius + player.radius) {
        const hit = player.takeDamage(hazard.damagePerSecond * dt);
        if (hit && Math.random() < 0.06) {
          combat.floatText(player.x, player.y - 46, "Scorched", "#ef7d57");
        }
      }
      continue;
    }
    if (hazard.type === "rocket") {
      const elapsed = hazard.total - hazard.timer;
      if (!hazard.shockDone && elapsed >= 0.72) {
        hazard.shockDone = true;
        if (distance(hazard, player) <= 940 + player.radius) {
          const hit = player.takeDamage(enemy.damage * 1.16);
          if (hit) {
            combat.floatText(player.x, player.y - 46, "Shockwave", "#f2b85b");
          }
        }
        combat.screenShake = Math.max(combat.screenShake, 24);
      }
      hazard.plumeTick -= dt;
      if (elapsed >= 0.95 && hazard.plumeTick <= 0) {
        hazard.plumeTick = 0.14;
        if (distance(hazard, player) <= 265 + player.radius) {
          const hit = player.takeDamage(enemy.damage * 0.4);
          if (hit) {
            combat.floatText(player.x, player.y - 46, "Rocket fire", "#ef7d57");
          }
        }
      }
    }
  }
  enemy.elonHazards = enemy.elonHazards.filter((hazard) => hazard.timer > 0);
}

function pointInCone(cone, target) {
  const dist = distance(cone, target);
  if (dist > cone.radius + target.radius) {
    return false;
  }
  const toTarget = angleTo(cone, target);
  const delta = Math.atan2(Math.sin(toTarget - cone.angle), Math.cos(toTarget - cone.angle));
  return Math.abs(delta) <= cone.arc / 2;
}

function updateCharge(enemy, dt) {
  enemy.x += enemy.charge.x * speedFor(enemy) * enemy.chargeSpeed * dt;
  enemy.y += enemy.charge.y * speedFor(enemy) * enemy.chargeSpeed * dt;
  enemy.charge.time -= dt;
  if (enemy.charge.time <= 0) {
    enemy.charge = null;
    enemy.state = "chase";
  }
}

function tryTouchDamage(enemy, player, combat) {
  const hitDistance = enemy.radius + player.radius + 4;
  if (distance(enemy, player) > hitDistance || enemy.attackCooldown > 0) {
    return;
  }

  const hit = player.takeDamage(enemy.damage);
  enemy.attackCooldown = enemy.touchCooldown;
  if (hit) {
    combat.floatText(player.x, player.y - 46, `-${Math.round(enemy.damage)}`, "#d95757");
    combat.screenShake = Math.max(combat.screenShake, 7);
  }
}

function bossPattern(enemy, player, combat) {
  enemy.phase += 1;
  if (enemy.phase % 2 === 0) {
    const baseAngle = angleTo(enemy, player);
    for (let i = -2; i <= 2; i += 1) {
      combat.spawnEnemyProjectile({
        x: enemy.x,
        y: enemy.y,
        angle: baseAngle + i * 0.18,
        speed: 430,
        damage: enemy.damage * 0.75,
        radius: 11,
        color: "#a747d9"
      });
    }
    return;
  }

  for (let i = 0; i < 12; i += 1) {
    combat.spawnEnemyProjectile({
      x: enemy.x,
      y: enemy.y,
      angle: (Math.PI * 2 * i) / 12,
      speed: 330,
      damage: enemy.damage * 0.55,
      radius: 10,
      color: "#f2b85b"
    });
  }
}

function supportSpawn(room, boss) {
  const angle = randomRange(0, Math.PI * 2);
  const radius = randomRange(180, 280);
  return {
    x: clamp(boss.x + Math.cos(angle) * radius, room.margin + 50, room.width - room.margin - 50),
    y: clamp(boss.y + Math.sin(angle) * radius, room.margin + 50, room.height - room.margin - 50)
  };
}

function shootAtPlayer(enemy, player, combat, speed, damage, color) {
  combat.spawnEnemyProjectile({
    x: enemy.x + Math.cos(enemy.angle || angleTo(enemy, player)) * enemy.radius,
    y: enemy.y + Math.sin(enemy.angle || angleTo(enemy, player)) * enemy.radius,
    angle: angleTo(enemy, player),
    speed,
    damage,
    radius: 8,
    color
  });
}

function speedFor(enemy) {
  return enemy.speed * (enemy.slowed > 0 ? 0.55 : 1) * (enemy.elonSpeedBuff > 0 ? 1.45 : 1);
}

function moveToward(enemy, target, dt, speed) {
  const dir = normalize(target.x - enemy.x, target.y - enemy.y);
  enemy.x += dir.x * speed * dt;
  enemy.y += dir.y * speed * dt;
}

function newWander() {
  const angle = randomRange(0, Math.PI * 2);
  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
    timer: randomRange(0.7, 1.8),
    pause: Math.random() < 0.28
  };
}

function pickLine(lines) {
  return lines[Math.floor(Math.random() * lines.length)];
}

function randomSpawn(room) {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const spawn = {
      x: randomRange(room.margin + 40, room.width - room.margin - 40),
      y: randomRange(room.margin + 40, room.height - room.margin - 40),
      radius: 34
    };
    const nearCenter = Math.abs(spawn.x - room.width / 2) < 260 && Math.abs(spawn.y - room.height / 2) < 200;
    const blocked = room.obstacles.some((obstacle) => spawn.x > obstacle.x - 60 && spawn.x < obstacle.x + obstacle.w + 60 && spawn.y > obstacle.y - 60 && spawn.y < obstacle.y + obstacle.h + 60);
    if (!nearCenter && !blocked) {
      return spawn;
    }
  }
  return { x: room.margin + 120, y: room.margin + 120 };
}
