export const sectors = [
  { width: 1260, terminal: 760, frame: null },
  { width: 1440, terminal: 1040, frame: 0 },
  { width: 1100, terminal: 650, frame: 4 },
  { width: 1320, terminal: 910, frame: 1 },
  { width: 1500, terminal: 1110, frame: 2 },
  { width: 1180, terminal: 680, frame: 3 },
  { width: 1360, terminal: 950, frame: 5 },
  { width: 1880, terminal: 850, frame: 6 },
];
let offset = 0;
sectors.forEach((s) => {
  s.start = offset;
  s.gate = s.width - 88;
  offset += s.width;
});
export const worldWidth = offset;
export function sectorAt(x) {
  return Math.max(
    0,
    sectors.findLastIndex((s) => x >= s.start),
  );
}
