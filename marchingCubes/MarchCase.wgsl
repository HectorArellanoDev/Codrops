struct Uniforms {
    texture3DSize: f32,
    texture2DSize: f32,
    mipmapLevels: f32,
    range: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var textureRead: texture_3d<f32>;
@group(0) @binding(2) var<storage, read> amountOfTriangles: array<f32>;
@group(0) @binding(3) var texture_vct: texture_storage_3d<rgba32float, write>;

@group(0) @binding(4) var<storage, read_write> voxelsEnabled:array <vec4f>;
@group(0) @binding(5) var<storage, read_write> voxelsIndex: array<atomic<i32>>;


const HIGH_TO_LOW = 4;

@compute @workgroup_size(1) fn main(@builtin(global_invocation_id) ud: vec3<u32>) {

    var tSize = vec3f(textureDimensions(textureRead));
    var id = ud + vec3u( u32(tSize.x * 0.3), 0, 0);

    var range = uniforms.range;
    var center = textureLoad(textureRead, id + vec3u(0, 0, 0), 0).r;
    var c = step(center, range);
    var vct = c;
    c += 2. * step(textureLoad(textureRead, id + vec3u(1, 0, 0), 0).r, range);
    c += 4. * step(textureLoad(textureRead, id + vec3u(1, 1, 0), 0).r, range);
    c += 8. * step(textureLoad(textureRead, id + vec3u(0, 1, 0), 0).r, range);
    c += 16. * step(textureLoad(textureRead, id + vec3u(0, 0, 1), 0).r, range);
    c += 32. * step(textureLoad(textureRead, id + vec3u(1, 0, 1), 0).r, range);
    c += 64. * step(textureLoad(textureRead, id + vec3u(1, 1, 1), 0).r, range);
    c += 128. * step(textureLoad(textureRead, id + vec3u(0, 1, 1), 0).r, range);
    c *= step(c, 254.);
    var totalTriangles = amountOfTriangles[i32(c)];
    var value = f32(totalTriangles > 0.);

    //For the voxel cone tracing
    textureStore(texture_vct, id, vec4f(vec3(0., 0., 0.), value));

    if(id.y < 3) {
        textureStore(texture_vct, id, vec4f(vec3f(.0), .5));
    }

    //To group the voxels together
    if(value > 0.) {
        var index = atomicAdd(&voxelsIndex[0], 1);
        voxelsEnabled[index] = vec4f(vec3f(id), c);
    }
}