import { CreateBufferResult, MDN } from "./MDN";
import { Float16, Float4, RenderOptions, nullRefError } from "./common";

const vertexShaderSource = `
    attribute vec3 position;
    attribute vec4 color;

    uniform mat4 model;
    uniform mat4 projection;

    varying vec4 vColor;

    void main() {
        vColor = color;
        gl_Position = projection * model * vec4(position, 1.0);
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    varying vec4 vColor;

    void main() {
        gl_FragColor = vColor;
        // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`;

export class CubeDemo {
    gl: WebGLRenderingContext;
    transforms: {
        model: number[],
        projection: number[],
    };
    handlers: {
        model: WebGLUniformLocation,
        projection: WebGLUniformLocation,
        position: number,
        color: number,
    };
    buffers: CreateBufferResult;
    webglProgram: WebGLProgram;
    renderParams: RenderOptions;

    constructor(gl: WebGLRenderingContext, opts: RenderOptions) {
        this.renderParams = opts ?? nullRefError();
        this.gl = gl ?? nullRefError();

        this.transforms = {
            model: [],
            projection: [],
        }

        // MDN.createBuffersForCube and MDN.createCubeData are located in /shared/cube.js
        this.buffers = MDN.createBuffersForCube(this.gl, MDN.createCubeData());

        this.webglProgram = this.setupProgram();

        // Save the attribute and uniform locations
        this.handlers = {
            model: this.gl.getUniformLocation(this.webglProgram, "model") ?? nullRefError(),
            projection: this.gl.getUniformLocation(this.webglProgram, "projection") ?? nullRefError(),
            position: this.gl.getAttribLocation(this.webglProgram, "position") ?? nullRefError(),
            color: this.gl.getAttribLocation(this.webglProgram, "color") ?? nullRefError(),
        };
    }

    public setupProgram() {
        var gl = this.gl;

        // Setup a WebGL program
        var vertexShader = MDN.createShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
        var fragmentShader = MDN.createShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
        const webglProgram = MDN.linkProgram(gl, vertexShader, fragmentShader);

        gl.useProgram(webglProgram);

        // Tell WebGL to test the depth when drawing
        gl.enable(gl.DEPTH_TEST);

        return webglProgram;
    };

    public draw() {
        var gl = this.gl;

        const state = this.renderParams.state;

        this.transforms.model = MDN.multiplyArrayOfMatrices([
            MDN.translateMatrix(state.x, state.y, state.z), // step 4
            MDN.rotateYMatrix(state.rotY), // step 3
            MDN.rotateXMatrix(state.rotX), // step 2
            MDN.scaleMatrix(5, 5, 5)     // step 1
        ]);

        this.transforms.projection = MDN.perspectiveMatrix(state.fov, 1, state.near, state.far);
        // this.transforms.projection = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];

        // Update the data going to the GPU
        this.updateAttributesAndUniforms();

        // Perform the actual draw
        gl.drawElements(gl.TRIANGLES, this.buffers.elementsCount, gl.UNSIGNED_SHORT, 0);

        // Run the draw as a loop
        requestAnimationFrame(this.draw.bind(this));
    };

    public updateAttributesAndUniforms() {
        var gl = this.gl;

        // Setup the color uniform that will be shared across all triangles
        gl.uniformMatrix4fv(this.handlers.model, false, new Float32Array(this.transforms.model));
        gl.uniformMatrix4fv(this.handlers.projection, false, new Float32Array(this.transforms.projection));

        // Set the positions attribute
        gl.enableVertexAttribArray(this.handlers.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positions);
        gl.vertexAttribPointer(this.handlers.position, 3, gl.FLOAT, false, 0, 0);

        // Set the colors attribute
        gl.enableVertexAttribArray(this.handlers.color);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.colors);
        gl.vertexAttribPointer(this.handlers.color, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.elements);
    };
}
