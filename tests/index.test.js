const request = require('supertest');
const { app, sequelize, server } = require('../index');
const userBody = require('./mock-data/user');

beforeAll((done) => {
	done();
});

afterAll((done) => {
	// Closing the DB connection allows Jest to exit successfully.
	sequelize.close();
	server.close();
	done();
});

describe(`TEST /healthz`, () => {
	const endpointUrl = '/healthz';

	it('should return 200 when GET ' + endpointUrl, async () => {
		const response = await request(app).get(endpointUrl);

		expect(response.statusCode).toBe(200);
		expect(response.body).toMatchObject({});
	});

	it('should return 405 when POST ' + endpointUrl, async () => {
		const randomPayload = { test: true };
		const response = await request(app).post(endpointUrl).send(randomPayload);

		expect(response.statusCode).toBe(405);
		expect(response.body).toMatchObject({});
	});
});

describe(`Create a user using /v2/user`, () => {
	const endpointUrl = '/v2/user';

	it('should return 201 and new created user info when POST ' + endpointUrl, async () => {
		const reqBody = userBody.ok;
		const response = await request(app).post(endpointUrl).send(reqBody);

		expect(response.statusCode).toBe(201);
		expect(response.body).toHaveProperty('id');
		expect(response.body).toHaveProperty('username', reqBody.username);
		expect(response.body).not.toHaveProperty('password');
		expect(response.body).toHaveProperty('first_name', reqBody.first_name);
		expect(response.body).toHaveProperty('last_name', reqBody.last_name);
		expect(response.body).toHaveProperty('account_created');
		expect(response.body).toHaveProperty('account_updated');
	});
});

describe(`Get the new created user info using /v2/user/self`, () => {
	const endpointUrl = '/v2/user/self';

	it('should return 403 and user info when GET new created user info using ' + endpointUrl, async () => {
		const reqBody = userBody.ok;
		const response = await request(app).get(endpointUrl).auth(reqBody.username, reqBody.password);

		expect(response.statusCode).toBe(403);
		// expect(response.body).toHaveProperty('id');
		// expect(response.body).toHaveProperty('username', reqBody.username);
		// expect(response.body).not.toHaveProperty('password');
		// expect(response.body).toHaveProperty('first_name', reqBody.first_name);
		// expect(response.body).toHaveProperty('last_name', reqBody.last_name);
		// expect(response.body).toHaveProperty('account_created');
		// expect(response.body).toHaveProperty('account_updated');
	});
});

describe(`Create a user with the same username using /v2/user`, () => {
	const endpointUrl = '/v2/user';

	it('should return 400 when POST ' + endpointUrl + ' using the same username as before', async () => {
		const reqBody = userBody.duplicate;
		const response = await request(app).post(endpointUrl).send(reqBody);

		expect(response.statusCode).toBe(400);
	});
});

describe(`Update the user using /v2/user/self`, () => {
	const endpointUrl = '/v2/user/self';

	it('should return 403 and return updated user info when PUT ' + endpointUrl, async () => {
		const auth = userBody.ok;
		const reqBody = userBody.updateOk;
		const response = await request(app).put(endpointUrl).auth(auth.username, auth.password).send(reqBody);
		console.log(response.body);

		expect(response.statusCode).toBe(403);
	});
});

// describe(`Get the updated user info using /v2/user/self`, () => {
// 	const endpointUrl = '/v2/user/self';

// 	it('should return 200 and user info when GET updated user info using ' + endpointUrl, async () => {
// 		const initialBody = userBody.ok;
// 		const expectedBody = userBody.updateOk;
// 		const password = userBody.updateOk.password || userBody.ok.password;
// 		const response = await request(app).get(endpointUrl).auth(initialBody.username, password);

// 		expect(response.statusCode).toBe(200);
// 		expect(response.body).not.toHaveProperty('password');
// 		expect(response.body).toHaveProperty('first_name', expectedBody.first_name);
// 		expect(response.body).toHaveProperty('last_name', expectedBody.last_name);
// 		expect(response.body).toHaveProperty('account_created');
// 		expect(response.body).toHaveProperty('account_updated');
// 		expect(response.body.account_updated).not.toEqual(response.body.account_created);
// 	});
// });
