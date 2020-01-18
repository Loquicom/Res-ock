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

const wrapperPath = './wrapper.json';
const error404path = './404.json';

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
        console.info('*'.green, '>'.cyan, `Call ${req.method} ${req.originalUrl} with ${total} parameter(s) (${nbParam} params, ${body.length} body)`.bold);
        if (nbParam > 0) {
            for (let prop in req.params) {
                if (req.params[prop] !== undefined) {
                    console.info('\t-'.cyan, `${prop}: ${req.params[prop]} (Param)`);
                }
            }
        }
        if (body.length > 0) {
            for (let prop in req.body) {
                console.info('\t-'.cyan, `${prop}: ${req.body[prop]} (Body)`);
            }
        }
    }
    next();
}

function extractParam(req) {
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

function applyParam(data, param) {
    let result = data;
    const key = Object.keys(param);
    key.forEach(elt => {
        result = result.replace(new RegExp('\\$\\{' + elt + '\\}', 'g'), param[elt]);
    });
    return result;
}

function answer(req, res, data, wrapper = null) {
    const param = extractParam(req);
    let json = applyParam(data, param);
    try {
        if (json.trim() === '') {
            if (wrapper !== null) {
                json = wrapper.replace(new RegExp('\\$\\{data\\}', 'g'), 'null');
            } else {
                json = '{}';
            }
        } else if (wrapper !== null) {
            json = wrapper.replace(new RegExp('\\$\\{data\\}', 'g'), json);  
        }
        return res.json(JSON.parse(json));
    } catch (error) {
        console.error('Unable to answer'.red);
        return res.json({error: 'Unable to answer'});
    }
}

function addroute(app, method, route, data, wrapper = null) {
    switch (method) {
        case "GET":
            app.get(route, [verbose, (req, res) => {
                return answer(req, res, data, wrapper);
            }]);
            break;
        case "POST":
            app.post(route, [verbose, (req, res) => {
                return answer(req, res, data, wrapper);
            }]);;
            break;
        case "PUT":
            app.put(route, [verbose, (req, res) => {
                return answer(req, res, data, wrapper);
            }]);
            break;
        case "DELETE":
            app.delete(route, [verbose, (req, res) => {
                return answer(req, res, data, wrapper);
            }]);
            break;
        default:
            app.use(route, [verbose, (req, res) => {
                return answer(req, res, data, wrapper);
            }]);;
    }
}

// Recherche des fichiers
console.info('*'.bold.green, 'Read mock files'.bold);
const files = scandir('server', ['.gitkeep']);
if (files.length === 0) {
    console.info('*'.bold.green, 'No mock files found'.bold.yellow);
}
// Création du serveur
console.info('*'.bold.green, 'Creating mock server'.bold);
// Chargement encapsulation
let wrapper = null;
if (fs.existsSync(wrapperPath)) {
    if (program.verbose) {
        console.info('*'.green, '>'.yellow, 'Load wrapper'.bold);
    }
    wrapper = fs.readFileSync(wrapperPath).toString();
}
// Ajout des routes pour chaque fichier
files.forEach(elt => {
    const data = fs.readFileSync('./' + elt).toString();
    const split = elt.split('/');
    split.shift();
    const method = split.shift();
    const path = '/' + split.join('/').replace('.json', '').replace(/param-/g, ':').replace(/-optional/g, '?').replace(/\./g, '/');
    if (program.verbose) {
        console.info('*'.green, '>'.yellow, `Load URL: ${path}`.bold)
    }
    addroute(app, method, path, data, wrapper);
});
// Gestion 404
let error404 = null;
if (fs.existsSync(error404path)) {
    if (program.verbose) {
        console.info('*'.green, '>'.yellow, 'Load error 404'.bold);
    }
    error404 = fs.readFileSync(error404path).toString();
}
app.use([verbose, (request, response) => {
    if (error404 !== null) {     
        response.status(404).json(JSON.parse(error404.replace(new RegExp('\\$\\{path\\}', 'g'), request.originalUrl)));
    } else {
        response.status(404).json({code: 404, error: `${request.method} ${request.originalUrl} not found`});
    }
}]);
// Lancement du serveur
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
