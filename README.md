Audio Network
=============

Pure JavaScript library without any dependencies that allows you to send binary data
using sound waves. No cable, no WiFi, no Bluetooth - just microphone, speakers and
the browser!

[Demo - full features](https://audio-network.rypula.pl/)

[Demo - simple](https://audio-network.rypula.pl/example/02-physical-layer-simple/physical-layer-simple.html) [in
development]

[Carrier generate and recovery tests](https://audio-network.rypula.pl/example/carrier.html)

>This project is still under development. Documentation is also planned but... little later :)

>Currently there is only one demo available which is using all possible features of AudioNetwork library. In near
>future I will add much simpler version with only few lines of code. That would be much easier to understand.

## How can I test it?

First of all you need to have two devices. One for sending, one for receiving data. During development for sending
I'm using very old Galaxy S2 smartphone with Firefox. On the other side for receiving I'm using laptop with Chrome
browser. I guess it should work with any other device with browser that supports Web Audio API.

>AudioNetwork needs raw microphone output without any filter applied. You can verify that by opening `Sound` settings
>in your system. When you enter your microphone properties you might need to un-check all filters. The worst scenario
>is when your microphone has some hardware filter that you can't disable. In this case you need to throw it away and
>buy a new one ;)

Demo is divided into two sections - `Receive` and `Transmit` (blue bar with white text).

### Receive section

At `Receive` section you can check current status of `ReceiveAdapter`.

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

### Enough of reading, tell me how to send something!

1. **[Receiving device - Receiver section]** - Before you load demo page you need to be quiet :) It's because
`ReceiveAdapter` needs to properly initialize `averageIdlePower`. In other words it needs to listen to 'silence'
around you when no signal is transmitted. It's indicated by `IDLE_INIT` state. If you fell that your silence wasn't
good enough you can always use `RESET` button to start again.

2. **[Receiving device - Receiver section]** - When `averageIdlePower` collecting is complete `ReceiveAdapter`
will change it's state to `FIRST_SYNC_WAIT`. Now it's time to grab your transmitting device and read next point.

3. **[Transmitting device - transmit section]** - All you need to do is to click on `SYNC` button. It will transmit
3 seconds of synchronization signal that will allow receiver device to setup everything.

4. **[Receiving device - Receiver section]** - When `SYNC` transmission is in progress `ReceiveAdapter` state should change to
`FIRST_SYNC`.

5. **[Receiving device - Receiver section]** - When `SYNC` transmission is over `ReceiveAdapter` state at the end
should change to `IDLE`. It means that `ReceiveAdapter` properly initialized `averageFirstSyncPower` and
additionally receiver reference frequency and phase offset were fine-tuned. **Now we are ready to send some data!**

6. **[Transmitting device - transmit section]** - Now you can click on `Send packet` button. All data inside textarea
should be transferred to receiving device. By default PSK-2 modulation is used so you can use only symbols `0` and `1`
but it's enough to send data bit by bit. For example to send ASCII `a` character (0x61) you need to put inside
textarea `0 1 1 0 0 0 0 1`.

7. **[Receiving device - Receiver section]** - After short moment data from transmitter textarea should appear
at `RX adapter - PACKETS`. Congratulations, you just send something **thought air in your room**!

>If at any point you will see `FATAL_ERROR` state you need to click on `RESET` button and start all points again.

## How to install?

Project is available at github and npm so you can just run one of the commands below:

```
git clone https://github.com/robertrypula/AudioNetwork.git
```

or

```
npm install audio-network
```

After downloading look into build directory. You will find there both minified and unminified js file with whole
library. Pick one and include it into your html. For example:

```
<script src="node_modules/audio-network/build/audio-network-v1.0.2.min.js"></script>
```

When you reload your page one additional object will be registered at the global JavaScript scope - AudioNetwork.
It's the entry point for all components:

```
var physicalLayer, transmitAdapter, receiveAdapter;

physicalLayer = new AudioNetwork.PhysicalLayer.PhysicalLayer({
    // config
}),
transmitAdapter = new AudioNetwork.PhysicalLayer.TransmitAdapter(physicalLayer),
receiveAdapter = new AudioNetwork.PhysicalLayer.ReceiveAdapter(physicalLayer);
// todo put whole example here
```

>Under the hood AudioNetwork works on simple
>[Injector](https://github.com/robertrypula/AudioNetwork/blob/master/src/audio-network-begin.js#L8) implementation.
>For example AudioNetwork.PhysicalLayer.PhysicalLayer is just alias for
>AudioNetwork.Injector.resolve('PhysicalLayer.PhysicalLayer'). Other public classes/services that have aliases
>you can find [here](https://github.com/robertrypula/AudioNetwork/blob/master/src/audio-network-end.js)

## Features

- Dependency free library
- Unit test friendly. Build-in Dependency Injector (tests are planned in the future)
- Multiple channel support for parallel transmission without collisions
- OFDM (Orthogonal Frequency-Division Multiplexing) support per each channel. This helps to save bandwidth and pack
more data into one burst. It's the same technique as used in many existing standards like LTE, Wi-Fi, DAB, DVB.
- [Constellation Diagram](https://en.wikipedia.org/wiki/Constellation_diagram), that helps to easily verify
phase and amplitude of carrier frequency in the realtime.
- [Spectrum Analyzer](https://en.wikipedia.org/wiki/Spectrum_analyzer) of incoming signal bases on AnalyserNode
for Web Audio API.
- Adapter classes
([ReceiveAdapter](https://github.com/robertrypula/AudioNetwork/blob/master/src/physical-layer/receive-adapter.factory.js)
and
[TransmitAdapter](https://github.com/robertrypula/AudioNetwork/blob/master/src/physical-layer/transmit-adapter.factory.js))
that acts as easy-to-use wrappers over raw
[PhysicalLayer](https://github.com/robertrypula/AudioNetwork/blob/master/src/physical-layer/physical-layer.factory.js)
class with lower level tx and rx methods. If you want you can also write your own adapter class and attach
PhysicalLayer to it. AudioNetwork is shipped with PSK adapters but you can write any other modulation like PWM.
- ReceiveAdapter internally has state machine with states listed
[here](https://github.com/robertrypula/AudioNetwork/blob/master/src/physical-layer/receive-adapter-state.service.js).
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
[CarrierRecovery](https://github.com/robertrypula/AudioNetwork/blob/master/src/physical-layer/carrier-recovery/carrier-recovery.factory.js).

There's no rose without a thorn... CarrierRecovery class code is simple but when we would like to create more of its
instances, to have more carrier frequencies, we will reduce overall performance pretty fast. It is not good but at
least it's closer to [KISS](https://en.wikipedia.org/wiki/KISS_principle) design principle ;)

(c) Robert Rypuła 2015-2016
