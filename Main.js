import * as Utils from "./utils/utils.js";
import {calculateBlur3D} from './blur3D/Blur3D.js'
import {Camera} from './utils/camera.js';

import * as PBF from "./simulation/PBF.js";
import { generateMipMap } from "./mipmaps/CalculateMipMap.js";
import * as MarchingCubes from "./marchingCubes/TrianglesGenerator.js";

import * as Bloom from "./unrealBloom/UnrealBloom.js";
import * as dat from 'dat.gui';

import { vec3 } from "gl-matrix";


//Shaders
import marchingCubesShader from "./rendering/RenderMC.wgsl?raw";
import postProcessingShader from "./rendering/Postprocessing.wgsl?raw";
import backgroundShader from "./rendering/RenderBackground.wgsl?raw";
import blurOffsetsShader from "./rendering/BlurOffset.wgsl?raw";
import compositeShader from "./rendering/RenderComposite.wgsl?raw"



const device = await Utils.getDevice();

const PBF_RESOLUTION = 120; //More than 203 this breaks the buffer
const MC_RESOLUTION = PBF_RESOLUTION; //Maximum resolution available
const VERTEX_MEMORY = 20000000;
const totalParticles = 80000;
const MULTI_SAMPLER = 1;

//Load the logo image
async function loadImageBitmap(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    return await createImageBitmap(blob, { colorSpaceConversion: 'none' });
}

let letters = document.body.querySelectorAll(".letter");
letters = Array.from(letters);


const logoImage = await loadImageBitmap("./assets/codrops.png");

const logoTexture = device.createTexture({
    size: [1650, 200],
    format: 'rgba8unorm',
    dimension: '2d',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
})

device.queue.copyExternalImageToTexture(
    { source: logoImage},
    { texture: logoTexture },
    { width: logoTexture.width, 
        height: logoTexture.height },
);



//Get the context to render
const canvas = document.querySelector("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const context = canvas.getContext('webgpu');
const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
    device,
    format: presentationFormat
});

let textureSize = MC_RESOLUTION;

let currentFrame = 0;

// let querySet, queryBuffer, capacity;

// capacity = 2;//Max number of timestamps we can store

// querySet = device.createQuerySet({
//     type: "timestamp",
//     count: capacity,
// });

// queryBuffer = device.createBuffer({
//     size: 8 * capacity,
//     usage: GPUBufferUsage.QUERY_RESOLVE 
//     | GPUBufferUsage.STORAGE
//     | GPUBufferUsage.COPY_SRC
//     | GPUBufferUsage.COPY_DST,
// });

let colors = [
    [18, 97, 115],
    [78, 157, 166],
    [217, 166, 121],
    [191, 116, 73],
    [140, 68, 42],
]

let colorsId = 0 ;
let colorIdOut = 0;
let colorIdIn = 0;

//Define the GUI
var params = {
    depthTest: 1,
    mixAlpha: 1,
    size: 5,
    deltaTime: 0.05,
    coneAngle: 0.83,
    coneRotation: 45,
    coneAngle2: 0.76,
    coneRotation2: 64,
    gridRadius: 5,
    lightIntensity: 14,
    separation: 0.,
    voxelWorldSize: 0.022,
    smoothness: 12,
    mc_range: 0.6,
    thickness: 0.5,
    gamma: 1,
    brightness: 0,
    contrast: 1
}

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const guiMenu = urlParams.get('ui') == "true";

if(guiMenu) {
    var gui = new dat.GUI();

    var postFolder = gui.addFolder("postprocessing");
    postFolder.add(params, "gamma", -1, 1).name("gamma").step(0.01);
    postFolder.add(params, "brightness", -1, 1).name("brightness").step(0.01);
    postFolder.add(params, "contrast", -1, 3).name("contrast").step(0.01);


    var mcFolder = gui.addFolder('marchingCubes');
    mcFolder.add(params, "smoothness", 1, 30).name("smoothness").step(1);
    mcFolder.add(params, "mc_range", 0.001, 1).name("range").step(0.001);
    mcFolder.add(params, "thickness", 0.001, 1).name("thickness").step(0.001);
    mcFolder.add(params, "voxelWorldSize", 0.001, 0.1).name("voxel size ").step(0.0001);
    mcFolder.add(params, "coneAngle2", 0.1, 1, 1).name("cone angle ").step(0.01);
    mcFolder.add(params, "coneRotation2", 0, 90, 1).name("cone rotation ").step(1);

    var simulationFolder = gui.addFolder('simulation');
    simulationFolder.add(params, "deltaTime", 0, 0.05, 0).name("delta time").step(0.001);
    simulationFolder.add(params, "separation", 0, 0.4, 0).name("separation").step(0.01);
}


