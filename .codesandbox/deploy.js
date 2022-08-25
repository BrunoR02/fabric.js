#!/usr/bin/env node
const fs = require('fs-extra');
const Axios = require('axios');
const chalk = require('chalk');
const path = require('path');
const _ = require('lodash');
const { makeRe } = require('micromatch');

const BINARY_EXT = [
    'png',
    'jpg',
    'jpeg'
];

function bufferToBase64DataUrl(buffer, mimeType) {
    return 'data:' + mimeType + ';base64,' + buffer.toString('base64');
}
 
function globToRegex(glob, opts) {
    return makeRe(glob, opts);
}

function parseIgnoreFile(file) {
    return _.compact(fs.readFileSync(file).toString().split('\n')).map(p => globToRegex(p.trim()))
}

/**
 * https://codesandbox.io/docs/api/#define-api
 */
async function createCodeSandbox(appPath) {
    const { trigger: __, ...package } = require(path.resolve(appPath, 'package.json'));
    // omit linked package
    if (package.dependencies.fabric.startsWith('file:')) {
        package.dependencies.fabric = '*';
    }
    const files = { 'package.json': JSON.stringify(package, null, '\t') };

    const gitignore = path.resolve(appPath, '.gitignore');
    const codesandboxignore = path.resolve(appPath, '.codesandboxignore');
    const ignore = _.flatten([gitignore, codesandboxignore].filter(fs.existsSync).map(parseIgnoreFile));

    const processFile = (fileName) => {
        const filePath = path.resolve(appPath, fileName);
        if (ignore.some(r => r === 'package.json' || r.test(fileName))) return;
        const ext = path.extname(fileName).slice(1);
        if (fs.lstatSync(filePath).isDirectory()) {
            fs.readdirSync(filePath)
                .forEach(file => {
                    processFile(path.join(fileName, file).replace(/\\/g, '/'));
                });
        } else if (BINARY_EXT.includes(ext)) {
            files[fileName] = {
                content: bufferToBase64DataUrl(fs.readFileSync(filePath), `image/${ext}`),
                isBinary: true
            };
        } else {
            const { name, base, ...rest } = path.parse(filePath);
            const sandboxVersion = path.format({ ...rest, name: `${name}.codesandbox` });
            const finalVersion = fs.existsSync(sandboxVersion) ? sandboxVersion : filePath;
            files[fileName] = { content: fs.readFileSync(finalVersion).toString() };
        }
    }
    fs.readdirSync(appPath).forEach(processFile);
    try {
        const { data: { sandbox_id } } = await Axios.post("https://codesandbox.io/api/v1/sandboxes/define?json=1", {
            template: JSON.parse(fs.readFileSync(path.resolve(appPath, 'sandbox.config.json')) || null).template,
            files,
        });
        return `https://codesandbox.io/s/${sandbox_id}`;
    } catch (error) {
        throw error.toJSON();
    }
}

module.exports = {
    createCodeSandbox
}