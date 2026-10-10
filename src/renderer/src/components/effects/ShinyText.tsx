
interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export function ShinyText({
  text,
  disabled = false,
  speed = 3,
  className = '',
}: ShinyTextProps) {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`shiny-text-root ${disabled ? 'disabled' : ''} ${className}`}
      style={{ animationDuration }}
    >
      {text}
    </span>
  );
}
