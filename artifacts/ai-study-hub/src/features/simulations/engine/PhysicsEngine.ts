export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

export function lerpColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function generateParticles(
  count: number,
  bounds: { x: number; y: number; w: number; h: number },
  color: string,
  opts?: { speed?: number; size?: number }
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (opts?.speed ?? 0.5) * (0.5 + Math.random());
    particles.push({
      x: bounds.x + Math.random() * bounds.w,
      y: bounds.y + Math.random() * bounds.h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: (opts?.size ?? 3) * (0.7 + Math.random() * 0.6),
      color,
      opacity: 0.5 + Math.random() * 0.5,
      life: 1,
    });
  }
  return particles;
}

export function tickParticles(particles: Particle[], bounds: { x: number; y: number; w: number; h: number }): Particle[] {
  return particles.map((p) => {
    let { x, y, vx, vy } = p;
    x += vx;
    y += vy;
    if (x < bounds.x) { x = bounds.x; vx *= -0.8; }
    if (x > bounds.x + bounds.w) { x = bounds.x + bounds.w; vx *= -0.8; }
    if (y < bounds.y) { y = bounds.y; vy *= -0.8; }
    if (y > bounds.y + bounds.h) { y = bounds.y + bounds.h; vy *= -0.8; }
    vx *= 0.99;
    vy *= 0.99;
    return { ...p, x, y, vx, vy };
  });
}

export function fillLevelAnim(current: number, target: number, speed = 0.05): number {
  return lerp(current, target, speed);
}

export function colorMixAnim(
  current: string,
  target: string,
  progress: number
): string {
  return lerpColor(current, target, progress);
}

export function calculateOsmosis(
  soluteInside: number,
  soluteOutside: number,
  volumeInside: number,
  dt: number
): number {
  const concInside = soluteInside / volumeInside;
  const concOutside = soluteOutside / 100;
  const osmoticPressure = (concOutside - concInside) * 0.02;
  return volumeInside + osmoticPressure * dt;
}

export function gelBandMigration(
  fragmentSize: number,
  voltage: number,
  time: number,
  gelConcentration: number
): number {
  const mobility = (1 / Math.log(fragmentSize)) * voltage * (1 / gelConcentration);
  return mobility * time;
}
