import { Logger } from './logger/logger';
import { fillConfigDefaults, getUserConfigFile, replacePathVars } from './util/config';
import { BuildContext, BuildState, TaskInfo } from './util/interfaces';

import { DeepImport, getNodeModulesMainOrModuleMap } from './bundling/utils';


export function closure(context: BuildContext, configFile: string) {
  // first thing we need to do is read
  configFile = getUserConfigFile(context, taskInfo, configFile);

  const logger = new Logger('closure bundler');

  return closureWorker(context, configFile)
    .then(() => {
      context.bundleState = BuildState.SuccessfulBuild;
      logger.finish();
    })
    .catch(err => {
      context.bundleState = BuildState.RequiresBuild;
      throw logger.fail(err);
    });
}

export function closureWorker(context: BuildContext, configFile: string): Promise<any> {
  return getNodeModulesMainOrModuleMap(context.tmpDir).then((map: Map<string, DeepImport>) => {
    map.forEach((deepImport: DeepImport, file: string) => {
      console.log(`${file} has a deep import of ${deepImport.relativePath}`);
    });
  });
}

const taskInfo: TaskInfo = {
  fullArg: '--closureBundler',
  shortArg: '-cb',
  envVar: 'IONIC_CLOSURE_BUNDLER',
  packageConfig: 'ionic_closure_bundler',
  defaultConfigFile: 'closure_bundler.config'
};
