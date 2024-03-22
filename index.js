const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const { createLogger, format, transports } = require('winston');
const logger = createLogger({
	level: 'info',
	format: format.combine(format.timestamp(), format.simple(), format.json()),
	// format: format.timestamp(),
	// defaultMeta: { service: 'webapp' },
	transports: [new transports.Console(), new transports.File({ filename: '/tmp/webapp.log', level: 'debug' })],
});

logger.error('error distributed logs');
logger.info('info distributed logs');
logger.debug('debug distributed logs');
logger.warn('warn distributed logs');

const bcrypt = require('bcrypt');
const validator = require('validator');

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

if (!process.argv.includes('--keep')) {
	(async () => {
		await User.sync({ force: true }); // creates the table in database, but drop it first if it already exists
	})();
} else if (process.argv.includes('--keep')) {
	(async () => {
		await User.sync(); // This creates the table if it doesn't exist (and does nothing if it already exists)
	})();
}

app.post('/v1/user', async (req, res) => {
	const userInfo = req.body;

	if (!validator.isEmail(userInfo.username)) {
		return res.status(400).send();
	}

	try {
		const hash = await hashPassword(userInfo.password);
		userInfo.password = hash;
		await User.create(userInfo, {
			fields: ['username', 'password', 'first_name', 'last_name'],
		});

		const newUserInfo = await User.findOne({ where: { username: userInfo.username }, attributes: { exclude: ['password'] } });

		res.status(201).json(newUserInfo);
	} catch (error) {
		logger.error({ error: error });
		res.status(400).send();
	}
});

app.get('/v1/user/self', async (req, res) => {
	const encoded = req.headers.authorization;

	if (!encoded) {
		return res.status(401).send();
	}

	try {
		// Decoding the Base64-encoded string
		const decoded = Buffer.from(encoded.split(' ')[1], 'base64').toString('utf8');
		const [email, password] = decoded.split(':');

		const userInfoInDb = await User.findOne({ where: { username: email } });
		if (!userInfoInDb || !userInfoInDb?.dataValues?.password) {
			return res.status(401).send();
		}

		bcrypt.compare(password, userInfoInDb.dataValues.password, function (err, result) {
			if (result) {
				const { password, ...userInfo } = userInfoInDb.dataValues;
				res.status(200).json(userInfo);
			} else {
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
		return res.status(401).send();
	}

	const updateInfo = req.body;

	try {
		// Decoding the Base64-encoded string
		const decoded = Buffer.from(encoded.split(' ')[1], 'base64').toString('utf8');
		const [email, password] = decoded.split(':');

		const userInfoInDb = await User.findOne({ where: { username: email } });
		if (!userInfoInDb || !userInfoInDb?.dataValues?.password) {
			return res.status(401).send();
		}

		bcrypt.compare(password, userInfoInDb.dataValues.password, async function (err, result) {
			if (result) {
				if (hasOtherProperty(updateInfo, ['first_name', 'last_name', 'password'])) {
					return res.status(400).send();
				}

				if (updateInfo.password) {
					updateInfo.password = await hashPassword(updateInfo.password);
				}
				await userInfoInDb.update(updateInfo);
				res.status(204).send();
			} else {
				return res.status(401).send();
			}
		});
	} catch (error) {
		logger.error({ error: error });
		res.status(400).send();
	}
});

app.head('/healthz', (req, res) => {
	res.status(405).send();
});

app.get('/healthz', async (req, res) => {
	if (Object.keys(req.body).length !== 0) {
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

app.all('/healthz', (req, res) => {
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
