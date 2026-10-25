/*
 * MoodTune - importacao das musicas (parte do Henrique)
 *
 * Roda no navegador, pelo botao "Importar musicas" da pagina. Para cada item de
 * musicas.json: consulta o iTunes, consulta a LRCLIB, monta o documento e faz POST
 * no banco. E o "GET na API de origem + POST no banco NoSQL" que o trabalho pede.
 *
 * Roda uma vez so: depois disso o site le tudo do banco, nunca mais das APIs externas.
 *
 * Usa BANCO, CABECALHOS e conferir() definidos em app.js, que e carregado antes deste.
 */

// Lista do grupo: artista, titulo, humor e (opcional) um trecho escolhido a mao.
const ARQUIVO_DA_LISTA = 'musicas.json';

// Pausa entre uma musica e outra, para nao bombardear as APIs publicas.
const PAUSA_MS = 600;

// Quantas vezes tentar de novo quando a API responde "estou ocupada" (429 ou 5xx).
// A LRCLIB limita bastante as consultas seguidas, por isso a espera dobra a cada tentativa.
const TENTATIVAS = 5;

// Palavras que denunciam uma versao que nao e a original (cover, ao vivo, remix...).
const VERSOES_ALTERNATIVAS = [
  'live', 'ao vivo', 'demo', 'mix', 'cover', 'karaoke', 'tribute',
  'acoustic', 'acustico', 'instrumental', 'version', 'versao', 'edit',
];

// ---------------------------------------------------------------------------
// Ajudantes
// ---------------------------------------------------------------------------

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Monta uma URL com os parametros ja codificados (acentos, espacos, & etc). */
function montarUrl(base, parametros) {
  const url = new URL(base);
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null) url.searchParams.set(chave, valor);
  }
  return url.toString();
}

/**
 * fetch com retentativa. As APIs publicas as vezes respondem 503 ("server is busy")
 * quando recebem varias consultas seguidas - isso nao e erro nosso, e so pedir de novo
 * esperando um pouco mais a cada tentativa (1s, 2s, 4s...).
 * Status 404 NAO e retentado: ali a resposta e definitiva (nao existe).
 */
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

// ---------------------------------------------------------------------------
// Passo 1 - iTunes Search API (metadados, capa e previa)
// ---------------------------------------------------------------------------

/** Tira acentos, pontuacao e maiusculas para poder comparar dois titulos. */
function normalizar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove os acentos que o normalize separou da letra
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Entre os resultados do iTunes, escolhe o que mais parece com o que foi pedido.
 * Precisa olhar ARTISTA e titulo: so pelo titulo, "Creep" do Stone Temple Pilots
 * empata com o do Radiohead, e "Good Riddance" do Boyce Avenue (cover) ganha do Green Day.
 * Por isso o artista vale muito mais na conta (x10) do que o titulo.
 */
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
    if (titulo === tituloAlvo) pontosTitulo = 3; // titulo igualzinho
    else if (titulo.startsWith(tituloAlvo)) pontosTitulo = 2; // original + algo entre parenteses
    else if (titulo.includes(tituloAlvo)) pontosTitulo = 1;

    // Se o titulo nao casa de jeito nenhum, o resultado esta fora da disputa.
    // (Sem isto, "Rehab" da Amy Winehouse ganhava de "Back To Black (Original Demo)"
    //  no desempate por nome mais curto, mesmo nao tendo nada a ver com o pedido.)
    if (pontosTitulo === 0) return -100;

    // Desconto para versoes alternativas, a nao ser que o grupo tenha pedido justamente isso.
    const ehAlternativa = VERSOES_ALTERNATIVAS.some(
      (marca) => titulo.includes(marca) && !tituloAlvo.includes(marca)
    );

    return pontosArtista * 10 + pontosTitulo * 2 - (ehAlternativa ? 1 : 0);
  };

  // Maior pontuacao vence; empatou, fica o titulo mais curto (menos "extras" no nome).
  return [...resultados].sort((a, b) => {
    const diferenca = pontuar(b) - pontuar(a);
    return diferenca !== 0 ? diferenca : a.trackName.length - b.trackName.length;
  })[0];
}

async function buscarNoItunes(artista, titulo) {
  const url = montarUrl('https://itunes.apple.com/search', {
    term: `${artista} ${titulo}`,
    entity: 'song',
    country: 'BR', // sem isto a busca cai na loja americana e devolve outras musicas
    limit: 25, // pedimos varias e escolhemos a melhor logo abaixo
  });

  const resposta = await buscarComRetentativa(url);
  // fetch NAO cai no catch quando o status e 404 ou 500: temos que conferir na mao.
  if (!resposta.ok) throw new Error(`iTunes respondeu ${resposta.status}`);

  const dados = await resposta.json();
  if (!dados.results || dados.results.length === 0) throw new Error('musica nao encontrada no iTunes');

  const r = escolherMelhorResultado(dados.results, artista, titulo);
  return {
    trackId: r.trackId, // id da musica no iTunes: e o nosso campo referenciado
    titulo: r.trackName,
    artista: r.artistName,
    album: r.collectionName,
    duracao: Math.round(r.trackTimeMillis / 1000), // milissegundos -> segundos
    genero: r.primaryGenreName,
    // A capa vem em 100x100; trocar o pedaco do nome por 300x300 traz a imagem maior.
    capa: r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '300x300bb') : '',
    previa: r.previewUrl || '',
  };
}

// ---------------------------------------------------------------------------
// Passo 2 - LRCLIB (letra, so para recortar o trecho)
// ---------------------------------------------------------------------------

