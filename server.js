module.exports = function server(dir, callback, params) {
  var bs = require('browser-sync').create(dir);

  bs.watch('*.html').on('change', bs.reload);
  bs.watch('**/*.css').on('change', bs.reload);
  bs.watch('**/*.js').on('change', bs.reload);

  bs.init({
    server: dir,
    ghostMode: false
  });

  process.on('exit', bs.exit);
}
