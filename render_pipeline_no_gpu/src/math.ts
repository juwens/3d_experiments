export type Vertex = { x: number, y: number, z: number };
export type VertexEx = { position: Vertex, normal: Vertex, color?: RGBA };
export type Vec4 = [number, number, number, number];
export type Mat4 = [Vec4, Vec4, Vec4, Vec4];
export type RGBA = [Octal, Octal, Octal, Octal?]
export type Octal = ComputeRange<256>[number]

type ComputeRange<N extends number, Result extends Array<unknown> = []> =
    (Result['length'] extends N
        ? Result
        : ComputeRange<N, [...Result, Result['length']]>
    )

export class Vector {
    public static create3(vec: Vertex);
    public static create3(vec: VertexEx);
    public static create3(obj: Vertex | VertexEx) {
        if (obj === undefined || obj === null) {
            throw "undefined";
        }

        if (Array.isArray(obj)) {
            return new Vector3(obj[0], obj[1], obj[2]);
        }

        if (obj !== undefined && "v" in obj) {
            const vex = obj as VertexEx;
            return new Vector3(vex.position.x, vex.position.y, vex.position.z);
        }
        const vec = obj as Vertex;
        return new Vector3(vec.x, vec.y, vec.z);
    }
    //     public static create4(v: Vec3 | Vec4) {
    //         if (v.length === 3) {
    //             return new Vector4(v[0], v[1], v[2], 1);
    //         }
    //         return new Vector4(v[0], v[1], v[2], v[3]);
    //     }
}

export class Vector3 {
    constructor(public readonly x: number, public readonly y: number, public readonly z: number) {
    }

    public sub(other: Vector3): Vector3 {
        return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
    }

    public length(): number {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }

    public crossProd(v: Vector3): Vector3 {
        const r = crossProd(this.toVertex(), v.toVertex());
        return new Vector3(r.x, r.y, r.z);
    }

    public dotProd(b: Vector3): number {
        const a = this;
        return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
    }

    public toVertex(): Vertex {
        return { x: this.x, y: this.y, z: this.z };
    }

    public toString(precision?: number): string {
        precision = precision ?? 1;
        return `<${this.x.toFixed(precision)}, ${this.y.toFixed(precision)}, ${this.z.toFixed(precision)}>(${this.length().toFixed(precision)})`;
    }

    public angle(other: Vector3) {
        return Math.acos(
            this.dotProd(other)
            /
            (this.length() * other.length())
        )
    }
}

/*
export class Vector4 {
    constructor(
        public x: number,
        public y: number,
        public z: number,
        public w: number) {
        this.correct();
    }

    public sub(other: Vector4): Vector4 {
        this.correct();
        other.correct();
        return new Vector4(this.x - other.x, this.y - other.y, this.z - other.z, 1);
    }

    public length(): number {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2)) * this.w;
    }

    public crossProd(v: Vector4): Vector4 {
        const u = this;
        u.correct();
        v.correct();
        return new Vector4(
            (u.y * v.z) - (u.z * v.y),
            (u.z * v.x) - (u.x * v.z),
            (u.x * v.y) - (u.y * v.x),
            1
        );
    }

    public correct() {
        if (this.w === 1) {
            return this;
        }

        this.x = this.x / this.w;
        this.y = this.y / this.w;
        this.z = this.z / this.w;
        this.w = 1;

        return this;
    }

    public dotProd(b: Vector4): number {
        const a = this;
        a.correct();
        b.correct();
        return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
    }

    public toVec3(): Vec3 {
        return [
            this.x / this.w, 
            this.y / this.w, 
            this.z / this.w];
    }

    public toVec4(): Vec4 {
        return [this.x, this.y, this.z, this.w];
    }

    public toString(precision?: number): string {
        precision = precision ?? 1;
        return `<${this.x.toFixed(precision)}, ${this.y.toFixed(precision)}, ${this.z.toFixed(precision)}>(${this.length().toFixed(precision)})`;
    }

    public angle(other: Vector4) {
        return Math.acos(
            this.dotProd(other)
            /
            (this.length() * other.length())
        )
    }
}
*/
export function mean(list: number[]) {
    const sum = list.reduce((a, b) => a + b, 0);
    return sum / list.length;
}

export function median(list: number[]) {
    const sorted = list.sort();
    return sorted[Math.floor(sorted.length / 2)];
}

