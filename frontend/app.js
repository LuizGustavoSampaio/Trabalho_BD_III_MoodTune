const BANCO = 'http://localhost:8080/musicas';

const CABECALHOS = {
  'Content-Type': 'application/json',
  Authorization: 'Basic ' + btoa('admin:secret'),
};

const HUMORES = {
  feliz: 'Feliz',
  triste: 'Triste',
  calmo: 'Calmo',
  animado: 'Animado',
  apaixonado: 'Apaixonado',
  nostalgico: 'Nostálgico',
};

const MUSICAS_PRE_DEFINIDAS = [
  { artista: 'Pharrell Williams', titulo: 'Happy', humor: 'feliz' },
  { artista: 'Jorge Ben Jor', titulo: 'Pais Tropical', humor: 'feliz' },
  { artista: 'Katy Perry', titulo: 'Firework', humor: 'feliz' },
  { artista: 'Earth, Wind & Fire', titulo: 'September', humor: 'feliz' },
  { artista: 'Tim Maia', titulo: 'Sossego', humor: 'feliz' },
  { artista: 'Natiruts', titulo: 'Quero Ser Feliz Tambem', humor: 'feliz' },
  { artista: 'Mark Ronson', titulo: 'Uptown Funk', humor: 'feliz' },
  { artista: 'Katrina and the Waves', titulo: 'Walking on Sunshine', humor: 'feliz' },
  { artista: 'Taylor Swift', titulo: 'Shake It Off', humor: 'feliz' },
  { artista: 'Sergio Mendes', titulo: 'Mas Que Nada', humor: 'feliz' },

  { artista: 'Adele', titulo: 'Someone Like You', humor: 'triste' },
  { artista: 'Radiohead', titulo: 'Creep', humor: 'triste' },
  { artista: 'Johnny Cash', titulo: 'Hurt', humor: 'triste' },
  { artista: 'Legiao Urbana', titulo: 'Pais e Filhos', humor: 'triste' },
  { artista: 'Amy Winehouse', titulo: 'Back to Black', humor: 'triste' },
  { artista: 'Coldplay', titulo: 'Fix You', humor: 'triste' },
  { artista: 'R.E.M.', titulo: 'Everybody Hurts', humor: 'triste' },
  { artista: 'Eric Clapton', titulo: 'Tears in Heaven', humor: 'triste' },
  { artista: 'A Great Big World', titulo: 'Say Something', humor: 'triste' },
  { artista: 'Elis Regina', titulo: 'Atras da Porta', humor: 'triste' },

  { artista: 'Coldplay', titulo: 'Yellow', humor: 'apaixonado', trecho: 'Look at the stars, look how they shine for you' },
  { artista: 'Ed Sheeran', titulo: 'Perfect', humor: 'apaixonado' },
  { artista: 'Djavan', titulo: 'Oceano', humor: 'apaixonado' },
  { artista: 'Elvis Presley', titulo: "Can't Help Falling in Love", humor: 'apaixonado' },
  { artista: 'Marisa Monte', titulo: 'Ainda Bem', humor: 'apaixonado' },
  { artista: 'John Legend', titulo: 'All of Me', humor: 'apaixonado' },
  { artista: 'Bruno Mars', titulo: 'Just the Way You Are', humor: 'apaixonado' },
  { artista: 'Tribalistas', titulo: 'Velha Infancia', humor: 'apaixonado' },
  { artista: 'Elton John', titulo: 'Your Song', humor: 'apaixonado' },
  { artista: 'Frank Sinatra', titulo: 'Fly Me to the Moon', humor: 'apaixonado' },

  { artista: 'Oasis', titulo: 'Wonderwall', humor: 'nostalgico' },
  { artista: 'Legiao Urbana', titulo: 'Tempo Perdido', humor: 'nostalgico' },
  { artista: 'Green Day', titulo: 'Good Riddance (Time of Your Life)', humor: 'nostalgico' },
  { artista: 'Los Hermanos', titulo: 'Anna Julia', humor: 'nostalgico' },
  { artista: 'The Beatles', titulo: 'Yesterday', humor: 'nostalgico' },
  { artista: 'Engenheiros do Hawaii', titulo: 'Infinita Highway', humor: 'nostalgico' },
  { artista: 'Bryan Adams', titulo: "Summer of '69", humor: 'nostalgico' },
  { artista: 'Eagles', titulo: 'Hotel California', humor: 'nostalgico' },
  { artista: 'a-ha', titulo: 'Take On Me', humor: 'nostalgico' },
  { artista: 'Os Paralamas do Sucesso', titulo: 'Lanterna dos Afogados', humor: 'nostalgico' },

  { artista: 'Queen', titulo: "Don't Stop Me Now", humor: 'animado' },
  { artista: 'AC/DC', titulo: 'Thunderstruck', humor: 'animado' },
  { artista: 'Dua Lipa', titulo: "Don't Start Now", humor: 'animado' },
  { artista: 'Skank', titulo: 'Garota Nacional', humor: 'animado' },
  { artista: 'Nirvana', titulo: 'Smells Like Teen Spirit', humor: 'animado' },
  { artista: 'Charlie Brown Jr.', titulo: 'Zoio de Lula', humor: 'animado' },
  { artista: 'The Killers', titulo: 'Mr. Brightside', humor: 'animado' },
  { artista: 'Survivor', titulo: 'Eye of the Tiger', humor: 'animado' },
  { artista: 'The White Stripes', titulo: 'Seven Nation Army', humor: 'animado' },
  { artista: 'Anitta', titulo: 'Show das Poderosas', humor: 'animado' },

  { artista: 'Jack Johnson', titulo: 'Better Together', humor: 'calmo' },
  { artista: 'Norah Jones', titulo: "Don't Know Why", humor: 'calmo' },
  { artista: 'Cartola', titulo: 'As Rosas Nao Falam', humor: 'calmo' },
  { artista: 'Joao Gilberto', titulo: 'Garota de Ipanema', humor: 'calmo', trecho: 'Olha que coisa mais linda, mais cheia de graca' },
  { artista: 'Bob Marley', titulo: 'Three Little Birds', humor: 'calmo' },
  { artista: 'Caetano Veloso', titulo: 'Sozinho', humor: 'calmo' },
  { artista: 'The Beatles', titulo: 'Here Comes the Sun', humor: 'calmo' },
  { artista: 'Vance Joy', titulo: 'Riptide', humor: 'calmo' },
  { artista: 'Ana Vilela', titulo: 'Trem-Bala', humor: 'calmo' },
  { artista: 'Maroon 5', titulo: 'Sunday Morning', humor: 'calmo' },
];

