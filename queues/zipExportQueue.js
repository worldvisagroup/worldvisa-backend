// ZIP export queue replaced by setImmediate-based async processor in workers/zipExportWorker.js
// This stub prevents import errors in any file that still references this module.
module.exports = {
  add: async () => {},
  getJob: async () => null,
};
