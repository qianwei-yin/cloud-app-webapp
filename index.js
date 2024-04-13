const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const { PubSub } = require('@google-cloud/pubsub');
let topic;

if (process.env.PUBSUB_INTERACTION === 'true') {
	// Instantiates a client
	const pubSubClient = new PubSub({ projectId: process.env.GCP_PROJECT_ID });
	topic = pubSubClient.topic(process.env.PUBSUB_TOPIC_NAME);
}

const { createLogger, format, transports } = require('winston');
const logger = createLogger({
	level: 'info',
	format: format.combine(format.timestamp(), format.simple(), format.json()),
	transports: [new transports.Console(), new transports.File({ filename: '/tmp/webapp.log', level: 'debug' })],
});

// logger.error('error distributed logs');
// logger.info('info distributed logs');
// logger.debug('debug distributed logs');
// logger.warn('warn distributed logs');

const bcrypt = require('bcrypt');
const validator = require('validator');
const moment = require('moment');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
	res.set('Cache-Control', 'no-cache');
	next();
});

// Sequelize
// https://dba.stackexchange.com/questions/83164/postgresql-remove-password-requirement-for-user-postgres
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.POSTGRES_DATABASE, process.env.POSTGRES_USERNAME, process.env.POSTGRES_PASSWORD, {
	host: process.env.POSTGRES_HOST,
	dialect: 'postgres',
});

const User = sequelize.define(
	'User',
	{
		username: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		first_name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		last_name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	},
	{
		freezeTableName: true,
		timestamps: true,
		createdAt: 'account_created',
		updatedAt: 'account_updated',
	}
);
const Verify = sequelize.define(
	'Verify',
	{
		username: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		first_name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		last_name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		verify_token: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			allowNull: false,
		},
		token_created_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			allowNull: false,
		},
		verified: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
	},
	{
		freezeTableName: true,
		timestamps: true,
		createdAt: 'object_created',
		updatedAt: 'object_updated',
	}
);

if (!process.argv.includes('--keep')) {
	(async () => {
		await Verify.sync({ force: true });
		await User.sync({ force: true }); // creates the table in database, but drop it first if it already exists
	})();
} else if (process.argv.includes('--keep')) {
	(async () => {
		await Verify.sync();
		await User.sync(); // This creates the table if it doesn't exist (and does nothing if it already exists)
	})();
}

app.post('/v1/user', async (req, res) => {
	const userInfo = req.body;

	if (!validator.isEmail(userInfo.username)) {
		logger.warn({ message: `${userInfo.username} is not a valid email.` });
		return res.status(400).send();
	}

	try {
		const hash = await hashPassword(userInfo.password);
		userInfo.password = hash;
		await User.create(userInfo, {
			fields: ['username', 'password', 'first_name', 'last_name'],
		});

		const newUserInfo = await User.findOne({ where: { username: userInfo.username }, attributes: { exclude: ['password'] } });

		try {
			if (process.env.PUBSUB_INTERACTION === 'true') {
				const newUserInfoBuffer = Buffer.from(JSON.stringify(newUserInfo));
				topic.publishMessage({ data: newUserInfoBuffer });
				logger.info({ message: `Email verify link published.` });
			}
		} catch (error) {
			logger.error({ message: 'Received error while publishing.', error: error });
			return res.status(503).send();
		}

		logger.info({ message: `User ${userInfo.username} created.` });
		return res.status(201).json(newUserInfo);
	} catch (error) {
		logger.error({ error: error });
		return res.status(400).send();
	}
});

app.get('/v1/user/self', async (req, res) => {
	const encoded = req.headers.authorization;

	if (!encoded) {
		logger.warn({ message: `No auth info provided.` });
		return res.status(401).send();
	}

	try {
		// Decoding the Base64-encoded string
		const decoded = Buffer.from(encoded.split(' ')[1], 'base64').toString('utf8');
		const [email, password] = decoded.split(':');

		const userInfoInDb = await User.findOne({ where: { username: email } });
		if (!userInfoInDb || !userInfoInDb?.dataValues?.password) {
			logger.error({ message: `Auth info incorrect.` });
			return res.status(401).send();
		}

		const userVerifyInfoInDb = await Verify.findOne({ where: { username: email } });
		if (!userVerifyInfoInDb?.dataValues?.verified) {
			logger.error({ message: `User has not been verified.` });
			return res.status(403).send();
		}

		bcrypt.compare(password, userInfoInDb.dataValues.password, function (err, result) {
			if (result) {
				const { password, ...userInfo } = userInfoInDb.dataValues;
				res.status(200).json(userInfo);
			} else {
				logger.error({ message: `Auth info incorrect.` });
				return res.status(401).send();
			}
		});
	} catch (error) {
		logger.error({ error: error });
		res.status(400).send();
	}
});

