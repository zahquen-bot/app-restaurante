import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Tentando logar com:", email); // Log para ver se ele tenta mesmo
    
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) {
      console.error("Erro do Supabase:", error.message); // Verá o erro exato aqui
      alert("Erro ao entrar: " + error.message);
    } else {
      console.log("Login realizado com sucesso!", data);
      // Aqui você precisaria forçar um reload ou navegação
      window.location.reload(); 
    }
  };

  return (
<div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">       
    <div className="flex flex-col items-center justify-center mb-8">
  <h1 className="text-4xl font-extrabold text-blue-600 tracking-tight">
    Zannah
  </h1>
  <h2 className="text-2xl font-bold text-gray-800 tracking-tight mt-1">
    Controle de Vendas
  </h2>
</div>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h1>
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-3 mb-6 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button type="submit" className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200">
          Entrar
        </button>
      </form>
      <div className="fixed bottom-4 left-0 right-0 text-center text-gray-500 text-sm font-medium">
    <p>Versão 1.0 - Copyright &copy; LarZach 2026</p>
  </div>
    </div>
  )
}

export default Login