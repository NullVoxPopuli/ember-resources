/**
 * @param {string} text
 * @param {Record<string, string>} replacements
 */
export function changeImportPaths(text, replacements) {
  let result = text;

  for (let [before, after] of Object.entries(replacements)) {
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
  let needsFixed = text.includes(importPath) && text.includes(name);
  let suffixTest = importSuffix(importPath);

  if (!needsFixed) {
    return text;
  }

  let lines = text.split('\n');
  let newLines = [];

  for (let line of lines) {
    let foundImport = suffixTest.test(line);

    if (!foundImport) {
      newLines.push(line);
      continue;
    }

    /**
     * We found the end of the import, now we need to go backwards to find the `import` keyword.
     * This could be:
     * - on the same line
     * - on a separate line (above)
     */
    let isSameLine = /import \{/.test(line);
    /** @type {string[]} */
    let imports = [];

    if (isSameLine) {
      let importMatcher = line.match(/\{([^}]+)\}/);

      imports =
        importMatcher?.[1]
          ?.split(',')
          .map((s) => s.trim())
          .filter(Boolean) ?? [];
    } else {
      /**
       * Go back until we find the import
       */
      let lines = [];

      while (newLines.length > 0) {
        let last = newLines.pop();

        if (!last) break;

        lines.unshift(last);

        let hasImport = /import \{/.test(last);

        if (hasImport) {
          break;
        }
      }

      let importLine = lines.join('') + line;
      let importMatcher = importLine.match(/\{([^}]+)\}/);

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
      let toMove = imports.filter((x) => x.endsWith(name));
      let toKeep = imports.filter((x) => !x.endsWith(name));

      if (toMove.length > 0) {
        newLines.push(`import { ${toMove.join(', ')} } from '${newImportPath}';`);
      }

      if (toKeep.length > 0) {
        newLines.push(`import { ${toKeep.join(', ')} } from '${importPath}'`);
      }

      continue;
    }

    newLines.push(line);
  }

  let result = newLines.join('\n');

  return result;
}
