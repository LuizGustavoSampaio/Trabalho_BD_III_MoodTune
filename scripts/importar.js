/*
 * MoodTune - script de importacao (parte do Henrique)
 *
 * O que ele faz, em ordem, para cada musica da lista scripts/musicas.json:
 *   1. GET na iTunes Search API  -> titulo, artista, album, duracao, capa e previa de 30s
 *   2. GET na LRCLIB             -> letra (so para recortar UM trecho; a letra inteira nao e salva)
 *   3. POST no RESTHeart         -> grava o documento na colecao "musicas" do MongoDB
 *
 * As duas APIs externas nao tem id em comum: a ligacao e feita por artista + titulo,
 * usando a duracao em segundos como confirmacao. Por isso consultamos o iTunes primeiro
 * e usamos os nomes que ELE devolve para perguntar a letra para a LRCLIB.
 *
 * Nenhuma dependencia externa: Node 18+ ja tem fetch embutido.
 *
 * Como rodar (com o docker compose up -d ja rodando):
 *   node scripts/importar.js              importa tudo que ainda nao esta no banco
 *   node scripts/importar.js --teste      so consulta as APIs e mostra o resultado, nao grava nada
 *   node scripts/importar.js --limite=5   importa apenas as 5 primeiras (util para testar)
 *   node scripts/importar.js --limpar     APAGA todas as musicas do banco e importa tudo de novo
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuracao
// ---------------------------------------------------------------------------

const API = process.env.MOODTUNE_API || 'http://localhost:8080';
const COLECAO = 'musicas';
const USUARIO = process.env.MOODTUNE_USER || 'admin';
const SENHA = process.env.MOODTUNE_PASS || 'secret';

// Cabecalho de autenticacao Basic: a palavra "Basic" + usuario:senha em base64.
const AUTENTICACAO = 'Basic ' + Buffer.from(`${USUARIO}:${SENHA}`).toString('base64');

// Pausa entre uma musica e outra, para nao bombardear as APIs publicas.
const PAUSA_MS = 600;

// Quantas vezes tentar de novo quando a API responde "estou ocupada" (429 ou 5xx).
// A LRCLIB limita bastante as consultas seguidas, por isso a espera dobra a cada tentativa.
const TENTATIVAS = 5;

// Flags digitadas na linha de comando.
const args = process.argv.slice(2);
const MODO_TESTE = args.includes('--teste');
const LIMPAR_ANTES = args.includes('--limpar');
const LIMITE = Number((args.find((a) => a.startsWith('--limite=')) || '').split('=')[1]) || Infinity;

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
 * esperando um pouco mais a cada tentativa (1s, 2s, 4s).
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
    .replace(/[\u0300-\u036f]/g, '') // remove os acentos que o normalize separou da letra
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Palavras que denunciam uma versao que nao e a original (cover, ao vivo, remix...).
const VERSOES_ALTERNATIVAS = [
  'live', 'ao vivo', 'demo', 'mix', 'cover', 'karaoke', 'tribute',
  'acoustic', 'acustico', 'instrumental', 'version', 'versao', 'edit',
];

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
    country: 'BR',
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
  const resposta = await fetch(`${API}/${COLECAO}`, {
    method: 'PUT',
    headers: { Authorization: AUTENTICACAO },
  });
  if (!resposta.ok) throw new Error(`nao consegui criar a colecao (status ${resposta.status})`);
}

/** Evita duplicar: pergunta ao banco se ja existe musica com o mesmo titulo e artista. */
async function jaExisteNoBanco(titulo, artista) {
  const url = montarUrl(`${API}/${COLECAO}`, {
    filter: JSON.stringify({ titulo, artista }),
    pagesize: 1,
  });
  const resposta = await fetch(url, { headers: { Authorization: AUTENTICACAO } });
  if (!resposta.ok) return false;

  const lista = await resposta.json();
  return Array.isArray(lista) && lista.length > 0;
}

/** Insere o documento. O RESTHeart devolve 201 e o id no cabecalho Location. */
async function gravarNoBanco(documento) {
  const resposta = await fetch(`${API}/${COLECAO}`, {
    method: 'POST',
    headers: { Authorization: AUTENTICACAO, 'Content-Type': 'application/json' },
    body: JSON.stringify(documento),
  });
  if (!resposta.ok) throw new Error(`POST falhou com status ${resposta.status}`);

  const local = resposta.headers.get('Location') || '';
  return local.split('/').pop();
}

/**
 * Apaga todos os documentos da colecao (usado so com a flag --limpar).
 * O * na URL e a exclusao em massa do RESTHeart. Ele recusa filter={} vazio (status 400),
 * de proposito, para ninguem apagar uma colecao inteira sem querer; por isso pedimos
 * "todo documento que tenha _id", que na pratica e todo mundo.
 */
