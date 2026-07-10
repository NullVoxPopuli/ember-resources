/**
 * @param {string} text
 * @param {Record<string, string>} replacements
 */
export function changeImportPaths(text, replacements) {
  let result = text;

  for (const [before, after] of Object.entries(replacements)) {
    result = result.replaceAll(before, after);
  }

  return result;
}

/**
 * @param {string} specifier
 */
const importSuffix = (specifier) => new RegExp(`from ("|')${specifier}("|')`);

/**
 * @param {string} text
 * @param {string} name
 * @param {string} importPath
 * @param {string} newImportPath
 */
export function changeNamedImport(text, name, importPath, newImportPath) {
  const needsFixed = text.includes(importPath) && text.includes(name);
  const suffixTest = importSuffix(importPath);

  if (!needsFixed) {
    return text;
  }

  const lines = text.split('\n');
  const newLines = [];

  for (const line of lines) {
    // empty line
    if (line.trim().length === 0) {
      newLines.push(line);
      continue;
    }

    const foundImport = suffixTest.test(line);

    if (!foundImport) {
      newLines.push(line);
      continue;
    }

    /**
     * ignore `import *`
     *
     * Our imports we're migrating from don't use `*` anyway
     */
    if (line.includes('import *')) {
      newLines.push(line);
      continue;
    }

    /**
     * We found the end of the import, now we need to go backwards to find the `import` keyword.
     * This could be:
     * - on the same line
     * - on a separate line (above)
     */
    const isSameLine = /import \{/.test(line);
    /** @type {string[]} */
    let imports = [];

    if (isSameLine) {
      const importMatcher = line.match(/\{([^}]+)\}/);

      imports =
        importMatcher?.[1]
          ?.split(',')
          .map((s) => s.trim())
          .filter(Boolean) ?? [];
    } else {
      /**
       * Go back until we find the import
       */
      const lines = [];

      while (newLines.length > 0) {
        const last = newLines.pop();

        if (last === undefined) break;

        lines.unshift(last);

        const hasImport = /import \{/.test(last);

        if (hasImport) {
          break;
        }
      }

      const importLine = lines.join('') + line;
      const importMatcher = importLine.match(/\{([^}]+)\}/);

      imports =
        importMatcher?.[1]
          ?.split(',')
          .map((s) => s.trim())
          .filter(Boolean) ?? [];
    }

    if (imports.length > 0) {
      /**
       * We could have "Resource" or "type Resource"
       */
      const toMove = imports.filter((x) => x.endsWith(name));
      const toKeep = imports.filter((x) => !x.endsWith(name));

      if (toMove.length > 0) {
        newLines.push(`import { ${toMove.join(', ')} } from '${newImportPath}';`);
      }

      if (toKeep.length > 0) {
        newLines.push(`import { ${toKeep.join(', ')} } from '${importPath}';`);
      }

      continue;
    }

    newLines.push(line);
  }

  const result = newLines.join('\n');

  return result;
}
