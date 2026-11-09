// Validação e formulários da interface. A persistência usa as funções da API existente.
const FormularioMusica = (() => {
  function validar(dados) {
    if (!dados.titulo || dados.titulo.length>120) return {campo:'titulo',mensagem:'Informe um título de até 120 caracteres.'};
    if (!dados.artista || dados.artista.length>120) return {campo:'artista',mensagem:'Informe um artista de até 120 caracteres.'};
    if (dados.album.length>120) return {campo:'album',mensagem:'O álbum pode ter até 120 caracteres.'};
    if (!['feliz','triste','calmo','animado','apaixonado','nostalgico'].includes(dados.humor)) return {campo:'humor',mensagem:'Escolha um humor da lista.'};
    if (!Number.isInteger(dados.duracao)||dados.duracao<1||dados.duracao>86400) return {campo:'duracao',mensagem:'Informe a duração inteira, entre 1 e 86400 segundos.'};
    if (dados.trecho.length>200) return {campo:'trecho',mensagem:'O trecho pode ter até 200 caracteres.'};
    for(const campo of ['capa','previa']) {
      if(!dados[campo])continue;
      try {const url=new URL(dados[campo]);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||dados[campo].length>2000)throw Error();}
      catch{return {campo,mensagem:`A URL ${campo==='capa'?'da capa':'da prévia'} deve ser um endereço HTTP ou HTTPS válido, sem usuário e senha.`};}
    }
    return null;
  }
  function normalizarTags(texto){return [...new Set(texto.split(',').map(t=>t.trim().toLocaleLowerCase('pt-BR')).filter(Boolean))];}
  return Object.freeze({validar,normalizarTags});
})();

