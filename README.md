# fetch-retry-or-die
A wrapper around [isomorphic-fetch] that allows retries in case of request failure 

### Install
```sh
npm install [-S] fetch-retry-or-die
```

### Usage
```javascript
const fetch = require('fetch-retry-or-die');
```
```javascript
let url = 'http://some.url'
fetch(url, {maxRetries: 5, retryDelay: 500})
  .then((response) => {
    // do something with the response
    ...
  });
```

### Options
* `maxRetries`: the maximum number of allowed retries. Defaults to 1.
* `retryDelay`: the delay between retries in milliseconds. Defaults to 100.

### Handles HTTP error statuses
* Standard `fetch` functionality does not reject the promise on HTTP error status codes like 500. 
* `fetch-retry-or-die` rejects the promise if the status code is not 2XX or 404 (no need to retry if resource wasn't found, right?).



[//]: # 
   [isomorphic-fetch]: <https://github.com/matthew-andrews/isomorphic-fetch>
