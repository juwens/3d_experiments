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
`

export function startWebglRender(canvas: HTMLCanvasElement) {
    var cube = new CubeDemo(canvas);
    cube.draw();
}

function nullRefError(): never {
    throw new Error("null");
}

type Mat4 = [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];

class CubeDemo {
    canvas: HTMLCanvasElement;
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
    buffers: {
        positions: WebGLBuffer,
        colors: WebGLBuffer,
        elements: WebGLBuffer,
    };
    webglProgram: WebGLProgram;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        this.gl = canvas.getContext("webgl") ?? nullRefError();

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

    public computeModelMatrix(now) {
        //See /shared/matrices.js for the definitions of these matrix functions

        // Rotate a slight tilt
        var rotateX = MDN.rotateXMatrix(now * 0.0003);

        // Rotate according to time
        var rotateY = MDN.rotateYMatrix(now * 0.0005);

        // Multiply together, make sure and read them in opposite order
        this.transforms.model = MDN.multiplyArrayOfMatrices([
            MDN.translateMatrix(0, 0, -20), // step 4
            //rotateY,  // step 3
            MDN.rotateYMatrix(Math.PI / 4),
            //rotateX,  // step 2
            MDN.rotateXMatrix(Math.PI / 4),
            MDN.scaleMatrix(5, 5, 5)     // step 1
        ]);
    };

    public draw() {
        var gl = this.gl;
        var now = Date.now();

        // Compute our matrices
        this.computeModelMatrix(now);
        this.transforms.projection = MDN.perspectiveMatrix(Math.PI * 0.5, 1, 1, 50);
        // this.transforms.projection = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];

        // Update the data going to the GPU
        this.updateAttributesAndUniforms();

        // Perform the actual draw
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

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

class MDN {

    // Define the data that is needed to make a 3d cube
    public static createCubeData() {
        var positions = [
            // Front face
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0, 1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, -1.0, -1.0,

            // Top face
            -1.0, 1.0, -1.0,
            -1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0,

            // Right face
            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, 1.0, 1.0,
            1.0, -1.0, 1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0, 1.0,
            -1.0, 1.0, 1.0,
            -1.0, 1.0, -1.0
        ];

        var colorsOfFaces = [
            [0.3, 1.0, 1.0, 1.0],    // Front face: cyan
            [1.0, 0.3, 0.3, 1.0],    // Back face: red
            [0.3, 1.0, 0.3, 1.0],    // Top face: green
            [0.3, 0.3, 1.0, 1.0],    // Bottom face: blue
            [1.0, 1.0, 0.3, 1.0],    // Right face: yellow
            [1.0, 0.3, 1.0, 1.0]     // Left face: purple
        ];

        var colors: number[] = [];

        for (var j = 0; j < 6; j++) {
            var polygonColor = colorsOfFaces[j];

            for (var i = 0; i < 4; i++) {
                colors = colors.concat(polygonColor);
            }
        }

        var elements = [
            0, 1, 2, 0, 2, 3,    // front
            4, 5, 6, 4, 6, 7,    // back
            8, 9, 10, 8, 10, 11,   // top
            12, 13, 14, 12, 14, 15,   // bottom
            16, 17, 18, 16, 18, 19,   // right
            20, 21, 22, 20, 22, 23    // left
        ]

        return {
            positions: positions,
            elements: elements,
            colors: colors
        }
    }

    // Take the data for a cube and bind the buffers for it.
    // Return an object collection of the buffers
    public static createBuffersForCube(gl: WebGLRenderingContext, cube: { positions: number[]; elements: number[]; colors: number[]; }): { positions: WebGLBuffer; colors: WebGLBuffer; elements: WebGLBuffer; } {
        const positions = gl.createBuffer() || nullRefError();
        gl.bindBuffer(gl.ARRAY_BUFFER, positions);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.positions), gl.STATIC_DRAW);

        const colors = gl.createBuffer() || nullRefError();
        gl.bindBuffer(gl.ARRAY_BUFFER, colors);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.colors), gl.STATIC_DRAW);

        const elements = gl.createBuffer() || nullRefError();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elements);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube.elements), gl.STATIC_DRAW);

        return {
            positions: positions,
            colors: colors,
            elements: elements
        }
    }

    public static matrixArrayToCssMatrix(array) {
        return "matrix3d(" + array.join(',') + ")";
    }

    public static multiplyPoint(matrix, point) {
        var x = point[0], y = point[1], z = point[2], w = point[3];

        var c1r1 = matrix[0], c2r1 = matrix[1], c3r1 = matrix[2], c4r1 = matrix[3],
            c1r2 = matrix[4], c2r2 = matrix[5], c3r2 = matrix[6], c4r2 = matrix[7],
            c1r3 = matrix[8], c2r3 = matrix[9], c3r3 = matrix[10], c4r3 = matrix[11],
            c1r4 = matrix[12], c2r4 = matrix[13], c3r4 = matrix[14], c4r4 = matrix[15];

        return [
            x * c1r1 + y * c1r2 + z * c1r3 + w * c1r4,
            x * c2r1 + y * c2r2 + z * c2r3 + w * c2r4,
            x * c3r1 + y * c3r2 + z * c3r3 + w * c3r4,
            x * c4r1 + y * c4r2 + z * c4r3 + w * c4r4
        ];
    }

    public static multiplyMatrices(a: Mat4, b: Mat4): Mat4 {
        // TODO - Simplify for explanation
        // currently taken from https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat4.js#L306-L337

        var result: Mat4 = new Array<number>(16) as Mat4;

        var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
            a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
            a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
            a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        // Cache only the current line of the second matrix
        var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        result[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        result[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        result[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        result[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
        result[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        result[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        result[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        result[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
        result[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        result[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        result[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        result[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
        result[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        result[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        result[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        result[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        return result;
    }

    public static multiplyArrayOfMatrices(matrices) {
        var inputMatrix = matrices[0];

        for (var i = 1; i < matrices.length; i++) {
            inputMatrix = MDN.multiplyMatrices(inputMatrix, matrices[i]);
        }

        return inputMatrix;
    }

    public static rotateXMatrix(a) {
        var cos = Math.cos;
        var sin = Math.sin;

        return [
            1, 0, 0, 0,
            0, cos(a), -sin(a), 0,
            0, sin(a), cos(a), 0,
            0, 0, 0, 1
        ];
    }

    public static rotateYMatrix(a) {
        var cos = Math.cos;
        var sin = Math.sin;

        return [
            cos(a), 0, sin(a), 0,
            0, 1, 0, 0,
            -sin(a), 0, cos(a), 0,
            0, 0, 0, 1
        ];
    }

    public static rotateZMatrix(a) {
        var cos = Math.cos;
        var sin = Math.sin;

        return [
            cos(a), -sin(a), 0, 0,
            sin(a), cos(a), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }

    public static translateMatrix(x, y, z) {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        ];
    }

    public static scaleMatrix(w, h, d) {
        return [
            w, 0, 0, 0,
            0, h, 0, 0,
            0, 0, d, 0,
            0, 0, 0, 1
        ];
    }

    public static perspectiveMatrix(fieldOfViewInRadians, aspectRatio, near, far) {
        // Construct a perspective matrix

        /*
           Field of view - the angle in radians of what's in view along the Y axis
           Aspect Ratio - the ratio of the canvas, typically canvas.width / canvas.height
           Near - Anything before this point in the Z direction gets clipped (outside of the clip space)
           Far - Anything after this point in the Z direction gets clipped (outside of the clip space)
        */

        var f = 1.0 / Math.tan(fieldOfViewInRadians / 2);
        var rangeInv = 1 / (near - far);

        return [
            f / aspectRatio, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ];
    }

    public static orthographicMatrix(left, right, bottom, top, near, far) {
        // Each of the parameters represents the plane of the bounding box

        var lr = 1 / (left - right);
        var bt = 1 / (bottom - top);
        var nf = 1 / (near - far);

        var row4col1 = (left + right) * lr;
        var row4col2 = (top + bottom) * bt;
        var row4col3 = (far + near) * nf;

        return [
            -2 * lr, 0, 0, 0,
            0, -2 * bt, 0, 0,
            0, 0, 2 * nf, 0,
            row4col1, row4col2, row4col3, 1
        ];
    }

    public static createShader(gl, source, type) {
        // Compiles either a shader of type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER

        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            var info = gl.getShaderInfoLog(shader);
            throw "Could not compile WebGL program. \n\n" + info;
        }

        return shader
    }

    public static linkProgram(gl: WebGLRenderingContext, vertexShader, fragmentShader): WebGLProgram {
        var program = gl.createProgram() ?? nullRefError();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            var info = gl.getProgramInfoLog(program);
            throw "Could not compile WebGL program. \n\n" + info;
        }

        return program;
    }
}