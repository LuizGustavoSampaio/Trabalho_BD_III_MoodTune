// MoodTune - requisicoes HTTP ao banco (MongoDB + RESTHeart).

const BANCO = 'http://localhost:8080/musicas';

const CABECALHOS = {
  'Content-Type': 'application/json',
  Authorization: 'Basic ' + btoa('admin:secret'),
};

// O fetch NAO cai no catch quando o status e 404 ou 500, entao conferimos na mao.
function conferir(resposta) {
  if (!resposta.ok) throw new Error(`Erro ${resposta.status} ao falar com o banco`);
  return resposta;
}

// O RESTHeart devolve o id como { "$oid": "..." }; a tela prefere um texto simples.
function comId(documento) {
  return { ...documento, id: documento._id.$oid };
}

async function listarMusicas() {
  const resposta = await fetch(`${BANCO}?pagesize=100`, { headers: CABECALHOS });
  conferir(resposta);
  return (await resposta.json()).map(comId);
}

async function listarPorHumor(humor) {
  const filtro = encodeURIComponent(JSON.stringify({ humor }));
  const resposta = await fetch(`${BANCO}?filter=${filtro}&pagesize=100`, { headers: CABECALHOS });
  conferir(resposta);
  return (await resposta.json()).map(comId);
}

async function buscarMusica(id) {
  const resposta = await fetch(`${BANCO}/${id}`, { headers: CABECALHOS });
  conferir(resposta);
  return comId(await resposta.json());
}

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

// PUT troca o documento inteiro: o que nao for enviado some.
async function substituirMusica(id, musica) {
  const resposta = await fetch(`${BANCO}/${id}`, {
    method: 'PUT',
    headers: CABECALHOS,
    body: JSON.stringify({ ...musica, atualizadoEm: new Date().toISOString() }),
  });
  conferir(resposta);
}

// PATCH altera so os campos enviados.
async function favoritarMusica(id, favorito) {
  const resposta = await fetch(`${BANCO}/${id}`, {
    method: 'PATCH',
    headers: CABECALHOS,
    body: JSON.stringify({ favorito, atualizadoEm: new Date().toISOString() }),
  });
  conferir(resposta);
}

async function excluirMusica(id) {
  const resposta = await fetch(`${BANCO}/${id}`, { method: 'DELETE', headers: CABECALHOS });
  conferir(resposta); // 204 No Content
}
