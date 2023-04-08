const express = require('express');
const router = express.Router();
const { wrapAsync, isAuthorized } = require('../utils/middlewareFunctions');
const ftpRoutes = require('../controllers/ftpRoutes');
const { client } = require('../controllers/ftpRoutes')

router.get('/', ftpRoutes.index);

router.post('/connect', wrapAsync(ftpRoutes.connect))

router.get('/files', isAuthorized(client), wrapAsync(ftpRoutes.show))

router.get('/files/:path(*)', isAuthorized(client), wrapAsync(ftpRoutes.listFiles))

router.get('/download/:filename', isAuthorized(client), wrapAsync(ftpRoutes.download))

router.post('/upload', isAuthorized(client), wrapAsync(ftpRoutes.upload))

router.delete('/delete/:filename', isAuthorized(client), wrapAsync(ftpRoutes.delete))

router.delete('/close', isAuthorized(client), ftpRoutes.logout)

module.exports = router;