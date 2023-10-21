(() => {
  // src/math.ts
  var Triangle = class _Triangle {
    constructor(v1, v2, v3) {
      this.v1 = v1;
      this.v2 = v2;
      this.v3 = v3;
    }
    static create(a, b, c) {
      return new _Triangle(
        Vector3.create(a),
        Vector3.create(b),
        Vector3.create(c)
      );
    }
    sufaceNormal() {
      const u = this.v2.sub(this.v1);
      const v = this.v3.sub(this.v1);
      return u.crossProd(v);
    }
    angleToSurfaceNormal(other) {
      const norm = this.sufaceNormal();
      return Math.acos(
        norm.dotProd(other) / (norm.length() + other.length())
      );
    }
  };
  var Vector3 = class _Vector3 {
    constructor(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    static create(v) {
      return new _Vector3(v[0], v[1], v[2]);
    }
    sub(other) {
      return new _Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    length() {
      return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }
    crossProd(v) {
      const u = this;
      return new _Vector3(
        u.y * v.z - (u.z - v.y),
        u.z * v.x - (u.x - v.z),
        u.x * v.y - (u.y - v.x)
      );
    }
    dotProd(b) {
      const a = this;
      return a.x * b.x + a.y * b.y + a.z * b.z;
    }
    toVec3() {
      return [this.x, this.y, this.z];
    }
    toString(precision) {
      return `[${this.x.toFixed(precision)}, ${this.y.toFixed(precision)}, ${this.z.toFixed(precision)}]`;
    }
  };

  // src/models.ts
  var Cube = [
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
    [0.5, 0.5, -0.5]
  ];
  function load(vectors) {
    if (vectors.length % 4 !== 0) {
      throw "length must be a multiple of 4 to transform it to triangles";
    }
    let triangles = [];
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
  function transformSingle(vec, mat4) {
    const x = vec[0];
    const y = vec[1];
    const z = vec[2];
    return [
      x * mat4[0][0] + y * mat4[0][1] + z * mat4[0][2] + mat4[0][3],
      x * mat4[1][0] + y * mat4[1][1] + z * mat4[1][2] + mat4[1][3],
      x * mat4[2][0] + y * mat4[2][1] + z * mat4[2][2] + mat4[2][3]
      //x * mat4[3][0] + y * mat4[3][1] + z * mat4[3][2] + mat4[3][3],
    ];
  }
  function transform(vecs, translation) {
    const res = [];
    for (let i = 0; i < vecs.length; i++) {
      res[i] = transformSingle(vecs[i], translation);
    }
    return res;
  }
  var cos = Math.cos;
  var sin = Math.sin;
  function rotateX(phi) {
    return [
      [1, 0, 0, 0],
      [0, cos(phi), -sin(phi), 0],
      [0, sin(phi), cos(phi), 0],
      [0, 0, 0, 0]
    ];
  }
  function rotateY(phi) {
    return [
      [cos(phi), 0, sin(phi), 0],
      [0, 1, 0, 0],
      [-sin(phi), 0, cos(phi), 0],
      [0, 0, 0, 0]
    ];
  }
  function rotZ(phi) {
    return [
      [cos(phi), -sin(phi), 0, 0],
      [sin(phi), cos(phi), 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0]
    ];
  }

  // src/main.ts
  new EventSource("/esbuild").addEventListener("change", () => location.reload());
  console.log(new Vector3(0, 0, 1).crossProd(new Vector3(0, 0, 1)));
  document.addEventListener("DOMContentLoaded", (event) => {
    const appElm = document.getElementById("app");
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "black";
    context.fillStyle = "hotpink";
    context.lineWidth = 1;
    console.log({ width: canvas.width, height: canvas.height });
    context.translate(canvas.width / 2, canvas.height / 2);
    const scale = 0.4;
    context.scale(canvas.width * scale, canvas.height * scale);
    context.fillRect(-1, -1, 2, 2);
    context.scale(1, -1);
    renderLoop(canvas, context);
  });
  function renderLoop(canvas, context) {
    const wireframe = false;
    const lightDirection = Vector3.create([-1, -1, 1]);
    const viewingDirection = Vector3.create([0, 0, 1]);
    const timestamp = Date.now();
    let vectors = load(Cube);
    const phiDeg = timestamp / 100 % 360;
    const phiRad = rad(phiDeg);
    vectors = transform(vectors, rotateY(phiRad));
    vectors = transform(vectors, rotateX(phiRad * 0.5));
    vectors = transform(vectors, rotZ(phiRad * 0.1));
    context.clearRect(-2, -2, 4, 4);
    for (let i = 0; i < vectors.length; i += 3) {
      context.lineWidth = 0.01;
      const v1 = vectors[i];
      const v2 = vectors[i + 1];
      const v3 = vectors[i + 2];
      const tr = Triangle.create(v1, v2, v3);
      const angleToView = tr.angleToSurfaceNormal(viewingDirection);
      console.log(`triangle ${i / 3}: ${tr.sufaceNormal().toString(1)} ${angleToView}`);
      const brightness = tr.angleToSurfaceNormal(lightDirection) / Math.PI / 2;
      const colorNr = brightness * 255;
      context.fillStyle = context.strokeStyle = `rgb(255, ${colorNr}, ${colorNr})`;
      context.beginPath();
      context.moveTo(vectors[i][0], vectors[i][1]);
      context.lineTo(vectors[i + 1][0], vectors[i + 1][1]);
      context.lineTo(vectors[i + 2][0], vectors[i + 2][1]);
      context.closePath();
      if (wireframe) {
        context.stroke();
      } else {
        context.fill();
      }
    }
    drawCrossbarWindow(context);
    console.log(" ");
  }
  function rad(deg) {
    return deg / 360 * Math.PI * 2;
  }
  function drawCrossbarWindow(context) {
    context.strokeStyle = "rgb(200, 200, 200)";
    context.strokeRect(-1, -1, 2, 2);
    context.beginPath();
    context.moveTo(-1, 0);
    context.lineTo(1, 0);
    context.moveTo(0, -1);
    context.lineTo(0, 1);
    context.stroke();
  }
})();
