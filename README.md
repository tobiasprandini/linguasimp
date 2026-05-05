# LinguaSimp React

Aplicacao React para estudo de idiomas com frases graduadas, blocos clicaveis de vocabulario e progresso local no navegador.

O projeto combina:

- frontend em React + Vite
- dataset local de frases por nivel (`A1`, `A2`, `B1`)
- sincronizacao opcional com Supabase
- admin interno para editar frases e blocos
- geracao e distribuicao de audio das frases
- backend Node/Express para apoiar o fluxo de audio

## Visao geral

No app, cada frase e exibida com seus blocos linguisticos. O usuario pode marcar blocos como conhecidos ou em estudo, e a proxima frase segue a ordem do conjunto carregado.

O frontend carrega as frases locais de `src/data/sentences` e, quando configurado, complementa esses dados com conteudo vindo da tabela `sentences` no Supabase, incluindo frase, traducao, scores e audio.

## Stack

- React 19
- Vite 8
- Tailwind CSS 4
- Supabase
- Express
- ElevenLabs

## Estrutura principal

```text
src/
  components/              UI principal da experiencia de estudo
  data/
    blocks.js              blocos linguisticos reutilizaveis
    sentences/             frases separadas por nivel
  lib/
    runtime/               montagem das frases em tempo de execucao

server/
  index.js                 backend Express
  scripts/
    createBlocksTable.sql  SQL para tabela e bucket de audio dos blocos
    createSentenceRuntimeTables.sql SQL para sentence_blocks e metadados extras
    importBlocks.js        envia blocos locais para o Supabase
    importSentences.js     envia dataset local para o Supabase
    importSentenceBlocks.js envia a composicao das frases para o Supabase
    generatePendingBlockAudio.js gera audio para blocos pendentes
    generatePendingAudio.js gera audio para frases pendentes

scripts/
  analyzeFriendsSrt.mjs    analise de corpus de referencia
```

## Requisitos

- Node.js 18+
- npm
- projeto Supabase configurado
- conta/configuracao ElevenLabs para geracao de audio

## Instalação

### Frontend

```bash
npm install
```

### Backend

```bash
cd server
npm install
```

## Variaveis de ambiente

### Frontend

Crie um arquivo `.env` na raiz:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Backend

Crie um arquivo `.env` dentro de `server/`:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
ELEVENLABS_VOICE_ID_EN=...
ELEVENLABS_VOICE_ID_ES=...
ELEVENLABS_VOICE_ID_FR=...
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
PORT=3001
```

`ELEVENLABS_VOICE_ID` e o fallback geral. Para vozes por idioma, use
`ELEVENLABS_VOICE_ID_EN`, `ELEVENLABS_VOICE_ID_ES` e
`ELEVENLABS_VOICE_ID_FR`. Se quiser separar frase e bloco, use variaveis mais
especificas como `ELEVENLABS_SENTENCE_VOICE_ID_EN` ou
`ELEVENLABS_BLOCK_VOICE_ID_ES`.

## Como rodar

### Frontend

```bash
npm run dev
```

### Backend

```bash
cd server
npm run dev
```

O frontend roda via Vite. O backend sobe um servidor Express com rota de health check em `GET /health`.

## Admin

O app inclui um admin interno para editar conteudo salvo no Supabase.

Como abrir:

1. Rode o frontend com `npm run dev`.
2. Rode o backend com `cd server && npm run dev`.
3. No app, clique em `Abrir admin` ou acesse `#admin`.

O admin atual permite:

- criar frases novas
- criar blocos novos
- editar frases (`text`, `translation`, `level`, `scores`, `tags`, `content_type`)
- editar blocos base (`external_id`, `canonical`, `gloss`, `tags`, `level` e metadados)
- editar os blocos de cada frase (`sentence_blocks`), incluindo ordem, `surface`, gloss contextual e `trailing_text`
- criar automaticamente um bloco novo em `blocks` ao salvar um `sentence_block` com `block_external_id` ainda inexistente
- duplicar frases
- excluir frases
- excluir blocos que nao estejam em uso
- regenerar audio de frases e blocos direto da interface
- ouvir preview do audio no proprio admin
- filtrar por nivel e status de audio
- navegar com busca e paginacao

## Scripts disponiveis

