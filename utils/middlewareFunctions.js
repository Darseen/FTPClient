module.exports.wrapAsync = fn => {
    return function (req, res, next) {
        fn(req, res, next).catch(err => next(err));
    }
}

module.exports.isAuthorized = (req, res, next) => {
    if (!req.session.ftp) {
        req.flash('error', "Not Connected!");
        return res.redirect('/');
    }
    next();
}