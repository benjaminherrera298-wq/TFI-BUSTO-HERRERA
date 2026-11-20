import { readFile } from 'node:fs/promises';
import { parse, compileScript } from 'vue/compiler-sfc';

const compiledModules = new Map();

// Compila también los componentes hijos .vue sin crear archivos temporales.
async function componentModule(url) {
  if (!compiledModules.has(url.href)) {
    compiledModules.set(url.href, (async () => {
      const source = await readFile(url, 'utf8');
      const { descriptor, errors } = parse(source, { filename: url.pathname });
      if (errors.length) throw errors[0];
      const compiled = compileScript(descriptor, { id: 'vue-component-test', inlineTemplate: true });
      const dependencies = new Map();
      const relativeImports = /from\s+(['"])(\.[^'"]+\.vue)\1/g;
      for (const [, , relativePath] of compiled.content.matchAll(relativeImports)) {
        dependencies.set(relativePath, await componentModule(new URL(relativePath, url)));
      }
      const code = compiled.content
        .replace(relativeImports, (match, quote, relativePath) => `from ${JSON.stringify(dependencies.get(relativePath))}`)
        .replace(/from (['"])vue\1/g, `from ${JSON.stringify(import.meta.resolve('vue'))}`);
      return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
    })());
  }
  return compiledModules.get(url.href);
}

// Usa el compilador que ya incluye Vue, sin generar archivos de prueba en src/.
export async function loadVueComponent(url) {
  return (await import(await componentModule(url))).default;
}
