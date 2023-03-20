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

let host;
let sageMakerClient;
let scene;

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

  return scene;
}

function initUi() {
  document.getElementById("speakButton").onclick = speak.bind(this);
}

async function speak() {
  
//Language translation

if ('NaturalTranslation'){
    const trainInp = "Das Parlament erhebt sich zu einer Schweigeminute.";
    const trainOut = "The House rose and observed a minute' s silence";

    const testInp ="Kleingärtner bewirtschaften den einstigen Grund von Bauern.";
    const testOut = "Allotment holders cultivate the soil of former farmers."; 
    const userInput = `[CLM] ${trainInp};Translation in English: ${trainOut} ; Sentence: ${testInp}; Translation in English:`;
    console.log(`Model input: ${userInput}\n`);
    console.log(`Ground truth: ${testOut}`);

//Natural model


    }
// if('NaturalModel'){ 
//   const trainInp = "name[The Punter], food[Indian], priceRange[cheap]";
//   const trainOut = "The Punter provides Indian food in the cheap price range.";

//   const testInp ="name[Loch Fyne], food[French], customer rating[high], area[riverside], near[The Rice Boat]";
//   const testOut = "For luxurious French food, the Loch Fyne is located by the river next to The Rice Boat."; 
//   const userInput = `[CLM] ${trainInp} ==> sentence describing the place: ${trainOut} ; ${testInp} ==> sentence describing the place:`;

//   console.log(`Model input: ${userInput}\n`);
//   console.log(`Ground truth: ${testOut}`);

//   var params = {
//     EndpointName:
//       "jumpstart-example-infer-pytorch-textgen-2023-03-02-23-21-33-273", // 👈 replace this value!
//     Body: JSON.stringify(userInput),
//     ContentType: "application/x-text",
//   };

//   try {
//     // Invoke the endpoint.
//     const command = new InvokeEndpointCommand(params);
//     const response = await sageMakerClient.send(command);
//     // Decode the body of the response.
//     const bodyJson = new TextDecoder().decode(response.Body);
//     //console.log(bodyJson);
//     const responseBody = await JSON.parse(bodyJson);
//     // Speak the generated text.
//     //const speech = responseBody.generated_text;
//     const generatedText = responseBody.generated_text;
//     const speech = generatedText.split(";")[0];
//     console.log(speech);
//     host.TextToSpeechFeature.play(speech);
//       } catch (err) {
//         console.error(err, err.stack);
//         host.TextToSpeechFeature.play(
//           "There was a problem completing your request. View your browser's console log for details."
//         );
//       }
//     }
// if('SentenceCompletion'){
//   const userInput = document.getElementById("speechText").value;

//   try {
//     // Invoke the endpoint.
//     const command = new InvokeEndpointCommand(params);
//     const response = await sageMakerClient.send(command);
//     // Decode the body of the response.
//     const bodyJson = new TextDecoder().decode(response.Body);
//     const responseBody = await JSON.parse(bodyJson);
//     // Speak the generated text.
//     const speech = responseBody.generated_text;
//     console.log(speech);
//     host.TextToSpeechFeature.play(speech);
//   } catch (err) {
//     console.error(err, err.stack);
//     host.TextToSpeechFeature.play(
//       "There was a problem completing your request. View your browser's console log for details."
//     );
//   }
// } 
else{}
}

//
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
  //console.log(bodyJson);
  const responseBody = await JSON.parse(bodyJson);
  
  //console.log(responseBody);
  // Speak the generated text.
  
  //const speech = responseBody.generated_text;
  const generatedText = responseBody.generated_text;
  const speech = generatedText.split(";")[0];
  console.log(speech);
  host.TextToSpeechFeature.play(speech);
    } catch (err) {
      console.error(err, err.stack);
      host.TextToSpeechFeature.play(
        "There was a problem completing your request. View your browser's console log for details."
      );
    }



DemoUtils.loadDemo(createScene);
