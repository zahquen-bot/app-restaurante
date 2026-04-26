import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const Navbar = () => {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Busca a role no banco
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        // Se for admin, o estado muda para true e o menu aparece
        if (data?.role === 'admin') {
          setIsAdmin(true)
        }
      }
    }
    checkRole()
  }, [])

  return (
    <nav className="p-4 bg-white shadow-sm flex gap-6">
      <Link to="/movimento" className="text-gray-600 hover:text-blue-600">Movimento</Link>
      
      {/* O menu só aparece se isAdmin for true */}
      {isAdmin && (
        <>
          <Link to="/produtos" className="text-gray-600 hover:text-blue-600">Produtos</Link>
          <Link to="/usuarios" className="text-gray-600 hover:text-blue-600">Usuários</Link>
        </>
      )}
      
      {/* Botão de sair */}
      <button onClick={() => supabase.auth.signOut()} className="ml-auto text-red-500">Sair</button>
    </nav>
  )
}

export default Navbar