# Babel plugin

Before:
```
import {syncChunkIds} from 'framework';
syncChunkIds();
```
After:
```
import {syncChunkIds} from 'framework';
syncChunkIds(require('__SECRET_SYNC_CHUNK_IDS_LOADER__!'));
```
