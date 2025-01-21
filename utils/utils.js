
import { parseBindings } from "./shaderParser";

Promise.create = function() {
    const promise = new Promise((resolve, reject) => {
        this.temp_resolve = resolve;
        this.temp_reject = reject;
    });
    promise.resolve = this.temp_resolve;
    promise.reject = this.temp_reject;
    delete this.temp_resolve;
    delete this.temp_reject;
    return promise;
};

var device = null;

let getDevice = async _ => {

    const twoGig = 2147483648;
    const requiredLimits = {};
    requiredLimits.maxStorageBufferBindingSize = twoGig;
    requiredLimits.maxBufferSize = twoGig;

    const adapter = await navigator.gpu?.requestAdapter();
    device = await adapter?.requestDevice({
            requiredFeatures: ["float32-filterable"],
            // requiredLimits
        }
    );
    if(!device) {
        console.log("error finding device");
        return null;
    }
    return device;
}


let getShader = async path => {
    try {
        let response = await fetch(path);
        let shader = await response.text();
        return shader;
    } catch(e) {
        return path;  
    }
}

let getPipeline = async (path) => {

    //let ready = Promise.create();

    const shader = await getShader(path);
    const module = device.createShaderModule({
        label: `${path} module`,
        code: shader
    })

    let groups = parseBindings(shader, GPUShaderStage.COMPUTE);
    const layoutEntries = groups.map(_layout => device.createBindGroupLayout({entries: _layout}));
    const _layout = device.createPipelineLayout({
        bindGroupLayouts: layoutEntries,
    });

    let pipeline = device.createComputePipeline(
        {
            label: `${path} pipeline`,
            layout: _layout,
            compute: {
                module: module,
                entryPoint: "main"
            }
        }
    )

    //ready.resolve();

    return {
        pipeline
    }
}

const random = (min, max) => {
    if(min === undefined) {
        min = 0; 
        max = 1;
    } else {
        if(max === undefined) {
            max = min;
            min = 0;
        }
    }

    return min + Math.random() * (max - min);
}

class PipelineData {
    constructor() {
        this.label = null;
        this.passDescriptor = null;
        this.pipeline = null;
        this.bindGroup = null;
        this.uniformsData = null;
        this.uniformsBuffer = null;
    }

    setBindGroup = entries => {
        this.bindGroup = device.createBindGroup( {
            label:`${this.label} bind group`,
            layout: this.pipeline.getBindGroupLayout(0),
            entries
        })
    }
}


async function setupRenderingPipeline(label, shaderPath, sampleCount = 1, targets, depthEnabled = true) {

    let pipelineData = new PipelineData();

    const shader = await getShader(shaderPath);
    const module = device.createShaderModule(
        {
            label: `${label} module`,
            code: shader
        }
    )

    let groups = parseBindings(shader, GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT);
    const layoutEntries = groups.map(_layout => device.createBindGroupLayout({entries: _layout}));
    const _layout = device.createPipelineLayout({
        bindGroupLayouts: layoutEntries,
    });

    let pipelineObject = {
        label: `${label} pipeline`,
        layout: _layout,
        vertex: {
            module,
            entryPoint: 'vs'
        },
        fragment: {
            module,
            entryPoint: 'fs',
            targets
        },
        primitive: {
            topology: 'triangle-list',
      
            // Backface culling since the cube is solid piece of geometry.
            // Faces pointing away from the camera will be occluded by faces
            // pointing toward the camera.
            cullMode: 'none',
          },
        multisample: {
            count: sampleCount
        }
    }

    const renderPassDescriptor = {
        label: `${label} rendering pass descriptor`,
        colorAttachments: []

    }

    if(depthEnabled) {
        pipelineObject.depthStencil = {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth32float'
        }
        renderPassDescriptor.depthStencilAttachment = {
            depthClearValue: 1.0,
            depthStoreOp: 'store'
        }
    }

    const pipeline = device.createRenderPipeline(pipelineObject);



    targets.map(_ => {
        renderPassDescriptor.colorAttachments.push(
            {
                clearValue: [0, 0, 0, 0],
                storeOp: "store"
            }
        )
    })

    pipelineData.label = label;
    pipelineData.pipeline = pipeline;
    pipelineData.passDescriptor = renderPassDescriptor;

    return pipelineData;
}


async function setupPipeline(label, 
                            shaderPath, 
                            uniforms = null,
                            bindingBuffers = null) {

    let pipelineData = new PipelineData();
    let pipelineReady = Promise.create();

    getPipeline(shaderPath).then(
        response => {
            pipelineData.pipeline = response.pipeline;
            pipelineReady.resolve();
        }
    );

    await pipelineReady;

    pipelineData.label = label;

    if(uniforms) {
        pipelineData.uniformsData = new Float32Array(uniforms);

        pipelineData.uniformsBuffer = device.createBuffer(
            {
                label:`${label} uniforms buffer`,
                size: pipelineData.uniformsData.byteLength,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            }
        )

        device.queue.writeBuffer(pipelineData.uniformsBuffer, 0, pipelineData.uniformsData);
    }


    if(bindingBuffers) {
        let entries = bindingBuffers.map( (data, index) => {return {binding: index, resource: {buffer: data == "uniforms" ? pipelineData.uniformsBuffer : data}} });

        pipelineData.bindGroup = device.createBindGroup( {
            label:`${label} bind group`,
            layout: pipelineData.pipeline.getBindGroupLayout(0),
            entries
        })
    }

    console.log(`${label} ready`);

    return pipelineData;

}

async function get(path) {

    let result;
    let ready = Promise.create();
    fetch(path).then(data => {
        data.json().then( response => {
            result = response;
            ready.resolve();
        })
    })
    
    await ready;
    return result;
}

async function loadGeometry(label, path) {

    let result = await get(path);

    let buffersData = {}
    let buffers = {};

    for(let id in result) {
        const data = new Float32Array(result[id]);
        let orderedData = data;

        if(id == "position" || id == "normal") {

            orderedData = [];
            for(let i = 0; i < data.length; i += 3) {
                orderedData.push(data[i + 0]);
                orderedData.push(data[i + 1]);
                orderedData.push(data[i + 2]);
                orderedData.push(1);
            }
            buffers.length = orderedData.length / 4;
            orderedData = new Float32Array(orderedData);
        }

        buffersData[id] = orderedData;

    }

    //Encode the UV into the position and normal

    let posIndex = 0;
    for(let i = 0; i < buffersData.uv.length; i += 2) {
        buffersData.position[posIndex + 3] = buffersData.uv[i + 0];
        buffersData.normal[posIndex + 3] = buffersData.uv[i + 1];
        posIndex += 4;
    }

    let ids = {position: "", normal: ""}

    for(let id in ids) {

        buffers[id] = device.createBuffer({
            label: `${label} ${id} buffer`,
            size: buffersData[id].byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });
    
        device.queue.writeBuffer(buffers[id], 0, buffersData[id]);
    }

    return buffers;
}

async function readBuffer(device, buffer) {
    const size = buffer.size;
    const gpuReadBuffer = device.createBuffer({size, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const copyEncoder = device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(buffer, 0, gpuReadBuffer, 0, size);
    const copyCommands = copyEncoder.finish();
    device.queue.submit([copyCommands]);
    await gpuReadBuffer.mapAsync(GPUMapMode.READ);
    return gpuReadBuffer.getMappedRange();
  }

export {
    getDevice,
    device,
    getShader,
    random,
    getPipeline,
    setupPipeline,
    setupRenderingPipeline,
    loadGeometry,
    readBuffer
}
