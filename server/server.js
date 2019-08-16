require('dotenv').config();
const config = require('./config');
const express = require('express');
const cloudinary = require('cloudinary');
const formData = require('express-form-data');
const cors = require('cors');
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());

// aws ===============================================================
const s3 = new aws.S3();

app.use(bodyParser.json());

let upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: config.bucketName,
    key: (req, file, cb) => {
      cb(null, Date.now().toString());
    }
  })
});

app.post('/upload', upload.array('files', 10), (req, res, next) => {
  console.log(`server side: ${req.body}`);
  res.send(`Successfully uploaded ${req.files}`);
});
// ===================================================================
// const imageRegex = /\.(jpe?g|png|gif|bmp|tiff)$/i;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

app.use(formData.parse());

app.get('/wake-up', (req, res) => res.send('👌'));

app.post('/image-upload', (req, res) => {
  const values = Object.values(req.files);
  console.log(req.files);
  const promises = values.map(image => cloudinary.uploader.upload(image.path));

  Promise.all(promises)
    .then(results => res.json(results))
    .catch(err => res.status(400).json(err));
});

app.listen(process.env.PORT || 8080, () => console.log('server running'));
