'use strict';

const fs = require('node:fs');
const path = require('node:path');

const raiz = path.resolve(__dirname, '..', '..');
const origem = path.join(__dirname, 'validade-temporal.js');
const destino = path.join(raiz, 'codes', 'm360', 'validade-temporal-v0.1.2.js');

const implementacao = fs.readFileSync(origem, 'utf8')
  .replace(/^'use strict';\n\n/, '')
  .replace(/\nmodule\.exports = \{\n  avaliarValidadeTemporal\n\};\n?$/, '\n');

const adaptadorN8n = `// CODE | Validade Temporal v0.1.2
// Core Editorial M360 v0.5.0
// Modo inicial: OBSERVACAO (diagnostica; não interrompe o fluxo)

${implementacao}
const entrada = $input.first()?.json ?? {};
const titulo = String(entrada.titulo ?? entrada.title ?? '').trim();
const link = String(entrada.link ?? entrada.url ?? '').trim();

if (!titulo) {
  throw new Error('Validade Temporal v0.1.2: título obrigatório.');
}

if (!link) {
  throw new Error('Validade Temporal v0.1.2: link obrigatório.');
}

const instanteAvaliacao =
  entrada.instante_avaliacao ??
  entrada.instanteAvaliacao ??
  (
    typeof $now !== 'undefined' &&
    $now &&
    typeof $now.toISO === 'function'
      ? $now.toISO()
      : new Date().toISOString()
  );

const avaliacao = avaliarValidadeTemporal({
  ...entrada,
  titulo,
  instante_avaliacao: instanteAvaliacao,
  timezone: 'America/Sao_Paulo',
  modo: 'OBSERVACAO'
});

return [
  {
    json: {
      ...entrada,
      titulo,
      link,
      core_versao: '0.5.0',
      ...avaliacao
    }
  }
];
`;

fs.writeFileSync(destino, adaptadorN8n);
console.log(path.relative(raiz, destino));
