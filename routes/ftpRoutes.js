const express = require('express');
const router = express.Router();
const ftp = require('promise-ftp');
const { wrapAsync, isAuthorized } = require('../utils/middlewareFunctions');
const { pipeline } = require('stream/promises');

const client = new ftp();

router.get('/', (req, res) => {
    if (req.session.ftp) {
        return res.redirect('/files')
    }
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
        req.flash('success', response);
        res.redirect('/files');
    }
}))

router.get('/files', isAuthorized, wrapAsync(async (req, res) => {
    const list = await client.list('/');
    res.render('files', { list });
}))

router.get('/files/:path(*)', isAuthorized, wrapAsync(async (req, res) => {
    const path = req.params.path;

    await client.cwd('/' + path);

    const list = await client.list('.');
    res.render('files', { list });
}))

router.get('/download/:filename', isAuthorized, wrapAsync(async (req, res) => {
    const { filename } = req.params;
    const decodedFilename = decodeURIComponent(filename);

    res.setHeader('Content-Disposition', `attachment; filename=${decodedFilename}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Transfer-Encoding', 'binary');

    const stream = await client.get(decodedFilename);

    await pipeline(stream, res);

    req.on('close', () => {
        stream.destroy();
    })
}))

router.delete('/close', isAuthorized, (req, res) => {
    client.destroy();
    delete req.session.ftp
    req.flash('success', 'Connection Closed');
    res.redirect('/');
})

module.exports = router;