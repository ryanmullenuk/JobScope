(() => {
  const canvas = document.querySelector("#scanner-background");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;

  const resize = () => {
    cancelAnimationFrame(frame);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(performance.now());
  };

  const gridPoint = (column, row, columns, rows, horizon, floor) => {
    const depth = row / rows;
    const spread = Math.pow(depth, 0.76);
    const halfWidth = width * (0.1 + spread * 0.67);
    const x = width / 2 + ((column / columns) * 2 - 1) * halfWidth + pointerX * depth * 18;
    const y = horizon + Math.pow(depth, 1.48) * (floor - horizon) + pointerY * depth * 8;
    return { x, y };
  };

  const draw = (time) => {
    context.clearRect(0, 0, width, height);

    const background = context.createRadialGradient(width * 0.5, height * 0.38, 0, width * 0.5, height * 0.55, width * 0.8);
    background.addColorStop(0, "#0a3431");
    background.addColorStop(0.48, "#052522");
    background.addColorStop(1, "#021110");
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    pointerX += (targetX - pointerX) * 0.035;
    pointerY += (targetY - pointerY) * 0.035;

    const horizon = Math.max(70, height * 0.12);
    const floor = height * 1.08;
    const columns = Math.max(12, Math.min(28, Math.round(width / 64)));
    const rows = 22;
    const phase = reducedMotion.matches ? 0.48 : (time * 0.000105) % 1;
    const scanProgress = 0.5 - Math.cos(phase * Math.PI * 2) * 0.5;
    const scanY = horizon + scanProgress * (floor - horizon);

    context.lineWidth = 1;
    context.strokeStyle = "rgba(58, 205, 187, 0.16)";
    for (let column = 0; column <= columns; column += 1) {
      context.beginPath();
      for (let row = 0; row <= rows; row += 1) {
        const point = gridPoint(column, row, columns, rows, horizon, floor);
        if (row === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      }
      context.stroke();
    }

    for (let row = 0; row <= rows; row += 1) {
      const left = gridPoint(0, row, columns, rows, horizon, floor);
      const right = gridPoint(columns, row, columns, rows, horizon, floor);
      const distance = Math.abs(left.y - scanY);
      const intensity = Math.max(0, 1 - distance / 115);
      context.strokeStyle = intensity > 0
        ? `rgba(255, 113, 63, ${0.18 + intensity * 0.55})`
        : "rgba(58, 205, 187, 0.17)";
      context.lineWidth = intensity > 0 ? 1 + intensity * 1.2 : 1;
      context.beginPath();
      context.moveTo(left.x, left.y);
      context.lineTo(right.x, right.y);
      context.stroke();
    }

    const beam = context.createLinearGradient(0, scanY - 82, 0, scanY + 82);
    beam.addColorStop(0, "rgba(255, 113, 63, 0)");
    beam.addColorStop(0.46, "rgba(255, 113, 63, 0.035)");
    beam.addColorStop(0.5, "rgba(255, 132, 73, 0.25)");
    beam.addColorStop(0.54, "rgba(255, 113, 63, 0.035)");
    beam.addColorStop(1, "rgba(255, 113, 63, 0)");
    context.fillStyle = beam;
    context.fillRect(0, scanY - 82, width, 164);

    context.save();
    context.shadowColor = "rgba(255, 107, 52, 0.9)";
    context.shadowBlur = 18;
    context.strokeStyle = "rgba(255, 132, 73, 0.78)";
    context.lineWidth = 1.4;
    context.beginPath();
    context.moveTo(0, scanY);
    context.lineTo(width, scanY);
    context.stroke();
    context.restore();

    if (!reducedMotion.matches) frame = requestAnimationFrame(draw);
  };

  const restart = () => {
    cancelAnimationFrame(frame);
    draw(performance.now());
  };

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", (event) => {
    targetX = event.clientX / Math.max(width, 1) - 0.5;
    targetY = event.clientY / Math.max(height, 1) - 0.5;
  }, { passive: true });
  reducedMotion.addEventListener?.("change", restart);
  resize();
})();
