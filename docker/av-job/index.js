"use strict";
const myCOS = require("ibm-cos-sdk");
const mv = require('mv');
require("dotenv").config({
  silent: true,
});
const fs = require("fs");
var config = {
    endpoints: process.env.COS_SECRET_ENDPOINTS,
    apiKeyId: process.env.COS_SECRET_APIKEY,
    serviceInstanceId: process.env.COS_SECRET_RESOURCE_INSTANCE_ID,
  };
var cosClient = new myCOS.S3(config);
const NodeClam = require('clamscan');
const options = {
  remove_infected: false, // Removes files if they are infected
  quarantine_infected: '/usr/src/app/infected', // Move file here. remove_infected must be FALSE, though.
  debug_mode: true, // This will put some debug info in your js console
  scan_recursively: true, // Choosing false here will save some CPU cycles
  clamscan: {
      path: '/usr/bin/clamscan', // I dunno, maybe your clamscan is just call "clam"
      scan_archives: false, // Choosing false here will save some CPU cycles
      active: true // I use clamscan here, but you can try to get the clam daemon (clamd) to work
  },
  clamdscan: {
    socket: false, // Socket file for connecting via TCP
    host: false, // IP of host to connect to TCP interface
    port: false, // Port of host to use when connecting via TCP interface
    local_fallback: true,
},
  preference: 'clamscan'
}




app()


async function app() {

  // getting the file from COS and writing the file to the disk for scanning 
  await getItem(process.env.COS_BUCKET_ENTRY, process.env.CE_SUBJECT)
  
  fs.readdirSync('./data/').forEach(file => {
      scan('./data/', file);
  })
  
}

/**
 * Get an Item from a COS Bucket
 *
 * @param {*} bucketName
 * @param {*} itemName
 * @return {*}
 */
function getItem(bucketName, itemName) {
  return new Promise((resolve, reject) => {
    console.log(`Retrieving item from bucket: ${bucketName}, key: ${itemName}`);
    return cosClient
      .getObject({
        Bucket: bucketName,
        Key: itemName,
      })
      .promise()
      .then((data) => {
        if (data != null) {
          // writing the file to the disk for scanning
          fs.writeFileSync(`./data/${itemName}`, data.Body);
          console.log("saving item...")
          resolve()
        }
      })
      .catch((e) => {
        console.error(`ERROR: ${e.code} - ${e.message}\n`);
      });
  })
  
}



async function scan(folder, filename) {
  
  try {
    
      // Get instance by resolving ClamScan promise object
      const clamscan = await new NodeClam().init(options);
      const data = fs.readFileSync(folder + filename, {encoding:'utf8', flag:'r'}); 
      const {isInfected, file, viruses} = await clamscan.isInfected(folder + filename);
      // debug log
      console.log(`Is infected: ${isInfected}`);
      

      // moving the file to the right Bucket (currently disabled)

      await doDeleteObject(process.env.COS_BUCKET_ENTRY, filename)
      
      if (isInfected){
        await doCreateObject(process.env.COS_BUCKET_DIRTY, filename, data)
        // deleting file from disk
        fs.unlinkSync('/usr/src/app/infected/'+ filename);
      }else if (!isInfected){
        await doCreateObject(process.env.COS_BUCKET_CLEAN, filename, data)
        // deleting file from disk
        fs.unlinkSync(folder+ filename);
      }

     
      
  } catch (err) {
      console.log(err)
  }
}


async function doDeleteObject(bucketname, filename) {
  return new Promise(resolve => {
    console.log('Deleting object');
    return cosClient.deleteObject({
        Bucket: bucketname,
        Key: filename
    }).promise(resolve());
    
  })

}

async function doCreateObject(bucketname, filename, data) {
  return new Promise(resolve => {
    console.log('Creating object');
    return cosClient.putObject({
        Bucket: bucketname,
        Key: filename,
        Body: data
    }).promise(resolve());
  })
  
}