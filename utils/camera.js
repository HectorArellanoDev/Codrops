import { vec3, mat4 } from "gl-matrix";

class Camera {

    constructor(canvas) {

        this.block = false;
        this.position = vec3.create();
        this.down = false;
        this.prevMouseX = 0;
        this.prevMouseY = 0;
        this.currentMouseX = 0;
        this.currentMouseY = 0;

        this.alpha = Math.PI * 0.5;
        this.beta = -Math.PI * 0.5;
        this._alpha = this.alpha;
        this._beta = this.beta;

        this._alpha2 = this.alpha;
        this._beta2 = this.beta;

        this.gaze = true;

        this.ratio = 1;
        this.init = true;
        this.target = [0.5, 0.35, 0.5];

        this.lerp = 0.1;
        this.lerp2 = 0.1;

        this.perspectiveMatrix = mat4.create();
        this.cameraTransformMatrix = mat4.create();
        this.orientationMatrix = mat4.create();
        this.transformMatrix = mat4.create();
        this.transformMatrixReflection = mat4.create();


        canvas.style.cursor = "-moz-grab";
        canvas.style.cursor = " -webkit-grab";


        document.addEventListener('mousemove', (e) => {
            this.currentMouseX = e.clientX;
            this.currentMouseY = e.clientY;
        }, false);

        document.addEventListener('mousedown', (e) => {
            canvas.style.cursor = "-moz-grabbing";
            canvas.style.cursor = " -webkit-grabbing";
            this.down = true;
        }, false);

        document.addEventListener('mouseup', (e) => {
            canvas.style.cursor = "-moz-grab";
            canvas.style.cursor = " -webkit-grab";
            this.down = false;
        }, false);
    }

    

    updateCamera(perspective, aspectRatio, radius) {

       this.ratio = radius;

        mat4.perspective(this.perspectiveMatrix, perspective * Math.PI / 180, aspectRatio, 0.01, 1000);

        if (!this.block) {

            if (this.down) {
                this.alpha -= 0.1 * (this.currentMouseY - this.prevMouseY) * Math.PI / 180;
                this.beta += 0.1 * (this.currentMouseX - this.prevMouseX) * Math.PI / 180;
            } 

            // if(this.gaze && !this.down) {
            //     this.alpha = Math.PI / 2 - 1.0 * (this.currentMouseY - this.prevMouseY) * Math.PI / 180;
            //     this.beta = Math.PI / 2 + 1.0 * (this.currentMouseX - this.prevMouseX) * Math.PI / 180;
            // }
            

            if (this.alpha <= 0.3 * Math.PI) this.alpha = 0.3 * Math.PI;
            if (this.alpha >= 0.52 * Math.PI) this.alpha = 0.52 * Math.PI;

            if (this.beta > -0.1 * Math.PI) this.beta = -0.1 * Math.PI;
            if (this.beta < -0.9 * Math.PI) this.beta = -0.9 * Math.PI;

        }

        this.lerp = this.down ? 0.2 : 0.05;
        this.lerp2 += (this.lerp - this.lerp2) * 0.15;


        if (this._alpha != this.alpha || this._beta != this.beta || this.init) {
            this._alpha += (this.alpha - this._alpha) * this.lerp2;
            this._beta += (this.beta - this._beta) * this.lerp2;

            this._alpha2 += (this._alpha - this._alpha2) * this.lerp2;
            this._beta2 += (this._beta - this._beta2) * this.lerp2;

            this.position[0] = this.ratio * Math.sin(this._alpha2) * Math.sin(this._beta2) + this.target[0];
            this.position[1] = this.ratio * Math.cos(this._alpha2) + this.target[1];
            this.position[2] = this.ratio * Math.sin(this._alpha2) * Math.cos(this._beta2) + this.target[2];
            this.cameraTransformMatrix = this.defineTransformMatrix(this.position, this.target, [0, 1, 0]);
            for(let i = 0; i < 16; i++) {
                this.orientationMatrix[i] = this.cameraTransformMatrix[i];
            }
            this.orientationMatrix[12] = 0;
            this.orientationMatrix[13] = 0;
            this.orientationMatrix[14] = 0;
        }
        this.prevMouseX = this.currentMouseX;
        this.prevMouseY = this.currentMouseY;

        mat4.multiply(this.transformMatrix, this.perspectiveMatrix, this.cameraTransformMatrix);
    }

