# Sprite Sheet Plan

Put all sprite sheet PNG files in this folder.

Use transparent PNGs. A good starting size is `32x32` pixels per frame for characters and enemies, then draw them at `64x64` in the game. Bigger bosses can use `64x64` frames.

## Needed Sprite Sheets

### `swordsman.png`

Frame size: `32x32`

Rows:

- Row 0: idle, 4 frames
- Row 1: walk, 4 frames
- Row 2: attack slash, 4 frames
- Row 3: whirlwind ultimate, 6 frames
- Row 4: hurt, 2 frames

The swordsman should read as a close-range fighter. Make the sword shape obvious, even if it is a little oversized.

### `archer.png`

Frame size: `32x32`

Rows:

- Row 0: idle, 4 frames
- Row 1: walk, 4 frames
- Row 2: bow attack, 4 frames
- Row 3: giant net ultimate, 5 frames
- Row 4: hurt, 2 frames

The archer should have a clear bow silhouette and a lighter, faster-looking stance.

### `enemies.png`

Frame size: `32x32`

Rows:

- Row 0: Cinder Scout idle/walk, 4 frames
- Row 1: Lantern Ranger idle/walk, 4 frames
- Row 2: Stone Brute idle/walk, 4 frames
- Row 3: Stone Brute charge, 4 frames
- Row 4: Ash Bomber idle/walk, 4 frames
- Row 5: Ash Bomber explode, 5 frames

Keep each enemy visually different: scout should look fast, ranger should look ranged, brute should look heavy, bomber should look dangerous up close.

### `boss_gatebreaker.png`

Frame size: `64x64`

Rows:

- Row 0: idle, 4 frames
- Row 1: walk, 4 frames
- Row 2: aimed volley attack, 5 frames
- Row 3: radial burst attack, 5 frames
- Row 4: hurt, 2 frames

Boss sprites can be larger and more detailed than normal enemies.

### `weapons.png`

Frame size: `32x32`

Rows or individual icons:

- Iron Saber
- Elm Longbow
- Spark Pistol
- Storm Halberd
- Ember Cleaver
- Frost Rapier
- Thorn Repeater
- Moon Snare Bow
- Glass Comet
- Twin Fang

These are mostly inventory/chest icons, so one frame per weapon is enough for now.

### `effects.png`

Frame size: `32x32`

Rows:

- Row 0: sword slash, 4 frames
- Row 1: arrow projectile, 1-2 frames
- Row 2: bullet projectile, 1-2 frames
- Row 3: net projectile, 3 frames
- Row 4: net trap opened, 4 frames
- Row 5: whirlwind ring, 6 frames
- Row 6: ground smash, 5 frames
- Row 7: enemy hit spark, 3 frames

Effects can be brighter and more exaggerated than characters because they only appear briefly.

### `items.png`

Frame size: `32x32`

Rows:

- Row 0: closed chest, 1 frame
- Row 1: open chest, 1 frame
- Row 2: health potion, 2 frames
- Row 3: portal, 6 frames

Chests should be easy to recognize because they are the only source of new weapons.

### `tiles_dungeon.png`

Frame size: `32x32`

Tiles:

- Stone floor
- Cracked floor
- Wall edge
- Forge floor
- Grove/root floor
- Crypt floor
- Rift floor
- Small obstacle/block
- Large obstacle/block

This can replace the current rectangle room art later.

## Recommended Canvas Sizes

- `swordsman.png`: `192x160` if using 6 columns by 5 rows
- `archer.png`: `160x160` if using 5 columns by 5 rows
- `enemies.png`: `160x192` if using 5 columns by 6 rows
- `boss_gatebreaker.png`: `320x320` if using 5 columns by 5 rows at `64x64`
- `weapons.png`: `320x32` for 10 weapon icons
- `effects.png`: `192x256` if using 6 columns by 8 rows
- `items.png`: `192x128` if using 6 columns by 4 rows
- `tiles_dungeon.png`: flexible, but `256x256` is a good start

## Drawing Rules

- Keep backgrounds transparent.
- Keep frame sizes consistent inside each sheet.
- Face characters to the right by default. The game can flip sprites for left-facing movement later.
- Keep the feet/body centered in each frame so animations do not jitter.
- Use simple, readable silhouettes before adding details.
- Avoid tiny details that disappear when the sprite is scaled.
