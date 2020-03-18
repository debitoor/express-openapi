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

		const operations = {
			deleteTests: () => ({
				statusCode: 204
			}),
			getTests: ({ security }) => {
				return {
					statusCode: 200,
					content: [{
						id: 1,
						name: 'Test 1',
						security
					}]
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

	describe('get', () => {
		let response;

		before(async () => {
			response = await nodeFetch('http://localhost:58483/tests', {
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
				it('should be an array with one test item', () => {
					expect(response.content).to.eql([{
						id: 1,
						name: 'Test 1',
						security: {
							Bearer2: {
								iss: 'Bearer2',
								sub: 'John'
							}
						}
					}]);
				});
			});
		});
	});

	describe('delete', () => {
		let response;

		before(async () => {
			response = await nodeFetch('http://localhost:58483/tests', {
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