import { Mat4, Vec3 } from "./math";

export function Cube(): Vec3[] {
    return quadsToTriangles([
        // front
        [-0.5, -0.5, -0.5],
        [-0.5, 0.5, -0.5],
        [0.5, 0.5, -0.5],
        [0.5, -0.5, -0.5],

        // back
        [0.5, -0.5, 0.5],
        [0.5, 0.5, 0.5],
        [-0.5, 0.5, 0.5],
        [-0.5, -0.5, 0.5],

        // top
        [-0.5, 0.5, -0.5],
        [-0.5, 0.5, 0.5],
        [0.5, 0.5, 0.5],
        [0.5, 0.5, -0.5],

        // bottom
        [0.5, -0.5, -0.5],
        [0.5, -0.5, 0.5],
        [-0.5, -0.5, 0.5],
        [-0.5, -0.5, -0.5],


        // left
        [-0.5, 0.5, -0.5],
        [-0.5, -0.5, -0.5],
        [-0.5, -0.5, 0.5],
        [-0.5, 0.5, 0.5],

        // right
        [0.5, 0.5, 0.5],
        [0.5, -0.5, 0.5],
        [0.5, -0.5, -0.5],
        [0.5, 0.5, -0.5],
    ])
};

export function quadsToTriangles(vectors: Vec3[]) {
    if (vectors.length % 4 !== 0) {
        throw "length must be a multiple of 4 to transform it to triangles";
    }

    let triangles: Vec3[] = [];
    for (let i = 0; i < vectors.length; i += 4) {
        triangles.push(
            vectors[i],
            vectors[i + 1],
            vectors[i + 2]
        );
        triangles.push(
            vectors[i + 2],
            vectors[i + 3],
            vectors[i]
        );
    }

    return triangles;
}

export function transformSingle(vec: Vec3, mat4: Mat4): Vec3 {
    const x = vec[0];
    const y = vec[1];
    const z = vec[2];

    return [
        x * mat4[0][0] + y * mat4[0][1] + z * mat4[0][2] + mat4[0][3],
        x * mat4[1][0] + y * mat4[1][1] + z * mat4[1][2] + mat4[1][3],
        x * mat4[2][0] + y * mat4[2][1] + z * mat4[2][2] + mat4[2][3],
        //x * mat4[3][0] + y * mat4[3][1] + z * mat4[3][2] + mat4[3][3],
    ]
}

export function transform(vecs: Vec3[], translation: Mat4): Vec3[] {
    const res: Vec3[] = [];
    for (let i = 0; i < vecs.length; i++) {
        res[i] = transformSingle(vecs[i], translation);
    }

    return res;
}

export function translate(dx: number, dy: number, dz: number): Mat4 {
    return [
        [1, 0, 0, dx],
        [0, 1, 0, dy],
        [0, 0, 1, dz],
        [0, 0, 0, 1],
    ];
}

const cos = Math.cos;
const sin = Math.sin;

export function rotateX(phi: number): Mat4 {
    return [
        [1, 0, 0, 0],
        [0, cos(phi), -sin(phi), 0],
        [0, sin(phi), cos(phi), 0],
        [0, 0, 0, 0],
    ];
}

export function rotateY(phi: number): Mat4 {
    return [
        [cos(phi), 0, sin(phi), 0],
        [0, 1, 0, 0],
        [-sin(phi), 0, cos(phi), 0],
        [0, 0, 0, 0],
    ];
}

export function rotZ(phi: number): Mat4 {
    return [
        [cos(phi), -sin(phi), 0, 0],
        [sin(phi), cos(phi), 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0],
    ];
}