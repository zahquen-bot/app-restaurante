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
<div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight text-center">
      <span className="text-blue-600">Zanah - </span> Controle de Vendas
    </h1>
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
    </div>
  )
}

export default Login