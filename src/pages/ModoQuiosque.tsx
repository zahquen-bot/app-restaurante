import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const ModoQuiosque = () => {
  const navigate = useNavigate()
  const [produtos, setProdutos] = useState<any[]>([])
  const [movimentos, setMovimentos] = useState<any[]>([])
  const [isRegistrando, setIsRegistrando] = useState(false)
  
  // Estados do Popup
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null)
  const [modalidade, setModalidade] = useState('balcao')
  const [formaPagto, setFormaPagto] = useState('dinheiro')
  const [quantidade, setQuantidade] = useState('1')
  const [observacao, setObservacao] = useState('')

  useEffect(() => {
    fetchDados()
  }, [])

  const fetchDados = async () => {
    const { data: prod } = await supabase.from('produtos').select('*')
    if (prod) setProdutos(prod.sort((a, b) => a.nome.localeCompare(b.nome)))

    const hoje = new Date().toISOString().split('T')[0]
    const { data: mov } = await supabase
      .from('movimentacoes')
      .select('*')
      .gte('data', `${hoje}T00:00:00`)
    if (mov) setMovimentos(mov)
  }

  const registrar = async () => {
    if (!produtoSelecionado) return
    
    setIsRegistrando(true)
    const { error } = await supabase.from('movimentacoes').insert([{
      produto_id: produtoSelecionado.id, 
      quantidade: parseInt(quantidade) || 1, 
      modalidade, 
      forma_pagto: formaPagto,
      observacao: observacao
    }])
    
    if (!error) await fetchDados()
    setIsRegistrando(false)
    setProdutoSelecionado(null)
    setQuantidade('1')
    setObservacao('')
  }

  const remover = async (id: string) => {
    const ultimo = movimentos
      .filter(m => m.produto_id === id)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];

    if (ultimo) {
      setIsRegistrando(true)
      await supabase.from('movimentacoes').delete().eq('id', ultimo.id)
      await fetchDados()
      setIsRegistrando(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-200 overflow-hidden">
      {/* Popup de Confirmação */}
      {produtoSelecionado && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl flex flex-col gap-3">
            <h2 className="font-bold text-lg text-slate-800">Confirmar: {produtoSelecionado.nome}</h2>
            
            {/* Linha combinada Qtd e Modalidade */}
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Qtd</label>
                <input type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="p-3 bg-slate-100 rounded-lg font-bold w-full" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Modalidade</label>
                <select value={modalidade} onChange={(e) => setModalidade(e.target.value)} className="p-3 bg-slate-100 rounded-lg font-bold w-full">
                  <option value="balcao">Balcão</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
            </div>

            <label className="text-xs font-bold text-slate-500 uppercase">Forma de Pagamento</label>
            <select value={formaPagto} onChange={(e) => setFormaPagto(e.target.value)} className="p-3 bg-slate-100 rounded-lg font-bold">
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">Pix</option>
              <option value="cartao">Cartão</option>
            </select>

            <label className="text-xs font-bold text-slate-500 uppercase">Observação</label>
            <input type="text" value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Opcional..." className="p-3 bg-slate-100 rounded-lg font-bold" />

            <div className="flex gap-2 mt-2">
              <button onClick={() => setProdutoSelecionado(null)} className="flex-1 py-3 bg-slate-200 rounded-lg font-bold">Cancelar</button>
              <button onClick={registrar} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold">Registrar</button>
            </div>
          </div>
        </div>
      )}

      {isRegistrando && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg text-xs font-medium flex items-center gap-2">
          <span className="animate-spin">⏳</span> Registrando...
        </div>
      )}

      <div className="flex justify-between items-center p-4 shrink-0 bg-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Modo Quiosque</h1>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-800 shadow-sm active:scale-95 transition-all">
          Voltar Gestão
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {produtos.map(p => {
            const qtdTotal = movimentos.filter(m => m.produto_id === p.id).reduce((acc, m) => acc + (Number(m.quantidade) || 0), 0);
            const valorTotal = qtdTotal * Number(p.preco_venda || 0);

            return (
              <div key={p.id} className="bg-slate-50 p-4 rounded-2xl shadow-sm border border-slate-300 flex flex-col items-center gap-1 relative">
                <div className="flex gap-2 w-full justify-between mb-2">
                  <button onClick={() => remover(p.id)} className="w-10 h-10 bg-red-100 text-red-600 rounded-lg font-bold text-xl active:scale-90 transition-all border border-red-200">-</button>
                  <button onClick={() => setProdutoSelecionado(p)} className="w-10 h-10 bg-blue-600 text-white rounded-lg font-bold text-xl active:scale-90 transition-all">+</button>
                </div>

                <span className="text-2xl font-bold text-slate-800 text-center">{p.nome}</span>
                <span className="text-xs text-slate-500 font-medium">Unit: R$ {Number(p.preco_venda).toFixed(2)}</span>
                
                <div className="mt-2 bg-slate-100 w-full rounded-lg p-2 text-center border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Vendido Hoje</p>
                  <p className="text-xl font-black text-slate-900">{qtdTotal}</p>
                  <p className="text-sm font-extrabold text-blue-700">R$ {valorTotal.toFixed(2)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ModoQuiosque