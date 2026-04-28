import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const CadastroProdutos = () => {
  const [produtos, setProdutos] = useState<any[]>([])
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [marca, setMarca] = useState('')
  const [embalagem, setEmbalagem] = useState('')
  const [favorito, setFavorito] = useState(false)
  
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || data?.role?.trim().toLowerCase() !== 'admin') {
        navigate('/');
      } else {
        setIsAdmin(true);
        await fetchProdutos();
      }
      setLoading(false);
    };
    checkAccess();
  }, [navigate]);

  const fetchProdutos = async () => {
    const { data } = await supabase.from('produtos').select('*').order('nome')
    if (data) setProdutos(data)
  }

  const atualizarCampo = async (id: string, campo: string, valor: any) => {
    await supabase.from('produtos').update({ [campo]: valor }).eq('id', id)
    fetchProdutos()
  }

  const prepararEdicao = (p: any) => {
    setEditandoId(p.id)
    setNome(p.nome)
    setPreco(p.preco_venda)
    setMarca(p.marca || '')
    setEmbalagem(p.embalagem || '')
    setFavorito(p.favorito)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const salvarProduto = async () => {
    if (!nome || !preco) return

    if (editandoId) {
      await supabase.from('produtos')
        .update({ nome, preco_venda: preco, marca, embalagem, favorito })
        .eq('id', editandoId)
      setEditandoId(null)
    } else {
      await supabase.from('produtos')
        .insert([{ nome, preco_venda: preco, marca, embalagem, favorito }])
    }
    
    setNome(''); setPreco(''); setMarca(''); setEmbalagem(''); setFavorito(false)
    fetchProdutos()
  }

  const excluir = async (id: string) => {
    const { data: movimentacoes, error } = await supabase
      .from('movimentacoes')
      .select('id')
      .eq('produto_id', id)
      .limit(1);

    if (error) {
      alert("Erro ao verificar vínculo com movimentações.");
      return;
    }

    if (movimentacoes && movimentacoes.length > 0) {
      alert("Não é possível excluir este produto pois ele já possui lançamentos em Movimentos!");
      return;
    }

    await supabase.from('produtos').delete().eq('id', id);
    fetchProdutos();
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Carregando...</div>
  if (!isAdmin) return null

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        {editandoId ? 'Editando Produto' : 'Cadastro de Produtos'}
      </h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="Nome do produto" value={nome} onChange={e => setNome(e.target.value)} className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none py-2" />
          <input type="number" placeholder="Preço (R$)" value={preco} onChange={e => setPreco(e.target.value)} className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none py-2" />
          <input placeholder="Marca" value={marca} onChange={e => setMarca(e.target.value)} className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none py-2" />
          <input placeholder="Embalagem (ex: Lata 350ml)" value={embalagem} onChange={e => setEmbalagem(e.target.value)} className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none py-2" />
        </div>
        <div className="flex items-center justify-between mt-6">
          <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
            <input type="checkbox" checked={favorito} onChange={e => setFavorito(e.target.checked)} className="w-5 h-5 accent-blue-600" /> Favorito
          </label>
          <div className="flex gap-2">
            {editandoId && (
              <button onClick={() => {setEditandoId(null); setNome(''); setPreco(''); setMarca(''); setEmbalagem(''); setFavorito(false)}} className="text-gray-500 px-6 py-2.5 rounded-full font-semibold">Cancelar</button>
            )}
            <button onClick={salvarProduto} className="bg-blue-600 text-white px-8 py-2.5 rounded-full font-semibold hover:bg-blue-700">
              {editandoId ? 'Confirmar Edição' : 'Cadastrar'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabela com scroll horizontal para mobile */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
              <tr>
                <th className="p-5">Produto</th>
                <th className="p-5">Detalhes</th>
                <th className="p-5">Preço</th>
                <th className="p-5 text-center">Fav</th>
                <th className="p-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map(p => (
                <tr key={p.id} className="border-t hover:bg-gray-50 text-gray-700">
                  <td className="p-5">{p.nome}</td>
                  <td className="p-5 text-sm text-gray-500">{p.marca} {p.embalagem ? `(${p.embalagem})` : ''}</td>
                  <td className="p-5">R$ {Number(p.preco_venda).toFixed(2)}</td>
                  <td className="p-5 text-center cursor-pointer text-xl" onClick={() => atualizarCampo(p.id, 'favorito', !p.favorito)}>
                    {p.favorito ? '★' : '☆'}
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => prepararEdicao(p)} className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 font-bold text-sm transition-colors whitespace-nowrap">
                        Editar
                      </button>
                      <button onClick={() => excluir(p.id)} className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-bold text-sm transition-colors whitespace-nowrap">
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default CadastroProdutos