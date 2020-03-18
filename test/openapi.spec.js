const { createOpenApiRouter } = require('../');
const express = require('express');
const { expect } = require('chai');
const nodeFetch = require('node-fetch');
const openapi = require('./openapi.json');
const PORT = 58483;

describe('openapi', () => {
	let app;

	before('express', done => {
		app = express();

		const tests = [{ id: 1 }, { id: 2 }];

		const operations = {
			deleteTest: () => ({
				statusCode: 204
			}),
			getTests: () => {
				return {
					statusCode: 200,
					content: tests
				};
			},
			findTest: ({ params }) => {
				return {
					statusCode: 200,
					content: tests.find(test => test.id === params.testId)
				};
			}
		};

		const securitySchemes = {
			Bearer1: async (credentials) => {
				if (credentials === 'Jane') {
					return {
						sub: credentials,
						iss: 'Bearer1'
					};
				}
			},
			Bearer2: async (credentials) => {
				if (credentials === 'John') {
					return {
						sub: credentials,
						iss: 'Bearer2'
					};
				}
			},
			Bearer3: async (credentials) => {
				if (credentials === 'June') {
					return {
						sub: credentials,
						iss: 'Bearer3'
					};
				}
			}
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
					Authorization: 'Bearer Jane'
				}
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
					Authorization: 'Bearer June'
				}
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
					Authorization: 'Bearer John'
				}
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
					Authorization: 'Bearer June'
				}
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
					Authorization: 'Bearer June'
				}
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
});