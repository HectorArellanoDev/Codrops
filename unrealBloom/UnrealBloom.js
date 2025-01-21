import * as Utils from "../utils/utils.js";

import luminosityShader from "../unrealBloom/UnrealBloomLuminosity.wgsl?raw";
import gaussianBlurShader from "../unrealBloom/UnrealBloomGaussian.wgsl?raw";
import bloomCompositeShader from "../unrealBloom/UnrealBloomComposite.wgsl?raw";

var _renderTargetsHorizontal = [];
var _renderTargetsVertical = [];
var _nMips = 3;
var _kernelSizeArray = [3, 5, 7, 9, 11];
var _bloomFactors = [1.0, 0.8, 0.6, 0.4, 0.2];

var resolution;

var device;

var luminosityData, blurData, compositeData;

var luminosityBuffer, compositeBuffer;
var luminosityUniforms, compositeUniforms;

var luminosityBindings, blurBindings, compositeBindings;

var ready = false;

var blurBuffers = null;

async function initShaders() {

    luminosityUniforms = new Float32Array(8);
    luminosityBuffer = device.createBuffer({
        label: "luminosity buffer",
        size: luminosityUniforms.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })


    luminosityData = await Utils.setupPipeline("luminosity", 
                                                luminosityShader,
                                                );

                                                    
    blurData = await Utils.setupPipeline("gaussian blur", 
                                        gaussianBlurShader,
                                        );                                                    


    compositeUniforms = new Float32Array(8);
    compositeBuffer = device.createBuffer({
        label: "blur buffer",
        size: luminosityUniforms.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    compositeData = await Utils.setupPipeline("gaussian blur", 
                                             bloomCompositeShader
                                            ); 
}

async function setup(width, height, inputTexture, outputTexture, sampler) {

    device = Utils.device;
    resolution = {x: width, y: height};

    if(!ready) {
        await initShaders();

        if(blurBuffers == null) {

            blurBuffers = [];
    
            //Generate the uniforms for the blur
            for(let i = 0; i < _nMips; i ++) {
                
                let blurBufferX = device.createBuffer({
                    size: 32,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                })
    
                let blurBufferY = device.createBuffer({
                    size: 32,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                })
    
                blurBuffers.push([blurBufferX, blurBufferY]);
    
            }
    
        }
        
        ready = true;
    }


    if(_renderTargetsHorizontal[0] != null) {
        _renderTargetsHorizontal.map(text => text.destroy());
        _renderTargetsVertical.map(text => text.destroy());
    }

    let resx = Math.round(resolution.x / 2);
    let resy = Math.round(resolution.y / 2);

    for (let i = 0; i < _nMips; i++) {

        let renderTargetHorizonal = device.createTexture({
            label: `mip horizontal ${i}`,
            size: [resx, resy],
            format: 'rgba8unorm',
            dimension: '2d',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING
        })

        _renderTargetsHorizontal[i] = renderTargetHorizonal;

        let renderTargetVertical = device.createTexture({
            label: `mip vertical ${i}`,
            size: [resx, resy],
            format: 'rgba8unorm',
            dimension: '2d',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING
        })

        _renderTargetsVertical[i] = renderTargetVertical;

        resx = Math.round(resx / 2);
        resy = Math.round(resy / 2);
    }


    luminosityBindings = device.createBindGroup({
        label: "luminosity bind group",
        layout: luminosityData.pipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: {buffer: luminosityBuffer}},
            {binding: 1, resource: inputTexture.createView()},
            {binding: 2, resource: sampler},
            {binding: 3, resource: outputTexture.createView()},
        ]
    })


    resx = Math.round(resolution.x / 2);
    resy = Math.round(resolution.y / 2);

    blurBindings = [];
    var inputBlurTexture = outputTexture;

    for(let i = 0; i < _nMips; i ++) {

        let bindingUniforms = new Float32Array([resx, resy, 1, 0, _kernelSizeArray[i], 0, 0, 0]);
        device.queue.writeBuffer(blurBuffers[i][0], 0, bindingUniforms);

        bindingUniforms = new Float32Array([resx, resy, 0, 1, _kernelSizeArray[i], 0, 0, 0]);
        device.queue.writeBuffer(blurBuffers[i][1], 0, bindingUniforms);

        let bindingX = device.createBindGroup({
            layout: blurData.pipeline.getBindGroupLayout(0),
            entries: [
                {binding: 0, resource: {buffer: blurBuffers[i][0]}},
                {binding: 1, resource: inputBlurTexture.createView() },
                {binding: 2, resource: sampler},
                {binding: 3, resource: _renderTargetsVertical[i].createView()}
            ]
        })

        let bindingY = device.createBindGroup({
            layout: blurData.pipeline.getBindGroupLayout(0),
            entries: [
                {binding: 0, resource: {buffer: blurBuffers[i][1]}},
                {binding: 1, resource: _renderTargetsVertical[i].createView() },
                {binding: 2, resource: sampler},
                {binding: 3, resource: _renderTargetsHorizontal[i].createView()}
            ]
        })

        inputBlurTexture = _renderTargetsHorizontal[i];
        blurBindings.push([bindingX, bindingY]);

        resx = Math.round(resx / 2);
        resy = Math.round(resy / 2);

    }

    compositeBindings = device.createBindGroup({
        label: "bind group for composite",
        layout: compositeData.pipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: {buffer: compositeBuffer}},
            {binding: 1, resource: sampler},
            {binding: 2, resource: _renderTargetsHorizontal[0].createView() },
            {binding: 3, resource: _renderTargetsHorizontal[1].createView() },
            {binding: 4, resource: _renderTargetsHorizontal[2].createView() },
            {binding: 5, resource: inputTexture.createView() },
            {binding: 6, resource: outputTexture.createView() }

        ]
    })
}



