import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const CadastroUsuarios = () => {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState('regular')
  
  // Estados de segurança
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (data?.role === 'admin') {
        setIsAdmin(true)
        fetchUsuarios()
      } else {
        alert("Acesso restrito a administradores!")
        navigate('/movimento')
      }
      setLoading(false)
    }
    checkAccess()
  }, [navigate])

  const fetchUsuarios = async () => {
    const { data } = await supabase.from('profiles').select('*').order('email')
    if (data) setUsuarios(data)
  }

  const cadastrarUsuario = async () => {
    if (!email || !senha) {
      alert("Email e senha são obrigatórios!")
      return
    }
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
    })

    if (authError) {
      alert("Erro na autenticação: " + authError.message)
      return
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert([{ 
        id: authData.user.id, 
        email, 
        role 
      }])
      
      if (profileError) {
        alert("Erro ao salvar perfil: " + profileError.message)
      } else {
        setEmail('')
        setSenha('')
        fetchUsuarios()
        alert("Usuário criado com sucesso!")
      }
    }
  }

  const atualizarRole = async (id: string, newRole: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    fetchUsuarios()
  }

  const deletarUsuario = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id)
    fetchUsuarios()
  }

  // Se estiver carregando a checagem, mostra algo neutro
  if (loading) return <div className="p-10 text-center">Verificando permissões...</div>
  
  // Se não for admin, não renderiza nada (o navigate já vai ter movido ele)
  if (!isAdmin) return null

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Gerenciar Usuários</h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <input 
              type="email" 
              placeholder="Email do usuário..." 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="flex-1 border-b-2 border-gray-200 focus:border-blue-600 outline-none py-2"
            />
            <input 
              type="password" 
              placeholder="Senha..." 
              value={senha} 
              onChange={e => setSenha(e.target.value)} 
              className="flex-1 border-b-2 border-gray-200 focus:border-blue-600 outline-none py-2"
            />
          </div>
          <div className="flex gap-4 items-center">
            <select 
              value={role} 
              onChange={e => setRole(e.target.value)} 
              className="border-b-2 border-gray-200 focus:border-blue-600 outline-none py-2 bg-transparent"
            >
              <option value="regular">Regular</option>
              <option value="admin">Admin</option>
            </select>
            <button 
              onClick={cadastrarUsuario} 
              className="bg-blue-600 text-white px-8 py-2.5 rounded-full font-semibold shadow-lg hover:bg-blue-700 transition-all"
            >
              Cadastrar Usuário
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
            <tr>
              <th className="p-5">Email</th>
              <th className="p-5">Role</th>
              <th className="p-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="p-5 font-medium text-gray-800">{u.email}</td>
                <td className="p-5">
                  <select 
                    value={u.role} 
                    onChange={(e) => atualizarRole(u.id, e.target.value)} 
                    className="bg-gray-100 border rounded-lg px-3 py-1 font-semibold text-sm cursor-pointer"
                  >
                    <option value="regular">Regular</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="p-5 text-right">
                  <button onClick={() => deletarUsuario(u.id)} className="text-red-400 hover:text-red-600 text-sm font-semibold">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CadastroUsuarios