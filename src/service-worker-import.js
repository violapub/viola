/* eslint no-undef: 0 */
/* eslint no-restricted-globals: 0 */

// WebWorker script imported from servicw-worker.js

var totalFiles = precacheConfig.length;
var processedFiles = 0;
//Original cleanResponse function from service-worker
var originalCleanResponseFunc = cleanResponse;

var cleanResponse = function(originalResponse) {
  processedFiles++;
  self.clients.matchAll({
    includeUncontrolled: true,
    type: 'window'
  }).then(function(clients) {
    clients.forEach(function(client) {
      client.postMessage({
        progress: processedFiles / totalFiles
      });
    });
  });
  //finally call the original cleanResponseFunc
  return originalCleanResponseFunc(originalResponse);
};
