const fs = require('fs');
const express = require('express');
const colors = require('colors');

const app = express();
app.use(express.json());

function isdir(path) {
    return fs.statSync(path).isDirectory();
}
 
function scandir(dirname, exclude = []) {
    dirname += (dirname[dirname.length - 1] === '/') ? '' : '/';
    const result = [];
    const items = fs.readdirSync(dirname)
    items.forEach(elt => {
        if (exclude.indexOf(elt) !== -1) {
            return;
        }
        const file = dirname + elt;
        if (isdir(file)) {
            const res = scandir(file, exclude);
            res.forEach(e => {
                result.push(e);
            })
        } else {
            result.push(file);
        }
    });
    return result;
}

function addroute(app, method, route, data) {
    switch (method) {
        case "GET":
            app.get(route, (req, res) => {
                return res.json(data);
            });
            break;
        case "POST":
            app.post(route, (req, res) => {
                return res.json(data);
            });
            break;
        case "PUT":
            app.put(route, (req, res) => {
                return res.json(data);
            });
            break;
        case "DELETE":
            app.delete(route, (req, res) => {
                return res.json(data);
            });
            break;
        default:
            app.use(route, (req, res) => {
                return res.json(data);
            });
    }
}

console.info('Read mock files');
const files = scandir('server', ['.gitkeep']);
console.info('Creating mock server');
files.forEach(elt => {
    const data = require('./' + elt);
    const split = elt.split('/');
    split.shift();
    const method = split.shift();
    const path = split.join('/').replace('.json', '');
    addroute(app, method, '/' + path, data);
});

let port = 8000;
if (process.argv.length > 2) {
    port = process.argv[2];
}
app.listen(port, () => {
    console.info('Mock server stating on', `http://localhost:${port}`.blue);
});