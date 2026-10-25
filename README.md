# MoodTune

Trabalho da disciplina de Banco de Dados (Engenharia de Software, UNC) — professor Luis Claudio.

O MoodTune é um site onde a pessoa escolhe **como está se sentindo** e recebe uma música com um
**trecho da letra destacado**, junto com a capa do álbum e uma prévia de 30 segundos.

## Equipe

| Integrante | Parte |
|---|---|
| Luiz | Dados: modelagem e banco no Docker |
| Henrique | API: requisições HTTP, coleção do Postman e script de importação |
| Gula | Interface: frontend, painel e gráficos |

## Como rodar

Pré-requisitos: Docker e Node.js 18 ou mais novo.

```bash
# 1. sobe o MongoDB e o RESTHeart
docker compose up -d

# 2. importa as músicas das APIs externas para o banco (demora ~1 minuto)
node scripts/importar.js
```

Para conferir se subiu:

```bash
docker compose ps                                        # os 2 serviços devem estar "running"
curl -u admin:secret "http://localhost:8080/musicas?pagesize=100"
```

### Parar e apagar o ambiente

```bash
docker compose logs -f restheart   # acompanhar os erros do RESTHeart
docker compose stop                # pausar sem perder nada
docker compose down                # parar e remover os containers (os dados continuam)
docker compose down -v             # parar e APAGAR os dados do volume
```

Os dados sobrevivem ao `docker compose down` porque ficam no volume nomeado `dados-mongo`.
Só o `-v` apaga de verdade — e aí é preciso rodar a importação de novo.

## Arquitetura

```
APIs externas (só GET, só na importação)          Banco                Site
┌──────────────────────┐
│ iTunes Search API    │  metadados, capa, prévia
│ LRCLIB               │  letra (só o trecho)      ──►  MongoDB   ──►  frontend
└──────────────────────┘      scripts/importar.js      + RESTHeart     (lê e grava
                                                        :8080           só no banco)
```

As duas APIs externas não têm id em comum. A ligação entre elas é feita por **artista + título**,
usando a **duração em segundos** como confirmação: primeiro perguntamos ao iTunes, depois usamos os
nomes que ele devolve para pedir a letra à LRCLIB.

O site **não chama as APIs externas** a cada clique: ele lê e grava apenas no banco.

### Banco

MongoDB 7 + RESTHeart 8, ambos em Docker (`docker-compose.yml`), com volume nomeado `dados-mongo`
para os dados não sumirem quando o container é recriado. Nada em nuvem.

- API: `http://localhost:8080/musicas`
- Autenticação: Basic `admin` / `secret` (padrão do RESTHeart, aceitável porque só roda local)

## Modelo do documento

```json
{
  "trackId": 1122782283,
  "titulo": "Yellow",
  "artista": "Coldplay",
  "album": "Parachutes",
  "humor": "apaixonado",
  "duracao": 269,
  "trecho": "Look at the stars, look how they shine for you",
  "tags": ["alternativo"],
  "capa": "https://.../300x300bb.jpg",
  "previa": "https://.../preview.m4a",
  "favorito": false,
  "criadoEm": "2026-10-25T19:11:59.496Z",
  "atualizadoEm": "2026-10-25T19:11:59.496Z"
}
```

- **Número:** `duracao` (segundos) — **Data:** `criadoEm` / `atualizadoEm` — **Lista embutida:** `tags`
- **Campos criados pelo grupo:** `humor`, `trecho`, `favorito`, `atualizadoEm`
- `titulo`, `artista`, `album` e `duracao` vêm das APIs, não são digitados à mão.

**Embutido x referenciado.** As `tags` ficam **embutidas** no documento porque são poucas, mudam
junto com a música e nunca são consultadas sozinhas — separá-las em outra coleção só criaria uma
busca a mais para montar a tela.

Já a letra é **referenciada**: ela continua na LRCLIB e nós guardamos apenas o `trecho` destacado.
O `trackId` é o id da música no iTunes e cumpre o mesmo papel para os metadados — em vez de copiar
o registro inteiro da API para dentro do banco, guardamos a chave que permite voltar lá quando
precisar. É o que mantém o documento pequeno e evita duplicar dado que não é nosso.

O `_id` volta no formato `{ "$oid": "..." }`.

## Endpoints

