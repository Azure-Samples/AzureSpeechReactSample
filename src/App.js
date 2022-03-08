import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { getTokenOrRefresh } from './token_util';
import './custom.css'
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';
import axios from 'axios';

require('dotenv').config();

//cognitive services
const speechsdk = require('microsoft-cognitiveservices-speech-sdk')

const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");

const key = 'YOUR_TEXT_ANALYSIS_KEY_HERE';
const endpoint = 'YOUR_CORRESPONDING_ENDPOINT_HERE'; //--> example: https://YOURNAMEOFSUB.cognitiveservices.azure.com/
const textAnalyticsClient = new TextAnalyticsClient(endpoint,  new AzureKeyCredential(key));

export default class App extends Component {
    constructor(props) {
        super(props);
        
        this.state = {
            displayText: null,
            entitiescomp: null,
            keyphrases: null,
            recognizerboy: null,
            ctr: 0,
        }
    }
    
    async componentDidMount() {
        // check for valid speech key/region
        const tokenRes = await getTokenOrRefresh();
        if (tokenRes.authToken === null) {
            this.setState({
                displayText: 'FATAL_ERROR: ' + tokenRes.error
            });
        }
    }
    
    //get keyphrases
    async keyPhraseExtraction(recognizedtext){
        let displayText;

        const client = textAnalyticsClient;
        const text = recognizedtext;
        const keyPhrasesInput = [
            text,
        ];

        const keyPhraseResult = await client.extractKeyPhrases(keyPhrasesInput);
        
        keyPhraseResult.forEach(document => {
            // console.log(`ID: ${document.id}`);
            displayText = `${document.keyPhrases}`;
        });

        this.setState({
            keyphrases: displayText,
        });
        console.log("keyphraseresult: " + keyPhraseResult);
        
    }

    async entityRecognition(recognizedtext){
        //let displayText;
        const client = textAnalyticsClient;
        const text = recognizedtext;

        const entityInputs = [
            text,
            // "Microsoft was founded by Bill Gates and Paul Allen on April 4, 1975, to develop and sell BASIC interpreters for the Altair 8800",
            // "La sede principal de Microsoft se encuentra en la ciudad de Redmond, a 21 kilómetros de Seattle."
        ];

        const entityResults = await client.recognizeEntities(entityInputs);
        
        entityResults.forEach(document => {
            console.log(`Document ID: ${document.id}`);
            if (document.entities != null){
                document.entities.forEach(entity => {
                    console.log(`\tName: ${entity.text} \tCategory: ${entity.category} \tSubcategory: ${entity.subCategory ? entity.subCategory : "N/A"}`);
                    console.log(`\tScore: ${entity.confidenceScore}`);
                });
            }
        });

        this.setState({
            entitiescomp: entityResults,
        });
        console.log("entityresults" + entityResults[0].entities);
    }
    // entityRecognition(textAnalyticsClient);

    //check if state (i.e. first displayText, then keyphrase&entity) updated, send to api
    async componentDidUpdate(prevState) {
        // Typical usage (don't forget to compare props):
        if (this.state.displayText !== prevState.displayText) {
            if(this.state.entitiescomp !== null){
                if (this.state.entitiescomp !== prevState.entitiescomp && this.state.keyphrases !== prevState.keyphrases){
                    //copy state & remove client info
                    console.log(this.state);
                    const sentence = this.state.displayText;
                    const keyphrases = this.state.keyphrases;
                    const entities = this.state.entitiescomp[0].entities;
                    try{
                        await axios.post('http://localhost:3002/processing/poster', {sentence,keyphrases,entities}, {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }).then(
                            console.log('it was updated, so we updating and doing the networkthing')
                        );
                    } catch(err) {
                        if(err.response === 500) {
                            console.log('it fucked up in the server');
                        } else {
                            console.log("error:" + err.response);
                        }
                    };
                }
            }
        }
    }
    
    async sttFromMic(){
        let displayText;
        var Ctr = this.state.ctr;
        let utterances = [
            //place text where you can test a series of utterances without the need to speak every time
        ]

            
        displayText = utterances[Ctr];
        Ctr = Ctr + 1;
        if(Ctr == utterances.length){
            Ctr = 0;
        }

        this.keyPhraseExtraction(displayText);
        this.entityRecognition(displayText);

        this.setState({
            displayText: displayText,
            ctr: Ctr
        });
    }

    //React example single utterance (15s max.)
    // async sttFromMic() {
    //     const tokenObj = await getTokenOrRefresh();
    //     const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
    //     speechConfig.speechRecognitionLanguage = 'en-US';
        
    //     const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
    //     const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

    //     this.setState({
    //         displayText: 'speak into your microphone...'
    //     });

    //     recognizer.recognizeOnceAsync(result => {
    //         let displayText;
      

    //         if (result.reason === ResultReason.RecognizedSpeech) {
    //             displayText = `${result.text}`;
                
    //         } else {
    //             displayText = 'ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.';
    //         }
    //         // this.keyPhraseExtraction(displayText);
    //     });
    // }

    //Awesome Olaf doing continious jwz
    async sttFromMicCont(){
        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'en-US';
        
        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        this.setState({recognizerboy: recognizer})

        let displayText;

        recognizer.recognizing = (s, e) => {
            //console.log(`RECOGNIZING: Text=${e.result.text}`);
            //displayText = `${e.result.text}`;
        };
        
    
        recognizer.recognized = (s, e) => {
            if (e.result.reason == speechsdk.ResultReason.RecognizedSpeech) {
                console.log(`RECOGNIZED: Text=${e.result.text}`);
                displayText = `${e.result.text}`;
                this.keyPhraseExtraction(displayText);
                this.entityRecognition(displayText);
                this.setState({displayText: displayText});
            }
            else if (e.result.reason == speechsdk.ResultReason.NoMatch) {
                console.log("NOMATCH: Speech could not be recognized.");
            }
        };
        
        recognizer.canceled = (s, e) => {
            console.log(`CANCELED: Reason=${e.reason}`);
        
            if (e.reason == speechsdk.CancellationReason.Error) {
                console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
                console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
                console.log("CANCELED: Did you update the key and location/region info?");
            }
        
            recognizer.stopContinuousRecognitionAsync();
        };
        
        recognizer.sessionStopped = (s, e) => {
            console.log("\n    Session stopped event.");
            recognizer.stopContinuousRecognitionAsync();
        };

        recognizer.startContinuousRecognitionAsync();
    }

    //button to stop the recogniiton process
    async sttFromMicContStop() {
        const recognizer = this.state.recognizerboy;
        recognizer.stopContinuousRecognitionAsync();
    }

    render() {
        return (
            <Container className="app-container">
                <h1 className="display-4 mb-3">Speech sample app</h1>

                <div className="row main-container">
                    <div className="col-6">
                        <i className="fas fa-microphone fa-lg mr-2" onClick={() => this.sttFromMic()}></i>
                        Convert speech to text from your mic once.
                        

                        <div className="mt-2">
                        <i className="fas fa-microphone fa-lg mr-2" onClick={() => this.sttFromMicCont() } ></i>
                        Convert speech to text continuously
                        </div>

                        <div className="mt-2">
                        <i className="fas fa-microphone fa-lg mr-2" onClick={() => this.sttFromMicContStop() } ></i>
                        Stop converting speech to text continuously
                        </div>

                    </div>
                    <div className="col-6 output-display rounded">
                        <code>{this.state.displayText}</code>
                    </div>
                </div>
            </Container>
        );
    }
}