const MUSICAS_POR_PAGINA = 12;
const PAUSA_ENTRE_IMPORTACOES_MS = 600;
const TENTATIVAS = 3;

const VERSOES_ALTERNATIVAS = [
  'live', 'ao vivo', 'demo', 'mix', 'cover', 'karaoke', 'tribute',
  'acoustic', 'acustico', 'instrumental', 'version', 'versao', 'edit',
];

const CHAVE_DO_TEMA = 'moodtune-theme';
const temaDoSistema = window.matchMedia('(prefers-color-scheme: dark)');
let temaEscolhido = null;

function aplicarTema(tema) {
  document.documentElement.dataset.theme = tema;
  const botao = document.getElementById('theme-toggle');
  if (!botao) return;
  const icone = document.createElement('span');
  icone.setAttribute('aria-hidden', 'true');
  icone.textContent = tema === 'dark' ? '☀' : '☾';
  botao.replaceChildren(icone, tema === 'dark' ? ' Tema claro' : ' Tema escuro');
}

try {
  const salvo = localStorage.getItem(CHAVE_DO_TEMA);
  if (salvo === 'dark' || salvo === 'light') temaEscolhido = salvo;
} catch {}

aplicarTema(temaEscolhido || (temaDoSistema.matches ? 'dark' : 'light'));

function prepararTema() {
  const botao = document.getElementById('theme-toggle');
  botao.hidden = false;
  botao.addEventListener('click', () => {
    temaEscolhido = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    aplicarTema(temaEscolhido);
    try {
      localStorage.setItem(CHAVE_DO_TEMA, temaEscolhido);
    } catch {}
  });

  temaDoSistema.addEventListener('change', (evento) => {
    if (!temaEscolhido) aplicarTema(evento.matches ? 'dark' : 'light');
  });
}

async function requisitar(url, opcoes = {}) {
  const resposta = await fetch(url, { ...opcoes, headers: CABECALHOS });
  if (!resposta.ok) {
    const erro = new Error(`Erro ${resposta.status} ao falar com o banco`);
    erro.status = resposta.status;
    throw erro;
  }
  return resposta;
}

function comId(documento) {
  const id = documento._id && documento._id.$oid ? documento._id.$oid : documento._id;
  return { ...documento, id };
}

