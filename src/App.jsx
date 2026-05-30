import { useAuth } from './AuthContext.jsx';
import LoginScreen from './LoginScreen.jsx';
import HabitTracker from './HabitTracker.jsx';

export default function App() {
  const { user, loading, loginWithGoogle, logout } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span className="loading-text">Carregando...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={loginWithGoogle} />;
  }

  return <HabitTracker user={user} onLogout={logout} />;
}
