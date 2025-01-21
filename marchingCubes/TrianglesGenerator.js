import * as Utils from "../utils/utils.js";
import  {ti5, trianglesOnVoxels}    from './marchingCubesTables.js';

import marchCaseShader from "./MarchCase.wgsl?raw";
import checkPyramidShader from "./EncodeBuffer.wgsl?raw";
import trianglesShader from "./GenerateTriangles.wgsl?raw";


let marchCasePipeline, marchCaseBindGroup;
let checkPipeline, checkBindGroup;
let parsePipeline, parseBindGroup;
let textureSize;
let amountOfTriangles, amountOfTrianglesBuffer;
let indicesArray, indicesBuffer;

let marchCaseReady = Promise.create();
let checkReady = Promise.create();
let parseReady = Promise.create();

let texture, 
texture_vct,
verticesBuffer, 
normalBuffer,
velocityBuffer, 
checkBuffer;

let testBuffer1, testBuffer2;

let uniforms, uniformsBuffer;

let device;


async function setupMarchingCubes(  vertexMemory,
                                    _texture, 
                                    _texture_vct) {
                                        

        device = Utils.device;

        texture = _texture;
        texture_vct = _texture_vct;

        const TOTAL_VOXELS = Math.pow(texture.width, 3);
        
        verticesBuffer = device.createBuffer(
            {
                label: "vertices buffer",
                size: 4 * vertexMemory,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
            }
        )
        
        normalBuffer = device.createBuffer(
            {
                label: "normals buffer",
                size: 4 * vertexMemory,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
            }
        )

        velocityBuffer = device.createBuffer(
            {
                label: "velocity buffer",
                size: 4 * vertexMemory,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
            }
        )
                
        checkBuffer = device.createBuffer(
            {
                label: "check buffer",
                size: 4 * 7,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.INDIRECT
            }
        )

        testBuffer1 = device.createBuffer(
            {
                label: "test buffer",
                size: 4 * vertexMemory,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
            }
        )
                
        testBuffer2 = device.createBuffer(
            {
                label: "test 2 buffer",
                size: 4 * 7,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.INDIRECT
            }
        )
        
        //Amount of triangles for each voxel
        amountOfTriangles = [];
        for(let i = 0; i < trianglesOnVoxels.length; i++) {
            let u = trianglesOnVoxels[i].length / 3;
            amountOfTriangles.push(u);
        }
        amountOfTriangles = new Float32Array(amountOfTriangles);
        amountOfTrianglesBuffer = device.createBuffer(
            {
                label: "uniforms buffer",
                size: amountOfTriangles.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
            }
        )
        device.queue.writeBuffer(amountOfTrianglesBuffer, 0, amountOfTriangles);

        //Indices for the triangles
        indicesArray = new Float32Array(ti5);
        indicesBuffer = device.createBuffer(
            {
                label: "indices buffer",
                size: indicesArray.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
            }
        )
        device.queue.writeBuffer(indicesBuffer, 0, indicesArray);


        textureSize = Math.ceil(Math.sqrt(Math.pow(texture.width, 3)));
        let power = Math.ceil(Math.log2(textureSize));
        textureSize = Math.pow(2, power);
        power += 1;


        Utils.getPipeline(marchCaseShader).then( response => {
            marchCasePipeline = response.pipeline;
            marchCaseReady.resolve();
        });

        Utils.getPipeline(checkPyramidShader).then( response => {
            checkPipeline = response.pipeline;
            checkReady.resolve();
        });

        Utils.getPipeline(trianglesShader).then( response => {
            parsePipeline = response.pipeline;
            parseReady.resolve();
        })

        await marchCaseReady;
        await checkReady;
        await parseReady;


        uniforms = new Float32Array([texture.width, textureSize, power, 0.5]);
        
        uniformsBuffer = device.createBuffer(
            {
                label: "uniforms buffer",
                size: uniforms.byteLength,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            }
        )

        device.queue.writeBuffer(uniformsBuffer, 0, uniforms);

        marchCaseBindGroup = device.createBindGroup({
            label: "bind group for march case",
            layout: marchCasePipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0, resource: {buffer: uniformsBuffer}
                },
                {
                    binding: 1, resource: texture.createView({
                        baseMipLevel: 0,
                        mipLevelCount: 1
                    }
                )},
                {
                    binding: 2, resource: {buffer: amountOfTrianglesBuffer}
                },
                {
                    binding: 3, resource: texture_vct.createView({
                        baseMipLevel: 0,
                        mipLevelCount: 1
                    })
                },
                {
                    binding: 4, resource: {buffer: testBuffer1}
                },
                {
                    binding: 5, resource: {buffer: testBuffer2}
                },
            ]
        })


        checkBindGroup = device.createBindGroup({
            label: "bind group for check case",
            layout: checkPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {buffer: testBuffer2}
                },
                {
                    binding: 1,
                    resource: {buffer: checkBuffer}
                }
            ]
         })


        parseBindGroup = device.createBindGroup({
            label: "bind group for pyramid parsing",
            layout: parsePipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {buffer: uniformsBuffer}
                },
                {
                    binding: 1,
                    resource: {buffer: testBuffer1}
                },
                {
                    binding: 2,
                    resource: {buffer: indicesBuffer}
                },
                {
                    binding: 3,
                    resource: texture.createView({
                        baseMipLevel: 0,
                        mipLevelCount: 1
                    })
                },
                {
                    binding: 4,
                    resource: {buffer: verticesBuffer}
                },
                {
                    binding: 5,
                    resource: {buffer: normalBuffer}
                },
                {
                    binding: 6,
                    resource: {buffer: velocityBuffer}
                }
            ]
        })
    
        return [
            verticesBuffer, 
            normalBuffer, 
            velocityBuffer,
            checkBuffer
        ]
}

