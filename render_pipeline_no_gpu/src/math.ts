export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];
export type Mat4 = [Vec4, Vec4, Vec4, Vec4];

export class Triangle {
    constructor(
        public readonly v1: Vector4,
        public readonly v2: Vector4,
        public readonly v3: Vector4
    ) {
    }

    // static create(a: Vec3, b: Vec3, c: Vec3) {
    //     return new Triangle(
    //         Vector.create(a),
    //         Vector.create(b),
    //         Vector.create(c)
    //     );
    // }

    static create(a: Vec3, b: Vec3, c: Vec3) {
        return new Triangle(
            Vector.create4(a),
            Vector.create4(b),
            Vector.create4(c)
        );
    }

    normal(): Vector4 {
        const u = this.v2.sub(this.v1);
        const v = this.v3.sub(this.v1);
        return u.crossProd(v);
    }
}

export class Vector {
    public static create4(v: Vec3 | Vec4) {
        if (v.length === 3) {
            return new Vector4(v[0], v[1], v[2], 1);
        }
        return new Vector4(v[0], v[1], v[2], v[3]);
    }
}

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


export function transformSingle(vec: Vec3, mat4: Mat4): Vec3 {
    const x = vec[0];
    const y = vec[1];
    const z = vec[2];
    const w = 1;

    return Vector.create4([
        x * w * mat4[0][0] + y * w * mat4[0][1] + z * w * mat4[0][2] + mat4[0][3],
        x * w * mat4[1][0] + y * w * mat4[1][1] + z * w * mat4[1][2] + mat4[1][3],
        x * w * mat4[2][0] + y * w * mat4[2][1] + z * w * mat4[2][2] + mat4[2][3],
        x * w * mat4[3][0] + y * w * mat4[3][1] + z * w * mat4[3][2] + mat4[3][3],
    ]).toVec3();
}

export function transform(vecs: Vec3[], translation: Mat4): Vec3[] {
    const res: Vec3[] = [];
    for (let i = 0; i < vecs.length; i++) {
        res[i] = transformSingle(vecs[i], translation);
    }

    return res;
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
        [0, 0, 2, 0],
    ];
}