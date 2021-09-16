const { createOpenApiRouter } = require('../');
const express = require('express');
const cookieParser = require('cookie-parser');
const { expect } = require('chai');
const nodeFetch = require('node-fetch');
const openapi = require('./openapi.json');
const PORT = 58483;

describe('openapi', () => {
  let app;

  before('express', (done) => {
    app = express();

    app.use(cookieParser());

    const tests = [{ id: 1 }, { id: 2 }];

    const operations = {
      deleteTest: () => ({
        statusCode: 204,
      }),
      getTests: () => {
        return {
          statusCode: 200,
          content: tests,
        };
      },
      findTest: ({ params }) => {
        return {
          statusCode: 200,
          content: tests.find((test) => test.id === params.testId),
        };
      },
      getUser: ({ security }) => {
        return {
          statusCode: 200,
          content: security,
        };
      },
    };

    const securitySchemes = {
      Bearer1: async ({ credentials }) => {
        if (credentials === 'Jane') {
          return {
            name: credentials,
          };
        }
      },
      Bearer2: async ({ credentials }) => {
        if (credentials === 'John') {
          return {
            name: credentials,
          };
        }
      },
      Bearer3: async ({ credentials }) => {
        if (credentials === 'June') {
          return {
            name: credentials,
          };
        }
      },
      Cookie1: async ({ apiKey }) => {
        if (apiKey === 'June') {
          return {
            name: apiKey,
          };
        }
      },
      Query1: async ({ apiKey }) => {
        if (apiKey === 'June') {
          return {
            name: apiKey,
          };
        }
      },
      Header1: async ({ apiKey }) => {
        if (apiKey === 'June') {
          return {
            name: apiKey,
          };
        }
      },
    };

    app.use(createOpenApiRouter(openapi, { operations, securitySchemes }));

    app.listen(PORT, done);
  });

  describe('getTests with Jane', () => {
    let response;

    before(async () => {
      response = await nodeFetch('http://localhost:58483/tests', {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer Jane',
        },
      });
      response.content = await response.json();
    });

    describe('response', () => {
      describe('statusCode', () => {
        it('should equal 200', () => {
          expect(response.status).to.eql(200);
        });
      });

      describe('content', () => {
        it('should be an array with two test items', () => {
          expect(response.content).to.eql([{ id: 1 }, { id: 2 }]);
        });
      });
    });
  });

  describe('getTests with June', () => {
    let response;

    before(async () => {
      response = await nodeFetch('http://localhost:58483/tests', {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer June',
        },
      });
      response.content = await response.json();
    });

    describe('response', () => {
      describe('statusCode', () => {
        it('should equal 401', () => {
          expect(response.status).to.eql(401);
        });
      });
    });
  });

  describe('findTest with John', () => {
    let response;

    before(async () => {
      response = await nodeFetch('http://localhost:58483/tests/2', {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer John',
        },
      });
      response.content = await response.json();
    });

    describe('response', () => {
      describe('statusCode', () => {
        it('should equal 200', () => {
          expect(response.status).to.eql(200);
        });
      });

      describe('content', () => {
        it('should be an object', () => {
          expect(response.content).to.eql({ id: 2 });
        });
      });
    });
  });

  describe('findTest with June', () => {
    let response;

    before(async () => {
      response = await nodeFetch('http://localhost:58483/tests/2', {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer June',
        },
      });
      response.content = await response.json();
    });

    describe('response', () => {
      describe('statusCode', () => {
        it('should equal 401', () => {
          expect(response.status).to.eql(401);
        });
      });
    });
  });

  describe('deleteTest with June', () => {
    let response;

    before(async () => {
      response = await nodeFetch('http://localhost:58483/tests/1', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer June',
        },
      });
    });

    describe('response', () => {
      describe('statusCode', () => {
        it('should equal 204', () => {
          expect(response.status).to.eql(204);
        });
      });
    });
  });

  describe('get user with June', () => {
    let response;

    before(async () => {
      response = await nodeFetch('http://localhost:58483/user', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer June',
        },
      });

      response.content = await response.json();
    });

    describe('response', () => {
      describe('statusCode', () => {
        it('should equal 401', () => {
          expect(response.status).to.eql(401);
        });
      });
    });
  });

  describe('get user with Jane', () => {
    let response;

    before(async () => {
      response = await nodeFetch('http://localhost:58483/user', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer Jane',
        },
      });

      response.content = await response.json();
    });

    describe('response', () => {
      describe('statusCode', () => {
        it('should equal 200', () => {
          expect(response.status).to.eql(200);
        });
      });

      describe('content', () => {
        it('should be a user object', () => {
          expect(response.content).to.eql({ Bearer1: { name: 'Jane' } });
        });
      });
    });
  });

  describe('get user with June token cookie', () => {
    let response;

    before(async () => {
      response = await nodeFetch('http://localhost:58483/user', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Cookie: 'token=June',
        },
        credentials: 'include',
      });

      response.content = await response.json();
    });

    describe('response', () => {
      describe('statusCode', () => {
        it('should equal 200', () => {
          expect(response.status).to.eql(200);
        });
      });

      describe('content', () => {
        it('should be a user object', () => {
          expect(response.content).to.eql({ Cookie1: { name: 'June' } });
        });
      });
    });
  });

  describe('get user with June X-Token header', () => {
    let response;

    before(async () => {
      response = await nodeFetch('http://localhost:58483/user', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Token': 'June',
        },
      });

      response.content = await response.json();
    });

    describe('response', () => {
      describe('statusCode', () => {
        it('should equal 200', () => {
          expect(response.status).to.eql(200);
        });
      });

      describe('content', () => {
        it('should be a user object', () => {
          expect(response.content).to.eql({ Header1: { name: 'June' } });
        });
      });
    });
  });

  describe('get user with June token query string parameter', () => {
    let response;

    before(async () => {
      response = await nodeFetch('http://localhost:58483/user?token=June', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      response.content = await response.json();
    });

    describe('response', () => {
      describe('statusCode', () => {
        it('should equal 200', () => {
          expect(response.status).to.eql(200);
        });
      });

      describe('content', () => {
        it('should be a user object', () => {
          expect(response.content).to.eql({ Query1: { name: 'June' } });
        });
      });
    });
  });
});