| Ação | Método e URL | Status |
|---|---|---|
| Criar coleção | `PUT /musicas` | 201 (200 se já existia) |
| Inserir | `POST /musicas` | 201, id no cabeçalho `Location` |
| Listar | `GET /musicas?pagesize=100` | 200 |
| Buscar uma | `GET /musicas/{id}` | 200 / 404 |
| Filtrar por humor | `GET /musicas?filter={"humor":"feliz"}` | 200 |
| Substituir | `PUT /musicas/{id}` | 200 |
| Alterar campos | `PATCH /musicas/{id}` | 200 |
| Excluir | `DELETE /musicas/{id}` | 204 |
| Sem autenticação | qualquer uma | 401 |

Detalhe importante para o frontend: o `fetch` **não** cai no `catch` quando o status é 404 ou 500 —
é preciso sempre conferir `res.ok`.

## Script de importação

`scripts/importar.js` — sem nenhuma dependência externa (usa o `fetch` embutido no Node 18+).

Ele lê a lista do grupo em `scripts/musicas.json` (artista, título, humor e, opcionalmente, um
trecho escolhido à mão) e, para cada música: consulta o iTunes, consulta a LRCLIB, monta o documento
e faz `POST` no banco.

```bash
node scripts/importar.js              # importa o que ainda não está no banco
node scripts/importar.js --teste      # só consulta as APIs e mostra o resultado, não grava
node scripts/importar.js --limite=5   # importa só as 5 primeiras
node scripts/importar.js --limpar     # APAGA tudo e importa de novo
```

Decisões que vale explicar:

- **Não para quando uma música falha.** Cada música roda dentro de um `try/catch`; o erro é contado
  e listado no resumo do final, e o script segue para a próxima.
- **Não duplica.** Antes de gravar, pergunta ao banco se já existe música com o mesmo título e
  artista. A consulta ao iTunes vem **antes** dessa checagem de propósito: o documento é gravado com
  o nome que o iTunes devolve (`Pais Tropical` da nossa lista vira `País Tropical`), então comparar
  usando o nome da lista não acharia o que já está lá e duplicaria tudo a cada execução.
- **Retentativa.** A LRCLIB responde 503 ("server is busy") quando recebe muitas consultas seguidas.
  O script tenta de novo até 5 vezes, dobrando a espera (1s, 2s, 4s...). 404 não é retentado, porque
  ali a resposta é definitiva.
- **Escolha do resultado no iTunes.** A busca devolve várias versões; a escolha pesa **artista
  (x10) e título**, e desconta versões ao vivo / demo / cover. Sem o peso do artista, "Creep" do
  Stone Temple Pilots empatava com o do Radiohead, e um cover do Boyce Avenue ganhava do Green Day.
- **Escolha do trecho.** A linha que mais se repete na letra costuma ser o refrão. Linhas com
  palavras muito repetidas (`Ba-de-ya, de-ya, de-ya`) são descartadas antes, senão o destaque do
  site cairia em onomatopeia. Um `trecho` escrito na lista sempre tem prioridade sobre o automático.

Estado atual: **35 músicas** no banco, distribuídas em 6 humores (feliz, triste, apaixonado,
nostálgico, animado, calmo).

Três músicas ficaram gravadas em versão alternativa — `Good Riddance [Live]`, `Back To Black
(Original Demo)` e `Garota de Ipanema (Live In San Francisco, 2003)`. Não é falha do script: a
versão de estúdio delas **não existe no catálogo do iTunes Brasil** (conferimos buscando 50
resultados). O que está no banco é o melhor que a API oferece, e é dado real dela.

## Coleção do Postman

`postman/colecao.json` — 12 requisições numeradas, na mesma ordem do fluxo do projeto:

- **01 e 02** — as duas APIs externas (iTunes e LRCLIB), que é de onde os dados vêm. Usam `noauth`,
  para não mandar a senha do nosso banco para serviços de terceiros.
- **03 a 12** — o CRUD completo no banco, incluindo o 404 depois do DELETE e o 401 sem autenticação.

Rodam em ordem: a 04 (POST) lê o id do cabeçalho `Location` e guarda na variável `idMusica`, e as
seguintes reutilizam esse id sozinhas — não é preciso colar id nenhum à mão.

Importe no Postman, ou rode pela linha de comando:

