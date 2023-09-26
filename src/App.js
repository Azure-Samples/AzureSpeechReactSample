import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { getTokenOrRefresh } from './token_util';
import './custom.css'
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')


export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            displayText: 'INITIALIZED: ready to test speech...'
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

    async sttFromMic() {
        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'en-US';
        
        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        this.setState({
            displayText: 'speak into your microphone...'
        });

        recognizer.recognizeOnceAsync(result => {
            let displayText;
            if (result.reason === ResultReason.RecognizedSpeech) {
                displayText = `RECOGNIZED: Text=${result.text}`
            } else {
                displayText = 'ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.';
            }

            this.setState({
                displayText: displayText
            });
        });
    }

    async textToSpeech() {
        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'en-US';
        
        const textToSpeak = 'This is an example of speech synthesis.';
        this.setState({
            displayText: `speaking text: ${textToSpeak}...`
        });
    }

    async fileChange(event) {
        const audioFile = event.target.files[0];
        console.log(audioFile);
        const fileInfo = audioFile.name + ` size=${audioFile.size} bytes `;

        this.setState({
            displayText: fileInfo
        });

        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'en-US';

        const audioConfig = speechsdk.AudioConfig.fromWavFileInput(audioFile);
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        recognizer.recognizeOnceAsync(result => {
            let displayText;
            if (result.reason === ResultReason.RecognizedSpeech) {
                displayText = `RECOGNIZED: Text=${result.text}`
            } else {
                displayText = 'ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.';
            }

            this.setState({
                displayText: fileInfo + displayText
            });
        });
    }

    render() {
        return (
            <Container className="app-container">
                <h1 className="display-4 mb-3">Speech sample app</h1>

                <div className="row main-container">
                    <div className="col-6">
                        <i className="fas fa-microphone fa-lg mr-2" onClick={() => this.sttFromMic()}></i>
                        Convert speech to text from your mic.

                        <div className="mt-2">
                            <label htmlFor="audio-file"><i className="fas fa-file-audio fa-lg mr-2"></i></label>
                            <input 
                                type="file" 
                                id="audio-file" 
                                onChange={(e) => this.fileChange(e)} 
                                style={{display: "none"}} 
                            />
                            Convert speech to text from an audio file.
                        </div>
                        <div className="mt-2">
                            <i className="fas fa-volume-up fa-lg mr-2" onClick={() => this.textToSpeech()}></i>
                            Convert text to speech.
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