async function buscarLetra({ titulo, artista, album, duracao }) {
  // Tentativa principal: /api/get casa pelo conjunto titulo + artista + album + duracao.
  const urlGet = montarUrl('https://lrclib.net/api/get', {
    track_name: titulo,
    artist_name: artista,
    album_name: album,
    duration: duracao,
  });

  let resposta = await buscarComRetentativa(urlGet);

  // Plano B: quando o /api/get devolve 404 (duracao ou album diferentes do que a LRCLIB tem),
  // caimos na busca mais solta, que ignora album e duracao, e pegamos o primeiro resultado.
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

/**
 * Mede a variedade de palavras de uma linha: 1 = todas diferentes, 0.5 = metade repetida.
 * Serve para jogar fora linhas de enrolacao tipo "Ba-de-ya, de-ya, de-ya" ou "Aw! Aw! Aw!",
 * que sao justamente as que mais se repetem na letra e estragariam o destaque no site.
 */
function variedadeDePalavras(linha) {
  const palavras = linha.toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];
  if (palavras.length === 0) return 0;
  return new Set(palavras).size / palavras.length;
}

/**
 * Escolhe UM trecho da letra para destacar no site.
 * Ideia: a linha que mais se repete costuma ser o refrao, que e a parte marcante.
 * Em caso de empate (ou letra sem repeticao), fica a linha mais longa.
 */
function escolherTrecho(letra) {
  if (!letra) return '';

  const linhas = letra
    .split('\n')
    .map((linha) => linha.trim())
    .filter((linha) => linha.length >= 20 && linha.length <= 90)
    .filter((linha) => !linha.startsWith('[')) // descarta marcacoes tipo [Chorus]
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

// ---------------------------------------------------------------------------
// Passo 3 - banco (RESTHeart)
// ---------------------------------------------------------------------------

/** Garante que a colecao existe. 201 = criada agora, 200 = ja existia. */
async function criarColecao() {
  const resposta = await fetch(BANCO, { method: 'PUT', headers: CABECALHOS });
  if (!resposta.ok) throw new Error(`nao consegui criar a colecao (status ${resposta.status})`);
}

/** Evita duplicar: pergunta ao banco se ja existe musica com o mesmo titulo e artista. */
async function jaExisteNoBanco(titulo, artista) {
  const filtro = encodeURIComponent(JSON.stringify({ titulo, artista }));
  const resposta = await fetch(`${BANCO}?filter=${filtro}&pagesize=1`, { headers: CABECALHOS });
  if (!resposta.ok) return false;

  const lista = await resposta.json();
  return Array.isArray(lista) && lista.length > 0;
}

/** Insere o documento. O RESTHeart devolve 201 e o id no cabecalho Location. */
async function gravarNoBanco(documento) {
  const resposta = await fetch(BANCO, {
    method: 'POST',
    headers: CABECALHOS,
    body: JSON.stringify(documento),
  });
  if (!resposta.ok) throw new Error(`POST falhou com status ${resposta.status}`);

  return (resposta.headers.get('Location') || '').split('/').pop();
}

// ---------------------------------------------------------------------------
// Monta o documento no formato combinado pelo grupo
// ---------------------------------------------------------------------------

function montarDocumento({ item, doItunes, trecho }) {
  const agora = new Date().toISOString();

  // tags = genero que veio do iTunes + tags escritas na lista (sem repetir).
  const tags = [];
  if (doItunes.genero) tags.push(doItunes.genero.toLowerCase());
  for (const tag of item.tags || []) {
    if (!tags.includes(tag.toLowerCase())) tags.push(tag.toLowerCase());
  }

  return {
    // Guardamos o id do iTunes em vez de copiar a musica inteira para ca: e a nossa
    // referencia para o registro externo, e permite voltar na API quando precisar.
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

// ---------------------------------------------------------------------------
// A importacao em si
// ---------------------------------------------------------------------------

/**
 * Importa todas as musicas da lista.
 * Recebe uma funcao avisar(texto) para ir mostrando o andamento na tela.
 */
async function importarTudo(avisar = console.log) {
  const resposta = await fetch(ARQUIVO_DA_LISTA);
  if (!resposta.ok) throw new Error(`nao achei ${ARQUIVO_DA_LISTA} (status ${resposta.status})`);
  const lista = await resposta.json();

  avisar(`Importando ${lista.length} musicas...`);
  await criarColecao();

  const contador = { gravadas: 0, puladas: 0, semLetra: 0, falhas: 0 };

  for (const [indice, item] of lista.entries()) {
    const posicao = `[${indice + 1}/${lista.length}]`;

    // O try/catch por musica e o que faz a importacao nao parar quando uma falha:
    // registramos o erro, contamos e seguimos para a proxima.
    try {
      // O iTunes vem primeiro de proposito: o documento e gravado com o titulo e o artista
      // que ELE devolve ("Pais Tropical" da nossa lista vira "Pais Tropical" com acento).
      // Se checassemos a duplicata usando os nomes da lista, nao achariamos o que ja esta
      // no banco e a importacao duplicaria tudo a cada execucao.
      const doItunes = await buscarNoItunes(item.artista, item.titulo);

      if (await jaExisteNoBanco(doItunes.titulo, doItunes.artista)) {
        contador.puladas++;
        avisar(`${posicao} ja estava no banco: ${doItunes.artista} - ${doItunes.titulo}`);
        continue;
      }

      // Se a lista do grupo ja traz um trecho escolhido a mao, ele tem prioridade.
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

// ---------------------------------------------------------------------------
// Liga o botao da pagina
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
  const botao = document.getElementById('botao-importar');
  const andamento = document.getElementById('andamento');
  if (!botao) return;

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
    }
  });
});
