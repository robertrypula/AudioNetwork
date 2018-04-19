# TODOs

## General

- prepare dev server
- [DONE] finish physical layer example
- finish data link layer simple example
- move all modules to main NPM package
- [DONE for all examples related to NPM package] switch all examples to the one lib file instead of development mode that loads all scripts
- finish transport layer example
    - DataChunk listeners
    - segment listeners
    - example page itself
- finish Audio Chat example
- [DONE in PR] replace Gulp by WebPack
- [DONE in PR] configure unit tests from console
- [DONE] remove external google fonts
    - [DONE] improove website loading time in general

## Physical Layer, Web Audio API and DSP stuff

- extract one more layer that will provide audio data
    - Web Audio API (AudioMonoIO) would be one of the sources
    - audio file source, that allows to generate/analyse sound files
    - think about generating/analysing audio files from Node.js via console
- cleanups in AudioMonoIO
    - move common code to base class
    - lazy connection of the nodes
- clean RX code
- rename all variables like 'rxSymbol' / 'txSymbol' to 'rxFskSymbol' / 'txFskSymbol'
- implement common sample rate for all decives ~16 kHz
    - SYNC setting 48/44.1 will no longer be needed in the Layers above Physical like Data Link Layer
    - custom FFT implementation
    - resampler
    - FIR filter

## Data Link Layer

- remove two way sync
    - look for frames in two FSK streams
    - SYNC will not be required

## Old todos (might be not valid anymore)

- DFT simple fix (code refactor)
- full example DFT fix
    - add sampleRate input
    - add ability to paste custom sample values
    - add switch between samplePerPeriod/frequency
    - add text that this is real DFT (?)
    - switch constellation diagram to complex plane (clockwise angle starting from positive X axis)

