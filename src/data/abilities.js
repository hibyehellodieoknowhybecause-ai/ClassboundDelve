export const abilities = {
  whirlwindSmash: {
    id: "whirlwindSmash",
    name: "Whirlwind Smash",
    requiredClass: "swordsman",
    cooldown: 13,
    duration: 1.15,
    pullRadius: 260,
    pullStrength: 620,
    smashRadius: 150,
    smashDamage: 76,
    description: "Pull nearby enemies inward, then slam the ground for heavy damage."
  },
  giantNet: {
    id: "giantNet",
    name: "Giant Net",
    requiredClass: "archer",
    cooldown: 10,
    projectileSpeed: 620,
    projectileRadius: 18,
    netRadius: 140,
    netDuration: 3.1,
    netDamage: 34,
    description: "Fire a huge net that catches enemies and holds them in place."
  }
};
