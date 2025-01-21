var Gr=Object.defineProperty;var Rr=(n,e,t)=>e in n?Gr(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var Pn=(n,e,t)=>Rr(n,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function t(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(r){if(r.ep)return;r.ep=!0;const o=t(r);fetch(r.href,o)}})();function nr(n,e){n=n.split(";");let t=[];const i=/group\(([^)]+)\)/,r=/binding\(([^)]+)\)/;return n.forEach((o,a)=>{if(o.includes("@group")){const s=Number(i.exec(o)[1]),u=Number(r.exec(o)[1]);if(t[s]==null&&(t[s]=[]),o.includes("uniform")||o.includes("storage")){let c="";o.includes("storage")&&(c=o.includes("read_write")?"storage":"read-only-storage"),o.includes("uniform")&&(c="uniform"),t[s][u]={binding:u,visibility:e,buffer:{type:c}}}if(o.includes("texture_")){let c="2d";if(o.includes("_3d")&&(c="3d"),o.includes("_1d")&&(c="1d"),o.includes("_2d")&&o.includes("array")&&(c="2d-array"),o.includes("texture_storage"))t[s][u]={binding:u,visibility:e,storageTexture:{format:o.includes("unorm")?"rgba8unorm":"rgba32float",viewDimension:c}};else{let m="float",p="2d";o.includes("texture_3d")&&(p="3d"),o.includes("texture_1d")&&(p="1d"),o.includes("_2d")&&o.includes("array")&&(p="2d-array"),t[s][u]={binding:u,visibility:e,texture:{sampleType:m,viewDimension:p}}}}o.includes("sampler")&&(t[s][u]={binding:u,visibility:e,sampler:{type:"filtering"}})}}),t}Promise.create=function(){const n=new Promise((e,t)=>{this.temp_resolve=e,this.temp_reject=t});return n.resolve=this.temp_resolve,n.reject=this.temp_reject,delete this.temp_resolve,delete this.temp_reject,n};var G=null;let kr=async n=>{var t;const e=await((t=navigator.gpu)==null?void 0:t.requestAdapter());return G=await(e==null?void 0:e.requestDevice({requiredFeatures:["float32-filterable"]})),G||(console.log("error finding device"),null)},rr=async n=>{try{return await(await fetch(n)).text()}catch{return n}},Oe=async n=>{const e=await rr(n),t=G.createShaderModule({label:`${n} module`,code:e}),r=nr(e,GPUShaderStage.COMPUTE).map(s=>G.createBindGroupLayout({entries:s})),o=G.createPipelineLayout({bindGroupLayouts:r});return{pipeline:G.createComputePipeline({label:`${n} pipeline`,layout:o,compute:{module:t,entryPoint:"main"}})}};class ir{constructor(){Pn(this,"setBindGroup",e=>{this.bindGroup=G.createBindGroup({label:`${this.label} bind group`,layout:this.pipeline.getBindGroupLayout(0),entries:e})});this.label=null,this.passDescriptor=null,this.pipeline=null,this.bindGroup=null,this.uniformsData=null,this.uniformsBuffer=null}}async function gn(n,e,t=1,i,r=!0){let o=new ir;const a=await rr(e),s=G.createShaderModule({label:`${n} module`,code:a}),c=nr(a,GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT).map(h=>G.createBindGroupLayout({entries:h})),m=G.createPipelineLayout({bindGroupLayouts:c});let p={label:`${n} pipeline`,layout:m,vertex:{module:s,entryPoint:"vs"},fragment:{module:s,entryPoint:"fs",targets:i},primitive:{topology:"triangle-list",cullMode:"none"},multisample:{count:t}};const d={label:`${n} rendering pass descriptor`,colorAttachments:[]};r&&(p.depthStencil={depthWriteEnabled:!0,depthCompare:"less",format:"depth32float"},d.depthStencilAttachment={depthClearValue:1,depthStoreOp:"store"});const g=G.createRenderPipeline(p);return i.map(h=>{d.colorAttachments.push({clearValue:[0,0,0,0],storeOp:"store"})}),o.label=n,o.pipeline=g,o.passDescriptor=d,o}async function re(n,e,t=null,i=null){let r=new ir,o=Promise.create();if(Oe(e).then(a=>{r.pipeline=a.pipeline,o.resolve()}),await o,r.label=n,t&&(r.uniformsData=new Float32Array(t),r.uniformsBuffer=G.createBuffer({label:`${n} uniforms buffer`,size:r.uniformsData.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),G.queue.writeBuffer(r.uniformsBuffer,0,r.uniformsData)),i){let a=i.map((s,u)=>({binding:u,resource:{buffer:s=="uniforms"?r.uniformsBuffer:s}}));r.bindGroup=G.createBindGroup({label:`${n} bind group`,layout:r.pipeline.getBindGroupLayout(0),entries:a})}return console.log(`${n} ready`),r}var Lr=`struct Uniforms {
    axis: vec3f,
    steps: f32
}

@group(0) @binding(0) var textureRead: texture_3d<f32>;
@group(0) @binding(1) var textureSave: texture_storage_3d<rgba32float, write>;
@group(0) @binding(2) var<uniform> uniforms: Uniforms;

@compute @workgroup_size(1) fn main( @builtin(global_invocation_id) ud: vec3<u32> ) {
    

    var tSize = vec3f(textureDimensions(textureRead));
    var id = ud + vec3u( u32(tSize.x * 0.2), 0, 0);

    var blend = vec4f(0.);
    var blend2 = vec4f(0.);
    var sum = 1.;
    var sum2 = 0.;
    var m = 1.;
    var n = uniforms.steps;
    for(var i = 0.; i < uniforms.steps; i += 1.) {
        var j = i - 0.5 * uniforms.steps;
        var tRead = textureLoad(textureRead, vec3<i32>(id) + vec3<i32>(j * uniforms.axis), 0);
        blend += m * tRead;
        blend2 += tRead;
        m *= (n - i) / (i + 1.);
        sum += m;
        sum2 += 1.;
    }    

    blend /= sum;
    blend2 /= sum2;

    var mixer = 1.;
    blend = mixer * blend + (1. - mixer) * blend2;
    
    textureStore(textureSave, id, blend );

}`;let Sn=!1,kt,Kt=[];const zr=n=>{let e=[[1,0,0,1],[0,0,1,1],[0,1,0,1]];for(let t=0;t<3;t++){let i=new Float32Array(e[t]),r=n.createBuffer({label:"uniforms buffer",size:i.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});n.queue.writeBuffer(r,0,i),Kt.push(r)}};async function Mr(n,e,t){let i=G;if(!Sn){zr(i);let d=Promise.create();Oe(Lr).then(g=>{kt=g.pipeline,d.resolve()}),await d,Sn=!0}let r=t*2,o=[[1,0,0,r],[0,0,1,r],[0,1,0,r]];for(let d=0;d<3;d++){let g=new Float32Array(o[d]);i.queue.writeBuffer(Kt[d],0,g)}const a=i.createCommandEncoder({label:"encoder"}),s=a.beginComputePass({label:"blur3D pass"});s.setPipeline(kt);let u=n.width,c,m;for(let d=0;d<3;d++){let g=d%2==0;c=g?n:e,m=g?e:n;const h=i.createBindGroup({label:"bind group for blur3D",layout:kt.getBindGroupLayout(0),entries:[{binding:0,resource:c.createView({baseMipLevel:0,mipLevelCount:1})},{binding:1,resource:m.createView({baseMipLevel:0,mipLevelCount:1})},{binding:2,resource:{buffer:Kt[d]}}]});s.setBindGroup(0,h),s.dispatchWorkgroups(u*.6,u,u)}s.end();const p=a.finish();i.queue.submit([p])}var at=typeof Float32Array<"u"?Float32Array:Array;Math.hypot||(Math.hypot=function(){for(var n=0,e=arguments.length;e--;)n+=arguments[e]*arguments[e];return Math.sqrt(n)});function $(){var n=new at(16);return at!=Float32Array&&(n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[11]=0,n[12]=0,n[13]=0,n[14]=0),n[0]=1,n[5]=1,n[10]=1,n[15]=1,n}function Cn(n,e){var t=e[0],i=e[1],r=e[2],o=e[3],a=e[4],s=e[5],u=e[6],c=e[7],m=e[8],p=e[9],d=e[10],g=e[11],h=e[12],v=e[13],w=e[14],E=e[15],L=t*s-i*a,b=t*u-r*a,x=t*c-o*a,y=i*u-r*s,S=i*c-o*s,Le=r*c-o*u,ze=m*v-p*h,Me=m*w-d*h,Ie=m*E-g*h,Ne=p*w-d*v,Fe=p*E-g*v,Ve=d*E-g*w,O=L*Ve-b*Fe+x*Ne+y*Ie-S*Me+Le*ze;return O?(O=1/O,n[0]=(s*Ve-u*Fe+c*Ne)*O,n[1]=(r*Fe-i*Ve-o*Ne)*O,n[2]=(v*Le-w*S+E*y)*O,n[3]=(d*S-p*Le-g*y)*O,n[4]=(u*Ie-a*Ve-c*Me)*O,n[5]=(t*Ve-r*Ie+o*Me)*O,n[6]=(w*x-h*Le-E*b)*O,n[7]=(m*Le-d*x+g*b)*O,n[8]=(a*Fe-s*Ie+c*ze)*O,n[9]=(i*Ie-t*Fe-o*ze)*O,n[10]=(h*S-v*x+E*L)*O,n[11]=(p*x-m*S-g*L)*O,n[12]=(s*Me-a*Ne-u*ze)*O,n[13]=(t*Ne-i*Me+r*ze)*O,n[14]=(v*b-h*y-w*L)*O,n[15]=(m*y-p*b+d*L)*O,n):null}function Jt(n,e,t){var i=e[0],r=e[1],o=e[2],a=e[3],s=e[4],u=e[5],c=e[6],m=e[7],p=e[8],d=e[9],g=e[10],h=e[11],v=e[12],w=e[13],E=e[14],L=e[15],b=t[0],x=t[1],y=t[2],S=t[3];return n[0]=b*i+x*s+y*p+S*v,n[1]=b*r+x*u+y*d+S*w,n[2]=b*o+x*c+y*g+S*E,n[3]=b*a+x*m+y*h+S*L,b=t[4],x=t[5],y=t[6],S=t[7],n[4]=b*i+x*s+y*p+S*v,n[5]=b*r+x*u+y*d+S*w,n[6]=b*o+x*c+y*g+S*E,n[7]=b*a+x*m+y*h+S*L,b=t[8],x=t[9],y=t[10],S=t[11],n[8]=b*i+x*s+y*p+S*v,n[9]=b*r+x*u+y*d+S*w,n[10]=b*o+x*c+y*g+S*E,n[11]=b*a+x*m+y*h+S*L,b=t[12],x=t[13],y=t[14],S=t[15],n[12]=b*i+x*s+y*p+S*v,n[13]=b*r+x*u+y*d+S*w,n[14]=b*o+x*c+y*g+S*E,n[15]=b*a+x*m+y*h+S*L,n}function Ir(n,e,t,i,r){var o=1/Math.tan(e/2),a;return n[0]=o/t,n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[5]=o,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[11]=-1,n[12]=0,n[13]=0,n[15]=0,r!=null&&r!==1/0?(a=1/(i-r),n[10]=(r+i)*a,n[14]=2*r*i*a):(n[10]=-1,n[14]=-2*i),n}var Nr=Ir;function U(){var n=new at(3);return at!=Float32Array&&(n[0]=0,n[1]=0,n[2]=0),n}function ae(n,e,t){var i=new at(3);return i[0]=n,i[1]=e,i[2]=t,i}function Zt(n,e,t){return n[0]=e[0]+t[0],n[1]=e[1]+t[1],n[2]=e[2]+t[2],n}function $e(n,e,t){return n[0]=e[0]-t[0],n[1]=e[1]-t[1],n[2]=e[2]-t[2],n}function _e(n,e,t){return n[0]=e[0]*t,n[1]=e[1]*t,n[2]=e[2]*t,n}function Tn(n,e){return n[0]=-e[0],n[1]=-e[1],n[2]=-e[2],n}function Xe(n,e){var t=e[0],i=e[1],r=e[2],o=t*t+i*i+r*r;return o>0&&(o=1/Math.sqrt(o)),n[0]=e[0]*o,n[1]=e[1]*o,n[2]=e[2]*o,n}function I(n,e){return n[0]*e[0]+n[1]*e[1]+n[2]*e[2]}function En(n,e,t){var i=e[0],r=e[1],o=e[2],a=t[0],s=t[1],u=t[2];return n[0]=r*u-o*s,n[1]=o*a-i*u,n[2]=i*s-r*a,n}function lt(n,e,t){var i=e[0],r=e[1],o=e[2],a=t[3]*i+t[7]*r+t[11]*o+t[15];return a=a||1,n[0]=(t[0]*i+t[4]*r+t[8]*o+t[12])/a,n[1]=(t[1]*i+t[5]*r+t[9]*o+t[13])/a,n[2]=(t[2]*i+t[6]*r+t[10]*o+t[14])/a,n}var be=$e;(function(){var n=U();return function(e,t,i,r,o,a){var s,u;for(t||(t=3),i||(i=0),r?u=Math.min(r*t+i,e.length):u=e.length,s=i;s<u;s+=t)n[0]=e[s],n[1]=e[s+1],n[2]=e[s+2],o(n,n,a),e[s]=n[0],e[s+1]=n[1],e[s+2]=n[2];return e}})();class Fr{constructor(e){this.block=!1,this.position=U(),this.down=!1,this.prevMouseX=0,this.prevMouseY=0,this.currentMouseX=0,this.currentMouseY=0,this.alpha=Math.PI*.5,this.beta=-Math.PI*.5,this._alpha=this.alpha,this._beta=this.beta,this._alpha2=this.alpha,this._beta2=this.beta,this.gaze=!0,this.ratio=1,this.init=!0,this.target=[.5,.35,.5],this.lerp=.1,this.lerp2=.1,this.perspectiveMatrix=$(),this.cameraTransformMatrix=$(),this.orientationMatrix=$(),this.transformMatrix=$(),this.transformMatrixReflection=$(),e.style.cursor="-moz-grab",e.style.cursor=" -webkit-grab",document.addEventListener("mousemove",t=>{this.currentMouseX=t.clientX,this.currentMouseY=t.clientY},!1),document.addEventListener("mousedown",t=>{e.style.cursor="-moz-grabbing",e.style.cursor=" -webkit-grabbing",this.down=!0},!1),document.addEventListener("mouseup",t=>{e.style.cursor="-moz-grab",e.style.cursor=" -webkit-grab",this.down=!1},!1)}updateCamera(e,t,i){if(this.ratio=i,Nr(this.perspectiveMatrix,e*Math.PI/180,t,.01,1e3),this.block||(this.down&&(this.alpha-=.1*(this.currentMouseY-this.prevMouseY)*Math.PI/180,this.beta+=.1*(this.currentMouseX-this.prevMouseX)*Math.PI/180),this.alpha<=.3*Math.PI&&(this.alpha=.3*Math.PI),this.alpha>=.52*Math.PI&&(this.alpha=.52*Math.PI),this.beta>-.1*Math.PI&&(this.beta=-.1*Math.PI),this.beta<-.9*Math.PI&&(this.beta=-.9*Math.PI)),this.lerp=this.down?.2:.05,this.lerp2+=(this.lerp-this.lerp2)*.15,this._alpha!=this.alpha||this._beta!=this.beta||this.init){this._alpha+=(this.alpha-this._alpha)*this.lerp2,this._beta+=(this.beta-this._beta)*this.lerp2,this._alpha2+=(this._alpha-this._alpha2)*this.lerp2,this._beta2+=(this._beta-this._beta2)*this.lerp2,this.position[0]=this.ratio*Math.sin(this._alpha2)*Math.sin(this._beta2)+this.target[0],this.position[1]=this.ratio*Math.cos(this._alpha2)+this.target[1],this.position[2]=this.ratio*Math.sin(this._alpha2)*Math.cos(this._beta2)+this.target[2],this.cameraTransformMatrix=this.defineTransformMatrix(this.position,this.target,[0,1,0]);for(let r=0;r<16;r++)this.orientationMatrix[r]=this.cameraTransformMatrix[r];this.orientationMatrix[12]=0,this.orientationMatrix[13]=0,this.orientationMatrix[14]=0}this.prevMouseX=this.currentMouseX,this.prevMouseY=this.currentMouseY,Jt(this.transformMatrix,this.perspectiveMatrix,this.cameraTransformMatrix)}calculateReflection(e,t){let i=ae(e[0],e[1],e[2]);be(i,i,this.position);let r=U();_e(r,t,2*I(i,t)),be(i,i,r),Tn(i,i),Zt(i,i,e);let o=ae(e[0],e[1],e[2]);be(o,o,this.target),_e(r,t,2*I(o,t)),be(o,o,r),Tn(o,o),Zt(o,o,e);let a=ae(0,-1,0);this.reflectionPosition=i,this.cameraReflectionMatrix=this.defineTransformMatrix2(i,o,a),Jt(this.transformMatrixReflection,this.perspectiveMatrix,this.cameraReflectionMatrix)}defineTransformMatrix(e,t,i){let r=$(),o=U(),a=U(),s=U(),u=U(),c=U();c[0]=i[0],c[1]=i[1],c[2]=i[2],$e(o,e,t),Xe(a,o);let m=I(a,c),p=U();return _e(p,a,m),$e(s,c,p),Xe(s,s),En(u,a,s),r[0]=u[0],r[1]=s[0],r[2]=a[0],r[3]=0,r[4]=u[1],r[5]=s[1],r[6]=a[1],r[7]=0,r[8]=u[2],r[9]=s[2],r[10]=a[2],r[11]=0,r[12]=-I(e,u),r[13]=-I(e,s),r[14]=-I(e,a),r[15]=1,r}defineTransformMatrix2(e,t,i){let r=$(),o=U(),a=U(),s=U(),u=U(),c=U();c[0]=i[0],c[1]=i[1],c[2]=i[2],$e(o,e,t),Xe(a,o);let m=I(a,c),p=U();return _e(p,a,m),$e(s,c,p),Xe(s,s),En(u,s,a),r[0]=u[0],r[1]=s[0],r[2]=a[0],r[3]=0,r[4]=u[1],r[5]=s[1],r[6]=a[1],r[7]=0,r[8]=u[2],r[9]=s[2],r[10]=a[2],r[11]=0,r[12]=-I(e,u),r[13]=-I(e,s),r[14]=-I(e,a),r[15]=1,r}}var J=document.createElement("canvas"),ie=J.getContext("2d",{willReadFrequently:!0});J.style.position="absolute";J.style.top="0px";function Vr(n,e,t,i=.56,r=null){return J.width=t,J.height=t,J.style.width=`${t}px`,J.style.height=`${t}px`,r==null?(ie.fillStyle="black",ie.fillRect(0,0,J.width,J.height),ie.fillStyle="white",ie.textAlign="center",ie.font=`${e}px codrops`,ie.fillText(n,t*.5,t*.5+e*i)):ie.drawImage(r,0,0),ie.getImageData(0,0,t,t).data}var Hr=`struct Uniforms {
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

    
    var planeIndex = positionBuffer[i].a;
    var position = positionBuffer[i].rgb;
    var velocity = velocityBuffer[i].rgb;
    var origin = resetBuffer[ii].rgb;

    
    
    var dt = uniforms.deltaTime;
    var acceleration = vec3f(0.);
    var noiseAcceleration = uniforms.acceleration;
    var transition = uniforms.transition * 3.;
    var delta = 1.;

    var amp = 150.;
    var freq = .01;
    for(var k = 0; k < 2; k ++) {
        var c = curlNoise(freq * position );
        
        noiseAcceleration += amp * c;
        amp /= 2.;
        freq *= 2.;
    } 

    

    var resetAcceleration = 20. * (origin - position);

    if(transition < 1.) {
        acceleration = noiseAcceleration;
    } else {
        var transitionIndex = min(max(transition - planeIndex / uniforms.gridResolution - 1., 0.), 1.);
        
        acceleration = mix(noiseAcceleration, resetAcceleration + noiseAcceleration * (1. - transitionIndex), vec3f(transitionIndex));
    }

    var p1 = uniforms.cameraOrientation * vec4f(position, 1.);
    var p2 = uniforms.cameraOrientation * vec4f(uniforms.mousePosition, 1.);
    var intensity = 1. - length(p2.xy - p1.xy) / (5. + 10. * clamp(length(uniforms.mouseDirection), 0, 1) );
    intensity = clamp(intensity, 0., 1.);
    acceleration +=  0.1 * uniforms.mouseDirection * intensity / (dt * dt);

    position = position + dt * (velocity + dt * acceleration);

    
    positionBuffer[i] = vec4f(position, planeIndex);

    

    let textureSize = u32(uniforms.gridResolution);

    
    let voxelPosition = vec3<u32>( floor(position) );

    
    let index1D = voxelPosition.x + textureSize * voxelPosition.y + textureSize * textureSize * voxelPosition.z;

    
    let amountOfParticlesInVoxel = atomicAdd(&counterBuffer[index1D], 1);
    if(amountOfParticlesInVoxel < 4) {
        indicesBuffer[ u32( u32(4 * index1D) + u32(amountOfParticlesInVoxel) )] = i;
    }

}`,Yr=`struct Uniforms {
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

    
    offsets[0] = vec3<i32>(0, 0, 1);
    offsets[1] = vec3<i32>(0, 0, -1);
    offsets[2] = vec3<i32>(0, 1, 0);
    offsets[3] = vec3<i32>(0, -1, 0);
    offsets[4] = vec3<i32>(1, 0, 0);
    offsets[5] = vec3<i32>(-1, 0, 0);

    
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

    
    let center = uniforms.uResolution * vec3f(0.5, 0.5, 0.5);
    let boxSize = uniforms.uResolution * vec3f(0.2, 0.48, 0.48);
    let xLocal = endPosition - center;
    let contactPointLocal = min(boxSize, max(-boxSize, xLocal));
    let contactPoint = contactPointLocal + center;
    let distance = length(contactPoint - particlePosition);

    if(distance > 0.0) {endPosition = contactPoint;};

    positionBufferOUT[index1D] = vec4f(endPosition, lambdaPressure);
}`,$r=`struct Uniforms {
    deltaTime: f32,
    textureSize: f32,
    scatter: f32,
    dampening: f32
}

const EPSILON: f32 = 0.001;
 

@group(0) @binding(0) var<storage, read>  positionBufferOLD: array<vec4f>;
@group(0) @binding(1) var<storage, read>  positionBufferUPDATED: array<vec4f>;
@group(0) @binding(2) var<storage, read_write>  velocityBuffer: array<vec4f>;
@group(0) @binding(3) var<uniform>  uniforms: Uniforms;
@group(0) @binding(4) var texture3D: texture_storage_3d<rgba32float, write>;

@compute @workgroup_size(256) fn main( @builtin(global_invocation_id) id: vec3<u32> ) {

    let index1D = id.x;

    var velocity = positionBufferUPDATED[index1D].rgb - positionBufferOLD[index1D].rgb;
    velocity /= (max(uniforms.deltaTime, EPSILON));
    var speed = length(velocity);
    if(speed > 0.) {
        speed = min(40., speed);
        velocity = speed  * normalize(velocity);
    }

    var dampening = 3. * uniforms.dampening;
    if(dampening > 2.) {
        velocity *= 1. - 0.8 * fract(dampening);
    }

    

    velocityBuffer[index1D] = vec4f(velocity, 1.);
      
    
    var tSize = f32(textureDimensions(texture3D).x);
    var normalizedPosition = positionBufferUPDATED[index1D].rgb / uniforms.textureSize;
    normalizedPosition *= tSize;

    let size: u32 = 2;
    for(var i: u32 = 0; i < size; i ++) {
        for(var j: u32 = 0; j < size; j ++) {
            for(var k: u32 = 0; k < size; k ++) {
                textureStore(texture3D, vec3<u32>(floor(normalizedPosition)) + vec3u(i, j , k), vec4f(1., velocity) );
            }
        }
    }
    
}`,Xr=`struct Uniforms {
    lightIntensity: f32
}

@group(0) @binding(0) var texture3D: texture_storage_3d<rgba32float, write>;
@group(0) @binding(1) var<uniform>  uniforms: Uniforms;

@compute @workgroup_size(1, 1, 1) fn main( @builtin(global_invocation_id) id: vec3<u32> ) {

    textureStore(texture3D, id, vec4f(0.));

}`;const Wr=120;let qr=1.8,jr=3,B=null,k=null,ne=null,We,ft=0,Re,De,xt,Qt,hn,yt,A,qe,Z,Q,Ge,Ee,xe=U(),Kr=U(),ct=U(),q=U(),wt=[];const Jr=window.location.search,or=new URLSearchParams(Jr),Zr=or.get("word")||"CODROPS";let An=Zr.toUpperCase().split(""),Qr=[.57,.56,.583,.59,.56,.59,.56],ee=0,ht=0,Un=0,ar=0,en=new Image,On=Promise.create();function tn(){ee>An.length-1&&(ee=or.get("word")?0:-1);let n=An[Math.max(ee,0)],e=Qr[Math.max(ee,0)],t=[];var i=0;let r=new Float32Array(We*4);const o=Vr(n,B*.8,B,e,ee==-1?en:null);let a=0,s=0,u=.43*B;if(ee>-1)for(;s<We;){a=0;for(let p=0;p<B;p++){a=0;for(let d=0;d<B;d++){let g=B-d+B*B-p*B;if(o[4*g]>10&&s<We){var c=[u+Math.random()*i,p+Math.random()*i,d+Math.random()*i,a];t.push(c),s++}a++}}u++}else for(let p=0;p<B;p++)for(let d=0;d<B;d++){for(let g=0;g<B;g++){let h=Math.abs(d-B*.5),v=Math.abs(g-B*.5),w=B*.5-Math.floor(Math.sqrt(h*h+v*v)),E=B-w+B*B-p*B;if(o[4*E]>10&&s<We){var c=[g+Math.random()*i+0*B,p+Math.random()*i,d+Math.random()*i,a];t.push(c),s++,a++}}a=0}function m(p,d){return p[3]-d[3]}return t=t.sort(m),t=t.flat(1/0),ht=t.length/4,ar=Math.max(ht,Un),Un=ht,r.set(t,0),r}function ei(){let n=tn();Re=k.createBuffer({label:"position buffer",size:ne,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC}),k.queue.writeBuffer(Re,0,n),wt=k.createBuffer({label:"next letter buffer",size:ne,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC}),ee++;let e=tn();k.queue.writeBuffer(wt,0,e),De=k.createBuffer({label:"position buffer 1",size:ne,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC}),xt=k.createBuffer({label:"position buffer 2",size:ne,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC}),Qt=k.createBuffer({label:"velocity buffer 1",size:ne,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC}),yt=k.createBuffer({label:"indices buffer data",size:Math.pow(B,3)*4*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC}),hn=k.createBuffer({label:"counterBuffer buffer",size:Math.pow(B,3)*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}async function ti(n,e,t,i){return B=n,We=e,ne=e*4*4,k=G,Ge=t,Ee=i,en.addEventListener("load",r=>{console.log("image loaded"),On.resolve()}),en.src="./assets/drop120.png",await On,ei(),A=await re("forces",Hr,new Array(80).fill(0)),qe=await re("displacement",Yr,[B,qr,0],[De,xt,yt,"uniforms"]),Z=await re("velocity",$r,[0,B,0,1]),A.setBindGroup([{binding:0,resource:{buffer:wt}},{binding:1,resource:{buffer:De}},{binding:2,resource:{buffer:Qt}},{binding:3,resource:{buffer:hn}},{binding:4,resource:{buffer:yt}},{binding:5,resource:{buffer:A.uniformsBuffer}}]),Z.setBindGroup([{binding:0,resource:{buffer:Re}},{binding:1,resource:{buffer:xt}},{binding:2,resource:{buffer:Qt}},{binding:3,resource:{buffer:Z.uniformsBuffer}},{binding:4,resource:Ge.createView({baseMipLevel:0,mipLevelCount:1})}]),Q=await re("fill texture",Xr,[0]),Q.setBindGroup([{binding:0,resource:Ge.createView({baseMipLevel:0,mipLevelCount:1})},{binding:1,resource:{buffer:Q.uniformsBuffer}}]),document.addEventListener("mousemove",ni),Re}function ni(n){let e=2*n.clientX/window.innerWidth-1,t=1-2*n.clientY/window.innerHeight,i=ae(e,t,0),r=ae(e,t,1),o=$(),a=$();Cn(o,Ee.cameraTransformMatrix),Cn(a,Ee.perspectiveMatrix);let s=$();Jt(s,o,a),lt(i,i,s),lt(r,r,s),_e(i,i,B),_e(r,r,B);let u=U();be(u,r,i),Xe(u,u);let c=ae(0,0,-1),m=ae(0,0,.35*B);lt(c,c,Ee.orientationMatrix),lt(m,m,Ee.orientationMatrix);let p=0;const d=I(u,c);d>1e-4&&(be(m,m,i),p=I(m,c)/d),_e(u,u,p),Zt(i,i,u),xe[0]=i[0],xe[1]=i[1],xe[2]=i[2]}function ri(n={x:0,y:-10,z:0},e=.01,t,i,r){var o=Wr,a=ft%o;const s=k.createCommandEncoder({label:"encoder"});if(a==0&&ft>10){ee++;let d=tn();k.queue.writeBuffer(wt,0,d),r.down||(r.alpha=Math.PI*.5-Math.random()*.1*Math.PI,r.beta=-Math.PI*.5+(2*Math.random()-1)*Math.PI*.4)}var u=a/o;function c(d){const g=s.beginComputePass({label:d.label});g.setPipeline(d.pipeline),g.setBindGroup(0,d.bindGroup),g.dispatchWorkgroups(ar/256),g.end()}be(ct,xe,Kr),q[0]+=(ct[0]-q[0])*.1,q[1]+=(ct[1]-q[1])*.1,q[2]+=(ct[2]-q[2])*.1;for(let d=0;d<16;d++)A.uniformsData[d]=Ee.orientationMatrix[d];A.uniformsData[16]=n.x,A.uniformsData[17]=n.y,A.uniformsData[18]=n.z,A.uniformsData[19]=e,A.uniformsData[20]=xe[0],A.uniformsData[21]=xe[1],A.uniformsData[22]=xe[2],A.uniformsData[23]=B,A.uniformsData[24]=q[0],A.uniformsData[25]=q[1],A.uniformsData[26]=q[2],A.uniformsData[27]=ft,A.uniformsData[28]=u,A.uniformsData[29]=ht,k.queue.writeBuffer(A.uniformsBuffer,0,A.uniformsData),ft+=1,Z.uniformsData[0]=e,Z.uniformsData[2]=t,Z.uniformsData[3]=u,k.queue.writeBuffer(Z.uniformsBuffer,0,Z.uniformsData),qe.uniformsData[2]=i,k.queue.writeBuffer(qe.uniformsBuffer,0,qe.uniformsData),s.copyBufferToBuffer(Re,0,De,0,ne),s.clearBuffer(hn),s.clearBuffer(yt),Q.uniformsData[0]=t,k.queue.writeBuffer(Q.uniformsBuffer,0,Q.uniformsData);const m=s.beginComputePass({label:Q.label});m.setPipeline(Q.pipeline),m.setBindGroup(0,Q.bindGroup),m.dispatchWorkgroups(Ge.width,Ge.width,Ge.width),m.end(),c(A);for(let d=0;d<jr;d++)c(qe),s.copyBufferToBuffer(xt,0,De,0,ne);c(Z),s.copyBufferToBuffer(De,0,Re,0,ne);const p=s.finish();return k.queue.submit([p]),{animationFrame:a,relativeFrame:u,currentLetter:ee}}var ii=`@group(0) @binding(0) var textureRead: texture_3d<f32>;
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

}`;Promise.create();let Dn=!1,Lt,zt;async function oi(n,e){if(!Dn){let o=Promise.create();Oe(ii).then(a=>{Lt=a.pipeline,o.resolve()}),await o,zt=[];for(let a=0;a<n.mipLevelCount-1;a++){const s=e.createBindGroup({label:"bind group for mipmap",layout:Lt.getBindGroupLayout(0),entries:[{binding:0,resource:n.createView({baseMipLevel:a,mipLevelCount:1})},{binding:1,resource:n.createView({baseMipLevel:a+1,mipLevelCount:1})}]});zt.push(s)}Dn=!0}const t=e.createCommandEncoder({label:"encoder"}),i=t.beginComputePass({label:"mipmap pass"});i.setPipeline(Lt);for(let o=0;o<n.mipLevelCount-1;o++){let a=Math.pow(2,n.mipLevelCount-o-1);i.setBindGroup(0,zt[o]),i.dispatchWorkgroups(a,a,a)}i.end();const r=t.finish();e.queue.submit([r])}const ai=[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,8,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,1,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,8,3,9,8,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,2,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,8,3,1,2,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,9,2,10,0,2,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,2,8,3,2,10,8,10,9,8,-1,-1,-1,-1,-1,-1,3,11,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,11,2,8,11,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,9,0,2,3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,11,2,1,9,11,9,8,11,-1,-1,-1,-1,-1,-1,3,10,1,11,10,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,10,1,0,8,10,8,11,10,-1,-1,-1,-1,-1,-1,3,9,0,3,11,9,11,10,9,-1,-1,-1,-1,-1,-1,9,8,10,10,8,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,4,7,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,4,3,0,7,3,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,1,9,8,4,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,4,1,9,4,7,1,7,3,1,-1,-1,-1,-1,-1,-1,1,2,10,8,4,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,3,4,7,3,0,4,1,2,10,-1,-1,-1,-1,-1,-1,9,2,10,9,0,2,8,4,7,-1,-1,-1,-1,-1,-1,2,10,9,2,9,7,2,7,3,7,9,4,-1,-1,-1,8,4,7,3,11,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,11,4,7,11,2,4,2,0,4,-1,-1,-1,-1,-1,-1,9,0,1,8,4,7,2,3,11,-1,-1,-1,-1,-1,-1,4,7,11,9,4,11,9,11,2,9,2,1,-1,-1,-1,3,10,1,3,11,10,7,8,4,-1,-1,-1,-1,-1,-1,1,11,10,1,4,11,1,0,4,7,11,4,-1,-1,-1,4,7,8,9,0,11,9,11,10,11,0,3,-1,-1,-1,4,7,11,4,11,9,9,11,10,-1,-1,-1,-1,-1,-1,9,5,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,9,5,4,0,8,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,5,4,1,5,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,8,5,4,8,3,5,3,1,5,-1,-1,-1,-1,-1,-1,1,2,10,9,5,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,3,0,8,1,2,10,4,9,5,-1,-1,-1,-1,-1,-1,5,2,10,5,4,2,4,0,2,-1,-1,-1,-1,-1,-1,2,10,5,3,2,5,3,5,4,3,4,8,-1,-1,-1,9,5,4,2,3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,11,2,0,8,11,4,9,5,-1,-1,-1,-1,-1,-1,0,5,4,0,1,5,2,3,11,-1,-1,-1,-1,-1,-1,2,1,5,2,5,8,2,8,11,4,8,5,-1,-1,-1,10,3,11,10,1,3,9,5,4,-1,-1,-1,-1,-1,-1,4,9,5,0,8,1,8,10,1,8,11,10,-1,-1,-1,5,4,0,5,0,11,5,11,10,11,0,3,-1,-1,-1,5,4,8,5,8,10,10,8,11,-1,-1,-1,-1,-1,-1,9,7,8,5,7,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,9,3,0,9,5,3,5,7,3,-1,-1,-1,-1,-1,-1,0,7,8,0,1,7,1,5,7,-1,-1,-1,-1,-1,-1,1,5,3,3,5,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,9,7,8,9,5,7,10,1,2,-1,-1,-1,-1,-1,-1,10,1,2,9,5,0,5,3,0,5,7,3,-1,-1,-1,8,0,2,8,2,5,8,5,7,10,5,2,-1,-1,-1,2,10,5,2,5,3,3,5,7,-1,-1,-1,-1,-1,-1,7,9,5,7,8,9,3,11,2,-1,-1,-1,-1,-1,-1,9,5,7,9,7,2,9,2,0,2,7,11,-1,-1,-1,2,3,11,0,1,8,1,7,8,1,5,7,-1,-1,-1,11,2,1,11,1,7,7,1,5,-1,-1,-1,-1,-1,-1,9,5,8,8,5,7,10,1,3,10,3,11,-1,-1,-1,5,7,0,5,0,9,7,11,0,1,0,10,11,10,0,11,10,0,11,0,3,10,5,0,8,0,7,5,7,0,11,10,5,7,11,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,10,6,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,8,3,5,10,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,9,0,1,5,10,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,8,3,1,9,8,5,10,6,-1,-1,-1,-1,-1,-1,1,6,5,2,6,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,6,5,1,2,6,3,0,8,-1,-1,-1,-1,-1,-1,9,6,5,9,0,6,0,2,6,-1,-1,-1,-1,-1,-1,5,9,8,5,8,2,5,2,6,3,2,8,-1,-1,-1,2,3,11,10,6,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,11,0,8,11,2,0,10,6,5,-1,-1,-1,-1,-1,-1,0,1,9,2,3,11,5,10,6,-1,-1,-1,-1,-1,-1,5,10,6,1,9,2,9,11,2,9,8,11,-1,-1,-1,6,3,11,6,5,3,5,1,3,-1,-1,-1,-1,-1,-1,0,8,11,0,11,5,0,5,1,5,11,6,-1,-1,-1,3,11,6,0,3,6,0,6,5,0,5,9,-1,-1,-1,6,5,9,6,9,11,11,9,8,-1,-1,-1,-1,-1,-1,5,10,6,4,7,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,4,3,0,4,7,3,6,5,10,-1,-1,-1,-1,-1,-1,1,9,0,5,10,6,8,4,7,-1,-1,-1,-1,-1,-1,10,6,5,1,9,7,1,7,3,7,9,4,-1,-1,-1,6,1,2,6,5,1,4,7,8,-1,-1,-1,-1,-1,-1,1,2,5,5,2,6,3,0,4,3,4,7,-1,-1,-1,8,4,7,9,0,5,0,6,5,0,2,6,-1,-1,-1,7,3,9,7,9,4,3,2,9,5,9,6,2,6,9,3,11,2,7,8,4,10,6,5,-1,-1,-1,-1,-1,-1,5,10,6,4,7,2,4,2,0,2,7,11,-1,-1,-1,0,1,9,4,7,8,2,3,11,5,10,6,-1,-1,-1,9,2,1,9,11,2,9,4,11,7,11,4,5,10,6,8,4,7,3,11,5,3,5,1,5,11,6,-1,-1,-1,5,1,11,5,11,6,1,0,11,7,11,4,0,4,11,0,5,9,0,6,5,0,3,6,11,6,3,8,4,7,6,5,9,6,9,11,4,7,9,7,11,9,-1,-1,-1,10,4,9,6,4,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,4,10,6,4,9,10,0,8,3,-1,-1,-1,-1,-1,-1,10,0,1,10,6,0,6,4,0,-1,-1,-1,-1,-1,-1,8,3,1,8,1,6,8,6,4,6,1,10,-1,-1,-1,1,4,9,1,2,4,2,6,4,-1,-1,-1,-1,-1,-1,3,0,8,1,2,9,2,4,9,2,6,4,-1,-1,-1,0,2,4,4,2,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,8,3,2,8,2,4,4,2,6,-1,-1,-1,-1,-1,-1,10,4,9,10,6,4,11,2,3,-1,-1,-1,-1,-1,-1,0,8,2,2,8,11,4,9,10,4,10,6,-1,-1,-1,3,11,2,0,1,6,0,6,4,6,1,10,-1,-1,-1,6,4,1,6,1,10,4,8,1,2,1,11,8,11,1,9,6,4,9,3,6,9,1,3,11,6,3,-1,-1,-1,8,11,1,8,1,0,11,6,1,9,1,4,6,4,1,3,11,6,3,6,0,0,6,4,-1,-1,-1,-1,-1,-1,6,4,8,11,6,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,7,10,6,7,8,10,8,9,10,-1,-1,-1,-1,-1,-1,0,7,3,0,10,7,0,9,10,6,7,10,-1,-1,-1,10,6,7,1,10,7,1,7,8,1,8,0,-1,-1,-1,10,6,7,10,7,1,1,7,3,-1,-1,-1,-1,-1,-1,1,2,6,1,6,8,1,8,9,8,6,7,-1,-1,-1,2,6,9,2,9,1,6,7,9,0,9,3,7,3,9,7,8,0,7,0,6,6,0,2,-1,-1,-1,-1,-1,-1,7,3,2,6,7,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,2,3,11,10,6,8,10,8,9,8,6,7,-1,-1,-1,2,0,7,2,7,11,0,9,7,6,7,10,9,10,7,1,8,0,1,7,8,1,10,7,6,7,10,2,3,11,11,2,1,11,1,7,10,6,1,6,7,1,-1,-1,-1,8,9,6,8,6,7,9,1,6,11,6,3,1,3,6,0,9,1,11,6,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,7,8,0,7,0,6,3,11,0,11,6,0,-1,-1,-1,7,11,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,7,6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,3,0,8,11,7,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,1,9,11,7,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,8,1,9,8,3,1,11,7,6,-1,-1,-1,-1,-1,-1,10,1,2,6,11,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,2,10,3,0,8,6,11,7,-1,-1,-1,-1,-1,-1,2,9,0,2,10,9,6,11,7,-1,-1,-1,-1,-1,-1,6,11,7,2,10,3,10,8,3,10,9,8,-1,-1,-1,7,2,3,6,2,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,7,0,8,7,6,0,6,2,0,-1,-1,-1,-1,-1,-1,2,7,6,2,3,7,0,1,9,-1,-1,-1,-1,-1,-1,1,6,2,1,8,6,1,9,8,8,7,6,-1,-1,-1,10,7,6,10,1,7,1,3,7,-1,-1,-1,-1,-1,-1,10,7,6,1,7,10,1,8,7,1,0,8,-1,-1,-1,0,3,7,0,7,10,0,10,9,6,10,7,-1,-1,-1,7,6,10,7,10,8,8,10,9,-1,-1,-1,-1,-1,-1,6,8,4,11,8,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,3,6,11,3,0,6,0,4,6,-1,-1,-1,-1,-1,-1,8,6,11,8,4,6,9,0,1,-1,-1,-1,-1,-1,-1,9,4,6,9,6,3,9,3,1,11,3,6,-1,-1,-1,6,8,4,6,11,8,2,10,1,-1,-1,-1,-1,-1,-1,1,2,10,3,0,11,0,6,11,0,4,6,-1,-1,-1,4,11,8,4,6,11,0,2,9,2,10,9,-1,-1,-1,10,9,3,10,3,2,9,4,3,11,3,6,4,6,3,8,2,3,8,4,2,4,6,2,-1,-1,-1,-1,-1,-1,0,4,2,4,6,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,9,0,2,3,4,2,4,6,4,3,8,-1,-1,-1,1,9,4,1,4,2,2,4,6,-1,-1,-1,-1,-1,-1,8,1,3,8,6,1,8,4,6,6,10,1,-1,-1,-1,10,1,0,10,0,6,6,0,4,-1,-1,-1,-1,-1,-1,4,6,3,4,3,8,6,10,3,0,3,9,10,9,3,10,9,4,6,10,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,4,9,5,7,6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,8,3,4,9,5,11,7,6,-1,-1,-1,-1,-1,-1,5,0,1,5,4,0,7,6,11,-1,-1,-1,-1,-1,-1,11,7,6,8,3,4,3,5,4,3,1,5,-1,-1,-1,9,5,4,10,1,2,7,6,11,-1,-1,-1,-1,-1,-1,6,11,7,1,2,10,0,8,3,4,9,5,-1,-1,-1,7,6,11,5,4,10,4,2,10,4,0,2,-1,-1,-1,3,4,8,3,5,4,3,2,5,10,5,2,11,7,6,7,2,3,7,6,2,5,4,9,-1,-1,-1,-1,-1,-1,9,5,4,0,8,6,0,6,2,6,8,7,-1,-1,-1,3,6,2,3,7,6,1,5,0,5,4,0,-1,-1,-1,6,2,8,6,8,7,2,1,8,4,8,5,1,5,8,9,5,4,10,1,6,1,7,6,1,3,7,-1,-1,-1,1,6,10,1,7,6,1,0,7,8,7,0,9,5,4,4,0,10,4,10,5,0,3,10,6,10,7,3,7,10,7,6,10,7,10,8,5,4,10,4,8,10,-1,-1,-1,6,9,5,6,11,9,11,8,9,-1,-1,-1,-1,-1,-1,3,6,11,0,6,3,0,5,6,0,9,5,-1,-1,-1,0,11,8,0,5,11,0,1,5,5,6,11,-1,-1,-1,6,11,3,6,3,5,5,3,1,-1,-1,-1,-1,-1,-1,1,2,10,9,5,11,9,11,8,11,5,6,-1,-1,-1,0,11,3,0,6,11,0,9,6,5,6,9,1,2,10,11,8,5,11,5,6,8,0,5,10,5,2,0,2,5,6,11,3,6,3,5,2,10,3,10,5,3,-1,-1,-1,5,8,9,5,2,8,5,6,2,3,8,2,-1,-1,-1,9,5,6,9,6,0,0,6,2,-1,-1,-1,-1,-1,-1,1,5,8,1,8,0,5,6,8,3,8,2,6,2,8,1,5,6,2,1,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,3,6,1,6,10,3,8,6,5,6,9,8,9,6,10,1,0,10,0,6,9,5,0,5,6,0,-1,-1,-1,0,3,8,5,6,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,10,5,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,11,5,10,7,5,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,11,5,10,11,7,5,8,3,0,-1,-1,-1,-1,-1,-1,5,11,7,5,10,11,1,9,0,-1,-1,-1,-1,-1,-1,10,7,5,10,11,7,9,8,1,8,3,1,-1,-1,-1,11,1,2,11,7,1,7,5,1,-1,-1,-1,-1,-1,-1,0,8,3,1,2,7,1,7,5,7,2,11,-1,-1,-1,9,7,5,9,2,7,9,0,2,2,11,7,-1,-1,-1,7,5,2,7,2,11,5,9,2,3,2,8,9,8,2,2,5,10,2,3,5,3,7,5,-1,-1,-1,-1,-1,-1,8,2,0,8,5,2,8,7,5,10,2,5,-1,-1,-1,9,0,1,5,10,3,5,3,7,3,10,2,-1,-1,-1,9,8,2,9,2,1,8,7,2,10,2,5,7,5,2,1,3,5,3,7,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,8,7,0,7,1,1,7,5,-1,-1,-1,-1,-1,-1,9,0,3,9,3,5,5,3,7,-1,-1,-1,-1,-1,-1,9,8,7,5,9,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,5,8,4,5,10,8,10,11,8,-1,-1,-1,-1,-1,-1,5,0,4,5,11,0,5,10,11,11,3,0,-1,-1,-1,0,1,9,8,4,10,8,10,11,10,4,5,-1,-1,-1,10,11,4,10,4,5,11,3,4,9,4,1,3,1,4,2,5,1,2,8,5,2,11,8,4,5,8,-1,-1,-1,0,4,11,0,11,3,4,5,11,2,11,1,5,1,11,0,2,5,0,5,9,2,11,5,4,5,8,11,8,5,9,4,5,2,11,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,2,5,10,3,5,2,3,4,5,3,8,4,-1,-1,-1,5,10,2,5,2,4,4,2,0,-1,-1,-1,-1,-1,-1,3,10,2,3,5,10,3,8,5,4,5,8,0,1,9,5,10,2,5,2,4,1,9,2,9,4,2,-1,-1,-1,8,4,5,8,5,3,3,5,1,-1,-1,-1,-1,-1,-1,0,4,5,1,0,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,8,4,5,8,5,3,9,0,5,0,3,5,-1,-1,-1,9,4,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,4,11,7,4,9,11,9,10,11,-1,-1,-1,-1,-1,-1,0,8,3,4,9,7,9,11,7,9,10,11,-1,-1,-1,1,10,11,1,11,4,1,4,0,7,4,11,-1,-1,-1,3,1,4,3,4,8,1,10,4,7,4,11,10,11,4,4,11,7,9,11,4,9,2,11,9,1,2,-1,-1,-1,9,7,4,9,11,7,9,1,11,2,11,1,0,8,3,11,7,4,11,4,2,2,4,0,-1,-1,-1,-1,-1,-1,11,7,4,11,4,2,8,3,4,3,2,4,-1,-1,-1,2,9,10,2,7,9,2,3,7,7,4,9,-1,-1,-1,9,10,7,9,7,4,10,2,7,8,7,0,2,0,7,3,7,10,3,10,2,7,4,10,1,10,0,4,0,10,1,10,2,8,7,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,4,9,1,4,1,7,7,1,3,-1,-1,-1,-1,-1,-1,4,9,1,4,1,7,0,8,1,8,7,1,-1,-1,-1,4,0,3,7,4,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,4,8,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,9,10,8,10,11,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,3,0,9,3,9,11,11,9,10,-1,-1,-1,-1,-1,-1,0,1,10,0,10,8,8,10,11,-1,-1,-1,-1,-1,-1,3,1,10,11,3,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,2,11,1,11,9,9,11,8,-1,-1,-1,-1,-1,-1,3,0,9,3,9,11,1,2,9,2,11,9,-1,-1,-1,0,2,11,8,0,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,3,2,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,2,3,8,2,8,10,10,8,9,-1,-1,-1,-1,-1,-1,9,10,2,0,9,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,2,3,8,2,8,10,0,1,8,1,10,8,-1,-1,-1,1,10,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,3,8,9,1,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,9,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,3,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],Gn=[[],[0,8,3],[0,1,9],[1,8,3,9,8,1],[1,2,10],[0,8,3,1,2,10],[9,2,10,0,2,9],[2,8,3,2,10,8,10,9,8],[3,11,2],[0,11,2,8,11,0],[1,9,0,2,3,11],[1,11,2,1,9,11,9,8,11],[3,10,1,11,10,3],[0,10,1,0,8,10,8,11,10],[3,9,0,3,11,9,11,10,9],[9,8,10,10,8,11],[4,7,8],[4,3,0,7,3,4],[0,1,9,8,4,7],[4,1,9,4,7,1,7,3,1],[1,2,10,8,4,7],[3,4,7,3,0,4,1,2,10],[9,2,10,9,0,2,8,4,7],[2,10,9,2,9,7,2,7,3,7,9,4],[8,4,7,3,11,2],[11,4,7,11,2,4,2,0,4],[9,0,1,8,4,7,2,3,11],[4,7,11,9,4,11,9,11,2,9,2,1],[3,10,1,3,11,10,7,8,4],[1,11,10,1,4,11,1,0,4,7,11,4],[4,7,8,9,0,11,9,11,10,11,0,3],[4,7,11,4,11,9,9,11,10],[9,5,4],[9,5,4,0,8,3],[0,5,4,1,5,0],[8,5,4,8,3,5,3,1,5],[1,2,10,9,5,4],[3,0,8,1,2,10,4,9,5],[5,2,10,5,4,2,4,0,2],[2,10,5,3,2,5,3,5,4,3,4,8],[9,5,4,2,3,11],[0,11,2,0,8,11,4,9,5],[0,5,4,0,1,5,2,3,11],[2,1,5,2,5,8,2,8,11,4,8,5],[10,3,11,10,1,3,9,5,4],[4,9,5,0,8,1,8,10,1,8,11,10],[5,4,0,5,0,11,5,11,10,11,0,3],[5,4,8,5,8,10,10,8,11],[9,7,8,5,7,9],[9,3,0,9,5,3,5,7,3],[0,7,8,0,1,7,1,5,7],[1,5,3,3,5,7],[9,7,8,9,5,7,10,1,2],[10,1,2,9,5,0,5,3,0,5,7,3],[8,0,2,8,2,5,8,5,7,10,5,2],[2,10,5,2,5,3,3,5,7],[7,9,5,7,8,9,3,11,2],[9,5,7,9,7,2,9,2,0,2,7,11],[2,3,11,0,1,8,1,7,8,1,5,7],[11,2,1,11,1,7,7,1,5],[9,5,8,8,5,7,10,1,3,10,3,11],[5,7,0,5,0,9,7,11,0,1,0,10,11,10,0],[11,10,0,11,0,3,10,5,0,8,0,7,5,7,0],[11,10,5,7,11,5],[10,6,5],[0,8,3,5,10,6],[9,0,1,5,10,6],[1,8,3,1,9,8,5,10,6],[1,6,5,2,6,1],[1,6,5,1,2,6,3,0,8],[9,6,5,9,0,6,0,2,6],[5,9,8,5,8,2,5,2,6,3,2,8],[2,3,11,10,6,5],[11,0,8,11,2,0,10,6,5],[0,1,9,2,3,11,5,10,6],[5,10,6,1,9,2,9,11,2,9,8,11],[6,3,11,6,5,3,5,1,3],[0,8,11,0,11,5,0,5,1,5,11,6],[3,11,6,0,3,6,0,6,5,0,5,9],[6,5,9,6,9,11,11,9,8],[5,10,6,4,7,8],[4,3,0,4,7,3,6,5,10],[1,9,0,5,10,6,8,4,7],[10,6,5,1,9,7,1,7,3,7,9,4],[6,1,2,6,5,1,4,7,8],[1,2,5,5,2,6,3,0,4,3,4,7],[8,4,7,9,0,5,0,6,5,0,2,6],[7,3,9,7,9,4,3,2,9,5,9,6,2,6,9],[3,11,2,7,8,4,10,6,5],[5,10,6,4,7,2,4,2,0,2,7,11],[0,1,9,4,7,8,2,3,11,5,10,6],[9,2,1,9,11,2,9,4,11,7,11,4,5,10,6],[8,4,7,3,11,5,3,5,1,5,11,6],[5,1,11,5,11,6,1,0,11,7,11,4,0,4,11],[0,5,9,0,6,5,0,3,6,11,6,3,8,4,7],[6,5,9,6,9,11,4,7,9,7,11,9],[10,4,9,6,4,10],[4,10,6,4,9,10,0,8,3],[10,0,1,10,6,0,6,4,0],[8,3,1,8,1,6,8,6,4,6,1,10],[1,4,9,1,2,4,2,6,4],[3,0,8,1,2,9,2,4,9,2,6,4],[0,2,4,4,2,6],[8,3,2,8,2,4,4,2,6],[10,4,9,10,6,4,11,2,3],[0,8,2,2,8,11,4,9,10,4,10,6],[3,11,2,0,1,6,0,6,4,6,1,10],[6,4,1,6,1,10,4,8,1,2,1,11,8,11,1],[9,6,4,9,3,6,9,1,3,11,6,3],[8,11,1,8,1,0,11,6,1,9,1,4,6,4,1],[3,11,6,3,6,0,0,6,4],[6,4,8,11,6,8],[7,10,6,7,8,10,8,9,10],[0,7,3,0,10,7,0,9,10,6,7,10],[10,6,7,1,10,7,1,7,8,1,8,0],[10,6,7,10,7,1,1,7,3],[1,2,6,1,6,8,1,8,9,8,6,7],[2,6,9,2,9,1,6,7,9,0,9,3,7,3,9],[7,8,0,7,0,6,6,0,2],[7,3,2,6,7,2],[2,3,11,10,6,8,10,8,9,8,6,7],[2,0,7,2,7,11,0,9,7,6,7,10,9,10,7],[1,8,0,1,7,8,1,10,7,6,7,10,2,3,11],[11,2,1,11,1,7,10,6,1,6,7,1],[8,9,6,8,6,7,9,1,6,11,6,3,1,3,6],[0,9,1,11,6,7],[7,8,0,7,0,6,3,11,0,11,6,0],[7,11,6],[7,6,11],[3,0,8,11,7,6],[0,1,9,11,7,6],[8,1,9,8,3,1,11,7,6],[10,1,2,6,11,7],[1,2,10,3,0,8,6,11,7],[2,9,0,2,10,9,6,11,7],[6,11,7,2,10,3,10,8,3,10,9,8],[7,2,3,6,2,7],[7,0,8,7,6,0,6,2,0],[2,7,6,2,3,7,0,1,9],[1,6,2,1,8,6,1,9,8,8,7,6],[10,7,6,10,1,7,1,3,7],[10,7,6,1,7,10,1,8,7,1,0,8],[0,3,7,0,7,10,0,10,9,6,10,7],[7,6,10,7,10,8,8,10,9],[6,8,4,11,8,6],[3,6,11,3,0,6,0,4,6],[8,6,11,8,4,6,9,0,1],[9,4,6,9,6,3,9,3,1,11,3,6],[6,8,4,6,11,8,2,10,1],[1,2,10,3,0,11,0,6,11,0,4,6],[4,11,8,4,6,11,0,2,9,2,10,9],[10,9,3,10,3,2,9,4,3,11,3,6,4,6,3],[8,2,3,8,4,2,4,6,2],[0,4,2,4,6,2],[1,9,0,2,3,4,2,4,6,4,3,8],[1,9,4,1,4,2,2,4,6],[8,1,3,8,6,1,8,4,6,6,10,1],[10,1,0,10,0,6,6,0,4],[4,6,3,4,3,8,6,10,3,0,3,9,10,9,3],[10,9,4,6,10,4],[4,9,5,7,6,11],[0,8,3,4,9,5,11,7,6],[5,0,1,5,4,0,7,6,11],[11,7,6,8,3,4,3,5,4,3,1,5],[9,5,4,10,1,2,7,6,11],[6,11,7,1,2,10,0,8,3,4,9,5],[7,6,11,5,4,10,4,2,10,4,0,2],[3,4,8,3,5,4,3,2,5,10,5,2,11,7,6],[7,2,3,7,6,2,5,4,9],[9,5,4,0,8,6,0,6,2,6,8,7],[3,6,2,3,7,6,1,5,0,5,4,0],[6,2,8,6,8,7,2,1,8,4,8,5,1,5,8],[9,5,4,10,1,6,1,7,6,1,3,7],[1,6,10,1,7,6,1,0,7,8,7,0,9,5,4],[4,0,10,4,10,5,0,3,10,6,10,7,3,7,10],[7,6,10,7,10,8,5,4,10,4,8,10],[6,9,5,6,11,9,11,8,9],[3,6,11,0,6,3,0,5,6,0,9,5],[0,11,8,0,5,11,0,1,5,5,6,11],[6,11,3,6,3,5,5,3,1],[1,2,10,9,5,11,9,11,8,11,5,6],[0,11,3,0,6,11,0,9,6,5,6,9,1,2,10],[11,8,5,11,5,6,8,0,5,10,5,2,0,2,5],[6,11,3,6,3,5,2,10,3,10,5,3],[5,8,9,5,2,8,5,6,2,3,8,2],[9,5,6,9,6,0,0,6,2],[1,5,8,1,8,0,5,6,8,3,8,2,6,2,8],[1,5,6,2,1,6],[1,3,6,1,6,10,3,8,6,5,6,9,8,9,6],[10,1,0,10,0,6,9,5,0,5,6,0],[0,3,8,5,6,10],[10,5,6],[11,5,10,7,5,11],[11,5,10,11,7,5,8,3,0],[5,11,7,5,10,11,1,9,0],[10,7,5,10,11,7,9,8,1,8,3,1],[11,1,2,11,7,1,7,5,1],[0,8,3,1,2,7,1,7,5,7,2,11],[9,7,5,9,2,7,9,0,2,2,11,7],[7,5,2,7,2,11,5,9,2,3,2,8,9,8,2],[2,5,10,2,3,5,3,7,5],[8,2,0,8,5,2,8,7,5,10,2,5],[9,0,1,5,10,3,5,3,7,3,10,2],[9,8,2,9,2,1,8,7,2,10,2,5,7,5,2],[1,3,5,3,7,5],[0,8,7,0,7,1,1,7,5],[9,0,3,9,3,5,5,3,7],[9,8,7,5,9,7],[5,8,4,5,10,8,10,11,8],[5,0,4,5,11,0,5,10,11,11,3,0],[0,1,9,8,4,10,8,10,11,10,4,5],[10,11,4,10,4,5,11,3,4,9,4,1,3,1,4],[2,5,1,2,8,5,2,11,8,4,5,8],[0,4,11,0,11,3,4,5,11,2,11,1,5,1,11],[0,2,5,0,5,9,2,11,5,4,5,8,11,8,5],[9,4,5,2,11,3],[2,5,10,3,5,2,3,4,5,3,8,4],[5,10,2,5,2,4,4,2,0],[3,10,2,3,5,10,3,8,5,4,5,8,0,1,9],[5,10,2,5,2,4,1,9,2,9,4,2],[8,4,5,8,5,3,3,5,1],[0,4,5,1,0,5],[8,4,5,8,5,3,9,0,5,0,3,5],[9,4,5],[4,11,7,4,9,11,9,10,11],[0,8,3,4,9,7,9,11,7,9,10,11],[1,10,11,1,11,4,1,4,0,7,4,11],[3,1,4,3,4,8,1,10,4,7,4,11,10,11,4],[4,11,7,9,11,4,9,2,11,9,1,2],[9,7,4,9,11,7,9,1,11,2,11,1,0,8,3],[11,7,4,11,4,2,2,4,0],[11,7,4,11,4,2,8,3,4,3,2,4],[2,9,10,2,7,9,2,3,7,7,4,9],[9,10,7,9,7,4,10,2,7,8,7,0,2,0,7],[3,7,10,3,10,2,7,4,10,1,10,0,4,0,10],[1,10,2,8,7,4],[4,9,1,4,1,7,7,1,3],[4,9,1,4,1,7,0,8,1,8,7,1],[4,0,3,7,4,3],[4,8,7],[9,10,8,10,11,8],[3,0,9,3,9,11,11,9,10],[0,1,10,0,10,8,8,10,11],[3,1,10,11,3,10],[1,2,11,1,11,9,9,11,8],[3,0,9,3,9,11,1,2,9,2,11,9],[0,2,11,8,0,11],[3,2,11],[2,3,8,2,8,10,10,8,9],[9,10,2,0,9,2],[2,3,8,2,8,10,0,1,8,1,10,8],[1,10,2],[1,3,8,9,1,8],[0,9,1],[0,3,8],[]];var si=`struct Uniforms {
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

    
    textureStore(texture_vct, id, vec4f(vec3(0., 0., 0.), value));

    if(id.y < 3) {
        textureStore(texture_vct, id, vec4f(vec3f(.0), .5));
    }

    
    if(value > 0.) {
        var index = atomicAdd(&voxelsIndex[0], 1);
        voxelsEnabled[index] = vec4f(vec3f(id), c);
    }
}`,ui=`@group(0) @binding(0) var<storage, read> voxelsBufferInput: array<i32>;
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
}`,li=`struct Uniforms {
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

    
    var currentVertex = indicesBuffer[i32(voxelData.w) * 15 + i32(currentIndex)];

    if(currentVertex == -1.) {
        positionBuffer[global_invocation_index] = vec4f(0, 0, 0, 0);
        return;
    }
    
    var m0 = vec4f(currentVertex, currentVertex, currentVertex, currentVertex);
    var m1 = vec4i(m0 == vec4f(0, 1, 2, 3));
    var m2 = vec4i(m0 == vec4f(4, 5, 6, 7));
    var m3 = vec4i(m0 == vec4f(8, 9, 10, 11));

    
    var corner0 = vec3i(position3D) + m1.y * p0 + m1.z * p1 + m1.w * p2 + m2.x * p3 + m2.y * p4 + m2.z * p5 + m2.w * p6 + m3.y * p0 + m3.z * p1 + m3.w * p2;
    var corner1 = vec3i(position3D) + m1.x * p0 + m1.y * p1 + m1.z * p2 + m2.x * p4 + m2.y * p5 + m2.z * p6 + m2.w * p3 + m3.x * p3 + m3.y * p4 + m3.z * p5 + m3.w * p6;

    var b0 = vec3f(corner0);
    var b1 = vec3f(corner1);    

    
    var n0 = textureLoad(potentialTexture, corner0, 0).r;
    var n1 = textureLoad(potentialTexture, corner1, 0).r;

    
    var diff = vec2f(uniforms.range - n0, n1 - n0);
    var vertexPosition = b0 + diff.x * (b1 - b0) / diff.y;

    
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

    
    var vel0 = textureLoad(potentialTexture, corner0, 0).gba;
    var vel1 = textureLoad(potentialTexture, corner1, 0).gba;
    var velocity = vel0 + diff.x * (vel1 - vel0) / diff.y;

    positionBuffer[global_invocation_index] = vec4f( vertexPosition / uniforms.texture3DSize, 1.);
    normalBuffer[global_invocation_index] = vec4f(-normal, 1.);
    velocityBuffer[global_invocation_index] = vec4f(velocity, 1.);

}`;let nn,sr,rn,ur,on,lr,dt,we,Mt,It,Nt,Rn=Promise.create(),kn=Promise.create(),Ln=Promise.create(),pe,zn,Ze,Qe,Ft,_t,et,tt,nt,je,D;async function fi(n,e,t){D=G,pe=e,zn=t,Math.pow(pe.width,3),Ze=D.createBuffer({label:"vertices buffer",size:4*n,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC}),Qe=D.createBuffer({label:"normals buffer",size:4*n,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC}),Ft=D.createBuffer({label:"velocity buffer",size:4*n,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC}),_t=D.createBuffer({label:"check buffer",size:4*7,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC|GPUBufferUsage.INDIRECT}),et=D.createBuffer({label:"test buffer",size:4*n,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC}),tt=D.createBuffer({label:"test 2 buffer",size:4*7,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC|GPUBufferUsage.INDIRECT}),we=[];for(let r=0;r<Gn.length;r++){let o=Gn[r].length/3;we.push(o)}we=new Float32Array(we),Mt=D.createBuffer({label:"uniforms buffer",size:we.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),D.queue.writeBuffer(Mt,0,we),It=new Float32Array(ai),Nt=D.createBuffer({label:"indices buffer",size:It.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),D.queue.writeBuffer(Nt,0,It),dt=Math.ceil(Math.sqrt(Math.pow(pe.width,3)));let i=Math.ceil(Math.log2(dt));return dt=Math.pow(2,i),i+=1,Oe(si).then(r=>{nn=r.pipeline,Rn.resolve()}),Oe(ui).then(r=>{rn=r.pipeline,kn.resolve()}),Oe(li).then(r=>{on=r.pipeline,Ln.resolve()}),await Rn,await kn,await Ln,nt=new Float32Array([pe.width,dt,i,.5]),je=D.createBuffer({label:"uniforms buffer",size:nt.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),D.queue.writeBuffer(je,0,nt),sr=D.createBindGroup({label:"bind group for march case",layout:nn.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:je}},{binding:1,resource:pe.createView({baseMipLevel:0,mipLevelCount:1})},{binding:2,resource:{buffer:Mt}},{binding:3,resource:zn.createView({baseMipLevel:0,mipLevelCount:1})},{binding:4,resource:{buffer:et}},{binding:5,resource:{buffer:tt}}]}),ur=D.createBindGroup({label:"bind group for check case",layout:rn.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:tt}},{binding:1,resource:{buffer:_t}}]}),lr=D.createBindGroup({label:"bind group for pyramid parsing",layout:on.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:je}},{binding:1,resource:{buffer:et}},{binding:2,resource:{buffer:Nt}},{binding:3,resource:pe.createView({baseMipLevel:0,mipLevelCount:1})},{binding:4,resource:{buffer:Ze}},{binding:5,resource:{buffer:Qe}},{binding:6,resource:{buffer:Ft}}]}),[Ze,Qe,Ft,_t]}function ci(n){nt[3]=n,D.queue.writeBuffer(je,0,nt);const e=D.createCommandEncoder({label:"encoder"});e.clearBuffer(Ze,0,Ze.size),e.clearBuffer(Qe,0,Qe.size),e.clearBuffer(et,0,et.size),e.clearBuffer(tt,0,tt.size);let t=pe.width;const i=e.beginComputePass({label:"march case pass"});i.setPipeline(nn),i.setBindGroup(0,sr),i.dispatchWorkgroups(t*.4,t,t),i.end();const r=e.beginComputePass({label:"check pass"});r.setPipeline(rn),r.setBindGroup(0,ur),r.dispatchWorkgroups(1),r.end();const o=e.beginComputePass({label:"parse pass"});o.setPipeline(on),o.setBindGroup(0,lr),o.dispatchWorkgroupsIndirect(_t,0*4),o.end();const a=e.finish();D.queue.submit([a])}var di=`struct Uniforms {
    defaultColor: vec3f,
    defaultOpacity: f32,
    luminosityThreshold: f32,
    smoothWidth: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var tDiffuse: texture_2d<f32>;
@group(0) @binding(2) var textureSampler: sampler;
@group(0) @binding(3) var outputTexture: texture_storage_2d<rgba8unorm, write>;

fn luma(color: vec3f) -> f32 {
    return dot(color, vec3f(0.299, 0.587, 0.114));
}

@compute @workgroup_size(1, 1) fn main(@builtin(global_invocation_id) id: vec3u) {

    var textDim = textureDimensions(tDiffuse).xy;
    var st = vec2f(id.xy) / vec2f(textDim);
    var texel = textureSampleLevel(tDiffuse, textureSampler, st, 0);
    var v = luma(texel.xyz);
    var outputColor = vec4f(uniforms.defaultColor, uniforms.defaultOpacity);
    var alpha = smoothstep(uniforms.luminosityThreshold, uniforms.luminosityThreshold + uniforms.smoothWidth, v);
    
    textureStore(outputTexture, id.xy, mix(outputColor, texel, vec4f(alpha)));
    
}`,pi=`struct Uniforms {
    textSize: vec2f,
    direction: vec2f,
    sigma: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var colorTexture: texture_2d<f32>;
@group(0) @binding(2) var textureSampler: sampler;
@group(0) @binding(3) var outputTexture: texture_storage_2d<rgba8unorm, write>;

fn gaussianPdf(x: f32, sigma: f32) -> f32{
    return 0.39894 * exp(-0.5 * x * x / (sigma * sigma)) / sigma;
}

@compute @workgroup_size(1, 1) fn main(@builtin(global_invocation_id) id: vec3u) {

    var st = vec2f(id.xy) / uniforms.textSize;

    var invSize = 1.0 / uniforms.textSize;
    var fSigma = uniforms.sigma;
    var weightSum = gaussianPdf(0.0, fSigma);
    var  diffuseSum = textureSampleLevel( colorTexture, textureSampler, st, 0).rgb * weightSum;
    
    for(var i = 1; i < i32(uniforms.sigma); i ++) {
        var x = f32(i);
        var w = gaussianPdf(x, fSigma);
        var uvOffset = uniforms.direction * invSize * x;
        var sample1 = textureSampleLevel( colorTexture, textureSampler, st + uvOffset, 0).rgb;
        var sample2 = textureSampleLevel( colorTexture, textureSampler, st - uvOffset, 0).rgb;
        diffuseSum += (sample1 + sample2) * w;
        weightSum += 2.0 * w;
    }

    textureStore(outputTexture, id.xy, vec4f(diffuseSum / weightSum, 1.0) );
    
}`,mi=`struct Uniforms {
    bloomTintColor: vec3f,
    bloomStrength: f32,
    bloomRadius: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var textureSampler: sampler;

@group(0) @binding(2) var blurTexture1: texture_2d<f32>;
@group(0) @binding(3) var blurTexture2: texture_2d<f32>;
@group(0) @binding(4) var blurTexture3: texture_2d<f32>;

@group(0) @binding(5) var inputTexture: texture_2d<f32>;
@group(0) @binding(6) var outputTexture: texture_storage_2d<rgba8unorm, write>;

fn lerpBloomFactor(factor: f32) -> f32 {
    var mirrorFactor = 1.2 - factor;
    return mix(factor, mirrorFactor, uniforms.bloomRadius);
}

@compute @workgroup_size(1, 1) fn main(@builtin(global_invocation_id) id: vec3u) {

    var textDim = textureDimensions(outputTexture).xy;
    var uv = vec2f(id.xy) / vec2f(textDim);
    var color = vec4f(0.); 

    color += vec4f(uniforms.bloomTintColor, 1.) * lerpBloomFactor(1.0) * uniforms.bloomStrength * textureSampleLevel(blurTexture1, textureSampler, uv, 0);
    color += vec4f(uniforms.bloomTintColor, 1.) * lerpBloomFactor(0.8) * uniforms.bloomStrength * textureSampleLevel(blurTexture2, textureSampler, uv, 0);
    color += vec4f(uniforms.bloomTintColor, 1.) * lerpBloomFactor(0.6) * uniforms.bloomStrength * textureSampleLevel(blurTexture3, textureSampler, uv, 0);
    color = max(color, vec4f(0.));
    color += textureSampleLevel(inputTexture, textureSampler, uv, 0);

    textureStore(outputTexture, id.xy, color );
    
}`,oe=[],pt=[],Vt=3,Mn=[3,5,7,9,11],ge,z,Bt,st,Pt,_n,bn,X,me,fr,St,cr,an=!1,fe=null;async function vi(){X=new Float32Array(8),_n=z.createBuffer({label:"luminosity buffer",size:X.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),Bt=await re("luminosity",di),st=await re("gaussian blur",pi),me=new Float32Array(8),bn=z.createBuffer({label:"blur buffer",size:X.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),Pt=await re("gaussian blur",mi)}async function gi(n,e,t,i,r){if(z=G,ge={x:n,y:e},!an){if(await vi(),fe==null){fe=[];for(let u=0;u<Vt;u++){let c=z.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),m=z.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});fe.push([c,m])}}an=!0}oe[0]!=null&&(oe.map(u=>u.destroy()),pt.map(u=>u.destroy()));let o=Math.round(ge.x/2),a=Math.round(ge.y/2);for(let u=0;u<Vt;u++){let c=z.createTexture({label:`mip horizontal ${u}`,size:[o,a],format:"rgba8unorm",dimension:"2d",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING});oe[u]=c;let m=z.createTexture({label:`mip vertical ${u}`,size:[o,a],format:"rgba8unorm",dimension:"2d",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING});pt[u]=m,o=Math.round(o/2),a=Math.round(a/2)}fr=z.createBindGroup({label:"luminosity bind group",layout:Bt.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:_n}},{binding:1,resource:t.createView()},{binding:2,resource:r},{binding:3,resource:i.createView()}]}),o=Math.round(ge.x/2),a=Math.round(ge.y/2),St=[];var s=i;for(let u=0;u<Vt;u++){let c=new Float32Array([o,a,1,0,Mn[u],0,0,0]);z.queue.writeBuffer(fe[u][0],0,c),c=new Float32Array([o,a,0,1,Mn[u],0,0,0]),z.queue.writeBuffer(fe[u][1],0,c);let m=z.createBindGroup({layout:st.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:fe[u][0]}},{binding:1,resource:s.createView()},{binding:2,resource:r},{binding:3,resource:pt[u].createView()}]}),p=z.createBindGroup({layout:st.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:fe[u][1]}},{binding:1,resource:pt[u].createView()},{binding:2,resource:r},{binding:3,resource:oe[u].createView()}]});s=oe[u],St.push([m,p]),o=Math.round(o/2),a=Math.round(a/2)}cr=z.createBindGroup({label:"bind group for composite",layout:Pt.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:bn}},{binding:1,resource:r},{binding:2,resource:oe[0].createView()},{binding:3,resource:oe[1].createView()},{binding:4,resource:oe[2].createView()},{binding:5,resource:t.createView()},{binding:6,resource:i.createView()}]})}function hi(n){if(!an)return;X[0]=0,X[1]=0,X[2]=0,X[3]=1,X[4]=.999,X[5]=1,z.queue.writeBuffer(_n,0,X);const e=n.beginComputePass(Bt.passDescriptor);e.setPipeline(Bt.pipeline),e.setBindGroup(0,fr),e.dispatchWorkgroups(window.innerWidth,window.innerHeight),e.end();let t=Math.round(ge.x/2),i=Math.round(ge.y/2);const r=n.beginComputePass(st.passDescriptor);r.setPipeline(st.pipeline);for(let a=0;a<St.length;a++){for(let s=0;s<2;s++)r.setBindGroup(0,St[a][s]),r.dispatchWorkgroups(t,i);t=Math.round(t/2),i=Math.round(i/2)}r.end(),me[0]=1,me[1]=1,me[2]=1,me[3]=1.8,me[4]=.1,z.queue.writeBuffer(bn,0,me);const o=n.beginComputePass(Pt.passDescriptor);o.setPipeline(Pt.pipeline),o.setBindGroup(0,cr),o.dispatchWorkgroups(window.innerWidth,window.innerHeight),o.end()}function _i(n){if(!(typeof window>"u")){var e=document.createElement("style");return e.setAttribute("type","text/css"),e.innerHTML=n,document.head.appendChild(e),n}}function Ae(n,e){var t=n.__state.conversionName.toString(),i=Math.round(n.r),r=Math.round(n.g),o=Math.round(n.b),a=n.a,s=Math.round(n.h),u=n.s.toFixed(1),c=n.v.toFixed(1);if(e||t==="THREE_CHAR_HEX"||t==="SIX_CHAR_HEX"){for(var m=n.hex.toString(16);m.length<6;)m="0"+m;return"#"+m}else{if(t==="CSS_RGB")return"rgb("+i+","+r+","+o+")";if(t==="CSS_RGBA")return"rgba("+i+","+r+","+o+","+a+")";if(t==="HEX")return"0x"+n.hex.toString(16);if(t==="RGB_ARRAY")return"["+i+","+r+","+o+"]";if(t==="RGBA_ARRAY")return"["+i+","+r+","+o+","+a+"]";if(t==="RGB_OBJ")return"{r:"+i+",g:"+r+",b:"+o+"}";if(t==="RGBA_OBJ")return"{r:"+i+",g:"+r+",b:"+o+",a:"+a+"}";if(t==="HSV_OBJ")return"{h:"+s+",s:"+u+",v:"+c+"}";if(t==="HSVA_OBJ")return"{h:"+s+",s:"+u+",v:"+c+",a:"+a+"}"}return"unknown format"}var In=Array.prototype.forEach,He=Array.prototype.slice,f={BREAK:{},extend:function(e){return this.each(He.call(arguments,1),function(t){var i=this.isObject(t)?Object.keys(t):[];i.forEach((function(r){this.isUndefined(t[r])||(e[r]=t[r])}).bind(this))},this),e},defaults:function(e){return this.each(He.call(arguments,1),function(t){var i=this.isObject(t)?Object.keys(t):[];i.forEach((function(r){this.isUndefined(e[r])&&(e[r]=t[r])}).bind(this))},this),e},compose:function(){var e=He.call(arguments);return function(){for(var t=He.call(arguments),i=e.length-1;i>=0;i--)t=[e[i].apply(this,t)];return t[0]}},each:function(e,t,i){if(e){if(In&&e.forEach&&e.forEach===In)e.forEach(t,i);else if(e.length===e.length+0){var r=void 0,o=void 0;for(r=0,o=e.length;r<o;r++)if(r in e&&t.call(i,e[r],r)===this.BREAK)return}else for(var a in e)if(t.call(i,e[a],a)===this.BREAK)return}},defer:function(e){setTimeout(e,0)},debounce:function(e,t,i){var r=void 0;return function(){var o=this,a=arguments;function s(){r=null,i||e.apply(o,a)}var u=i||!r;clearTimeout(r),r=setTimeout(s,t),u&&e.apply(o,a)}},toArray:function(e){return e.toArray?e.toArray():He.call(e)},isUndefined:function(e){return e===void 0},isNull:function(e){return e===null},isNaN:function(n){function e(t){return n.apply(this,arguments)}return e.toString=function(){return n.toString()},e}(function(n){return isNaN(n)}),isArray:Array.isArray||function(n){return n.constructor===Array},isObject:function(e){return e===Object(e)},isNumber:function(e){return e===e+0},isString:function(e){return e===e+""},isBoolean:function(e){return e===!1||e===!0},isFunction:function(e){return e instanceof Function}},bi=[{litmus:f.isString,conversions:{THREE_CHAR_HEX:{read:function(e){var t=e.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);return t===null?!1:{space:"HEX",hex:parseInt("0x"+t[1].toString()+t[1].toString()+t[2].toString()+t[2].toString()+t[3].toString()+t[3].toString(),0)}},write:Ae},SIX_CHAR_HEX:{read:function(e){var t=e.match(/^#([A-F0-9]{6})$/i);return t===null?!1:{space:"HEX",hex:parseInt("0x"+t[1].toString(),0)}},write:Ae},CSS_RGB:{read:function(e){var t=e.match(/^rgb\(\s*(\S+)\s*,\s*(\S+)\s*,\s*(\S+)\s*\)/);return t===null?!1:{space:"RGB",r:parseFloat(t[1]),g:parseFloat(t[2]),b:parseFloat(t[3])}},write:Ae},CSS_RGBA:{read:function(e){var t=e.match(/^rgba\(\s*(\S+)\s*,\s*(\S+)\s*,\s*(\S+)\s*,\s*(\S+)\s*\)/);return t===null?!1:{space:"RGB",r:parseFloat(t[1]),g:parseFloat(t[2]),b:parseFloat(t[3]),a:parseFloat(t[4])}},write:Ae}}},{litmus:f.isNumber,conversions:{HEX:{read:function(e){return{space:"HEX",hex:e,conversionName:"HEX"}},write:function(e){return e.hex}}}},{litmus:f.isArray,conversions:{RGB_ARRAY:{read:function(e){return e.length!==3?!1:{space:"RGB",r:e[0],g:e[1],b:e[2]}},write:function(e){return[e.r,e.g,e.b]}},RGBA_ARRAY:{read:function(e){return e.length!==4?!1:{space:"RGB",r:e[0],g:e[1],b:e[2],a:e[3]}},write:function(e){return[e.r,e.g,e.b,e.a]}}}},{litmus:f.isObject,conversions:{RGBA_OBJ:{read:function(e){return f.isNumber(e.r)&&f.isNumber(e.g)&&f.isNumber(e.b)&&f.isNumber(e.a)?{space:"RGB",r:e.r,g:e.g,b:e.b,a:e.a}:!1},write:function(e){return{r:e.r,g:e.g,b:e.b,a:e.a}}},RGB_OBJ:{read:function(e){return f.isNumber(e.r)&&f.isNumber(e.g)&&f.isNumber(e.b)?{space:"RGB",r:e.r,g:e.g,b:e.b}:!1},write:function(e){return{r:e.r,g:e.g,b:e.b}}},HSVA_OBJ:{read:function(e){return f.isNumber(e.h)&&f.isNumber(e.s)&&f.isNumber(e.v)&&f.isNumber(e.a)?{space:"HSV",h:e.h,s:e.s,v:e.v,a:e.a}:!1},write:function(e){return{h:e.h,s:e.s,v:e.v,a:e.a}}},HSV_OBJ:{read:function(e){return f.isNumber(e.h)&&f.isNumber(e.s)&&f.isNumber(e.v)?{space:"HSV",h:e.h,s:e.s,v:e.v}:!1},write:function(e){return{h:e.h,s:e.s,v:e.v}}}}}],Ye=void 0,mt=void 0,sn=function(){mt=!1;var e=arguments.length>1?f.toArray(arguments):arguments[0];return f.each(bi,function(t){if(t.litmus(e))return f.each(t.conversions,function(i,r){if(Ye=i.read(e),mt===!1&&Ye!==!1)return mt=Ye,Ye.conversionName=r,Ye.conversion=i,f.BREAK}),f.BREAK}),mt},Nn=void 0,Ct={hsv_to_rgb:function(e,t,i){var r=Math.floor(e/60)%6,o=e/60-Math.floor(e/60),a=i*(1-t),s=i*(1-o*t),u=i*(1-(1-o)*t),c=[[i,u,a],[s,i,a],[a,i,u],[a,s,i],[u,a,i],[i,a,s]][r];return{r:c[0]*255,g:c[1]*255,b:c[2]*255}},rgb_to_hsv:function(e,t,i){var r=Math.min(e,t,i),o=Math.max(e,t,i),a=o-r,s=void 0,u=void 0;if(o!==0)u=a/o;else return{h:NaN,s:0,v:0};return e===o?s=(t-i)/a:t===o?s=2+(i-e)/a:s=4+(e-t)/a,s/=6,s<0&&(s+=1),{h:s*360,s:u,v:o/255}},rgb_to_hex:function(e,t,i){var r=this.hex_with_component(0,2,e);return r=this.hex_with_component(r,1,t),r=this.hex_with_component(r,0,i),r},component_from_hex:function(e,t){return e>>t*8&255},hex_with_component:function(e,t,i){return i<<(Nn=t*8)|e&~(255<<Nn)}},xi=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(n){return typeof n}:function(n){return n&&typeof Symbol=="function"&&n.constructor===Symbol&&n!==Symbol.prototype?"symbol":typeof n},N=function(n,e){if(!(n instanceof e))throw new TypeError("Cannot call a class as a function")},F=function(){function n(e,t){for(var i=0;i<t.length;i++){var r=t[i];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(e,t,i){return t&&n(e.prototype,t),i&&n(e,i),e}}(),se=function n(e,t,i){e===null&&(e=Function.prototype);var r=Object.getOwnPropertyDescriptor(e,t);if(r===void 0){var o=Object.getPrototypeOf(e);return o===null?void 0:n(o,t,i)}else{if("value"in r)return r.value;var a=r.get;return a===void 0?void 0:a.call(i)}},ue=function(n,e){if(typeof e!="function"&&e!==null)throw new TypeError("Super expression must either be null or a function, not "+typeof e);n.prototype=Object.create(e&&e.prototype,{constructor:{value:n,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(n,e):n.__proto__=e)},le=function(n,e){if(!n)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e&&(typeof e=="object"||typeof e=="function")?e:n},R=function(){function n(){if(N(this,n),this.__state=sn.apply(this,arguments),this.__state===!1)throw new Error("Failed to interpret color arguments");this.__state.a=this.__state.a||1}return F(n,[{key:"toString",value:function(){return Ae(this)}},{key:"toHexString",value:function(){return Ae(this,!0)}},{key:"toOriginal",value:function(){return this.__state.conversion.write(this)}}]),n}();function xn(n,e,t){Object.defineProperty(n,e,{get:function(){return this.__state.space==="RGB"?this.__state[e]:(R.recalculateRGB(this,e,t),this.__state[e])},set:function(r){this.__state.space!=="RGB"&&(R.recalculateRGB(this,e,t),this.__state.space="RGB"),this.__state[e]=r}})}function yn(n,e){Object.defineProperty(n,e,{get:function(){return this.__state.space==="HSV"?this.__state[e]:(R.recalculateHSV(this),this.__state[e])},set:function(i){this.__state.space!=="HSV"&&(R.recalculateHSV(this),this.__state.space="HSV"),this.__state[e]=i}})}R.recalculateRGB=function(n,e,t){if(n.__state.space==="HEX")n.__state[e]=Ct.component_from_hex(n.__state.hex,t);else if(n.__state.space==="HSV")f.extend(n.__state,Ct.hsv_to_rgb(n.__state.h,n.__state.s,n.__state.v));else throw new Error("Corrupted color state")};R.recalculateHSV=function(n){var e=Ct.rgb_to_hsv(n.r,n.g,n.b);f.extend(n.__state,{s:e.s,v:e.v}),f.isNaN(e.h)?f.isUndefined(n.__state.h)&&(n.__state.h=0):n.__state.h=e.h};R.COMPONENTS=["r","g","b","h","s","v","hex","a"];xn(R.prototype,"r",2);xn(R.prototype,"g",1);xn(R.prototype,"b",0);yn(R.prototype,"h");yn(R.prototype,"s");yn(R.prototype,"v");Object.defineProperty(R.prototype,"a",{get:function(){return this.__state.a},set:function(e){this.__state.a=e}});Object.defineProperty(R.prototype,"hex",{get:function(){return this.__state.space!=="HEX"&&(this.__state.hex=Ct.rgb_to_hex(this.r,this.g,this.b),this.__state.space="HEX"),this.__state.hex},set:function(e){this.__state.space="HEX",this.__state.hex=e}});var ye=function(){function n(e,t){N(this,n),this.initialValue=e[t],this.domElement=document.createElement("div"),this.object=e,this.property=t,this.__onChange=void 0,this.__onFinishChange=void 0}return F(n,[{key:"onChange",value:function(t){return this.__onChange=t,this}},{key:"onFinishChange",value:function(t){return this.__onFinishChange=t,this}},{key:"setValue",value:function(t){return this.object[this.property]=t,this.__onChange&&this.__onChange.call(this,t),this.updateDisplay(),this}},{key:"getValue",value:function(){return this.object[this.property]}},{key:"updateDisplay",value:function(){return this}},{key:"isModified",value:function(){return this.initialValue!==this.getValue()}}]),n}(),yi={HTMLEvents:["change"],MouseEvents:["click","mousemove","mousedown","mouseup","mouseover"],KeyboardEvents:["keydown"]},dr={};f.each(yi,function(n,e){f.each(n,function(t){dr[t]=e})});var wi=/(\d+(\.\d+)?)px/;function V(n){if(n==="0"||f.isUndefined(n))return 0;var e=n.match(wi);return f.isNull(e)?0:parseFloat(e[1])}var l={makeSelectable:function(e,t){e===void 0||e.style===void 0||(e.onselectstart=t?function(){return!1}:function(){},e.style.MozUserSelect=t?"auto":"none",e.style.KhtmlUserSelect=t?"auto":"none",e.unselectable=t?"on":"off")},makeFullscreen:function(e,t,i){var r=i,o=t;f.isUndefined(o)&&(o=!0),f.isUndefined(r)&&(r=!0),e.style.position="absolute",o&&(e.style.left=0,e.style.right=0),r&&(e.style.top=0,e.style.bottom=0)},fakeEvent:function(e,t,i,r){var o=i||{},a=dr[t];if(!a)throw new Error("Event type "+t+" not supported.");var s=document.createEvent(a);switch(a){case"MouseEvents":{var u=o.x||o.clientX||0,c=o.y||o.clientY||0;s.initMouseEvent(t,o.bubbles||!1,o.cancelable||!0,window,o.clickCount||1,0,0,u,c,!1,!1,!1,!1,0,null);break}case"KeyboardEvents":{var m=s.initKeyboardEvent||s.initKeyEvent;f.defaults(o,{cancelable:!0,ctrlKey:!1,altKey:!1,shiftKey:!1,metaKey:!1,keyCode:void 0,charCode:void 0}),m(t,o.bubbles||!1,o.cancelable,window,o.ctrlKey,o.altKey,o.shiftKey,o.metaKey,o.keyCode,o.charCode);break}default:{s.initEvent(t,o.bubbles||!1,o.cancelable||!0);break}}f.defaults(s,r),e.dispatchEvent(s)},bind:function(e,t,i,r){var o=r||!1;return e.addEventListener?e.addEventListener(t,i,o):e.attachEvent&&e.attachEvent("on"+t,i),l},unbind:function(e,t,i,r){var o=r||!1;return e.removeEventListener?e.removeEventListener(t,i,o):e.detachEvent&&e.detachEvent("on"+t,i),l},addClass:function(e,t){if(e.className===void 0)e.className=t;else if(e.className!==t){var i=e.className.split(/ +/);i.indexOf(t)===-1&&(i.push(t),e.className=i.join(" ").replace(/^\s+/,"").replace(/\s+$/,""))}return l},removeClass:function(e,t){if(t)if(e.className===t)e.removeAttribute("class");else{var i=e.className.split(/ +/),r=i.indexOf(t);r!==-1&&(i.splice(r,1),e.className=i.join(" "))}else e.className=void 0;return l},hasClass:function(e,t){return new RegExp("(?:^|\\s+)"+t+"(?:\\s+|$)").test(e.className)||!1},getWidth:function(e){var t=getComputedStyle(e);return V(t["border-left-width"])+V(t["border-right-width"])+V(t["padding-left"])+V(t["padding-right"])+V(t.width)},getHeight:function(e){var t=getComputedStyle(e);return V(t["border-top-width"])+V(t["border-bottom-width"])+V(t["padding-top"])+V(t["padding-bottom"])+V(t.height)},getOffset:function(e){var t=e,i={left:0,top:0};if(t.offsetParent)do i.left+=t.offsetLeft,i.top+=t.offsetTop,t=t.offsetParent;while(t);return i},isActive:function(e){return e===document.activeElement&&(e.type||e.href)}},pr=function(n){ue(e,n);function e(t,i){N(this,e);var r=le(this,(e.__proto__||Object.getPrototypeOf(e)).call(this,t,i)),o=r;r.__prev=r.getValue(),r.__checkbox=document.createElement("input"),r.__checkbox.setAttribute("type","checkbox");function a(){o.setValue(!o.__prev)}return l.bind(r.__checkbox,"change",a,!1),r.domElement.appendChild(r.__checkbox),r.updateDisplay(),r}return F(e,[{key:"setValue",value:function(i){var r=se(e.prototype.__proto__||Object.getPrototypeOf(e.prototype),"setValue",this).call(this,i);return this.__onFinishChange&&this.__onFinishChange.call(this,this.getValue()),this.__prev=this.getValue(),r}},{key:"updateDisplay",value:function(){return this.getValue()===!0?(this.__checkbox.setAttribute("checked","checked"),this.__checkbox.checked=!0,this.__prev=!0):(this.__checkbox.checked=!1,this.__prev=!1),se(e.prototype.__proto__||Object.getPrototypeOf(e.prototype),"updateDisplay",this).call(this)}}]),e}(ye),Bi=function(n){ue(e,n);function e(t,i,r){N(this,e);var o=le(this,(e.__proto__||Object.getPrototypeOf(e)).call(this,t,i)),a=r,s=o;if(o.__select=document.createElement("select"),f.isArray(a)){var u={};f.each(a,function(c){u[c]=c}),a=u}return f.each(a,function(c,m){var p=document.createElement("option");p.innerHTML=m,p.setAttribute("value",c),s.__select.appendChild(p)}),o.updateDisplay(),l.bind(o.__select,"change",function(){var c=this.options[this.selectedIndex].value;s.setValue(c)}),o.domElement.appendChild(o.__select),o}return F(e,[{key:"setValue",value:function(i){var r=se(e.prototype.__proto__||Object.getPrototypeOf(e.prototype),"setValue",this).call(this,i);return this.__onFinishChange&&this.__onFinishChange.call(this,this.getValue()),r}},{key:"updateDisplay",value:function(){return l.isActive(this.__select)?this:(this.__select.value=this.getValue(),se(e.prototype.__proto__||Object.getPrototypeOf(e.prototype),"updateDisplay",this).call(this))}}]),e}(ye),Pi=function(n){ue(e,n);function e(t,i){N(this,e);var r=le(this,(e.__proto__||Object.getPrototypeOf(e)).call(this,t,i)),o=r;function a(){o.setValue(o.__input.value)}function s(){o.__onFinishChange&&o.__onFinishChange.call(o,o.getValue())}return r.__input=document.createElement("input"),r.__input.setAttribute("type","text"),l.bind(r.__input,"keyup",a),l.bind(r.__input,"change",a),l.bind(r.__input,"blur",s),l.bind(r.__input,"keydown",function(u){u.keyCode===13&&this.blur()}),r.updateDisplay(),r.domElement.appendChild(r.__input),r}return F(e,[{key:"updateDisplay",value:function(){return l.isActive(this.__input)||(this.__input.value=this.getValue()),se(e.prototype.__proto__||Object.getPrototypeOf(e.prototype),"updateDisplay",this).call(this)}}]),e}(ye);function Fn(n){var e=n.toString();return e.indexOf(".")>-1?e.length-e.indexOf(".")-1:0}var mr=function(n){ue(e,n);function e(t,i,r){N(this,e);var o=le(this,(e.__proto__||Object.getPrototypeOf(e)).call(this,t,i)),a=r||{};return o.__min=a.min,o.__max=a.max,o.__step=a.step,f.isUndefined(o.__step)?o.initialValue===0?o.__impliedStep=1:o.__impliedStep=Math.pow(10,Math.floor(Math.log(Math.abs(o.initialValue))/Math.LN10))/10:o.__impliedStep=o.__step,o.__precision=Fn(o.__impliedStep),o}return F(e,[{key:"setValue",value:function(i){var r=i;return this.__min!==void 0&&r<this.__min?r=this.__min:this.__max!==void 0&&r>this.__max&&(r=this.__max),this.__step!==void 0&&r%this.__step!==0&&(r=Math.round(r/this.__step)*this.__step),se(e.prototype.__proto__||Object.getPrototypeOf(e.prototype),"setValue",this).call(this,r)}},{key:"min",value:function(i){return this.__min=i,this}},{key:"max",value:function(i){return this.__max=i,this}},{key:"step",value:function(i){return this.__step=i,this.__impliedStep=i,this.__precision=Fn(i),this}}]),e}(ye);function Si(n,e){var t=Math.pow(10,e);return Math.round(n*t)/t}var Tt=function(n){ue(e,n);function e(t,i,r){N(this,e);var o=le(this,(e.__proto__||Object.getPrototypeOf(e)).call(this,t,i,r));o.__truncationSuspended=!1;var a=o,s=void 0;function u(){var h=parseFloat(a.__input.value);f.isNaN(h)||a.setValue(h)}function c(){a.__onFinishChange&&a.__onFinishChange.call(a,a.getValue())}function m(){c()}function p(h){var v=s-h.clientY;a.setValue(a.getValue()+v*a.__impliedStep),s=h.clientY}function d(){l.unbind(window,"mousemove",p),l.unbind(window,"mouseup",d),c()}function g(h){l.bind(window,"mousemove",p),l.bind(window,"mouseup",d),s=h.clientY}return o.__input=document.createElement("input"),o.__input.setAttribute("type","text"),l.bind(o.__input,"change",u),l.bind(o.__input,"blur",m),l.bind(o.__input,"mousedown",g),l.bind(o.__input,"keydown",function(h){h.keyCode===13&&(a.__truncationSuspended=!0,this.blur(),a.__truncationSuspended=!1,c())}),o.updateDisplay(),o.domElement.appendChild(o.__input),o}return F(e,[{key:"updateDisplay",value:function(){return this.__input.value=this.__truncationSuspended?this.getValue():Si(this.getValue(),this.__precision),se(e.prototype.__proto__||Object.getPrototypeOf(e.prototype),"updateDisplay",this).call(this)}}]),e}(mr);function Vn(n,e,t,i,r){return i+(r-i)*((n-e)/(t-e))}var un=function(n){ue(e,n);function e(t,i,r,o,a){N(this,e);var s=le(this,(e.__proto__||Object.getPrototypeOf(e)).call(this,t,i,{min:r,max:o,step:a})),u=s;s.__background=document.createElement("div"),s.__foreground=document.createElement("div"),l.bind(s.__background,"mousedown",c),l.bind(s.__background,"touchstart",d),l.addClass(s.__background,"slider"),l.addClass(s.__foreground,"slider-fg");function c(v){document.activeElement.blur(),l.bind(window,"mousemove",m),l.bind(window,"mouseup",p),m(v)}function m(v){v.preventDefault();var w=u.__background.getBoundingClientRect();return u.setValue(Vn(v.clientX,w.left,w.right,u.__min,u.__max)),!1}function p(){l.unbind(window,"mousemove",m),l.unbind(window,"mouseup",p),u.__onFinishChange&&u.__onFinishChange.call(u,u.getValue())}function d(v){v.touches.length===1&&(l.bind(window,"touchmove",g),l.bind(window,"touchend",h),g(v))}function g(v){var w=v.touches[0].clientX,E=u.__background.getBoundingClientRect();u.setValue(Vn(w,E.left,E.right,u.__min,u.__max))}function h(){l.unbind(window,"touchmove",g),l.unbind(window,"touchend",h),u.__onFinishChange&&u.__onFinishChange.call(u,u.getValue())}return s.updateDisplay(),s.__background.appendChild(s.__foreground),s.domElement.appendChild(s.__background),s}return F(e,[{key:"updateDisplay",value:function(){var i=(this.getValue()-this.__min)/(this.__max-this.__min);return this.__foreground.style.width=i*100+"%",se(e.prototype.__proto__||Object.getPrototypeOf(e.prototype),"updateDisplay",this).call(this)}}]),e}(mr),vr=function(n){ue(e,n);function e(t,i,r){N(this,e);var o=le(this,(e.__proto__||Object.getPrototypeOf(e)).call(this,t,i)),a=o;return o.__button=document.createElement("div"),o.__button.innerHTML=r===void 0?"Fire":r,l.bind(o.__button,"click",function(s){return s.preventDefault(),a.fire(),!1}),l.addClass(o.__button,"button"),o.domElement.appendChild(o.__button),o}return F(e,[{key:"fire",value:function(){this.__onChange&&this.__onChange.call(this),this.getValue().call(this.object),this.__onFinishChange&&this.__onFinishChange.call(this,this.getValue())}}]),e}(ye),ln=function(n){ue(e,n);function e(t,i){N(this,e);var r=le(this,(e.__proto__||Object.getPrototypeOf(e)).call(this,t,i));r.__color=new R(r.getValue()),r.__temp=new R(0);var o=r;r.domElement=document.createElement("div"),l.makeSelectable(r.domElement,!1),r.__selector=document.createElement("div"),r.__selector.className="selector",r.__saturation_field=document.createElement("div"),r.__saturation_field.className="saturation-field",r.__field_knob=document.createElement("div"),r.__field_knob.className="field-knob",r.__field_knob_border="2px solid ",r.__hue_knob=document.createElement("div"),r.__hue_knob.className="hue-knob",r.__hue_field=document.createElement("div"),r.__hue_field.className="hue-field",r.__input=document.createElement("input"),r.__input.type="text",r.__input_textShadow="0 1px 1px ",l.bind(r.__input,"keydown",function(v){v.keyCode===13&&p.call(this)}),l.bind(r.__input,"blur",p),l.bind(r.__selector,"mousedown",function(){l.addClass(this,"drag").bind(window,"mouseup",function(){l.removeClass(o.__selector,"drag")})}),l.bind(r.__selector,"touchstart",function(){l.addClass(this,"drag").bind(window,"touchend",function(){l.removeClass(o.__selector,"drag")})});var a=document.createElement("div");f.extend(r.__selector.style,{width:"122px",height:"102px",padding:"3px",backgroundColor:"#222",boxShadow:"0px 1px 3px rgba(0,0,0,0.3)"}),f.extend(r.__field_knob.style,{position:"absolute",width:"12px",height:"12px",border:r.__field_knob_border+(r.__color.v<.5?"#fff":"#000"),boxShadow:"0px 1px 3px rgba(0,0,0,0.5)",borderRadius:"12px",zIndex:1}),f.extend(r.__hue_knob.style,{position:"absolute",width:"15px",height:"2px",borderRight:"4px solid #fff",zIndex:1}),f.extend(r.__saturation_field.style,{width:"100px",height:"100px",border:"1px solid #555",marginRight:"3px",display:"inline-block",cursor:"pointer"}),f.extend(a.style,{width:"100%",height:"100%",background:"none"}),Hn(a,"top","rgba(0,0,0,0)","#000"),f.extend(r.__hue_field.style,{width:"15px",height:"100px",border:"1px solid #555",cursor:"ns-resize",position:"absolute",top:"3px",right:"3px"}),Ti(r.__hue_field),f.extend(r.__input.style,{outline:"none",textAlign:"center",color:"#fff",border:0,fontWeight:"bold",textShadow:r.__input_textShadow+"rgba(0,0,0,0.7)"}),l.bind(r.__saturation_field,"mousedown",s),l.bind(r.__saturation_field,"touchstart",s),l.bind(r.__field_knob,"mousedown",s),l.bind(r.__field_knob,"touchstart",s),l.bind(r.__hue_field,"mousedown",u),l.bind(r.__hue_field,"touchstart",u);function s(v){g(v),l.bind(window,"mousemove",g),l.bind(window,"touchmove",g),l.bind(window,"mouseup",c),l.bind(window,"touchend",c)}function u(v){h(v),l.bind(window,"mousemove",h),l.bind(window,"touchmove",h),l.bind(window,"mouseup",m),l.bind(window,"touchend",m)}function c(){l.unbind(window,"mousemove",g),l.unbind(window,"touchmove",g),l.unbind(window,"mouseup",c),l.unbind(window,"touchend",c),d()}function m(){l.unbind(window,"mousemove",h),l.unbind(window,"touchmove",h),l.unbind(window,"mouseup",m),l.unbind(window,"touchend",m),d()}function p(){var v=sn(this.value);v!==!1?(o.__color.__state=v,o.setValue(o.__color.toOriginal())):this.value=o.__color.toString()}function d(){o.__onFinishChange&&o.__onFinishChange.call(o,o.__color.toOriginal())}r.__saturation_field.appendChild(a),r.__selector.appendChild(r.__field_knob),r.__selector.appendChild(r.__saturation_field),r.__selector.appendChild(r.__hue_field),r.__hue_field.appendChild(r.__hue_knob),r.domElement.appendChild(r.__input),r.domElement.appendChild(r.__selector),r.updateDisplay();function g(v){v.type.indexOf("touch")===-1&&v.preventDefault();var w=o.__saturation_field.getBoundingClientRect(),E=v.touches&&v.touches[0]||v,L=E.clientX,b=E.clientY,x=(L-w.left)/(w.right-w.left),y=1-(b-w.top)/(w.bottom-w.top);return y>1?y=1:y<0&&(y=0),x>1?x=1:x<0&&(x=0),o.__color.v=y,o.__color.s=x,o.setValue(o.__color.toOriginal()),!1}function h(v){v.type.indexOf("touch")===-1&&v.preventDefault();var w=o.__hue_field.getBoundingClientRect(),E=v.touches&&v.touches[0]||v,L=E.clientY,b=1-(L-w.top)/(w.bottom-w.top);return b>1?b=1:b<0&&(b=0),o.__color.h=b*360,o.setValue(o.__color.toOriginal()),!1}return r}return F(e,[{key:"updateDisplay",value:function(){var i=sn(this.getValue());if(i!==!1){var r=!1;f.each(R.COMPONENTS,function(s){if(!f.isUndefined(i[s])&&!f.isUndefined(this.__color.__state[s])&&i[s]!==this.__color.__state[s])return r=!0,{}},this),r&&f.extend(this.__color.__state,i)}f.extend(this.__temp.__state,this.__color.__state),this.__temp.a=1;var o=this.__color.v<.5||this.__color.s>.5?255:0,a=255-o;f.extend(this.__field_knob.style,{marginLeft:100*this.__color.s-7+"px",marginTop:100*(1-this.__color.v)-7+"px",backgroundColor:this.__temp.toHexString(),border:this.__field_knob_border+"rgb("+o+","+o+","+o+")"}),this.__hue_knob.style.marginTop=(1-this.__color.h/360)*100+"px",this.__temp.s=1,this.__temp.v=1,Hn(this.__saturation_field,"left","#fff",this.__temp.toHexString()),this.__input.value=this.__color.toString(),f.extend(this.__input.style,{backgroundColor:this.__color.toHexString(),color:"rgb("+o+","+o+","+o+")",textShadow:this.__input_textShadow+"rgba("+a+","+a+","+a+",.7)"})}}]),e}(ye),Ci=["-moz-","-o-","-webkit-","-ms-",""];function Hn(n,e,t,i){n.style.background="",f.each(Ci,function(r){n.style.cssText+="background: "+r+"linear-gradient("+e+", "+t+" 0%, "+i+" 100%); "})}function Ti(n){n.style.background="",n.style.cssText+="background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);",n.style.cssText+="background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);",n.style.cssText+="background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);",n.style.cssText+="background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);",n.style.cssText+="background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);"}var Ei={load:function(e,t){var i=t||document,r=i.createElement("link");r.type="text/css",r.rel="stylesheet",r.href=e,i.getElementsByTagName("head")[0].appendChild(r)},inject:function(e,t){var i=t||document,r=document.createElement("style");r.type="text/css",r.innerHTML=e;var o=i.getElementsByTagName("head")[0];try{o.appendChild(r)}catch{}}},Ai=`<div id="dg-save" class="dg dialogue">

  Here's the new load parameter for your <code>GUI</code>'s constructor:

  <textarea id="dg-new-constructor"></textarea>

  <div id="dg-save-locally">

    <input id="dg-local-storage" type="checkbox"/> Automatically save
    values to <code>localStorage</code> on exit.

    <div id="dg-local-explain">The values saved to <code>localStorage</code> will
      override those passed to <code>dat.GUI</code>'s constructor. This makes it
      easier to work incrementally, but <code>localStorage</code> is fragile,
      and your friends may not see the same values you do.

    </div>

  </div>

</div>`,Ui=function(e,t){var i=e[t];return f.isArray(arguments[2])||f.isObject(arguments[2])?new Bi(e,t,arguments[2]):f.isNumber(i)?f.isNumber(arguments[2])&&f.isNumber(arguments[3])?f.isNumber(arguments[4])?new un(e,t,arguments[2],arguments[3],arguments[4]):new un(e,t,arguments[2],arguments[3]):f.isNumber(arguments[4])?new Tt(e,t,{min:arguments[2],max:arguments[3],step:arguments[4]}):new Tt(e,t,{min:arguments[2],max:arguments[3]}):f.isString(i)?new Pi(e,t):f.isFunction(i)?new vr(e,t,""):f.isBoolean(i)?new pr(e,t):null};function Oi(n){setTimeout(n,1e3/60)}var Di=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||Oi,Gi=function(){function n(){N(this,n),this.backgroundElement=document.createElement("div"),f.extend(this.backgroundElement.style,{backgroundColor:"rgba(0,0,0,0.8)",top:0,left:0,display:"none",zIndex:"1000",opacity:0,WebkitTransition:"opacity 0.2s linear",transition:"opacity 0.2s linear"}),l.makeFullscreen(this.backgroundElement),this.backgroundElement.style.position="fixed",this.domElement=document.createElement("div"),f.extend(this.domElement.style,{position:"fixed",display:"none",zIndex:"1001",opacity:0,WebkitTransition:"-webkit-transform 0.2s ease-out, opacity 0.2s linear",transition:"transform 0.2s ease-out, opacity 0.2s linear"}),document.body.appendChild(this.backgroundElement),document.body.appendChild(this.domElement);var e=this;l.bind(this.backgroundElement,"click",function(){e.hide()})}return F(n,[{key:"show",value:function(){var t=this;this.backgroundElement.style.display="block",this.domElement.style.display="block",this.domElement.style.opacity=0,this.domElement.style.webkitTransform="scale(1.1)",this.layout(),f.defer(function(){t.backgroundElement.style.opacity=1,t.domElement.style.opacity=1,t.domElement.style.webkitTransform="scale(1)"})}},{key:"hide",value:function(){var t=this,i=function r(){t.domElement.style.display="none",t.backgroundElement.style.display="none",l.unbind(t.domElement,"webkitTransitionEnd",r),l.unbind(t.domElement,"transitionend",r),l.unbind(t.domElement,"oTransitionEnd",r)};l.bind(this.domElement,"webkitTransitionEnd",i),l.bind(this.domElement,"transitionend",i),l.bind(this.domElement,"oTransitionEnd",i),this.backgroundElement.style.opacity=0,this.domElement.style.opacity=0,this.domElement.style.webkitTransform="scale(1.1)"}},{key:"layout",value:function(){this.domElement.style.left=window.innerWidth/2-l.getWidth(this.domElement)/2+"px",this.domElement.style.top=window.innerHeight/2-l.getHeight(this.domElement)/2+"px"}}]),n}(),Ri=_i(`.dg ul{list-style:none;margin:0;padding:0;width:100%;clear:both}.dg.ac{position:fixed;top:0;left:0;right:0;height:0;z-index:0}.dg:not(.ac) .main{overflow:hidden}.dg.main{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear}.dg.main.taller-than-window{overflow-y:auto}.dg.main.taller-than-window .close-button{opacity:1;margin-top:-1px;border-top:1px solid #2c2c2c}.dg.main ul.closed .close-button{opacity:1 !important}.dg.main:hover .close-button,.dg.main .close-button.drag{opacity:1}.dg.main .close-button{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear;border:0;line-height:19px;height:20px;cursor:pointer;text-align:center;background-color:#000}.dg.main .close-button.close-top{position:relative}.dg.main .close-button.close-bottom{position:absolute}.dg.main .close-button:hover{background-color:#111}.dg.a{float:right;margin-right:15px;overflow-y:visible}.dg.a.has-save>ul.close-top{margin-top:0}.dg.a.has-save>ul.close-bottom{margin-top:27px}.dg.a.has-save>ul.closed{margin-top:0}.dg.a .save-row{top:0;z-index:1002}.dg.a .save-row.close-top{position:relative}.dg.a .save-row.close-bottom{position:fixed}.dg li{-webkit-transition:height .1s ease-out;-o-transition:height .1s ease-out;-moz-transition:height .1s ease-out;transition:height .1s ease-out;-webkit-transition:overflow .1s linear;-o-transition:overflow .1s linear;-moz-transition:overflow .1s linear;transition:overflow .1s linear}.dg li:not(.folder){cursor:auto;height:27px;line-height:27px;padding:0 4px 0 5px}.dg li.folder{padding:0;border-left:4px solid rgba(0,0,0,0)}.dg li.title{cursor:pointer;margin-left:-4px}.dg .closed li:not(.title),.dg .closed ul li,.dg .closed ul li>*{height:0;overflow:hidden;border:0}.dg .cr{clear:both;padding-left:3px;height:27px;overflow:hidden}.dg .property-name{cursor:default;float:left;clear:left;width:40%;overflow:hidden;text-overflow:ellipsis}.dg .cr.function .property-name{width:100%}.dg .c{float:left;width:60%;position:relative}.dg .c input[type=text]{border:0;margin-top:4px;padding:3px;width:100%;float:right}.dg .has-slider input[type=text]{width:30%;margin-left:0}.dg .slider{float:left;width:66%;margin-left:-5px;margin-right:0;height:19px;margin-top:4px}.dg .slider-fg{height:100%}.dg .c input[type=checkbox]{margin-top:7px}.dg .c select{margin-top:5px}.dg .cr.function,.dg .cr.function .property-name,.dg .cr.function *,.dg .cr.boolean,.dg .cr.boolean *{cursor:pointer}.dg .cr.color{overflow:visible}.dg .selector{display:none;position:absolute;margin-left:-9px;margin-top:23px;z-index:10}.dg .c:hover .selector,.dg .selector.drag{display:block}.dg li.save-row{padding:0}.dg li.save-row .button{display:inline-block;padding:0px 6px}.dg.dialogue{background-color:#222;width:460px;padding:15px;font-size:13px;line-height:15px}#dg-new-constructor{padding:10px;color:#222;font-family:Monaco, monospace;font-size:10px;border:0;resize:none;box-shadow:inset 1px 1px 1px #888;word-wrap:break-word;margin:12px 0;display:block;width:440px;overflow-y:scroll;height:100px;position:relative}#dg-local-explain{display:none;font-size:11px;line-height:17px;border-radius:3px;background-color:#333;padding:8px;margin-top:10px}#dg-local-explain code{font-size:10px}#dat-gui-save-locally{display:none}.dg{color:#eee;font:11px 'Lucida Grande', sans-serif;text-shadow:0 -1px 0 #111}.dg.main::-webkit-scrollbar{width:5px;background:#1a1a1a}.dg.main::-webkit-scrollbar-corner{height:0;display:none}.dg.main::-webkit-scrollbar-thumb{border-radius:5px;background:#676767}.dg li:not(.folder){background:#1a1a1a;border-bottom:1px solid #2c2c2c}.dg li.save-row{line-height:25px;background:#dad5cb;border:0}.dg li.save-row select{margin-left:5px;width:108px}.dg li.save-row .button{margin-left:5px;margin-top:1px;border-radius:2px;font-size:9px;line-height:7px;padding:4px 4px 5px 4px;background:#c5bdad;color:#fff;text-shadow:0 1px 0 #b0a58f;box-shadow:0 -1px 0 #b0a58f;cursor:pointer}.dg li.save-row .button.gears{background:#c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;height:7px;width:8px}.dg li.save-row .button:hover{background-color:#bab19e;box-shadow:0 -1px 0 #b0a58f}.dg li.folder{border-bottom:0}.dg li.title{padding-left:16px;background:#000 url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.2)}.dg .closed li.title{background-image:url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==)}.dg .cr.boolean{border-left:3px solid #806787}.dg .cr.color{border-left:3px solid}.dg .cr.function{border-left:3px solid #e61d5f}.dg .cr.number{border-left:3px solid #2FA1D6}.dg .cr.number input[type=text]{color:#2FA1D6}.dg .cr.string{border-left:3px solid #1ed36f}.dg .cr.string input[type=text]{color:#1ed36f}.dg .cr.function:hover,.dg .cr.boolean:hover{background:#111}.dg .c input[type=text]{background:#303030;outline:none}.dg .c input[type=text]:hover{background:#3c3c3c}.dg .c input[type=text]:focus{background:#494949;color:#fff}.dg .c .slider{background:#303030;cursor:ew-resize}.dg .c .slider-fg{background:#2FA1D6;max-width:100%}.dg .c .slider:hover{background:#3c3c3c}.dg .c .slider:hover .slider-fg{background:#44abda}
`);Ei.inject(Ri);var Yn="dg",$n=72,Xn=20,ut="Default",Ke=function(){try{return!!window.localStorage}catch{return!1}}(),rt=void 0,Wn=!0,Se=void 0,Ht=!1,gr=[],P=function n(e){var t=this,i=e||{};this.domElement=document.createElement("div"),this.__ul=document.createElement("ul"),this.domElement.appendChild(this.__ul),l.addClass(this.domElement,Yn),this.__folders={},this.__controllers=[],this.__rememberedObjects=[],this.__rememberedObjectIndecesToControllers=[],this.__listening=[],i=f.defaults(i,{closeOnTop:!1,autoPlace:!0,width:n.DEFAULT_WIDTH}),i=f.defaults(i,{resizable:i.autoPlace,hideable:i.autoPlace}),f.isUndefined(i.load)?i.load={preset:ut}:i.preset&&(i.load.preset=i.preset),f.isUndefined(i.parent)&&i.hideable&&gr.push(this),i.resizable=f.isUndefined(i.parent)&&i.resizable,i.autoPlace&&f.isUndefined(i.scrollable)&&(i.scrollable=!0);var r=Ke&&localStorage.getItem(Ce(this,"isLocal"))==="true",o=void 0,a=void 0;if(Object.defineProperties(this,{parent:{get:function(){return i.parent}},scrollable:{get:function(){return i.scrollable}},autoPlace:{get:function(){return i.autoPlace}},closeOnTop:{get:function(){return i.closeOnTop}},preset:{get:function(){return t.parent?t.getRoot().preset:i.load.preset},set:function(d){t.parent?t.getRoot().preset=d:i.load.preset=d,Mi(this),t.revert()}},width:{get:function(){return i.width},set:function(d){i.width=d,dn(t,d)}},name:{get:function(){return i.name},set:function(d){i.name=d,a&&(a.innerHTML=i.name)}},closed:{get:function(){return i.closed},set:function(d){i.closed=d,i.closed?l.addClass(t.__ul,n.CLASS_CLOSED):l.removeClass(t.__ul,n.CLASS_CLOSED),this.onResize(),t.__closeButton&&(t.__closeButton.innerHTML=d?n.TEXT_OPEN:n.TEXT_CLOSED)}},load:{get:function(){return i.load}},useLocalStorage:{get:function(){return r},set:function(d){Ke&&(r=d,d?l.bind(window,"unload",o):l.unbind(window,"unload",o),localStorage.setItem(Ce(t,"isLocal"),d))}}}),f.isUndefined(i.parent)){if(this.closed=i.closed||!1,l.addClass(this.domElement,n.CLASS_MAIN),l.makeSelectable(this.domElement,!1),Ke&&r){t.useLocalStorage=!0;var s=localStorage.getItem(Ce(this,"gui"));s&&(i.load=JSON.parse(s))}this.__closeButton=document.createElement("div"),this.__closeButton.innerHTML=n.TEXT_CLOSED,l.addClass(this.__closeButton,n.CLASS_CLOSE_BUTTON),i.closeOnTop?(l.addClass(this.__closeButton,n.CLASS_CLOSE_TOP),this.domElement.insertBefore(this.__closeButton,this.domElement.childNodes[0])):(l.addClass(this.__closeButton,n.CLASS_CLOSE_BOTTOM),this.domElement.appendChild(this.__closeButton)),l.bind(this.__closeButton,"click",function(){t.closed=!t.closed})}else{i.closed===void 0&&(i.closed=!0);var u=document.createTextNode(i.name);l.addClass(u,"controller-name"),a=wn(t,u);var c=function(d){return d.preventDefault(),t.closed=!t.closed,!1};l.addClass(this.__ul,n.CLASS_CLOSED),l.addClass(a,"title"),l.bind(a,"click",c),i.closed||(this.closed=!1)}i.autoPlace&&(f.isUndefined(i.parent)&&(Wn&&(Se=document.createElement("div"),l.addClass(Se,Yn),l.addClass(Se,n.CLASS_AUTO_PLACE_CONTAINER),document.body.appendChild(Se),Wn=!1),Se.appendChild(this.domElement),l.addClass(this.domElement,n.CLASS_AUTO_PLACE)),this.parent||dn(t,i.width)),this.__resizeHandler=function(){t.onResizeDebounced()},l.bind(window,"resize",this.__resizeHandler),l.bind(this.__ul,"webkitTransitionEnd",this.__resizeHandler),l.bind(this.__ul,"transitionend",this.__resizeHandler),l.bind(this.__ul,"oTransitionEnd",this.__resizeHandler),this.onResize(),i.resizable&&zi(this),o=function(){Ke&&localStorage.getItem(Ce(t,"isLocal"))==="true"&&localStorage.setItem(Ce(t,"gui"),JSON.stringify(t.getSaveObject()))},this.saveToLocalStorageIfPossible=o;function m(){var p=t.getRoot();p.width+=1,f.defer(function(){p.width-=1})}i.parent||m()};P.toggleHide=function(){Ht=!Ht,f.each(gr,function(n){n.domElement.style.display=Ht?"none":""})};P.CLASS_AUTO_PLACE="a";P.CLASS_AUTO_PLACE_CONTAINER="ac";P.CLASS_MAIN="main";P.CLASS_CONTROLLER_ROW="cr";P.CLASS_TOO_TALL="taller-than-window";P.CLASS_CLOSED="closed";P.CLASS_CLOSE_BUTTON="close-button";P.CLASS_CLOSE_TOP="close-top";P.CLASS_CLOSE_BOTTOM="close-bottom";P.CLASS_DRAG="drag";P.DEFAULT_WIDTH=245;P.TEXT_CLOSED="Close Controls";P.TEXT_OPEN="Open Controls";P._keydownHandler=function(n){document.activeElement.type!=="text"&&(n.which===$n||n.keyCode===$n)&&P.toggleHide()};l.bind(window,"keydown",P._keydownHandler,!1);f.extend(P.prototype,{add:function(e,t){return it(this,e,t,{factoryArgs:Array.prototype.slice.call(arguments,2)})},addColor:function(e,t){return it(this,e,t,{color:!0})},remove:function(e){this.__ul.removeChild(e.__li),this.__controllers.splice(this.__controllers.indexOf(e),1);var t=this;f.defer(function(){t.onResize()})},destroy:function(){if(this.parent)throw new Error("Only the root GUI should be removed with .destroy(). For subfolders, use gui.removeFolder(folder) instead.");this.autoPlace&&Se.removeChild(this.domElement);var e=this;f.each(this.__folders,function(t){e.removeFolder(t)}),l.unbind(window,"keydown",P._keydownHandler,!1),qn(this)},addFolder:function(e){if(this.__folders[e]!==void 0)throw new Error('You already have a folder in this GUI by the name "'+e+'"');var t={name:e,parent:this};t.autoPlace=this.autoPlace,this.load&&this.load.folders&&this.load.folders[e]&&(t.closed=this.load.folders[e].closed,t.load=this.load.folders[e]);var i=new P(t);this.__folders[e]=i;var r=wn(this,i.domElement);return l.addClass(r,"folder"),i},removeFolder:function(e){this.__ul.removeChild(e.domElement.parentElement),delete this.__folders[e.name],this.load&&this.load.folders&&this.load.folders[e.name]&&delete this.load.folders[e.name],qn(e);var t=this;f.each(e.__folders,function(i){e.removeFolder(i)}),f.defer(function(){t.onResize()})},open:function(){this.closed=!1},close:function(){this.closed=!0},hide:function(){this.domElement.style.display="none"},show:function(){this.domElement.style.display=""},onResize:function(){var e=this.getRoot();if(e.scrollable){var t=l.getOffset(e.__ul).top,i=0;f.each(e.__ul.childNodes,function(r){e.autoPlace&&r===e.__save_row||(i+=l.getHeight(r))}),window.innerHeight-t-Xn<i?(l.addClass(e.domElement,P.CLASS_TOO_TALL),e.__ul.style.height=window.innerHeight-t-Xn+"px"):(l.removeClass(e.domElement,P.CLASS_TOO_TALL),e.__ul.style.height="auto")}e.__resize_handle&&f.defer(function(){e.__resize_handle.style.height=e.__ul.offsetHeight+"px"}),e.__closeButton&&(e.__closeButton.style.width=e.width+"px")},onResizeDebounced:f.debounce(function(){this.onResize()},50),remember:function(){if(f.isUndefined(rt)&&(rt=new Gi,rt.domElement.innerHTML=Ai),this.parent)throw new Error("You can only call remember on a top level GUI.");var e=this;f.each(Array.prototype.slice.call(arguments),function(t){e.__rememberedObjects.length===0&&Li(e),e.__rememberedObjects.indexOf(t)===-1&&e.__rememberedObjects.push(t)}),this.autoPlace&&dn(this,this.width)},getRoot:function(){for(var e=this;e.parent;)e=e.parent;return e},getSaveObject:function(){var e=this.load;return e.closed=this.closed,this.__rememberedObjects.length>0&&(e.preset=this.preset,e.remembered||(e.remembered={}),e.remembered[this.preset]=vt(this)),e.folders={},f.each(this.__folders,function(t,i){e.folders[i]=t.getSaveObject()}),e},save:function(){this.load.remembered||(this.load.remembered={}),this.load.remembered[this.preset]=vt(this),fn(this,!1),this.saveToLocalStorageIfPossible()},saveAs:function(e){this.load.remembered||(this.load.remembered={},this.load.remembered[ut]=vt(this,!0)),this.load.remembered[e]=vt(this),this.preset=e,cn(this,e,!0),this.saveToLocalStorageIfPossible()},revert:function(e){f.each(this.__controllers,function(t){this.getRoot().load.remembered?hr(e||this.getRoot(),t):t.setValue(t.initialValue),t.__onFinishChange&&t.__onFinishChange.call(t,t.getValue())},this),f.each(this.__folders,function(t){t.revert(t)}),e||fn(this.getRoot(),!1)},listen:function(e){var t=this.__listening.length===0;this.__listening.push(e),t&&_r(this.__listening)},updateDisplay:function(){f.each(this.__controllers,function(e){e.updateDisplay()}),f.each(this.__folders,function(e){e.updateDisplay()})}});function wn(n,e,t){var i=document.createElement("li");return e&&i.appendChild(e),t?n.__ul.insertBefore(i,t):n.__ul.appendChild(i),n.onResize(),i}function qn(n){l.unbind(window,"resize",n.__resizeHandler),n.saveToLocalStorageIfPossible&&l.unbind(window,"unload",n.saveToLocalStorageIfPossible)}function fn(n,e){var t=n.__preset_select[n.__preset_select.selectedIndex];e?t.innerHTML=t.value+"*":t.innerHTML=t.value}function ki(n,e,t){if(t.__li=e,t.__gui=n,f.extend(t,{options:function(a){if(arguments.length>1){var s=t.__li.nextElementSibling;return t.remove(),it(n,t.object,t.property,{before:s,factoryArgs:[f.toArray(arguments)]})}if(f.isArray(a)||f.isObject(a)){var u=t.__li.nextElementSibling;return t.remove(),it(n,t.object,t.property,{before:u,factoryArgs:[a]})}},name:function(a){return t.__li.firstElementChild.firstElementChild.innerHTML=a,t},listen:function(){return t.__gui.listen(t),t},remove:function(){return t.__gui.remove(t),t}}),t instanceof un){var i=new Tt(t.object,t.property,{min:t.__min,max:t.__max,step:t.__step});f.each(["updateDisplay","onChange","onFinishChange","step","min","max"],function(o){var a=t[o],s=i[o];t[o]=i[o]=function(){var u=Array.prototype.slice.call(arguments);return s.apply(i,u),a.apply(t,u)}}),l.addClass(e,"has-slider"),t.domElement.insertBefore(i.domElement,t.domElement.firstElementChild)}else if(t instanceof Tt){var r=function(a){if(f.isNumber(t.__min)&&f.isNumber(t.__max)){var s=t.__li.firstElementChild.firstElementChild.innerHTML,u=t.__gui.__listening.indexOf(t)>-1;t.remove();var c=it(n,t.object,t.property,{before:t.__li.nextElementSibling,factoryArgs:[t.__min,t.__max,t.__step]});return c.name(s),u&&c.listen(),c}return a};t.min=f.compose(r,t.min),t.max=f.compose(r,t.max)}else t instanceof pr?(l.bind(e,"click",function(){l.fakeEvent(t.__checkbox,"click")}),l.bind(t.__checkbox,"click",function(o){o.stopPropagation()})):t instanceof vr?(l.bind(e,"click",function(){l.fakeEvent(t.__button,"click")}),l.bind(e,"mouseover",function(){l.addClass(t.__button,"hover")}),l.bind(e,"mouseout",function(){l.removeClass(t.__button,"hover")})):t instanceof ln&&(l.addClass(e,"color"),t.updateDisplay=f.compose(function(o){return e.style.borderLeftColor=t.__color.toString(),o},t.updateDisplay),t.updateDisplay());t.setValue=f.compose(function(o){return n.getRoot().__preset_select&&t.isModified()&&fn(n.getRoot(),!0),o},t.setValue)}function hr(n,e){var t=n.getRoot(),i=t.__rememberedObjects.indexOf(e.object);if(i!==-1){var r=t.__rememberedObjectIndecesToControllers[i];if(r===void 0&&(r={},t.__rememberedObjectIndecesToControllers[i]=r),r[e.property]=e,t.load&&t.load.remembered){var o=t.load.remembered,a=void 0;if(o[n.preset])a=o[n.preset];else if(o[ut])a=o[ut];else return;if(a[i]&&a[i][e.property]!==void 0){var s=a[i][e.property];e.initialValue=s,e.setValue(s)}}}}function it(n,e,t,i){if(e[t]===void 0)throw new Error('Object "'+e+'" has no property "'+t+'"');var r=void 0;if(i.color)r=new ln(e,t);else{var o=[e,t].concat(i.factoryArgs);r=Ui.apply(n,o)}i.before instanceof ye&&(i.before=i.before.__li),hr(n,r),l.addClass(r.domElement,"c");var a=document.createElement("span");l.addClass(a,"property-name"),a.innerHTML=r.property;var s=document.createElement("div");s.appendChild(a),s.appendChild(r.domElement);var u=wn(n,s,i.before);return l.addClass(u,P.CLASS_CONTROLLER_ROW),r instanceof ln?l.addClass(u,"color"):l.addClass(u,xi(r.getValue())),ki(n,u,r),n.__controllers.push(r),r}function Ce(n,e){return document.location.href+"."+e}function cn(n,e,t){var i=document.createElement("option");i.innerHTML=e,i.value=e,n.__preset_select.appendChild(i),t&&(n.__preset_select.selectedIndex=n.__preset_select.length-1)}function jn(n,e){e.style.display=n.useLocalStorage?"block":"none"}function Li(n){var e=n.__save_row=document.createElement("li");l.addClass(n.domElement,"has-save"),n.__ul.insertBefore(e,n.__ul.firstChild),l.addClass(e,"save-row");var t=document.createElement("span");t.innerHTML="&nbsp;",l.addClass(t,"button gears");var i=document.createElement("span");i.innerHTML="Save",l.addClass(i,"button"),l.addClass(i,"save");var r=document.createElement("span");r.innerHTML="New",l.addClass(r,"button"),l.addClass(r,"save-as");var o=document.createElement("span");o.innerHTML="Revert",l.addClass(o,"button"),l.addClass(o,"revert");var a=n.__preset_select=document.createElement("select");if(n.load&&n.load.remembered?f.each(n.load.remembered,function(p,d){cn(n,d,d===n.preset)}):cn(n,ut,!1),l.bind(a,"change",function(){for(var p=0;p<n.__preset_select.length;p++)n.__preset_select[p].innerHTML=n.__preset_select[p].value;n.preset=this.value}),e.appendChild(a),e.appendChild(t),e.appendChild(i),e.appendChild(r),e.appendChild(o),Ke){var s=document.getElementById("dg-local-explain"),u=document.getElementById("dg-local-storage"),c=document.getElementById("dg-save-locally");c.style.display="block",localStorage.getItem(Ce(n,"isLocal"))==="true"&&u.setAttribute("checked","checked"),jn(n,s),l.bind(u,"change",function(){n.useLocalStorage=!n.useLocalStorage,jn(n,s)})}var m=document.getElementById("dg-new-constructor");l.bind(m,"keydown",function(p){p.metaKey&&(p.which===67||p.keyCode===67)&&rt.hide()}),l.bind(t,"click",function(){m.innerHTML=JSON.stringify(n.getSaveObject(),void 0,2),rt.show(),m.focus(),m.select()}),l.bind(i,"click",function(){n.save()}),l.bind(r,"click",function(){var p=prompt("Enter a new preset name.");p&&n.saveAs(p)}),l.bind(o,"click",function(){n.revert()})}function zi(n){var e=void 0;n.__resize_handle=document.createElement("div"),f.extend(n.__resize_handle.style,{width:"6px",marginLeft:"-3px",height:"200px",cursor:"ew-resize",position:"absolute"});function t(o){return o.preventDefault(),n.width+=e-o.clientX,n.onResize(),e=o.clientX,!1}function i(){l.removeClass(n.__closeButton,P.CLASS_DRAG),l.unbind(window,"mousemove",t),l.unbind(window,"mouseup",i)}function r(o){return o.preventDefault(),e=o.clientX,l.addClass(n.__closeButton,P.CLASS_DRAG),l.bind(window,"mousemove",t),l.bind(window,"mouseup",i),!1}l.bind(n.__resize_handle,"mousedown",r),l.bind(n.__closeButton,"mousedown",r),n.domElement.insertBefore(n.__resize_handle,n.domElement.firstElementChild)}function dn(n,e){n.domElement.style.width=e+"px",n.__save_row&&n.autoPlace&&(n.__save_row.style.width=e+"px"),n.__closeButton&&(n.__closeButton.style.width=e+"px")}function vt(n,e){var t={};return f.each(n.__rememberedObjects,function(i,r){var o={},a=n.__rememberedObjectIndecesToControllers[r];f.each(a,function(s,u){o[u]=e?s.initialValue:s.getValue()}),t[r]=o}),t}function Mi(n){for(var e=0;e<n.__preset_select.length;e++)n.__preset_select[e].value===n.preset&&(n.__preset_select.selectedIndex=e)}function _r(n){n.length!==0&&Di.call(window,function(){_r(n)}),f.each(n,function(e){e.updateDisplay()})}var Ii=P,Ni=`struct VertexOutput {
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

}`,Fi=`struct Uniforms {
  direction: vec2f,
  deltaTime: f32,
  motionBlur: f32
}

@group(0) @binding(0) var texture: texture_2d<f32>;
@group(0) @binding(1) var textureVel: texture_2d<f32>;
@group(0) @binding(2) var textureSampler: sampler;
@group(0) @binding(3) var<uniform> uniforms: Uniforms;
@group(0) @binding(4) var outputTexture: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(16, 16) fn main(@builtin(global_invocation_id) id: vec3u) {

    var dimensions = textureDimensions(texture).xy;
    var tSize = vec2f(f32(dimensions.x), f32(dimensions.y));
    var uv = vec2f(id.xy) / tSize;

    var data = textureSampleLevel(textureVel, textureSampler, uv, 0);
    var color = vec4(0.);
    var color2 = vec4(0.);
    var sum = 1.;
    var sum2 = 0.;
    var m = 1.;
    var n = 2. + data.g * min(floor(200. * data.r), 100.);
    var steps = i32(n);
    
    for(var i = 0; i <= steps; i ++) {
        var k = f32(i);
        var j = k - 0.5 * f32(steps);
        var tRead = textureSampleLevel(texture, textureSampler, uv + uniforms.direction * j / tSize, 0);
        color += m * tRead;
        color2 += tRead;
        m *= (n - k) / (k + 1.);
        sum += m;
        sum2 += 1.;
    } 

    color /= sum;
    color2 /= sum2;

    var mixer = select(.1, 0.5, data.g > 0.);
    color = mixer * color + (1. - mixer) * color2;

    textureStore(outputTexture, id.xy, color );
}`,Vi=`struct Uniforms {
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
    
    vec2f( -1,  1),  
    vec2f( 1,  -1),  
    vec2f( -1,  -1),  
 
    
      
    vec2f( -1,  1),
    vec2f( 1,  1),  
    vec2f( 1, -1)  
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

}`,Hi=`struct Uniforms {
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
    

}`,Yi=`struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f
};

struct Uniforms {
    resolution: vec2f,
    relativeFrame: f32,
    animationFrame: f32,

    currentLetter: f32,
    brightness: f32,
    contrast: f32,
    gamma: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var inputTexture: texture_2d<f32>;
@group(0) @binding(2) var textureSampler: sampler;
@group(0) @binding(3) var logoTexture: texture_2d<f32>;

@vertex fn vs( @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {

  let pos = array(
    
    vec2f( -1,  1),  
    vec2f( 1,  -1),  
    vec2f( -1,  -1),  
 
    
      
    vec2f( -1,  1),
    vec2f( 1,  1),  
    vec2f( 1, -1)  
  );

  var output: VertexOutput;
  output.position = vec4(pos[vertexIndex], 0., 1.);
  output.uv = 0.5 * pos[vertexIndex] + 0.5;
  return output;
}

@fragment fn fs(input: VertexOutput) -> @location(0) vec4f {

    var uv = vec2f(input.uv.x, 1. - input.uv.y);
    var tDim = vec2f(textureDimensions(logoTexture));
    var tAspectRatio = tDim.y / tDim.x;

    var st = 2. * uv - 1.;
    st *= 10. * vec2f(tAspectRatio * uniforms.resolution.x / uniforms.resolution.y, 1.);
    st = 0.5 * st + 0.5;

    var logo = textureSampleLevel(logoTexture, textureSampler, st, 0.);
    var colorLogo = vec4(logo.a);

    
    var color = textureSampleLevel(inputTexture, textureSampler, uv, 0);

    
    color = color + vec4f(uniforms.brightness);

    
    var t = (1. - uniforms.contrast) / 2.; 
    color = color * uniforms.contrast + vec4(t);

    
    color = pow(color, vec4(uniforms.gamma));

    color = vec4f(color.rgb, 1.);

    
    

    

    

    

    

    

    
    
    
    
    return color;

}`;const _=await kr(),Dt=120,$i=Dt,Xi=2e7,br=8e4,ot=1;async function Wi(n){const t=await(await fetch(n)).blob();return await createImageBitmap(t,{colorSpaceConversion:"none"})}let Kn=document.body.querySelectorAll(".letter");Kn=Array.from(Kn);const qi=await Wi("./assets/codrops.png"),bt=_.createTexture({size:[1650,200],format:"rgba8unorm",dimension:"2d",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});_.queue.copyExternalImageToTexture({source:qi},{texture:bt},{width:bt.width,height:bt.height});const ke=document.querySelector("canvas");ke.width=window.innerWidth;ke.height=window.innerHeight;const xr=ke.getContext("webgpu"),ji=navigator.gpu.getPreferredCanvasFormat();xr.configure({device:_,format:ji});let W=$i,M=[[18,97,115],[78,157,166],[217,166,121],[191,116,73],[140,68,42]],Yt=0,ce=0,de=0;var C={depthTest:1,mixAlpha:1,size:5,deltaTime:.05,coneAngle:.83,coneRotation:45,coneAngle2:.76,coneRotation2:64,gridRadius:5,lightIntensity:14,separation:0,voxelWorldSize:.022,smoothness:12,mc_range:.6,thickness:.5,gamma:1,brightness:0,contrast:1};const Ki=window.location.search,Ji=new URLSearchParams(Ki),Zi=Ji.get("ui")=="true";if(Zi){var $t=new Ii,Xt=$t.addFolder("postprocessing");Xt.add(C,"gamma",-1,1).name("gamma").step(.01),Xt.add(C,"brightness",-1,1).name("brightness").step(.01),Xt.add(C,"contrast",-1,3).name("contrast").step(.01);var Be=$t.addFolder("marchingCubes");Be.add(C,"smoothness",1,30).name("smoothness").step(1),Be.add(C,"mc_range",.001,1).name("range").step(.001),Be.add(C,"thickness",.001,1).name("thickness").step(.001),Be.add(C,"voxelWorldSize",.001,.1).name("voxel size ").step(1e-4),Be.add(C,"coneAngle2",.1,1,1).name("cone angle ").step(.01),Be.add(C,"coneRotation2",0,90,1).name("cone rotation ").step(1);var Jn=$t.addFolder("simulation");Jn.add(C,"deltaTime",0,.05,0).name("delta time").step(.001),Jn.add(C,"separation",0,.4,0).name("separation").step(.01)}const yr=_.createTexture({size:[W,W,W],format:"rgba32float",dimension:"3d",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.COPY_DST|GPUBufferUsage.COPY_SRC}),Gt=_.createTexture({size:[W,W,W],format:"rgba32float",dimension:"3d",mipLevelCount:Math.ceil(Math.log2(W)),usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.COPY_DST|GPUBufferUsage.COPY_SRC}),Rt=_.createTexture({size:[W,W,W],format:"rgba32float",dimension:"3d",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.COPY_DST|GPUBufferUsage.COPY_SRC}),Ue=_.createSampler({magFilter:"linear",minFilter:"linear",mipmapFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",addressModeW:"clamp-to-edge"});console.log("the PBF resolution is: "+Dt);console.log("the amount of parrticles are: "+br);let j=new Fr(ke),Qi=3,eo=30;await ti(Dt,br,yr,j);const[wr,Br,Pr,to]=await fi(Xi,Rt,Gt);let no=new Array(64).fill(0),T=new Float32Array(no);const Sr=_.createBuffer({label:"uniforms buffer",size:T.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),Cr=_.createBuffer({label:"uniforms mirror buffer",size:T.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),Y=await gn("marching cubes",Ni,ot,[{format:"rgba8unorm"},{format:"rgba8unorm"}]),Bn=[];Bn[0]=_.createBindGroup({label:"binding for non reflective shape",layout:Y.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:wr}},{binding:1,resource:{buffer:Sr}},{binding:2,resource:{buffer:Br}},{binding:3,resource:Gt.createView()},{binding:4,resource:Ue},{binding:5,resource:{buffer:Pr}},{binding:6,resource:Rt.createView()}]});Bn[1]=_.createBindGroup({label:"binding for reflective shape",layout:Y.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:wr}},{binding:1,resource:{buffer:Cr}},{binding:2,resource:{buffer:Br}},{binding:3,resource:Gt.createView()},{binding:4,resource:Ue},{binding:5,resource:{buffer:Pr}},{binding:6,resource:Rt.createView()}]});const Et=await re("post processing",Fi),Tr=new Float32Array([0,1,C.deltaTime,1]),Er=new Float32Array([1,0,C.deltaTime,1]),pn=_.createBuffer({label:"uniforms X buffer",size:Tr.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),mn=_.createBuffer({label:"uniforms Y buffer",size:Er.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST});_.queue.writeBuffer(pn,0,Tr);_.queue.writeBuffer(mn,0,Er);const ve=await gn("background quad",Vi,ot,[{format:"rgba8unorm"},{format:"rgba8unorm"}],!1),K=new Float32Array(8),Ar=_.createBuffer({label:"background buffer",size:K.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),ro=_.createBindGroup({label:"background bind group",layout:ve.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:Ar}}]}),At=await re("offset pass",Hi),H=new Float32Array(8),Ur=_.createBuffer({label:"quad buffer",size:H.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),Te=await gn("screen quad",Yi,1,[{format:navigator.gpu.getPreferredCanvasFormat()}],!1);let Wt,he,te,Pe,gt,Je,Zn,Qn,vn;const Ut=[],Ot=[];function Or(){Wt!=null&&(Wt.destroy(),he.destroy(),te.destroy(),gt.destroy(),Je.destroy(),Pe.destroy(),Zn.destroy(),Qn.destroy(),vn.destroy()),Wt=_.createTexture({size:[window.innerWidth,window.innerHeight],sampleCount:1,format:"depth32float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),vn=_.createTexture({size:[window.innerWidth,window.innerHeight],sampleCount:ot,format:"depth32float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),he=_.createTexture({size:[window.innerWidth,window.innerHeight],sampleCount:1,format:"rgba8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING}),te=_.createTexture({size:[window.innerWidth,window.innerHeight],sampleCount:1,format:"rgba8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.COPY_SRC}),Zn=_.createTexture({size:[window.innerWidth,window.innerHeight],sampleCount:ot,format:"rgba8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),Qn=_.createTexture({size:[window.innerWidth,window.innerHeight],sampleCount:ot,format:"rgba8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),gt=_.createTexture({size:[window.innerWidth,window.innerHeight],sampleCount:1,format:"rgba8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING}),Je=_.createTexture({size:[window.innerWidth,window.innerHeight],sampleCount:1,format:"rgba8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.COPY_DST}),Pe=_.createTexture({size:[window.innerWidth,window.innerHeight],sampleCount:1,format:"rgba8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING}),gi(window.innerWidth,window.innerHeight,he,Pe,Ue),Ut[0]=_.createBindGroup({label:"post processing pass X bind group",layout:Et.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:he.createView()},{binding:1,resource:te.createView()},{binding:2,resource:Ue},{binding:3,resource:{buffer:pn}},{binding:4,resource:Pe.createView()}]}),Ut[1]=_.createBindGroup({label:"post processing pass Y bind group",layout:Et.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:Pe.createView()},{binding:1,resource:te.createView()},{binding:2,resource:Ue},{binding:3,resource:{buffer:mn}},{binding:4,resource:he.createView()}]}),Ot[0]=_.createBindGroup({label:"offset X bind group",layout:At.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:pn}},{binding:1,resource:Je.createView()},{binding:2,resource:te.createView()},{binding:3,resource:gt.createView()}]}),Ot[1]=_.createBindGroup({label:"offset Y bind group",layout:At.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:mn}},{binding:1,resource:Je.createView()},{binding:2,resource:gt.createView()},{binding:3,resource:te.createView()}]}),Te.setBindGroup([{binding:0,resource:{buffer:Ur}},{binding:1,resource:Pe.createView()},{binding:2,resource:Ue},{binding:3,resource:bt.createView()}])}window.onresize=Or;Or();async function io(){ke.width=window.innerWidth,ke.height=window.innerHeight;let n=ri({x:0,y:-18,z:0},C.deltaTime,C.lightIntensity,C.separation,j);n.relativeFrame==0&&(de=Yt%M.length,ce=(Yt+1)%M.length,Yt++),Mr(yr,Rt,C.smoothness),ci(C.mc_range),oi(Gt,_),j.updateCamera(eo,window.innerWidth/window.innerHeight,Qi);var e=ae(0,1,0);j.calculateReflection([0,.03,0],e);const t=_.createCommandEncoder({label:"rendering encoder"});K[0]=M[de][0]/255,K[1]=M[de][1]/255,K[2]=M[de][2]/255,K[3]=n.relativeFrame,K[4]=M[ce][0]/255,K[5]=M[ce][1]/255,K[6]=M[ce][2]/255,_.queue.writeBuffer(Ar,0,K),ve.passDescriptor.colorAttachments[0].view=he.createView(),ve.passDescriptor.colorAttachments[0].loadOp="clear",ve.passDescriptor.colorAttachments[1].view=te.createView(),ve.passDescriptor.colorAttachments[1].loadOp="clear";const i=t.beginRenderPass(ve.passDescriptor);i.setPipeline(ve.pipeline),i.setBindGroup(0,ro),i.draw(6,1),i.end();const r=16;for(let d=0;d<16;d++)T[d]=j.transformMatrix[d];T[r]=j.position[0],T[r+1]=j.position[1],T[r+2]=j.position[2],T[r+3]=Dt,T[r+4]=C.coneAngle2,T[r+5]=C.coneRotation2,T[r+6]=n.relativeFrame,T[r+7]=C.voxelWorldSize,T[r+8]=M[de][0]/255,T[r+9]=M[de][1]/255,T[r+10]=M[de][2]/255,T[r+11]=0,T[r+12]=M[ce][0]/255,T[r+13]=M[ce][1]/255,T[r+14]=M[ce][2]/255,T[r+15]=C.thickness,_.queue.writeBuffer(Sr,0,T);for(let d=0;d<16;d++)T[d]=j.transformMatrixReflection[d];T[r+11]=1,_.queue.writeBuffer(Cr,0,T),Y.passDescriptor.colorAttachments[0].view=he.createView(),Y.passDescriptor.colorAttachments[0].loadOp="load",Y.passDescriptor.colorAttachments[1].view=te.createView(),Y.passDescriptor.colorAttachments[1].loadOp="load",Y.passDescriptor.depthStencilAttachment.view=vn.createView(),Y.passDescriptor.depthStencilAttachment.depthLoadOp="clear";const o=t.beginRenderPass(Y.passDescriptor);o.setPipeline(Y.pipeline),Bn.map(d=>{o.setBindGroup(0,d),o.drawIndirect(to,4*3)}),o.end(),t.copyTextureToTexture({texture:te},{texture:Je},{width:window.innerWidth,height:window.innerHeight});let a=Math.ceil(window.innerWidth/16),s=Math.ceil(window.innerHeight/16);const u=t.beginComputePass(At.passDescriptor);u.setPipeline(At.pipeline),u.setBindGroup(0,Ot[0]),u.dispatchWorkgroups(a,s),u.setBindGroup(0,Ot[1]),u.dispatchWorkgroups(a,s),u.end();const c=t.beginComputePass(Et.passDescriptor);c.setPipeline(Et.pipeline),c.setBindGroup(0,Ut[0]),c.dispatchWorkgroups(a,s),c.setBindGroup(0,Ut[1]),c.dispatchWorkgroups(a,s),c.end(),hi(t),Te.passDescriptor.colorAttachments[0].view=xr.getCurrentTexture().createView(),Te.passDescriptor.colorAttachments[0].loadOp="clear",H[0]=window.innerWidth,H[1]=window.innerHeight,H[2]=n.relativeFrame,H[3]=n.animationFrame,H[4]=n.currentLetter,H[5]=C.brightness,H[6]=C.contrast,H[7]=C.gamma,_.queue.writeBuffer(Ur,0,H);const m=t.beginRenderPass(Te.passDescriptor);m.setPipeline(Te.pipeline),m.setBindGroup(0,Te.bindGroup),m.draw(6,1),m.end();const p=t.finish();_.queue.submit([p])}let oo=60,er=Math.floor(1e3/oo),ao=performance.now(),tr=ao,qt=0,jt=0;function Dr(n){qt=n,jt=qt-tr,jt>er&&(tr=qt-jt%er,io()),requestAnimationFrame(Dr)}requestAnimationFrame(Dr);
