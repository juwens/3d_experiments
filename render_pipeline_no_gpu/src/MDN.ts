import { Float16, Float4, nullRefError } from "./common";

export interface CreateBufferResult {
    positions: WebGLBuffer;
    colors: WebGLBuffer;
    elements: WebGLBuffer;
    elementsCount: number;
};
export class MDN {
    // Define the data that is needed to make a 3d cube
    public static createCubeData(): { positions: number[]; elements: number[]; colors: number[]; } {
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

        var colorsOfFaces: Float4[] = [
            [0.3, 1.0, 1.0, 1.0],    // Front face: cyan
            [1.0, 0.3, 0.3, 1.0],    // Back face: red
            [0.3, 1.0, 0.3, 1.0],    // Top face: green
            [0.3, 0.3, 1.0, 1.0],    // Bottom face: blue
            [1.0, 1.0, 0.3, 1.0],    // Right face: yellow
            [1.0, 0.3, 1.0, 1.0]     // Left face: purple
        ];

        // length == 96, which is 24 * 4
        // so it seemingly correlates to the indexes in the elements
        var colors: number[] = [];

        for (var j = 0; j < 6; j++) {
            const polygonColor: Float4 = colorsOfFaces[j];

            for (var i = 0; i < 4; i++) {
                colors = colors.concat(polygonColor);
            }
        }

        console.assert(colors.length == (24 * 4));

        var elements = [
            0, 1, 2, 0, 2, 3,    // front
            4, 5, 6, 4, 6, 7,    // back
            8, 9, 10, 8, 10, 11,   // top
            12, 13, 14, 12, 14, 15,   // bottom
            16, 17, 18, 16, 18, 19,   // right
            20, 21, 22, 20, 22, 23    // left
        ];

        console.assert(elements.length == (6 * 6));

        return {
            positions: positions,
            elements: elements,
            colors: colors
        }
    }

    // Take the data for a cube and bind the buffers for it.
    // Return an object collection of the buffers
    public static createBuffersForCube(gl: WebGLRenderingContext, cube: { positions: number[]; elements: number[]; colors: number[]; }): CreateBufferResult {
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
            elements: elements,
            elementsCount: cube.elements.length,
        }
    }

    public static matrixArrayToCssMatrix(array) {
        return "matrix3d(" + array.join(',') + ")";
    }

    public static multiplyPoint(matrix : Float16, point : Float4) : Float4 {
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

    public static multiplyMatrices(a: Float16, b: Float16): Float16 {
        // TODO - Simplify for explanation
        // currently taken from https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat4.js#L306-L337

        var result: Float16 = new Array<number>(16) as Float16;

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

    public static multiplyArrayOfMatrices(matrices : Float16[]) : Float16 {
        var inputMatrix = matrices[0];

        for (var i = 1; i < matrices.length; i++) {
            inputMatrix = MDN.multiplyMatrices(inputMatrix, matrices[i]);
        }

        return inputMatrix;
    }

    public static rotateXMatrix(a) : Float16  {
        var cos = Math.cos;
        var sin = Math.sin;

        return [
            1, 0, 0, 0,
            0, cos(a), -sin(a), 0,
            0, sin(a), cos(a), 0,
            0, 0, 0, 1
        ];
    }

    public static rotateYMatrix(a) : Float16  {
        var cos = Math.cos;
        var sin = Math.sin;

        return [
            cos(a), 0, sin(a), 0,
            0, 1, 0, 0,
            -sin(a), 0, cos(a), 0,
            0, 0, 0, 1
        ];
    }

    public static rotateZMatrix(a) : Float16  {
        var cos = Math.cos;
        var sin = Math.sin;

        return [
            cos(a), -sin(a), 0, 0,
            sin(a), cos(a), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }

    public static translateMatrix(x, y, z) : Float16  {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        ];
    }

    public static scaleMatrix(w, h, d) : Float16  {
        return [
            w, 0, 0, 0,
            0, h, 0, 0,
            0, 0, d, 0,
            0, 0, 0, 1
        ];
    }

    public static perspectiveMatrix(fieldOfViewInRadians, aspectRatio, near, far) : Float16 {
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

    public static orthographicMatrix(left, right, bottom, top, near, far) : Float16  {
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