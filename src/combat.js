import { angleTo, circleHit, distance, normalize, rectCircleHit } from "./utils/math.js";

export class CombatSystem {
  constructor() {
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.slashes = [];
    this.nets = [];
    this.icePatches = [];
    this.floaters = [];
    this.speechBubbles = [];
    this.screenShake = 0;
  }

  reset() {
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.slashes = [];
    this.nets = [];
    this.icePatches = [];
    this.floaters = [];
    this.speechBubbles = [];
    this.screenShake = 0;
  }

  spawnProjectile(projectile) {
    this.projectiles.push(projectile);
  }

  spawnEnemyProjectile(projectile) {
    this.enemyProjectiles.push({
      radius: 9,
      color: "#d95757",
      life: 1.4,
      ...projectile,
      faction: "enemy"
    });
  }

  spawnSlash(slash) {
    slash.hit = new Set();
    slash.totalLife = slash.life;
    this.slashes.push(slash);
  }

  spawnNet(net) {
    this.nets.push({ ...net, life: 1.1, sprung: false, caught: new Set() });
  }

  spawnIcePatch(patch) {
    this.icePatches.push(patch);
  }

  floatText(x, y, text, color = "#f6f1e8") {
    this.floaters.push({ x, y, text, color, life: 0.85, total: 0.85 });
  }

  speak(target, text, options = {}) {
    this.speechBubbles.push({
      target,
      text,
      color: options.color ?? "#f6f1e8",
      accent: options.accent ?? "#d95757",
      offsetY: options.offsetY ?? -86,
      life: options.duration ?? 1.8,
      total: options.duration ?? 1.8
    });
  }

  update(dt, enemies, players, room) {
    const livePlayers = Array.isArray(players) ? players.filter((player) => player.hp > 0) : [players].filter(Boolean);
    this.screenShake = Math.max(0, this.screenShake - dt * 28);
    this.updateProjectiles(dt, enemies, room);
    this.updateEnemyProjectiles(dt, livePlayers, room);
    this.updateSlashes(dt, enemies);
    this.updateNets(dt, enemies, room);
    this.updateIcePatches(dt, enemies);

    for (const floater of this.floaters) {
      floater.life -= dt;
      floater.y -= dt * 34;
    }
    this.floaters = this.floaters.filter((floater) => floater.life > 0);

    for (const bubble of this.speechBubbles) {
      bubble.life -= dt;
    }
    this.speechBubbles = this.speechBubbles.filter((bubble) => bubble.life > 0 && (!bubble.target || bubble.target.hp === undefined || bubble.target.hp > 0));
  }

  updateProjectiles(dt, enemies, room) {
    for (const projectile of this.projectiles) {
      projectile.life -= dt;
      projectile.x += Math.cos(projectile.angle) * projectile.speed * dt;
      projectile.y += Math.sin(projectile.angle) * projectile.speed * dt;

      for (const enemy of enemies) {
        if (enemy.hp > 0 && circleHit(projectile, enemy)) {
          this.hitEnemy(enemy, projectile.damage, projectile, 110);
          if (projectile.slow) {
            enemy.slowed = Math.max(enemy.slowed ?? 0, projectile.slow);
          }
          this.floatText(enemy.x, enemy.y - enemy.radius, Math.round(projectile.damage).toString(), projectile.color);
          projectile.life = 0;
          this.spawnProjectileEndPatch(projectile);
          break;
        }
      }

      if (projectile.x < room.margin || projectile.x > room.width - room.margin || projectile.y < room.margin || projectile.y > room.height - room.margin) {
        projectile.life = 0;
        this.spawnProjectileEndPatch(projectile);
      }
      for (const obstacle of room.obstacles) {
        if (rectCircleHit(obstacle, projectile)) {
          projectile.life = 0;
          this.spawnProjectileEndPatch(projectile);
        }
      }
      if (projectile.life <= 0) {
        this.spawnProjectileEndPatch(projectile);
      }
    }
    this.projectiles = this.projectiles.filter((projectile) => projectile.life > 0);
  }

