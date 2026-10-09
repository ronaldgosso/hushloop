export default function App() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '24px',
        position: 'relative',
      }}
    >
      <header
        style={{
          position: 'absolute',
          top: '20px',
          left: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-cyan-glow)',
            boxShadow: '0 0 10px var(--color-cyan-glow)',
          }}
        />
        <h1
          style={{
            fontSize: '15px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}
        >
          FocusDeck
        </h1>
      </header>

      <section
        className="glass-panel"
        style={{
          padding: '48px 64px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-cyan-mint)',
            backgroundColor: 'rgba(78, 237, 222, 0.1)',
            padding: '6px 14px',
            borderRadius: '9999px',
            border: '1px solid rgba(78, 237, 222, 0.25)',
          }}
        >
          Focus Mode • Ready
        </span>

        <div
          style={{
            fontSize: '76px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            textShadow: '0 0 30px rgba(0, 242, 254, 0.25)',
          }}
        >
          25:00
        </div>

        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          Windows 11 Active Focus & Soundscape Engine
        </p>
      </section>
    </main>
  );
}