const texturePotential = device.createTexture({
    size: [textureSize, textureSize, textureSize],
    format: 'rgba32float',
    dimension: '3d',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
})


const texture_VCT = device.createTexture({
    size: [textureSize, textureSize, textureSize],
    format: 'rgba32float',
    dimension: '3d',
    mipLevelCount: Math.ceil(Math.log2(textureSize)),
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
})

const texturePotentialOut = device.createTexture({
    size: [textureSize, textureSize, textureSize],
    format: 'rgba32float',
    dimension: '3d',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUBufferUsage.COPY_SRC, 
})

const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
    mipmapFilter: "linear",
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    addressModeW: 'clamp-to-edge'
});




console.log("the PBF resolution is: " + PBF_RESOLUTION);
console.log("the amount of parrticles are: " + totalParticles);


//Define the camera
let camera = new Camera(canvas);
let cameraDistance = 3;
let FOV = 30;


//Setup the position based fluids
await PBF.setupPBF(PBF_RESOLUTION, totalParticles, texturePotential, camera);

//Setup the marching cubes
const [verticesBuffer, 
        normalsBuffer, 
        velocityBuffer,
        checkBuffer] = await MarchingCubes.setupMarchingCubes(VERTEX_MEMORY,
                                                            texturePotentialOut, 
                                                            texture_VCT);

//transform matrix
let uniformsData = new Array(64).fill(0);

let uniforms = new Float32Array(uniformsData);

const uniformsBuffer = device.createBuffer(
    {
        label: "uniforms buffer",
        size: uniforms.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }
)

const uniformsMirrorBuffer = device.createBuffer(
    {
        label: "uniforms mirror buffer",
        size: uniforms.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }
)
 
const marchingCubesData =  await Utils.setupRenderingPipeline("marching cubes", 
                                                                marchingCubesShader, 
                                                                MULTI_SAMPLER,
                                                                [{format: "rgba8unorm"},
                                                                 {format: "rgba8unorm"}
                                                                ]
                                                            );

const marchingCubesBindings = [];
marchingCubesBindings[0] = device.createBindGroup({
        label: "binding for non reflective shape",
        layout: marchingCubesData.pipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: {buffer: verticesBuffer}},
            {binding: 1, resource: {buffer: uniformsBuffer}},
            {binding: 2, resource: {buffer: normalsBuffer}},
            {binding: 3, resource: texture_VCT.createView()},
            {binding: 4, resource: sampler},
            {binding: 5, resource: {buffer: velocityBuffer}},
            {binding: 6, resource: texturePotentialOut.createView()},
        ]
    }
)

marchingCubesBindings[1] = device.createBindGroup({
    label: "binding for reflective shape",
    layout: marchingCubesData.pipeline.getBindGroupLayout(0),
    entries: [
        {binding: 0, resource: {buffer: verticesBuffer}},
        {binding: 1, resource: {buffer: uniformsMirrorBuffer}},
        {binding: 2, resource: {buffer: normalsBuffer}},
        {binding: 3, resource: texture_VCT.createView()},
        {binding: 4, resource: sampler},
        {binding: 5, resource: {buffer: velocityBuffer}},
        {binding: 6, resource: texturePotentialOut.createView()},
    ]
}
)


const postProData = await Utils.setupPipeline("post processing", postProcessingShader);


const uniformsXData = new Float32Array([0, 1, params.deltaTime, 1]);
const uniformsYData = new Float32Array([1, 0, params.deltaTime, 1]);

const uniformsXBuffer = device.createBuffer({
    label: "uniforms X buffer",
    size: uniformsXData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
})

const uniformsYBuffer = device.createBuffer({
    label: "uniforms Y buffer",
    size: uniformsYData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
})

device.queue.writeBuffer(uniformsXBuffer, 0, uniformsXData);
device.queue.writeBuffer(uniformsYBuffer, 0, uniformsYData);


const backgroundData = await Utils.setupRenderingPipeline("background quad",
                                                          backgroundShader,
                                                          MULTI_SAMPLER,
                                                          [{format: "rgba8unorm"},
                                                            {format: "rgba8unorm"}
                                                           ],
                                                           false
                                                        );

const backgroundUniforms = new Float32Array(8);
const backgroundBuffer = device.createBuffer({
    label: "background buffer",
    size: backgroundUniforms.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
})

