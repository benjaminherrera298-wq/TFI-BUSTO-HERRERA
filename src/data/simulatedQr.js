// Patrón visual del QR simulado original. No codifica un QR escaneable.
export function simulatedQrCells(identifier) {
  let state = 2166136261;
  for (const character of identifier) {
    state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  }
  const bit = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state & 1;
  };
  const cells = [];
  for (let y = 0; y < 29; y++) {
    for (let x = 0; x < 29; x++) {
      const finder = [[0, 0], [22, 0], [0, 22]].find(([a, b]) => x >= a && x < a + 7 && y >= b && y < b + 7);
      let on;
      if (finder) {
        const dx = x - finder[0];
        const dy = y - finder[1];
        on = dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
      } else {
        on = bit();
      }
      if (on) cells.push({ x: x + 4, y: y + 4 });
    }
  }
  return cells;
}
