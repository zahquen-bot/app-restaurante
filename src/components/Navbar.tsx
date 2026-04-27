import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Navbar = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null); // Captura o e-mail aqui
        
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (data?.role === 'admin') setIsAdmin(true);
      }
    };
    checkRole();
  }, []);

  const linkStyle = ({ isActive }: { isActive: boolean }) =>
    `px-2 py-2 border-b-2 transition-all duration-200 ${
      isActive 
        ? 'border-blue-600 text-blue-600 font-bold' 
        : 'border-transparent text-gray-600 hover:text-gray-800'
    }`;

  return (
    <nav className="p-4 bg-white shadow-sm flex items-center gap-6 border-b border-gray-100">
      <NavLink to="/" className={linkStyle}>Movimento</NavLink>

      {isAdmin && (
        <>
          <NavLink to="/produtos" className={linkStyle}>Produtos</NavLink>
          <NavLink to="/usuarios" className={linkStyle}>Usuários</NavLink>
          <NavLink to="/relatorios" className={linkStyle}>Relatórios</NavLink>
        </>
      )}

      {/* E-mail exibido antes do botão Sair */}
      <div className="ml-auto flex items-center gap-4">
        {userEmail && (
          <span className="text-xs text-gray-400 font-medium hidden sm:block">
            {userEmail}
          </span>
        )}
        
        <button 
          onClick={() => supabase.auth.signOut()} 
          className="text-red-500 hover:text-red-700 text-sm font-semibold"
        >
          Sair
        </button>
      </div>
    </nav>
  );
};

export default Navbar;