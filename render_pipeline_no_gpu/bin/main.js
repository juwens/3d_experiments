(() => {
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
  });
})();
