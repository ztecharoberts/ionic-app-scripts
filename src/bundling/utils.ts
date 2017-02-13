import { Stats } from 'fs';
import { join } from 'path';
import { readDirAsync, readFileAsync, statsAsync } from '../util/helpers';

export function getNodeModulesMainOrModuleMap(tmpDirectory: string) {
  // TODO - make recursive to read nested node_modules dirs
  const directoryToRead = join(tmpDirectory, 'node_modules');
  return readDirAsync(directoryToRead).then((fileNames: string[]) => {
    const promises = fileNames.map(fileName => {
      console.log(`Attempting to read stats for ${fileName}`);
      const fullPath = join(directoryToRead, fileName);
      return isDirectory(fullPath);
    });
    return Promise.all(promises);
  }).then((responses: any[]) => {
    console.log('Finished reading stats: ', responses);
    const directories = responses.filter(response => response.directory);
    console.log('directories: ', directories);
    const promises = directories.map(directory => {
      const packageJsonFile = join(directory, 'package.json');
      console.log(`Reading package json file ${packageJsonFile}`);
      return readFileAsync(packageJsonFile).then((fileContent: string) => {
        return {
          fileContent: fileContent,
          path: directory,
          directoryPath: directory
        };
      });
    });
    return Promise.all(promises);
  }).then((fileContentPathPairs: any) => {
    const map = new Map<string, DeepImport>();
    fileContentPathPairs.forEach((fileContentPathPair: any) => {
      const packageJsonObject = JSON.parse(fileContentPathPair.fileContent);
      const relativePathToEntryPoint = packageJsonObject.module ? packageJsonObject.module : packageJsonObject.main;
      map.set(fileContentPathPair.directoryPath, {
        fullPath: join(fileContentPathPair.path, relativePathToEntryPoint),
        relativePath: relativePathToEntryPoint,
        directoryPath: fileContentPathPair.directoryPath
      });
    });
    return map;
  });
}

function isDirectory(filePath: string) {
  return statsAsync(filePath).then((stats: Stats) => {
    return {
      path: filePath,
      directory: stats.isDirectory()
    };
  });
}

export interface DeepImport {
  fullPath: string;
  relativePath: string;
  directoryPath: string;
}
