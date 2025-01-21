
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f
};

struct Uniforms {
    resolution: vec2f,
    relativeFrame: f32,
    animationFrame: f32,

    currentLetter: f32,
    brightness: f32,
    contrast: f32,
    gamma: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var inputTexture: texture_2d<f32>;
@group(0) @binding(2) var textureSampler: sampler;
@group(0) @binding(3) var logoTexture: texture_2d<f32>;


@vertex fn vs( @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {

  let pos = array(
    // 1st triangle
    vec2f( -1,  1),  // center
    vec2f( 1,  -1),  // right, center
    vec2f( -1,  -1),  // center, top
 
    // 2st triangle
      // center, top
    vec2f( -1,  1),
    vec2f( 1,  1),  // right, center
    vec2f( 1, -1)  // right, top
  );

  var output: VertexOutput;
  output.position = vec4(pos[vertexIndex], 0., 1.);
  output.uv = 0.5 * pos[vertexIndex] + 0.5;
  return output;
}

@fragment fn fs(input: VertexOutput) -> @location(0) vec4f {

    var uv = vec2f(input.uv.x, 1. - input.uv.y);
    var tDim = vec2f(textureDimensions(logoTexture));
    var tAspectRatio = tDim.y / tDim.x;

    var st = 2. * uv - 1.;
    st *= 10. * vec2f(tAspectRatio * uniforms.resolution.x / uniforms.resolution.y, 1.);
    st = 0.5 * st + 0.5;

    var logo = textureSampleLevel(logoTexture, textureSampler, st, 0.);
    var colorLogo = vec4(logo.a);

    //Apply the gamma correction, brightness and contrast
    var color = textureSampleLevel(inputTexture, textureSampler, uv, 0);

    //brightness
    color = color + vec4f(uniforms.brightness);

    //contrast
    var t = (1. - uniforms.contrast) / 2.; 
    color = color * uniforms.contrast + vec4(t);

    //gamma
    color = pow(color, vec4(uniforms.gamma));

    color = vec4f(color.rgb, 1.);

    // var transition = 2.5 * uniforms.relativeFrame;
    // transition = pow(min(max(0., transition - 1.), 1.), 2.);

    // if(uniforms.currentLetter == -2.) {

    //     var transition2 = pow(min(max(0., transition + 0.1), 1.), 2.);

    //     colorLogo = select(colorLogo, vec4(0.), uv.x > transition2);

    //     color = select(colorLogo, color, uv.y > transition);

    // }

    // if(uniforms.currentLetter == -1.) {
    //     color = select(color, colorLogo, uv.y > transition);
    // }
    
    return color;


}



