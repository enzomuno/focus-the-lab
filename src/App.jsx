import { useAuth } from './AuthContext.jsx';
import LoginScreen from './LoginScreen.jsx';
import HabitTracker from './HabitTracker.jsx';

export default function App() {
  const { user, loading, loginWithGoogle, logout } = useAuth();

  if (loading) {
    return (
      <div style={{
        fontFamily: "'Poppins', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#f5f2ed",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 16 }}>
            <div style={{ width: 3, height: 24, background: "#a27b5c", borderRadius: 2 }} />
            <div style={{ width: 3, height: 16, background: "#a27b5c", borderRadius: 2, opacity: 0.6, alignSelf: "flex-end" }} />
            <div style={{ width: 3, height: 24, background: "#a27b5c", borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 14, letterSpacing: 4, fontWeight: 300, color: "#8a8377" }}>
            Carregando...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={loginWithGoogle} />;
  }

  return <HabitTracker user={user} onLogout={logout} />;
}
