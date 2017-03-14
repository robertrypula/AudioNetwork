# Internet sources:

Web Audio API - missing phase info
    'Sadly, even though the analyser node computes a complex fft, it doesn't give access to the complex representations, just the magnitudes of it.'
    http://stackoverflow.com/questions/14169317/interpreting-web-audio-api-fft-results

FFT amplitudes:
    https://www.mathworks.com/matlabcentral/answers/162846-amplitude-of-signal-after-fft-operation

OscillatorNode custom:
    http://stackoverflow.com/questions/30631595/custom-wave-forms-in-web-audio-api

About coefficients:
    http://themusictoolbox.net/waves/
    https://jackschaedler.github.io/circles-sines-signals/dft_introduction.html

Why is the fft mirrored:
    http://dsp.stackexchange.com/questions/4825/why-is-the-fft-mirrored

How to interpret negative frequencies
    http://dsp.stackexchange.com/questions/431/what-is-the-physical-significance-of-negative-frequencies

How to get frequency from FFT index
    http://stackoverflow.com/questions/4364823/how-do-i-obtain-the-frequencies-of-each-value-in-an-fft
    http://stackoverflow.com/questions/14900459/symmetric-part-after-applying-fft-is-for-which-frequencies
    http://dsp.stackexchange.com/questions/282/complex-conjugate-and-ifft

Freq domain time resolution:
    http://electronics.stackexchange.com/questions/12407/what-is-the-relation-between-fft-length-and-frequency-resolution

About FFT (in polish)
    http://student.agh.edu.pl/~bond/fft.pdf

Intuitive Understanding of the Fourier Transform and FFTs
    https://www.youtube.com/watch?v=FjmwwDHT98c&t=1840s

GREAT IQ explanation:
    http://whiteboard.ping.se/SDR/IQ
    https://www.youtube.com/watch?v=h_7d-m1ehoY

Capture and decode fm radio
    https://witestlab.poly.edu/blog/capture-and-decode-fm-radio/
    https://en.wikipedia.org/wiki/Digital_down_converter
    https://en.wikipedia.org/wiki/Detector_(radio)                 Used in first link: polar frequency discriminator

FFT:
    http://stackoverflow.com/questions/6740545/need-help-understanding-fft-output

Great about Bins and freqyency location in FFT
    http://www.gaussianwaves.com/2015/11/interpreting-fft-results-complex-dft-frequency-bins-and-fftshift/

Nice online charts:
    http://fooplot.com/

FFT calculator:
    http://scistatcalc.blogspot.com/2013/12/fft-calculator.html

Frequency response
    https://codepen.io/DonKarlssonSan/post/fun-with-web-audio-api

Simple checksum:
    http://stackoverflow.com/questions/811195/fast-open-source-checksum-for-small-strings

Nice article about FM radio demodulation via RTL-SDR
    http://aaronscher.com/wireless_com_SDR/RTL_SDR_AM_spectrum_demod.html

FFT implementation in Java
    http://stackoverflow.com/questions/7821473/fft-in-javascript

CRC checksum implementation
    http://stackoverflow.com/questions/21001659/crc32-algorithm-implementation-in-c-without-a-look-up-table-and-with-a-public-li

-----------------------

FIR filters
    https://tomroelandts.com/articles/how-to-create-a-simple-high-pass-filter
    https://tomroelandts.com/articles/how-to-create-a-simple-low-pass-filter
    https://fiiir.com/
    http://dsp.stackexchange.com/questions/31066/how-many-taps-does-an-fir-filter-need?rq=1

-----------------------

Harmonics of piano and violin
    http://stackoverflow.com/questions/10702942/note-synthesis-harmonics-violin-piano-guitar-bass-frequencies-midi

Why sounds from octaves sounds the same
    https://www.quora.com/Music-Theory-Why-do-pitches-separated-by-an-octave-sound-the-same

--------------------------

How to shift the frequency spectrum?
    http://dsp.stackexchange.com/questions/1991/how-to-shift-the-frequency-spectrum
    https://en.wikipedia.org/wiki/Heterodyne
    http://www.arc.id.au/ZoomFFT.html
    http://stackoverflow.com/questions/3780921/dsp-converting-a-sampled-signal-from-real-samples-to-complex-samples-and-vice

How to convert complex sample stream to real:
    https://www.dsprelated.com/showthread/comp.dsp/105302-1.php
        To convert your complex sample stream to real:

        1) Upsample to a higher sampling frequency, perhaps by inserting zero
        samples between original samples.

        2) Lowpass filter to remove signal images not centered at zero
        frequency. (An efficient implementation will not perform calculations
        with the zero valued samples.)

        3) Frequency shift (complex modulate) the image at DC to the desired
        center frequency.

        4) Take the real part. (This means that an effecient version of 3)
        need not calculate the imaginary component.)

        The exact filter response and frequency shift will depend on the
        parameters of the downconvertor in your system and perhaps the signals
        you are expecting to determine the modulation of.

        Dale B. Dalrymple
        http://dbdimages.com
