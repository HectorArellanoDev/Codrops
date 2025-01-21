struct Uniforms {
    texture3DSize: f32,
    texture2DSize: f32,
    mipmapLevels: f32,
    range: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> voxelsBuffer: array<vec4f>;
@group(0) @binding(2) var<storage, read> indicesBuffer:array<f32>;
@group(0) @binding(3) var potentialTexture: texture_3d<f32>;
@group(0) @binding(4) var<storage, read_write> positionBuffer: array<vec4f>;
@group(0) @binding(5) var<storage, read_write> normalBuffer: array<vec4f>;
@group(0) @binding(6) var<storage, read_write> velocityBuffer: array<vec4f>;


@compute @workgroup_size(225, 1, 1) fn main( @builtin(local_invocation_id) l_id: vec3<u32>,
                                      @builtin(workgroup_id) workgroup_id: vec3<u32>,
                                      @builtin(local_invocation_index) local_invocation_index: u32,
                                      @builtin(num_workgroups) num_workgroups: vec3<u32>
                                      ) {

    let workgroup_index = workgroup_id.x + workgroup_id.y * num_workgroups.x + workgroup_id.z * num_workgroups.x * num_workgroups.y;
    let global_invocation_index = workgroup_index * 225 + local_invocation_index;

    var p0 = vec3i(1, 0, 0);
    var p1 = vec3i(1, 1, 0);
    var p2 = vec3i(0, 1, 0);
    var p3 = vec3i(0, 0, 1);
    var p4 = vec3i(1, 0, 1);
    var p5 = vec3i(1, 1, 1);
    var p6 = vec3i(0, 1, 1);

    var currentVoxel = floor(f32(global_invocation_index) / 15.);
    var currentIndex = global_invocation_index % 15;

    var voxelData = voxelsBuffer[i32(currentVoxel)];
    var position3D = voxelData.xyz;

    //Marching cubes case * 15 indices + local index
    var currentVertex = indicesBuffer[i32(voxelData.w) * 15 + i32(currentIndex)];

    if(currentVertex == -1.) {
        positionBuffer[global_invocation_index] = vec4f(0, 0, 0, 0);
        return;
    }
    
    var m0 = vec4f(currentVertex, currentVertex, currentVertex, currentVertex);
    var m1 = vec4i(m0 == vec4f(0, 1, 2, 3));
    var m2 = vec4i(m0 == vec4f(4, 5, 6, 7));
    var m3 = vec4i(m0 == vec4f(8, 9, 10, 11));

    //Get the corners for the edge where the vertex is allocated
    var corner0 = vec3i(position3D) + m1.y * p0 + m1.z * p1 + m1.w * p2 + m2.x * p3 + m2.y * p4 + m2.z * p5 + m2.w * p6 + m3.y * p0 + m3.z * p1 + m3.w * p2;
    var corner1 = vec3i(position3D) + m1.x * p0 + m1.y * p1 + m1.z * p2 + m2.x * p4 + m2.y * p5 + m2.z * p6 + m2.w * p3 + m3.x * p3 + m3.y * p4 + m3.z * p5 + m3.w * p6;

    var b0 = vec3f(corner0);
    var b1 = vec3f(corner1);    

    //Potential values in the corresponding corners
    var n0 = textureLoad(potentialTexture, corner0, 0).r;
    var n1 = textureLoad(potentialTexture, corner1, 0).r;

    //Define the position of the corresponding vertex
    var diff = vec2f(uniforms.range - n0, n1 - n0);
    var vertexPosition = b0 + diff.x * (b1 - b0) / diff.y;

    //Define the normal
    var plusX = corner0 + vec3i(1, 0, 0);
    var plusY = corner0 + vec3i(0, 1, 0);
    var plusZ = corner0 + vec3i(0, 0, 1);

    var minusX = corner0 - vec3i(1, 0, 0);
    var minusY = corner0 - vec3i(0, 1, 0);
    var minusZ = corner0 - vec3i(0, 0, 1);

    var normal0 = vec3f(textureLoad(potentialTexture, plusX, 0).r - textureLoad(potentialTexture, minusX, 0).r,
                        textureLoad(potentialTexture, plusY, 0).r - textureLoad(potentialTexture, minusY, 0).r, 
                        textureLoad(potentialTexture, plusZ, 0).r - textureLoad(potentialTexture, minusZ, 0).r);

    normal0 = normalize(normal0);

    plusX = corner1 + vec3i(1, 0, 0);
    plusY = corner1 + vec3i(0, 1, 0);
    plusZ = corner1 + vec3i(0, 0, 1);

    minusX = corner1 - vec3i(1, 0, 0);
    minusY = corner1 - vec3i(0, 1, 0);
    minusZ = corner1 - vec3i(0, 0, 1);

    var normal1 = vec3f(textureLoad(potentialTexture, plusX, 0).r - textureLoad(potentialTexture, minusX, 0).r,
                        textureLoad(potentialTexture, plusY, 0).r - textureLoad(potentialTexture, minusY, 0).r, 
                        textureLoad(potentialTexture, plusZ, 0).r - textureLoad(potentialTexture, minusZ, 0).r);    
    
    normal1 = normalize(normal1);

    var normal = normal0 + diff.x * (normal1 - normal0) / diff.y;

    //velocities values in the corresponding corners
    var vel0 = textureLoad(potentialTexture, corner0, 0).gba;
    var vel1 = textureLoad(potentialTexture, corner1, 0).gba;
    var velocity = vel0 + diff.x * (vel1 - vel0) / diff.y;

    positionBuffer[global_invocation_index] = vec4f( vertexPosition / uniforms.texture3DSize, 1.);
    normalBuffer[global_invocation_index] = vec4f(-normal, 1.);
    velocityBuffer[global_invocation_index] = vec4f(velocity, 1.);

}