const backogroundBindGroup = device.createBindGroup({
    label: "background bind group",
    layout: backgroundData.pipeline.getBindGroupLayout(0),
    entries: [
        {binding: 0, resource: {buffer: backgroundBuffer}}
    ]
})

const offsetData = await Utils.setupPipeline("offset pass", blurOffsetsShader);

const quadUniforms = new Float32Array(8);
const quadBuffer = device.createBuffer({
    label: "quad buffer",
    size: quadUniforms.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
})

const quadData = await Utils.setupRenderingPipeline("screen quad",
                                                    compositeShader,
                                                    1,
                                                    [{format: navigator.gpu.getPreferredCanvasFormat()}],
                                                    false);


let defaultDepthTexture,
    singleColorTexture,
    singleMirrorTexture,
    singleScreenTexture,
    singleMirrorTexture2,
    singleMirrorBase;

let multiColorTexture,
    multiMirrorTexture,
    multiDepthTexture;

const postProcessingBindings = [];
const offsetsBindings = [];

function updateRenderTexures() {

    if(defaultDepthTexture != null) {
        defaultDepthTexture.destroy();
        singleColorTexture.destroy();
        singleMirrorTexture.destroy();
        singleMirrorTexture2.destroy();
        singleMirrorBase.destroy();
        singleScreenTexture.destroy();
        multiColorTexture.destroy();
        multiMirrorTexture.destroy();
        multiDepthTexture.destroy();
    }

    defaultDepthTexture = device.createTexture({
        size: [window.innerWidth, window.innerHeight],
        sampleCount: 1,
        format: 'depth32float',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });

    multiDepthTexture = device.createTexture({
        size: [window.innerWidth, window.innerHeight],
        sampleCount: MULTI_SAMPLER,
        format: 'depth32float',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });

    singleColorTexture = device.createTexture({
        size: [window.innerWidth, window.innerHeight],
        sampleCount: 1,
        format: 'rgba8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING
    });

    singleMirrorTexture = device.createTexture({
        size: [window.innerWidth, window.innerHeight],
        sampleCount: 1,
        format: 'rgba8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC
    });

    multiColorTexture = device.createTexture({
        size: [window.innerWidth, window.innerHeight],
        sampleCount: MULTI_SAMPLER,
        format: 'rgba8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });

    multiMirrorTexture = device.createTexture({
        size: [window.innerWidth, window.innerHeight],
        sampleCount: MULTI_SAMPLER,
        format: 'rgba8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC
    });

    singleMirrorTexture2 = device.createTexture({
        size: [window.innerWidth, window.innerHeight],
        sampleCount: 1,
        format: 'rgba8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING
    });

    singleMirrorBase = device.createTexture({
        size: [window.innerWidth, window.innerHeight],
        sampleCount: 1,
        format: 'rgba8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST
    });

    singleScreenTexture = device.createTexture({
        size: [window.innerWidth, window.innerHeight],
        sampleCount: 1,
        format: 'rgba8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING
    });

    Bloom.setup(window.innerWidth, window.innerHeight, singleColorTexture, singleScreenTexture, sampler);

    postProcessingBindings[0] = device.createBindGroup( {
        label:`post processing pass X bind group`,
        layout: postProData.pipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: singleColorTexture.createView()},
            {binding: 1, resource: singleMirrorTexture.createView()},
            {binding: 2, resource: sampler},
            {binding: 3, resource: {buffer: uniformsXBuffer}},
            {binding: 4, resource: singleScreenTexture.createView()},

        ]
    })
    
    postProcessingBindings[1] = device.createBindGroup( {
        label:`post processing pass Y bind group`,
        layout: postProData.pipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: singleScreenTexture.createView()},
            {binding: 1, resource: singleMirrorTexture.createView()},
            {binding: 2, resource: sampler},
            {binding: 3, resource: {buffer: uniformsYBuffer}},
            {binding: 4, resource: singleColorTexture.createView()},
        ]
    })



    offsetsBindings[0] = device.createBindGroup( {
        label:`offset X bind group`,
        layout: offsetData.pipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: {buffer: uniformsXBuffer}},
            {binding: 1, resource: singleMirrorBase.createView()},
            {binding: 2, resource: singleMirrorTexture.createView()},
            {binding: 3, resource: singleMirrorTexture2.createView()},

        ]
    })
    

    offsetsBindings[1] = device.createBindGroup( {
        label:`offset Y bind group`,
        layout: offsetData.pipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: {buffer: uniformsYBuffer}},
            {binding: 1, resource: singleMirrorBase.createView()},
            {binding: 2, resource: singleMirrorTexture2.createView()},
            {binding: 3, resource: singleMirrorTexture.createView()},
        ]
    })



    quadData.setBindGroup(
        [
            {binding: 0, resource: {buffer: quadBuffer}},
            {binding: 1, resource: singleScreenTexture.createView()},
            {binding: 2, resource: sampler},
            {binding: 3, resource: logoTexture.createView()}
        ]
    )

}

