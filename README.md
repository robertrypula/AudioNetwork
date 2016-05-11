Audio Network
=============

Pure JavaScript library without any dependencies that allows you to send binary data
using sound waves. No cable, no WiFi, no Bluetooth - just microphone, speakers and
the browser!

[Demo](https://audio-network.rypula.pl/)

[Carrier generate and recovery tests](https://audio-network.rypula.pl/example/carrier.html)

>This project is still under development. Documentation is also planned but... little later :)

## Features

AudioNetwork library uses WebAPI only for retrieving audio samples from the microphone and sending generated samples to the speakers via ScriptProcessingNode. AnalyserNode is used only to show spectrum on canvas but this is optional visual feature. Any other DSP is performed by internal AudioNetwork's classes or services. Main goal was to use PSK modulation to send/receive data. Unfortunatelly AnalyserNode's FFT output provides only amplitude information without phase. This have led to creation own implementation of Discrete Fourier Transform algorithm. List of features:

- tbc...

## How to use?
At demo page you will

(c) Robert Rypuła 2015-2016
