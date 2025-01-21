
struct Uniforms {
    defaultColor: vec3f,
    defaultOpacity: f32,
    luminosityThreshold: f32,
    smoothWidth: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var tDiffuse: texture_2d<f32>;
@group(0) @binding(2) var textureSampler: sampler;
@group(0) @binding(3) var outputTexture: texture_storage_2d<rgba8unorm, write>;

fn luma(color: vec3f) -> f32 {
    return dot(color, vec3f(0.299, 0.587, 0.114));
}

@compute @workgroup_size(1, 1) fn main(@builtin(global_invocation_id) id: vec3u) {

    var textDim = textureDimensions(tDiffuse).xy;
    var st = vec2f(id.xy) / vec2f(textDim);
    var texel = textureSampleLevel(tDiffuse, textureSampler, st, 0);
    var v = luma(texel.xyz);
    var outputColor = vec4f(uniforms.defaultColor, uniforms.defaultOpacity);
    var alpha = smoothstep(uniforms.luminosityThreshold, uniforms.luminosityThreshold + uniforms.smoothWidth, v);
    
    textureStore(outputTexture, id.xy, mix(outputColor, texel, vec4f(alpha)));
    
}



