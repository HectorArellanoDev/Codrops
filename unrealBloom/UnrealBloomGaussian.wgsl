
struct Uniforms {
    textSize: vec2f,
    direction: vec2f,
    sigma: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var colorTexture: texture_2d<f32>;
@group(0) @binding(2) var textureSampler: sampler;
@group(0) @binding(3) var outputTexture: texture_storage_2d<rgba8unorm, write>;


fn gaussianPdf(x: f32, sigma: f32) -> f32{
    return 0.39894 * exp(-0.5 * x * x / (sigma * sigma)) / sigma;
}

@compute @workgroup_size(1, 1) fn main(@builtin(global_invocation_id) id: vec3u) {

    var st = vec2f(id.xy) / uniforms.textSize;

    var invSize = 1.0 / uniforms.textSize;
    var fSigma = uniforms.sigma;
    var weightSum = gaussianPdf(0.0, fSigma);
    var  diffuseSum = textureSampleLevel( colorTexture, textureSampler, st, 0).rgb * weightSum;
    
    for(var i = 1; i < i32(uniforms.sigma); i ++) {
        var x = f32(i);
        var w = gaussianPdf(x, fSigma);
        var uvOffset = uniforms.direction * invSize * x;
        var sample1 = textureSampleLevel( colorTexture, textureSampler, st + uvOffset, 0).rgb;
        var sample2 = textureSampleLevel( colorTexture, textureSampler, st - uvOffset, 0).rgb;
        diffuseSum += (sample1 + sample2) * w;
        weightSum += 2.0 * w;
    }

    textureStore(outputTexture, id.xy, vec4f(diffuseSum / weightSum, 1.0) );
    
}
