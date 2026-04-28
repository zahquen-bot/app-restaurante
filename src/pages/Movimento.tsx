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
  const [isResumoVisible, setIsResumoVisible] = useState(window.innerWidth > 768)
  
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsResumoVisible(false)
      } else {
        setIsResumoVisible(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
    await supabase.from('movimentacoes').update({ [campo]: valor }).eq('id', id)
    fetchDados()
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
    <div className={`mx-auto flex flex-col ${isGridExpanded ? 'fixed inset-0 z-50 bg-white p-4 max-w-full' : 'max-w-7xl min-h-screen p-2'}`}>
      
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
        <button onClick={() => setIsFormVisible(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm">NOVO</button>
        <button onClick={() => setIsFilterVisible(!isFilterVisible)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold shadow-sm"><span>⚙️</span> FILTRO</button>
      </div>

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


      

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-grow min-h-0 pb-20">
        <div className="overflow-y-auto flex-grow w-full">
          <table className="w-full text-left text-sm table-auto">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                <th className="p-2 cursor-pointer" onClick={() => requestSort('data')}>Data/Hora</th>
                <th className="p-2">Produto</th>
                <th className="p-2">Qtd</th>
                <th className="p-2">Total</th>
                <th className="p-2 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              

{movimentosFiltrados.map(m => {
    const produto = produtos.find(p => p.id === m.produto_id);
    const valorTotal = m.quantidade * Number(produto?.preco_venda || 0);
    
    const verObs = () => {
  if (m.observacao && m.observacao.trim() !== '') {
    // Usando o Notiflix Report para mostrar a observação
    Notiflix.Report.info(
      'Observação',
      m.observacao,
      'Fechar'
    );
  } else {
    // Usando o Notify para um aviso rápido que some sozinho
    Notiflix.Notify.failure('Este item não possui observações.');
  }
};

    return (
      <tr key={m.id} className="border-b hover:bg-gray-50">
        <td className="p-2 text-xs">{new Date(m.data).toLocaleString('pt-BR').substring(11)}</td>
        
        {/* AQUI ESTÁ A MUDANÇA: Verifica se tem observação para adicionar o * */}
        <td className="p-2 whitespace-nowrap" onClick={verObs}>
          {m.observacao && m.observacao.trim() !== '' ? '* ' : ''}{produto?.nome}
        </td>

        <td className="p-2">
          <input 
            type="number" 
            min="1"
            value={m.quantidade} 
            onChange={(e) => { 
              const val = e.target.value;
              const newMovs = movimentos.map(mov => 
                mov.id === m.id ? { ...mov, quantidade: val === "" ? "" : Number(val) } : mov
              ); 
              setMovimentos(newMovs); 
            }} 
            onBlur={(e) => {
              const val = e.target.value === "" ? 1 : Number(e.target.value);
              atualizarMovimento(m.id, 'quantidade', val.toString());
            }}
            className="w-12 border rounded p-1" 
          />
        </td>
        <td className="p-2 whitespace-nowrap">R$ {valorTotal.toFixed(2)}</td>
        <td className="p-2 text-right"><button onClick={() => excluirMovimento(m.id)} className="text-red-500 font-bold">✕</button></td>
      </tr>
    )
  })}

            </tbody>
          </table>
        </div>
        
        {/* Rodapé de totais restaurado conforme solicitado */}
        {isAdmin && (
          <div className="bg-gray-100 border-t p-3 font-bold flex justify-between shrink-0 text-sm">
            <span>TOTAIS ({movimentosFiltrados.length})</span>
            <span>Qtd: {movimentosFiltrados.reduce((acc, m) => acc + (Number(m.quantidade) || 0), 0)} | Valor: R$ {movimentosFiltrados.reduce((acc, m) => acc + (m.quantidade * (produtos.find(p => p.id === m.produto_id)?.preco_venda || 0)), 0).toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Movimento