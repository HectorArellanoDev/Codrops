struct Uniforms {
    uResolution: f32,
    uSearchRadius: f32,
    separation: f32
}

var<private> deltaPosition: vec3<f32> = vec3f(0.);
var<private> h2: f32 = 0.;

@group(0) @binding(0) var<storage, read>  positionBufferIN: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> positionBufferOUT: array<vec4f>;
@group(0) @binding(2) var<storage, read>  indicesBuffer: array<vec4<u32>>;
@group(0) @binding(3) var<uniform>  uniforms: Uniforms;

fn addToSum(particlePosition: vec3f, nParticlePosition: vec3f) {

    let distance = (particlePosition - nParticlePosition) ;
    let r = length(distance);

    let separation = 1. + uniforms.separation;

    if(r > 0. && r < separation) {

        deltaPosition -= 0.5 * (r - separation) * normalize(distance) ;
    }

}

@compute @workgroup_size(256) fn main( @builtin(global_invocation_id) id: vec3<u32> ) {

    var index1D = id.x;

    h2 = uniforms.uSearchRadius * uniforms.uSearchRadius;

    let particlePosition = positionBufferIN[index1D].rgb;
    let lambdaPressure = positionBufferIN[index1D].a;
    let gridPosition = vec3<i32>(floor(particlePosition));
    let resolution = i32(uniforms.uResolution);

    var neighborsVoxel = gridPosition ;
    var voxelIndex = neighborsVoxel.x + neighborsVoxel.y * resolution + neighborsVoxel.z * resolution * resolution;
    var indices = indicesBuffer[u32(voxelIndex)];
    if(indices.x > 0) {addToSum(particlePosition, positionBufferIN[indices.x].rgb);}
    if(indices.y > 0) {addToSum(particlePosition, positionBufferIN[indices.y].rgb);}
    if(indices.z > 0) {addToSum(particlePosition, positionBufferIN[indices.z].rgb);}
    if(indices.w > 0) {addToSum(particlePosition, positionBufferIN[indices.w].rgb);}

    var offsets = array<vec3<i32>, 26>();

    //Faces
    offsets[0] = vec3<i32>(0, 0, 1);
    offsets[1] = vec3<i32>(0, 0, -1);
    offsets[2] = vec3<i32>(0, 1, 0);
    offsets[3] = vec3<i32>(0, -1, 0);
    offsets[4] = vec3<i32>(1, 0, 0);
    offsets[5] = vec3<i32>(-1, 0, 0);

    //Aristas
    offsets[6] = vec3<i32>(0, 1, 1);
    offsets[7] = vec3<i32>(1, 0, 1);
    offsets[8] = vec3<i32>(1, 1, 0);
    offsets[9] = vec3<i32>(0, 1, -1);
    offsets[10] = vec3<i32>(1, 0, -1);
    offsets[11] = vec3<i32>(1, -1, 0);
    offsets[12] = vec3<i32>(0, -1, 1);
    offsets[13] = vec3<i32>(-1, 0, 1);
    offsets[14] = vec3<i32>(-1, 1, 0);
    offsets[15] = vec3<i32>(0, -1, -1);
    offsets[16] = vec3<i32>(-1, 0, -1);
    offsets[17] = vec3<i32>(-1, -1, 0);

    //Corners
    offsets[18] = vec3<i32>(1, 1, 1);
    offsets[19] = vec3<i32>(1, 1, -1);
    offsets[20] = vec3<i32>(1, -1, 1);
    offsets[21] = vec3<i32>(-1, 1, 1);
    offsets[22] = vec3<i32>(1, -1, -1);
    offsets[23] = vec3<i32>(-1, -1, 1);
    offsets[24] = vec3<i32>(-1, 1, -1);
    offsets[25] = vec3<i32>(-1, -1, -1);



    for(var i = 0; i < 26; i ++) {

        var average = vec3f(0);
        var counter = 0.;
        let neighborsVoxel = gridPosition + offsets[i];
        let voxelIndex = neighborsVoxel.x + neighborsVoxel.y * resolution + neighborsVoxel.z * resolution * resolution;
        let indices = indicesBuffer[u32(voxelIndex)];

        if(indices.x > 0) {addToSum(particlePosition, positionBufferIN[indices.x].rgb);}
        if(indices.y > 0) {addToSum(particlePosition, positionBufferIN[indices.y].rgb);}
        if(indices.z > 0) {addToSum(particlePosition, positionBufferIN[indices.z].rgb);}
        if(indices.w > 0) {addToSum(particlePosition, positionBufferIN[indices.w].rgb);}
        
    }

    var endPosition = particlePosition + deltaPosition;

    //Collision handling
    let center = uniforms.uResolution * vec3f(0.5, 0.5, 0.5);
    let boxSize = uniforms.uResolution * vec3f(0.2, 0.48, 0.48);
    let xLocal = endPosition - center;
    let contactPointLocal = min(boxSize, max(-boxSize, xLocal));
    let contactPoint = contactPointLocal + center;
    let distance = length(contactPoint - particlePosition);

    if(distance > 0.0) {endPosition = contactPoint;};

    positionBufferOUT[index1D] = vec4f(endPosition, lambdaPressure);
}
