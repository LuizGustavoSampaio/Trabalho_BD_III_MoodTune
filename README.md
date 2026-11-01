# MoodTune

Trabalho da disciplina de Banco de Dados (Engenharia de Software, UNC) — professor Luis Claudio.

O MoodTune é um site onde a pessoa escolhe **como está se sentindo** e recebe uma música com um
**trecho da letra destacado**, junto com a capa do álbum e uma prévia de 30 segundos.

## Equipe

| Integrante | Papel |
| --- | --- |
| Luiz | Dados: modelagem e banco no Docker |
| Henrique | API: requisições HTTP, coleção do Postman e importação |
| Gula | Interface: frontend, painel e gráficos |

## Tema e APIs

| API | Para quê | Exemplo |
| --- | --- | --- |
| [iTunes Search API](https://performance-partners.apple.com/search-api) | título, artista, álbum, duração, capa e prévia | `https://itunes.apple.com/search?term=Coldplay+Yellow&entity=song&country=BR&limit=1` |
| [LRCLIB](https://lrclib.net/docs) | letra, de onde sai o trecho destacado | `https://lrclib.net/api/get?track_name=Yellow&artist_name=Coldplay&duration=269` |

As duas são gratuitas, sem chave, e só recebem `GET`. Elas não têm id em comum: a ligação é feita por
**artista + título**, com a **duração** em segundos confirmando que é a mesma gravação. O humor de
cada música é decidido pelo grupo, porque nenhuma das APIs tem essa informação.

As APIs não estão no catálogo do enunciado; foram propostas pelo grupo, como o enunciado permite.

## Como rodar

Pré-requisito: Docker.

```bash
docker compose up -d
```

Abra **http://localhost:3000**.

Na primeira vez o banco está vazio, e o próprio site importa as **60 músicas pré-definidas**
(10 por humor), sem nenhum botão:

1. `PUT /musicas` cria a coleção;
2. para cada música, `GET` no iTunes e `POST` no banco (cerca de 1 minuto);
3. para cada música, `GET` na LRCLIB e `PATCH` com o trecho da letra (alguns minutos, com o site
   já funcionando).

Depois disso o site só lê e grava no banco. A lista pré-definida fica em `frontend/app.js`
(`MUSICAS_PRE_DEFINIDAS`).

```bash
docker compose ps          # os 3 serviços devem estar "running"
docker compose stop        # pausar sem perder nada
docker compose down        # parar e remover os containers (os dados continuam)
docker compose down -v     # parar e APAGAR os dados; na próxima abertura o site importa de novo
docker compose logs -f restheart
```

| Serviço | Imagem | Porta |
| --- | --- | --- |
| `mongodb` | `mongo:7` | 27017 (volume nomeado `dados-mongo`) |
| `restheart` | `softinstigate/restheart:8` | 8080 — API REST, Basic `admin` / `secret` |
| `frontend` | `nginx:alpine` | 3000 — serve a pasta `frontend/` |

Para ver os dados no MongoDB Compass: `mongodb://localhost:27017`, banco `restheart`, coleção
`musicas`.

## Estrutura

```
├── docker-compose.yml       MongoDB + RESTHeart + nginx
├── frontend/
│   ├── index.html
│   ├── app.js               requisições ao banco, importação e tela
│   └── style.css
├── postman/colecao.json     coleção exportada, com testes
├── docs/prints/             prints das requisições
└── README.md
```

## Modelo do documento

Coleção `musicas`:

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

* **Número:** `duracao` (segundos) · **Data:** `criadoEm`, `atualizadoEm` · **Lista embutida:** `tags`
* **Campos criados pelo grupo:** `humor`, `trecho`, `favorito`, `atualizadoEm`
* `titulo`, `artista`, `album`, `duracao`, `capa` e `previa` vêm do iTunes; `trecho` vem da LRCLIB.

**Embutido:** as `tags` ficam dentro do documento porque são poucas, mudam junto com a música e
nunca são consultadas sozinhas.

**Referenciado:** a letra completa continua na LRCLIB, e o banco guarda só o `trecho` destacado. O
`trackId` é a chave da música no iTunes: em vez de copiar o registro inteiro da API, guardamos o id
que permite voltar lá.

## Endpoints

Base `http://localhost:8080`, autenticação Basic `admin` / `secret`.

| Ação | Método e URL | Status |
| --- | --- | --- |
| Criar coleção | `PUT /musicas` | 201 (200 se já existia) |
| Inserir | `POST /musicas` | 201, id no cabeçalho `Location` |
| Listar | `GET /musicas?pagesize=100` | 200 |
| Buscar uma | `GET /musicas/{id}` | 200 / 404 |
| Filtrar por humor | `GET /musicas?filter={"humor":"feliz"}` | 200 |
| Substituir | `PUT /musicas/{id}` | 200 |
| Alterar campos | `PATCH /musicas/{id}` | 200 |
| Excluir | `DELETE /musicas/{id}` | 204 |
| Sem autenticação | qualquer uma | 401 |

No site, quem visita escolhe um humor (`GET` filtrado e sorteio de uma música), busca, filtra e
favorita (`PATCH`). O botão **Gerenciar músicas** mostra **＋ Nova música** (`POST`), **Editar**
(`PUT`, formulário com validação) e **Excluir** (`DELETE`, com confirmação). Toda mensagem mostra o
status HTTP da resposta.

## Coleção do Postman

`postman/colecao.json` tem 12 requisições, na ordem do fluxo: **01–02** nas APIs externas e
**03–12** no banco (CRUD completo, o 404 depois do DELETE e o 401 sem autenticação). A 04 (POST)
guarda o id do cabeçalho `Location` na variável `idMusica`, usada pelas seguintes.

```bash
npx newman run postman/colecao.json
```

Prints de cada requisição, com o status à mostra:

| Requisição | Status | Print |
| --- | --- | --- |
| iTunes | 200 | [api-itunes.png](docs/prints/api-itunes.png) |
| LRCLIB | 200 | [api-lrclib.png](docs/prints/api-lrclib.png) |
| Criar coleção | 200 | [criar-colecao-200.png](docs/prints/criar-colecao-200.png) |
| POST | 201 | [post-201.png](docs/prints/post-201.png) |
| GET lista | 200 | [get-lista-200.png](docs/prints/get-lista-200.png) |
| GET filtro | 200 | [get-filtro-200.png](docs/prints/get-filtro-200.png) |
| PUT | 200 | [put-200.png](docs/prints/put-200.png) |
| DELETE | 204 | [delete-204.png](docs/prints/delete-204.png) |
| GET depois do DELETE | 404 | [get-404.png](docs/prints/get-404.png) |
| Sem autenticação | 401 | [sem-auth-401.png](docs/prints/sem-auth-401.png) |
