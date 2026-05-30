const STORAGE_KEY = "classbound-delve-keybinds";

export const defaultKeybinds = {
  moveUp: "KeyW",
  moveDown: "KeyS",
  moveLeft: "KeyA",
  moveRight: "KeyD",
  dash: "ShiftLeft",
  autoAimAttack: "KeyR",
  ability: "KeyQ",
  extraAbility: "KeyE",
  interact: "KeyF",
  p2MoveUp: "ArrowUp",
  p2MoveDown: "ArrowDown",
  p2MoveLeft: "ArrowLeft",
  p2MoveRight: "ArrowRight",
  p2Dash: "ShiftRight",
  p2AutoAimAttack: "Slash",
  p2Ability: "Period",
  p2ExtraAbility: "Comma",
  p2Interact: "Enter",
  settings: "Escape"
};

export const keybindLabels = {
  moveUp: "Move Up",
  moveDown: "Move Down",
  moveLeft: "Move Left",
  moveRight: "Move Right",
  dash: "Dash",
  autoAimAttack: "Auto Aim Attack",
  ability: "Ultimate Ability",
  extraAbility: "Evolution Ability",
  interact: "Pick Up / Portal",
  p2MoveUp: "P2 Move Up",
  p2MoveDown: "P2 Move Down",
  p2MoveLeft: "P2 Move Left",
  p2MoveRight: "P2 Move Right",
  p2Dash: "P2 Dash",
  p2AutoAimAttack: "P2 Auto Aim",
  p2Ability: "P2 Ultimate",
  p2ExtraAbility: "P2 Evolution Ability",
  p2Interact: "P2 Pick Up / Portal",
  settings: "Open Settings"
};

export function loadKeybinds() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultKeybinds, ...stored };
  } catch {
    return { ...defaultKeybinds };
  }
}

export function saveKeybinds(keybinds) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keybinds));
}

export function resetKeybinds() {
  saveKeybinds(defaultKeybinds);
  return { ...defaultKeybinds };
}

export function codeToLabel(code) {
  const labels = {
    Space: "Space",
    ShiftLeft: "Left Shift",
    ShiftRight: "Right Shift",
    Escape: "Esc",
    ArrowUp: "Up Arrow",
    ArrowDown: "Down Arrow",
    ArrowLeft: "Left Arrow",
    ArrowRight: "Right Arrow",
    Enter: "Enter",
    Slash: "/",
    Period: ".",
    Comma: ","
  };

  if (labels[code]) {
    return labels[code];
  }

  if (code.startsWith("Key")) {
    return code.slice(3);
  }

  if (code.startsWith("Digit")) {
    return code.slice(5);
  }

  return code;
}