```bash
npx newman run postman/colecao.json
```

Última execução: **12 requisições, 22 asserções, 0 falhas.**

## Uso de IA

Conforme permitido pelo professor, registramos onde a IA (Claude) foi usada:

- **`scripts/importar.js`** — escrito com apoio da IA: estrutura do script, tratamento de erros,
  retentativa e os critérios de escolha do resultado do iTunes e do trecho da letra. O código foi
  revisado e testado pelo grupo, e os comentários explicam cada decisão.
- **`postman/colecao.json`** — coleção e testes gerados com apoio da IA, depois executados e
  conferidos com o Newman contra o banco real.
- **`frontend/app.js`** — as funções que falam com o banco (os cinco métodos HTTP) foram escritas
  com apoio da IA, seguindo o código de exemplo do enunciado.
- **`README.md`** — redação com apoio da IA.
- A lista de músicas, os humores e a modelagem dos campos foram decididos pelo grupo.

## Estrutura do repositório

```
Trabalho_BD_III_MoodTune/
├── docker-compose.yml       MongoDB + RESTHeart
├── frontend/
│   ├── index.html           página do site
│   ├── app.js               as requisições HTTP ao banco
│   └── style.css            estilos
├── postman/colecao.json     coleção exportada, com os testes
├── scripts/
│   ├── importar.js          GET nas APIs + POST no banco
│   └── musicas.json         lista do grupo (artista, título, humor)
└── README.md
```

É a estrutura pedida no enunciado. A pasta `scripts/` é a única adição: a importação roda uma vez
pelo Node, fora do navegador, para não depender de alguém abrir a tela para o banco ser populado.

## Situação de cada requisito

**1. Modelagem NoSQL** — 1,5 ponto

- [x] 1 coleção (`musicas`) com 35 documentos importados das APIs (mínimo era 30)
- [x] 6+ campos, com 1 número (`duracao`), 1 data (`criadoEm`) e 1 lista embutida (`tags`)
- [x] Campos criados pelo grupo: `humor`, `trecho`, `favorito`, `atualizadoEm`
- [x] Exemplo de documento no README, com a justificativa de embutido x referenciado

**2. Métodos HTTP** — 2,5 pontos

- [x] GET nas APIs de origem para importar
- [x] POST gravando cada documento no banco
- [x] GET no banco: listar todos e buscar um pelo id
- [x] PUT substituindo o documento inteiro
- [x] PATCH alterando um único campo (`favorito`)
- [x] DELETE excluindo o documento
- [x] Coleção do Postman exportada com todas as requisições acima
- [ ] Confirmação antes de excluir (é na tela, fica com o frontend)

**3. Frontend** — 2,0 pontos (Gula)

- [ ] Listagem com busca por texto e pelo menos 1 filtro
- [ ] Formulário de criar/editar com validação
- [ ] Mensagens de carregamento, sucesso e erro, mostrando o status HTTP
- [ ] Layout que funcione no celular

**4. Geração de informação (painel)** — 2,0 pontos (Gula)

- [ ] 4+ indicadores numéricos
- [ ] 2+ gráficos de tipos diferentes (Chart.js)
- [ ] 1 ranking (top 5 ou 10) e 1 agrupamento por categoria (músicas por humor)
- [ ] Indicadores se atualizam sozinhos após POST, PUT, PATCH e DELETE
- [ ] Parágrafo no README com a conclusão que os dados permitem tirar

**5. Docker e documentação** — 1,0 ponto

- [x] `docker-compose.yml` na raiz, com MongoDB e RESTHeart
- [x] Volume nomeado (`dados-mongo`)
- [x] `docker compose up -d` sobe tudo sem passo manual além de criar a coleção
- [x] README explica como subir, parar e apagar o ambiente
- [ ] Prints do painel no README (depende do painel)

**Ponto extra (+1,0)** — frontend em container nginx no mesmo compose (`localhost:3000`)

- [ ] Acrescentar o serviço `frontend` ao `docker-compose.yml`

## Observação sobre o tema

O MoodTune usa iTunes Search API + LRCLIB, que **não estão no catálogo de 10 temas** do enunciado.
O próprio enunciado permite ("um grupo pode propor outra API pública, desde que o professor aprove
antes") — só é preciso confirmar que essa aprovação foi registrada.
