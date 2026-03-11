export default function LoginScreen({ onLogin }) {
  return (
    <div style={{
      fontFamily: "'Poppins', sans-serif",
      background: "#f5f2ed",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        .login-btn { transition: all 0.2s ease; }
        .login-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(162,123,92,0.3) !important; }
      `}</style>

      <div style={{
        maxWidth: 420,
        width: "100%",
        textAlign: "center",
        animation: "fadeUp 0.8s ease",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginBottom: 24 }}>
          <div style={{ width: 4, height: 32, background: "#a27b5c", borderRadius: 2 }} />
          <div style={{ width: 4, height: 22, background: "#a27b5c", borderRadius: 2, opacity: 0.6, alignSelf: "flex-end" }} />
          <div style={{ width: 4, height: 32, background: "#a27b5c", borderRadius: 2 }} />
        </div>

        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 6,
          color: "#2c3639",
          lineHeight: 1,
          marginBottom: 6,
        }}>
          FOCUS MIND LAB
        </h1>
        <p style={{
          fontSize: 10,
          letterSpacing: 3,
          color: "#a27b5c",
          fontWeight: 500,
          marginBottom: 40,
        }}>
          PAINEL DE HÁBITOS
        </p>

        {/* Card */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e8e3db",
          padding: "40px 32px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            fontSize: 11,
            letterSpacing: 1.5,
            color: "#8a8377",
            fontWeight: 600,
            marginBottom: 8,
          }}>
            BEM-VINDO
          </div>
          <h2 style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#2c3639",
            marginBottom: 8,
            lineHeight: 1.4,
          }}>
            Construa hábitos que<br />transformam resultados.
          </h2>
          <p style={{
            fontSize: 13,
            color: "#8a8377",
            lineHeight: 1.6,
            marginBottom: 32,
          }}>
            Entre com sua conta Google para acessar seu painel de hábitos, metas e progresso.
          </p>

          <button
            onClick={onLogin}
            className="login-btn"
            style={{
              width: "100%",
              padding: "14px 24px",
              fontSize: 14,
              fontWeight: 600,
              background: "#2c3639",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontFamily: "'Poppins', sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              boxShadow: "0 4px 15px rgba(44,54,57,0.2)",
            }}
          >
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
            color: "#b5a898",
            lineHeight: 1.5,
          }}>
            Seus dados ficam salvos na nuvem e sincronizam entre dispositivos.
          </div>
        </div>

        {/* Bottom quote */}
        <div style={{
          marginTop: 32,
          padding: "0 20px",
        }}>
          <div style={{ width: 30, height: 2, background: "#dcd7c9", borderRadius: 1, margin: "0 auto 12px" }} />
          <p style={{
            fontSize: 11,
            color: "#a27b5c",
            fontStyle: "italic",
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
