@group(0) @binding(0) var<storage, read> voxelsBufferInput: array<i32>;
@group(0) @binding(1) var<storage, read_write> voxelsBuffer: array<i32>;

@compute @workgroup_size(1) fn main(@builtin(global_invocation_id) id: vec3u) {

    let totalVoxels = f32(voxelsBufferInput[0]);
    voxelsBuffer[0] = i32(ceil( totalVoxels / 15. ));
    voxelsBuffer[1] = 1;
    voxelsBuffer[2] = 1;

    voxelsBuffer[3] = i32(15. * totalVoxels);
    voxelsBuffer[4] = 1;
    voxelsBuffer[5] = 0;
    voxelsBuffer[6] = 0;
}