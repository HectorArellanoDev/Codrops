import * as Utils from "../utils/utils.js";

import blur3DShader from "../blur3D/Blur3D.wgsl?raw";

let started = false;
let pipeline;
let uniformsForBindings = [];

const gerenteUniforms = device => {

    let axis = [[1, 0, 0, 1], [0, 0, 1, 1], [0, 1, 0, 1]];

    for(let i = 0; i < 3; i ++) {

        let uniforms = new Float32Array(axis[i]);
        let uniformsBuffer = device.createBuffer(
            {
                label: "uniforms buffer",
          
                size: uniforms.byteLength,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            }
        )

        device.queue.writeBuffer(uniformsBuffer, 0, uniforms);
        uniformsForBindings.push(uniformsBuffer);
    }
}

async function calculateBlur3D(texture, textureOut, steps) {

    let device = Utils.device;

    if(!started) {

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

        gerenteUniforms(device);
    
        let pipelineReady = Promise.create();

        Utils.getPipeline(blur3DShader).then(
            response => {
                pipeline = response.pipeline;
                pipelineReady.resolve();
            }
        );
    
        await pipelineReady;

        started = true;
    }

    let ss = steps * 2;
    let axis = [[1, 0, 0, ss], [0, 0, 1, ss], [0, 1, 0, ss]];

    for(let i = 0; i < 3; i ++) {
        let uniforms = new Float32Array(axis[i]);
        device.queue.writeBuffer(uniformsForBindings[i], 0, uniforms);
    }

    //make a command enconder to start encoding thigns
    const encoder = device.createCommandEncoder({ label: 'encoder'});


    //Run the simulation
    const computePass = encoder.beginComputePass({
        label: "blur3D pass",
        // timestampWrites: {
        //     querySet,
        //     beginningOfPassWriteIndex: 0, // Write timestamp in index 0 when pass begins.
        //     endOfPassWriteIndex: 1, // Write timestamp in index 1 when pass ends.
        // }
    })

    computePass.setPipeline(pipeline);
    let size = texture.width;

    let texIn, texOut;

    for(let i = 0; i < 3; i ++) {

        //Weird enough... but it is what it is... ping pong on
        //textures.
        let even = i % 2 == 0;
        texIn = even ? texture : textureOut;
        texOut = even ? textureOut : texture;

        const bindGroup = device.createBindGroup( {
            label: "bind group for blur3D",
            layout: pipeline.getBindGroupLayout(0),
            entries:[
                {binding: 0, resource: texIn.createView(
                    {
                        baseMipLevel: 0,
                        mipLevelCount: 1
                    }
                )},
                {binding: 1, resource: texOut.createView(
                    {
                        baseMipLevel: 0,
                        mipLevelCount: 1
                    }
                )},   
                {binding: 2, resource: {buffer: uniformsForBindings[i]}} 
            ]
        })

        computePass.setBindGroup(0, bindGroup);
        computePass.dispatchWorkgroups(size * 0.6, size, size);

    }

    computePass.end();

    // encoder.resolveQuerySet(
    //     querySet, 
    //     0,// index of first query to resolve 
    //     capacity,//number of queries to resolve
    //     queryBuffer, 
    //     0);// destination offset

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    // const arrayBuffer = await Utils.readBuffer(device, queryBuffer);
    // Decode it into an array of timestamps in nanoseconds
    // const timingsNanoseconds = new BigInt64Array(arrayBuffer);
    // let timing = timingsNanoseconds[1] - timingsNanoseconds[0];
    // console.log("potential time: " + Math.ceil(Number(timing) / 1000000));

}

export {calculateBlur3D}