function applyBloom(encoder) {

        if(!ready) return;

        //luminosity color
        luminosityUniforms[0] = 0;
        luminosityUniforms[1] = 0;
        luminosityUniforms[2] = 0;

        //luminosity opacity
        luminosityUniforms[3] = 1;

        //Luminosity threshold
        luminosityUniforms[4] = 0.799;

        //smoothWidth
        luminosityUniforms[5] = 1.;

        device.queue.writeBuffer(luminosityBuffer, 0, luminosityUniforms);
    
        const pass = encoder.beginComputePass(luminosityData.passDescriptor);
        pass.setPipeline(luminosityData.pipeline);
        pass.setBindGroup(0, luminosityBindings);
        pass.dispatchWorkgroups(window.innerWidth, window.innerHeight);
        pass.end();



        //Make the different blur passes
        let resx = Math.round(resolution.x / 2);
        let resy = Math.round(resolution.y / 2);

        const blurPass = encoder.beginComputePass(blurData.passDescriptor);
        blurPass.setPipeline(blurData.pipeline);

        for(let i = 0; i < blurBindings.length; i ++) {
            
            for(let j = 0; j < 2; j ++) {

                blurPass.setBindGroup(0, blurBindings[i][j]);
                blurPass.dispatchWorkgroups(resx, resy);

            }

            resx = Math.round(resx / 2);
            resy = Math.round(resy / 2);
        }

        blurPass.end();


        //Color for the composite
        compositeUniforms[0] = 1.;
        compositeUniforms[1] = 1.;
        compositeUniforms[2] = 1.;

        //Bloom stregth
        compositeUniforms[3] = 1.8;
        
        //Bloom radius
        compositeUniforms[4] = .1;

        device.queue.writeBuffer(compositeBuffer, 0, compositeUniforms);

        //Dispatch the composite pass
        const compositePass = encoder.beginComputePass(compositeData.passDescriptor);
        compositePass.setPipeline(compositeData.pipeline);
        compositePass.setBindGroup(0, compositeBindings);
        compositePass.dispatchWorkgroups(window.innerWidth, window.innerHeight);
        compositePass.end();

}

export {
    setup,
    applyBloom
}