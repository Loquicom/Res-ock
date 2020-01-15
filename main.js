const fs = require('fs');
const express = require('express');
const portfinder = require('portfinder');
const program = require('commander');
require('colors');

program.version('1.0.0');
program.option('-p, --port <number>', 'change the port used', 8000);
program.option('-v, --verbose', 'displays more information', false);
program.parse(process.argv);

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

function verbose(req, res, next) {
    if (program.verbose) {
        const nbProp = Object.keys(req.body);
        console.info(`\nCall ${req.method} ${req.route.path} with ${nbProp.length} parameter(s)`);
        if (nbProp.length > 0) {
            for (let prop in req.body) {
                console.info(`   ${prop}: ${req.body[prop]}`);
            }
        }
    }
    next();
}

function addroute(app, method, route, data) {
    switch (method) {
        case "GET":
            app.get(route, [verbose, (req, res) => {
                return res.json(data);
            }]);
            break;
        case "POST":
            app.post(route, [verbose, (req, res) => {
                return res.json(data);
            }]);
            break;
        case "PUT":
            app.put(route, [verbose, (req, res) => {
                return res.json(data);
            }]);
            break;
        case "DELETE":
            app.delete(route, [verbose, (req, res) => {
                return res.json(data);
            }]);
            break;
        default:
            app.use(route, [verbose, (req, res) => {
                return res.json(data);
            }]);
    }
}

console.info('*'.bold.green, 'Read mock files'.bold);
const files = scandir('server', ['.gitkeep']);
if (files.length === 0) {
    console.info('*'.bold.green, 'No mock files found'.bold.yellow);
}
console.info('*'.bold.green, 'Creating mock server'.bold);
files.forEach(elt => {
    const data = require('./' + elt);
    const split = elt.split('/');
    split.shift();
    const method = split.shift();
    const path = split.join('/').replace('.json', '');
    addroute(app, method, '/' + path, data);
});

portfinder.getPort({port: program.port}, (err, freePort) => {
    if (err) {
        console.error('*'.bold.green, 'Unable to find a free port'.bold.red);
        process.exit(-1);
    }
    if (program.port != freePort) {
        console.info('*'.bold.green, `Port ${program.port} is unavailable`.bold.yellow);
    }
    app.listen(freePort, () => {
        console.info('*'.bold.green, 'Mock server stating on'.bold, `http://localhost:${freePort}`.bold.blue);
    });
});