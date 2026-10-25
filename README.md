# Moodtune — Estrutura inicial da interface

Trabalho acadêmico de um aplicativo que relaciona emoções e música.
Responsável pela interface: **Gula**.

## Etapa atual

Branch sugerida: `feat/estrutura-interface`.

Esta entrega contém HTML, CSS e um JavaScript pequeno dedicado à preferência de tema:

- Estrutura semântica da tela Descobrir.
- Identidade visual inicial do Moodtune.
- Representação visual dos seis humores previstos.
- Campos de busca e gênero desabilitados, reservados para etapas futuras.
- Quatro cartões ilustrativos para definir a disposição das músicas.
- Navegação com indicação de telas futuras.
- Layout adaptável a computador e celular.

Não há chamadas de API, seleção funcional de humor, reprodução, formulário funcional, armazenamento ou gráficos nesta etapa. Os cartões não representam músicas reais retornadas por uma API.

## Abrir

Abra `index.html` no navegador ou use Open with Live Server no VS Code. Não precisa instalar pacotes. A fonte do Google Fonts é opcional, com alternativa local caso não carregue.

## Arquivos

- `index.html`: estrutura e conteúdo inicial.
- `style.css`: visual, responsividade e cores dos temas.
- `theme.js`: alternância entre claro e escuro e armazenamento da preferência.
- `.gitignore`: arquivos locais que não devem ser versionados.

## Próximas etapas propostas

Cada etapa deve ser implementada, conferida e commitada quando for feita. A ordem pode ser ajustada conforme o planejamento da equipe.

1. `feat/selecao-humor`: tornar os humores selecionáveis.
2. `feat/busca-itunes`: buscar músicas, exibir título, artista, capa e link para a loja; tratar carregamento, erro e resultado vazio.
3. `feat/filtros-musicas`: filtrar os resultados disponíveis e limpar filtros.
4. `feat/letras-lrclib`: consultar a letra da música escolhida e tratar a ausência de letra.
5. `feat/formulario-momento`: criar o formulário e validar os campos combinados com a equipe.
6. `feat/painel-graficos`: montar o painel a partir dos dados definidos pelo projeto.

### APIs planejadas (ainda não integradas)

- **iTunes Search API:** busca e metadados das músicas, incluindo título, artista, capa e link da loja. Documentação: https://performance-partners.apple.com/search-api
- **LRCLIB:** consulta de letras. Documentação: https://lrclib.net/docs

A lógica que relaciona humor e música será definida pelo projeto; estas integrações não fazem, por si só, a identificação da emoção. A disponibilidade de cada campo e de cada letra será tratada na etapa correspondente.

## Git: trabalho de hoje

Se já existe repositório do grupo, abra a cópia local, parta da branch base combinada com a equipe e crie sua branch:

```bash
git switch -c feat/estrutura-interface
```

Copie os arquivos desta entrega para o local combinado do repositório. Os comandos abaixo assumem que eles estão na raiz; se estiverem numa subpasta, ajuste os caminhos.

```bash
git add index.html style.css
git commit -m "feat: cria estrutura e visual inicial do Moodtune"
git add README.md .gitignore
git commit -m "docs: documenta etapa inicial e integracoes planejadas"
git push -u origin feat/estrutura-interface
```

Se algum nome já existir no repositório, confira antes de substituir o arquivo do grupo. Estes são dois commits de mudanças reais, separados em interface e documentação. As funcionalidades futuras só devem entrar no histórico conforme forem implementadas.

Se o repositório ainda não existe, crie um vazio no GitHub e, dentro desta pasta, execute antes dos comandos acima:

```bash
git init -b main
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
git switch -c feat/estrutura-interface
```

Substitua os campos da URL. Não repita a inicialização se já estiver no repositório do grupo. Se o Git solicitar nome e e-mail, configure a identidade local antes do commit.


## Tema claro e escuro

O botão Tema escuro no cabeçalho alterna os temas. Na primeira visita, a página segue o tema do sistema. Depois de uma escolha manual, guarda a preferência neste navegador usando localStorage. Se o armazenamento estiver bloqueado, a alternância funciona durante a visita. O restante da interface continua apenas visual.

Commit sugerido para esta alteração:

```bash
git add index.html style.css theme.js README.md
git commit -m "feat: adiciona alternancia entre tema claro e escuro"
```
