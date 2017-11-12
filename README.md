Audio Network
=============

Data transmission over sound waves written in JavaScript without any dependencies. All you need is just
microphone, speakers and the browser!

[Demo - simple](https://audio-network.rypula.pl/example/01-000-physical-layer-simple/physical-layer-simple.html)

[Demo - full features](https://audio-network.rypula.pl/example/01-001-physical-layer-full/physical-layer-full.html)

[Full example List](https://github.com/robertrypula/AudioNetwork/tree/master/example)

If you want to try AudioNetwork by yourself I would recommend to first open `Demo - simple` because `Demo - full
features` might be little scary for the first time. You can also watch YouTube video that shows how to transmit
data over sound between two laptops:

[![Data transmission over sound waves (AudioNetwork)](https://audio-network.rypula.pl/asset/image/yt.png)](https://www.youtube.com/watch?v=TjjyLaXd1Ro)

>This project is still under development. Documentation is also planned but... little later :)

## How can I transmit something over sound?

First of all you need to have two devices. One for sending, one for receiving data. It should work with any
device (PC, Mac, tablet, smartphone) with browser that supports Web Audio API. Next you need to open
[Demo - simple](https://audio-network.rypula.pl/example/01-000-physical-layer-simple/physical-layer-simple.html)
at both devices and follow steps below:

1. **[Receiver]** - Before you load demo page you need to be quiet :) Receiving device needs to listen to 'silence'
around you when there is no signal in the air. It's indicated by `IDLE_INIT` state and it ends when `FIRST_SYNC_WAIT`
state will come. If you fell that your silence wasn't good enough you can always use `RESET` button to start again.

2. **[Transmitter]** - All you need to do is to click on `SYNC` button.

3. **[Receiver]** - When `SYNC` transmission is in progress state should change to `FIRST_SYNC`. After about 2 seconds
it should switch to `IDLE`. At this point **we are ready to send some data!**

4. **[Transmitter]** - Now you can put some data to textarea and click on `Send packet` button. After short moment your
data will appear on the receiver's side.

>By default PSK-2 modulation is used so you can use only symbols `0` and `1` but it's enough to send data bit by bit.
>For example to send ASCII `a` character (0x61) you need to put inside textarea `0 1 1 0 0 0 0 1`.
>Please remember to always put one space between each symbol but whole text needs to be without trailing and
>leading spaces.

>If at any point you will see `FATAL_ERROR` state you need to click on `RESET` button and start all points again.

>AudioNetwork needs raw microphone output without any filter applied. You can verify that by opening `Sound` settings
>in your operating system. When you enter your microphone properties you might need to un-check all filters. The worst
>scenario is when your microphone has some hardware filter that you can't disable. In this case you need to throw it
>away and buy a new one ;)

## How to add sound transmission to my project?

Audio Network is available at GitHub and npm so you can just run one of the commands below:

```
git clone https://github.com/robertrypula/AudioNetwork.git
cd AudioNetwork
npm install
gulp serve
```

or

```
npm install audio-network
```

In both cases at `build` directory you will find minified and unminified js file with whole library. Pick one and
include it into your HTML file. For example:

```
<script src="node_modules/audio-network/build/audio-network-v1.1.0.min.js"></script>
```

Now you can access `AudioNetwork` object at global JavaScript scope. It's the entry point for all components:

```
var physicalLayer, transmitAdapter, receiveAdapter;

physicalLayer = new AudioNetwork.PhysicalLayer.PhysicalLayer({
    // config
});
transmitAdapter = new AudioNetwork.PhysicalLayerAdapter.TransmitAdapter(physicalLayer);
receiveAdapter = new AudioNetwork.PhysicalLayerAdapter.ReceiveAdapter(physicalLayer);
```

Below you can find `Demo - simple` source code:
  - [html](https://github.com/robertrypula/AudioNetwork/blob/master/example/01-000-physical-layer-simple/physical-layer-simple.html)
  - [js](https://github.com/robertrypula/AudioNetwork/blob/master/example/01-000-physical-layer-simple/physical-layer-simple.js)

>To work properly `Web Audio API` requires running your HTML file via web server (`http://localhost...`) like Apache
>or some Node stuff like `gulp-webserver` (I'm using it and it works great). In case of local machine normal `http`
>connection would work. Unfortunately when you will want to go live you have to provide `https`. It's because in some
>browsers accessing microphone is not allowed when site is not hosted over `https`. You can read more about this
>[here](https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-powerful-features-on-insecure-origins)

In case you are curious about long namespaces: Under the hood AudioNetwork works on simple
[Injector](https://github.com/robertrypula/AudioNetwork/blob/master/src/audio-network-boot.js#L9) implementation.
For example AudioNetwork.PhysicalLayer.PhysicalLayer is just alias for
AudioNetwork.Injector.resolve('PhysicalLayer.PhysicalLayer'). Other public classes/services that have aliases
you can find [here](https://github.com/robertrypula/AudioNetwork/blob/master/src/audio-network-end.js)

## More about full features demo

`Full feature demo` is growing with AudioNetwork library core. It's developer sandbox for all new features.

Demo is divided into two sections - `Receive` and `Transmit` (blue bar with white text). You can show or hide
stuff by clicking on `View type` buttons at `Initialize` section.

### Receive section

Here you can find lots of information like input spectrum, constellation diagrams, power chart.

At `Receive` section you can also check current status of `ReceiveAdapter`.

>`ReceiveAdapter` is wrapper for lower level `PhysicalLayer`'s object `rx` events.

The most important thing in this adapter is its state. You can find it at the top of the orange box (capital letters
text like `IDLE_INIT`, `FIRST_SYNC_WAIT`, etc). Other important area to look is output of `RX adapter - PACKETS`.
Here you can find any potential packet that will be found in the air. I wrote potential because integrity of
incoming packets is not verified so some of them might be corrupted. It's because it's not `PhysicalLayer`
responsibility to deal with it. In some future release of AudioNetwork packet verification will be added.
This would be in next layer in the network stack - `DataLinkLayer` (like in
[OSI](https://en.wikipedia.org/wiki/OSI_model) model).

>Orange box is kind of developer debug box - it will be replaced to some nicer UX in the future...

### Transmit section

At `Transmit` section there is not that much as at `Receive` section. You will find there only few buttons to send
`SYNC` signal, `PACKET` and individual symbols (`0`, `1`, ...). Number of unique symbols is determined by
`PSK symbol size` (you need to switch view type to `Complex` to see that). At `Packet` textarea please remember to
always put one space between each symbol but whole text needs to be without trailing and leading spaces.

## Features

- Dependency free library
- Unit test friendly. Build-in Dependency Injector (tests are planned in the future)
- Multiple channel support for parallel transmission without collisions
- OFDM (Orthogonal Frequency-Division Multiplexing) support per each channel. This helps to save bandwidth and pack
more data into one burst. It's the same technique as used in many existing standards like LTE, Wi-Fi, DAB, DVB.
- [Constellation Diagram](https://en.wikipedia.org/wiki/Constellation_diagram), that helps to easily verify
phase and amplitude of carrier frequency in the realtime.
- [Spectrum Analyzer](https://en.wikipedia.org/wiki/Spectrum_analyzer) of incoming signal is based on AnalyserNode
for Web Audio API.
- Adapter classes
([ReceiveAdapter](https://github.com/robertrypula/AudioNetwork/blob/master/src/physical-layer-adapter/receive-adapter.factory.js)
and
[TransmitAdapter](https://github.com/robertrypula/AudioNetwork/blob/master/src/physical-layer-adapter/transmit-adapter.factory.js))
that acts as easy-to-use wrappers over raw
[PhysicalLayer](https://github.com/robertrypula/AudioNetwork/blob/master/src/physical-layer/physical-layer.factory.js)
class with lower level tx and rx methods. If you want you can also write your own adapter class and attach
PhysicalLayer to it. AudioNetwork is shipped with PSK adapters but you can write any other modulation like PWM.
- ReceiveAdapter internally has state machine with states listed
[here](https://github.com/robertrypula/AudioNetwork/blob/master/src/physical-layer-adapter/receive-adapter-state.service.js).
The idea is to extract potential packets from raw carrier details data that rx method provides.
- Auto phase correction. PSK modulation is ultra sensitive to frequency offsets. Even if transmitter and receiver
frequencies are de-tuned by 0.05 Hz it will rotate symbol at constellation diagram every 20 seconds. It means that
we will not be sure what symbol we are reading. Fortunately Adapter classes adds `SyncPreamble` (symbol with zero
phase offset relative to reference) before each packet. ReceiveAdapter takes that `SyncPreamble` and restores symbol
alignment before each packet. During packet transmission it may still rotate but at least at the beginning of the
packet symbols are aligned at both sides - sender and receiver
- Auto frequency correction. Similar to point above. PSK is ultra sensitive to frequency offsets so basically we need
to fine-tune receiver to sender. This feature looks how fast constellation point rotates and corrects receiver's
reference carrier frequency to minimize this effect.
- Auto detection of signal and noise levels. ReceiveAdapter after reset first listens to ambient noise to set `averageIdlePower` (during IDLE_INIT state). Then it waits for sender for synchronization signal which is
basically symbol zero transmitted for few seconds. During sync transmission receiver stores `averageFirstSyncPower`
at `FIRST_SYNC` state. After those steps receiver calculates `powerThreshold` and it's ready for packets from sender. All above is needed to propperly determine signal and noise power levels. Without it we will not be able to decode packet.

## Known limitations

- Currently Guard Interval needs to be few times longer than Symbol Duration (two or tree times longer). It's
because ReceiveAdapter, when restoring packet symbols, is 'clocked' by carrier frequency power changes.

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
from scratch because AnalyserNode's frequency domain data output (it is using
[FFT - Fast Fourier Transform](https://en.wikipedia.org/wiki/Fast_Fourier_transform)) provides only amplitude
information without any phase information. It turned out that the only way to achieve PSK modulation was to implement
own [Discrete Fourier Transform](https://en.wikipedia.org/wiki/Discrete_Fourier_transform) with amplitude/phase or use
some DSP library. I wanted to dig into the details so I picked the first option :) Wikipedia about DFT looks
ultra scary but in the code there is no rocket science. Basic implementation of Discrete Fourier Transform is
very simple. We will not find there any mathematical tricks like used in FFT. If you don't believe me, check this class
[CarrierRecovery](https://github.com/robertrypula/AudioNetwork/blob/master/src/common/carrier-recovery/carrier-recovery.factory.js).

There's no rose without a thorn... CarrierRecovery class code is simple but when we would like to create more of its
instances, to have more carrier frequencies, we will reduce overall performance pretty fast. It is not good but at
least it's closer to [KISS](https://en.wikipedia.org/wiki/KISS_principle) design principle ;)

## Licence

The MIT License (MIT)

Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