window.onresize = updateRenderTexures;
updateRenderTexures();



//Rendering
async function render() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    //Quick performance test to update a frame
    let frameData = PBF.updateFrame({x: 0 , y: -18 , z: 0}, params.deltaTime, params.lightIntensity, params.separation, camera);

    if(frameData.relativeFrame == 0) {


        colorIdIn = (colorsId) % colors.length;
        colorIdOut = (colorsId + 1) % colors.length;
        colorsId ++;  

    }


    //Generate the potential for the marching cubes.
    calculateBlur3D(texturePotential, texturePotentialOut, params.smoothness);

    //Calculate the triangles using the marching cubes.
    MarchingCubes.generateTriangles(params.mc_range);

    //Calculate the mipmap of the texture for the voxel cone tracing
    generateMipMap(texture_VCT, device);

    //Update the camera
    camera.updateCamera(FOV, window.innerWidth / window.innerHeight, cameraDistance);
    var n = vec3.fromValues(0, 1, 0);
    camera.calculateReflection([0., 0.03, 0], n);

    //make a command enconder to start encoding thigns
    const encoder = device.createCommandEncoder({ label: 'rendering encoder'});


    //Render the background

    backgroundUniforms[0] = colors[colorIdIn][0] / 255;
    backgroundUniforms[1] = colors[colorIdIn][1] /255;
    backgroundUniforms[2] = colors[colorIdIn][2] /255;
    backgroundUniforms[3] = frameData.relativeFrame;
    backgroundUniforms[4] = colors[colorIdOut][0] / 255;
    backgroundUniforms[5] = colors[colorIdOut][1] /255;
    backgroundUniforms[6] = colors[colorIdOut][2] /255;

    device.queue.writeBuffer(backgroundBuffer, 0, backgroundUniforms);

    backgroundData.passDescriptor.colorAttachments[0].view = MULTI_SAMPLER == 4 ? multiColorTexture.createView() : singleColorTexture.createView();
    if(MULTI_SAMPLER == 4) backgroundData.passDescriptor.colorAttachments[0].resolveTarget = singleColorTexture.createView();
    backgroundData.passDescriptor.colorAttachments[0].loadOp = 'clear';

    backgroundData.passDescriptor.colorAttachments[1].view =  MULTI_SAMPLER == 4 ? multiMirrorTexture.createView() : singleMirrorTexture.createView();
    if(MULTI_SAMPLER == 4) backgroundData.passDescriptor.colorAttachments[1].resolveTarget = singleMirrorTexture.createView();
    backgroundData.passDescriptor.colorAttachments[1].loadOp = 'clear';


    const backgroundPass = encoder.beginRenderPass(backgroundData.passDescriptor);
    backgroundPass.setPipeline(backgroundData.pipeline);
    backgroundPass.setBindGroup(0, backogroundBindGroup);
    backgroundPass.draw(6, 1);
    backgroundPass.end();



    const uniformsOffset = 16;
    for(let i = 0; i < 16; i ++) {
        uniforms[i] = camera.transformMatrix[i];
    }

    uniforms[uniformsOffset] = camera.position[0];
    uniforms[uniformsOffset + 1] = camera.position[1];
    uniforms[uniformsOffset + 2] = camera.position[2];
    uniforms[uniformsOffset + 3] = PBF_RESOLUTION;
    uniforms[uniformsOffset + 4] = params.coneAngle2;
    uniforms[uniformsOffset + 5] = params.coneRotation2;
    uniforms[uniformsOffset + 6] = frameData.relativeFrame;
    uniforms[uniformsOffset + 7] = params.voxelWorldSize;

    uniforms[uniformsOffset + 8] = colors[colorIdIn][0] / 255;
    uniforms[uniformsOffset + 9] = colors[colorIdIn][1] / 255;
    uniforms[uniformsOffset + 10] = colors[colorIdIn][2] / 255;
    uniforms[uniformsOffset + 11] = 0;

    uniforms[uniformsOffset + 12] = colors[colorIdOut][0] / 255;
    uniforms[uniformsOffset + 13] = colors[colorIdOut][1] / 255;
    uniforms[uniformsOffset + 14] = colors[colorIdOut][2] / 255;
    uniforms[uniformsOffset + 15] = params.thickness;

    device.queue.writeBuffer(uniformsBuffer, 0, uniforms);

    //For the mirror
    for(let i = 0; i < 16; i ++) {
        uniforms[i] = camera.transformMatrixReflection[i];
    }
    uniforms[uniformsOffset + 11] = 1;
    device.queue.writeBuffer(uniformsMirrorBuffer, 0, uniforms);


    //Render the fluid
    marchingCubesData.passDescriptor.colorAttachments[0].view = MULTI_SAMPLER == 4? multiColorTexture.createView() : singleColorTexture.createView();
    if(MULTI_SAMPLER == 4) marchingCubesData.passDescriptor.colorAttachments[0].resolveTarget = singleColorTexture.createView();
    marchingCubesData.passDescriptor.colorAttachments[0].loadOp = 'load';

    marchingCubesData.passDescriptor.colorAttachments[1].view = MULTI_SAMPLER == 4? multiMirrorTexture.createView() : singleMirrorTexture.createView();
    if(MULTI_SAMPLER == 4) marchingCubesData.passDescriptor.colorAttachments[1].resolveTarget = singleMirrorTexture.createView();
    marchingCubesData.passDescriptor.colorAttachments[1].loadOp = 'load';

    marchingCubesData.passDescriptor.depthStencilAttachment.view = multiDepthTexture.createView();
    marchingCubesData.passDescriptor.depthStencilAttachment.depthLoadOp = 'clear';


    const pass = encoder.beginRenderPass(marchingCubesData.passDescriptor);
    pass.setPipeline(marchingCubesData.pipeline);
    marchingCubesBindings.map(bindGroup => {
        pass.setBindGroup(0, bindGroup);
        pass.drawIndirect(checkBuffer, 4 * 3);
    })
    pass.end();


    encoder.copyTextureToTexture(
        {
          texture: singleMirrorTexture,
        },
        {
          texture: singleMirrorBase,
        },
        {
          width: window.innerWidth,
          height: window.innerHeight
        },
    );

    let postX = Math.ceil(window.innerWidth / 16);
    let postY = Math.ceil(window.innerHeight / 16);

    //Offset passes
    const offsetPass = encoder.beginComputePass(offsetData.passDescriptor);
    offsetPass.setPipeline(offsetData.pipeline);
    offsetPass.setBindGroup(0, offsetsBindings[0]);
    offsetPass.dispatchWorkgroups(postX, postY);
    offsetPass.setBindGroup(0, offsetsBindings[1]);
    offsetPass.dispatchWorkgroups(postX, postY);
    offsetPass.end();


    //Post processing passes
    const postProPass = encoder.beginComputePass(postProData.passDescriptor);
    postProPass.setPipeline(postProData.pipeline);
    postProPass.setBindGroup(0, postProcessingBindings[0]);
    postProPass.dispatchWorkgroups(postX, postY);
    postProPass.setBindGroup(0, postProcessingBindings[1]);
    postProPass.dispatchWorkgroups(postX, postY);
    postProPass.end();

    Bloom.applyBloom(encoder);

    //Render the quad
    quadData.passDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
    quadData.passDescriptor.colorAttachments[0].loadOp = "clear";

    quadUniforms[0] = window.innerWidth;
    quadUniforms[1] = window.innerHeight;
    
    quadUniforms[2] = frameData.relativeFrame;
    quadUniforms[3] = frameData.animationFrame;
    quadUniforms[4] = frameData.currentLetter;
    quadUniforms[5] = params.brightness;

    quadUniforms[6] = params.contrast;
    quadUniforms[7] = params.gamma;


    device.queue.writeBuffer(quadBuffer, 0, quadUniforms);

    const screenPass = encoder.beginRenderPass(quadData.passDescriptor);
    screenPass.setPipeline(quadData.pipeline);
    screenPass.setBindGroup(0, quadData.bindGroup);
    screenPass.draw(6, 1);
    screenPass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    currentFrame ++;

}


// set the expected frame rate
let frames_per_second = 60;

let interval = Math.floor(1000 / frames_per_second);
let startTime = performance.now();
let previousTime = startTime;

let currentTime = 0;
let deltaTime = 0;

function animationLoop(timestamp) {
  currentTime = timestamp;
  deltaTime = currentTime - previousTime;

  if (deltaTime > interval) {
    previousTime = currentTime - (deltaTime % interval);
    render();
  }

  requestAnimationFrame(animationLoop);
}

requestAnimationFrame(animationLoop);




