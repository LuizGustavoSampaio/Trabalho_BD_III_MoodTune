/*
 * MoodTune - camada que conversa com o banco (parte do Henrique)
 *
 * Aqui ficam so as requisicoes HTTP. A tela (listagem, formulario, painel, graficos)
 * e a parte da Interface e entra logo abaixo, usando estas funcoes.
 *
 * O banco e o mesmo que a colecao do Postman testa: MongoDB + RESTHeart no Docker.
 */

const BANCO = 'http://localhost:8080/musicas';

const CABECALHOS = {
  'Content-Type': 'application/json',
  // btoa() transforma "usuario:senha" em base64, que e o formato do Basic.
  // A senha padrao do RESTHeart so e aceitavel porque o banco roda na maquina local.
  Authorization: 'Basic ' + btoa('admin:secret'),
};

/**
 * Confere a resposta antes de usar. Existe porque o fetch NAO cai no catch
 * quando o status e 404 ou 500 - sem este teste, o erro passaria despercebido
 * e so apareceria la na frente, como "undefined" na tela.
 */
function conferir(resposta) {
  if (!resposta.ok) throw new Error(`Erro ${resposta.status} ao falar com o banco`);
  return resposta;
}

/** O RESTHeart devolve o id como { "$oid": "..." }; a tela prefere um texto simples. */
function comId(documento) {
  return { ...documento, id: documento._id.$oid };
}

// --- GET: listar todas -------------------------------------------------------

async function listarMusicas() {
  const resposta = await fetch(`${BANCO}?pagesize=100`, { headers: CABECALHOS });
  conferir(resposta);
  const lista = await resposta.json();
  return lista.map(comId);
}

// --- GET: filtrar por humor (e o que o site faz quando a pessoa escolhe um humor) ---

async function listarPorHumor(humor) {
  const filtro = encodeURIComponent(JSON.stringify({ humor }));
  const resposta = await fetch(`${BANCO}?filter=${filtro}&pagesize=100`, { headers: CABECALHOS });
  conferir(resposta);
  const lista = await resposta.json();
  return lista.map(comId);
}

// --- GET: buscar uma pelo id -------------------------------------------------

async function buscarMusica(id) {
  const resposta = await fetch(`${BANCO}/${id}`, { headers: CABECALHOS });
  conferir(resposta);
  return comId(await resposta.json());
}

// --- POST: criar -------------------------------------------------------------

async function criarMusica(musica) {
  const agora = new Date().toISOString();
  const resposta = await fetch(BANCO, {
    method: 'POST',
    headers: CABECALHOS,
    body: JSON.stringify({ ...musica, criadoEm: agora, atualizadoEm: agora }),
  });
  conferir(resposta);
  // 201 Created: o id da musica nova vem no cabecalho Location.
  return resposta.headers.get('Location').split('/').pop();
}

// --- PUT: substituir o documento inteiro (formulario de edicao) --------------

async function substituirMusica(id, musica) {
  const resposta = await fetch(`${BANCO}/${id}`, {
    method: 'PUT',
    headers: CABECALHOS,
    // PUT troca o documento inteiro: o que nao for enviado some.
    body: JSON.stringify({ ...musica, atualizadoEm: new Date().toISOString() }),
  });
  conferir(resposta);
}

// --- PATCH: alterar um campo so ----------------------------------------------

async function favoritarMusica(id, favorito) {
  const resposta = await fetch(`${BANCO}/${id}`, {
    method: 'PATCH',
    headers: CABECALHOS,
    body: JSON.stringify({ favorito, atualizadoEm: new Date().toISOString() }),
  });
  conferir(resposta);
}

// --- DELETE: excluir ---------------------------------------------------------

async function excluirMusica(id) {
  const resposta = await fetch(`${BANCO}/${id}`, { method: 'DELETE', headers: CABECALHOS });
  conferir(resposta); // 204 No Content
}

/* ---------------------------------------------------------------------------
 * A partir daqui entra a Interface (Gula): montar a listagem, o formulario,
 * as mensagens de carregando/sucesso/erro e o painel com os graficos.
 * ------------------------------------------------------------------------- */
