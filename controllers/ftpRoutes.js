const ftp = require('promise-ftp');
const { pipeline } = require('node:stream/promises');
const { Readable } = require('node:stream');
const busboy = require('busboy');


const client = new ftp();

module.exports.index = (req, res) => {
    const status = client.getConnectionStatus();
    if (req.session.ftp && req.session.status === status) {
        return res.redirect('/files');
    }

    req.session.ftp = false;
    req.session.status = status;
    res.render('home');
}

module.exports.connect = async (req, res) => {
    const { host, user = "anonymous", password = "@anonymous" } = req.body;
    const connectionConfig = {
        host,
        user,
        password
    };

    const status = client.getConnectionStatus();
    if (status === 'connected') {
        client.destroy();
    }
    const response = await client.connect(connectionConfig);
    if (response) {
        req.session.ftp = true;
        req.session.status = 'connected';
        req.flash('success', response);
        res.redirect('/files');
    }
}

module.exports.show = async (req, res) => {
    const list = await client.list('/');
    res.render('files', { list });
}

module.exports.listFiles = async (req, res) => {
    const path = req.params.path;
    await client.cwd('/' + path);

    const list = await client.list('.');
    res.render('files', { list });
}

module.exports.download = async (req, res) => {
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
}

module.exports.upload = async (req, res, next) => {
    const bb = busboy({ headers: req.headers });
    const files = [];

    bb.on('file', (name, file, info) => {
        const { filename, encoding, mimeType } = info;
        const fileData = {
            name: filename,
            type: mimeType,
            data: [],
        }
        file.on('data', (chunk) => {
            fileData.data.push(chunk);
        });

        file.on('end', () => {
            files.push(fileData);
        })

    })
    bb.on('finish', async () => {
        for (let file of files) {
            try {
                const stream = Readable.from(file.data);
                await client.put(stream, file.name);
            } catch (err) {
                next(err);
            }
        }
    })
    await pipeline(req, bb);

    req.flash('success', 'File(s) Uploaded Successfully');
    const path = await client.pwd();
    res.redirect(`/files${path}`);
}

module.exports.delete = async (req, res) => {
    const { filename } = req.params;
    const decodedFilename = decodeURIComponent(filename);

    await client.delete(decodedFilename);
    req.flash('success', 'File Deleted Successfully');

    const path = await client.pwd();
    res.redirect(`/files${path}`);
}

module.exports.logout = (req, res) => {
    client.destroy();
    req.session.destroy();
    res.redirect('/');
}

module.exports.client = client;