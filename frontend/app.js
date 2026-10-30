const BANCO = 'http://localhost:8080/musicas';

const CABECALHOS = {
  'Content-Type': 'application/json',
  Authorization: 'Basic ' + btoa('admin:secret'),
};

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

async function listarMusicas() {
  const resposta = await requisitar(`${BANCO}?pagesize=100`);
  return { status: resposta.status, musicas: (await resposta.json()).map(comId) };
}

async function listarPorHumor(humor) {
  const filtro = encodeURIComponent(JSON.stringify({ humor }));
  const resposta = await requisitar(`${BANCO}?filter=${filtro}&pagesize=100`);
  return { status: resposta.status, musicas: (await resposta.json()).map(comId) };
}

async function buscarMusica(id) {
  const resposta = await requisitar(`${BANCO}/${id}`);
  return { status: resposta.status, musica: comId(await resposta.json()) };
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

async function substituirMusica(id, musica) {
  const resposta = await requisitar(`${BANCO}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...semCamposDoBanco(musica), atualizadoEm: new Date().toISOString() }),
  });
  return { status: resposta.status };
}

async function favoritarMusica(id, favorito) {
  const resposta = await requisitar(`${BANCO}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ favorito, atualizadoEm: new Date().toISOString() }),
  });
  return { status: resposta.status };
}

async function excluirMusica(id) {
  const resposta = await requisitar(`${BANCO}/${id}`, { method: 'DELETE' });
  return { status: resposta.status };
}
