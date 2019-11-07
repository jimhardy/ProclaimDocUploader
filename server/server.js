const config = require('./config');
const uuid = require('uuid/v1');
const express = require('express');
const cloudinary = require('cloudinary');
const AWS = require('aws-sdk');
const formData = require('express-form-data');
const cors = require('cors');
const bodyParser = require('body-parser');
const soap = require('soap-as-promised');
const app = express();
const image2base64 = require('image-to-base64');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

require('dotenv').config();

const s3 = new AWS.S3();

const s3Store = (name, base64String, contentType) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: 'a365-doc-uploader',
      Key: `docs/${name}`,
      Body: Buffer.from(base64String.toString(), 'base64'),
      // Body: base64String,
      ContentEncoding: 'base64',
      ContentType: contentType
    };
    console.log(params);
    s3.putObject(params, (err, data) => {
      console.log(data);
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log(
          `https://a365-doc-uploader.s3-eu-west-1.amazonaws.com/${params.Key}`
        );
        resolve(
          `https://a365-doc-uploader.s3-eu-west-1.amazonaws.com/${params.Key}`
        );
      }
    });
  });
};

const s3Upload = (name, base64String, contentType) => {
  // const imageData = base64String.split('data:image/png;base64,')[1];
  return s3Store(name, base64String, contentType);
};

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

app.use(formData.parse());

app.get('/wake-up', (req, res) => res.send('👌'));

app.post('/login', async (req, res) => {
  const caseRef = req.body.caseRef;
  const vehReg = req.body.vehReg;
  const login = await proclaimHandshake(caseRef, vehReg);
  return res.json(login);
});

app.post('/image-upload', async (req, res) => {
  const values = Object.values(req.files);
  // const promises = values.map(
  // const promises = async () => {
  const uploads = [];
  for (let i = 0; i < values.length; i++) {
    const path = values[i].path;
    const imageData = () => {
      return image2base64(path);
    };
    await s3Upload(
      values[i].name.replace(/\s/g, '-'),
      imageData,
      values[i].type
    )
      .then(url => {
        uploads.push({ url: url, name: values[i].name, id: uuid() });
        // console.log(results);
        // results.map(file => {
        //   urls.push(file);
        // });
      })
      .catch(err => res.status(400).json(err));
    // cloudinary.uploader.upload(image.path, e => {
    //     // console.log(e.progress); // progress bar? this doesn't seem to work in node
    // })
  }
  console.log('===========================');
  console.log(uploads);
  return res.json(uploads);
  // };
  // .then(results => res.json(results))
});

app.post('/delete-image', (req, res) => {
  try {
    cloudinary.uploader.destroy(req.body.id).then(results => {
      return res.json(results);
    });
    // console.log(cb);
  } catch (err) {
    console.log(err);
  }
});

app.post('/pushtoproclaim', async (req, res) => {
  try {
    pushToProclaim(req.body.caseRef, req.body.caseType, req.body.data).then(
      results => {
        return res.json(results);
      }
    );
  } catch (err) {
    console.log(err);
  }
});

const proclaimHandshake = async (caseRef, vehReg) => {
  const proClaimUrl = process.env.WSURL;
  try {
    const soapClient = await soap.createClient(proClaimUrl, {
      disableCache: true
    });

    await soapClient.proResetLogins({
      cuser: 'axatpiws'
    });
    const login = await soapClient.proLogin({
      cuser: 'axatpiws',
      cpassword: 's3cuR1ty'
    });
    const getCase = await soapClient.proGetCase({
      csessionid: login.csessionid,
      ccaseno: caseRef.toUpperCase()
    });
    if (getCase.cstatus === 'OK') {
      const caseType = getCase.icasetype;

      const vehRegTest = await soapClient.proGetData({
        csessionid: login.csessionid,
        ccaseno: caseRef.toUpperCase(),
        ccasetype: caseType,
        cfieldname: 'PH Reg Number.Text'
      });
      return { caseType, caseRef, vehRegTest };
    }
  } catch (e) {
    console.log(e);
  }
};

const pushToProclaim = async (caseRef, caseType, data) => {
  // console.log(data);
  const proClaimUrl = process.env.WSURL;
  try {
    const soapClient = await soap.createClient(proClaimUrl, {
      disableCache: true
    });

    await soapClient.proResetLogins({
      cuser: 'axatpiws'
    });
    const login = await soapClient.proLogin({
      cuser: 'axatpiws',
      cpassword: 's3cuR1ty'
    });

    // Open and Update case
    const openCase = await soapClient.proCaseOpen({
      csessionid: login.csessionid,
      ccaseno: caseRef,
      ccasetype: caseType,
      coperation: 'Update'
    });
    if (openCase.cstatus !== 'OK') {
      console.log(openCase.cerror);
    }
    console.log(`Open case: ${openCase.cstatus}`);

    // Lock case
    const lockCase = await soapClient.proCaseUpdate({
      csessionid: login.csessionid,
      ccaseno: caseRef,
      coperation: 'Unlock,Lock'
    });
    if (lockCase.cstatus !== 'OK') {
      console.log(lockCase.cerror);
    }
    console.log(`Unlock/Lock case: ${lockCase.cstatus}`);

    // put data
    // use async npm module maybe?
    // data.forEach(async row => {
    let imgArr = [];
    for (let i = 0; i < data.length; i++) {
      const tableRow = {
        csessionid: login.csessionid,
        ccaseno: caseRef,
        cMatrix: 'CloudImagesTable',
        ttTableData: {
          ttTableDataRow: [
            [
              {
                fieldname: 'Image Description.Text',
                fieldvalue: data[i].description
              }
            ],
            [
              {
                fieldname: 'Image URL.Text',
                fieldvalue: data[i].imageUrl
              }
            ],
            [
              {
                fieldname: 'Image Timestamp.Text',
                fieldvalue: data[i].timestamp
              }
            ]
          ]
        }
      };
      try {
        const tableData = await soapClient.proPutCaseTableDataMatrix(tableRow);
        imgArr.push(tableRow);
        console.log('Row update: ', tableData.cstatus);
      } catch (error) {
        console.log(error);
      }
    }

    // update Save
    const saveCase = await soapClient.proCaseUpdate({
      csessionid: login.csessionid,
      ccaseno: caseRef,
      coperation: 'Save'
    });
    if (saveCase.cstatus !== 'OK') {
      console.log(saveCase.cerror);
    }
    console.log(`Save case: ${saveCase.cstatus}`);

    // update Unlock
    const unlockCase = await soapClient.proCaseUpdate({
      csessionid: login.csessionid,
      ccaseno: caseRef,
      coperation: 'Unlock'
    });
    if (unlockCase.cstatus !== 'OK') {
      console.log(`error ${unlockCase.cerror}`);
    }
    console.log(`Unlock case: ${unlockCase.cstatus}`);
    console.log('Proclaim Case updated: ', caseRef);
    console.log('...');
    return imgArr;
    // catch errors
  } catch (Err) {
    console.log('FAILED:');
    console.log(Err);
  }
};

app.listen(process.env.PORT || 8080, () => {
  console.log(`server running on ${process.env.PORT}`);
});
