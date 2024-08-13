// customHttpTransport.js
const Transport = require('winston-transport');
const axios = require('axios');

class HttpTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.url = opts.url;
  }

  log(info, callback) {
    axios.post(this.url, {
      level: info.level,
      message: info.message,
      meta: info.meta || {},
    })
    .then(() => {
      callback();
    })
    .catch(err => {
      console.error('Error sending logs to remote server:', err);
      callback(err);
    });
  }
}

module.exports = HttpTransport;
