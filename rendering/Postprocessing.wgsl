struct Uniforms {
  direction: vec2f,
  deltaTime: f32,
  motionBlur: f32
}

@group(0) @binding(0) var texture: texture_2d<f32>;
@group(0) @binding(1) var textureVel: texture_2d<f32>;
@group(0) @binding(2) var textureSampler: sampler;
@group(0) @binding(3) var<uniform> uniforms: Uniforms;
@group(0) @binding(4) var outputTexture: texture_storage_2d<rgba8unorm, write>;


@compute @workgroup_size(16, 16) fn main(@builtin(global_invocation_id) id: vec3u) {

    var dimensions = textureDimensions(texture).xy;
    var tSize = vec2f(f32(dimensions.x), f32(dimensions.y));
    var uv = vec2f(id.xy) / tSize;

    var data = textureSampleLevel(textureVel, textureSampler, uv, 0);
    var color = vec4(0.);
    var color2 = vec4(0.);
    var sum = 1.;
    var sum2 = 0.;
    var m = 1.;
    var n = 2. + data.g * min(floor(200. * data.r), 100.);
    var steps = i32(n);
    
    for(var i = 0; i <= steps; i ++) {
        var k = f32(i);
        var j = k - 0.5 * f32(steps);
        var tRead = textureSampleLevel(texture, textureSampler, uv + uniforms.direction * j / tSize, 0);
        color += m * tRead;
        color2 += tRead;
        m *= (n - k) / (k + 1.);
        sum += m;
        sum2 += 1.;
    } 

    color /= sum;
    color2 /= sum2;

    var mixer = select(.1, 0.5, data.g > 0.);
    color = mixer * color + (1. - mixer) * color2;

    textureStore(outputTexture, id.xy, color );
}