function semCamposDoBanco(musica) {
  const { _id, _etag, id, ...resto } = musica;
  return resto;
}

async function criarColecao() {
  const resposta = await requisitar(BANCO, { method: 'PUT' });
  return { status: resposta.status };
}

async function listarMusicas() {
  const resposta = await requisitar(`${BANCO}?pagesize=100`);
  return { status: resposta.status, musicas: (await resposta.json()).map(comId) };
}

async function listarPorHumor(humor) {
  const filtro = encodeURIComponent(JSON.stringify({ humor }));
  const resposta = await requisitar(`${BANCO}?filter=${filtro}&pagesize=100`);
  return { status: resposta.status, musicas: (await resposta.json()).map(comId) };
}

async function criarMusica(musica) {
  const agora = new Date().toISOString();
  const resposta = await requisitar(BANCO, {
    method: 'POST',
    body: JSON.stringify({ ...semCamposDoBanco(musica), criadoEm: agora, atualizadoEm: agora }),
  });
  const id = (resposta.headers.get('Location') || '').split('/').pop();
  return { status: resposta.status, id };
}

async function favoritarMusica(id, favorito) {
  const resposta = await requisitar(`${BANCO}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ favorito, atualizadoEm: new Date().toISOString() }),
  });
  return { status: resposta.status };
}

async function salvarTrecho(id, trecho) {
  const resposta = await requisitar(`${BANCO}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ trecho, atualizadoEm: new Date().toISOString() }),
  });
  return { status: resposta.status };
}

async function jaExisteNoBanco(titulo, artista) {
  const filtro = encodeURIComponent(JSON.stringify({ titulo, artista }));
  const resposta = await requisitar(`${BANCO}?filter=${filtro}&pagesize=1`);
  const lista = await resposta.json();
  return lista.length > 0;
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function montarUrl(base, parametros) {
  const url = new URL(base);
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null) url.searchParams.set(chave, valor);
  }
  return url.toString();
}

async function buscarComRetentativa(url) {
  let ultimoStatus = 0;

  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    const resposta = await fetch(url);
    const apiOcupada = resposta.status === 429 || resposta.status >= 500;
    if (!apiOcupada) return resposta;

    ultimoStatus = resposta.status;
    if (tentativa < TENTATIVAS) await esperar(1000 * 2 ** (tentativa - 1));
  }

  throw new Error(`API ocupada (status ${ultimoStatus}) apos ${TENTATIVAS} tentativas`);
}

function normalizar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escolherMelhorResultado(resultados, artistaPedido, tituloPedido) {
  const artistaAlvo = normalizar(artistaPedido);
  const tituloAlvo = normalizar(tituloPedido);

  const pontuar = (r) => {
    const artista = normalizar(r.artistName);
    const titulo = normalizar(r.trackName);

    let pontosArtista = 0;
    if (artista === artistaAlvo) pontosArtista = 2;
    else if (artista.includes(artistaAlvo) || artistaAlvo.includes(artista)) pontosArtista = 1;

    let pontosTitulo = 0;
    if (titulo === tituloAlvo) pontosTitulo = 3;
    else if (titulo.startsWith(tituloAlvo)) pontosTitulo = 2;
    else if (titulo.includes(tituloAlvo)) pontosTitulo = 1;

    if (pontosTitulo === 0) return -1;

    const ehAlternativa = VERSOES_ALTERNATIVAS.some(
      (marca) => titulo.includes(marca) && !tituloAlvo.includes(marca)
    );

    return pontosArtista * 10 + pontosTitulo * 2 - (ehAlternativa ? 1 : 0);
  };

  const candidatos = resultados.filter((r) => r.trackName && r.trackTimeMillis && pontuar(r) > 0);
  if (candidatos.length === 0) return null;

  return candidatos.sort((a, b) => {
    const diferenca = pontuar(b) - pontuar(a);
    return diferenca !== 0 ? diferenca : a.trackName.length - b.trackName.length;
  })[0];
}

