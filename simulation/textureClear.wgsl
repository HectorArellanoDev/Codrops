

struct Uniforms {
    lightIntensity: f32
}

@group(0) @binding(0) var texture3D: texture_storage_3d<rgba32float, write>;
@group(0) @binding(1) var<uniform>  uniforms: Uniforms;


@compute @workgroup_size(1, 1, 1) fn main( @builtin(global_invocation_id) id: vec3<u32> ) {

    textureStore(texture3D, id, vec4f(0.));

}