export function deg2rad(deg: number): number {
    return deg / 360 * Math.PI * 2;
}

export function rad2deg(rad: number): number {
    return rad / Math.PI / 2 * 360;
}

export function transformEx1(vec: VertexEx, translation: Mat4): VertexEx {
    return transformEx([vec], translation)[0];
}


export function transformEx(vecs: VertexEx[], translation: Mat4): VertexEx[] {
    const res: VertexEx[] = vecs.map(x => transformSingle(x, translation));
    return res;

    function transformSingle(vec: VertexEx, mat: Mat4): VertexEx {
        return (
            {
                position: transformSingleVertex(vec.position, mat),
                normal: unit(transformSingleVertex(vec.normal, mat)),
                color: vec.color
            });
    }
}

function transformSingleVertex(vec: Vertex, mat: Mat4): Vertex {
    const x = vec.x;
    const y = vec.y;
    const z = vec.z;
    const w = x * mat[3][0] + y * mat[3][1] + z * mat[3][2] + mat[3][3];

    return {
        x: (x * mat[0][0] + y * mat[0][1] + z * mat[0][2] + mat[0][3]) / w,
        y: (x * mat[1][0] + y * mat[1][1] + z * mat[1][2] + mat[1][3]) / w,
        z: (x * mat[2][0] + y * mat[2][1] + z * mat[2][2] + mat[2][3]) / w,
    };
}

export function scale(dx: number, dy: number, dz: number): Mat4 {
    return [
        [dx, 0, 0, 0],
        [0, dy, 0, 0],
        [0, 0, dz, 0],
        [0, 0, 0, 1],
    ];
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
        [0, 0, 0, 1],
    ];
}

export function rotateY(phi: number): Mat4 {
    return [
        [cos(phi), 0, sin(phi), 0],
        [0, 1, 0, 0],
        [-sin(phi), 0, cos(phi), 0],
        [0, 0, 0, 1],
    ];
}

export function rotateZ(phi: number): Mat4 {
    return [
        [cos(phi), -sin(phi), 0, 0],
        [sin(phi), cos(phi), 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ];
}

export function orhto(fov: number, near: number, far: number): Mat4 {
    const scale = 1 / (Math.tan(fov / 2));
    return [
        [scale, 0, 0, 0],
        [0, scale, 0, 0],
        [0, 0, -far / (far - near), -1],
        [0, 0, -far * near / (far - near), 0],
    ];
}

export function noopProjection(): Mat4 {
    return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ];
}

export function mul(matricies: Mat4[], vec: VertexEx) {
    let m = noopProjection();

    for (let i = 0; i < matricies.length; i++) {
        const currMat = matricies[i];
        m = mulMat4(m, currMat);
    }

    return transformEx([vec], m)[0];
}

export function mulMat4(m1: Mat4, m2: Mat4): Mat4 {
    const res: number[][] = new Array(4);
    for (let row = 0; row < 4; row++) {
        res[row] = new Array(4);
        for (let col = 0; col < 4; col++) {
            res[row][col] =
                m1[row][0] * m2[0][col]
                + m1[row][1] * m2[1][col]
                + m1[row][2] * m2[2][col]
                + m1[row][3] * m2[3][col];
        }
    }

    return res as Mat4;
}

export function angle(a: Vertex, b: Vertex) {
    return Math.acos(
        dotProd(a, b)
        /
        (length(a) * length(b))
    )
}

export function dotProd(a: Vertex, b: Vertex): number {
    return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
}

export function length(v: Vertex): number {
    return Math.sqrt(sq(v.x) + sq(v.y) + sq(v.z));
}

export function sq(value: number): number {
    return value * value;
}

export function sub(a: Vertex, b: Vertex): Vertex {
    return {
        x: a.x - b.x,
        y: a.y - b.y,
        z: a.z - b.z
    };
}

export function crossProd(a: Vertex, b: Vertex): Vertex {
    return {
        x: (a.y * b.z) - (a.z * b.y),
        y: (a.z * b.x) - (a.x * b.z),
        z: (a.x * b.y) - (a.y * b.x)
    };
}

export function unit(a: Vertex): Vertex {
    const len = length(a);
    const res = { x: a.x / len, y: a.y / len, z: a.z / len };
    return res;
}

export function normal(a: Vertex, b: Vertex, c: Vertex): Vertex {
    const u = sub(b, a);
    const v = sub(c, a);
    return crossProd(u, v);
}