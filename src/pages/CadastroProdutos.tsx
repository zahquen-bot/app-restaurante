import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom' // Importado para redirecionar
import { supabase } from '../lib/supabaseClient'

const CadastroProdutos = () => {
  const [produtos, setProdutos] = useState<any[]>([])
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [marca, setMarca] = useState('')
  const [embalagem, setEmbalagem] = useState('')
  const [favorito, setFavorito] = useState(false)
  
  // Estados de segurança
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true) // Garante que começa carregando
      
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
        await fetchProdutos() // O 'await' aqui é a chave!
      } else {
        alert("Acesso restrito a administradores!")
        navigate('/movimento')
      }
      setLoading(false) // Só libera a tela quando TUDO terminou
    }
    checkAccess()
  }, [navigate])

  const fetchProdutos = async () => {
    const { data } = await supabase.from('produtos').select('*').order('nome')
    if (data) setProdutos(data)
  }

  const cadastrar = async () => {
    if (!nome || !preco) return
    await supabase.from('produtos').insert([{ nome, preco_venda: preco, marca, embalagem, favorito }])
    setNome(''); setPreco(''); setMarca(''); setEmbalagem(''); setFavorito(false)
    fetchProdutos()
  }

  const excluir = async (id: string) => {
    await supabase.from('produtos').delete().eq('id', id)
    fetchProdutos()
  }

  // Se ainda estiver carregando, mostra uma tela de espera
  if (loading) return (
    <div className="flex justify-center items-center h-screen text-gray-500 font-semibold">
      Verificando permissões de administrador...
    </div>
  )
  
  // Se não for admin, não mostra nada (o navigate já vai ter movido ele)
  if (!isAdmin) return null

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Produtos</h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="Nome do produto" value={nome} onChange={e => setNome(e.target.value)} className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none py-2 transition-colors" />
          <input type="number" placeholder="Preço (R$)" value={preco} onChange={e => setPreco(e.target.value)} className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none py-2" />
          <input placeholder="Marca" value={marca} onChange={e => setMarca(e.target.value)} className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none py-2" />
          <input placeholder="Embalagem (ex: Lata 350ml)" value={embalagem} onChange={e => setEmbalagem(e.target.value)} className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none py-2" />
        </div>
        <div className="flex items-center justify-between mt-6">
          <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
            <input type="checkbox" checked={favorito} onChange={e => setFavorito(e.target.checked)} className="w-5 h-5 accent-blue-600" />
            Favorito
          </label>
          <button onClick={cadastrar} className="bg-blue-600 text-white px-8 py-2.5 rounded-full font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
            Cadastrar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
            <tr><th className="p-5">Produto</th><th className="p-5">Detalhes</th><th className="p-5">Preço</th><th className="p-5 text-right">Ações</th></tr>
          </thead>
          <tbody>
            {produtos.map(p => (
              <tr key={p.id} className="border-t hover:bg-gray-50 transition-colors">
                <td className="p-5 font-medium text-gray-800 flex items-center gap-2">
                  {p.nome} {p.favorito && <span className="text-yellow-400 text-lg">★</span>}
                </td>
                <td className="p-5 text-sm text-gray-500">{p.marca} {p.embalagem ? `(${p.embalagem})` : ''}</td>
                <td className="p-5 font-bold text-blue-600">R$ {Number(p.preco_venda).toFixed(2)}</td>
                <td className="p-5 text-right">
                  <button onClick={() => excluir(p.id)} className="text-red-400 hover:text-red-600 text-sm font-semibold">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CadastroProdutos