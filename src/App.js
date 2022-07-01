import React, { useState, useEffect } from "react";
import { Container } from "reactstrap";
import { getTokenOrRefresh } from "./token_util";
import "./custom.css";
import { ResultReason } from "microsoft-cognitiveservices-speech-sdk";

const speechsdk = require("microsoft-cognitiveservices-speech-sdk");

const App = () => {
  const [displayText, setDisplayText] = useState(
    "INITIALIZED: ready to test speech..."
  );

  useEffect(() => {
    const fetchData = async () => {
      // check for valid speech key/region
      const tokenRes = await getTokenOrRefresh();
      if (tokenRes.authToken === null) {
        setDisplayText("FATAL_ERROR: " + tokenRes.error);
      }
    };
    fetchData();
  }, []);

  const sttFromMic = async () => {
    const tokenObj = await getTokenOrRefresh();
    const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(
      tokenObj.authToken,
      tokenObj.region
    );
    speechConfig.speechRecognitionLanguage = "en-US";

    const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new speechsdk.SpeechRecognizer(
      speechConfig,
      audioConfig
    );

    setDisplayText("speak into your microphone...");

    recognizer.recognizeOnceAsync((result) => {
      let displayText;
      if (result.reason === ResultReason.RecognizedSpeech) {
        displayText = `RECOGNIZED: Text=${result.text}`;
      } else {
        displayText =
          "ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.";
      }
      setDisplayText(displayText);
    });
  };

  const fileChange = async (event) => {
    const audioFile = event.target.files[0];
    console.log(audioFile);
    const fileInfo = audioFile.name + ` size=${audioFile.size} bytes `;

    setDisplayText(fileInfo);

    const tokenObj = await getTokenOrRefresh();
    const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(
      tokenObj.authToken,
      tokenObj.region
    );
    speechConfig.speechRecognitionLanguage = "en-US";

    const audioConfig = speechsdk.AudioConfig.fromWavFileInput(audioFile);
    const recognizer = new speechsdk.SpeechRecognizer(
      speechConfig,
      audioConfig
    );

    recognizer.recognizeOnceAsync((result) => {
      let displayText;
      if (result.reason === ResultReason.RecognizedSpeech) {
        displayText = `RECOGNIZED: Text=${result.text}`;
      } else {
        displayText =
          "ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.";
      }

      setDisplayText(fileInfo + displayText);
    });
  };

  return (
    <Container className="app-container">
      <h1 className="display-4 mb-3">Speech sample app</h1>

      <div className="row main-container">
        <div className="col-6">
          <i
            className="fas fa-microphone fa-lg mr-2"
            onClick={() => sttFromMic()}
          ></i>
          Convert speech to text from your mic.
          <div className="mt-2">
            <label htmlFor="audio-file">
              <i className="fas fa-file-audio fa-lg mr-2"></i>
            </label>
            <input
              type="file"
              id="audio-file"
              onChange={(e) => fileChange(e)}
              style={{ display: "none" }}
            />
            Convert speech to text from an audio file.
          </div>
        </div>
        <div className="col-6 output-display rounded">
          <code>{displayText}</code>
        </div>
      </div>
    </Container>
  );
};

export default App;
