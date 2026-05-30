export const mannequinCharacter = {
  id: "mannequin",
  name: "Blank Mannequin",
  classId: "mannequin",
  role: "Mannequin",
  color: "#f6f1e8",
  accent: "#afa89e",
  maxHp: 100,
  baseDamage: 10,
  speed: 252,
  dashSpeed: 690,
  dashCooldown: 1.25,
  abilityId: null,
  fixedWeapon: "sparkPistol",
  evolutionSeeds: [],
  bio: "A blank training body waiting for a class."
};

export const characters = [
  {
    id: "swordsman",
    name: "Riven Guard",
    classId: "swordsman",
    role: "Swordsman",
    color: "#d95757",
    accent: "#f2b85b",
    maxHp: 130,
    baseDamage: 28,
    speed: 245,
    dashSpeed: 720,
    dashCooldown: 1.35,
    abilityId: "whirlwindSmash",
    fixedWeapon: "ironSaber",
    evolutionSeeds: [
      "Storm Vanguard",
      "Crimson Breaker"
    ],
    bio: "A close-range fighter built to dive into rooms, group enemies, and finish them with heavy melee pressure."
  },
  {
    id: "archer",
    name: "Mira Thorn",
    classId: "archer",
    role: "Archer",
    color: "#5ec28c",
    accent: "#73a9ff",
    maxHp: 105,
    baseDamage: 22,
    speed: 275,
    dashSpeed: 760,
    dashCooldown: 1.15,
    abilityId: "giantNet",
    fixedWeapon: "elmLongbow",
    evolutionSeeds: [
      "Moon Snarer",
      "Falcon Warden"
    ],
    bio: "A mobile controller who keeps distance, traps enemy clusters, and wins by positioning."
  }
];

export function getCharacter(id) {
  if (id === mannequinCharacter.id) {
    return mannequinCharacter;
  }
  return characters.find((character) => character.id === id) ?? characters[0];
}
