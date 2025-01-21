
import { getLetter } from "../rendering/LetterGenerator.js";
import * as Utils from "../utils/utils.js";

import { vec3, mat4 } from "gl-matrix";

//Shaders
import forcesShader from "../simulation/PBF_applyForces.wgsl?raw";
import displacementShader from "../simulation/PBF_calculateDisplacements.wgsl?raw";
import velocityShader from "../simulation/PBF_integrateVelocity.wgsl?raw";
import textureFillShader from "../simulation/textureClear.wgsl?raw";

const TRANSITION_FRAMES = 120;

/////////////////////////////////////////////////////////////////////////////////////////
//Parameters for the PBF
/////////////////////////////////////////////////////////////////////////////////////////

let searchRadius = 1.8;
let constrainsIterations = 3;
let pbfResolution = null;

let _device = null;
let _bufferSize = null;

let _amountOfParticles;

let currentFrame = 0;

/////////////////////////////////////////////////////////////////////////////////////////
//Buffers for the PBF
/////////////////////////////////////////////////////////////////////////////////////////

let positionBuffer,
    positionBuffer1, 
    positionBuffer2, 
    velocityBuffer, 
    counterBuffer, 
    indicesBuffer;

/////////////////////////////////////////////////////////////////////////////////////////
//Pipelines, uniforms and bindings
/////////////////////////////////////////////////////////////////////////////////////////

let forcesData;
let displacementData;
let velocityData;
let textureData;
let texture;

let _camera;
let mouse = vec3.create();
let prevMouse = vec3.create();
let mouseDirection = vec3.create();
let mouseForce = vec3.create();

let arriveBuffer = [];


const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const customPhrase = urlParams.get('word') || "CODROPS";

let phrase = (customPhrase.toUpperCase()).split("");
let offsets = [0.57, 0.56, 0.583, 0.59, 0.56, 0.59, 0.56];
let currentLetter = 0;
let currentAmountOfParticles = 0;
let prevAmountOfParticles = 0;
let maxAmountOfParticles = 0;

let logoImage = new Image();
let logoImageReady = Promise.create();

function createLetter() {

    if(currentLetter > phrase.length - 1) {
        currentLetter = urlParams.get('word') ? 0 : -1;
    }

    // let letter = String.fromCharCode(index);
    let letter = phrase[Math.max(currentLetter, 0)];
    let verticalOffset = offsets[Math.max(currentLetter, 0)];

    //positions for the particles
    let letterArray = [];
    var r = 0.000;

    let resultArray = new Float32Array(_amountOfParticles * 4);

    const data = getLetter(letter, pbfResolution * 0.8, pbfResolution, verticalOffset, currentLetter == -1 ? logoImage : null);

    let planeIndex = 0;

    let totalParticlesAdded = 0;
    let i = 0.43 * pbfResolution;

    if(currentLetter > -1 ) {

        while (totalParticlesAdded < _amountOfParticles) {
            
                planeIndex = 0;

                for(let j = 0; j < pbfResolution; j ++) {

                    planeIndex = 0;

                    for(let k = 0; k < pbfResolution; k ++) {

                        let index = pbfResolution - k + pbfResolution * pbfResolution - j * pbfResolution;                    
                        let mask = data[4 * index] > 10; 

                        if(mask && totalParticlesAdded < _amountOfParticles) {
                            var point = [i + Math.random() * r, j + Math.random() * r, k + Math.random() * r, planeIndex];
                            letterArray.push(point);
                            totalParticlesAdded++;
                        }

                        planeIndex ++;
                    }
                }

                i++;

        }

    } else {

        for(let j = 0; j < pbfResolution; j ++) {

            for(let i = 0; i < pbfResolution; i ++) {
    
                for(let k = 0; k < pbfResolution; k ++) {
    
                    let x = Math.abs(i - pbfResolution * 0.5);
                    let z = Math.abs(k - pbfResolution * 0.5);
                    let rr = pbfResolution * 0.5 - Math.floor(Math.sqrt(x * x + z * z));
                    let index = pbfResolution - rr + pbfResolution * pbfResolution - j * pbfResolution;
                    let mask = data[4 * index] > 10; 
    
                    if(mask && totalParticlesAdded < _amountOfParticles) {
                        var point = [k + Math.random() * r + 0. * pbfResolution, j + Math.random() * r, i + Math.random() * r, planeIndex];
                        letterArray.push(point);
                        totalParticlesAdded++;
                        planeIndex ++;
                    }
                            
                } 
    
                planeIndex = 0;
            }
        }
    }    

    function compareFn(a, b) {
        return a[3] - b[3];
    }

    letterArray = letterArray.sort(compareFn);
    letterArray = letterArray.flat(Infinity);

    currentAmountOfParticles = letterArray.length / 4;

    maxAmountOfParticles = Math.max(currentAmountOfParticles, prevAmountOfParticles);
    prevAmountOfParticles = currentAmountOfParticles;
        
    resultArray.set(letterArray, 0);
    return resultArray;
}

