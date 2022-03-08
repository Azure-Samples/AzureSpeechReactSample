"use strict";
require('dotenv').config();
const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");

const key = 'REDACTED';
const endpoint = 'REDACTED';
const textAnalyticsClient = new TextAnalyticsClient(endpoint,  new AzureKeyCredential(key));

async function keyPhraseExtraction(client){

    const keyPhrasesInput = [
        "My cat might need to see a veterinarian.",
    ];
    const keyPhraseResult = await client.extractKeyPhrases(keyPhrasesInput);
    
    keyPhraseResult.forEach(document => {
        console.log(`ID: ${document.id}`);
        console.log(` ${document.keyPhrases}`);
    });
}

keyPhraseExtraction(textAnalyticsClient);

module.exports = textAnalyticsClient;