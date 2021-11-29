const express = require("express");
const ejs = require("ejs");
const path = require('path');
const program = require("commander");
const qr = require("qrcode");
const fs = require("fs");
const {
  sleep,
  login,
  logout,
  getMenu,
  makeOrder,
  takeBill,
  getPayment,
  updateStore,
  initialize 
} = require("./src/client-functions");
// const os = require("os");
// const cluster = require("cluster");
//const { readFile, writeFile } = require('fs/promises');
//const cookieSession = require("cookie-session");
//const cookieParser = require('cookie-parser');
//const axios = require("axios");

//const clusterWorkerSize = os.cpus().length;
//const clusterWorkerSize = 4;


const app = express();
const port = process.env.PORT || 8080;
//const portRange = [8000, 8001, 8002, 8003, 8004, 8005, 8006, 8007, 8008, 8009];
const localAddress = "http://localhost:";
const home = localAddress + `${port}/`;
//const addressAPI = localAddress + `${port}/api`;

//const adminPod = "https://pod.inrupt.com/admintest1/";
//const adminUserName = "adminTest1";
//const adminPassword = "Administrator0!";
//const restaurantUserName = "ristorante1";
//const restaurantPassword = "Ristorante1!";
//const CEOUserName = "restaurantCEO";
//const CEOPassword = "RestaurantCEO3!";
//const authorityUserName = "authorityCheck";
//const authorityPassword = "Authority2!";
//const erpUserName = "";
//const erpPassword = "";

const adminToken = {
  "refreshToken" : "q4vL64d0MgZWdlcgQ0rwMBpYHHP4nnjm",
  "clientId"     : "s9QD8gX4grpz7guEad0SHdMO4Kv4hDEz",
  "clientSecret" : "bP6AAuVh3kYnXyk8CjmX1u2xYa7az92D",
  provider : "https://broker.pod.inrupt.com"
};

const CEOToken = {
  "refreshToken" : "cb99e14826ee711b6ad0dee8b4776d57",
  "clientId"     : "7c9aa11108b4dc9281d83035cb2d6c92",
  "clientSecret" : "d2d68db87b5fbc04935f7cfd0f4742dc",
  provider : "https://solidcommunity.net"
};

const restaurantToken = {
  "refreshToken" : "6805d063be8d4f38e52ffc8a0b954a4d",
  "clientId"     : "83a3d728f1d61aad02cc94045f7ea166",
  "clientSecret" : "2d691a2462b69c2f8daffa7d9cb0667f",
  provider : "https://solidcommunity.net"
};

const authorityToken = {
  "refreshToken" : "NIDYLFm8vTYPOQMddKhCAVHV0yJ5SWb1",
  "clientId"     : "FSC887toOUwiv0lxtKNgd5ZwItQ1lLKh",
  "clientSecret" : "PWnlQyaEmF9CpHc9D7LUVAUACSlrmJtJ",
  provider : "https://broker.pod.inrupt.com"
};

const erpToken = {
  "refreshToken" : "NIDYLFm8vTYPOQMddKhCAVHV0yJ5SWb1",
  "clientId"     : "FSC887toOUwiv0lxtKNgd5ZwItQ1lLKh",
  "clientSecret" : "PWnlQyaEmF9CpHc9D7LUVAUACSlrmJtJ",
  provider : "https://broker.pod.inrupt.com"
};

//-----------## Initialization Solid Pod(s) - (re)start the service as predifined
program
    .option("-i, --initialize", "Initialize Restaurant service and Pods.")
    .action(function(options){
      if (options.initialize){
        console.log("Hi, I'm inizializing the Solid context");
        // execute initialize commands
        // initialize(adminToken);
        initialize(CEOToken);
      }
    });

program.parse(process.argv);


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if(process.env.NODE_ENV === "production"){
  app.use("", express.static(""))
}
else{

}


/*
app.use(function (req, res, next) {
  next();
})
app.use(session({
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
  saveUninitialized:true,
  cookie: { maxAge: 1 * 1000 * 60 * 60 * 24 },  //oneDay
  resave: false 
}));
app.use(cookieParser());
app.use(
  cookieSession({
    name: "session",
    // These keys are required by cookie-session to sign the cookies.
    keys: [
      "Required, but value not relevant for this demo - key1",
      "Required, but value not relevant for this demo - key2",
    ],
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3*24 hours
  })
);
*/


const rangeTables = 4;
var availableTables = Array(rangeTables-1).fill(0);
var tableNumber, order, bill;

let sessionID = "RWA-"; //Restaurant Web-App
let sessionRWA; 

for(let i = 0; i<rangeTables; i++){

  //var qrCodeText = home + `${i+1}`;   //when heroku,.. update the URL

  qr.toFile(`./utils/img/QR-tables/qr-table${i+1}.png`, qrCodeText, {
    errorCorrectionLevel: 'H',
    // version: "",
    type: 'image/png',
    quality: 0.95,
    margin: 3,
    color: {
     dark: '#000000ff',
     light: '#ffffffff',
    },
  });

  app.get(`/${i+1}`, async function(req, res) {
    // if (availableTables[i]!=1){
        tableNumber = i+1;
        availableTables[i]=1;  //occupato
        console.log("You are sitting at table : ", tableNumber);

        var tmp = await getMenu(tableNumber, sessionRWA);
        var menu = tmp[0];
        order = tmp[1];
        order.table_number = tableNumber;
      
        res.render("menu", {
          tableNumber,
          menu,
          order
        });

        sessionRWA = await login(sessionID, restaurantToken);
    // }
    // else{
    //     console.log(`Table ${tableNumber} occuped`);
    //     res.render("table-failed", {
    //       tableNumber
    //     });
    // };
  });  
};

app.post('/order', async function(req, res) {
  order = await makeOrder(req.body.cart, sessionRWA);
  await updateStore(order, sessionRWA);

  //res.send("Order executed");
  console.log("Order executed");

  res.redirect(`/${tableNumber}`);
});

app.post('/bill', async function(req, res) {
  order = await makeOrder(req.body.bill, sessionRWA);
  await updateStore(order, sessionRWA);
  bill = await takeBill(order.table_number, sessionRWA);
  if (bill != false){
    res.render("bill", {
      tableNumber, 
      bill
    });
  }
  else{
    res.send("Error");
  }
});

app.post('/payment', async function(req, res, next) {
  let confirmation = false, billURL;
  while(!confirmation){
    var arrayTmp = await getPayment(req.body.bill, sessionRWA);  
    confirmation = arrayTmp[0];
    billURL = arrayTmp[1];
  }
  
  res.render("payment", {
    tableNumber, 
    billURL
  });
});

app.get('/end', function(req, res, next) {
  availableTables[tableNumber-1]=0;
  res.redirect(`/${tableNumber}`);
});


// if (clusterWorkerSize > 1) {
//   if (cluster.isMaster) {
//     for (let i=0; i < clusterWorkerSize; i++) {
//       cluster.fork()
//     }

//     cluster.on("exit", function(worker) {
//       console.log("Worker", worker.id, " has exitted.")
//     })
//   } else {

//     app.listen(port, function () {
//       console.log(`Express server listening on port ${port} and worker ${process.pid}`)
//     })
//   }
// } else {

//   app.listen(port, function () {
//     console.log(`Express server listening on port ${port} with the single worker ${process.pid}`)
//   })
// }

// portRange.forEach(function(port) {
  app.listen(port, () => {
    console.log(`listening on ${port}`);
  });
// });