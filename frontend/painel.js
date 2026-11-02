// Gráfico visual do histórico. Os dados vêm somente de listarHistorico().
(() => {
  const painel = document.getElementById('painel');
  const descobrir = document.getElementById('tela-descobrir');
  const linkPainel = document.getElementById('painel-link');
  const linkInicio = document.querySelector('nav a[href="#inicio"]');
  const titulo = document.getElementById('painel-titulo');
  const status = document.getElementById('painel-status');
  const conteudo = document.getElementById('historico-conteudo');
  const canvas = document.getElementById('historico-grafico');
  const graficoContainer = document.getElementById('historico-grafico-container');
  const bibliotecaAviso = document.getElementById('historico-biblioteca-aviso');
  const lista = document.getElementById('historico-lista');
  const selecao = document.getElementById('historico-selecao');
  const dataSelecionada = document.getElementById('historico-data');
  const musicaSelecionada = document.getElementById('historico-musica');
  const artistaSelecionado = document.getElementById('historico-artista');
  const humorSelecionado = document.getElementById('historico-humor');
  const audioStatus = document.getElementById('historico-audio-status');
  const parar = document.getElementById('historico-pausar');
  if (!painel || !descobrir || !linkPainel || !linkInicio) return;

  const previa = new Audio();
  previa.preload = 'none';
  let aberto = false;
  let consultaAtual = 0;
  let dias = [];
  let selecionado = -1;
  let grafico = null;

  function formatarData(data, completa = false) {
    const [ano, mes, dia] = data.split('-');
    return completa ? `${dia}/${mes}/${ano}` : `${dia}/${mes}`;
  }

  // Reutiliza a função de mensagens existente sem substituir o estado de Descobrir.
  function mensagemPainel(texto, tipo) {
    const mensagemOriginal = document.getElementById('mensagem');
    const anterior = mensagemOriginal && {
      texto: mensagemOriginal.textContent,
      classe: mensagemOriginal.className,
    };
    mostrarMensagem(texto, tipo);
    status.textContent = texto;
    status.className = `mensagem mensagem-${tipo}`;
    if (anterior) {
      mensagemOriginal.textContent = anterior.texto;
      mensagemOriginal.className = anterior.classe;
    }
  }

  function pararPrevia() {
    previa.pause();
    previa.removeAttribute('src');
    previa.load();
    parar.disabled = true;
  }

  function destruirGrafico() {
    if (grafico) grafico.destroy();
    grafico = null;
  }

  function escolherDia(indice) {
    const dia = dias[indice];
    if (!aberto || !dia) return;
    pararPrevia();
    selecionado = indice;
    selecao.hidden = false;
    dataSelecionada.textContent = formatarData(dia.data, true);
    musicaSelecionada.textContent = dia.titulo;
    artistaSelecionado.textContent = dia.artista;
    humorSelecionado.textContent = nomeDoHumor(dia.humor);
    [...lista.querySelectorAll('button')].forEach((botao, i) => {
      botao.setAttribute('aria-pressed', String(i === indice));
    });
    if (grafico) grafico.update('none');
    if (!dia.previa) {
      audioStatus.textContent = 'Este dia não tem prévia de áudio disponível.';
      return;
    }
    audioStatus.textContent = `Carregando prévia de ${dia.titulo}, de ${dia.artista}...`;
    previa.src = dia.previa;
    parar.disabled = false;
    previa.play().catch(() => {});
  }

  function criarLista() {
    lista.replaceChildren();
    dias.forEach((dia, indice) => {
      const item = document.createElement('li');
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'historico-dia';
      botao.setAttribute('aria-pressed', 'false');
      const data = document.createElement('time');
      data.dateTime = dia.data;
      data.textContent = formatarData(dia.data, true);
      const textos = document.createElement('span');
      const nome = document.createElement('strong');
      nome.textContent = dia.titulo;
      const artista = document.createElement('small');
      artista.textContent = `${dia.artista} · ${nomeDoHumor(dia.humor)}`;
      textos.append(nome, artista);
      botao.append(data, textos);
      botao.setAttribute('aria-label', `${formatarData(dia.data, true)}: ${dia.titulo}, ${dia.artista}. ${dia.previa ? 'Ouvir prévia' : 'Sem prévia disponível'}.`);
      botao.addEventListener('click', () => escolherDia(indice));
      item.append(botao);
      lista.append(item);
    });
  }

  function criarGrafico() {
    destruirGrafico();
    bibliotecaAviso.hidden = true;
    graficoContainer.hidden = false;
    if (typeof Chart === 'undefined') {
      graficoContainer.hidden = true;
      bibliotecaAviso.textContent = 'Não foi possível carregar o gráfico. Use a lista de músicas por dia abaixo.';
      bibliotecaAviso.hidden = false;
      return;
    }
    const cores = getComputedStyle(document.documentElement);
    const cor = (nome) => cores.getPropertyValue(nome).trim();
    // Cada posição corresponde a um registro existente; não são criados dias intermediários.
    grafico = new Chart(canvas, {
      type: 'line',
      data: {
        labels: dias.map((dia) => formatarData(dia.data)),
        datasets: [{
          label: 'Música do dia',
          data: dias.map(() => 1),
          borderColor: cor('--line'),
          borderWidth: 2,
          pointBackgroundColor: cor('--green'),
          pointBorderColor: cor('--surface'),
          pointBorderWidth: 2,
          pointRadius: (contexto) => contexto.dataIndex === selecionado ? 9 : (dias.length > 40 ? 4 : 7),
          pointHoverRadius: 10,
          pointHitRadius: 8,
          tension: 0,
          fill: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        layout: { padding: { top: 24, left: 12, right: 12, bottom: 8 } },
        interaction: { mode: 'nearest', intersect: true },
        scales: {
          x: {
            type: 'category',
            offset: true,
            grid: { display: false },
            border: { color: cor('--line') },
            ticks: { color: cor('--muted'), autoSkip: true, maxTicksLimit: 6, maxRotation: 0 },
            title: { display: true, text: 'Dias com música registrada', color: cor('--muted') },
          },
          y: { display: false, min: 0, max: 2 },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            backgroundColor: cor('--surface'),
            titleColor: cor('--ink'),
            bodyColor: cor('--ink'),
            borderColor: cor('--line'),
            borderWidth: 1,
            callbacks: {
              title: (itens) => formatarData(dias[itens[0].dataIndex].data, true),
              label: (item) => `${dias[item.dataIndex].titulo} — ${dias[item.dataIndex].artista}`,
              afterLabel: (item) => nomeDoHumor(dias[item.dataIndex].humor),
            },
          },
        },
        onClick: (_evento, pontos) => {
          if (pontos.length) escolherDia(pontos[0].index);
        },
        onHover: (_evento, pontos, chart) => {
          chart.canvas.style.cursor = pontos.length ? 'pointer' : 'default';
        },
      },
    });
  }

  async function carregarPainel() {
    const consulta = ++consultaAtual;
    painel.setAttribute('aria-busy', 'true');
    pararPrevia();
    destruirGrafico();
    dias = [];
    selecionado = -1;
    conteudo.hidden = true;
    selecao.hidden = true;
    audioStatus.textContent = '';
    lista.replaceChildren();
    mensagemPainel('Carregando músicas do dia...', 'carregando');
    try {
      const resposta = await listarHistorico();
      if (!aberto || consulta !== consultaAtual) return;
      dias = resposta.dias;
      if (dias.length === 0) {
        mensagemPainel('Ainda não há músicas registradas', 'sucesso');
        return;
      }
      conteudo.hidden = false;
      criarLista();
      criarGrafico();
      mensagemPainel(`Histórico carregado (GET ${resposta.status}). Clique em um dia para ouvir a prévia.`, 'sucesso');
    } catch (erro) {
      if (!aberto || consulta !== consultaAtual) return;
      conteudo.hidden = true;
      destruirGrafico();
      mensagemPainel(textoDoErro(erro), 'erro');
    } finally {
      if (consulta === consultaAtual) painel.setAttribute('aria-busy', 'false');
    }
  }

  function navegar() {
    const abrir = location.hash === '#painel';
    const mudou = aberto !== abrir;
    aberto = abrir;
    painel.hidden = !abrir;
    descobrir.hidden = abrir;
    linkPainel.classList.toggle('active', abrir);
    linkInicio.classList.toggle('active', !abrir);
    if (abrir) {
      linkPainel.setAttribute('aria-current', 'page');
      linkInicio.removeAttribute('aria-current');
    } else {
      linkInicio.setAttribute('aria-current', 'page');
      linkPainel.removeAttribute('aria-current');
    }
    if (!mudou) return;
    if (abrir) {
      // Ao trocar de tela, evita que a prévia de Descobrir toque junto com o painel.
      const audioDescobrir = document.getElementById('sugestao-previa');
      if (audioDescobrir) audioDescobrir.pause();
      titulo.focus({ preventScroll: true });
      carregarPainel();
    } else {
      consultaAtual++;
      pararPrevia();
      destruirGrafico();
      document.getElementById('intro-title').focus({ preventScroll: true });
    }
    window.scrollTo(0, 0);
  }

  parar.addEventListener('click', () => {
    pararPrevia();
    audioStatus.textContent = 'Prévia interrompida.';
  });
  previa.addEventListener('playing', () => {
    if (aberto && dias[selecionado]) audioStatus.textContent = `Ouvindo ${dias[selecionado].titulo} — ${dias[selecionado].artista}.`;
  });
  previa.addEventListener('ended', () => {
    parar.disabled = true;
    audioStatus.textContent = 'Prévia encerrada.';
  });
  previa.addEventListener('error', () => {
    if (!aberto || !dias[selecionado] || !dias[selecionado].previa) return;
    parar.disabled = true;
    audioStatus.textContent = 'Não foi possível carregar a prévia deste dia.';
  });
  new MutationObserver(() => {
    if (aberto && grafico) criarGrafico();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('hashchange', navegar);
  window.addEventListener('pagehide', pararPrevia);
  navegar();
})();
