import { readFile } from 'node:fs/promises';
import { parse, compileScript } from 'vue/compiler-sfc';

// Usa el compilador que ya incluye Vue, sin generar archivos de prueba en src/.
export async function loadVueComponent(url) {
  const source = await readFile(url, 'utf8');
  const { descriptor, errors } = parse(source, { filename: url.pathname });
  if (errors.length) throw errors[0];
  const compiled = compileScript(descriptor, { id: 'catalog-view-test', inlineTemplate: true });
  const code = compiled.content.replace(/from (['"])vue\1/g, `from ${JSON.stringify(import.meta.resolve('vue'))}`);
  return (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default;
}
