Audio Network
=============

Pure JavaScript library without any dependencies that allows you to send binary data
using sound waves. No cable, no WiFi, no Bluetooth - just microphone, speakers and
the browser!

[Demo](https://audio-network.rypula.pl/)

[Carrier generate and recovery tests](https://audio-network.rypula.pl/example/carrier.html)

>This project is still under development. Documentation is also planned but... little later :)

## Few more words about the project

Internally AudioNetwork library uses [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
for retrieving audio data from the microphone and sending audio data to the speakers. To be more precise it is using
[ScriptProcessorNode](https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode). ScriptProcessorNode
fires event when new portion of samples arrives (from mic) or new portion of samples is required (for speakers).
Basically AudioNetwork library is analysing/providing raw arrays of sound samples inside audio events handlers. In
other words all [DSP](https://en.wikipedia.org/wiki/Digital_signal_processing) is performed by internal
AudioNetwork's classes or services written in pure JavaScript.

Apart from ScriptProcessorNode two other Web Audio API nodes were used. First was
[GainNode](https://developer.mozilla.org/en-US/docs/Web/API/GainNode) for connecting other nodes together and
the second was [AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode). AnalyserNode
was used only to show some 'nice' visual stuff to the user. We can switch between
[time domain](https://en.wikipedia.org/wiki/Time_domain) (to see raw samples)
and [frequency domain](https://en.wikipedia.org/wiki/Frequency_domain) (spectrum analyzer like on FM radio display).
It's optional and not required when we want to just send or receive data.

If somebody is familiar with Web Audio API one question may now come - why I didn't use
[OscillatorNode](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode) for sound generation or
AnalyzerNode's [FrequencyData](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getFloatFrequencyData)
output for detecting carrier frequencies? Well... I could, but the main goal for this project was to use
PSK ([Phase Shift Keying](https://en.wikipedia.org/wiki/Phase-shift_keying)) modulation to send/receive data and
learn a bit about modern wireless communication techniques. Those two goals even forced me to write everything
from scratch was because AnalyserNode's frequency domain data output (it is using
[FFT - Fast Fourier Transform](https://en.wikipedia.org/wiki/Fast_Fourier_transform)) provides only amplitude
information without any phase information. It turned out that the only way to achieve PSK modulation was to implement
own [Discrete Fourier Transform](https://en.wikipedia.org/wiki/Discrete_Fourier_transform) with amplitude/phase or use
some DSP library. I wanted to dig into the details so I picked the first option :) Wikipedia about DFT looks
ultra scary but in the code there is no rocket science. Basic implementation of Discrete Fourier Transform is
very simple. We will not find there any mathematical tricks like used in FFT. If you don't believe me, check this class
[CarrierRecovery](https://github.com/robertrypula/AudioNetwork/blob/master/src/physical-layer/carrier-recovery/carrier-recovery.factory.js).

There's no rose without a thorn... CarrierRecovery class code is simple but when we will create more of its
instances, to have more carrier frequencies, we will reduce overall performance pretty fast. At least its following
[KISS](https://en.wikipedia.org/wiki/KISS_principle) design principle ;)

List of features:
- Dependency free library
- Multiple channel support for parallel transmission without collisions
- OFDM (Orthogonal Frequency-Division Multiplexing) support per each channel. This helps to save bandwidth.
- [Constellation Diagram](https://en.wikipedia.org/wiki/Constellation_diagram), that helps to easily verify
phase and amplitude of carrier frequency
- [Spectrum Analyzer](https://en.wikipedia.org/wiki/Spectrum_analyzer) of incoming signal bases on AnalyserNode
for Web Audio API
- Adapter classes
(
[ReceiveAdapter](https://github.com/robertrypula/AudioNetwork/blob/master/src/physical-layer/receive-adapter.factory.js)
and
[TransmitAdapter](https://github.com/robertrypula/AudioNetwork/blob/master/src/physical-layer/transmit-adapter.factory.js)
)
that acts as easy-to-use wrappers over raw
[PhysicalLayer](https://github.com/robertrypula/AudioNetwork/blob/master/src/physical-layer/physical-layer.factory.js)
class with tx and rx methods.
- ReceiveAdapter works on state machine with
[states](https://github.com/robertrypula/AudioNetwork/blob/master/src/physical-layer/receive-adapter-state.service.js)
that helps to detect current
- todo write about sync: phase and frequency correction


## How to use?
- todo

(c) Robert Rypuła 2015-2016
