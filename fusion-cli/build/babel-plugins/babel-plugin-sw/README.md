# Babel plugin

Before:
```
import {syncChunkPaths, allChunkPaths} from 'fusion-core';
```
After:
```
const syncChunkPaths = SECRET_SYNC_CHUNK_PATHS;
const allChunkPaths = SECRET_ALL_CHUNK_PATHS;
```
