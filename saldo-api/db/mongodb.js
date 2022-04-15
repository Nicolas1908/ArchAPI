const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://Nicolas1908:4wuVeCXKQZM2Umdi@archapi.itz3t.mongodb.net/archAPI?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

module.exports.dbo = client;