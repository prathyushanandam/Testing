import { HostObject } from '@amazon-sumerian-hosts/babylon';
import { Scene } from '@babylonjs/core/scene';
import DemoUtils from './demo-utils';
import { cognitoIdentityPoolId } from './demo-credentials.js'
import { Buffer } from 'buffer'
import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime";

let host;
let scene;

async function createScene() {
  // Create an empty scene. Note: Sumerian Hosts work with both
  // right-hand or left-hand coordinate system for babylon scene
  scene = new Scene();

  const { shadowGenerator } = DemoUtils.setupSceneEnvironment(scene);
  initUi();

  // ===== Configure the AWS SDK =====

  AWS.config.region = cognitoIdentityPoolId.split(':')[0];
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: cognitoIdentityPoolId,
  });

  // ===== Instantiate the Sumerian Host =====

  // Edit the characterId if you would like to use one of
  // the other pre-built host characters. Available character IDs are:
  // "Cristine", "Fiona", "Grace", "Maya", "Jay", "Luke", "Preston", "Wes"
  const characterId = 'Cristine';
  const pollyConfig = { pollyVoice: 'Joanna', pollyEngine: 'neural' };
  const characterConfig = HostObject.getCharacterConfig(
    './assets/character-assets',
    characterId
  );
  host = await HostObject.createHost(scene, characterConfig, pollyConfig);

  // Tell the host to always look at the camera.
  host.PointOfInterestFeature.setTarget(scene.activeCamera);

  // Enable shadows.
  scene.meshes.forEach(mesh => {
    shadowGenerator.addShadowCaster(mesh);
  });

  return scene;
}

function initUi() {
  document.getElementById('speakButton').onclick = speak.bind(this);
}

function speak() {
  const speech = document.getElementById('speechText').value;
  //call Sagemaker endpoint and get response. Then pass response as speech.
  
  var params = {
  Body: Buffer.from(speech) || 'STRING_VALUE',
  EndpointName: 'jumpstart-example-infer-pytorch-textgen-2023-03-02-23-21-33-273', 
  Accept: 'STRING_VALUE',
  ContentType: 'STRING_VALUE',
  CustomAttributes: 'STRING_VALUE'
  };
  SageMakerRuntimeClient.InvokeEndpointCommand(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
  });
 
  host.TextToSpeechFeature.play(speech);
}

DemoUtils.loadDemo(createScene);
