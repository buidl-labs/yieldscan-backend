const express = require('express');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');


const validatorsHistoy = require('./validatorsHistoy');
const globalErrHandler = require('../controllers/errorController');
const app = express();

// Limit request from the same API 
const limiter = rateLimit({
    max: 150,
    windowMs: 60 * 60 * 1000,
    message: 'Too Many Request from this IP, please try again in an hour'
});
app.use('/api', limiter);


// Data sanitization against Nosql query injection
app.use(mongoSanitize());

app.get("/", (req, res) => {
	res.send("Api for YieldScan");
});

// Routes
app.use('/api/v1/validatorhistory', validatorsHistoy);

// TODO: handle undefined Routes
app.use(globalErrHandler);

module.exports = app;