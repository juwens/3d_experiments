import { Mat4, Vec3, Vec4, Vector, transform, translate } from "./math";

export async function Teapot_3k(): Promise<Vec3[]> {
    const vectors = await load3dObject("/models/teapot_bezier0.tris", 0.4);
    return transform(vectors, translate(0,-0.5,0));
}

export async function Teapot_19k(): Promise<Vec3[]> {
    const vectors = await load3dObject("/models/teapot_bezier1.tris", 0.4);
    return transform(vectors, translate(0,-0.5,0));
}

export async function Teapot_150k(): Promise<Vec3[]> {
    const vectors = await load3dObject("/models/teapot_bezier2.tris", 0.4);
    return transform(vectors, translate(0,-0.5,0));
}

async function load3dObject(url : string, scale : number) : Promise<Vec3[]> {
    const response = await fetch(url);
    const lines = (await response.text()).split('\n');
    
    const res : Vec3[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const elements = line.split(' ');
        
        if (elements.length <= 1) {
            continue;
        }
        
        res.push([
            parseFloat(elements[0]) * scale,
            parseFloat(elements[1]) * scale,
            parseFloat(elements[2]) * scale
        ]);
    }

    return res;
}

export function Cube(): Promise<Vec3[]> {
    return new Promise<Vec3[]>(x => {
        const vectors = quadsToTriangles([
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
        ]);
        x(vectors);
    });
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
