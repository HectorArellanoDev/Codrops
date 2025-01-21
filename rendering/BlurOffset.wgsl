struct Uniforms {
  direction: vec2f
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var textureBase: texture_2d<f32>;
@group(0) @binding(2) var textureIn: texture_2d<f32>;
@group(0) @binding(3) var textureOut: texture_storage_2d<rgba8unorm, write>;


@compute @workgroup_size(16, 16) fn main(@builtin(global_invocation_id) id: vec3u) {

    var data = textureLoad(textureIn, id.xy, 0);
    
    if(length(data.rgb) == 0.) {

        var h = 0.;
        var mirror = 0.;
        for(var i : u32 = 1; i <= 40; i ++) {

            var data1 = textureLoad(textureIn, id.xy + vec2u(uniforms.direction) * i, 0);
            var data2 = textureLoad(textureIn, id.xy - vec2u(uniforms.direction) * i, 0);
            
            if((data1.r > 0. || data2.r > 0.) && (data1.g > 0. || data2.g > 0.) && i32(id.y) - i32(i) > 0) {
                h = max(data1.r, data2.r);
                mirror = 1.;
                break;
            }
        } 

        textureStore(textureOut, id.xy, vec4f(h, mirror, 0., 1.) );

    } else {

        textureStore(textureOut, id.xy, data );

    }
    

}