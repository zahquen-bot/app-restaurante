import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import Notiflix from 'notiflix';

const Movimento = () => {
  const [produtos, setProdutos] = useState<any[]>([])
  const [favoritos, setFavoritos] = useState<any[]>([])
  const [movimentos, setMovimentos] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isRegistrando, setIsRegistrando] = useState(false)
  
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [isFilterVisible, setIsFilterVisible] = useState(false)
  const [isGridExpanded, setIsGridExpanded] = useState(false)
  
  const [sortConfig, setSortConfig] = useState({ key: 'data', direction: 'desc' })

  const [produtoId, setProdutoId] = useState('')
  const [qtd, setQtd] = useState('1')
  const [modalidade, setModalidade] = useState('balcao')
  const [pagto, setPagto] = useState('dinheiro')
  const [observacao, setObservacao] = useState('')
  
  const [filtroProd, setFiltroProd] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroPagto, setFiltroPagto] = useState('')
  const [filtroData, setFiltroData] = useState(new Date().toISOString().split('T')[0])
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const [editingMovimento, setEditingMovimento] = useState<any>(null);
  const [modoEdicao, setModoEdicao] = useState<'editar' | 'excluir'>('editar');

  

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
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id);
      if (data && data.length > 0) {
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

  const requestSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const registrar = async (id: string, quantidade: number = parseInt(qtd)) => {
    if (!id) return
    setIsRegistrando(true)
    const { error } = await supabase.from('movimentacoes').insert([{
      produto_id: id, quantidade: quantidade, modalidade, forma_pagto: pagto, observacao: observacao
    }])
    if (!error) { 
      setQtd('1'); 
      await fetchDados(); 
    }
    setIsRegistrando(false)
  }

  const atualizarMovimento = async (id: string, campo: string, valor: string) => {
    await supabase.from('movimentacoes').update({ [campo]: valor }).eq('id', editingMovimento.id);
    fetchDados()
    setHighlightId(editingMovimento.id);
    setTimeout(() => setHighlightId(null), 2000); // O destaque some após 2 segundos
    setEditingMovimento(null);
  }

  const excluirMovimento = async (id: string) => {
    await supabase.from('movimentacoes').delete().eq('id', id)
    fetchDados()
  }

  const movimentosFiltrados = useMemo(() => {
    let filtrados = movimentos.filter(m => {
      const matchProd = filtroProd ? m.produto_id === filtroProd : true
      const matchTipo = filtroTipo ? m.modalidade === filtroTipo : true
      const matchPagto = filtroPagto ? m.forma_pagto === filtroPagto : true
      const dataMov = new Date(m.data).toISOString().split('T')[0]
      const matchData = filtroData ? dataMov === filtroData : true
      return matchProd && matchTipo && matchPagto && matchData
    })

    return filtrados.sort((a, b) => {
      const valA = new Date(a.data).getTime();
      const valB = new Date(b.data).getTime();
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    })
  }, [movimentos, filtroProd, filtroTipo, filtroPagto, filtroData, sortConfig])


  return (
    <div className={`mx-auto flex flex-col h-screen ${isGridExpanded ? 'fixed inset-0 z-50 bg-white p-4 max-w-full' : 'max-w-7xl p-2'}`}>
      
      {isRegistrando && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full shadow-md text-xs font-medium flex items-center gap-2">
          <span className="animate-spin">⏳</span> Registrando...
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0">
        {favoritos.map(f => (
          <button 
            key={f.id} 
            onClick={() => registrar(f.id, 1)} 
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-orange-700 active:scale-90 transition-all whitespace-nowrap"
          >
            {f.nome}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-3 shrink-0">
        <button onClick={() => { setQtd('1'); setModalidade('balcao'); setObservacao(''); setIsFormVisible(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm">NOVO</button>
        <button onClick={() => setIsFilterVisible(!isFilterVisible)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold shadow-sm">FILTRO</button>
      </div>

      {isFormVisible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md relative">
            <button onClick={() => setIsFormVisible(false)} className="absolute top-2 right-2 p-2">✕</button>
            <h2 className="text-lg font-bold mb-4">Novo Registro</h2>
            <div className="grid grid-cols-1 gap-3">
              <select onChange={e => setProdutoId(e.target.value)} className="w-full border p-2 rounded-lg text-sm bg-white" value={produtoId}>
                <option value="">Produto...</option>
                {produtosOrdenados.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select value={qtd} onChange={e => setQtd(e.target.value)} className="w-full border p-2 rounded-lg text-sm bg-white">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(num => <option key={num} value={num}>{num}</option>)}
                </select>
                <select onChange={e => setModalidade(e.target.value)} className="w-full border p-2 rounded-lg text-sm bg-white" value={modalidade}>
                  <option value="balcao">Balcão</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
              <select onChange={e => setPagto(e.target.value)} className="w-full border p-2 rounded-lg text-sm bg-white" value={pagto}>
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">Pix</option>
                <option value="cartao">Cartão</option>
              </select>
              <input type="text" placeholder="Observação (opcional)" value={observacao} onChange={e => setObservacao(e.target.value)} className="w-full border p-2 rounded-lg text-sm bg-white col-span-2" />
              <button onClick={() => { registrar(produtoId); setIsFormVisible(false); }} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold mt-2">Registrar</button>
            </div>
          </div>
        </div>
      )}

      {isFilterVisible && (
        <div className="flex items-center gap-3 mb-4 shrink-0 text-sm animate-in fade-in slide-in-from-top-2">
          <span className="font-bold text-gray-700 min-w-[50px]">Filtros:</span>
          <div className="flex gap-2 overflow-x-auto pb-2 whitespace-nowrap">
            <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} className="border p-2 rounded-lg bg-gray-50 shrink-0" />
            <select value={filtroProd} onChange={e => setFiltroProd(e.target.value)} className="border p-2 rounded-lg bg-gray-50 shrink-0">
              <option value="">Prod</option>
              {produtosOrdenados.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="border p-2 rounded-lg bg-gray-50 shrink-0">
              <option value="">Tipo</option>
              <option value="balcao">Balcão</option>
              <option value="delivery">Delivery</option>
            </select>
            <select value={filtroPagto} onChange={e => setFiltroPagto(e.target.value)} className="border p-2 rounded-lg bg-gray-50 shrink-0">
              <option value="">Pagto</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">Pix</option>
              <option value="cartao">Cartão</option>
            </select>
          </div>
        </div>
      )}

      {/* CONTAINER DO GRID COM ROLAGEM E HEADER/FOOTER FIXOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-grow min-h-0">
        <div className="overflow-y-auto flex-grow w-full">
          <table className="w-full text-left text-sm table-auto border-collapse">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2 cursor-pointer" onClick={() => requestSort('data')}>Data/Hora</th>
                <th className="p-2">Produto</th>
                <th className="p-2">Qtd</th>
                <th className="p-2">Total</th>
                <th className="p-2 hidden md:table-cell">Modalidade</th>
                <th className="p-2 hidden md:table-cell">Pagamento</th>
                <th className="p-2 hidden md:table-cell">Obs</th>
                <th className="p-2 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {movimentosFiltrados.map(m => {
                const produto = produtos.find(p => p.id === m.produto_id);
                const valorTotal = m.quantidade * Number(produto?.preco_venda || 0);

                const editarRegistro = (m: any) => {
                    setEditingMovimento({ ...m }); // Clona o registro atual para edição
                };

                return (
                  <tr 
                    key={m.id} 

onClick={() => {
     setHighlightId(m.id); // Seleciona a linha
     editarRegistro(m);    // Abre o popup
  }}
  className={`border-b cursor-pointer transition-all duration-300 
    ${m.id === highlightId ? 'bg-yellow-100 ring-2 ring-yellow-300' : 'hover:bg-blue-50'}`
  }


                    >
                    <td className="p-2 text-[12px] text-gray-600">{m.id.slice(-6)}</td>


                    <td className="p-2 text-[12px] text-gray-600">
                      {/* Aparece apenas no Desktop (Data Completa) */}
                      <span className="hidden md:inline">
                        {new Date(m.data).toLocaleString('pt-BR')}
                      </span>
                      
                      {/* Aparece apenas no Mobile (Apenas Horário) */}
                      <span className="md:hidden">
                        {new Date(m.data).toLocaleString('pt-BR').substring(11)}
                      </span>
                    </td>
                    <td className="p-2 whitespace-nowrap cursor-pointer">
                       {m.observacao && m.observacao.trim() !== '' ? '* ' : ''}{produto?.nome}
                    </td>
                    <td className="p-2">
                      <input 
    type="number" 
    min="1"
    value={m.quantidade} 
    onClick={(e) => e.stopPropagation()} // Impede que o clique aqui abra o popup
    onChange={(e) => { 
      const val = e.target.value;
      setMovimentos(prev => prev.map(mov => mov.id === m.id ? { ...mov, quantidade: val === "" ? "" : Number(val) } : mov)); 
    }} 
    onBlur={(e) => {
      const val = e.target.value === "" ? 1 : Number(e.target.value);
      atualizarMovimento(m.id, 'quantidade', val.toString());
      setHighlightId(m.id);
      setTimeout(() => setHighlightId(null), 1000);
    }}
    className="w-12 border rounded p-1 text-center" 
  />





                    </td>
                    <td className="p-2 whitespace-nowrap">R$ {valorTotal.toFixed(2)}</td>
                  {/* 
                    <td className="p-2 hidden md:table-cell">
                      <select value={m.modalidade} onChange={(e) => atualizarMovimento(m.id, 'modalidade', e.target.value)} className="bg-transparent border-none cursor-pointer"><option value="balcao">Balcão</option><option value="delivery">Delivery</option></select>
                    </td>
                    <td className="p-2 hidden md:table-cell">
                      <select value={m.forma_pagto} onChange={(e) => atualizarMovimento(m.id, 'forma_pagto', e.target.value)} className="bg-transparent border-none cursor-pointer"><option value="dinheiro">Dinheiro</option><option value="pix">Pix</option><option value="cartao">Cartão</option></select>
                    </td> */}
                    <td className="p-2 hidden md:table-cell">{m.modalidade}</td>
                    <td className="p-2 hidden md:table-cell">{m.forma_pagto}</td>

                    <td className="p-2 hidden md:table-cell text-xs text-gray-600 italic">{m.observacao || '-'}</td>
                    <td className="p-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <button 
                         onClick={(e) => {
                          e.stopPropagation(); 
                          setModoEdicao('excluir');
                          setEditingMovimento(m);
                        }}
                        
                        className="text-red-500 font-bold">✕</button>



                        
                    </td>                    
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {isAdmin && (
          <div className="bg-gray-100 border-t p-3 font-bold flex justify-between shrink-0 text-sm">
            <span>TOTAIS ({movimentosFiltrados.length})</span>
            <span>Qtd: {movimentosFiltrados.reduce((acc, m) => acc + (Number(m.quantidade) || 0), 0)} | Valor: R$ {movimentosFiltrados.reduce((acc, m) => acc + (m.quantidade * (produtos.find(p => p.id === m.produto_id)?.preco_venda || 0)), 0).toFixed(2)}</span>
          </div>
        )}
      </div>

      {editingMovimento && (
  <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold">
          {modoEdicao === 'excluir' ? 'Confirmar Exclusão?' : 'Editar Lançamento'}
        </h2>
        <span className="text-[14px] font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
          ID: {editingMovimento.id.slice(-6)}
        </span>
      </div>

      <p className="text-[18px] font-bold text-blue-700 bg-blue-50 p-2 mb-4 rounded-lg border border-blue-100">
        {produtos.find(p => p.id === editingMovimento.produto_id)?.nome || 'Produto desconhecido'}
      </p>

      <div className="grid grid-cols-1 gap-3">
        {/* Linha combinada Qtd e Modalidade */}
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Quantidade</label>
            <input 
              disabled={modoEdicao === 'excluir'}
              type="number" 
              value={editingMovimento.quantidade} 
              onChange={e => setEditingMovimento({...editingMovimento, quantidade: e.target.value})} 
              className={`border p-2 rounded-lg w-full ${modoEdicao === 'excluir' ? 'bg-gray-100' : ''}`} 
            />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Modalidade</label>
            <select 
              disabled={modoEdicao === 'excluir'}
              value={editingMovimento.modalidade} 
              onChange={e => setEditingMovimento({...editingMovimento, modalidade: e.target.value})} 
              className={`border p-2 rounded-lg w-full ${modoEdicao === 'excluir' ? 'bg-gray-100' : ''}`}
            >
              <option value="balcao">Balcão</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>
        </div>

        <label className="text-[10px] font-bold text-gray-500 uppercase">Pagamento</label>
        <select 
          disabled={modoEdicao === 'excluir'}
          value={editingMovimento.forma_pagto} 
          onChange={e => setEditingMovimento({...editingMovimento, forma_pagto: e.target.value})} 
          className={`border p-2 rounded-lg ${modoEdicao === 'excluir' ? 'bg-gray-100' : ''}`}
        >
          <option value="dinheiro">Dinheiro</option>
          <option value="pix">Pix</option>
          <option value="cartao">Cartão</option>
        </select>

        <label className="text-[10px] font-bold text-gray-500 uppercase">Observação</label>
        <textarea 
          disabled={modoEdicao === 'excluir'}
          value={editingMovimento.observacao || ''} 
          onChange={e => setEditingMovimento({...editingMovimento, observacao: e.target.value})} 
          className={`border p-2 rounded-lg h-20 ${modoEdicao === 'excluir' ? 'bg-gray-100' : ''}`} 
        />

        <div className="flex gap-2 mt-4">
          <button 
            onClick={() => { setEditingMovimento(null); setModoEdicao('editar'); }} 
            className="flex-1 py-2 bg-gray-200 rounded-lg font-bold"
          >
            Cancelar
          </button>
          
          <button 
            onClick={async () => {
              if (modoEdicao === 'excluir') {
                await excluirMovimento(editingMovimento.id);
                Notiflix.Notify.success('Registro excluído!');
              } else {
                await supabase.from('movimentacoes').update({ 
                    quantidade: editingMovimento.quantidade,
                    modalidade: editingMovimento.modalidade,
                    forma_pagto: editingMovimento.forma_pagto,
                    observacao: editingMovimento.observacao
                }).eq('id', editingMovimento.id);
                fetchDados();
                setHighlightId(editingMovimento.id);
                setTimeout(() => setHighlightId(null), 2000);
                Notiflix.Notify.success('Atualizado!');
              }
              setEditingMovimento(null);
              setModoEdicao('editar');
            }} 
            className={`flex-1 py-2 rounded-lg font-bold text-white ${modoEdicao === 'excluir' ? 'bg-red-600' : 'bg-blue-600'}`}
          >
            {modoEdicao === 'excluir' ? 'EXCLUIR' : 'SALVAR'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}


    </div>
  )
}

export default Movimento