    calculateReflection(pos, normal) {

        //𝑟=𝑑−2(𝑑⋅𝑛)𝑛
        let viewVec = vec3.fromValues(pos[0], pos[1], pos[2]);
        vec3.sub(viewVec, viewVec, this.position);
        let n1 = vec3.create();
        vec3.scale(n1, normal, 2 * vec3.dot(viewVec, normal));
        vec3.sub(viewVec, viewVec, n1);
        vec3.negate(viewVec, viewVec);
        vec3.add(viewVec, viewVec, pos);
        
        let targetVec = vec3.fromValues(pos[0], pos[1], pos[2]);
        vec3.sub(targetVec, targetVec, this.target);
        vec3.scale(n1, normal, 2 * vec3.dot(targetVec, normal));
        vec3.sub(targetVec, targetVec, n1);
        vec3.negate(targetVec, targetVec);
        vec3.add(targetVec, targetVec, pos);

        let up = vec3.fromValues(0, -1, 0);
        this.reflectionPosition = viewVec;
        this.cameraReflectionMatrix = this.defineTransformMatrix2(viewVec, targetVec, up);

        mat4.multiply(this.transformMatrixReflection, this.perspectiveMatrix, this.cameraReflectionMatrix);

    }

    defineTransformMatrix(objectVector, targetVector, up) {
        let matrix = mat4.create();
        let eyeVector = vec3.create();
        let normalVector = vec3.create();
        let upVector = vec3.create();
        let rightVector = vec3.create();
        let yVector = vec3.create();

        yVector[0] = up[0];
        yVector[1] = up[1];
        yVector[2] = up[2];

        vec3.subtract(eyeVector, objectVector, targetVector);

        vec3.normalize(normalVector, eyeVector);

        let reference = vec3.dot(normalVector, yVector);
        let reference2 = vec3.create();

        vec3.scale(reference2, normalVector, reference);
        vec3.subtract(upVector, yVector, reference2);
        vec3.normalize(upVector, upVector);
        vec3.cross(rightVector, normalVector, upVector);

        matrix[0] = rightVector[0];
        matrix[1] = upVector[0];
        matrix[2] = normalVector[0];
        matrix[3] = 0;
        matrix[4] = rightVector[1];
        matrix[5] = upVector[1];
        matrix[6] = normalVector[1];
        matrix[7] = 0;
        matrix[8] = rightVector[2];
        matrix[9] = upVector[2];
        matrix[10] = normalVector[2];
        matrix[11] = 0;
        matrix[12] = -vec3.dot(objectVector, rightVector);
        matrix[13] = -vec3.dot(objectVector, upVector);
        matrix[14] = -vec3.dot(objectVector, normalVector);
        matrix[15] = 1;
        return matrix;
    }

    defineTransformMatrix2(objectVector, targetVector, up) {
        let matrix = mat4.create();
        let eyeVector = vec3.create();
        let normalVector = vec3.create();
        let upVector = vec3.create();
        let rightVector = vec3.create();
        let yVector = vec3.create();

        yVector[0] = up[0];
        yVector[1] = up[1];
        yVector[2] = up[2];

        vec3.subtract(eyeVector, objectVector, targetVector);

        vec3.normalize(normalVector, eyeVector);

        let reference = vec3.dot(normalVector, yVector);
        let reference2 = vec3.create();

        vec3.scale(reference2, normalVector, reference);
        vec3.subtract(upVector, yVector, reference2);
        vec3.normalize(upVector, upVector);
        vec3.cross(rightVector, upVector, normalVector);

        matrix[0] = rightVector[0];
        matrix[1] = upVector[0];
        matrix[2] = normalVector[0];
        matrix[3] = 0;
        matrix[4] = rightVector[1];
        matrix[5] = upVector[1];
        matrix[6] = normalVector[1];
        matrix[7] = 0;
        matrix[8] = rightVector[2];
        matrix[9] = upVector[2];
        matrix[10] = normalVector[2];
        matrix[11] = 0;
        matrix[12] = -vec3.dot(objectVector, rightVector);
        matrix[13] = -vec3.dot(objectVector, upVector);
        matrix[14] = -vec3.dot(objectVector, normalVector);
        matrix[15] = 1;
        return matrix;
    }
}

export {Camera}