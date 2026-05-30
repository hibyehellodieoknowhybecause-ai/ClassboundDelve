export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function normalize(x, y) {
  const length = Math.hypot(x, y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  return { x: x / length, y: y / length };
}

export function angleTo(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function circleHit(a, b) {
  return distance(a, b) <= a.radius + b.radius;
}

export function rectCircleHit(rect, circle) {
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.h);
  return Math.hypot(circle.x - nearestX, circle.y - nearestY) <= circle.radius;
}

export function pushCircleOutOfRect(circle, rect) {
  if (!rectCircleHit(rect, circle)) {
    return;
  }

  const nearestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  const dist = Math.hypot(dx, dy);

  if (dist > 0) {
    const overlap = circle.radius - dist;
    circle.x += (dx / dist) * overlap;
    circle.y += (dy / dist) * overlap;
    return;
  }

  const left = circle.x - rect.x;
  const right = rect.x + rect.w - circle.x;
  const top = circle.y - rect.y;
  const bottom = rect.y + rect.h - circle.y;
  const smallest = Math.min(left, right, top, bottom);

  if (smallest === left) {
    circle.x = rect.x - circle.radius;
  } else if (smallest === right) {
    circle.x = rect.x + rect.w + circle.radius;
  } else if (smallest === top) {
    circle.y = rect.y - circle.radius;
  } else {
    circle.y = rect.y + rect.h + circle.radius;
  }
}
