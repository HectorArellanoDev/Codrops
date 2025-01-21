
struct Uniforms {
    axis: vec3f,
    steps: f32
}

@group(0) @binding(0) var textureRead: texture_3d<f32>;
@group(0) @binding(1) var textureSave: texture_storage_3d<rgba32float, write>;
@group(0) @binding(2) var<uniform> uniforms: Uniforms;


@compute @workgroup_size(1) fn main( @builtin(global_invocation_id) ud: vec3<u32> ) {
    

    var tSize = vec3f(textureDimensions(textureRead));
    var id = ud + vec3u( u32(tSize.x * 0.2), 0, 0);


    var blend = vec4f(0.);
    var blend2 = vec4f(0.);
    var sum = 1.;
    var sum2 = 0.;
    var m = 1.;
    var n = uniforms.steps;
    for(var i = 0.; i < uniforms.steps; i += 1.) {
        var j = i - 0.5 * uniforms.steps;
        var tRead = textureLoad(textureRead, vec3<i32>(id) + vec3<i32>(j * uniforms.axis), 0);
        blend += m * tRead;
        blend2 += tRead;
        m *= (n - i) / (i + 1.);
        sum += m;
        sum2 += 1.;
    }    

    blend /= sum;
    blend2 /= sum2;

    var mixer = 1.;
    blend = mixer * blend + (1. - mixer) * blend2;
    
    textureStore(textureSave, id, blend );

}

