const express = require('express');
const debug = require('debug')('openapi');
const Ajv = require('ajv');

module.exports.createOpenApiRouter = createOpenApiRouter;

function createOpenApiRouter(openapi, { operations = {}, security = {}, schemas = [] } = {}) {
	const ajv = new Ajv({ $data: true, coerceTypes: true, allErrors: true, useDefaults: true });

	if (Array.isArray(schemas)) {
		schemas.forEach(schema => ajv.addSchema(schema));
	}

	const router = new express.Router();

	Object.entries(openapi.paths).forEach(([path, methods]) => {
		Object.entries(methods).forEach(([method, operation]) => {
			const route = path.replace(/{/g, ':').replace(/}/g, '');

			const { operationId } = operation;
			const op = operations[operationId];

			const requestSchema = {
				type: 'object',
				properties: {
					params: parametersToSchema((operation.parameters || []).filter(parameter => parameter.in === 'path')),
					query: parametersToSchema((operation.parameters || []).filter(parameter => parameter.in === 'query')),
					body: requestBodyToSchema(operation.requestBody)
				},
				required: [],
				components: openapi.components
			};

			Object.entries(operation.responses).forEach(([statusCode, response]) => {
				if (response.content === undefined) {
					return;
				}

				Object.entries(response.content).forEach(([contentType, content]) => {
					content.validate = ajv.compile({ ...content.schema, components: openapi.components });
				});
			});

			const validateRequest = ajv.compile(requestSchema);

			router[method] && router[method](route, handler);

			async function handler(req, res, next) {
				try {
					const { headers, params, query, body } = req;

					const response = await request();

					// TODO: Content Type Formatters
					res.status(response.statusCode);

					if (response.content) {
						res.json(response.content);
					} else {
						res.end();
					}

					async function request() {
						const operationSecurity = operation.security || openapi.security || [];

						for (let securityRequirements of operationSecurity) {
							for (let securitySchemeName in securityRequirements) {
								const securityScheme = openapi.components.securitySchemes[securitySchemeName];
								const securitySchemeHandler = security[securitySchemeName];

								if (!securityScheme) {
									return { statusCode: 401, content: 'Security Scheme Not Supported.' };
								}

								if (!securitySchemeHandler) {
									return { statusCode: 401, content: 'Security Scheme Not Supported.' };
								}

								switch (securityScheme.type) {
									case 'http':
										const authorizationHeader = req.get('Authorization');

										if (authorizationHeader === null || authorizationHeader === undefined) {
											return { statusCode: 401, content: 'Authorization Header Missing.' };
										}

										const [ type, credentials ] = authorizationHeader.split(' ');

										if (type !== securityScheme.scheme) {
											return { statusCode: 401, content: 'Authorization Header Type Not Supported.' };
										}

										if (credentials === undefined) {
											return { statusCode: 401, content: 'Authorization Header Credentials Missing' };
										}

										const credentialsPayload = await securitySchemeHandler(credentials);

										if (credentialsPayload === null || credentialsPayload === undefined) {
											return { statusCode: 401, content: 'Authorization Header Credentials Invalid' };
										}

										break;
									default:
										return { statusCode: 401, content: 'Security Scheme Type Not Supported.' };
								}
							}
						}

						const isValidRequest = validateRequest({ headers, params, query, body });

						debug('isValidRequest === %s', isValidRequest);

						if (!isValidRequest) {
							return { statusCode: 400, body: isValidRequest };
						}

						const response = await op({ headers, params, query, body });

						debug('response === %O', response);

						const accept = req.get('Accept');

						debug('accept === %s', accept);

						const operationResponse = operation.responses[response.statusCode] || operation.responses['default'];

						if (operationResponse === null || operationResponse === undefined) {
							debug('operationResponse is null or undefined.');

							return { statusCode: 500 };
						}

						if (operationResponse.content) {
							const operationResponseContent = operationResponse.content[accept];

							if (operationResponseContent === null || operationResponseContent === undefined) {
								debug('operationResponseContent is null or undefined.');

								return { statusCode: 406 };
							}

							if (typeof operationResponseContent.validate === 'function') {
								debug('operationResponseContent.validate is a function.');

								const isValidResponseContent = operationResponseContent.validate(response.content);

								debug('isValidResponseContent === %', isValidResponseContent);

								if (isValidResponseContent === false) {
									debug('isValidResponseContent: %O', operationResponseContent.validate.errors);

									return {
										statusCode: 500
									};
								}
							} else {
								debug('operationResponseContent.validate is not a function.');
							}
						}

						// If everything is still OK we return the origianl response from the handler function.
						return response;
					}
				} catch (err) {
					next(err);
				}
			}
		});
	});

	return router;
}

function requestBodyToSchema(requestBody) {
	return requestBody && requestBody.content && requestBody.content['application/json'] && requestBody.content['application/json'].schema || {};
}

function parametersToSchema(parameters) {
	return parameters.reduce((schema, parameter) => {
		return {
			...schema,
			properties: {
				...schema.properties,
				[parameter.name]: {
					description: parameter.description,
					...parameter.schema
				}
			}
		};
	}, {
		type: 'object',
		properties: {},
		additionalProperties: false,
		required: parameters.filter(parameter => parameter.required === true).map(parameter => parameter.name)
	});
}
