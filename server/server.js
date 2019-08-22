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

app.post('/image-upload', (req, res) => {
  const values = Object.values(req.files);
  const promises = values.map(image => cloudinary.uploader.upload(image.path));

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

app.post('/login', async (req, res) => {
  const caseRef = req.body.caseRef;
  const vehReg = req.body.vehReg;
  const login = await proclaimHandshake(caseRef, vehReg);
  return res.json(login);
});

// app.post('/pushtoproclaim', (req, res) => {
//   console.log(req.body);
//   let ref = req.body.ref;
//   let mga = req.body.mga;
//   let field = req.body.field;
//   let content = req.body.content;
//   let action = req.body.action;
//   if (validMgas.includes(mga)) {
//     pushToProclaim(ref, mga, field, content, action);
//     console.log('MGAType: OK');
//   } else {
//     console.log('MGAType: INVALID');
//   }
//   res.redirect('/');
// });

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
      return vehRegTest.cfieldvalue === vehReg;
    }
  } catch (e) {
    console.log(e);
  }
};

let pushToProclaim = async (
  caseRef,
  claimType,
  fieldName,
  fieldContent,
  linkedAction
) => {
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

    // new blank array
    let newCaseData = [];

    // push case data into newCaseData array (fieldname & fielddata)
    newCaseData.push({
      fieldname: fieldName,
      fielddata: fieldContent
    });

    // open
    const openCase = await soapClient.proCaseOpen({
      csessionid: login.csessionid,
      ccaseno: caseRef,
      ccasetype: claimType,
      coperation: 'Update'
    });
    console.log('CaseOpen: ', openCase.cstatus);

    // unlock
    const caseUnlock = await soapClient.proCaseUpdate({
      csessionid: login.csessionid,
      ccaseno: openCase.ccaseno,
      coperation: 'Unlock'
    });
    console.log('CaseUnlock: ', caseUnlock.cstatus);

    // put data
    let caseData = await soapClient.proPutCaseScreenData({
      csessionid: login.csessionid,
      ccasetype: claimType,
      ccaseno: openCase.ccaseno,
      ttScreenData: { ttScreenDataRow: newCaseData }
    });

    // put tableData
    // let caseData = await soapClient.proPutCaseTableDataMatrix({
    //     csessionid: login.csessionid,
    //     ccasetype: claimType,
    //     ccaseno: openCase.ccaseno,
    //     cMatrix: 'NamedDriverTable',
    //     ttTableData: { ttTableDataRow: newTableData }
    // });
    // console.log('PutCaseData: ', caseData.cstatus);

    //update
    await soapClient.proCaseUpdate({
      csessionid: login.csessionid,
      ccaseno: openCase.ccaseno,
      coperation: 'Save'
    });
    console.log('Proclaim Case updated: ', openCase.ccaseno);

    // run linked action if required
    if (linkedAction !== '') {
      await soapClient.proRunLinkedAction({
        csessionid: login.csessionid,
        ccasetype: claimType,
        ccaseno: openCase.ccaseno,
        clinkedaction: linkedAction
      });
      console.log('LinkedAction: ', linkedAction);
    } else {
      console.log('no linked action selected');
    }

    // catch errors
  } catch (Err) {
    console.log('FAILED:');
    console.log(Err);
  }
};

app.listen(process.env.PORT || 8080, () => console.log('server running'));
