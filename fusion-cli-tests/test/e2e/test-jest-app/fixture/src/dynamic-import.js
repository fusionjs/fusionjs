// @noflow
export default function() {
  return import('./main').then(dynamicImport => dynamicImport.default());
}
