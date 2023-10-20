(() => {
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
    const timestamp = Date.now();
    let vectors = load(Cube);
    const phiDeg = timestamp / 100 % 360;
    const phiRad = rad(phiDeg);
    vectors = transform(vectors, rotateY(phiRad));
    vectors = transform(vectors, rotateX(phiRad * 0.5));
    vectors = transform(vectors, rotZ(phiRad * 0.1));
    context.clearRect(-2, -2, 4, 4);
    for (let i = 0; i < vectors.length; i += 3) {
      context.strokeStyle = "black";
      context.lineWidth = 0.01;
      context.beginPath();
      context.moveTo(vectors[i][0], vectors[i][1]);
      context.lineTo(vectors[i + 1][0], vectors[i + 1][1]);
      context.lineTo(vectors[i + 2][0], vectors[i + 2][1]);
      context.closePath();
      context.stroke();
    }
    drawCrossbarWindow(context);
    window.setTimeout(() => renderLoop(canvas, context), 100);
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