function generateBuffers() {

    let startLetter = createLetter();

    positionBuffer = _device.createBuffer({
        label: "position buffer",
        size: _bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    })

    _device.queue.writeBuffer(positionBuffer, 0, startLetter);

    arriveBuffer = _device.createBuffer({
        label: "next letter buffer",
        size: _bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    })

    currentLetter ++;
    let newLetter = createLetter();

    _device.queue.writeBuffer(arriveBuffer, 0, newLetter);

    positionBuffer1 = _device.createBuffer({
        label: "position buffer 1",
        size: _bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    })

    positionBuffer2 = _device.createBuffer({
        label: "position buffer 2",
        size: _bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    })

    velocityBuffer = _device.createBuffer({
        label: "velocity buffer 1",
        size: _bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    })

    indicesBuffer = _device.createBuffer(
        {
            label: "indices buffer data",
            size: Math.pow(pbfResolution, 3) * 4 * 4,//4 * 4 bytes = 4 *  32 bits single channel --> 4 channels
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        }
    )
    
    counterBuffer = _device.createBuffer(
        {
            label: "counterBuffer buffer",
            size: Math.pow(pbfResolution, 3) * 4,//4 bytes = 32 bits single channel
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        }
    )

}

async function setupPBF(resolution, amountOfParticles, texture3D, camera) {
    
    pbfResolution = resolution;
    _amountOfParticles = amountOfParticles;
    _bufferSize = amountOfParticles * 4 * 4;
    _device = Utils.device;
    texture = texture3D;
    _camera = camera;

    logoImage.addEventListener("load", _=> {
        console.log("image loaded");
        logoImageReady.resolve();
    })

    logoImage.src = "./assets/drop120.png";

    await logoImageReady;
    
    generateBuffers();

    forcesData = await Utils.setupPipeline("forces", 
                            forcesShader, 
                            new Array(80).fill(0));
                            

    displacementData = await Utils.setupPipeline("displacement", 
                            displacementShader, 
                            [pbfResolution, searchRadius, 0],
                            [positionBuffer1, positionBuffer2, indicesBuffer, "uniforms"]); 

                            
    velocityData = await Utils.setupPipeline("velocity", 
                            velocityShader, 
                            [0, pbfResolution, 0, 1]);


    forcesData.setBindGroup(
        [
            {binding: 0, resource: {buffer: arriveBuffer}},
            {binding: 1, resource: {buffer: positionBuffer1}},
            {binding: 2, resource: {buffer: velocityBuffer}},
            {binding: 3, resource: {buffer: counterBuffer}},
            {binding: 4, resource: {buffer: indicesBuffer}},
            {binding: 5, resource: {buffer: forcesData.uniformsBuffer}}

        ]
    )


    velocityData.setBindGroup(
        [
            {binding: 0, resource: {buffer: positionBuffer}},
            {binding: 1, resource: {buffer: positionBuffer2}},
            {binding: 2, resource: {buffer: velocityBuffer}},
            {binding: 3, resource: {buffer: velocityData.uniformsBuffer}},
            {binding: 4, resource: texture.createView(
                {
                    baseMipLevel: 0,
                    mipLevelCount: 1
                }
            )}
        ]
    )


    textureData = await Utils.setupPipeline("fill texture",
                                          textureFillShader,
                                          [0]);

    textureData.setBindGroup([
        {binding: 0, resource: texture.createView(
            {
                baseMipLevel: 0,
                mipLevelCount: 1
            }
        )},
        {binding: 1, resource: {buffer: textureData.uniformsBuffer}},
        ]
    )

    document.addEventListener("mousemove", updateProjection);

    return positionBuffer;

}