function generateTriangles(range) {

    uniforms[3] = range;
    device.queue.writeBuffer(uniformsBuffer, 0, uniforms);

    //make a command enconder to start encoding thigns
    const encoder = device.createCommandEncoder({ label: 'encoder'});

    //Clear the corresponding buffers
    encoder.clearBuffer(verticesBuffer, 0, verticesBuffer.size);
    encoder.clearBuffer(normalBuffer, 0, normalBuffer.size);
    encoder.clearBuffer(testBuffer1, 0, testBuffer1.size);
    encoder.clearBuffer(testBuffer2, 0, testBuffer2.size);


    //Check which voxels require to generate triangles
    let size = texture.width;
    const marchPass = encoder.beginComputePass({ label: "march case pass" })
    marchPass.setPipeline(marchCasePipeline);
    marchPass.setBindGroup(0, marchCaseBindGroup);
    marchPass.dispatchWorkgroups(size * 0.4, size, size);
    marchPass.end();


    //Pass the sum from the pyramid to the buffer for further read
    const checkPass = encoder.beginComputePass({
        label: "check pass"
    })
    checkPass.setPipeline(checkPipeline);
    checkPass.setBindGroup(0, checkBindGroup);
    checkPass.dispatchWorkgroups(1);
    checkPass.end();
    
    //Pass used to generate the triangles
    const parsePass = encoder.beginComputePass({
        label: "parse pass"
    })
    parsePass.setPipeline(parsePipeline);
    parsePass.setBindGroup(0, parseBindGroup);
    parsePass.dispatchWorkgroupsIndirect(checkBuffer, 0 * 4);
    parsePass.end();


    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    // let totalVoxels =  await Utils.readBuffer(device, lowGridBuffer);
    // totalVoxels = new Int32Array(totalVoxels);
    // console.log(totalVoxels);

    // let voxels = await Utils.readBuffer(device, verticesBuffer);



    // let dataArray = [];
    // let voxelsData = new Float32Array(voxels);
    // console.log(voxelsData);
    // for(let i = 0; i < vertexMemory; i ++)  dataArray.push(voxelsData[i]);
    // console.log("the data is: " + totalVoxels, dataArray.filter(el => el == 1).length, totalTriangles, totalTriangles < 65000);

}

export {setupMarchingCubes,
        generateTriangles}