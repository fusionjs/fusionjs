# Babel plugin

Before:
```
import {swTemplate} from 'fusion-cli/sw';
swTemplate();
```
After:
```
import {swTemplate} from '__SECRET_SW_LOADER__!';
swTemplate();
```
