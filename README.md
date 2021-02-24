# express-openapi

```bash
$ npm install @practio/express-openapi
```

## Usage

```javascript
const { createOpenApiRouter } = require('@practio/express-openapi');
const express = require('express');
const openapi = require('./openapi.json');

const app = express();
app.use(createOpenApiRouter(openapi, { security, operations });
app.listen(8181);
```
