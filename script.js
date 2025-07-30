const fileInput = document.getElementById('audioFile');
const visualizer = document.getElementById('visualizer');
const stickman = document.getElementById('stickman');
const ctx = visualizer.getContext('2d');
const stick = stickman.getContext('2d');

visualizer.width = stickman.width = window.innerWidth;
visualizer.height = stickman.height = 400;

let audioCtx, analyser, source, dataArray, bufferLength;

fileInput.addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  const audioURL = URL.createObjectURL(file);
  const audio = new Audio();
  audio.src = audioURL;
  audio.crossOrigin = 'anonymous';
  audio.controls = true;
  document.body.appendChild(audio);

  audio.addEventListener('canplay', () => {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    analyser.fftSize = 512;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    audio.play();
    draw();
  });
});

function drawStickman(energy) {
  stick.clearRect(0, 0, stickman.width, stickman.height);

  const centerX = stickman.width / 2;
  const baseY = stickman.height - 50;
  const scale = 1 + energy / 150;

  const headRadius = 20 * scale;
  const bodyLength = 50 * scale;
  const limbLength = 30 * scale;

  // Head
  stick.beginPath();
  stick.arc(centerX, baseY - bodyLength - headRadius, headRadius, 0, Math.PI * 2);
  stick.strokeStyle = "#FFF";
  stick.lineWidth = 3;
  stick.stroke();

  // Body
  stick.beginPath();
  stick.moveTo(centerX, baseY - bodyLength);
  stick.lineTo(centerX, baseY);
  stick.stroke();

  // Arms
  stick.beginPath();
  stick.moveTo(centerX, baseY - bodyLength + 10);
  stick.lineTo(centerX - limbLength, baseY - bodyLength + 10 - energy / 5);
  stick.moveTo(centerX, baseY - bodyLength + 10);
  stick.lineTo(centerX + limbLength, baseY - bodyLength + 10 - energy / 5);
  stick.stroke();

  // Legs
  stick.beginPath();
  stick.moveTo(centerX, baseY);
  stick.lineTo(centerX - limbLength, baseY + limbLength - energy / 5);
  stick.moveTo(centerX, baseY);
  stick.lineTo(centerX + limbLength, baseY + limbLength - energy / 5);
  stick.stroke();
}

function draw() {
  requestAnimationFrame(draw);
  analyser.getByteFrequencyData(dataArray);

  const avgEnergy = dataArray.reduce((a, b) => a + b, 0) / bufferLength;

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, visualizer.width, visualizer.height);

  ctx.beginPath();
  const step = visualizer.width / bufferLength;
  for (let i = 0; i < bufferLength; i++) {
    const value = dataArray[i];
    const x = i * step;
    const y = visualizer.height / 2 + Math.sin(i * 0.05 + performance.now() * 0.002) * value * 0.4;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.strokeStyle = `hsl(${avgEnergy * 1.5}, 100%, 60%)`;
  ctx.lineWidth = 1 + avgEnergy / 80;
  ctx.stroke();

  drawStickman(avgEnergy);
}
