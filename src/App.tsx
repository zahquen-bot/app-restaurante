import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Movimento from './pages/Movimento';
import CadastroProdutos from './pages/CadastroProdutos';
import CadastroUsuarios from './pages/CadastroUsuarios';
import Login from './pages/Login';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { User } from '@supabase/supabase-js';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (!user) return <Login />;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="p-4">
          <Routes>
            <Route path="/" element={<Movimento />} />
            <Route path="/produtos" element={<CadastroProdutos />} />
            <Route path="/usuarios" element={<CadastroUsuarios />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;