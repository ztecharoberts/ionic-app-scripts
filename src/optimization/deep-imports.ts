import { relative } from 'path';
import { FileCache } from '../util/file-cache';
import { changeExtension } from '../util/helpers';

export function convertNodeModulesToDeepImports(dependencyMap: Map<string, Set<string>>, fileCache: FileCache, nodeModulesDirPath: string) {
  dependencyMap.forEach((importeeSet: Set<string>, filePath: string) => {
    const file = fileCache.get(filePath);
    const newContent = processImports(dependencyMap, file.path, file.content, nodeModulesDirPath);
    fileCache.set(file.path, { path: file.path, content: newContent});
  });
}

export function processImports(dependencyMap: Map<string, Set<string>>, filePath: string, fileContent: string, nodeModulesDirPath: string) {
  //  find any import/require statements that do not start with a ./
  const importsToConvert = findNodeModuleImports(fileContent);
  const filesImportedByFilePath = getModulesImportedByImportee(dependencyMap, filePath);

  // for each import to convert, we need to figure out the full path, so let's do that now
  const oldImportStatementToNewImportStatementMap = new Map<string, string>();
  importsToConvert.forEach((importContent: string, entireImportStatement: string) => {
    const deepImportFile = getDeepImportFile(filesImportedByFilePath, filePath, importContent);
    // convert the deep import file to a relative path
    const deepImportRelativePath = changeExtension(relative(nodeModulesDirPath, deepImportFile), '');
    const newImportStatementContent = entireImportStatement.replace(importContent, deepImportRelativePath);
    oldImportStatementToNewImportStatementMap.set(entireImportStatement, newImportStatementContent);
  });

  let modifiedFileContent = fileContent;
  oldImportStatementToNewImportStatementMap.forEach((newValue: string, originalValue: string) => {
    modifiedFileContent = modifiedFileContent.replace(originalValue, newValue);
  });

  return modifiedFileContent;
}

export function findNodeModuleImports(fileContent: string) {
  const importRegex = getImportRegex();
  let results: RegExpExecArray = null;
  const map = new Map<string, string>();
  while ((results = importRegex.exec(fileContent)) && results.length) {
    const fullContent = results[0];
    const toReplace = results[1];
    map.set(fullContent, toReplace);
  }
  const requireRegex = getRequireRegex();
  while ((results = requireRegex.exec(fileContent)) && results.length) {
    const fullContent = results[0];
    const toReplace = results[1];
    map.set(fullContent, toReplace);
  }
  return map;
}

export function getModulesImportedByImportee(dependencyMap: Map<string, Set<string>>, importeeFilePath: string) {
  const set = new Set<string>();
  dependencyMap.forEach((importeeSet: Set<string>, modulePath: string) => {
    if (importeeSet.has(importeeFilePath)) {
      set.add(modulePath);
    }
  });
  return set;
}

export function getDeepImportFile(importSet: Set<string>, filePath: string, importStatementPath: string) {
  const potentialDeepImports = filterImportedFilesByImportStatementContent(importSet, importStatementPath);
  if (potentialDeepImports.size === 1) {
    // sweet, we only have one option, so it's easy
    return Array.from(potentialDeepImports.values())[0];
  } else if (potentialDeepImports.size > 1) {
    // TODO, revisit this to account for multiple versions of a dependency resulting in nested node modules
    // project_root/node_modules/@angular/core/index.js
    // project_root/node_modules/ionic-angular/node_modules/@angular/core/index.js

    // for now, just return the same thing as above
    return Array.from(potentialDeepImports.values())[0];
  }
}

export function filterImportedFilesByImportStatementContent(importSet: Set<string>, importStatementPath: string) {
  const set = new Set<string>();
  importSet.forEach((thePathImported) => {
    if (thePathImported.lastIndexOf(importStatementPath) >= 0) {
      set.add(thePathImported);
    }
  });
  return set;
}

function getImportRegex() {
  return /from.*?['"\`]([^\.].*?)['"\`];/g;
}

function getRequireRegex() {
  return /require.*?['"\`]([^\.].*?)['"\`]\);/g;
}


export interface DeepImport {
  fullPath: string;
  relativePath: string;
  directoryPath: string;
}