function updateProjection(e) {

    let _x = 2 * e.clientX / window.innerWidth - 1;
    let _y = 1 - 2 * e.clientY / window.innerHeight;
    let _vNear = vec3.fromValues(_x, _y, 0);
    let _vFar = vec3.fromValues(_x, _y, 1);
    
    let inverseCamera = mat4.create();
    let inversePerspective = mat4.create();

    mat4.invert(inverseCamera, _camera.cameraTransformMatrix);
    mat4.invert(inversePerspective, _camera.perspectiveMatrix);

    let transform = mat4.create();
    mat4.multiply(transform, inverseCamera, inversePerspective);

    vec3.transformMat4(_vNear, _vNear, transform);
    vec3.transformMat4(_vFar, _vFar, transform);

    vec3.scale(_vNear, _vNear, pbfResolution);
    vec3.scale(_vFar, _vFar, pbfResolution);

    let direction = vec3.create();
    vec3.sub(direction, _vFar, _vNear);
    vec3.normalize(direction, direction);
    
    let planeNormal = vec3.fromValues(0, 0, -1);
    let planeOrigin = vec3.fromValues(0, 0, 0.35 * pbfResolution);

    vec3.transformMat4(planeNormal, planeNormal, _camera.orientationMatrix);
    vec3.transformMat4(planeOrigin, planeOrigin, _camera.orientationMatrix);

    let t = 0;
    const denom = vec3.dot(direction, planeNormal);
    if(denom > 0.0001) {
        vec3.sub(planeOrigin, planeOrigin, _vNear);
        t = vec3.dot(planeOrigin, planeNormal) / denom;
    }

    vec3.scale(direction, direction, t);
    vec3.add(_vNear, _vNear, direction);

    mouse[0] = _vNear[0];
    mouse[1] = _vNear[1];
    mouse[2] = _vNear[2];
}

