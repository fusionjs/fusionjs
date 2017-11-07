# Babel plugin

Before:
```
import {syncChunkPaths} from 'framework';
syncChunkPaths();
```
After:
```
import {syncChunkPaths} from 'framework';
syncChunkPaths(require('__SECRET_SYNC_CHUNK_PATHS_LOADER__!'));
```
