// Exploration only: no scores, answers, or wall-clock timers live here.
export const refugeOffsets = [590, 890, 1175];
export const scanCycle = 4.4;
export function scannerActive(elapsed) {
  return elapsed % scanCycle < 2.6;
}
export function patrolState() {
  return {
    x: 1160,
    direction: -1,
    mode: "patrol",
    suspicion: 0,
    lost: 0,
    search: 0,
    lastSeen: 1160,
  };
}
export function stepPatrol(state, player, delta) {
  const dt = Math.min(0.05, Math.max(0, delta / 1000));
  const distance = Math.abs(player.x - state.x);
  const facing = (player.x - state.x) * state.direction >= 0;
  const visible =
    !player.hidden &&
    facing &&
    distance < (player.light ? 430 : player.crouching ? 70 : 155);
  const audible = !player.hidden && player.running && distance < 340;
  const contact = !player.hidden && distance < 65;
  const sensed = visible || audible || contact;
  if (sensed) {
    state.lastSeen = player.x;
    state.lost = 0;
    state.suspicion = Math.min(
      1,
      state.suspicion + dt * (audible ? 1.15 : 0.85),
    );
  } else {
    state.lost += dt;
    state.suspicion = Math.max(0, state.suspicion - dt * 0.45);
  }
  if (state.suspicion >= 1 || contact) state.mode = "chase";
  if (state.mode === "chase" && !sensed && state.lost > 1.3) {
    state.mode = "search";
    state.search = 3.5;
  }
  let target;
  if (state.mode === "chase" || state.mode === "search") {
    target = state.lastSeen;
    if (state.mode === "search") {
      state.search -= dt;
      if (state.search <= 0) {
        state.mode = "patrol";
        state.direction = -1;
      }
    }
  } else target = state.direction < 0 ? 650 : 1160;
  if (Math.abs(target - state.x) > 8) {
    state.direction = Math.sign(target - state.x);
    state.x +=
      state.direction *
      Math.min(
        Math.abs(target - state.x),
        (state.mode === "chase" ? 290 : 90) * dt,
      );
  } else if (state.mode === "patrol") state.direction *= -1;
  return (
    !player.hidden &&
    state.mode === "chase" &&
    Math.abs(player.x - state.x) < 48
  );
}