  spawnProjectileEndPatch(projectile) {
    if (!projectile.icePatchOnEnd || projectile.patchSpawned) {
      return;
    }
    projectile.patchSpawned = true;
    this.spawnIcePatch({
      x: projectile.x,
      y: projectile.y,
      ...projectile.icePatchOnEnd
    });
  }

  updateEnemyProjectiles(dt, players, room) {
    for (const projectile of this.enemyProjectiles) {
      projectile.life -= dt;
      if (projectile.homing) {
        const target = nearestTarget(projectile, players);
        if (target) {
          const desired = angleTo(projectile, target);
          const delta = Math.atan2(Math.sin(desired - projectile.angle), Math.cos(desired - projectile.angle));
          projectile.angle += Math.max(-2.2 * dt, Math.min(2.2 * dt, delta));
        }
      }
      projectile.x += Math.cos(projectile.angle) * projectile.speed * dt;
      projectile.y += Math.sin(projectile.angle) * projectile.speed * dt;

      const player = players.find((candidate) => circleHit(projectile, candidate));
      if (player) {
        const hit = player.takeDamage(projectile.damage);
        projectile.life = 0;
        if (hit) {
          if (projectile.slow) {
            player.slowed = Math.max(player.slowed ?? 0, projectile.slow);
          }
          this.floatText(player.x, player.y - 46, projectile.labelOnHit ?? `-${Math.round(projectile.damage)}`, projectile.color);
          this.screenShake = Math.max(this.screenShake, 6);
        }
      }

      if (projectile.x < room.margin || projectile.x > room.width - room.margin || projectile.y < room.margin || projectile.y > room.height - room.margin) {
        projectile.life = 0;
      }
      for (const obstacle of room.obstacles) {
        if (rectCircleHit(obstacle, projectile)) {
          projectile.life = 0;
        }
      }
    }
    this.enemyProjectiles = this.enemyProjectiles.filter((projectile) => projectile.life > 0);
  }

  updateSlashes(dt, enemies) {
    for (const slash of this.slashes) {
      slash.life -= dt;
      for (const enemy of enemies) {
        if (enemy.hp <= 0 || slash.hit.has(enemy)) {
          continue;
        }
        const dist = distance(slash, enemy);
        const toEnemy = angleTo(slash, enemy);
        const delta = Math.atan2(Math.sin(toEnemy - slash.angle), Math.cos(toEnemy - slash.angle));
        const withinSwing = slash.hitAllInRange || Math.abs(delta) <= slash.arc / 2;
        if (dist <= slash.radius + enemy.radius && withinSwing) {
          slash.hit.add(enemy);
          this.hitEnemy(enemy, slash.damage, slash, slash.knockback);
          this.floatText(enemy.x, enemy.y - enemy.radius, Math.round(slash.damage).toString(), slash.hitTextColor ?? (slash.classBonus ? "#f2b85b" : "#f6f1e8"));
        }
      }
    }
    this.slashes = this.slashes.filter((slash) => slash.life > 0);
  }

  updateNets(dt, enemies, room) {
    for (const net of this.nets) {
      net.life -= dt;
      if (!net.sprung) {
        net.x += Math.cos(net.angle) * net.speed * dt;
        net.y += Math.sin(net.angle) * net.speed * dt;
        for (const enemy of enemies) {
          if (enemy.hp > 0 && circleHit(net, enemy)) {
            this.springNet(net, enemies);
            break;
          }
        }
        if (net.x < room.margin || net.x > room.width - room.margin || net.y < room.margin || net.y > room.height - room.margin) {
          this.springNet(net, enemies);
        }
      } else {
        for (const enemy of enemies) {
          if (enemy.hp > 0 && distance(net, enemy) <= net.netRadius + enemy.radius && !net.caught.has(enemy)) {
            net.caught.add(enemy);
            enemy.frozen = Math.max(enemy.frozen, net.netDuration);
            this.hitEnemy(enemy, net.damage, net, 60);
            this.floatText(enemy.x, enemy.y - enemy.radius, "Caught", net.color);
            if (net.thornBurst) {
              this.hitEnemy(enemy, net.damage * 0.75, net, 90);
              this.floatText(enemy.x, enemy.y - enemy.radius - 18, "Thorns", "#5ec28c");
            }
          }
        }
      }
    }
    this.nets = this.nets.filter((net) => net.life > 0);
  }

