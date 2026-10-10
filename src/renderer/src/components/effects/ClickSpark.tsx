import { useRef, useEffect, useCallback, type MouseEvent, type ReactNode } from 'react';

interface Spark {
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface ClickSparkProps {
  children: ReactNode;
  sparkColor?: string;
  sparkCount?: number;
  sparkSize?: number;
  className?: string;
}

export function ClickSpark({
  children,
  sparkColor = '#00F2FE',
  sparkCount = 10,
  sparkSize = 2.5,
  className = '',
}: ClickSparkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);

  const createSparks = useCallback(
    (x: number, y: number) => {
      const colors = [sparkColor, '#4EEDDE', '#FFFFFF'];
      for (let i = 0; i < sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.2 + Math.random() * 2.8;
        const maxLife = 22 + Math.random() * 12;
        sparksRef.current.push({
          x,
          y,
          angle,
          speed,
          size: sparkSize * (0.6 + Math.random() * 0.8),
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          life: 0,
          maxLife,
        });
      }
    },
    [sparkColor, sparkCount, sparkSize],
  );

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    createSparks(x, y);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const spark = sparksRef.current[i];
        spark.life++;
        spark.x += Math.cos(spark.angle) * spark.speed;
        spark.y += Math.sin(spark.angle) * spark.speed;
        spark.alpha = Math.max(0, 1 - spark.life / spark.maxLife);

        ctx.save();
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
        ctx.fillStyle = spark.color;
        ctx.globalAlpha = spark.alpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = spark.color;
        ctx.fill();
        ctx.restore();

        if (spark.life >= spark.maxLife) {
          sparksRef.current.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      canvasRef.current.width = containerRef.current.offsetWidth;
      canvasRef.current.height = containerRef.current.offsetHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={`click-spark-container ${className}`}
      style={{ position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        className="click-spark-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 99,
        }}
      />
      {children}
    </div>
  );
}
