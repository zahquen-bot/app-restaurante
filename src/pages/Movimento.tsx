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
    <div className="max-w-5xl mx-auto p-6 flex flex-col h-[90vh]">
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0">
        {favoritos.map(f => (
          <button key={f.id} onClick={() => registrar(f.id, 1)} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow whitespace-nowrap">
            {f.nome}
          </button>
        ))}
      </div>

      {/* --- INÍCIO DA ÁREA DO FORMULÁRIO CORRIGIDA --- */}
<div className="bg-blue-50 p-4 rounded-xl shadow-sm border-2 border-blue-200 mb-4 shrink-0">
  {/* Container principal: grid em 1 coluna no mobile, flex em linha no desktop (md:) */}
  <div className="grid grid-cols-1 gap-3 md:flex md:items-center md:gap-2">
    
    {/* Campo Produto: w-full no mobile, w-1/4 no desktop */}
    <select 
      onChange={e => setProdutoId(e.target.value)} 
      className="w-full md:w-1/4 border p-2 rounded-lg text-sm bg-white" 
      value={produtoId}
    >
      <option value="">Produto...</option>
      {produtosOrdenados.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
    </select>

    {/* Container para Qtd e Tipo ficarem lado a lado no mobile, mas em linha no desktop */}
    <div className="grid grid-cols-2 gap-2 md:flex md:gap-2 md:items-center">
      {/* Campo Qtd: ocupa metade no mobile, w-16 no desktop */}
      <input 
        type="number" 
        value={qtd} 
        onChange={e => setQtd(e.target.value)} 
        className="w-full md:w-16 border p-2 rounded-lg text-sm bg-white" 
        placeholder="Qtd"
      />
      
      {/* Campo Tipo: ocupa metade no mobile, automático no desktop */}
      <select 
        onChange={e => setModalidade(e.target.value)} 
        className="w-full md:w-auto border p-2 rounded-lg text-sm bg-white" 
        value={modalidade}
      >
        <option value="balcao">Balcão</option>
        <option value="delivery">Delivery</option>
      </select>
    </div>

    {/* Container para Pagto e Obs ficarem em fluxo normal (vertical no mobile, horizontal no desktop) */}
    <div className="grid grid-cols-1 gap-3 md:flex md:flex-1 md:gap-2 md:items-center">
      {/* Campo Pagto: w-full no mobile, automático no desktop */}
      <select 
        onChange={e => setPagto(e.target.value)} 
        className="w-full md:w-auto border p-2 rounded-lg text-sm bg-white" 
        value={pagto}
      >
        <option value="dinheiro">Dinheiro</option>
        <option value="pix">Pix</option>
        <option value="cartao">Cartão</option>
      </select>
      
      {/* Campo Obs: w-full no mobile, flex-1 no desktop para ocupar o resto */}
      <input 
        placeholder="Obs..." 
        value={observacao} 
        onChange={e => setObservacao(e.target.value)} 
        className="w-full md:flex-1 border p-2 rounded-lg text-sm bg-white" 
      />
    </div>

    {/* Botão Registrar: w-full no mobile, w-auto no desktop */}
    <button 
      onClick={() => registrar(produtoId)} 
      className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow hover:bg-blue-700 transition-colors"
    >
      Registrar
    </button>
  </div>
</div>
{/* --- FIM DA ÁREA DO FORMULÁRIO CORRIGIDA --- */}

      <div className="flex gap-2 mb-4 shrink-0 text-sm">
        <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} className="border p-1 rounded-lg bg-gray-50" />
        <select value={filtroProd} onChange={e => setFiltroProd(e.target.value)} className="border p-1 rounded-lg bg-gray-50"><option value="">Prod</option>{produtosOrdenados.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="border p-1 rounded-lg bg-gray-50"><option value="">Tipo</option><option value="balcao">Balcão</option><option value="delivery">Delivery</option></select>
        <select value={filtroPagto} onChange={e => setFiltroPagto(e.target.value)} className="border p-1 rounded-lg bg-gray-50"><option value="">Pagto</option><option value="dinheiro">Dinheiro</option><option value="pix">Pix</option><option value="cartao">Cartão</option></select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-grow min-h-0">
  {/* Adicionado overflow-x-auto abaixo */}
  <div className="overflow-y-auto flex-grow overflow-x-auto">
    {/* Adicionado min-w-[650px] abaixo */}
    <table className="w-full min-w-[650px] text-left text-sm">
      <thead className="bg-gray-50 border-b sticky top-0 z-10">
        <tr>
          <th className="p-4">Produto</th>
          <th className="p-4">Qtd</th>
          <th className="p-4">Tipo</th>
          <th className="p-4">Pagto</th>
          <th className="p-4">Obs</th>
          <th className="p-4">Data/Hora</th>
          <th className="p-4 text-right">Ação</th>
        </tr>
      </thead>
      <tbody>
        {movimentosFiltrados.map(m => (
          <tr key={m.id} className="border-b hover:bg-gray-50 text-gray-700">
            <td className="p-4 whitespace-nowrap">{produtos.find(p => p.id === m.produto_id)?.nome}</td>
            <td className="p-4">{m.quantidade}</td>
            <td className="p-4">
              <select value={m.modalidade} onChange={(e) => atualizarMovimento(m.id, 'modalidade', e.target.value)} className="bg-transparent cursor-pointer">
                <option value="balcao">Balcão</option>
                <option value="delivery">Delivery</option>
              </select>
            </td>
            <td className="p-4">
              <select value={m.forma_pagto} onChange={(e) => atualizarMovimento(m.id, 'forma_pagto', e.target.value)} className="bg-transparent cursor-pointer">
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">Pix</option>
                <option value="cartao">Cartão</option>
              </select>
            </td>
            <td className="p-4">
              <textarea 
                value={m.observacao || ''} 
                onChange={(e) => { const newMovs = movimentos.map(mov => mov.id === m.id ? {...mov, observacao: e.target.value} : mov); setMovimentos(newMovs); }} 
                onBlur={(e) => atualizarMovimento(m.id, 'observacao', e.target.value)} 
                className="bg-transparent w-full min-w-[100px] border-none focus:ring-1 focus:ring-blue-500 rounded p-1 text-sm resize-none overflow-hidden" 
                rows={1} 
                onFocus={(e) => e.target.rows = 3} 
                onBlur={(e) => e.target.rows = 1} 
              />
            </td>
            <td className="p-4 font-mono text-gray-500 whitespace-nowrap">{new Date(m.data).toLocaleString('pt-BR')}</td>
            <td className="p-4 text-right">
              <button onClick={() => excluirMovimento(m.id)} className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-bold transition-colors">
                Excluir
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  
  {isAdmin && (
    <div className="bg-gray-100 border-t p-3 font-bold flex justify-between shrink-0 text-sm">
      <span>TOTAIS ({movimentosFiltrados.length})</span>
      <span>
        Qtd: {movimentosFiltrados.reduce((acc, m) => acc + (Number(m.quantidade) || 0), 0)} | 
        Valor: R$ {movimentosFiltrados.reduce((acc, m) => acc + (m.quantidade * (produtos.find(p => p.id === m.produto_id)?.preco_venda || 0)), 0).toFixed(2)}
      </span>
    </div>
  )}
</div>

      {isAdmin && (
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 shrink-0">
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