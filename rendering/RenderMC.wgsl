struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) position3D: vec3f,
  @location(1) normal: vec3f,
  @location(2) velocity: vec3f,
  @location(3) position2D: vec2f
};

struct Uniforms {
    perspectiveMatrix: mat4x4<f32>,
    cameraPosition: vec3f,
    voxelsSize: f32,

    coneAngle: f32,
    coneRotation: f32,
    currentFrame: f32,
    voxelWorldSize: f32,

    inColor: vec3f,
    mirror: f32,

    outColor: vec3f,
    thickness: f32
};


@group(0) @binding(0) var<storage, read>  positionBuffer: array<vec4f>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;
@group(0) @binding(2) var<storage, read>  normalBuffer: array<vec4f>;
@group(0) @binding(3) var texture3D: texture_3d<f32>;
@group(0) @binding(4) var textureSampler: sampler;
@group(0) @binding(5) var<storage, read> velocityBuffer: array<vec4f>;
@group(0) @binding(6) var potentialTexture: texture_3d<f32>;


@vertex fn vs( @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    
    var position3D = positionBuffer[vertexIndex].rgb;
    var thickness = 0.01 * (1 - clamp(uniforms.thickness, 0., 1.));
    var pos = position3D - thickness * normalBuffer[vertexIndex].rgb ;
    var projection = uniforms.perspectiveMatrix * vec4f(pos, 1.);
    var output: VertexOutput;
    output.position = projection;
    output.position3D = position3D;
    output.normal = normalBuffer[vertexIndex].rgb; 
    output.velocity = velocityBuffer[vertexIndex].rgb; 
    output.position2D = 0.5 * projection.xy / projection.w + 0.5;
    return output;
}

const MAX_DISTANCE = 1.0;
const MAX_ALPHA = 0.95;

fn sampleVoxels(pos: vec3<f32>, lod: f32) -> vec4<f32> {
    return textureSampleLevel(texture3D, textureSampler, pos, lod);
}

fn voxelConeTracing(startPos: vec3f, direction: vec3f, tanHalfAngle: f32) -> vec4<f32> {
    var lod = 0.;
    var color = vec3f(0.);
    var alpha = 0.;
    var occlusion = 0.;

    var voxelWorldSize = uniforms.voxelWorldSize;
    var dist = voxelWorldSize;

    while(dist < MAX_DISTANCE && alpha < MAX_ALPHA) {
        let diameter = max(voxelWorldSize, 2. * tanHalfAngle * dist);
        let lodLevel = log2( diameter / voxelWorldSize);
        var voxelColor = sampleVoxels(startPos + dist * direction, lodLevel);
        var sub = 1. - alpha;
        var aa = voxelColor.a;
        alpha += sub * aa;
        occlusion += sub * aa / (1. + 0.03 * diameter);
        color += sub * voxelColor.rgb;
        dist += diameter;
    }

    return vec4f(color, clamp(1. - occlusion, 0., 1.) );
}

fn getOcclusion(ro: vec3f, rd: vec3f, scaler: f32) -> vec4f{
    var totao = vec4f(0.);
    var sca = 1.;
    var steps = 100.;
    for(var aoi = 1.; aoi < steps; aoi+= 1.) {
        var hr = 0.03 + 2. * aoi * aoi / (steps * steps);
        var p = ro + rd * hr;
        var dd = textureSampleLevel(potentialTexture, textureSampler, p, 0).x;
        var ao = 0.;
        if(dd <= hr) {
            ao = clamp((hr - dd), 0., 1.);
        }
        totao += ao * sca * vec4(1.);
        sca *= scaler;
    }
    var aoCoef = 1.;
    totao = vec4f(totao.rgb, clamp(aoCoef * totao.w, 0., 1.));
    return totao;
}


struct FragmentOutput {
    @location(0) color: vec4f,
    @location(1) velocity: vec4f,
}


@fragment fn fs(input: VertexOutput) -> FragmentOutput {
    
    var eye = normalize(input.position3D - uniforms.cameraPosition);

    var pp = input.position3D; 
    var direction = input.normal;

    var ang = radians(uniforms.coneRotation);
    let s = sin(ang);
    let c = cos(ang);

    var dir1 = vec3f(0, 0, 1);
    var dir2 = vec3f(c, 0, s);
    var dir3 = vec3f(-c, 0, s);
    var dir4 = vec3f(0, c, s);
    var dir5 = vec3f(0, -c, s);

    var zAxis = normalize(direction);
    var xAxis = vec3f(1, 0, 0);
    var yAxis = vec3f(0, 1, 0);
    var UP = vec3f(0, 1, 0);
    var rot = mat3x3f(0, 0, 0, 0, 0, 0, 0, 0, 0);

    if( abs(dot(direction, UP)) > 0.9 ) {

        UP = vec3f(1, 0, 0);

    }

    xAxis = normalize(cross(UP, zAxis));
    yAxis = normalize(cross(zAxis, xAxis));
    rot = mat3x3f(xAxis, yAxis, zAxis);


    dir1 = rot * dir1;
    dir2 = rot * dir2;
    dir3 = rot * dir3;
    dir4 = rot * dir4;
    dir5 = rot * dir5;

    var cone = voxelConeTracing(pp, dir1, uniforms.coneAngle);
    var color =  cone.rgba;

    cone = voxelConeTracing(pp, dir2, uniforms.coneAngle);
    color += cone.rgba;

    cone = voxelConeTracing(pp, dir3, uniforms.coneAngle);
    color += cone.rgba;

    cone = voxelConeTracing(pp, dir4, uniforms.coneAngle);
    color += cone.rgba;

    cone = voxelConeTracing(pp, dir5, uniforms.coneAngle);
    color += cone.rgba;

    color /= 5.;
    color = pow(color, vec4f(0.4545));

    var thickness = getOcclusion(input.position3D, eye, 0.89);

    var thicknessPower = 1.;
    var thicknessScale = 1.;

    var transition = uniforms.currentFrame * 2.;
    transition = pow(min(max(0., transition - .6), 1.), 2.);
    var bars = 10.;
    var _x = (floor(bars * pow(input.position2D.x, .8) )) % bars;

    var thicknessAmbient = 0.8 * mix(uniforms.inColor, uniforms.outColor, vec3f(transition));
    

    // var thicknessAmbient = 0.8 * select(uniforms.inColor, uniforms.outColor, input.position2D.y > 1. - transition);
    var subsurfaceSpread = .4;
    var subsurfaceIntensity = 8.;
    var subsurfacePower = 10.;

    var lightDirection = -eye;
    var scatteringHalf = normalize(lightDirection + (input.normal * subsurfaceSpread));
    var scatteringDot = pow(clamp(dot(eye, -scatteringHalf), 0., 1.), subsurfacePower) * subsurfaceIntensity;
    var scatteringIllu = thicknessAmbient * (scatteringDot) * pow(thickness.a * thicknessScale, thicknessPower) + thicknessAmbient;

    var specular = pow(max(dot(reflect(input.normal, normalize(vec3(-1., 1., 0.))), eye), 0.), 20.);

    var output: FragmentOutput;
    var decay = max(pow(max(1. - input.position3D.y, 1. - uniforms.mirror), 2.), 0.);

    output.color = vec4( pow((vec3f(specular) * vec3f(0.1) + scatteringIllu + color.rgb), vec3(1.)) * color.a, 1.);  
    output.velocity = vec4(pow(input.position3D.y, 2.), uniforms.mirror, 0., 1.);

    return output;

}