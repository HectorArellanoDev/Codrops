
@group(0) @binding(0) var textureRead: texture_3d<f32>;
@group(0) @binding(1) var textureSave: texture_storage_3d<rgba32float, write>;

@compute @workgroup_size(1) fn main( @builtin(global_invocation_id) id: vec3<u32> ) {

    var result = vec4f(0., 0., 0., 0.);
    
    for(var i = 0; i < 2; i ++) {
        for(var j = 0; j < 2; j ++) {
            for(var k = 0; k < 2; k ++) {
                result += textureLoad(textureRead, 2 * vec3<i32>(id) + vec3<i32>(i, j, k), 0);
            }
        }
    }

    result.x /= 8.;
    result.y /= 8.;
    result.z /= 8.;
    result.w /= 8.;
    
    let tSize = f32(textureDimensions(textureSave).x);
    textureStore(textureSave, id, result );

}