(() => {
  const dialog=document.getElementById('gestao-dialog');if(!dialog)return;
  const lista=document.getElementById('gestao-lista');
  const busca=document.getElementById('gestao-busca');
  const status=document.getElementById('gestao-status');
  const formDialog=document.getElementById('musica-dialog');
  const form=document.getElementById('musica-form');
  const formStatus=document.getElementById('musica-form-status');
  const fieldset=document.getElementById('musica-campos');
  const salvar=document.getElementById('musica-salvar');
  const cancelar=document.getElementById('musica-cancelar');
  const exclusao=document.getElementById('exclusao-dialog');
  const confirmar=document.getElementById('exclusao-confirmar');
  const cancelarExclusao=document.getElementById('exclusao-cancelar');
  const exclusaoStatus=document.getElementById('exclusao-status');
  let musicas=[],editando=null,excluindo=null,ocupado=false,consulta=0;
  function mensagem(el,texto,tipo){el.textContent=texto;el.className=`mensagem mensagem-${tipo}`;}
  function alterarOcupado(valor){
    ocupado=valor;fieldset.disabled=valor;salvar.disabled=valor;cancelar.disabled=valor;confirmar.disabled=valor;cancelarExclusao.disabled=valor;
    document.getElementById('gestao-fechar').disabled=valor;
    formDialog.setAttribute('aria-busy',String(valor));exclusao.setAttribute('aria-busy',String(valor));
  }
  function desenharLista(){
    lista.replaceChildren();const termo=simplificar(busca.value.trim());
    const filtradas=musicas.filter(m=>simplificar(`${m.titulo} ${m.artista}`).includes(termo)).sort((a,b)=>(a.titulo||'').localeCompare(b.titulo||'','pt-BR'));
    if(!filtradas.length){const vazio=document.createElement('li');vazio.className='gestao-vazio';vazio.textContent=musicas.length?'Nenhuma música corresponde à busca.':'Nenhuma música cadastrada.';lista.append(vazio);return;}
    filtradas.forEach(musica=>{
      const item=document.createElement('li'),texto=document.createElement('div'),nome=document.createElement('strong'),detalhe=document.createElement('p'),acoes=document.createElement('div');
      nome.textContent=musica.titulo;detalhe.textContent=`${musica.artista} · ${nomeDoHumor(musica.humor)} · ${musica.duracao} s`;
      texto.className='gestao-descricao';texto.append(nome,detalhe);acoes.className='gestao-acoes';
      const editar=document.createElement('button');editar.type='button';editar.className='secondary';editar.textContent='Editar';editar.setAttribute('aria-label',`Editar ${musica.titulo}, de ${musica.artista}`);editar.addEventListener('click',()=>{if(!ocupado)abrirFormulario(musica)});
      const excluir=document.createElement('button');excluir.type='button';excluir.className='danger-outline';excluir.textContent='Excluir';excluir.setAttribute('aria-label',`Excluir ${musica.titulo}, de ${musica.artista}`);excluir.addEventListener('click',()=>{if(!ocupado)confirmarExclusao(musica)});
      acoes.append(editar,excluir);item.append(texto,acoes);lista.append(item);
    });
  }
  async function carregar(){
    const id=++consulta;dialog.setAttribute('aria-busy','true');lista.replaceChildren();mensagem(status,'Carregando acervo...','carregando');
    try {const resposta=await listarMusicas();if(id!==consulta||!dialog.open)return;musicas=resposta.musicas;desenharLista();mensagem(status,`${musicas.length} músicas disponíveis (GET ${resposta.status}).`,'sucesso');}
    catch(erro){if(id!==consulta||!dialog.open)return;musicas=[];mensagem(status,textoDoErro(erro),'erro');}
    finally{if(id===consulta)dialog.setAttribute('aria-busy','false');}
  }
  function abrirGestao(){if(dialog.open)return;busca.value='';dialog.showModal();carregar();}
  function contarTrecho(){document.getElementById('trecho-contador').textContent=`${form.elements.trecho.value.length} / 200 caracteres`;}
  function abrirFormulario(musica){
    editando=musica||null;form.reset();formStatus.textContent='';
    [...form.elements].forEach(el=>el.removeAttribute('aria-invalid'));
    document.getElementById('musica-form-titulo').textContent=musica?'Editar música':'Nova música';
    if(musica){for(const campo of ['titulo','artista','album','humor','duracao','trecho','capa','previa'])form.elements[campo].value=musica[campo]??'';form.elements.tags.value=(musica.tags||[]).join(', ');form.elements.favorito.checked=musica.favorito===true;}
    contarTrecho();formDialog.showModal();form.elements.titulo.focus();
  }
  function lerFormulario(){
    const c=form.elements;return{titulo:c.titulo.value.trim(),artista:c.artista.value.trim(),album:c.album.value.trim(),humor:c.humor.value,duracao:Number(c.duracao.value),trecho:c.trecho.value.trim(),tags:FormularioMusica.normalizarTags(c.tags.value),capa:c.capa.value.trim(),previa:c.previa.value.trim(),favorito:c.favorito.checked};
  }
  async function refletirMutacao(texto){
    // carregarMusicas atualiza Descobrir e emite musicas-carregadas para os indicadores.
    const atualizado=await carregarMusicas();
    if(atualizado){musicas=[...estado.musicas];desenharLista();mensagem(status,texto,'sucesso');}
    else{mensagem(status,`${texto} A gravação foi concluída, mas não foi possível recarregar o acervo. Use Atualizar.`,'erro');}
  }
  form.addEventListener('submit',async evento=>{
    evento.preventDefault();if(ocupado)return;
    [...form.elements].forEach(el=>el.removeAttribute('aria-invalid'));
    const dados=lerFormulario(),problema=FormularioMusica.validar(dados);
    if(problema){mensagem(formStatus,problema.mensagem,'erro');form.elements[problema.campo].setAttribute('aria-invalid','true');form.elements[problema.campo].focus();return;}
    const original=editando;alterarOcupado(true);mensagem(formStatus,'Salvando música...','carregando');
    try{
      const resposta=original?await substituirMusica(original.id,{...original,...dados}):await criarMusica(dados);
      formDialog.close();await refletirMutacao(original?`Música atualizada (PUT ${resposta.status}).`:`Música cadastrada (POST ${resposta.status}).`);
    }catch(erro){mensagem(formStatus,textoDoErro(erro),'erro');}
    finally{alterarOcupado(false);}
  });
  function confirmarExclusao(musica){
    excluindo=musica;document.getElementById('exclusao-descricao').textContent=`${musica.titulo} — ${musica.artista}`;exclusaoStatus.textContent='';exclusao.showModal();cancelarExclusao.focus();
  }
  confirmar.addEventListener('click',async()=>{
    if(ocupado||!excluindo)return;const musica=excluindo;alterarOcupado(true);mensagem(exclusaoStatus,'Excluindo música...','carregando');
    try{const resposta=await excluirMusica(musica.id);exclusao.close();excluindo=null;await refletirMutacao(`Música excluída (DELETE ${resposta.status}).`);document.getElementById('gestao-nova').focus();}
    catch(erro){mensagem(exclusaoStatus,textoDoErro(erro),'erro');}
    finally{alterarOcupado(false);}
  });
  document.querySelectorAll('[data-abrir-gestao]').forEach(b=>b.addEventListener('click',abrirGestao));
  document.getElementById('gestao-fechar').addEventListener('click',()=>{if(!ocupado)dialog.close()});
  dialog.addEventListener('close',()=>{consulta++;dialog.setAttribute('aria-busy','false')});
  for(const janela of [dialog,formDialog,exclusao])janela.addEventListener('cancel',evento=>{if(ocupado)evento.preventDefault()});
  document.getElementById('gestao-atualizar').addEventListener('click',()=>{if(!ocupado)carregar()});
  document.getElementById('gestao-nova').addEventListener('click',()=>{if(!ocupado)abrirFormulario()});
  busca.addEventListener('input',desenharLista);
  form.elements.trecho.addEventListener('input',contarTrecho);
  cancelar.addEventListener('click',()=>{if(!ocupado)formDialog.close()});
  cancelarExclusao.addEventListener('click',()=>{if(!ocupado){exclusao.close();excluindo=null;}});
})();
