import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Atendimentos from '@/pages/Atendimentos';
import AtendimentoDetalhes from '@/pages/AtendimentoDetalhes';
import AtendimentoChat from '@/pages/AtendimentoChat';
import Insights from '@/pages/Insights';
import Login from '@/pages/Login';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function RequireAuth() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm animate-pulse">Carregando aplicação...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// Redirect logged in users away from login page
function PublicOnly() {
  const { session, loading } = useAuth();

  if (loading) return null;

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicOnly />}>
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="insights" element={<Insights />} />
              <Route path="atendimentos" element={<Atendimentos />} />
              <Route path="atendimentos/:id" element={<AtendimentoDetalhes />} />
              <Route path="atendimentos/:id/chat" element={<AtendimentoChat />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
