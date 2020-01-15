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
        const body = Object.keys(req.body);
        const param = Object.keys(req.params);
        let nbParam = 0;
        for (let prop in req.params) {
            if (req.params[prop] !== undefined) {
                nbParam++;
            }
        }
        const total = body.length + nbParam
        console.info(`\nCall ${req.method} ${req.route.path} with ${total} parameter(s) (${nbParam} params, ${body.length} body)`);
        if (nbParam > 0) {
            for (let prop in req.params) {
                if (req.params[prop] !== undefined) {
                    console.info(`   ${prop}: ${req.params[prop]} (Param)`);
                }
            }
        }
        if (body.length > 0) {
            for (let prop in req.body) {
                console.info(`   ${prop}: ${req.body[prop]} (Body)`);
            }
        }
    }
    next();
}

function extractparam(req) {
    const res = {};
    const body = Object.keys(req.body);
    const param = Object.keys(req.params);
    if (param.length > 0) {
        for (let prop in req.params) {
            if (req.params[prop] !== undefined) {
                res[prop] = req.params[prop];
            }
        }
    }
    if (body.length > 0) {
        for (let prop in req.body) {
            res[prop] = req.body[prop];
        }
    }
    return res;
}

function addroute(app, method, route, data) {
    switch (method) {
        case "GET":
            app.get(route, [verbose, (req, res) => {
                const param = extractparam(req);
                return res.json(JSON.parse(data));
            }]);
            break;
        case "POST":
            app.post(route, [verbose, (req, res) => {
                return res.json(JSON.parse(data));
            }]);
            break;
        case "PUT":
            app.put(route, [verbose, (req, res) => {
                return res.json(JSON.parse(data));
            }]);
            break;
        case "DELETE":
            app.delete(route, [verbose, (req, res) => {
                return res.json(JSON.parse(data));
            }]);
            break;
        default:
            app.use(route, [verbose, (req, res) => {
                return res.json(JSON.parse(data));
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
    const data = fs.readFileSync('./' + elt).toString();
    const split = elt.split('/');
    split.shift();
    const method = split.shift();
    const path = split.join('/').replace('.json', '').replace('param-', ':').replace('-optional', '?').replace('.', '/');
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