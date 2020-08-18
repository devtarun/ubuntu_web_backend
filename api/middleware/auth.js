const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const decoded = jwt.verify(req.headers.authorization, "secret");
        req.userData = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            msg: "Authorization token missing of invalid"
        });
    }
};