async function buscarNoItunes(artista, titulo) {
  const url = montarUrl('https://itunes.apple.com/search', {
    term: `${artista} ${titulo}`,
    entity: 'song',
    country: 'BR',
    limit: 25,
  });

  const resposta = await buscarComRetentativa(url);
  if (!resposta.ok) throw new Error(`iTunes respondeu ${resposta.status}`);

  const dados = await resposta.json();
  if (!dados.results || dados.results.length === 0) throw new Error('musica nao encontrada no iTunes');

  const r = escolherMelhorResultado(dados.results, artista, titulo);
  if (!r) throw new Error('nenhum resultado do iTunes tem esse titulo');

  return {
    trackId: r.trackId,
    titulo: r.trackName,
    artista: r.artistName,
    album: r.collectionName,
    duracao: Math.round(r.trackTimeMillis / 1000),
    genero: r.primaryGenreName,
    capa: r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '300x300bb') : '',
    previa: r.previewUrl || '',
  };
}

async function buscarLetra({ titulo, artista, album, duracao }) {
  const urlGet = montarUrl('https://lrclib.net/api/get', {
    track_name: titulo,
    artist_name: artista,
    album_name: album,
    duration: duracao,
  });

  let resposta = await buscarComRetentativa(urlGet);

  if (resposta.status === 404) {
    const urlBusca = montarUrl('https://lrclib.net/api/search', {
      track_name: titulo,
      artist_name: artista,
    });
    resposta = await buscarComRetentativa(urlBusca);
    if (!resposta.ok) return null;

    const lista = await resposta.json();
    return Array.isArray(lista) && lista.length > 0 ? lista[0] : null;
  }

  if (!resposta.ok) return null;
  return resposta.json();
}

function variedadeDePalavras(linha) {
  const palavras = linha.toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];
  if (palavras.length === 0) return 0;
  return new Set(palavras).size / palavras.length;
}

function escolherTrecho(letra) {
  if (!letra) return '';

  const linhas = letra
    .split('\n')
    .map((linha) => linha.trim())
    .filter((linha) => linha.length >= 20 && linha.length <= 90)
    .filter((linha) => !linha.startsWith('['))
    .filter((linha) => variedadeDePalavras(linha) >= 0.7);

  if (linhas.length === 0) return '';

  const vezes = new Map();
  for (const linha of linhas) vezes.set(linha, (vezes.get(linha) || 0) + 1);

  let melhor = linhas[0];
  for (const linha of linhas) {
    const ganhaNaRepeticao = vezes.get(linha) > vezes.get(melhor);
    const empataEEhMaisLonga = vezes.get(linha) === vezes.get(melhor) && linha.length > melhor.length;
    if (ganhaNaRepeticao || empataEEhMaisLonga) melhor = linha;
  }
  return melhor;
}

function montarDocumento(item, doItunes) {
  const tags = [];
  if (doItunes.genero) tags.push(doItunes.genero.toLowerCase());

  return {
    trackId: doItunes.trackId,
    titulo: doItunes.titulo,
    artista: doItunes.artista,
    album: doItunes.album,
    humor: item.humor,
    duracao: doItunes.duracao,
    trecho: item.trecho || '',
    tags,
    capa: doItunes.capa,
    previa: doItunes.previa,
    favorito: false,
  };
}

async function importarMusicasPreDefinidas() {
  const total = MUSICAS_PRE_DEFINIDAS.length;
  const contador = { gravadas: 0, falhas: 0 };

  await criarColecao();

  for (const [indice, item] of MUSICAS_PRE_DEFINIDAS.entries()) {
    mostrarMensagem(`Primeira execução: importando as músicas do iTunes (${indice + 1}/${total})...`, 'carregando');

    try {
      const doItunes = await buscarNoItunes(item.artista, item.titulo);
      if (await jaExisteNoBanco(doItunes.titulo, doItunes.artista)) continue;

      await criarMusica(montarDocumento(item, doItunes));
      contador.gravadas++;
    } catch (erro) {
      contador.falhas++;
      console.warn(`Não importou ${item.artista} - ${item.titulo}: ${erro.message}`);
    }

    await esperar(PAUSA_ENTRE_IMPORTACOES_MS);
  }

  return contador;
}

async function completarTrechos(musicas) {
  const semTrecho = musicas.filter((musica) => !musica.trecho);
  let pendentes = semTrecho;
  let completados = 0;

  for (let rodada = 1; rodada <= 2 && pendentes.length > 0; rodada++) {
    if (rodada > 1) await esperar(5000);
    const apiOcupada = [];

    for (const [indice, musica] of pendentes.entries()) {
      mostrarMensagem(`Buscando os trechos das letras na LRCLIB (${indice + 1}/${pendentes.length})...`, 'carregando');

      try {
        const letra = await buscarLetra(musica);
        const trecho = escolherTrecho(letra && letra.plainLyrics);
        if (trecho) {
          await salvarTrecho(musica.id, trecho);
          completados++;
        }
      } catch (erro) {
        apiOcupada.push(musica);
        console.warn(`Sem trecho para ${musica.artista} - ${musica.titulo}: ${erro.message}`);
      }

      await esperar(PAUSA_ENTRE_IMPORTACOES_MS);
    }

    pendentes = apiOcupada;
  }

  return { completados, faltaram: semTrecho.length - completados };
}

