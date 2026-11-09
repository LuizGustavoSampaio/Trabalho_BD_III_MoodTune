// Cálculos do painel: não contam execuções de áudio nem atribuem notas a emoções.
const ResumoAcervo = (() => {
  function resumir(musicas) {
    const porArtista = new Map();
    const porHumor = new Map();
    let favoritas = 0, segundos = 0, duracoesValidas = 0;
    for (const musica of musicas) {
      if (musica.favorito === true) favoritas++;
      const duracao = Number(musica.duracao);
      if (Number.isFinite(duracao) && duracao > 0) { segundos += duracao; duracoesValidas++; }
      const humor = musica.humor || 'sem-humor';
      porHumor.set(humor, (porHumor.get(humor) || 0) + 1);
      const nome = (musica.artista || '').trim().replace(/\s+/g, ' ');
      if (nome) {
        const chave = nome.toLocaleLowerCase('pt-BR');
        const grupo = porArtista.get(chave) || { nome, total: 0 };
        grupo.total++;
        porArtista.set(chave, grupo);
      }
    }
    const ranking = [...porArtista.values()].sort((a,b) => b.total - a.total || a.nome.localeCompare(b.nome,'pt-BR')).slice(0,5);
    const humores = [...porHumor].map(([humor,total]) => ({ humor,total })).sort((a,b) => b.total-a.total || a.humor.localeCompare(b.humor,'pt-BR'));
    return { total: musicas.length, favoritas, artistas: porArtista.size, humores, ranking,
      mediaDuracao: duracoesValidas ? Math.round(segundos/duracoesValidas) : 0 };
  }
  function formatarDuracao(segundos) {
    return `${Math.floor(segundos/60)}:${String(segundos%60).padStart(2,'0')}`;
  }
  return Object.freeze({ resumir, formatarDuracao });
})();

