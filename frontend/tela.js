const HUMORES = {
  feliz: 'Feliz',
  triste: 'Triste',
  calmo: 'Calmo',
  animado: 'Animado',
  apaixonado: 'Apaixonado',
  nostalgico: 'Nostálgico',
};

const estado = {
  musicas: [],
  humor: '',
  sugestao: null,
  editando: null,
};

const elementos = {
  moods: document.querySelectorAll('.mood'),
  sugestaoHumor: document.getElementById('sugestao-humor'),
  sugestaoTitulo: document.getElementById('sugestao-titulo'),
  sugestaoArtista: document.getElementById('sugestao-artista'),
  sugestaoTrecho: document.getElementById('sugestao-trecho'),
  sugestaoPrevia: document.getElementById('sugestao-previa'),
  sugestaoCapa: document.getElementById('sugestao-capa'),
  sugestaoDica: document.getElementById('sugestao-dica'),
  sortearOutra: document.getElementById('sortear-outra'),
  busca: document.getElementById('busca'),
  genero: document.getElementById('filtro-genero'),
  limparFiltros: document.getElementById('limpar-filtros'),
  mensagem: document.getElementById('mensagem'),
  lista: document.getElementById('lista-musicas'),
  modelo: document.getElementById('modelo-musica'),
  novaMusica: document.getElementById('nova-musica'),
  janela: document.getElementById('janela-formulario'),
  formulario: document.getElementById('formulario-musica'),
  formularioTitulo: document.getElementById('formulario-titulo'),
  formularioErro: document.getElementById('formulario-erro'),
  cancelarFormulario: document.getElementById('cancelar-formulario'),
};

function nomeDoHumor(humor) {
  return HUMORES[humor] || humor || '';
}

function simplificar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function mostrarMensagem(texto, tipo) {
  elementos.mensagem.textContent = texto;
  elementos.mensagem.className = `stage-note mensagem-${tipo}`;
}

function textoDoErro(erro) {
  if (erro.status) return `${erro.message}.`;
  return 'Não consegui falar com o banco. O docker compose está rodando?';
}

async function carregarMusicas() {
  mostrarMensagem('Carregando músicas...', 'carregando');
  try {
    const { status, musicas } = await listarMusicas();
    estado.musicas = musicas;
    mostrarMensagem(`${musicas.length} músicas carregadas (GET ${status}).`, 'sucesso');
    return true;
  } catch (erro) {
    estado.musicas = [];
    if (erro.status === 404) {
      mostrarMensagem('O banco ainda está vazio (GET 404). Use o botão "Importar músicas" no fim da página.', 'erro');
    } else {
      mostrarMensagem(textoDoErro(erro), 'erro');
    }
    return false;
  } finally {
    preencherGeneros();
    desenharLista();
    document.dispatchEvent(new CustomEvent('musicas-carregadas', { detail: estado.musicas }));
  }
}

function preencherGeneros() {
  const escolhido = elementos.genero.value;
  const generos = new Set();
  for (const musica of estado.musicas) {
    for (const tag of musica.tags || []) generos.add(tag);
  }

  const opcoes = [...generos].sort().map((genero) => new Option(genero, genero));
  elementos.genero.replaceChildren(new Option('Todos os gêneros', ''), ...opcoes);
  elementos.genero.value = generos.has(escolhido) ? escolhido : '';
}

function musicasFiltradas() {
  const texto = simplificar(elementos.busca.value.trim());
  const genero = elementos.genero.value;

  return estado.musicas.filter((musica) => {
    const combinaHumor = !estado.humor || musica.humor === estado.humor;
    const combinaGenero = !genero || (musica.tags || []).includes(genero);
    const combinaTexto = !texto || simplificar(`${musica.titulo} ${musica.artista}`).includes(texto);
    return combinaHumor && combinaGenero && combinaTexto;
  });
}

function criarCartao(musica) {
  const cartao = elementos.modelo.content.firstElementChild.cloneNode(true);
  cartao.dataset.id = musica.id;

  if (musica.capa) {
    const capa = cartao.querySelector('.cover');
    const imagem = cartao.querySelector('img');
    imagem.src = musica.capa;
    imagem.hidden = false;
    imagem.onerror = () => {
      imagem.hidden = true;
      capa.classList.remove('com-capa');
    };
    capa.classList.add('com-capa');
  }
  cartao.querySelector('.cover-word').textContent = nomeDoHumor(musica.humor).toLowerCase();
  cartao.querySelector('h3').textContent = musica.titulo;
  cartao.querySelector('.artist').textContent = musica.artista;
  cartao.querySelector('.tag').textContent = nomeDoHumor(musica.humor);

  const favoritar = cartao.querySelector('[data-acao="favoritar"]');
  favoritar.setAttribute('aria-pressed', String(Boolean(musica.favorito)));
  favoritar.textContent = musica.favorito ? '♥ Favorita' : '♡ Favoritar';

  return cartao;
}

