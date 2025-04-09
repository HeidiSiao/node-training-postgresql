const logger = require('../utils/logger')('Upload');
const config = require('../config/index');
const formidable = require('formidable')
const firebaseAdmin = require('firebase-admin')

// firebase環境初始化
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(config.get('secret.firebase.serviceAccount')),
  storageBucket: config.get('secret.firebase.storageBucket')
})
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

const ALLOWED_FILE_TYPES = {
  'image/jpeg': true,
  'image/png': true
}

const bucket = firebaseAdmin.storage().bucket()

async function postUploadImage (req, res, next) {
  const form = formidable.formidable({
    multiple: false,
    maxFileSize: MAX_FILE_SIZE,
    filter: ({ mimetype }) => {
      return !!ALLOWED_FILE_TYPES[mimetype]
    }
  })
  const [fields, files] = await form.parse(req)
  logger.info('files')
  logger.info(files)
  logger.info('fields')
  logger.info(fields)
  const filePath = files.file[0].filepath
  const remoteFilePath = `images/${new Date().toISOString()}-${files.file[0].originalFilename}`
  await bucket.upload(filePath, { destination: remoteFilePath })
  const options = {
    action: 'read',
    expires: Date.now() + 24 * 60 * 60 * 1000
  }
  const [imageUrl] = await bucket.file(remoteFilePath).getSignedUrl(options)
  logger.info(imageUrl)
  res.status(200).json({
    status: 'success',
    data: {
      image_url: imageUrl
    }
  })
   
      
  throw customErr(409,"開課時間已重疊","conflict");
    
  }
  
module.exports = { postUploadImage };