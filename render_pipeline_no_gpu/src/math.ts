"strict";

export type Vertex = {x:number, y:number, z:number};
export type VertexEx = { position: Vertex, normal: Vertex, color?: RGBA };
export type Vec3Tuple = [x:number, y:number, z:number];
export type Vec4 = [number, number, number, number];
export type Mat4 = [Vec4, Vec4, Vec4, Vec4];
export type float4 = [Vec4, Vec4, Vec4, Vec4];
export type RGBA = [Octal, Octal, Octal, Octal?]
export type Octal = ComputeRange<256>[number]

type ComputeRange<
    N extends number,
    Result extends Array<unknown> = [],
> =
    (Result['length'] extends N
        ? Result
        : ComputeRange<N, [...Result, Result['length']]>
    )



function mulMat4(a: Mat4, b: Mat4): Mat4 {
    return [
        [a[0][0] * b[0][0], a[0][1] * b[0][1], a[0][2] * b[0][2], a[0][3] * b[0][3]],
        [a[1][0] * b[1][0], a[1][1] * b[1][1], a[1][2] * b[1][2], a[1][3] * b[1][3]],
        [a[2][0] * b[2][0], a[2][1] * b[2][1], a[2][2] * b[2][2], a[2][3] * b[2][3]],
        [a[3][0] * b[3][0], a[3][1] * b[3][1], a[3][2] * b[3][2], a[3][3] * b[3][3]],
    ];
}

export class Triangle {
    constructor(
        public readonly v1: Vector3,
        public readonly v2: Vector3,
        public readonly v3: Vector3
    ) {
    }

    static create(a: Vertex, b: Vertex, c: Vertex);
    static create(a: VertexEx, b: VertexEx, c: VertexEx);
    static create<T extends Vertex | VertexEx>(a: T, b: T, c: T) {
        if (a.hasOwnProperty("x")) {
            return new Triangle(
                Vector.create3(a as Vertex),
                Vector.create3(b as Vertex),
                Vector.create3(c as Vertex)
            );
        }

        if (a.hasOwnProperty("position")) {
            return new Triangle(
                Vector.create3((a as VertexEx).position),
                Vector.create3((b as VertexEx).position),
                Vector.create3((c as VertexEx).position)
            );

        }

        throw "not implemented";
    }

    normal(): Vector3 {
        const u = this.v2.sub(this.v1);
        const v = this.v3.sub(this.v1);
        // console.log({
        //     v1: this.v1,
        //     v2: this.v2,
        //     v3: this.v3,
        //     u, 
        //     v,
        //     cross: u.crossProd(v)
        // });

        return u.crossProd(v);
    }
}

export class Vector {
    public static create3(v: Vertex);
    public static create3(v: VertexEx);
    public static create3(v: Vec3Tuple);
    public static create3(v: Vertex | Vec3Tuple | VertexEx) {
        if (v === undefined){
            throw "undefined";
        }

        if (Array.isArray(v)) {
            return new Vector3(v[0], v[1], v[2]);
        }
        const vo = v as object;

        if(vo !== undefined && vo.hasOwnProperty("v")) {
            const vex = v as VertexEx;
            return new Vector3(vex.position.x, vex.position.y, vex.position.z);
        }
        const vec = v as Vertex;
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
        return {x: this.x, y: this.y, z: this.z};
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

export function rad(deg: number): number {
    return deg / 360 * Math.PI * 2;
}

export function deg(rad: number): number {
    return rad / Math.PI / 2 * 360;
}

export function transform(vec: VertexEx, translation: Mat4): VertexEx;
export function transform(vecs: VertexEx[], translation: Mat4): VertexEx[];
export function transform(data: VertexEx | VertexEx[], translation: Mat4): VertexEx[] | VertexEx {
    if (!Array.isArray(data)) {
        return transformSingle(data as VertexEx, translation);
    }
    
    const vecs = data as VertexEx[];

    const res: VertexEx[] = [];
    for (let i = 0; i < vecs.length; i++) {
        res[i] = transformSingle(vecs[i], translation);
    }

    return res;

    function transformSingle(vec: VertexEx, mat: Mat4): VertexEx {
        const x = vec.position.x;
        const y = vec.position.y;
        const z = vec.position.z;
        const w = x * mat[3][0] + y * mat[3][1] + z * mat[3][2] + mat[3][3];

        return (
            {
                position: transformSingleVertex(vec.position, mat),
                normal: transformSingleVertex(vec.normal, mat),
                color: vec.color
            });
    }
}

function transformSingleVertex(vec: Vertex, mat : Mat4) : Vertex {
    const x = vec.x;
    const y = vec.y;
    const z = vec.z;
    return {
        x: (x * mat[0][0] + y * mat[0][1] + z * mat[0][2] + mat[0][3]),
        y: (x * mat[1][0] + y * mat[1][1] + z * mat[1][2] + mat[1][3]),
        z: (x * mat[2][0] + y * mat[2][1] + z * mat[2][2] + mat[2][3])
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

export function cameraProjection(): Mat4 {
    return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
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

type Length<Type extends readonly unknown[]> = Type['length']

export function mul(matricies: Mat4[], vec: VertexEx) {
    let m = matricies[0];

    for (let i = 1; i < matricies.length; i++) {
        const currMat = matricies[i];
        for (let row = 0; row < currMat.length; row++) {
            const currRow = currMat[row];
            for (let col = 0; col < currRow.length; col++) {
                m[row][col] =
                    m[row][0] * currMat[col][0]
                    + m[row][1] * currMat[col][1]
                    + m[row][2] * currMat[col][2]
                    + m[row][3] * currMat[col][3];
            }
        }
    }

    return transform(vec, m);
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

export function length(v : Vertex): number {
    return Math.sqrt(sq(v.x) + sq(v.y) + sq(v.z));
}

export function sq(value: number) : number {
    return value * value;
}

export function sub(a: Vertex, b: Vertex): Vector3 {
    return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function crossProd(a: Vertex, b: Vertex): Vertex {
    return {
        x: (a.y * b.z) - (a.z * b.y),
        y: (a.z * b.x) - (a.x * b.z),
        z: (a.x * b.y) - (a.y * b.x)
    };
}