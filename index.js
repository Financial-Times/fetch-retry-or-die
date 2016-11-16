'use strict';
const logger = require('@financial-times/n-logger').default;
require('es6-promise').polyfill();
require('isomorphic-fetch');

module.exports = (url, opt) => {

    const maxRetries = opt ? opt.maxRetries || 1 : 1;
    const retryDelay = opt ? opt.retryDelay || 100 : 100;

    const fetchRetryOrDie = (resolve, reject) => {
        let retryCount = 0;
        const doRequest = () => {
            fetch(url, opt)
                .then((response) => {
                    let statusStr = response.status.toString();
                    if (statusStr.indexOf('2') === 0 || statusStr === '404') {
                        resolve(response);
                    } else {
                        throw new Error(`${response.statusText}: ${response.status}`);
                    }
                })
                .catch((err) => {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        logger.warn({operation: 'fetch-retry-or-die', msg: `Retry #${retryCount}`, reason: err.message || err, url});
                        setTimeout(doRequest, retryDelay);
                    } else {
                        logger.error({operation: 'fetch-retry-or-die', reason: err.message || err, url});
                        reject(err);
                    }
                });
        };
        doRequest();
    };

    return new Promise(fetchRetryOrDie);
};
