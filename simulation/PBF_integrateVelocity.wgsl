struct Uniforms {
    deltaTime: f32,
    textureSize: f32,
    scatter: f32,
    dampening: f32
}

const EPSILON: f32 = 0.001;
 

@group(0) @binding(0) var<storage, read>  positionBufferOLD: array<vec4f>;
@group(0) @binding(1) var<storage, read>  positionBufferUPDATED: array<vec4f>;
@group(0) @binding(2) var<storage, read_write>  velocityBuffer: array<vec4f>;
@group(0) @binding(3) var<uniform>  uniforms: Uniforms;
@group(0) @binding(4) var texture3D: texture_storage_3d<rgba32float, write>;


@compute @workgroup_size(256) fn main( @builtin(global_invocation_id) id: vec3<u32> ) {

    let index1D = id.x;

    var velocity = positionBufferUPDATED[index1D].rgb - positionBufferOLD[index1D].rgb;
    velocity /= (max(uniforms.deltaTime, EPSILON));
    var speed = length(velocity);
    if(speed > 0.) {
        speed = min(40., speed);
        velocity = speed  * normalize(velocity);
    }

    var dampening = 3. * uniforms.dampening;
    if(dampening > 2.) {
        velocity *= 1. - 0.8 * fract(dampening);
    }

    

    velocityBuffer[index1D] = vec4f(velocity, 1.);
      
    //Filling the information of the texture3D
    var tSize = f32(textureDimensions(texture3D).x);
    var normalizedPosition = positionBufferUPDATED[index1D].rgb / uniforms.textureSize;
    normalizedPosition *= tSize;

    let size: u32 = 2;
    for(var i: u32 = 0; i < size; i ++) {
        for(var j: u32 = 0; j < size; j ++) {
            for(var k: u32 = 0; k < size; k ++) {
                textureStore(texture3D, vec3<u32>(floor(normalizedPosition)) + vec3u(i, j , k), vec4f(1., velocity) );
            }
        }
    }
    
}