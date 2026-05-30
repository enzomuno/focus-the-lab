import { useTheme } from './ThemeContext.jsx';

export default function LoginScreen({ onLogin }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="login-bg">
      {/* Animated mesh gradient blobs */}
      <div className="login-mesh login-mesh--1" />
      <div className="login-mesh login-mesh--2" />
      <div className="login-mesh login-mesh--3" />

      <div className="login-content">
        {/* Theme toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Alternar tema">
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 24 }}>
          <div className="logo-bar logo-bar--tall" />
          <div className="logo-bar logo-bar--short" style={{ alignSelf: 'flex-end' }} />
          <div className="logo-bar logo-bar--tall" />
        </div>

        <h1 style={{
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: 6,
          color: 'var(--text-primary)',
          lineHeight: 1,
          marginBottom: 6,
        }}>
          FOCUS MIND LAB
        </h1>
        <p style={{
          fontSize: 10,
          letterSpacing: 3,
          color: 'var(--accent)',
          fontWeight: 600,
          marginBottom: 40,
        }}>
          PAINEL DE HÁBITOS
        </p>

        {/* Login Card */}
        <div className="login-card">
          <div style={{
            fontSize: 11,
            letterSpacing: 1.5,
            color: 'var(--text-tertiary)',
            fontWeight: 600,
            marginBottom: 8,
          }}>
            BEM-VINDO
          </div>
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 8,
            lineHeight: 1.4,
          }}>
            Construa hábitos que<br />transformam resultados.
          </h2>
          <p style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: 32,
          }}>
            Entre com sua conta Google para acessar seu painel de hábitos, metas e progresso.
          </p>

          <button onClick={onLogin} className="login-btn">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </button>

          <div style={{
            marginTop: 20,
            fontSize: 11,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}>
            Seus dados ficam salvos na nuvem e sincronizam entre dispositivos.
          </div>
        </div>

        {/* Bottom quote */}
        <div style={{ marginTop: 32, padding: '0 20px' }}>
          <div style={{ width: 30, height: 2, background: 'var(--border-strong)', borderRadius: 1, margin: '0 auto 12px' }} />
          <p style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            fontStyle: 'italic',
            fontWeight: 400,
            lineHeight: 1.6,
          }}>
            "Sistemas superam motivação.<br />Consistência supera intensidade."
          </p>
        </div>
      </div>
    </div>
  );
}
