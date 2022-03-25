// @flow

/* eslint-env node */

/*::
type CompilationException = {
  compilerPath: string,
  details?: string,
  loc?: string,
  message?: string,
  moduleName?: string,
  moduleTrace?: Array<{
    originName: string,
    dependencies?: Array<{
      loc?: string,
    }>,
  }>,
};

type CompilationStats = {
  name: string,
  errors: Array<CompilationException>,
  warnings: Array<CompilationException>,
  children: Array<CompilationStats>
};
*/

function formatCompilationException(
  exception /*: CompilationException*/
) /*: string*/ {
  return [
    [`${exception.compilerPath}:`, exception.moduleName, exception.loc]
      .filter(Boolean)
      .join(' '),
    exception.message,
    ...(exception.moduleTrace || []).map((module) =>
      [
        ` @ ${module.originName}`,
        ...(module.dependencies || []).map((dep) => dep.loc),
      ]
        .filter(Boolean)
        .join(' ')
    ),
    exception.details,
  ]
    .filter(Boolean)
    .join('\n');
}

function dedupeCompilationExceptions(
  exceptions /*: Array<CompilationException>*/
) /*: Array<string>*/ {
  const re = /BabelLoaderError(.|\n)+( {4}at transpile)/gim;
  const set = new Set(
    exceptions.map((exception) =>
      formatCompilationException(exception).replace(re, '$2')
    )
  );
  return Array.from(set);
}

/*::
type StatsExceptionsKey = 'errors' | 'warnings';

declare function collectStatsExceptions(key: StatsExceptionsKey, stats: CompilationStats): Array<string>;
declare function collectStatsExceptions(key: StatsExceptionsKey, stats: CompilationStats, depth: number): Array<CompilationException>;
*/

function collectStatsExceptions(
  key /*: StatsExceptionsKey*/,
  stats /*: CompilationStats*/,
  depth /*:? number*/ = 0
) /*: Array<string> | Array<CompilationException>*/ {
  let exceptions = stats[key].map((exception) => ({
    // Ensure that the `compilerPath` is always present
    compilerPath: stats.name,
    ...exception,
  }));

  if (stats.children && stats.children.length) {
    exceptions = exceptions.concat(
      stats.children.reduce((x, child) => {
        return x.concat(collectStatsExceptions(key, child, (depth || 0) + 1));
      }, [])
    );
  }

  return depth === 0 ? dedupeCompilationExceptions(exceptions) : exceptions;
}

function getStatsErrors(stats /*: CompilationStats*/) {
  return collectStatsExceptions('errors', stats);
}

function getStatsWarnings(stats /*: CompilationStats*/) {
  return collectStatsExceptions('warnings', stats);
}

module.exports = {
  getStatsErrors,
  getStatsWarnings,
};
