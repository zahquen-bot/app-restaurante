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
        setUserEmail(user.email || null);
        
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
    `px-3 py-2 border-b-2 transition-all duration-200 whitespace-nowrap ${
      isActive 
        ? 'border-blue-600 text-blue-600 font-bold' 
        : 'border-transparent text-gray-600 hover:text-gray-800'
    }`;

  return (
    // Adicionado "w-full" e "overflow-x-auto" no container principal
    <nav className="w-full flex items-center bg-white shadow-sm border-b border-gray-100 px-2 sm:px-4">
      
      {/* Container das abas com scroll lateral */}
      <div className="flex items-center overflow-x-auto scrollbar-hide">
        <NavLink to="/" className={linkStyle}>Movimento</NavLink>

        {isAdmin && (
          <>
            <NavLink to="/produtos" className={linkStyle}>Produtos</NavLink>
            <NavLink to="/usuarios" className={linkStyle}>Usuários</NavLink>
            <NavLink to="/relatorios" className={linkStyle}>Relatórios</NavLink>
          </>
        )}
      </div>

      {/* E-mail e Sair */}
      <div className="ml-auto flex items-center gap-3 pl-4 flex-shrink-0">
        {userEmail && (
          <span className="text-[10px] text-gray-400 font-medium hidden sm:block truncate max-w-[100px]">
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