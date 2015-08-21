var commands = {
  build: 'Build project',
  create: 'Create new project',
  update: 'Update engine',
  server: 'Start a dev server',
  lint: 'Validate your code'
};

var lpanda = {
	help: function() {
		var data = require('./package.json');
		console.log(data.description + ' ' + data.version);
		console.log('');
		console.log('Usage: lpanda <command> [options]');
		console.log('');
		console.log('Commands:');
		for (var name in commands) {
	    console.log('       ' + name + '\t' + commands[name]);
		}
	}
};

for (var name in commands) {
	lpanda[name] = require('./' + name);
}

module.exports = exports = lpanda;
