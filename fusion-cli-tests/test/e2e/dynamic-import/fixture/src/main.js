// @noflow
export default function main() {
  const loader2 = import('./dynamic2.js');
  const loader = import('./dynamic.js');
  loader.then(dynamicImport =>
    console.log(
      JSON.stringify({
        dynamicContent: dynamicImport.default(),
        chunkIds: [loader.__CHUNK_IDS, loader2.__CHUNK_IDS],
      })
    )
  );
}

main();