function updateFrame(acceleration = {x: 0, y: -10, z: 0}, deltaTime = 0.01, lightIntensity, separation, camera) {

    var totalFrames = TRANSITION_FRAMES;
    var animationFrame = currentFrame % totalFrames;

    const encoder = _device.createCommandEncoder({ label: 'encoder'});

    //generate the new letter
    if(animationFrame == 0 && currentFrame > 10) {
    
        currentLetter++;
        let newLetter = createLetter();
        _device.queue.writeBuffer(arriveBuffer, 0, newLetter);

        if(!camera.down) {
            camera.alpha = Math.PI * 0.5 - Math.random() * 0.1 * Math.PI;
            camera.beta = -Math.PI * 0.5 + (2 * Math.random() - 1) * Math.PI * 0.4;
        }

    }

    var relativeFrame = animationFrame / ( totalFrames);


    //Abstract compute pass generator
    function setupComputePass(pipelineData) {
        const pass = encoder.beginComputePass({
            label: pipelineData.label
        });

        pass.setPipeline(pipelineData.pipeline);
        pass.setBindGroup(0, pipelineData.bindGroup);
        pass.dispatchWorkgroups(maxAmountOfParticles / 256);
        pass.end();
    }

    // //Abstract compute pass generator
    // function setupComputeTimestampPass(pipelineData) {
    //     const pass = encoder.beginComputePass({
    //         label: pipelineData.label,
    //         timestampWrites: {
    //             querySet,
    //             beginningOfPassWriteIndex: 0, // Write timestamp in index 0 when pass begins.
    //             endOfPassWriteIndex: 1, // Write timestamp in index 1 when pass ends.
    //         }
    //     });

    //     pass.setPipeline(pipelineData.pipeline);
    //     pass.setBindGroup(0, pipelineData.bindGroup);
    //     pass.dispatchWorkgroups(currentAmountOfParticles / 256);
    //     pass.end();
    // }

    vec3.sub(mouseDirection, mouse, prevMouse);

    mouseForce[0] += (mouseDirection[0] - mouseForce[0]) * 0.1;
    mouseForce[1] += (mouseDirection[1] - mouseForce[1]) * 0.1;
    mouseForce[2] += (mouseDirection[2] - mouseForce[2]) * 0.1;

    //Sets the uniforms for the forces
    //Sets the uniforms for the forces
    for(let i = 0; i < 16; i ++) {
        forcesData.uniformsData[i] = _camera.orientationMatrix[i];
    }

    forcesData.uniformsData[16] = acceleration.x;
    forcesData.uniformsData[17] = acceleration.y;
    forcesData.uniformsData[18] = acceleration.z;
    forcesData.uniformsData[19] = deltaTime;

    forcesData.uniformsData[20] = mouse[0];
    forcesData.uniformsData[21] = mouse[1];
    forcesData.uniformsData[22] = mouse[2];
    forcesData.uniformsData[23] = pbfResolution;

    forcesData.uniformsData[24] = mouseForce[0];
    forcesData.uniformsData[25] = mouseForce[1];
    forcesData.uniformsData[26] = mouseForce[2];
    forcesData.uniformsData[27] = currentFrame;
    forcesData.uniformsData[28] = relativeFrame;
    forcesData.uniformsData[29] = currentAmountOfParticles;


    _device.queue.writeBuffer(forcesData.uniformsBuffer, 0, forcesData.uniformsData);
    currentFrame += 1;


    //Sets the uniforms for the velocity integration
    velocityData.uniformsData[0] = deltaTime;
    velocityData.uniformsData[2] = lightIntensity;
    velocityData.uniformsData[3] = relativeFrame;
    _device.queue.writeBuffer(velocityData.uniformsBuffer, 0, velocityData.uniformsData);


    //Sets the uniforms for the velocity integration
    displacementData.uniformsData[2] = separation;
    _device.queue.writeBuffer(displacementData.uniformsBuffer, 0, displacementData.uniformsData);

    //Encoder for the PBF steps

    //Pass the actual frame to the helper buffer--> source, sourceOffset, destination, destinationOffset
    encoder.copyBufferToBuffer(positionBuffer, 0, positionBuffer1, 0, _bufferSize);


    //Set the counter and indices to 0
    encoder.clearBuffer(counterBuffer);
    encoder.clearBuffer(indicesBuffer);

    textureData.uniformsData[0] = lightIntensity;
    _device.queue.writeBuffer(textureData.uniformsBuffer, 0, textureData.uniformsData);

    //Apply forces over particles
    const pass = encoder.beginComputePass({label: textureData.label});
    pass.setPipeline(textureData.pipeline);
    pass.setBindGroup(0, textureData.bindGroup);
    pass.dispatchWorkgroups(texture.width, texture.width, texture.width);
    pass.end();


    //Apply forces over particles
    setupComputePass(forcesData);


    //Calculate the iterations
    for(let i = 0; i < constrainsIterations; i ++) {

        //Calculate the displacements
        setupComputePass(displacementData);

        //Sets the two helpers with the same data
        encoder.copyBufferToBuffer(positionBuffer2, 0, positionBuffer1, 0, _bufferSize);

    }

    //Integrate the velocity
    setupComputePass(velocityData);


    //Update the position
    encoder.copyBufferToBuffer(positionBuffer1, 0, positionBuffer, 0, _bufferSize);


    //Send the data to the GPU
    const commandBuffer = encoder.finish();

    _device.queue.submit([commandBuffer]);

    return {
        animationFrame,
        relativeFrame,
        currentLetter
    };

}




export{
    setupPBF,
    updateFrame,
    positionBuffer,
    velocityBuffer,
    indicesBuffer
}