async function limparColecao() {
  const url = montarUrl(`${API}/${COLECAO}/*`, {
    filter: JSON.stringify({ _id: { $exists: true } }),
  });
  const resposta = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: AUTENTICACAO },
  });
  if (!resposta.ok) throw new Error(`nao consegui limpar a colecao (status ${resposta.status})`);

  const resultado = await resposta.json();
  return resultado.deleted || 0;
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
// Programa principal
// ---------------------------------------------------------------------------

async function principal() {
  const caminhoLista = path.join(__dirname, 'musicas.json');
  const lista = JSON.parse(fs.readFileSync(caminhoLista, 'utf8')).slice(0, LIMITE);

  console.log(`MoodTune - importacao de ${lista.length} musica(s)`);
  console.log(`API do banco: ${API}/${COLECAO}`);
  if (MODO_TESTE) console.log('MODO TESTE: nada sera gravado no banco.\n');
  else console.log('');

  if (!MODO_TESTE) {
    await criarColecao();
    if (LIMPAR_ANTES) {
      const apagadas = await limparColecao();
      console.log(`Colecao limpa (--limpar): ${apagadas} musica(s) apagada(s).\n`);
    }
  }

  const contador = { gravadas: 0, puladas: 0, semLetra: 0, falhas: 0 };
  const problemas = [];

  for (const [indice, item] of lista.entries()) {
    const posicao = `[${String(indice + 1).padStart(2, '0')}/${lista.length}]`;

    // O try/catch por musica e o que faz o script nao parar quando uma falha:
    // registramos o erro, contamos e seguimos para a proxima.
    try {
      // O iTunes vem primeiro de proposito: o documento e gravado com o titulo e o artista
      // que ELE devolve ("Pais Tropical" na nossa lista vira "Pais Tropical" com acento).
      // Se checassemos a duplicata usando os nomes da lista, nao acharíamos o que ja esta
      // no banco e o script duplicaria tudo a cada execucao.
      const doItunes = await buscarNoItunes(item.artista, item.titulo);

      if (!MODO_TESTE && (await jaExisteNoBanco(doItunes.titulo, doItunes.artista))) {
        console.log(`${posicao} ja estava no banco, pulando: ${doItunes.artista} - ${doItunes.titulo}`);
        contador.puladas++;
        continue;
      }

      // Se a lista do grupo ja traz um trecho escolhido a mao, ele tem prioridade.
      let trecho = item.trecho || '';
      if (!trecho) {
        const letra = await buscarLetra(doItunes);
        trecho = escolherTrecho(letra && letra.plainLyrics);
      }

      if (!trecho) {
        contador.semLetra++;
        problemas.push(`${item.artista} - ${item.titulo}: sem letra na LRCLIB (trecho vazio)`);
      }

      const documento = montarDocumento({ item, doItunes, trecho });

      if (MODO_TESTE) {
        console.log(`${posicao} ${documento.artista} - ${documento.titulo} (${documento.duracao}s, ${documento.humor})`);
        console.log(`        trecho: ${trecho || '(nenhum)'}`);
      } else {
        const id = await gravarNoBanco(documento);
        contador.gravadas++;
        console.log(`${posicao} gravada: ${documento.artista} - ${documento.titulo} -> id ${id}`);
      }
    } catch (erro) {
      contador.falhas++;
      problemas.push(`${item.artista} - ${item.titulo}: ${erro.message}`);
      console.log(`${posicao} FALHOU: ${item.artista} - ${item.titulo} (${erro.message})`);
    }

    await esperar(PAUSA_MS);
  }

  console.log('\n--- resumo ---');
  console.log(`gravadas:          ${contador.gravadas}`);
  console.log(`ja existiam:       ${contador.puladas}`);
  console.log(`sem letra:         ${contador.semLetra}`);
  console.log(`falhas:            ${contador.falhas}`);

  if (problemas.length > 0) {
    console.log('\nitens para revisar na mao:');
    for (const problema of problemas) console.log(`  - ${problema}`);
  }

  if (!MODO_TESTE) {
    const resposta = await fetch(`${API}/${COLECAO}?pagesize=1000`, {
      headers: { Authorization: AUTENTICACAO },
    });
    const todas = await resposta.json();
    console.log(`\ntotal de musicas no banco agora: ${todas.length}`);
  }
}

principal().catch((erro) => {
  console.error('\nErro geral na importacao:', erro.message);
  console.error('O docker compose esta rodando? Teste: curl -u admin:secret http://localhost:8080/musicas');
  process.exit(1);
});
