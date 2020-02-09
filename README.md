# express-openapi

``` bash
$ npm install @debitoor/express-openapi
```

## Usage

``` javascript
const { createOpenApiRouter } = require('@debitoor/express-openapi');
const express = require('express');
const openapi = require('./openapi.json');

const app = express();
app.use(createOpenApiRouter(openapi, { security, operations });
app.listen(8181);
```
