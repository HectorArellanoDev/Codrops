struct Uniforms {
    cameraOrientation: mat4x4f,

    acceleration: vec3f,
    deltaTime: f32,

    mousePosition: vec3f,
    gridResolution: f32,

    mouseDirection: vec3f,
    currentFrame: f32,

    transition: f32,
    totalParticles: f32
}

@group(0) @binding(0) var<storage, read_write>  resetBuffer: array<vec4f>;
@group(0) @binding(1) var<storage, read_write>  positionBuffer: array<vec4f>;
@group(0) @binding(2) var<storage, read>  velocityBuffer: array<vec4f>;
@group(0) @binding(3) var<storage, read_write>  counterBuffer:    array<atomic<u32>>;
@group(0) @binding(4) var<storage, read_write>  indicesBuffer:    array<u32>;
@group(0) @binding(5) var<uniform>  uniforms: Uniforms;


//Analitic derivatives of the potentials for the curl noise, based on: http://weber.itn.liu.se/~stegu/TNM084-2019/bridson-siggraph2007-curlnoise.pdf

fn t1() -> f32 {
    return uniforms.currentFrame * 10.5432895;
}

fn t2() -> f32 {
    return uniforms.currentFrame * 20.5432895;
}

fn t3() -> f32 {
    return uniforms.currentFrame * 5.535463;
}

fn t4() -> f32 {
    return -uniforms.currentFrame * 13.534534;
}

fn t5() -> f32 {
    return uniforms.currentFrame * 54.42345;
}

fn t6() -> f32 {
    return - uniforms.currentFrame * 23.53450;
}

fn t7() -> f32 {
    return - uniforms.currentFrame * 45.5345354313;
}

fn t8() -> f32 {
    return uniforms.currentFrame * 23.4234521243;
}

fn dP3dY( v: vec3<f32>) -> f32 {
    var noise = 0.0;
    noise += 3. * cos(v.z * 1.8 + v.y * 3. - 194.58 + t1() ) + 4.5 * cos(v.z * 4.8 + v.y * 4.5 - 83.13 + t2() ) + 1.2 * cos(v.z * -7.0 + v.y * 1.2 -845.2 + t3() ) + 2.13 * cos(v.z * -5.0 + v.y * 2.13 - 762.185 + t4() );
    noise += 5.4 * cos(v.x * -0.48 + v.y * 5.4 - 707.916 + t5() ) + 5.4 * cos(v.x * 2.56 + v.y * 5.4 + -482.348 + t6() ) + 2.4 * cos(v.x * 4.16 + v.y * 2.4 + 9.872 + t7() ) + 1.35 * cos(v.x * -4.16 + v.y * 1.35 - 476.747 + t8() );
    return noise;
}

fn dP2dZ( v: vec3<f32>) -> f32 {
    return -0.48 * cos(v.z * -0.48 + v.x * 5.4 -125.796 + t5() ) + 2.56 * cos(v.z * 2.56 + v.x * 5.4 + 17.692 + t6() ) + 4.16 * cos(v.z * 4.16 + v.x * 2.4 + 150.512 + t7() ) -4.16 * cos(v.z * -4.16 + v.x * 1.35 - 222.137 + t8() );
}

fn dP1dZ( v: vec3<f32>) -> f32 {
    var noise = 0.0;
    noise += 3. * cos(v.x * 1.8 + v.z * 3. + t1() ) + 4.5 * cos(v.x * 4.8 + v.z * 4.5 + t2() ) + 1.2 * cos(v.x * -7.0 + v.z * 1.2 + t3() ) + 2.13 * cos(v.x * -5.0 + v.z * 2.13 + t4() );
    noise += 5.4 * cos(v.y * -0.48 + v.z * 5.4 + t5() ) + 5.4 * cos(v.y * 2.56 + v.z * 5.4 + t6() ) + 2.4 * cos(v.y * 4.16 + v.z * 2.4 + t7() ) + 1.35 * cos(v.y * -4.16 + v.z * 1.35 + t8() );
    return noise;
}

fn dP3dX( v: vec3<f32>) -> f32 {
    return -0.48 * cos(v.x * -0.48 + v.y * 5.4 - 707.916 + t5() ) + 2.56 * cos(v.x * 2.56 + v.y * 5.4 + -482.348 + t6() ) + 4.16 * cos(v.x * 4.16 + v.y * 2.4 + 9.872 + t7() ) -4.16 * cos(v.x * -4.16 + v.y * 1.35 - 476.747 + t8() );
}

