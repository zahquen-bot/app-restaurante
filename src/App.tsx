import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom' // Adicionamos Routes e Route
import Navbar from './components/Navbar'
import Movimento from './pages/Movimento'
import CadastroProdutos from './pages/CadastroProdutos'
import CadastroUsuarios from './pages/CadastroUsuarios'
import Login from './pages/Login'
import { supabase } from './lib/supabaseClient'
import { User } from '@supabase/supabase-js'

const App: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

const CadastroProdutos = () => {
  // REMOVA TODO O USEEFFECT DE CHECAGEM
  // Remova o navigate('/movimento')
  
  // Apenas renderize a tabela
  return (
    <div className="max-w-4xl mx-auto p-6...">
       {/* SEU HTML AQUI */}
    </div>
  )
}

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-600">Carregando...</div>
  
  if (!user) return <Login />

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        {/* Navbar agora gerencia a navegação via rotas, não precisa mais de onPageChange */}
        <Navbar />
        
        <main className="p-4">
          <Routes>
            <Route path="/" element={<Movimento />} />
            <Route path="/cadastro" element={<CadastroProdutos />} />
            <Route path="/usuarios" element={<CadastroUsuarios />} />
            {/* Redireciona qualquer rota inválida para a Home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App