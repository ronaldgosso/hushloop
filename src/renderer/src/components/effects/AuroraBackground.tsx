import { useEffect, useRef } from 'react';
import type { TimerPhase } from '@shared/types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
}

interface AuroraBackgroundProps {
  phase: TimerPhase;
  state: 'idle' | 'running' | 'paused';
}

export function AuroraBackground({ phase, state }: AuroraBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate ambient particles
    const particleCount = 42;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.8 + 0.6,
        baseAlpha: Math.random() * 0.45 + 0.15,
        alpha: 0.2,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.008;
      ctx.clearRect(0, 0, width, height);

      // Draw floating particles with gentle cursor interaction
      const mouse = mouseRef.current;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Mouse proximity repulsion
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          const force = (120 - dist) / 120;
          p.x -= (dx / dist) * force * 1.2;
          p.y -= (dy / dist) * force * 1.2;
        }

        // Shimmering alpha
        const shimmer = Math.sin(time * 2 + p.x * 0.05) * 0.15;
        const finalAlpha = Math.max(0.05, Math.min(0.8, p.baseAlpha + shimmer));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        // Particle tint depends on phase
        if (phase === 'focus') {
          ctx.fillStyle = `rgba(0, 242, 254, ${finalAlpha})`;
        } else if (phase === 'short_break') {
          ctx.fillStyle = `rgba(78, 237, 222, ${finalAlpha})`;
        } else {
          ctx.fillStyle = `rgba(255, 101, 132, ${finalAlpha})`;
        }
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [phase]);

  const getPhaseClass = () => {
    switch (phase) {
      case 'focus':
        return 'aurora-focus';
      case 'short_break':
        return 'aurora-break';
      case 'long_break':
        return 'aurora-recovery';
    }
  };

  return (
    <div className={`aurora-bg-container ${getPhaseClass()} state-${state}`}>
      {/* Dynamic blurred color orbs */}
      <div className="aurora-orb orb-1" />
      <div className="aurora-orb orb-2" />
      <div className="aurora-orb orb-3" />
      <div className="aurora-mesh" />

      {/* Reactive canvas particles */}
      <canvas ref={canvasRef} className="aurora-canvas" />
    </div>
  );
}
