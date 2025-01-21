struct Uniforms {
    bloomTintColor: vec3f,
    bloomStrength: f32,
    bloomRadius: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var textureSampler: sampler;

//Depends on the NMips...
@group(0) @binding(2) var blurTexture1: texture_2d<f32>;
@group(0) @binding(3) var blurTexture2: texture_2d<f32>;
@group(0) @binding(4) var blurTexture3: texture_2d<f32>;

@group(0) @binding(5) var inputTexture: texture_2d<f32>;
@group(0) @binding(6) var outputTexture: texture_storage_2d<rgba8unorm, write>;


fn lerpBloomFactor(factor: f32) -> f32 {
    var mirrorFactor = 1.2 - factor;
    return mix(factor, mirrorFactor, uniforms.bloomRadius);
}

@compute @workgroup_size(1, 1) fn main(@builtin(global_invocation_id) id: vec3u) {

    var textDim = textureDimensions(outputTexture).xy;
    var uv = vec2f(id.xy) / vec2f(textDim);
    var color = vec4f(0.); 

    color += vec4f(uniforms.bloomTintColor, 1.) * lerpBloomFactor(1.0) * uniforms.bloomStrength * textureSampleLevel(blurTexture1, textureSampler, uv, 0);
    color += vec4f(uniforms.bloomTintColor, 1.) * lerpBloomFactor(0.8) * uniforms.bloomStrength * textureSampleLevel(blurTexture2, textureSampler, uv, 0);
    color += vec4f(uniforms.bloomTintColor, 1.) * lerpBloomFactor(0.6) * uniforms.bloomStrength * textureSampleLevel(blurTexture3, textureSampler, uv, 0);
    color = max(color, vec4f(0.));
    color += textureSampleLevel(inputTexture, textureSampler, uv, 0);

    textureStore(outputTexture, id.xy, color );
    
}



