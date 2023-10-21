export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];
export type Mat4 = [Vec4, Vec4, Vec4, Vec4];

export class Triangle {
    constructor(
        public readonly v1: Vector3,
        public readonly v2: Vector3,
        public readonly v3: Vector3
    ) {
    }

    static create(a: Vec3, b: Vec3, c: Vec3) {
        return new Triangle(
            Vector3.create(a),
            Vector3.create(b),
            Vector3.create(c)
        );
    }

    normal(): Vector3 {
        const u = this.v2.sub(this.v1);
        const v = this.v3.sub(this.v1);
        return u.crossProd(v);
    }
}

export class Vector3 {
    constructor(public readonly x: number, public readonly y: number, public readonly z: number) {
    }

    public static create(v: Vec3) {
        return new Vector3(v[0], v[1], v[2]);
    }

    public sub(other: Vector3): Vector3 {
        return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
    }

    public length(): number {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }

    public crossProd(v: Vector3): Vector3 {
        const u = this;
        return new Vector3(
            (u.y * v.z) - (u.z * v.y),
            (u.z * v.x) - (u.x * v.z),
            (u.x * v.y) - (u.y * v.x)
        );
    }

    public dotProd(b: Vector3): number {
        const a = this;
        return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
    }

    public toVec3() : Vec3 {
        return [this.x, this.y, this.z];
    }

    public toString(precision? : number) : string {
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