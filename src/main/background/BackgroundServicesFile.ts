import * as fs from 'fs';
import * as path from 'path';
import { tryParseJSON } from '../../shared/Util';
import { IBackProcessInfoFile, IBackProcessInfo } from './interfaces';

export class BackgroundServicesFile {
  /** Path to the background services file (relative to the flashpoint root folder) */
  private static filePath: string = './services.json';
  /** Encoding used by background services file */
  private static fileEncoding: string = 'utf8';

  /** Read and parse the file asynchronously */
  public static readFile(flashpointFolder: string): Promise<IBackProcessInfoFile> {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(flashpointFolder, BackgroundServicesFile.filePath), 
                  BackgroundServicesFile.fileEncoding, (error, data) => {
        // Check if reading file failed
        if (error) { return reject(error); }
        // Try to parse json (and callback error if it fails)
        const jsonOrError: string|Error = tryParseJSON(data as string);
        if (jsonOrError instanceof Error) { return reject(jsonOrError); }
        // Parse the JSON object
        const parsed = parseBackProcessInfoFile(jsonOrError);
        // Success!
        return resolve(parsed);
      });
    });
  }
}

function parseBackProcessInfoFile(data: any): IBackProcessInfoFile {
  let parsed: IBackProcessInfoFile = {
    redirector: undefined,
    fiddler: undefined,
    server: undefined,
    start: [],
    stop: [],
  };
  if (data) {
    if (data.redirector) { parsed.redirector = parseBackProcessInfo(data.redirector); }
    if (data.fiddler)    { parsed.fiddler    = parseBackProcessInfo(data.fiddler);  }
    if (data.server)     { parsed.server     = parseBackProcessInfo(data.server);   }
    if (Array.isArray(data.start)) { copyFromArray(parsed.start, data.start); }
    if (Array.isArray(data.stop))  { copyFromArray(parsed.stop,  data.stop);  }
  }
  return parsed;
}

function parseBackProcessInfo(data: any): IBackProcessInfo {
  let parsed: IBackProcessInfo = {
    path: '',
    filename: '',
    arguments: [],
  };
  if (data) {
    parsed.path = str(data.path);
    parsed.filename = str(data.filename);
    if (Array.isArray(data.arguments)) { copyFromArrayStr(parsed.arguments, data.arguments); }
  }
  return parsed;
}

/** Coerce anything to a string */
function str(str: any): string {
  return (str || '') + '';
}

function copyFromArray(dest: Array<IBackProcessInfo>, source: Array<IBackProcessInfo>): void {
  for (let i = source.length - 1; i >= 0; i--) {
    dest[i] = parseBackProcessInfo(source[i]);
  }
}

function copyFromArrayStr(dest: Array<string>, source: Array<string>): void {
  for (let i = source.length - 1; i >= 0; i--) {
    dest[i] = str(source[i]);
  }
}
