var
    TWO_PI,
    baseFrequency,
    volume,
    phase,
    hAmplitude,
    real,
    imag,
    i,
    globalP,
    localP,
    harmonicNr,
    periodicWave,
    audioContext,
    oscillatorNode,
    gainNode;


volume = 0.5;  // 50% głośności
phase = 0.75;  // przesunięcie całości w prawo o 270 stopni
hAmplitude = [ // DC offset został pominięty
  1, 0, 1/3, 0, 1/5
];
hPhase = [0, 0, 0, 0, 0]; // kształt prostokąt nie wymaga
                          // przesunięcia faz harmonicznych
real = new Float32Array(1 + hAmplitude.length);
imag = new Float32Array(1 + hAmplitude.length);
globalP = TWO_PI * (-phase); // 'globalne' przesunięcie fazy
real[0] = 0;   // DC-offset
imag[0] = 0;   // DC-offset
for (i = 0; i < hAmplitude.length; i++) {
  harmonicNr = 1 + i;
  localP = TWO_PI * (-hPhase[i]); // 'lokalne' przesunięcie
  real[harmonicNr] =
    hAmplitude[i] * Math.sin(globalP * harmonicNr + localP);
  imag[harmonicNr] =
    hAmplitude[i] * Math.cos(globalP * harmonicNr + localP);
}
// ...
oscillatorNode.connect(gainNode);
gainNode.connect(audioContext.destination);
// ...
periodicWave = audioContext.createPeriodicWave(real, imag);
oscillatorNode.setPeriodicWave(periodicWave);
// ...
gainNode.gain.value = volume;
gainNode.gain.setValueAtTime(
  volume,
  audioContext.currentTime
);
