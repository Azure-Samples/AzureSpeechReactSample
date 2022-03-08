require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();

const app = express();
const japp = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(pino);

app.get('/api/get-speech-token', async (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    const speechKey = process.env.SPEECH_KEY;
    const speechRegion = process.env.SPEECH_REGION;

    if (speechKey === 'paste-your-speech-key-here' || speechRegion === 'paste-your-speech-region-here') {
        res.status(400).send('You forgot to add your speech key or region to the .env file.');
    } else {
        const headers = { 
            headers: {
                'Ocp-Apim-Subscription-Key': speechKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        try {
            const tokenResponse = await axios.post(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, null, headers);
            res.send({ token: tokenResponse.data, region: speechRegion });
        } catch (err) {
            res.status(401).send('There was an error authorizing your speech key.');
        }
    }
});

//custom middlewate for japp-server
const logger2 = (req,res,next) => {
    console.log(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type');
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'POST,PUT,GET');
   //  ------4GOauth---> const TrCode = `${req.query.code}`;
    console.log(`${req.body}`);
    console.log('Logger operations done');
    next();
};

//  Middleware thingies
japp.use(express.urlencoded({ extended: false}));
japp.use(express.json());
japp.use(logger2);

//  thing to be updated with keywords object
let thething;

//  place where the front is send to the back
japp.post('/processing/poster', async (req, res, next) => {
    const whatsend = req.body;
    res.json({whatsend});
    console.log("this is the backend: " + whatsend);
    thething = whatsend;
    next();
});

//  gateway for processing to call continously
japp.get('/processing/entities', async (req, res, next) => {
        res.json(thething);
        next();
});


app.listen(3001, () =>
    console.log('Express server is running on localhost:3001')
);

japp.listen(3002, () =>
    console.log('Express server is running on localhost:3002')
);