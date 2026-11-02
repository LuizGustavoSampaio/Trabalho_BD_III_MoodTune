const BANCO_HISTORICO = BANCO.replace(/\/musicas$/, '/historico');
const UPSERT = '?wm=upsert';

// Data de hoje no horário do usuário, no formato AAAA-MM-DD.
// Não usar toISOString(): ele devolve a data em UTC e, no Brasil, o "dia" viraria às 21h.
function dataDeHoje() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

// Grava (ou troca) a música do dia. Devolve { status, data }.
// O documento leva uma cópia de titulo, artista, capa e previa para o gráfico montar tudo
// com um único GET, sem precisar consultar a coleção "musicas" de novo.
async function registrarMusicaDoDia(musica) {
  const data = dataDeHoje();
  const opcoes = {
    method: 'PUT',
    body: JSON.stringify({
      data,
      musicaId: musica.id,
      titulo: musica.titulo,
      artista: musica.artista,
      humor: musica.humor,
      capa: musica.capa || '',
      previa: musica.previa || '',
      atualizadoEm: new Date().toISOString(),
    }),
  };

  try {
    const resposta = await requisitar(`${BANCO_HISTORICO}/${data}${UPSERT}`, opcoes);
    return { status: resposta.status, data };
  } catch (erro) {
    if (erro.status !== 404) throw erro;
    // 404 = a coleção ainda não existe (primeiro dia de uso): cria e tenta de novo.
    await requisitar(BANCO_HISTORICO, { method: 'PUT' });
    const resposta = await requisitar(`${BANCO_HISTORICO}/${data}${UPSERT}`, opcoes);
    return { status: resposta.status, data };
  }
}

// Lista o histórico em ordem de data (do dia mais antigo para o mais novo).
// Cada item: { data, musicaId, titulo, artista, humor, capa, previa, atualizadoEm }.
// Para a prévia no clique do gráfico, basta tocar o campo "previa" do item.
async function listarHistorico() {
  const resposta = await requisitar(`${BANCO_HISTORICO}?pagesize=100`);
  const dias = await resposta.json();
  dias.sort((a, b) => a.data.localeCompare(b.data));
  return { status: resposta.status, dias };
}

// Liga ao app.js: toda vez que uma música aparece na tela, ela vira a música do dia.
// Se o banco falhar, só avisa no console, para não atrapalhar a tela.
document.addEventListener('sugestao-mostrada', (evento) => {
  registrarMusicaDoDia(evento.detail).catch((erro) => {
    console.warn('Não consegui registrar a música do dia:', erro.message);
  });
});