fn dP2dX( v: vec3<f32>) -> f32 {
    var noise = 0.0;
    noise += 3. * cos(v.y * 1.8 + v.x * 3. - 2.82 + t1() ) + 4.5 * cos(v.y * 4.8 + v.x * 4.5 + 74.37 + t2() ) + 1.2 * cos(v.y * -7.0 + v.x * 1.2 - 256.72 + t3() ) + 2.13 * cos(v.y * -5.0 + v.x * 2.13 - 207.683 + t4() );
    noise += 5.4 * cos(v.z * -0.48 + v.x * 5.4 -125.796 + t5() ) + 5.4 * cos(v.z * 2.56 + v.x * 5.4 + 17.692 + t6() ) + 2.4 * cos(v.z * 4.16 + v.x * 2.4 + 150.512 + t7() ) + 1.35 * cos(v.z * -4.16 + v.x * 1.35 - 222.137 + t8() );
    return noise;
}

fn dP1dY( v: vec3<f32>) -> f32 {
    return -0.48 * cos(v.y * -0.48 + v.z * 5.4 + t5() ) + 2.56 * cos(v.y * 2.56 + v.z * 5.4 + t6() ) +  4.16 * cos(v.y * 4.16 + v.z * 2.4 + t7() ) -4.16 * cos(v.y * -4.16 + v.z * 1.35 + t8());
}

fn curlNoise(p : vec3<f32> ) -> vec3<f32> {
    let x = dP3dY(p) - dP2dZ(p);
    let y = dP1dZ(p) - dP3dX(p);
    let z = dP2dX(p) - dP1dY(p);
    return normalize(vec3<f32>(x, y, z));
}


@compute @workgroup_size(256) fn main( @builtin(global_invocation_id) id: vec3<u32> ) {

    let i = id.x;
    var ii = id.x;
    let tt = u32(uniforms.totalParticles);
    if(ii >= tt) {
        ii = tt - i % tt;
    }

    //Apply the forces
    var planeIndex = positionBuffer[i].a;
    var position = positionBuffer[i].rgb;
    var velocity = velocityBuffer[i].rgb;
    var origin = resetBuffer[ii].rgb;

    //Apply different noise function
    //position -= vec3f(0.16) * curlNoise( .0125 * pos );
    var dt = uniforms.deltaTime;
    var acceleration = vec3f(0.);
    var noiseAcceleration = uniforms.acceleration;
    var transition = uniforms.transition * 3.;
    var delta = 1.;

    var amp = 150.;
    var freq = .01;
    for(var k = 0; k < 2; k ++) {
        var c = curlNoise(freq * position );
        // c.x *= 0.1;
        noiseAcceleration += amp * c;
        amp /= 2.;
        freq *= 2.;
    } 

    // noiseAcceleration += .01 * (vec3(uniforms.gridResolution * 0.5) - position);

    var resetAcceleration = 20. * (origin - position);

    if(transition < 1.) {
        acceleration = noiseAcceleration;
    } else {
        var transitionIndex = min(max(transition - planeIndex / uniforms.gridResolution - 1., 0.), 1.);
        // transitionIndex = pow(transitionIndex, 4.);
        acceleration = mix(noiseAcceleration, resetAcceleration + noiseAcceleration * (1. - transitionIndex), vec3f(transitionIndex));
    }

    var p1 = uniforms.cameraOrientation * vec4f(position, 1.);
    var p2 = uniforms.cameraOrientation * vec4f(uniforms.mousePosition, 1.);
    var intensity = 1. - length(p2.xy - p1.xy) / (5. + 10. * clamp(length(uniforms.mouseDirection), 0, 1) );
    intensity = clamp(intensity, 0., 1.);
    acceleration +=  0.1 * uniforms.mouseDirection * intensity / (dt * dt);


    position = position + dt * (velocity + dt * acceleration);


    //Save back the position
    positionBuffer[i] = vec4f(position, planeIndex);

    //Place particles inside the grid acceleration

    let textureSize = u32(uniforms.gridResolution);

    //3d index for the grid acceleration
    let voxelPosition = vec3<u32>( floor(position) );

    //1d index for the atomic buffer
    let index1D = voxelPosition.x + textureSize * voxelPosition.y + textureSize * textureSize * voxelPosition.z;

    //Increase the counter and set the index for the 3d indices buffer
    let amountOfParticlesInVoxel = atomicAdd(&counterBuffer[index1D], 1);
    if(amountOfParticlesInVoxel < 4) {
        indicesBuffer[ u32( u32(4 * index1D) + u32(amountOfParticlesInVoxel) )] = i;
    }

}