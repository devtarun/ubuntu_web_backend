const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const UserRoutes = require('./api/routes/users');
const cors = require('cors');
global.__basedir = __dirname;

app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.options('*', cors());

app.use('/api/users', UserRoutes);

// HANDLING ERRORS
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});
app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        error: {
            message: error.message
        }
    });
});

module.exports = app;