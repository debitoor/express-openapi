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

		const security = {
			Bearer: () => ({ sub: 'jane' })
		};

		const operations = {
			getTests: () => ({
				statusCode: 200,
				content: [{
					id: 1,
					name: 'Test 1'
				}]
			})
		};

		app.use(createOpenApiRouter(openapi, { security, operations }));

		app.listen(PORT, done);
	});

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
			it('should be an array with one test item', () => {
				expect(response.content).to.eql([{
					'id': 1,
					'name': 'Test 1'
				}]);
			});
		});
	});
});