(() => {
  const area = document.getElementById('resumo-acervo');
  if (!area) return;
  const painel = document.getElementById('painel');
  const status = document.getElementById('resumo-status');
  const conteudo = document.getElementById('analises-conteudo');
  const aviso = document.getElementById('analises-biblioteca-aviso');
  const campos = {
    total: document.getElementById('indicador-total'),
    favoritas: document.getElementById('indicador-favoritas'),
    artistas: document.getElementById('indicador-artistas'),
    humores: document.getElementById('indicador-humores'),
    duracao: document.getElementById('indicador-duracao'),
  };
  let consulta = 0, resumo = null, graficos = [];
  const numero = new Intl.NumberFormat('pt-BR');
  const nomeHumor = (humor) => humor === 'sem-humor' ? 'Sem humor informado' : nomeDoHumor(humor);
  function destruir() { graficos.forEach(g => g.destroy()); graficos = []; }
  function limpar() { resumo = null; destruir(); conteudo.hidden = true; Object.values(campos).forEach(el => el.textContent = '—'); }
  function mensagem(texto,tipo) { status.textContent=texto;status.className=`mensagem mensagem-${tipo}`; }
  function linhaLista(lista,nome,valor,cor) {
    const li=document.createElement('li'),label=document.createElement('span'),total=document.createElement('strong');
    if(cor) {const marcador=document.createElement('i');marcador.style.background=cor;marcador.setAttribute('aria-hidden','true');label.append(marcador);}
    label.append(document.createTextNode(nome));total.textContent=numero.format(valor);li.append(label,total);lista.append(li);
  }
  function cores() {
    const estilo=getComputedStyle(document.documentElement);
    const cor=nome=>estilo.getPropertyValue(nome).trim();
    const nomes=['feliz','triste','calmo','animado','apaixonado','nostalgico'];
    return {cor,humor:id=>nomes.includes(id)?cor(`--humor-${id}`):cor('--muted')};
  }
  function desenhar() {
    destruir(); if(!resumo)return;
    conteudo.hidden=false;
    campos.total.textContent=numero.format(resumo.total);
    campos.favoritas.textContent=numero.format(resumo.favoritas);
    campos.artistas.textContent=numero.format(resumo.artistas);
    campos.humores.textContent=numero.format(resumo.humores.length);
    campos.duracao.textContent=ResumoAcervo.formatarDuracao(resumo.mediaDuracao);
    const listaHumores=document.getElementById('humores-lista'),listaArtistas=document.getElementById('artistas-lista');
    listaHumores.replaceChildren();listaArtistas.replaceChildren();
    const {cor,humor}=cores();
    resumo.humores.forEach(h=>linhaLista(listaHumores,nomeHumor(h.humor),h.total,humor(h.humor)));
    resumo.ranking.forEach(a=>linhaLista(listaArtistas,a.nome,a.total));
    const conclusao=document.getElementById('resumo-conclusao');
    if(!resumo.total) {
      conclusao.textContent='O acervo está vazio. Cadastre uma música para preencher os indicadores, o agrupamento e o ranking.';
      listaHumores.append(Object.assign(document.createElement('li'),{textContent:'Nenhuma música cadastrada.'}));
      listaArtistas.append(Object.assign(document.createElement('li'),{textContent:'Nenhum artista cadastrado.'}));
    } else {
      const maiores=resumo.humores.filter(h=>h.total===resumo.humores[0].total).map(h=>nomeHumor(h.humor));
      const categoria=maiores.length===1?`O humor mais presente é ${maiores[0]}, com ${resumo.humores[0].total} faixas.`:`Há empate entre ${maiores.join(', ')}, com ${resumo.humores[0].total} faixas cada.`;
      conclusao.textContent=`O acervo tem ${resumo.total} músicas de ${resumo.artistas} artistas, com ${resumo.favoritas} favoritas. ${categoria} A duração média é ${ResumoAcervo.formatarDuracao(resumo.mediaDuracao)} por faixa.`;
    }
    const canvasHumor=document.getElementById('humores-grafico'),canvasArtistas=document.getElementById('artistas-grafico');
    const podeDesenhar=typeof Chart!=='undefined'&&resumo.total>0;
    canvasHumor.parentElement.hidden=!podeDesenhar;canvasArtistas.parentElement.hidden=!podeDesenhar;
    aviso.hidden=typeof Chart!=='undefined'||!resumo.total;
    if(!podeDesenhar)return;
    const tooltip={backgroundColor:cor('--surface'),titleColor:cor('--ink'),bodyColor:cor('--ink'),borderColor:cor('--line'),borderWidth:1};
    graficos.push(new Chart(canvasHumor,{type:'doughnut',data:{labels:resumo.humores.map(h=>nomeHumor(h.humor)),datasets:[{data:resumo.humores.map(h=>h.total),backgroundColor:resumo.humores.map(h=>humor(h.humor)),borderColor:cor('--surface'),borderWidth:3}]},options:{responsive:true,maintainAspectRatio:false,animation:false,cutout:'68%',plugins:{legend:{display:false},tooltip:{...tooltip,callbacks:{label:c=>`${c.label}: ${c.parsed} músicas (${Math.round(c.parsed/resumo.total*100)}%)`}}}}}));
    graficos.push(new Chart(canvasArtistas,{type:'bar',data:{labels:resumo.ranking.map(a=>a.nome),datasets:[{label:'Faixas no acervo',data:resumo.ranking.map(a=>a.total),backgroundColor:cor('--green'),borderRadius:6,maxBarThickness:30}]},options:{responsive:true,maintainAspectRatio:false,animation:false,indexAxis:'y',scales:{x:{beginAtZero:true,ticks:{precision:0,color:cor('--muted')},grid:{color:cor('--line')},border:{display:false}},y:{ticks:{color:cor('--ink'),callback:function(value){const nome=this.getLabelForValue(value);return nome.length>19?nome.slice(0,18)+'…':nome;}},grid:{display:false},border:{display:false}}},plugins:{legend:{display:false},tooltip}}}));
  }
  async function carregar() {
    if(painel.hidden)return;
    const id=++consulta;area.setAttribute('aria-busy','true');limpar();mensagem('Carregando indicadores do acervo...','carregando');
    try {
      const resposta=await listarMusicas();if(id!==consulta||painel.hidden)return;
      resumo=ResumoAcervo.resumir(resposta.musicas);desenhar();
      mensagem(`Indicadores atualizados (GET ${resposta.status}).`,'sucesso');
    } catch(erro) {if(id!==consulta||painel.hidden)return;limpar();mensagem(textoDoErro(erro),'erro');}
    finally {if(id===consulta)area.setAttribute('aria-busy','false');}
  }
  window.addEventListener('hashchange',()=>{if(location.hash==='#painel')carregar();else{consulta++;area.setAttribute('aria-busy','false');destruir();}});
  document.getElementById('painel-atualizar').addEventListener('click',carregar);
  document.addEventListener('musicas-carregadas',()=>{if(!painel.hidden)carregar();});
  new MutationObserver(()=>{if(!painel.hidden&&resumo)desenhar();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  if(!painel.hidden)carregar();
})();
