require('dotenv').config();
const config = require('./config');
const express = require('express');
const cloudinary = require('cloudinary');
const formData = require('express-form-data');
const cors = require('cors');
const bodyParser = require('body-parser');
const soap = require('soap-as-promised');
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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

app.post('/image-upload', (req, res) => {
  const values = Object.values(req.files);
  const promises = values.map(image =>
    cloudinary.uploader.upload(image.path, e => {
      // console.log(e.progress); // progress bar? this doesn't seem to work in node
    })
  );

  Promise.all(promises)
    // .then(results => res.json(results))
    .then(results => {
      results.map(file => {
        // console.log(file);
      });
      return res.json(results);
    })
    .catch(err => res.status(400).json(err));
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
  // const data = [];
  // await req.body.data.map((i, idx) =>
  //   data.push(
  //     {
  //       id: idx + 1,
  //       fieldname: 'Cloud Image Table.Image Description.Text',
  //       fieldvalue: i.description
  //     },
  //     {
  //       id: idx + 1,
  //       fieldname: 'Image URL.Text',
  //       fieldvalue: i.imageUrl
  //     },
  //     {
  //       id: idx + 1,
  //       fieldname: 'Image Timestamp.Text',
  //       fieldvalue: i.timestamp
  //     }
  //   )
  // );
  try {
    pushToProclaim(req.body.caseRef, req.body.caseType, req.body.data);
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
      ccaseno: caseRef
    });
    if (getCase.cstatus === 'OK') {
      const caseType = getCase.icasetype;

      const vehRegTest = await soapClient.proGetData({
        csessionid: login.csessionid,
        ccaseno: caseRef,
        ccasetype: caseType,
        cfieldname: 'PH Reg Number.Text'
      });
      return { caseType, caseRef };
    }
  } catch (e) {
    console.log(e);
  }
};

const pushToProclaim = async (caseRef, caseType, data) => {
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

    // open
    const openCase = await soapClient.proCaseOpen({
      csessionid: login.csessionid,
      ccaseno: caseRef,
      ccasetype: caseType,
      coperation: 'Update'
    });
    console.log('CaseOpen: ', openCase.cstatus);

    // unlock
    const caseUnlock = await soapClient.proCaseUpdate({
      csessionid: login.csessionid,
      ccaseno: caseRef,
      coperation: 'Unlock'
    });
    console.log('CaseUnlock: ', caseUnlock.cstatus);

    // put data
    const caseData = await data.map(async row => {
      let tableRow = await {
        csessionid: login.csessionid,
        ccaseno: caseRef,
        cMatrix: 'CloudImagesTable',
        ttTableData: {
          ttTableDataRow: await [
            {
              fieldname: 'Cloud Image Table.Image Description.Text',
              fieldvalue: await row.description
            },
            {
              fieldname: 'Image URL.Text',
              fieldvalue: await row.imageUrl
            },
            {
              fieldname: 'Image Timestamp.Text',
              fieldvalue: await row.timestamp
            }
          ]
        }
      };
      console.log(tableRow);
      let tableData = await soapClient.proPutCaseTableDataMatrix(tableRow);
      console.log('Case Update: ', tableData.cstatus);
    });

    //update
    await soapClient.proCaseUpdate({
      csessionid: login.csessionid,
      ccaseno: caseRef,
      coperation: 'Save'
    });
    console.log('Proclaim Case updated: ', caseRef);

    // catch errors
  } catch (Err) {
    console.log('FAILED:');
    console.log(Err);
  }
};

app.listen(process.env.PORT || 8080, () => console.log('server running'));
