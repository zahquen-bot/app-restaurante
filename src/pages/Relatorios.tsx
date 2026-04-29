import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

const Relatorios = () => {
  const [movimentos, setMovimentos] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0])
  const [modoPeriodo, setModoPeriodo] = useState(false)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date().toLocaleTimeString())

  useEffect(() => {
    fetchDados()
    const interval = setInterval(fetchDados, 300000)
    return () => clearInterval(interval)
  }, [])

  const fetchDados = async () => {
    const { data: prod } = await supabase.from('produtos').select('*')
    const { data: mov } = await supabase.from('movimentacoes').select('*')
    if (prod) setProdutos(prod)
    if (mov) {
      setMovimentos([...mov])
      setUltimaAtualizacao(new Date().toLocaleTimeString())
    }
  }

  const mudarData = (tipo: 'inicio' | 'fim', direcao: -1 | 1) => {
    const dInicio = new Date(dataInicio);
    const dFim = new Date(dataFim);
    
    if (tipo === 'inicio') {
      dInicio.setDate(dInicio.getDate() + direcao);
      const novaData = dInicio.toISOString().split('T')[0];
      setDataInicio(novaData);
      if (!modoPeriodo) setDataFim(novaData);
    } else {
      dFim.setDate(dFim.getDate() + direcao);
      const novaData = dFim.toISOString().split('T')[0];
      setDataFim(novaData);
      if (!modoPeriodo) setDataInicio(novaData);
    }
  };

  const relatorio = useMemo(() => {
    const hoje = dataInicio;
    const ontem = new Date(new Date(hoje).setDate(new Date(hoje).getDate() - 1)).toISOString().split('T')[0];

    const filtrarPorData = (data: string) => movimentos.filter(m => new Date(m.data).toISOString().split('T')[0] === data);
    
    const calcularResumo = (lista: any[]) => lista.reduce((acc, m) => {
      const p = produtos.find(p => p.id === m.produto_id)
      const preco = Number(p?.preco_venda || 0)
      const valor = m.quantidade * preco
      acc.total += valor
      acc.pagtos[m.forma_pagto] = { 
        qtd: (acc.pagtos[m.forma_pagto]?.qtd || 0) + 1, 
        valor: (acc.pagtos[m.forma_pagto]?.valor || 0) + valor 
      };
      acc.modalidades[m.modalidade] = {
        qtd: (acc.modalidades[m.modalidade]?.qtd || 0) + 1,
        valor: (acc.modalidades[m.modalidade]?.valor || 0) + valor
      }
      acc.produtos[p?.nome || 'Outros'] = {
        qtd: (acc.produtos[p?.nome || 'Outros']?.qtd || 0) + m.quantidade,
        valor: (acc.produtos[p?.nome || 'Outros']?.valor || 0) + valor
      }
      return acc
    }, { total: 0, pagtos: {}, modalidades: {}, produtos: {} })

    const filtrados = movimentos.filter(m => {
      const d = new Date(m.data).toISOString().split('T')[0]
      return d >= dataInicio && d <= dataFim
    })

    const resumo = calcularResumo(filtrados);
    const dadosOntem = calcularResumo(filtrarPorData(ontem));
    
    // Cálculos de Performance
    const totalHoje = resumo.total;
    const totalOntem = dadosOntem.total;
    const variacaoFaturamento = totalOntem > 0 ? ((totalHoje - totalOntem) / totalOntem) * 100 : 0;
    
    const ticketHoje = filtrados.length > 0 ? (resumo.total / filtrados.length) : 0;
    const ticketOntem = dadosOntem.total > 0 ? (dadosOntem.total / filtrarPorData(ontem).length) : 0;
    const variacaoTicket = ticketOntem > 0 ? (ticketHoje - ticketOntem) : ticketHoje;

    const receitaProdutos = Object.entries(resumo.produtos)
      .map(([nome, dados]: any) => ({ nome, ...dados }))
      .sort((a, b) => b.valor - a.valor);

    return { 
        resumo, 
        totalPeriodo: resumo.total, 
        ticketMedio: ticketHoje, 
        variacaoFaturamento,
        variacaoTicket,
        temDadosOntem: totalOntem > 0, 
        receitaProdutos 
    }
  }, [movimentos, produtos, dataInicio, dataFim, modoPeriodo])

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-end mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-xs text-gray-400">Atualizado: {ultimaAtualizacao}</p>
      </div>
      
      <div className="flex justify-center mb-8">
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
          <button onClick={() => setModoPeriodo(!modoPeriodo)} className={`px-3 py-1 text-[10px] font-bold rounded-lg ${modoPeriodo ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {modoPeriodo ? 'PERÍODO' : 'DIA ÚNICO'}
          </button>
          <div className="flex items-center gap-2 border-l pl-2">
            <button onClick={() => mudarData('inicio', -1)} className="p-2 hover:bg-gray-100 rounded-lg">◀</button>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="font-bold text-sm text-gray-800" />
            {modoPeriodo && (<><span className="text-gray-400">até</span><input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="font-bold text-sm text-gray-800" /></>)}
            <button onClick={() => mudarData(modoPeriodo ? 'fim' : 'inicio', 1)} className="p-2 hover:bg-gray-100 rounded-lg">▶</button>
          </div>
        </div>
      </div>

      {/* CARD PRINCIPAL (Agora com a variação do Ticket Médio incluída) */}
<div className="bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg flex justify-between items-center text-white mb-6">
  <div>
    <p className="text-slate-300 text-[10px] md:text-sm font-bold uppercase">Total do Período</p>
    <h2 className="text-3xl md:text-4xl font-black mb-1">R$ {relatorio.totalPeriodo.toFixed(2)}</h2>
    <p className={`text-[10px] md:text-xs ${relatorio.variacaoFaturamento >= 0 ? 'text-green-400' : 'text-red-400'}`}>
      {relatorio.temDadosOntem ? `↑ ${relatorio.variacaoFaturamento.toFixed(0)}% vs ontem` : '-- vs ontem'}
    </p>
  </div>
  <div className="text-right">
    <p className="text-slate-300 text-[10px] md:text-sm font-bold uppercase">Ticket Médio</p>
    <h2 className="text-xl md:text-2xl font-bold mb-1">R$ {relatorio.ticketMedio.toFixed(2)}</h2>
    {/* AQUI ESTÁ O INDICADOR COMPARADOR QUE FALTAVA */}
    <p className={`text-[10px] md:text-xs ${relatorio.variacaoTicket >= 0 ? 'text-green-400' : 'text-red-400'}`}>
      {relatorio.temDadosOntem ? `↑ R$ ${relatorio.variacaoTicket.toFixed(2)} vs ontem` : '-- vs ontem'}
    </p>
  </div>
</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Receita por Pagamento */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-500 uppercase text-xs mb-4">Receita por Pagamento</h3>
          {Object.entries(relatorio.resumo.pagtos).map(([metodo, d]: any) => (
            <div key={metodo} className="mb-4">
              <div className="flex justify-between text-xs font-bold mb-1 uppercase">
                <span>{metodo} ({d.qtd})</span>
                <span>R$ {d.valor.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${relatorio.totalPeriodo > 0 ? (d.valor / relatorio.totalPeriodo) * 100 : 0}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Modalidade */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-500 uppercase text-xs mb-4">Receita por Modalidade</h3>
          {Object.entries(relatorio.resumo.modalidades).map(([mod, d]: any) => (
            <div key={mod} className="mb-4">
              <div className="flex justify-between text-xs font-bold mb-1 uppercase">
                <span>{mod} ({d.qtd})</span>
                <span>R$ {d.valor.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full rounded-full" style={{ width: `${relatorio.totalPeriodo > 0 ? (d.valor / relatorio.totalPeriodo) * 100 : 0}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Receita por Produto */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-500 uppercase text-xs mb-4">Receita por Produto</h3>
          {relatorio.receitaProdutos.slice(0, 6).map((p: any) => (
            <div key={p.nome} className="mb-4">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>{p.nome} ({p.qtd})</span>
                <span>R$ {p.valor.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${relatorio.totalPeriodo > 0 ? (p.valor / relatorio.totalPeriodo) * 100 : 0}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Relatorios