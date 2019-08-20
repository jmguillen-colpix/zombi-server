// https://www.npmjs.com/package/google-drive

// npm install google-drive

// var googleDrive = require('google-drive')
 
// ...
// add stuff here which gets you a token, fileId, and callback
// ...

/*
var token = 'abc123456'
  , fileId = 'def123456'
 
function getFile(token, fileId, callback) {
  googleDrive(token).files(fileId).get(callback)
}
 
function listFiles(token, callback) {
  googleDrive(token).files().get(callback)
}
 
function callback(err, response, body) {
  if (err) return console.log('err', err)
  console.log('response', response)
  console.log('body', JSON.parse(body))
}

 */

/**
 * 
 * // Files - Get
googleDrive(token).files(id).get(params, callback)
 
// Files - Insert
googleDrive(token).files().insert(meta, params, callback)
 
// Files - Patch
googleDrive(token).files(id).patch(meta, params, callback)
 
// Files - Update
googleDrive(token).files(id).update(meta, params, callback)
 
// Files - Copy
googleDrive(token).files(id).copy(meta, params, callback)
 
// Files - Delete
googleDrive(token).files(id).del(callback)
 
// Files - List
googleDrive(token).files().list(params, callback)
 
// Files - Touch
googleDrive(token).files(id).touch(callback)
 
// Files - Trash
googleDrive(token).files(id).trash(callback)
 
// Files - Untrash
googleDrive(token).files(id).untrash(callback)
 
// Changes - List
googleDrive(token).changes.list(params, callback)
 
// Changes - Get
googleDrive(token).chances.get(params, callback)
 */