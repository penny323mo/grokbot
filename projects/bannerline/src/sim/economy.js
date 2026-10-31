/**
 * Barracks trickle. `bank` holds the fractional soldier.
 * At cap, the bank is cleared so a full building does not store a hidden army.
 */
export function applyRegen(count, cap, bank, regen, dt) {
  const c0 = Math.max(0, count);
  const limit = Math.max(0, cap);
  if (!(regen > 0) || c0 >= limit || !(dt > 0)) {
    return { count: Math.min(c0, limit > 0 ? Math.max(c0, 0) : c0), bank: c0 >= limit ? 0 : bank || 0 };
  }
  let b = (bank || 0) + regen * dt;
  let c = c0;
  const whole = Math.floor(b);
  if (whole > 0) {
    const add = Math.min(limit - c, whole);
    c += add;
    b -= whole;
    if (c >= limit) {
      c = limit;
      b = 0;
    }
  }
  return { count: c, bank: b };
}
