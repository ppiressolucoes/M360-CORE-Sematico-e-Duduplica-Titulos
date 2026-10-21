const titulo = $('Chamar Reescrever v0.2').first().json.titulo || '';

// remove acentos
const slug = titulo
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

// substitui tudo que não for letra/número por hífen
  .replace(/[^a-zA-Z0-9]+/g, '-')

// remove hífens duplicados
  .replace(/-+/g, '-')

// remove hífen no início/fim
  .replace(/^-|-$/g, '')

// lowercase
  .toLowerCase();

return [{
  json: {
    slug,
    fileName: `${slug}.webp`
  }
}];