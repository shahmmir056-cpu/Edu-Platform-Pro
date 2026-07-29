import { useEffect, useRef, useMemo } from "react";

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const particles = useMemo(() => {
    return Array.from({ length: 55 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0002,
      vy: -0.00008 - Math.random() * 0.00012,
      r: 2 + Math.random() * 3.5,
      opacity: 0.06 + Math.random() * 0.1,
      pulse: Math.random() * Math.PI * 2,
      hue: 28 + Math.random() * 10,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.006;
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }

        const screenX = p.x * canvas.width;
        const screenY = p.y * canvas.height;
        const pulseR = p.r + Math.sin(p.pulse) * 1.2;

        const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, pulseR * 2);
        grad.addColorStop(0, `hsla(${p.hue}, 90%, 65%, ${p.opacity * 1.5})`);
        grad.addColorStop(1, `hsla(${p.hue}, 90%, 65%, 0)`);
        ctx.beginPath();
        ctx.arc(screenX, screenY, pulseR * 2, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(screenX, screenY, pulseR * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 60%, ${p.opacity})`;
        ctx.fill();
      }

      ctx.strokeStyle = "rgba(255, 159, 76, 0.025)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = (particles[i].x - particles[j].x) * canvas.width;
          const dy = (particles[i].y - particles[j].y) * canvas.height;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            ctx.globalAlpha = (1 - dist / 160) * 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x * canvas.width, particles[i].y * canvas.height);
            ctx.lineTo(particles[j].x * canvas.width, particles[j].y * canvas.height);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [particles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
