import * as Promise from 'bluebird';
import * as fs from 'fs-extra-promise';
import * as path from 'path';

function walk(target: string,
              callback: (iterPath: string, stats: fs.Stats) => Promise<any>): Promise<any> {
  let allFileNames: string[];

  return fs.readdirAsync(target)
    .then((fileNames: string[]) => {
      allFileNames = fileNames;
      return Promise.mapSeries(fileNames, (statPath: string) => {
        const fullPath: string = path.join(target, statPath);
        return fs.lstatAsync(fullPath).reflect();
      });
    }).then((res: Array<Promise.Inspection<fs.Stats>>) => {
      // use the stats results to generate a list of paths of the directories
      // in the searched directory
      const subDirs: string[] = [];
      const cbPromises: Array<Promise<any>> = [];
      res.forEach((stat, idx) => {
        if (!stat.isFulfilled()) {
          return;
        }
        const fullPath: string = path.join(target, allFileNames[idx]);
        cbPromises.push(callback(fullPath, stat.value()));
        if (stat.value().isDirectory()) {
          subDirs.push(fullPath);
        }
      });
      return Promise.all(cbPromises.concat(Promise.mapSeries(subDirs, (subDir) => {
        return walk(subDir, callback);
      })));
    });
}

export default walk;
