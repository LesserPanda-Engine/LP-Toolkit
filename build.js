module.exports = exports = function(dir, callback, arguments) {
    console.log('Building project...');

    if (!dir) return callback('Directory not set');

    var UglifyJS = require('uglify-js');
    var fs = require('fs');
    var i, file, size, result, output, totalSize = 0;
    var configFile = 'src/game/config.js';
    var header = '// Made with LesserPanda Engine - https://github.com/LesserPanda-Engine/LP-Engine';
    var defaultModules = false;
    var target = arguments[0] || 'game';

    game = {};
    var gameConfig;

    // Default config
    var sourceFolder = 'src';
    var outputFile = target === 'core' ? 'panda.min.js' : 'game.min.js';

    // Read config file
    try {
        require(dir + '/' + configFile);
        console.log('Using config ' + configFile);
        gameConfig = game.config;
        if (gameConfig.sourceFolder) {
            sourceFolder = gameConfig.sourceFolder;
            delete gameConfig.sourceFolder;
        }
        if (gameConfig.outputFile) {
            outputFile = gameConfig.outputFile;
            delete gameConfig.outputFile;
        }
    } catch (e) {
        return callback('Config file not found.');
    }

    var srcDir = dir + '/' + sourceFolder + '/';

    global['game'] = {};
    game.modules = ['engine/core.js'];
    game.module = function(name) {
        name = name.replace(/\./g, '/') + '.js';
        if (game.modules.indexOf(name) === -1) game.modules.push(name);
        return game;
    };
    game.require = function() {
        var i, name, modules = Array.prototype.slice.call(arguments);
        for (i = 0; i < modules.length; i++) {
            if (gameConfig.ignoreModules.indexOf(modules[i]) !== -1) continue;
            name = modules[i].replace(/\./g, '/') + '.js';
            if (game.modules.indexOf(name) === -1) {
                game.modules.push(name);
                require(srcDir + name);
            }
        }
        return game;
    };
    game.body = function() {};

    // Get core modules
    gameConfig.ignoreModules = gameConfig.ignoreModules || [];
    var pandaCore = require(srcDir + 'engine/core.js');
    game.coreModules = pandaCore._coreModules || pandaCore.coreModules;

    // Ignore debug module
    var coreVersion = parseFloat(pandaCore.version);
    if (coreVersion >= 1.00 && target !== 'core') {
        var debugIndex = gameConfig.ignoreModules.indexOf('engine.debug');
        if (debugIndex === -1) gameConfig.ignoreModules.push('engine.debug');
    }

    // Remove ignored modules
    for (var i = 0; i < gameConfig.ignoreModules.length; i++) {
        var index = game.coreModules.indexOf(gameConfig.ignoreModules[i]);
        if (index !== -1) game.coreModules.splice(index, 1);
    }

    // Read core modules
    for (var i = 0; i < game.coreModules.length; i++) {
        game.module(game.coreModules[i]);
    }

    // Process main game module
    if (target === 'game') {
        var gameMainModule = gameConfig.gameMainModule || 'main';
        require(srcDir + 'game/' + gameMainModule + '.js');
    }

    // Include dir to modules
    for (i = 0; i < game.modules.length; i++) {
        file = game.modules[i];
        game.modules[i] = srcDir + file;
        size = fs.statSync(game.modules[i]).size;
        totalSize += size;
        console.log(file + ' ' + size + ' bytes');
    }
    console.log('Total ' + totalSize + ' bytes');

    // Minify
    result = UglifyJS.minify(game.modules);

    // Include header
    if (target === 'core') output = '// LesserPanda Engine ' + pandaCore.version;
    else output = header + '\n\'use strict\';\n';

    // Clean config
    delete gameConfig.debug;
    delete gameConfig.debugDraw;
    delete gameConfig.name;
    delete gameConfig.version;

    // Make sure path settings can be found from config
    if (typeof gameConfig.sourceFolder === 'undefined') {
        gameConfig.sourceFolder = 'src';
    }
    if (typeof gameConfig.mediaFolder === 'undefined') {
        gameConfig.mediaFolder = 'media';
    }

    // Include sitelock function
    if (gameConfig.sitelock) {
        var secret = 0;
        for (i = 0; i < gameConfig.sitelock.length; i++) {
            secret += gameConfig.sitelock[i].charCodeAt(0);
        }
        var sitelockFunc = 'var s=' + secret + ',h=0,n=location.hostname;for(var i=0;i<n.length;i++)h+=n[i].charCodeAt(0);if (s!==h)throw 0;';
        output += sitelockFunc;
    }

    // Include minified code
    output += result.code.replace('"use strict";', '');

    // Include build number
    output += 'game.build=' + Date.now() + ';';

    // Include config
    if (target !== 'core') output += 'game.config=' + JSON.stringify(gameConfig) + ';';

    // Write output file
    fs.writeFile(dir + '/' + outputFile, output, function(err) {
        if (err) {
            callback('Error writing file ' + outputFile);
        }
        else {
            var size = fs.statSync(dir + '/' + outputFile).size;
            var percent = Math.round((size / totalSize) * 100);
            console.log('Saved ' + outputFile + ' ' + size + ' bytes (' + percent + '%)');
            callback();
        }
    });
};
