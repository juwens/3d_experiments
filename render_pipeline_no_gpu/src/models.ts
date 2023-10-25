import { Mat4, Triangle as TriangleClass, Vertex, VertexEx, Vec4, Vector, Vector3, transform, translate, Vec3Tuple, RGBA } from "./math";

const cos = Math.cos;
const sin = Math.sin;

export async function Triangle(): Promise<VertexEx[]> {
    return new Promise(x => {
        const edge = 1;
        const halfWidth = Math.sin(30/180 * Math.PI) * edge;
        const height = Math.cos(30/180 * Math.PI) * edge;
        x([
            {
                position: vec(-halfWidth, 0, 0),
                normal: vec(0, 0, -1),
                color: [255, 0, 0],
            },
            {
                position: vec(halfWidth, 0, 0),
                normal: vec(0, 0, -1),
                color: [0, 255, 0],
            },
            {
                position: vec(0, height, 0),
                normal: vec(0, 0, -1),
                color: [0, 0, 255],
            }
        ])
    })
}

export async function Teapot_3k(): Promise<VertexEx[]> {
    const vectors = await load3dObject("/models/teapot_bezier0.tris", 0.4);
    return transform(vectors, translate(0, -0.5, 0));
}

export async function Teapot_19k(): Promise<VertexEx[]> {
    const vectors = await load3dObject("/models/teapot_bezier1.tris", 0.4);
    return transform(vectors, translate(0, -0.5, 0));
}

export async function Teapot_150k(): Promise<VertexEx[]> {
    const vectors = await load3dObject("/models/teapot_bezier2.tris", 0.4);
    return transform(vectors, translate(0, -0.5, 0));
}

export async function Sphere(): Promise<Vertex[]> {
    return new Promise<Vertex[]>(x => {
        const res: Vertex[] = [];
        const step = (Math.PI / 6);

        for (let theta = 0; theta < Math.PI * 2; theta += step) {
            for (let phi = -Math.PI / 2; phi < (Math.PI / 2); phi += step) {
                res.push(getPosition(1, theta, phi));
                res.push(getPosition(1, theta, phi + step));
                res.push(getPosition(1, theta + step, phi + step));
                res.push(getPosition(1, theta + step, phi + step));
                res.push(getPosition(1, theta + step, phi));
                res.push(getPosition(1, theta, phi));
            }
        }
        x(res.reverse());
    });

    /**
     * 
     * @param r 
     * @param theta x -> y
     * @param phi z -> crossProd(x, y)
     */
    function getPosition(r, theta, phi): Vertex {
        return vec(sin(theta) * cos(phi) * r, sin(phi) * r, cos(theta) * cos(phi) * r);
    }
}

async function load3dObject(url: string, scale: number): Promise<VertexEx[]> {
    const response = await fetch(url);
    const lines = (await response.text()).split('\n');

    const vertices: Vertex[] = [];

    for (let i = 1; i < lines.length; i += 3) {
        const line = lines[i];
        const elements = line.split(' ');

        if (elements.length <= 1) {
            continue;
        }

        vertices.push(vec(
            parseFloat(elements[0]) * scale,
            parseFloat(elements[1]) * scale,
            parseFloat(elements[2]) * scale
        ));
    }

    const res: VertexEx[] = [];

    for (let i = 0; i < vertices.length; i += 3) {
        const tr = TriangleClass.create(
            vertices[i],
            vertices[i + 1],
            vertices[i + 2] ?? [0,0,0]);

        const n = tr.normal();
        res.push({ position: tr.v1.toVec3(), normal: n.toVec3() });
        res.push({ position: tr.v2.toVec3(), normal: n.toVec3() });
        res.push({ position: tr.v3.toVec3(), normal: n.toVec3() });
    }

    return res;
}

export function Plane(): Promise<Vertex[]> {
    return new Promise<Vertex[]>(x => {
        const res = [
            [0, 0, 0],
            [0, 0, 1],
            [1, 0, 1],
        ];
    });
}

export function Cube_from_edges(): Promise<Vertex[]> {
    return new Promise<Vertex[]>(x => {
        const res = edgesToCube(
            {
                ltf: vec(0, 1, 0),
                rtf: vec(1, 1, 0),
                lbf: vec(0, 0, 0),
                rbf: vec(1, 0, 0)
            }
        );
        x(res);
    });
}

export function Cube_old(): Promise<VertexEx[]> {
    return new Promise<VertexEx[]>(x => {
        const vectors : VertexEx[] = [];
        
        // front
        vectors.push(...quadsToTriangles([
            vec(-0.5, -0.5, -0.5),
            vec(-0.5, 0.5, -0.5),
            vec(0.5, 0.5, -0.5),
            vec(0.5, -0.5, -0.5),
        ], [255,0,0]));


        // back
        vectors.push(...quadsToTriangles([
            vec(0.5, -0.5, 0.5),
            vec(0.5, 0.5, 0.5),
            vec(-0.5, 0.5, 0.5),
            vec(-0.5, -0.5, 0.5),
        ], [0,255,0]));

        // top
        vectors.push(...quadsToTriangles([
            vec(-0.5, 0.5, -0.5),
            vec(-0.5, 0.5, 0.5),
            vec(0.5, 0.5, 0.5),
            vec(0.5, 0.5, -0.5),
        ], [0,0,255]));

        // bottom
        vectors.push(...quadsToTriangles([
            vec(0.5, -0.5, -0.5),
            vec(0.5, -0.5, 0.5),
            vec(-0.5, -0.5, 0.5),
            vec(-0.5, -0.5, -0.5),
        ], [255,255,0]));

        // right
        vectors.push(...quadsToTriangles([
            vec(0.5, 0.5, 0.5),
            vec(0.5, -0.5, 0.5),
            vec(0.5, -0.5, -0.5),
            vec(0.5, 0.5, -0.5),
        ], [0,255, 255]));

        // left
        var a = [
            vec(-0.5, 0.5, -0.5),
            vec(-0.5, -0.5, -0.5),
            vec(-0.5, -0.5, 0.5),
            vec(-0.5, 0.5, 0.5),
        ]

        x(vectors);
    });
};

export function quadsToTriangles(vectors: Vertex[], color: RGBA): VertexEx[] {
    if (vectors.length % 4 !== 0) {
        throw "length must be a multiple of 4 to transform it to triangles";
    }

    let vertices: VertexEx[] = [];
    for (let i = 0; i < vectors.length; i += 4) {
        const v1 = vectors[i];
        const v2 = vectors[i + 1];
        const v3 = vectors[i + 2];
        const v4 = vectors[i + 3];

        const n1 = TriangleClass.create(v1, v2, v3).normal().toVec3();
        const n2 = TriangleClass.create(v3, v4, v1).normal().toVec3();

        vertices.push({ position: v1, normal: n1, color: color });
        vertices.push({ position: v2, normal: n1, color: color });
        vertices.push({ position: v3, normal: n1, color: color });

        vertices.push({ position: v3, normal: n2, color: color });
        vertices.push({ position: v4, normal: n2, color: color });
        vertices.push({ position: v1, normal: n2, color: color });
    }

    return vertices;
}

interface CubeEdges {
    ltf: Vertex;
    rtf: Vertex;
    lbf: Vertex;
    rbf: Vertex;
}

export function edgesToCube(edges: CubeEdges): Vertex[] {
    return [];
}

export function vec(x: number, y: number, z: number): Vertex {
    return {
        x: x ,
        y: y,
        z: z,
    };    
}
