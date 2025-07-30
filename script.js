const fileInput = document.getElementById('audioFile');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const emotionLabel = document.querySelector('#emotion strong');
const bgVideo = document.getElementById('bgVideo');

canvas.width = window.innerWidth;
canvas.height = 400;

let audioCtx, analyser, source, dataArray, bufferLength;

const emotions = {
  alegria: { color: 'rgb(255,215,0)', video: 'joy.mp4' },
  tristeza: { color: 'rgb(70,130,180)', video: 'sad.mp4' },
  calma: { color: 'rgb(144,238,144)', video: 'calm.mp4' },
  euforia: { color: 'rgb(255,20,147)', video: 'euphoria.mp4' },
  miedo: { color: 'rgb(139,0,0)', video: 'fear.mp4' }
};

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

    analyser.fftSize = 256;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    audio.play();
    draw();
  });
});

function detectEmotion(avg, bass, treble) {
  if (avg > 180 && treble > 150) return 'euforia';
  if (avg < 60 && bass > treble) return 'tristeza';
  if (avg < 80 && treble > bass) return 'calma';
  if (avg > 150 && bass > 120) return 'alegria';
  if (bass > 180 && avg < 100) return 'miedo';
  return 'calma';
}

function draw() {
  requestAnimationFrame(draw);
  analyser.getByteFrequencyData(dataArray);

  const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
  const bass = dataArray.slice(0, bufferLength / 4).reduce((a, b) => a + b, 0) / (bufferLength / 4);
  const treble = dataArray.slice(3 * bufferLength / 4).reduce((a, b) => a + b, 0) / (bufferLength / 4);

  const emotion = detectEmotion(avg, bass, treble);
  emotionLabel.textContent = emotion.charAt(0).toUpperCase() + emotion.slice(1);

  const theme = emotions[emotion];
  if (bgVideo.src.indexOf(theme.video) === -1) {
    bgVideo.src = theme.video;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const barWidth = (canvas.width / bufferLength) * 2.5;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i];
    ctx.fillStyle = theme.color;
    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }
}
