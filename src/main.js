import { InputManager } from "./input.js";
import { Renderer } from "./renderer.js";
import { UI } from "./ui.js";
import { Game } from "./game.js";

const canvas = document.querySelector("#game");
const input = new InputManager(canvas);
const renderer = new Renderer(canvas);
const ui = new UI(input);
const game = new Game(input, ui, renderer);

ui.init({
  start: (characterId, playerCount) => game.start(characterId, playerCount),
  secretCode: (code) => game.handleSecretCode(code),
  grantCoins: (amount) => game.grantCoins(amount),
  players: () => game.players
});

requestAnimationFrame(game.loop);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}