### Raiz

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run analyze:friends
```

`npm run analyze:friends` executa o fluxo descrito em [`scripts/README.md`](/Users/tobiasprandini/linguasimp/scripts/README.md).

### `server/`

```bash
npm run dev
npm run import-sentences
npm run import-blocks
npm run import-sentence-blocks
npm run assign-lessons
npm run generate-audio
npm run generate-block-audio
```

- `npm run import-sentences`: importa o dataset local de `src/data/sentences` para a tabela `sentences`
- `npm run import-blocks`: importa o dataset local de `src/data/blocks.js` para a tabela `blocks`
- `npm run import-sentence-blocks`: importa a relacao entre frases e blocos para a tabela `sentence_blocks`
- `npm run assign-lessons`: separa as frases ja importadas em `lesson_1`, `lesson_2` e `lesson_3`
- `npm run generate-audio`: busca frases com `audio_status = "pending"`, gera audio no ElevenLabs e envia para o bucket `sentence-audio`
- `npm run generate-block-audio`: busca blocos com `audio_status = "pending"`, gera audio no ElevenLabs e envia para o bucket `block-audio`

## Setup de blocos

Para habilitar audio ao clicar em cada bloco:

1. Rode o SQL de [`server/scripts/createBlocksTable.sql`](/Users/tobiasprandini/linguasimp/server/scripts/createBlocksTable.sql) no SQL Editor do Supabase.
2. Rode o SQL de [`server/scripts/createSentenceRuntimeTables.sql`](/Users/tobiasprandini/linguasimp/server/scripts/createSentenceRuntimeTables.sql) para criar `sentence_blocks` e os metadados extras de `sentences`.
   - Se a tabela `sentences` ja existir sem licoes, rode [`server/scripts/addLessonsToSentences.sql`](/Users/tobiasprandini/linguasimp/server/scripts/addLessonsToSentences.sql) ou aplique a migration [`supabase/migrations/20260426171000_add_sentence_lessons.sql`](/Users/tobiasprandini/linguasimp/supabase/migrations/20260426171000_add_sentence_lessons.sql).
3. No painel do Supabase, confirme que o bucket publico `block-audio` existe.
4. No diretório `server/`, execute `npm run import-sentences`.
5. Ainda em `server/`, execute `npm run import-blocks`.
6. Depois execute `npm run import-sentence-blocks`.
7. Execute `npm run assign-lessons`.
8. Por fim, execute `npm run generate-block-audio`.

Depois disso, o frontend passa a montar o runtime priorizando o Supabase para frases, blocos e composicao das frases, com fallback local se algo estiver faltando.

## Fluxo de dados

1. O app tenta montar as frases completas a partir de `sentences`, `blocks` e `sentence_blocks` no Supabase.
2. Se alguma parte ainda nao estiver pronta no banco, o frontend faz fallback para [`src/data/sentences/index.js`](/Users/tobiasprandini/linguasimp/src/data/sentences/index.js).
3. O audio publico e resolvido a partir dos buckets `sentence-audio` e `block-audio`.
4. A proxima frase segue a ordem das frases carregadas.
5. O progresso dos blocos fica salvo no `localStorage` do navegador.

## Backend e audio

O backend possui a rota `POST /generate-sentence-audio`, que:

- recebe `text` e `language_code`
- evita duplicatas por frase normalizada
- gera audio no ElevenLabs
- envia o `.mp3` para o Supabase Storage
- grava a frase na tabela `sentences`

Tambem existe um fluxo batch para gerar audio de frases ja importadas e ainda pendentes.

## Banco esperado

Pelo uso atual do codigo, o projeto espera:

- tabela `blocks`
- tabela `sentence_blocks`
- tabela `sentences`
- bucket `block-audio`
- bucket `sentence-audio`

A tabela `sentences` contem campos usados pelo app e scripts, incluindo:

- `external_id`
- `text`
- `translation`
- `language_code`
- `level`
- `difficulty_score`
- `naturalness_score`
- `topic_tags`
- `grammar_tags`
- `content_type`
- `audio_path`
- `audio_status`

A tabela `blocks` contem campos usados pelo app e scripts, incluindo:

- `external_id`
- `canonical`
- `normalized_text`
- `gloss`
- `tags`
- `level`
- `curriculum_group`
- `grammar_focus`
- `teaching_priority`
- `chunk_strategy`
- `language_code`
- `audio_path`
- `audio_status`

A tabela `sentence_blocks` contem campos usados pelo app e scripts, incluindo:

- `external_id`
- `sentence_external_id`
- `block_external_id`
- `position`
- `surface`
- `contextual_gloss`
- `trailing_text`

## Observacoes

- Sem variaveis do Supabase, o frontend nao consegue criar o client corretamente.
- O progresso fica local ao navegador.
- O dataset local continua sendo a fonte primaria das frases exibidas.