function desenharLista() {
  const lista = musicasFiltradas();
  elementos.lista.replaceChildren(...lista.map(criarCartao));

  if (lista.length === 0) {
    const vazio = document.createElement('p');
    vazio.className = 'empty';
    vazio.textContent = 'Nenhuma música encontrada.';
    elementos.lista.append(vazio);
  }
}

function mostrarSugestao(musica) {
  estado.sugestao = musica;

  elementos.sugestaoHumor.textContent = nomeDoHumor(musica.humor).toUpperCase();
  elementos.sugestaoTitulo.textContent = musica.titulo;
  elementos.sugestaoArtista.textContent = musica.album ? `${musica.artista} · ${musica.album}` : musica.artista;

  elementos.sugestaoTrecho.textContent = musica.trecho ? `“${musica.trecho}”` : '';
  elementos.sugestaoTrecho.hidden = !musica.trecho;

  elementos.sugestaoPrevia.hidden = !musica.previa;
  if (musica.previa) {
    elementos.sugestaoPrevia.src = musica.previa;
    elementos.sugestaoPrevia.play().catch(() => {});
  } else {
    elementos.sugestaoPrevia.pause();
    elementos.sugestaoPrevia.removeAttribute('src');
  }

  elementos.sugestaoCapa.style.backgroundImage = musica.capa ? `url(${JSON.stringify(musica.capa)})` : '';
  elementos.sugestaoCapa.classList.toggle('com-capa', Boolean(musica.capa));

  elementos.sortearOutra.hidden = !estado.humor;
  elementos.sugestaoDica.hidden = true;
}

async function escolherHumor(humor) {
  estado.humor = humor;
  elementos.moods.forEach((botao) => {
    botao.setAttribute('aria-pressed', String(botao.dataset.humor === humor));
  });
  desenharLista();

  mostrarMensagem(`Buscando músicas para o humor "${nomeDoHumor(humor)}"...`, 'carregando');
  try {
    const { status, musicas } = await listarPorHumor(humor);
    if (musicas.length === 0) {
      mostrarMensagem(`Ainda não há músicas com o humor "${nomeDoHumor(humor)}" (GET ${status}).`, 'erro');
      return;
    }

    const outras = musicas.filter((musica) => !estado.sugestao || musica.id !== estado.sugestao.id);
    const opcoes = outras.length > 0 ? outras : musicas;
    const sorteada = opcoes[Math.floor(Math.random() * opcoes.length)];

    mostrarSugestao(sorteada);
    mostrarMensagem(`${musicas.length} músicas com o humor "${nomeDoHumor(humor)}" (GET ${status}).`, 'sucesso');
  } catch (erro) {
    mostrarMensagem(textoDoErro(erro), 'erro');
  }
}

async function alternarFavorito(musica) {
  mostrarMensagem('Salvando favorito...', 'carregando');
  try {
    const { status } = await favoritarMusica(musica.id, !musica.favorito);
    const acao = musica.favorito ? 'saiu dos favoritos' : 'virou favorita';
    if (await carregarMusicas()) mostrarMensagem(`"${musica.titulo}" ${acao} (PATCH ${status}).`, 'sucesso');
  } catch (erro) {
    mostrarMensagem(textoDoErro(erro), 'erro');
  }
}

async function confirmarExclusao(musica) {
  const confirmou = confirm(`Excluir "${musica.titulo}", de ${musica.artista}? Essa ação não pode ser desfeita.`);
  if (!confirmou) return;

  mostrarMensagem('Excluindo...', 'carregando');
  try {
    const { status } = await excluirMusica(musica.id);
    if (await carregarMusicas()) mostrarMensagem(`"${musica.titulo}" foi excluída (DELETE ${status}).`, 'sucesso');
  } catch (erro) {
    mostrarMensagem(textoDoErro(erro), 'erro');
  }
}

