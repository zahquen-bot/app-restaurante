import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

const Movimento = () => {
  const [produtos, setProdutos] = useState<any[]>([])
  const [favoritos, setFavoritos] = useState<any[]>([])
  const [movimentos, setMovimentos] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true) // Adicione esta linha aqui
  
  const [produtoId, setProdutoId] = useState('')
  const [qtd, setQtd] = useState('1')
  const [modalidade, setModalidade] = useState('balcao')
  const [pagto, setPagto] = useState('dinheiro')
  const [observacao, setObservacao] = useState('')
  
  const [filtroProd, setFiltroProd] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroPagto, setFiltroPagto] = useState('')
  const [filtroData, setFiltroData] = useState(new Date().toISOString().split('T')[0])

  const produtosOrdenados = useMemo(() => {
    return [...produtos].sort((a, b) => a.nome.localeCompare(b.nome))
  }, [produtos])

  useEffect(() => {
    checkUserRole()
    fetchDados()
  }, [])

  const checkUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id); // O ID DO AUTH TEM QUE SER IGUAL AO DA TABELA

    if (error) {
      console.error("Erro do Banco:", error.message);
    } else if (!data || data.length === 0) {
      console.error("ALERTA: Usuário logado", user.email, "não foi encontrado na tabela 'profiles'!");
      console.error("ID que está tentando buscar:", user.id);
    } else {
      console.log("Role encontrado:", data[0].role);
      setIsAdmin(data[0].role.trim().toLowerCase() === 'admin');
    }
  }
  setLoading(false);
};

  const fetchDados = async () => {
    const { data: prod } = await supabase.from('produtos').select('*')
    if (prod) {
      setProdutos(prod)
      setFavoritos(prod.filter(p => p.favorito))
    }
    const { data: mov } = await supabase
      .from('movimentacoes')
      .select('*')
      .order('data', { ascending: false })
      .limit(200)
    if (mov) setMovimentos(mov)
  }

  const registrar = async (id: string, quantidade: number = parseInt(qtd)) => {
    if (!id) return
    const { error } = await supabase.from('movimentacoes').insert([{
      produto_id: id, quantidade: quantidade, modalidade, forma_pagto: pagto, observacao
    }])
    if (!error) { 
      setQtd('1'); setObservacao(''); 
      setFiltroData(new Date().toISOString().split('T')[0]);
      setFiltroProd(''); setFiltroTipo(''); setFiltroPagto('');
      fetchDados(); 
    }
  }

  const atualizarMovimento = async (id: string, campo: string, valor: string) => {
    await supabase.from('movimentacoes').update({ [campo]: valor }).eq('id', id)
    fetchDados()
  }

  const excluirMovimento = async (id: string) => {
    await supabase.from('movimentacoes').delete().eq('id', id)
    fetchDados()
  }

  const movimentosFiltrados = useMemo(() => {
    return movimentos.filter(m => {
      const matchProd = filtroProd ? m.produto_id === filtroProd : true
      const matchTipo = filtroTipo ? m.modalidade === filtroTipo : true
      const matchPagto = filtroPagto ? m.forma_pagto === filtroPagto : true
      const dataMov = new Date(m.data).toISOString().split('T')[0]
      const matchData = filtroData ? dataMov === filtroData : true
      return matchProd && matchTipo && matchPagto && matchData
    })
  }, [movimentos, filtroProd, filtroTipo, filtroPagto, filtroData])

  



return (
  <div className="max-w-5xl mx-auto p-4 md:p-6">
    {/* Favoritos */}
    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
      {favoritos.map(f => (
        <button key={f.id} onClick={() => registrar(f.id, 1)} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow whitespace-nowrap">
          {f.nome}
        </button>
      ))}
    </div>

    {/* Filtros e Inputs - SEM HEIGHT FIXO */}
    <div className="bg-blue-50 p-4 rounded-xl shadow-sm border-2 border-blue-200 mb-4 flex flex-col md:flex-row gap-2">
       {/* ... (seus selects e inputs aqui) ... */}
       <button onClick={() => registrar(produtoId)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm">Registrar</button>
    </div>

    {/* GRID SEM FLEX-GROW OU HEIGHTS FIXOS */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto mb-6">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="bg-gray-50 border-b">
          <tr><th className="p-4">Produto</th><th className="p-4">Qtd</th><th className="p-4">Ação</th></tr>
        </thead>
        <tbody>
          {movimentosFiltrados.map(m => (
            <tr key={m.id} className="border-b">
              <td className="p-4">{produtos.find(p => p.id === m.produto_id)?.nome}</td>
              <td className="p-4">{m.quantidade}</td>
              <td className="p-4"><button onClick={() => excluirMovimento(m.id)}>Excluir</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* TOTAIS */}
    {isAdmin && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 shrink-0">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500 text-xs uppercase font-bold">Total em Dinheiro</p>
            <p className="text-2xl font-bold text-green-600">R$ {movimentosFiltrados.filter(m => m.forma_pagto === 'dinheiro').reduce((acc, m) => acc + (m.quantidade * (produtos.find(p => p.id === m.produto_id)?.preco_venda || 0)), 0).toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500 text-xs uppercase font-bold">Total em PIX</p>
            <p className="text-2xl font-bold text-blue-600">R$ {movimentosFiltrados.filter(m => m.forma_pagto === 'pix').reduce((acc, m) => acc + (m.quantidade * (produtos.find(p => p.id === m.produto_id)?.preco_venda || 0)), 0).toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500 text-xs uppercase font-bold">Total em Cartão</p>
            <p className="text-2xl font-bold text-purple-600">R$ {movimentosFiltrados.filter(m => m.forma_pagto === 'cartao').reduce((acc, m) => acc + (m.quantidade * (produtos.find(p => p.id === m.produto_id)?.preco_venda || 0)), 0).toFixed(2)}</p>
          </div>
        </div>
    )}
  </div>
)
}

export default Movimento