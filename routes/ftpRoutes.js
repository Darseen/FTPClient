const express = require('express');
const router = express.Router();
const ftp = require('promise-ftp');
const { wrapAsync, isAuthorized } = require('../utils/middlewareFunctions');
const { pipeline } = require('node:stream/promises');

const client = new ftp();

router.get('/', (req, res) => {
    const status = client.getConnectionStatus();

    if (req.session.ftp && req.session.status === status) {
        return res.redirect('/files');
    }
    req.session.ftp = false;
    req.session.status = status;
    res.render('home');
})

router.post('/connect', wrapAsync(async (req, res) => {
    const { host, user = "anonymous", password = "@anonymous" } = req.body;
    const connectionConfig = {
        host,
        user,
        password
    };

    const response = await client.connect(connectionConfig);
    if (response) {
        req.session.ftp = true;
        req.session.status = client.getConnectionStatus();
        req.flash('success', response);
        res.redirect('/files');
    }
}))

router.get('/files', isAuthorized(client), wrapAsync(async (req, res) => {
    const list = await client.list('/');
    res.render('files', { list });
}))

router.get('/files/:path(*)', isAuthorized(client), wrapAsync(async (req, res) => {
    const path = req.params.path;
    await client.cwd('/' + path);

    const list = await client.list('.');
    res.render('files', { list });
}))

router.get('/download/:filename', isAuthorized(client), wrapAsync(async (req, res) => {
    const { filename } = req.params;
    const decodedFilename = decodeURIComponent(filename);

    res.setHeader('Content-Disposition', `attachment; filename=${decodedFilename}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Transfer-Encoding', 'chunked');

    const stream = await client.get(decodedFilename);

    await pipeline(stream, res);

    req.on('close', () => {
        stream.destroy();
    })
}))

router.delete('/close', isAuthorized(client), (req, res) => {
    client.destroy();
    req.session.destroy();
    res.redirect('/');
})

module.exports = router;