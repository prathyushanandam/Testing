import {
  SageMakerRuntimeClient,
  InvokeEndpointCommand,
} from "@aws-sdk/client-sagemaker-runtime";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { HostObject } from "@amazon-sumerian-hosts/babylon";
import { Scene } from "@babylonjs/core/scene";
import DemoUtils from "./demo-utils";
import { cognitoIdentityPoolId } from "./demo-credentials.js";
import { Vector2 } from "@babylonjs/core";
const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();

let host;
let sageMakerClient;
let scene;
let trimResponse = false;
let userInput;

async function createScene() {
  // Create an empty scene. Note: Sumerian Hosts work with both
  // right-hand or left-hand coordinate system for babylon scene
  scene = new Scene();

  const { shadowGenerator } = DemoUtils.setupSceneEnvironment(scene);
  initUi();

  // ===== Configure the AWS SDK =====

  const region = cognitoIdentityPoolId.split(":")[0];
  AWS.config.region = region;
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: cognitoIdentityPoolId,
  });

  // ===== Create SageMaker client using AWS SDK for JavaScript v3 =====

  sageMakerClient = new SageMakerRuntimeClient({
    region,
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region }),
      identityPoolId: cognitoIdentityPoolId,
    }),
  });

  // ===== Instantiate the Sumerian Host =====

  // Edit the characterId if you would like to use one of
  // the other pre-built host characters. Available character IDs are:
  // "Cristine", "Fiona", "Grace", "Maya", "Jay", "Luke", "Preston", "Wes"
  const characterId = "Cristine";
  const pollyConfig = { pollyVoice: "Joanna", pollyEngine: "neural" };
  const characterConfig = HostObject.getCharacterConfig(
    "./assets/character-assets",
    characterId
  );
  host = await HostObject.createHost(scene, characterConfig, pollyConfig);

  // Tell the host to always look at the camera.
  host.PointOfInterestFeature.setTarget(scene.activeCamera);

  // Enable shadows.
  scene.meshes.forEach((mesh) => {
    shadowGenerator.addShadowCaster(mesh);
  });
  const v1="Hi My name is Joanna an AlexaTM Host. Please enter in Textbox to talk to me";
  host.TextToSpeechFeature.play(v1);
  return scene;
}

function initUi() {
  document.getElementById("speakButton").onclick = speak.bind(this);
  
}



async function speak() {
  //const v1="Hi My name is Joanna a Sumerian Host. Please enter in Textbox to talk to me";
  //host.TextToSpeechFeature.play(v1);
  const textInput = document.getElementById("speechText").value;
  let isEnglish = false;
  if (lngDetector.detect(textInput)[0][0] === 'english' || lngDetector.detect(textInput)[0][0] === 'pidgin' 
  || lngDetector.detect(textInput)[0][0] ===  'hawaiian'){
    isEnglish=true;
  }
  
  console.log(`isEnglish ${isEnglish}`);    
  // const englishRegex = /[a-zA-Z]+/g;
  // const matches = textInput.match(englishRegex);
  // const isEnglish = matches && matches.length > 0;
  // console.log(isEnglish);

//case: 1-shot natural language generation
if (withBrackets(textInput)){
  trimResponse = true;
  console.log(`input with brackets: ${textInput}`);
  console.log('use 1-shot natural language generation');

  const trainInp = "name[The Punter], food[Indian], priceRange[cheap]";
  const trainOut = "The Punter provides Indian food in the cheap price range.";
  
  // "name[Loch Fyne], food[French], customer rating[high], area[riverside], near[The Rice Boat]";
  // "For luxurious French food, the Loch Fyne is located by the river next to The Rice Boat."
  // link to test examples: https://huggingface.co/datasets/e2e_nlg

  userInput = `[CLM] ${trainInp} ==> sentence describing the place: ${trainOut} ; ${textInput} ==> sentence describing the place:`;
  console.log(`Model input: ${userInput}\n`);
  
}
 //case: use 4.3. 1-shot machine translation
if(!withBrackets(textInput) && !isEnglish){
  trimResponse = true;
  const trainInp = "Das Parlament erhebt sich zu einer Schweigeminute.";
  const trainOut = "The House rose and observed a minute' s silence";
  const testOut = "Me33mbership of Parliament: see Minutes;"; 
  
  userInput = `[CLM] ${trainInp};Translation in English: ${trainOut} ; Sentence: ${textInput}; Translation in English:`;
  console.log(`machine translation: ${textInput}`);
  console.log(`Model input: ${userInput}\n`);
  console.log(`Ground truth: ${testOut}`);
} 
// case : Query endpoint and parse response. Complete sentence
if (!withBrackets(textInput) && isEnglish){
  
  trimResponse = false;
  userInput=textInput;
}

  // Create the request params.
  var params = {
    EndpointName:
      "jumpstart-example-infer-pytorch-textgen-2023-03-02-23-21-33-273", // 👈 replace this value!
    Body: JSON.stringify(userInput),
    ContentType: "application/x-text",
  };

  try {
    // Invoke the endpoint.
    const command = new InvokeEndpointCommand(params);
    const response = await sageMakerClient.send(command);
    
    // Decode the body of the response.
    const bodyJson = new TextDecoder().decode(response.Body);
    const responseBody = await JSON.parse(bodyJson);
    
    // Speak the generated text.
    const generatedText = responseBody.generated_text;
    
    //dont trim if it is complete sentence
    const speech = trimResponse ? generatedText.split(";")[0] : generatedText;
    

    console.log(speech);

    await host.TextToSpeechFeature.play(speech);
    const v2="What do you want to do next";
    await host.TextToSpeechFeature.play(v2);

  } catch (err) {
    console.error(err, err.stack);
    host.TextToSpeechFeature.play(
      "There was a problem completing your request. View your browser's console log for details."
    );
  }
}


function withBrackets(input) {
  // Regular expression to check brackets
  const hasBrackets = /\[.*?\]/.test(input);
  return hasBrackets;
}

DemoUtils.loadDemo(createScene);
