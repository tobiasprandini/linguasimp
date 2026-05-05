# Corpus Workflow

Use `npm run analyze:friends` para analisar os arquivos `.srt` de `Friends` na pasta `Downloads`.

O script:

- remove numeracao e timestamps do `.srt`
- descarta linhas muito curtas ou longas demais para o app
- filtra linhas com sinais de conteudo improprio
- agrupa o corpus em tipos de fala uteis para criar frases originais

Esse fluxo serve como referencia de naturalidade. Ele nao deve ser usado para copiar falas diretamente para o dataset.

Se voce quiser analisar arquivos especificos, pode passar os caminhos manualmente:

```bash
node scripts/analyzeFriendsSrt.mjs "/caminho/arquivo1.srt" "/caminho/arquivo2.srt"
```