function abrirFormulario(musica) {
  estado.editando = musica || null;
  const campos = elementos.formulario.elements;

  elementos.formulario.reset();
  elementos.formularioErro.textContent = '';
  elementos.formularioTitulo.textContent = musica ? 'Editar música' : 'Nova música';

  if (musica) {
    campos.titulo.value = musica.titulo || '';
    campos.artista.value = musica.artista || '';
    campos.humor.value = musica.humor || '';
    campos.duracao.value = musica.duracao || '';
    campos.trecho.value = musica.trecho || '';
    campos.tags.value = (musica.tags || []).join(', ');
    campos.capa.value = musica.capa || '';
    campos.previa.value = musica.previa || '';
  } else {
    campos.humor.value = estado.humor;
  }

  elementos.janela.showModal();
  campos.titulo.focus();
}

function lerFormulario() {
  const campos = elementos.formulario.elements;
  return {
    titulo: campos.titulo.value.trim(),
    artista: campos.artista.value.trim(),
    humor: campos.humor.value,
    duracao: Number(campos.duracao.value),
    trecho: campos.trecho.value.trim(),
    tags: campos.tags.value
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag !== ''),
    capa: campos.capa.value.trim(),
    previa: campos.previa.value.trim(),
  };
}

function ehEndereco(texto) {
  return /^https?:\/\/\S+$/.test(texto);
}

function validar(dados) {
  if (!dados.titulo) return 'Preencha o título.';
  if (!dados.artista) return 'Preencha o artista.';
  if (!HUMORES[dados.humor]) return 'Escolha um humor.';
  if (!Number.isInteger(dados.duracao) || dados.duracao <= 0) {
    return 'A duração precisa ser um número inteiro de segundos, maior que zero.';
  }
  if (!dados.trecho) return 'Escreva o trecho da letra que vai ficar em destaque.';
  if (dados.capa && !ehEndereco(dados.capa)) return 'A capa precisa ser um endereço começando com http:// ou https://.';
  if (dados.previa && !ehEndereco(dados.previa)) return 'A prévia precisa ser um endereço começando com http:// ou https://.';
  return '';
}

async function salvarFormulario(evento) {
  evento.preventDefault();

  const dados = lerFormulario();
  const problema = validar(dados);
  elementos.formularioErro.textContent = problema;
  if (problema) return;

  const musica = estado.editando;
  try {
    let texto;
    if (musica) {
      const { status } = await substituirMusica(musica.id, { ...musica, ...dados });
      texto = `"${dados.titulo}" foi atualizada (PUT ${status}).`;
    } else {
      const { status } = await criarMusica({ ...dados, favorito: false });
      texto = `"${dados.titulo}" foi cadastrada (POST ${status}).`;
    }

    elementos.janela.close();
    if (await carregarMusicas()) mostrarMensagem(texto, 'sucesso');
  } catch (erro) {
    elementos.formularioErro.textContent = textoDoErro(erro);
  }
}

function limparFiltros() {
  estado.humor = '';
  elementos.busca.value = '';
  elementos.genero.value = '';
  elementos.moods.forEach((botao) => botao.setAttribute('aria-pressed', 'false'));
  elementos.sortearOutra.hidden = true;
  desenharLista();
}

function prepararTela() {
  const opcoesDeHumor = Object.entries(HUMORES).map(([valor, nome]) => new Option(nome, valor));
  elementos.formulario.elements.humor.replaceChildren(new Option('Escolha um humor', ''), ...opcoesDeHumor);

  elementos.moods.forEach((botao) => {
    botao.addEventListener('click', () => escolherHumor(botao.dataset.humor));
  });
  elementos.sortearOutra.addEventListener('click', () => escolherHumor(estado.humor));

  elementos.busca.addEventListener('input', desenharLista);
  elementos.genero.addEventListener('change', desenharLista);
  elementos.limparFiltros.addEventListener('click', limparFiltros);

  elementos.lista.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-acao]');
    if (!botao) return;

    const id = botao.closest('.song').dataset.id;
    const musica = estado.musicas.find((item) => item.id === id);
    if (!musica) return;

    const acao = botao.dataset.acao;
    if (acao === 'ouvir') {
      mostrarSugestao(musica);
      document.querySelector('.hero').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (acao === 'favoritar') alternarFavorito(musica);
    if (acao === 'editar') abrirFormulario(musica);
    if (acao === 'excluir') confirmarExclusao(musica);
  });

  elementos.novaMusica.addEventListener('click', () => abrirFormulario());
  elementos.cancelarFormulario.addEventListener('click', () => elementos.janela.close());
  elementos.formulario.addEventListener('submit', salvarFormulario);

  carregarMusicas();
}

prepararTela();
