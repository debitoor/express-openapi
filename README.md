# express-openapi

```bash
$ npm install @practio/express-openapi
```

## Usage

api.spec.yml:

```yml
openapi: 3.0.0
info:
  title: Vaccines API
  version: 1.0.0
servers:
  - url: http://localhost:8181/api/v1
paths:
  /vaccines:
    get:
      operationId: getVaccines
      summary: Get Vaccines
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/VaccineList'
        '401':
          $ref: '#/components/responses/Unauthorized'
components:
  responses:
    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
  schemas:
    Error:
      type: object
      properties:
        code:
          type: string
        message:
          type: string
    Vaccine:
      type: object
      properties:
        id:
          $ref: '#/components/schemas/VaccineId'
        name:
          $ref: '#/components/schemas/VaccineName'
    VaccineId:
      type: string
      description: Vaccine ID
      example: f9a48b38-4d84-441d-8725-dc8348254a41
    VaccineName:
      type: string
      description: Vaccine Name
      example: Covid 19
    VaccineList:
      type: array
      description: Vaccine List
      items:
        $ref: '#/components/schemas/Vaccine'
  securitySchemes:
    user:
      type: http
      scheme: Bearer
      description: A User-level Authorization Token
security:
  - user: []
```

main.js:

```javascript
const { createOpenApiRouter } = require('@practio/express-openapi');
const express = require('express');
const fs = require('fs');
const YAML = require('yaml');

const apiSpecYml = fs.readFileSync('./api.spec.yml', 'utf8');
const apiSpec = YAML.parse(apiSpecYml);

const app = express();

app.use('/api/v1', createOpenApiRouter(apiSpec, {
  securitySchemes: { user },
  operations: { getVaccines }
});

app.listen(8181);

async function getVaccines({ query }) {
  return OK([{
   id: 1, name: 'Covid 19'
  }, {
   id: 2, name: 'Covid 20' // Yikes
  }]);
}

async function user(credentials) {
  return credentials === 'jane' ? { id: 1, name: 'jane' } : null;
}

async function OK(content) {
  return {
    content,
    statusCode: 200
  };
}
```
