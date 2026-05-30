# Classbound Delve

A desktop browser prototype inspired by room-based action roguelites.

## Run

From this folder:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

## Current Slice

- Two playable characters:
  - Riven Guard, a swordsman with Whirlwind Smash.
  - Mira Thorn, an archer with Giant Net.
- Home screen supports 1-player or same-computer 2-player co-op.
- Co-op gives Player 1 the selected class and Player 2 the other class.
- Attacks are auto-aim only:
  - Player 1 auto-aim attack: `R`
  - Player 2 auto-aim attack: `/`
- Each class has a fixed weapon:
  - Swordsman uses Iron Saber.
  - Archer uses Elm Longbow.
  - The hidden Mysterious Nuke secret still overrides the class weapon when unlocked.
- Base attack damage now lives on the character instead of the basic weapon.
- Basic class weapons provide attack shape only and no damage bonus.
- Boss blueprint drops now provide the framework for future weapon and hero ascension systems.
- RPG roguelite layer:
  - Randomized room sizes, themes, and obstacle layouts.
  - Exactly one reward chest appears after every room clear.
  - Enemies drop coins.
  - Enemy HP, damage, and room counts now jump more sharply after each defeated boss.
  - New enemy families enter the room pool after boss clears:
    - Boss 1 unlocks Ember Duelists.
    - Boss 2 unlocks Rift Seers.
    - Boss 3 unlocks Cinder Menders.
    - Boss 4 unlocks Moon Shades.
    - Boss 5 unlocks Vault Bulwarks.
  - A Classbound Shop also appears on the second and fourth floor of each boss cycle: stages 2, 4, 7, 9, and so on.
  - Shops carry 1-3 paid items, stay in the room after browsing, and only remove an offer when it is bought.
  - Shop health pots cost 30 coins and heal 25% max HP.
  - The first boss drops one weapon upgrade blueprint pickup per player.
  - Weapon blueprints have class-specific completion requirements:
    - Swordsman Saber Temper: 6 Weapon Ore, 1 Tempered Core, and 450 coins.
    - Archer Moonstring: 4 Weapon Ore, 2 Tempered Cores, and 520 coins.
  - Later bosses drop weapon blueprint progress material pickups for players who have claimed an unfinished weapon blueprint.
  - The second boss drops the hero ascension blueprint.
  - Weapon materials can appear in shops and as 1% enemy pickup drops only after their blueprint has been discovered.
  - Chests have rarity colors: common, uncommon, rare, and legendary.
  - Higher rarity chests have better odds for rare/legendary rewards.
  - Bosses drop higher rarity chests.
  - Enemies have a 5% chance to drop a health pot.
  - Press `F` near a chest to open three gacha reward choices.
  - Press `F` near a shop to browse paid stock, then press interact or `Esc` to leave without buying.
  - Buying Sealed Errand opens a hidden quest portal.
  - The hidden quest teleports players into a dark maze to deliver a message to the Maze Sage.
  - Players can only see a short distance in the maze, but they leave torchlight every two maze blocks.
  - Delivering the message grants Sage's Footwork: after dashing, the next basic attack deals +30% damage.
  - Pick one reward with mouse, `1`, `2`, or `3`.
  - Rewards can be stat upgrades, passives, ability evolutions, new ability effects, or pets.
  - Class evolution rewards unlock an extra class ability.
  - Swordsman evolution ability is Guard Breaker, a long invincible spear dash that pierces enemies.
  - Archer evolution ability is Arrow Storm, a volley of arrows that leaves slowing ice patches.
  - Press `F` near the portal after a room clear to enter the next stage.
  - Reward rarity tiers use different colors.
- Enemy habits:
  - Enemies wander randomly until the player enters their sight range.
  - Enemies can lose sight and return toward their spawn if pulled too far away.
  - Cinder Scouts chase with slight zigzag movement.
  - Lantern Rangers keep a preferred distance, strafe, and shoot after an aim warning.
  - Stone Brutes slow chase, wind up, then charge in a straight line.
  - Ash Bombers rush and explode after a short warning.
  - Bosses track the whole room and alternate aimed volleys with radial bullet patterns.
- Stages advance after every clear.
- Every fifth stage is a boss room.
- Stage 5 first boss:
  - Charlie Kirk, Campus Broadcaster.
  - Boss moves show short debate-style dialogue bubbles above his head.
  - Mic Drop fires fast soundwaves that pop `!!!` on hit.
  - The Campus Table creates a temporary shield and reflects damage as pamphlets.
  - Talking Points Barrage fires homing text bubbles that slow the player with Overwhelmed.
  - The Live Stream triggers an ON AIR AoE burst, shakes the arena, and heals nearby supporters.
  - Supporters spawn passively during the fight.
- The swordsman is invincible while Whirlwind Smash is active.
- Archer's Giant Net auto-aims at the nearest target when used.
- The HUD uses compact health strips and circular ability cooldown buttons.
- Rebindable keyboard controls in settings.
- The Escape menu has a Secret Codes tab for run cheats.
- Secret code `mysteriously`, `myster10usly`, or `nuke` arms the Mysterious Nuke.
- Secret code `Give me the coins` opens a coin amount prompt and grants that many coins.
- Future evolution hooks are already included in the character data.

## Default Controls

- Player 1 move: `W A S D`
- Player 1 auto aim attack: `R`
- Player 1 dash: `Left Shift`
- Player 1 ultimate: `Q`
- Player 1 evolution ability: `E`
- Player 1 pick up / portal: `F`
- Player 2 move: arrow keys
- Player 2 auto aim attack: `/`
- Player 2 dash: `Right Shift`
- Player 2 ultimate: `.`
- Player 2 evolution ability: `,`
- Player 2 pick up / portal: `Enter`
- Settings: `Esc`
