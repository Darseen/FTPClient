module.exports.wrapAsync = fn => {
    return function (req, res, next) {
        fn(req, res, next).catch(err => next(err));
    }
}

module.exports.isAuthorized = (client) => {
    return function (req, res, next) {

        const status = client.getConnectionStatus();
        if (!req.session.ftp || req.session.status !== status) {
            req.session.ftp = false;
            req.session.status = status;

            req.flash('error', "Not Connected");
            return res.redirect('/');
        }
        next();
    }
}