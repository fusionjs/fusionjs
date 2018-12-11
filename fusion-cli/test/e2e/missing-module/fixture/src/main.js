// @noflow
// importing a non-existent module should generate a compiler error
import '__non_existent_module__';

export default function() {}