  springNet(net, enemies) {
    net.sprung = true;
    net.life = net.netDuration;
    for (const enemy of enemies) {
      if (enemy.hp > 0 && distance(net, enemy) <= net.netRadius + enemy.radius) {
        net.caught.add(enemy);
        enemy.frozen = Math.max(enemy.frozen, net.netDuration);
        this.hitEnemy(enemy, net.damage, net, 60);
        this.floatText(enemy.x, enemy.y - enemy.radius, "Caught", net.color);
        if (net.thornBurst) {
          this.hitEnemy(enemy, net.damage * 0.75, net, 90);
          this.floatText(enemy.x, enemy.y - enemy.radius - 18, "Thorns", "#5ec28c");
        }
      }
    }
  }

  updateIcePatches(dt, enemies) {
    for (const patch of this.icePatches) {
      patch.life -= dt;
      for (const enemy of enemies) {
        if (enemy.hp > 0 && distance(patch, enemy) <= patch.radius + enemy.radius) {
          enemy.slowed = Math.max(enemy.slowed ?? 0, patch.slow);
        }
      }
    }
    this.icePatches = this.icePatches.filter((patch) => patch.life > 0);
  }

  pullEnemies(player, radius, strength, dt) {
    for (const enemy of player.game.enemies) {
      if (enemy.hp <= 0 || distance(player, enemy) > radius) {
        continue;
      }
      const dir = normalize(player.x - enemy.x, player.y - enemy.y);
      enemy.x += dir.x * strength * dt;
      enemy.y += dir.y * strength * dt;
    }
  }

  areaDamage(player, radius, damage, knockback) {
    for (const enemy of player.game.enemies) {
      if (enemy.hp <= 0 || distance(player, enemy) > radius + enemy.radius) {
        continue;
      }
      this.hitEnemy(enemy, damage, player, knockback);
      this.floatText(enemy.x, enemy.y - enemy.radius, Math.round(damage).toString(), "#f2b85b");
    }
    this.floatText(player.x, player.y - 58, "Smash!", "#f2b85b");
  }

  hitEnemy(enemy, damage, source, knockback = 0) {
    if (enemy.shieldTimer > 0) {
      damageEnemy(enemy, damage * 0.18, source, knockback * 0.25);
      this.floatText(enemy.x, enemy.y - enemy.radius, "Counter-Argument", "#f6f1e8");
      const target = source.owner ?? source;
      if (target?.x !== undefined) {
        this.spawnEnemyProjectile({
          x: enemy.x,
          y: enemy.y,
          angle: angleTo(enemy, target),
          speed: 520,
          damage: Math.max(4, damage * 0.32),
          radius: 8,
          color: "#f6f1e8",
          life: 0.9,
          labelOnHit: "Pamphlets!"
        });
      }
      return;
    }
    damageEnemy(enemy, damage, source, knockback);
  }
}

function nearestTarget(source, targets) {
  if (!targets || targets.length === 0) {
    return null;
  }
  return targets.reduce((best, target) => (distance(source, target) < distance(source, best) ? target : best), targets[0]);
}

function damageEnemy(enemy, damage, source, knockback = 0) {
  enemy.hp -= damage;
  if (knockback > 0) {
    const dir = normalize(enemy.x - source.x, enemy.y - source.y);
    enemy.x += dir.x * knockback * 0.08;
    enemy.y += dir.y * knockback * 0.08;
  }
}
