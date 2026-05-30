from pathlib import Path
import base64
import re


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist" / "index.html"

MODULE_ORDER = [
    "src/utils/math.js",
    "src/data/abilities.js",
    "src/data/characters.js",
    "src/data/weapons.js",
    "src/data/rewards.js",
    "src/data/stages.js",
    "src/sprites.js",
    "src/settings.js",
    "src/combat.js",
    "src/enemies.js",
    "src/loot.js",
    "src/player.js",
    "src/renderer.js",
    "src/input.js",
    "src/ui.js",
    "src/game.js",
    "src/main.js",
]

SPRITES = {
    "./assets/sprites/swordsman.png": "assets/sprites/swordsman.png",
    "./assets/sprites/archer.png": "assets/sprites/archer.png",
    "./assets/sprites/boss_broadcaster.png": "assets/sprites/boss_broadcaster.png",
}


def transform_module(path: Path) -> str:
    source = path.read_text()
    source = re.sub(r'^import .+?;\n', "", source, flags=re.MULTILINE)
    source = re.sub(r'^export ', "", source, flags=re.MULTILINE)
    if path.name == "sprites.js":
        for src, sprite_path in SPRITES.items():
            data = base64.b64encode((ROOT / sprite_path).read_bytes()).decode("ascii")
            source = source.replace(src, f"data:image/png;base64,{data}")
    return f"\n// {path.relative_to(ROOT)}\n{source}\n"


def main() -> None:
    html = (ROOT / "index.html").read_text()
    css = (ROOT / "src/styles.css").read_text()
    scripts = "\n".join(transform_module(ROOT / module) for module in MODULE_ORDER)

    html = re.sub(r'\s*<link rel="stylesheet" href="./src/styles.css" />', f"\n    <style>\n{css}\n    </style>", html)
    html = re.sub(r'\s*<script type="module" src="./src/main.js"></script>', f"\n    <script>\n{scripts}\n    </script>", html)
    html = html.replace("<title>Dungeon Class Prototype</title>", "<title>Classbound Delve</title>")

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(html)
    print(OUT)


if __name__ == "__main__":
    main()
