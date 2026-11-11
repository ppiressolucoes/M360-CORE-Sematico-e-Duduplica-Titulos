// PEL | Antes da SP DEDUPLICA EDITORIAL | Run Once for All Items
// Rejeita entrada invalida antes de criar uma reserva. Preserva campos originais.
return $input.all().map((item, index) => {
  const entrada = item.json ?? {};
  function escolher(principal, alternativo, nome) {
    // O normalizador posterior usa ?? sobre Start Dedup: nao permitir que
    // campo presente e vazio seja interpretado de forma diferente aqui.
    const valor = entrada[principal] ?? entrada[alternativo];
    if (typeof valor !== 'string' || !valor.trim()) {
      throw new Error(`Entrada PEL invalida: ${nome} ausente ou nao textual (item ${index}).`);
    }
    return valor.trim();
  }
  const titulo = escolher('titulo', 'title', 'titulo/title');
  const link = escolher('link', 'url', 'link/url');
  if (titulo.length > 500) throw new Error(`Entrada PEL invalida: titulo excede 500 caracteres (item ${index}).`);
  if (link.length > 500 || !/^https?:\/\/[^\s/?#]+(?:[/?#][^\s]*)?$/i.test(link)) {
    throw new Error(`Entrada PEL invalida: link deve ser URL HTTP(S) de ate 500 caracteres (item ${index}).`);
  }
  return {json: {...entrada, titulo, link}, pairedItem: {item: index}};
});
