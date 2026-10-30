const ARQUIVO_DA_LISTA = 'musicas.json';
const PAUSA_MS = 600;
const TENTATIVAS = 5;

const VERSOES_ALTERNATIVAS = [
  'live', 'ao vivo', 'demo', 'mix', 'cover', 'karaoke', 'tribute',
  'acoustic', 'acustico', 'instrumental', 'version', 'versao', 'edit',
];

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

async function criarColecao() {
  const resposta = await fetch(BANCO, { method: 'PUT', headers: CABECALHOS });
  if (!resposta.ok) throw new Error(`nao consegui criar a colecao (status ${resposta.status})`);
}

async function jaExisteNoBanco(titulo, artista) {
  const filtro = encodeURIComponent(JSON.stringify({ titulo, artista }));
  const resposta = await fetch(`${BANCO}?filter=${filtro}&pagesize=1`, { headers: CABECALHOS });
  if (!resposta.ok) return false;

  const lista = await resposta.json();
  return Array.isArray(lista) && lista.length > 0;
}

async function gravarNoBanco(documento) {
  const resposta = await fetch(BANCO, {
    method: 'POST',
    headers: CABECALHOS,
    body: JSON.stringify(documento),
  });
  if (!resposta.ok) throw new Error(`POST falhou com status ${resposta.status}`);

  return (resposta.headers.get('Location') || '').split('/').pop();
}

async function quantasMusicasNoBanco() {
  try {
    const resposta = await fetch(`${BANCO}?pagesize=1000`, { headers: CABECALHOS });
    if (!resposta.ok) return 0;
    const lista = await resposta.json();
    return Array.isArray(lista) ? lista.length : 0;
  } catch {
    return 0;
  }
}

function montarDocumento({ item, doItunes, trecho }) {
  const agora = new Date().toISOString();

  const tags = [];
  if (doItunes.genero) tags.push(doItunes.genero.toLowerCase());
  for (const tag of item.tags || []) {
    if (!tags.includes(tag.toLowerCase())) tags.push(tag.toLowerCase());
  }

  return {
    trackId: doItunes.trackId,
    titulo: doItunes.titulo,
    artista: doItunes.artista,
    album: doItunes.album,
    humor: item.humor,
    duracao: doItunes.duracao,
    trecho,
    tags,
    capa: doItunes.capa,
    previa: doItunes.previa,
    favorito: false,
    criadoEm: agora,
    atualizadoEm: agora,
  };
}

async function importarTudo(avisar = console.log) {
  const resposta = await fetch(ARQUIVO_DA_LISTA);
  if (!resposta.ok) throw new Error(`nao achei ${ARQUIVO_DA_LISTA} (status ${resposta.status})`);
  const lista = await resposta.json();

  avisar(`Importando ${lista.length} musicas...`);
  await criarColecao();

  const contador = { gravadas: 0, puladas: 0, semLetra: 0, falhas: 0 };

  for (const [indice, item] of lista.entries()) {
    const posicao = `[${indice + 1}/${lista.length}]`;

    try {
      const doItunes = await buscarNoItunes(item.artista, item.titulo);

      if (await jaExisteNoBanco(doItunes.titulo, doItunes.artista)) {
        contador.puladas++;
        avisar(`${posicao} ja estava no banco: ${doItunes.artista} - ${doItunes.titulo}`);
        continue;
      }

      let trecho = item.trecho || '';
      if (!trecho) {
        const letra = await buscarLetra(doItunes);
        trecho = escolherTrecho(letra && letra.plainLyrics);
      }
      if (!trecho) contador.semLetra++;

      await gravarNoBanco(montarDocumento({ item, doItunes, trecho }));
      contador.gravadas++;
      avisar(`${posicao} gravada: ${doItunes.artista} - ${doItunes.titulo}`);
    } catch (erro) {
      contador.falhas++;
      avisar(`${posicao} FALHOU: ${item.artista} - ${item.titulo} (${erro.message})`);
    }

    await esperar(PAUSA_MS);
  }

  avisar(
    `Fim: ${contador.gravadas} gravadas, ${contador.puladas} ja existiam, ` +
      `${contador.semLetra} sem letra, ${contador.falhas} falhas.`
  );
  if (contador.falhas > 0) avisar('Clique de novo para tentar so as que faltaram.');

  return contador;
}

document.addEventListener('DOMContentLoaded', async function () {
  const secao = document.querySelector('.setup');
  const botao = document.getElementById('botao-importar');
  const andamento = document.getElementById('andamento');
  if (!secao || !botao) return;

  if ((await quantasMusicasNoBanco()) > 0) {
    secao.hidden = true;
    return;
  }

  botao.addEventListener('click', async function () {
    botao.disabled = true;
    andamento.textContent = '';

    const avisar = (texto) => {
      andamento.textContent += texto + '\n';
      andamento.scrollTop = andamento.scrollHeight;
    };

    try {
      await importarTudo(avisar);
    } catch (erro) {
      avisar(`Erro: ${erro.message}`);
      avisar('O docker compose esta rodando? Teste: http://localhost:8080/musicas');
    } finally {
      botao.disabled = false;
      await carregarMusicas();
    }
  });
});
