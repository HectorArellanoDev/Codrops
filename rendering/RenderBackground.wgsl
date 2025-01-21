struct Uniforms {
    inColor: vec3f,
    currentFrame: f32,
    outColor: vec3f
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

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

struct FragmentOutput {
    @location(0) color1: vec4f,
    @location(1) color2: vec4f
}

fn lowerBound(t: f32) -> f32 {

  var amp = 1.;
  var freq = t;
  var output = 0.;

  for(var i = 0; i < 2; i ++) {
    output += amp * cos(freq);
    freq *= 2.;
    amp /= 2.;
  }

  return output;

}

@fragment fn fs(input: VertexOutput) -> FragmentOutput {

    var uv = vec2f(input.uv.x, input.uv.y);

    var transition = uniforms.currentFrame * 2.;
    transition = pow(min(max(0., transition - 0.6), 1.), 2.);
    var bars = 10.;
    var _x = (floor(bars * pow(uv.x, .8) )) % bars;

    var color = mix(uniforms.inColor, uniforms.outColor, vec3f(transition));
    
    
    color += vec3(.4) * clamp(1. - length(uv - 0.5), 0., 1.);

    var output: FragmentOutput;
    output.color1 = vec4f(color, 1.);
    output.color2 = vec4f(0.);

    return output;

}



