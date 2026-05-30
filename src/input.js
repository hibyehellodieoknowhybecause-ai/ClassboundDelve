import { loadKeybinds } from "./settings.js";

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.virtualDown = new Set();
    this.virtualPressed = new Set();
    this.virtualAxes = { x: 0, y: 0 };
    this.mouse = { x: 0, y: 0, down: false, pressed: false };
    this.keybinds = loadKeybinds();
    this.secretBuffer = "";
    this.typedCharacters = [];

    window.addEventListener("keydown", (event) => {
      const editable = isEditableTarget(event.target);
      if (!this.keys.has(event.code)) {
        this.pressed.add(event.code);
      }
      this.keys.add(event.code);

      if (!editable && !event.repeat && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.length === 1) {
        const typed = event.key.toLowerCase();
        this.secretBuffer = `${this.secretBuffer}${typed}`.slice(-32);
        this.typedCharacters.push(typed);
      } else if (!editable && !event.repeat && event.code === "Backspace") {
        this.typedCharacters.push("backspace");
      }

      if (!editable && Object.values(this.keybinds).includes(event.code)) {
        event.preventDefault();
      }
    }, true);

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });

    canvas.addEventListener("pointermove", (event) => {
      this.updatePointerPosition(event);
    });

    canvas.addEventListener("mousemove", (event) => {
      this.updatePointerPosition(event);
    });

    canvas.addEventListener("pointerdown", (event) => {
      this.updatePointerPosition(event);
      this.mouse.down = true;
      this.mouse.pressed = true;
    });

    canvas.addEventListener("mousedown", (event) => {
      this.updatePointerPosition(event);
      this.mouse.down = true;
      this.mouse.pressed = true;
    });

    window.addEventListener("pointerup", () => {
      this.mouse.down = false;
    });

    window.addEventListener("mouseup", () => {
      this.mouse.down = false;
    });
  }

  updatePointerPosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
    this.mouse.y = (event.clientY - rect.top) * (this.canvas.height / rect.height);
  }

  setKeybinds(keybinds) {
    this.keybinds = { ...keybinds };
  }

  setVirtualAxis(x, y) {
    this.virtualAxes.x = x;
    this.virtualAxes.y = y;
  }

  pressVirtualAction(action) {
    if (!this.virtualDown.has(action)) {
      this.virtualPressed.add(action);
    }
    this.virtualDown.add(action);
  }

  releaseVirtualAction(action) {
    this.virtualDown.delete(action);
  }

  releaseAllVirtualActions() {
    this.virtualDown.clear();
    this.virtualAxes.x = 0;
    this.virtualAxes.y = 0;
  }

  isDown(action) {
    if (this.virtualDown.has(action)) {
      return true;
    }
    if (action === "moveLeft" && this.virtualAxes.x < -0.28) {
      return true;
    }
    if (action === "moveRight" && this.virtualAxes.x > 0.28) {
      return true;
    }
    if (action === "moveUp" && this.virtualAxes.y < -0.28) {
      return true;
    }
    if (action === "moveDown" && this.virtualAxes.y > 0.28) {
      return true;
    }
    return this.keys.has(this.keybinds[action]);
  }

  wasPressed(action) {
    return this.virtualPressed.has(action) || this.pressed.has(this.keybinds[action]);
  }

  wasCodePressed(code) {
    return this.pressed.has(code);
  }

  consumeSecretCode(code) {
    if (!this.secretBuffer.endsWith(code.toLowerCase())) {
      return false;
    }
    this.secretBuffer = "";
    return true;
  }

  consumeSecretCodes(codes) {
    if (!codes.some((code) => this.secretBuffer.endsWith(code.toLowerCase()))) {
      return false;
    }
    this.secretBuffer = "";
    return true;
  }

  consumeFrame() {
    this.pressed.clear();
    this.virtualPressed.clear();
    this.typedCharacters = [];
    this.mouse.pressed = false;
  }
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}