app.put('/v1/user/self', async (req, res) => {
	const encoded = req.headers.authorization;

	if (!encoded) {
		logger.warn({ message: `No auth info provided.` });
		return res.status(401).send();
	}

	const updateInfo = req.body;

	try {
		// Decoding the Base64-encoded string
		const decoded = Buffer.from(encoded.split(' ')[1], 'base64').toString('utf8');
		const [email, password] = decoded.split(':');

		const userInfoInDb = await User.findOne({ where: { username: email } });
		if (!userInfoInDb || !userInfoInDb?.dataValues?.password) {
			logger.error({ message: `Auth info incorrect.` });
			return res.status(401).send();
		}

		const userVerifyInfoInDb = await Verify.findOne({ where: { username: email } });
		if (!userVerifyInfoInDb?.dataValues?.verified) {
			logger.error({ message: `User has not been verified.` });
			return res.status(403).send();
		}

		bcrypt.compare(password, userInfoInDb.dataValues.password, async function (err, result) {
			if (result) {
				if (hasOtherProperty(updateInfo, ['first_name', 'last_name', 'password'])) {
					logger.warn({ message: `Cannot modify properties other than name and password.` });
					return res.status(400).send();
				}

				if (updateInfo.password) {
					updateInfo.password = await hashPassword(updateInfo.password);
				}
				await userInfoInDb.update(updateInfo);
				logger.info({ message: `Updated info successfully.` });
				res.status(204).send();
			} else {
				logger.error({ message: `Auth info incorrect.` });
				return res.status(401).send();
			}
		});
	} catch (error) {
		logger.error({ error: error });
		res.status(400).send();
	}
});

app.head('/healthz', (req, res) => {
	logger.error({ message: `HTTP method not allowed.` });
	res.status(405).send();
});

app.get('/healthz', async (req, res) => {
	if (Object.keys(req.body).length !== 0) {
		logger.warn({ message: `Not allowed to have request body.` });
		res.status(400).send();
	} else {
		try {
			await sequelize.authenticate();
			logger.info('Connection has been established successfully.');
			res.status(200).send();
		} catch (error) {
			logger.error({ message: 'Unable to connect to the database.', error: error });
			res.status(503).send();
		}
	}
});

app.get('/user/verify', async (req, res) => {
	try {
		const currentTime = moment();
		const { token } = req.query;
		if (!token) {
			logger.warn({ message: `No token provided.` });
			return res.status(400).send();
		}

		const verifyInfoInDb = await Verify.findOne({ where: { verify_token: token } });
		if (!verifyInfoInDb) {
			logger.warn({ message: `No valid token provided.` });
			return res.status(401).send();
		}
		const tokenCreatedAt = verifyInfoInDb.dataValues.token_created_at;
		logger.info({
			message: {
				'created at: ': tokenCreatedAt,
				'now: ': currentTime,
			},
		});

		const passVerify = moment(tokenCreatedAt).add(2, 'minutes').isAfter(currentTime);
		if (passVerify) {
			await verifyInfoInDb.update({ verified: true });
			logger.info({ message: 'Email verification successful.' });
			return res.status(200).json({ message: 'Email verification successful.' });
		} else {
			logger.error({ message: 'Email verification link expired.' });
			return res.status(403).json({ message: 'Email verification link expired.' });
		}
	} catch (error) {
		logger.error({ error: error });
		res.status(400).send();
	}
});

app.all('/healthz', (req, res) => {
	logger.error({ message: `HTTP method not allowed.` });
	res.status(405).send();
});

function hasOtherProperty(obj, properties) {
	return Object.keys(obj).some((key) => !properties.includes(key));
}

async function hashPassword(plainTextPassword) {
	const saltRounds = 10;

	return bcrypt.hash(plainTextPassword, saltRounds);
}

const server = app.listen(3000, (err) => {
	logger.info('Listening on port 3000...');
});

module.exports = { app, sequelize, server };
