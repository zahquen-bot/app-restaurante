import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; // 1. Adicionado useNavigate
import { supabase } from '../lib/supabaseClient';
import Notiflix from 'notiflix';

const Navbar = () => {
  const navigate = useNavigate(); // 2. Inicializado o hook
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

  const handleLogout = async () => {


    Notiflix.Confirm.show(
      'Sair',
      'Confirma sair ?',
      'Sim',
      'Não',
        async () => {
            // Código caso ele clique em "Sim"
            // 1. Executa o logout no Supabase
            const { error } = await supabase.auth.signOut();
    
            if (!error) {
                // 2. Redireciona via React Router (limpo e sem recarregar a página toda)
                navigate('/login', { replace: true });
                
                // 3. (Opcional) Se você quiser garantir que tudo limpe mesmo:
                //window.location.reload(); 
            }
         }
       );
    };

  const linkStyle = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 border-b-2 transition-all duration-200 whitespace-nowrap ${
      isActive 
        ? 'border-blue-600 text-blue-600 font-bold' 
        : 'border-transparent text-gray-600 hover:text-gray-800'
    }`;

  return (
    <nav className="w-full flex items-center bg-white shadow-sm border-b border-gray-100 px-2 sm:px-4">
      
      {/* Container das abas */}
      <div className="flex items-center overflow-x-auto scrollbar-hide">
        <NavLink to="/" className={linkStyle}>Movimento</NavLink>
        
        {/* Botão de Atalho para o Modo Venda (Corrigido para usar navigate) */}
        <button 
          onClick={() => navigate('/quiosque')}
          className="ml-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase hover:bg-blue-100 transition-colors whitespace-nowrap"
        >
          Modo Venda
        </button>

        {isAdmin && (
          <>
            <NavLink to="/produtos" className={linkStyle}>Produtos</NavLink>
            <NavLink to="/usuarios" className={linkStyle}>Usuários</NavLink>
            <NavLink to="/relatorios" className={linkStyle}>Relatórios</NavLink>
          </>
        )}
      </div>

      {/* E-mail e botão Sair */}
      <div className="ml-auto flex items-center gap-4 border-l border-gray-200 pl-4 flex-shrink-0">
        {userEmail && (
          <span className="text-sm text-gray-600 font-medium hidden sm:block truncate max-w-[200px]">
            {userEmail}
          </span>
        )}
        
        <button 
          onClick={handleLogout} 
          className="text-red-500 hover:text-red-700 text-sm font-semibold"
        >
          Sair
        </button>
      </div>
    </nav>
  );
};

export default Navbar;