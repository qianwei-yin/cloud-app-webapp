module.exports = {
	ok: {
		username: 'user@example.com',
		password: '123456',
		first_name: 'Joe',
		last_name: 'Doe',
	},
	duplicate: {
		username: 'user@example.com',
		password: '123456',
		first_name: 'Jane',
		last_name: 'Swift',
	},
	includeOtherProperties: {
		username: 'user11@example.com',
		password: '123456',
		first_name: 'Joe',
		last_name: 'Doe',
		accounted_created: '2024-01-01',
	},
	invalidEmail: {
		username: 'user22example.com',
		password: '123456',
		first_name: 'Ken',
		last_name: 'Jonas',
	},
	updateOk: {
		first_name: 'Joeupdate',
		last_name: 'Doeupdate',
	},
};
