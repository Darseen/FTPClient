const express = require('express');
const ejsMate = require('ejs-mate');
const path = require('path');
const methodOverride = require('method-override')
const AppError = require('./utils/AppError');
const session = require('express-session');
const flash = require('connect-flash');
const MongoDBStore = require("connect-mongo");
require('dotenv').config();

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const dbUrl = process.env.DB_URL
const store = MongoDBStore.create({
    mongoUrl: dbUrl,
    ttl: 3600,
    crypto: {
        secret: 'asdfasdfas'
    }
});

const sessionConfig = {
    store,
    name: "Cname",
    secret: "ANYTHING",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60,
        maxAge: 1000 * 60 * 60
    }
}
app.use(session(sessionConfig));

app.use(flash());

app.use((req, res, next) => {
    res.locals.ftpConnection = req.session.ftp;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    return next();
})

const ftpRoutes = require('./routes/ftpRoutes');

app.use('/', ftpRoutes);

app.all('*', (req, res, next) => {
    next(new AppError('Page Not Found!', 404));
})

app.use((err, req, res, next) => {
    const { status = 500, message = "Something Went Wrong!" } = err;
    res.status(status)
    if (req.session.ftp && req.session.status === 'connected') {
        req.session.returnUrl = '/files';
    }
    else {
        req.session.returnUrl = '/';
    }
    res.render('error', { message, returnUrl: req.session.returnUrl });
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})