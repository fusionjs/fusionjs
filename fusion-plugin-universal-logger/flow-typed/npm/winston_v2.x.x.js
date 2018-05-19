// flow-typed signature: f72cd60f508d8de43456fbf9e3542aa4
// flow-typed version: 72e01bcf2b/winston_v3.x.x/flow_>=v0.34.x

/* eslint-disable  */

declare module 'winston' {
  declare type $winstonLevels = {
    [string]: number,
  };

  declare type $winstonNpmLogLevels = {
    error: number,
    warn: number,
    info: number,
    verbose: number,
    debug: number,
    silly: number,
  };

  declare type $winstonInfo<T: $winstonLevels> = {
    level: $Keys<T>,
    message: string,
  };

  declare type $winstonFormat = Object;

  declare type $winstonFileTransportConfig<T: $winstonLevels> = {
    filename: string,
    level?: $Keys<T>,
  };

  declare class $winstonTransport {}

  declare class $winstonFileTransport<T> extends $winstonTransport {
    constructor($winstonFileTransportConfig<T>): $winstonFileTransport<T>;
  }

  declare type $winstonConsoleTransportConfig<T: $winstonLevels> = {
    level?: $Keys<T>,
  };

  declare class $winstonConsoleTransport<T> extends $winstonTransport {
    constructor(
      config?: $winstonConsoleTransportConfig<T>
    ): $winstonConsoleTransport<T>;
  }

  declare export type $winstonLoggerConfig<T: $winstonLevels> = {
    exitOnError?: boolean,
    format?: $winstonFormat,
    level?: $Keys<T>,
    levels?: T,
    transports?: Array<$winstonTransport | any>,
  };

  declare type $winstonLogger<T: $winstonLevels> = {
    [$Keys<T>]: (message: string) => void,
    add: $winstonTransport => void,
    clear: () => void,
    configure: ($winstonLoggerConfig<T>) => void,
    log: (message: $winstonInfo<T>) => void,
    remove: $winstonTransport => void,
  };

  declare type $winstonConfigSubModule = {
    npm: () => $winstonNpmLogLevels,
  };

  declare type $winstonFormatSubModule = {
    combine: (...args: Array<$winstonFormat>) => $winstonFormat,
    json: () => $winstonFormat,
    prettyPrint: () => $winstonFormat,
    simple: () => $winstonFormat,
    timestamp: () => $winstonFormat,
  };

  declare type $winstonDefaultLogger = $winstonLogger<$winstonNpmLogLevels>;

  declare class $winstonContainer<T> {
    constructor(config?: $winstonLoggerConfig<T>): $winstonContainer<T>;
    add(loggerId: string, config?: $winstonLoggerConfig<T>): $winstonLogger<T>;
    get(loggerId: string): $winstonLogger<T>;
  }

  declare export type format = $winstonFormatSubModule;
  declare export type createLogger = <T>(
    $winstonLoggerConfig<T>
  ) => $winstonLogger<T>;
  declare export type Container = typeof $winstonContainer;
  declare export type loggers = $winstonContainer<*>;
  declare export var Logger: <T>(?$winstonLoggerConfig<T>) => $winstonLogger<T>;
  declare export var transports: {
    Console: typeof $winstonConsoleTransport,
    File: typeof $winstonFileTransport,
  };
}