async function contarMusicasNoBanco() {
  try {
    const { musicas } = await listarMusicas();
    return musicas.length;
  } catch (erro) {
    return erro.status === 404 ? 0 : null;
  }
}

const estado = {
  musicas: [],
  humor: '',
  sugestao: null,
  soFavoritas: false,
  limite: MUSICAS_POR_PAGINA,
  consultaHumor: 0,
};

const elementos = {
  contador: document.getElementById('contador'),
  moods: document.querySelectorAll('.mood'),
  humorStatus: document.getElementById('humor-status'),
  limparHumor: document.getElementById('limpar-humor'),
  hero: document.querySelector('.hero'),
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
  soFavoritas: document.getElementById('so-favoritas'),
  limparFiltros: document.getElementById('limpar-filtros'),
  mensagem: document.getElementById('mensagem'),
  lista: document.getElementById('lista-musicas'),
  mostrarMais: document.getElementById('mostrar-mais'),
  modelo: document.getElementById('modelo-musica'),
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
  elementos.mensagem.className = `mensagem mensagem-${tipo}`;
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
    mostrarMensagem(textoDoErro(erro), 'erro');
    return false;
  } finally {
    elementos.contador.textContent = `● ${estado.musicas.length} músicas no banco`;
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
    const combinaFavorita = !estado.soFavoritas || musica.favorito;
    const onde = `${musica.titulo} ${musica.artista} ${musica.album || ''} ${nomeDoHumor(musica.humor)}`;
    const combinaTexto = !texto || simplificar(onde).includes(texto);
    return combinaHumor && combinaGenero && combinaFavorita && combinaTexto;
  });
}

