const mongoose = require("mongoose");
const uid = require('uid-safe');
const apiAuth = require("../models/apiAuth.model");
require('dotenv').config();

const apiAuthList = [
    { serverEnv: 'dev', accessKey: `dev-${uid.sync(32)}`, isActive: 1 },
    { serverEnv: 'prod', accessKey: `prod-${uid.sync(32)}`, isActive: 1 }
];

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("Connected to db");
        await Promise.all(apiAuthList.map(auth => new apiAuth(auth).save()));
        console.log("DONE!");
        mongoose.disconnect();
    })
    .catch(error => {
        console.log("error =>", error);
        process.exit(1);
    });