function criarCartao(musica) {
  const cartao = elementos.modelo.content.firstElementChild.cloneNode(true);
  cartao.dataset.id = musica.id;

  const capa = cartao.querySelector('.cover');
  capa.setAttribute('aria-label', `Ouvir ${musica.titulo}`);
  if (musica.capa) {
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
  cartao.querySelector('h3').title = musica.titulo;
  cartao.querySelector('.artist').textContent = musica.artista;
  cartao.querySelector('.tag').textContent = nomeDoHumor(musica.humor);

  const favoritar = cartao.querySelector('[data-acao="favoritar"]');
  favoritar.setAttribute('aria-pressed', String(Boolean(musica.favorito)));
  favoritar.textContent = musica.favorito ? '♥ Favorita' : '♡ Favoritar';

  return cartao;
}

function desenharLista() {
  const lista = musicasFiltradas();
  const visiveis = lista.slice(0, estado.limite);
  elementos.lista.replaceChildren(...visiveis.map(criarCartao));

  if (lista.length === 0) {
    const vazio = document.createElement('p');
    vazio.className = 'empty';
    vazio.textContent = estado.soFavoritas
      ? 'Nenhuma favorita por aqui. Use o ♡ Favoritar nos cartões.'
      : 'Nenhuma música encontrada.';
    elementos.lista.append(vazio);
  }

  const restantes = lista.length - visiveis.length;
  elementos.mostrarMais.hidden = restantes <= 0;
  elementos.mostrarMais.textContent = `Mostrar mais (${restantes})`;
}

function filtrarDeNovo() {
  estado.limite = MUSICAS_POR_PAGINA;
  desenharLista();
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

function atualizarSelecaoHumor() {
  elementos.moods.forEach((botao) => {
    botao.setAttribute('aria-pressed', String(botao.dataset.humor === estado.humor));
  });
  elementos.humorStatus.textContent = estado.humor
    ? `Humor selecionado: ${nomeDoHumor(estado.humor)}.`
    : 'Nenhum humor selecionado. Escolha como você está se sentindo.';
  elementos.limparHumor.hidden = !estado.humor;
}

function limparHumor(devolverFoco = false) {
  const anterior = [...elementos.moods].find((botao) => botao.dataset.humor === estado.humor);
  estado.consultaHumor++;
  estado.humor = '';
  estado.sugestao = null;
  atualizarSelecaoHumor();
  elementos.sugestaoHumor.textContent = 'NA SUA FREQUÊNCIA';
  elementos.sugestaoTitulo.textContent = 'Seu momento.\nSua trilha sonora.';
  elementos.sugestaoArtista.textContent = 'Uma nova forma de encontrar músicas que acompanham o que você sente.';
  elementos.sugestaoTrecho.textContent = '';
  elementos.sugestaoTrecho.hidden = true;
  elementos.sugestaoPrevia.pause();
  elementos.sugestaoPrevia.removeAttribute('src');
  elementos.sugestaoPrevia.hidden = true;
  elementos.sugestaoCapa.style.backgroundImage = '';
  elementos.sugestaoCapa.classList.remove('com-capa');
  elementos.sortearOutra.hidden = true;
  elementos.sugestaoDica.hidden = false;
  filtrarDeNovo();
  mostrarMensagem('Filtro de humor removido.', 'sucesso');
  if (devolverFoco && anterior) anterior.focus();
}

async function escolherHumor(humor) {
  const consulta = ++estado.consultaHumor;
  estado.humor = humor;
  atualizarSelecaoHumor();
  filtrarDeNovo();

  mostrarMensagem(`Buscando músicas para o humor "${nomeDoHumor(humor)}"...`, 'carregando');
  try {
    const { status, musicas } = await listarPorHumor(humor);
    if (consulta !== estado.consultaHumor) return;
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
    if (consulta !== estado.consultaHumor) return;
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

function alternarSoFavoritas() {
  estado.soFavoritas = !estado.soFavoritas;
  elementos.soFavoritas.setAttribute('aria-pressed', String(estado.soFavoritas));
  filtrarDeNovo();
}

function limparFiltros() {
  elementos.busca.value = '';
  elementos.genero.value = '';
  estado.soFavoritas = false;
  elementos.soFavoritas.setAttribute('aria-pressed', 'false');
  limparHumor();
  mostrarMensagem('Filtros removidos.', 'sucesso');
}

function tratarCliqueNaLista(evento) {
  const botao = evento.target.closest('[data-acao]');
  if (!botao) return;

  const id = botao.closest('.song').dataset.id;
  const musica = estado.musicas.find((item) => item.id === id);
  if (!musica) return;

  const acao = botao.dataset.acao;
  if (acao === 'ouvir') {
    mostrarSugestao(musica);
    elementos.hero.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (acao === 'favoritar') alternarFavorito(musica);
}

function prepararTela() {
  elementos.moods.forEach((botao) => {
    botao.addEventListener('click', () => {
      if (estado.humor === botao.dataset.humor) limparHumor();
      else escolherHumor(botao.dataset.humor);
    });
  });
  elementos.sortearOutra.addEventListener('click', () => escolherHumor(estado.humor));

  elementos.busca.addEventListener('input', filtrarDeNovo);
  elementos.genero.addEventListener('change', filtrarDeNovo);
  elementos.soFavoritas.addEventListener('click', alternarSoFavoritas);
  elementos.limparFiltros.addEventListener('click', limparFiltros);
  elementos.limparHumor.addEventListener('click', () => limparHumor(true));
  elementos.lista.addEventListener('click', tratarCliqueNaLista);
  elementos.mostrarMais.addEventListener('click', () => {
    estado.limite += MUSICAS_POR_PAGINA;
    desenharLista();
  });
}

async function iniciar() {
  prepararTema();
  prepararTela();

  if ((await contarMusicasNoBanco()) !== 0) {
    await carregarMusicas();
    return;
  }

  try {
    const { gravadas, falhas } = await importarMusicasPreDefinidas();
    await carregarMusicas();
    const { completados, faltaram } = await completarTrechos(estado.musicas);
    await carregarMusicas();

    const avisos = [];
    if (falhas > 0) avisos.push(`${falhas} não foram encontradas no iTunes`);
    if (faltaram > 0) avisos.push(`${faltaram} ficaram sem trecho`);
    const resumo = avisos.length > 0 ? ` (${avisos.join('; ')}).` : '.';
    mostrarMensagem(`Primeira execução concluída: ${gravadas} músicas gravadas com POST e ${completados} trechos com PATCH${resumo}`, 'sucesso');
  } catch (erro) {
    mostrarMensagem(textoDoErro(erro), 'erro');
  }
}

iniciar();
