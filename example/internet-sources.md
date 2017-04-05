# Internet sources:

Every time I found something interesting I was adding it the my YouTube list:
https://www.youtube.com/playlist?list=PLw1tfxH2oZ8OXnTSO6u6-hbgttynp1fo3

Additionally you can find a lot of articles in the links below:

## Not categorised (yet)

```
Web Audio API - missing phase info
    'Sadly, even though the analyser node computes a complex fft, it doesn't give access to the complex representations, just the magnitudes of it.'
    http://stackoverflow.com/questions/14169317/interpreting-web-audio-api-fft-results

OscillatorNode custom:
    http://stackoverflow.com/questions/30631595/custom-wave-forms-in-web-audio-api

About coefficients:
    http://themusictoolbox.net/waves/
    https://jackschaedler.github.io/circles-sines-signals/dft_introduction.html

How to interpret negative frequencies
    http://dsp.stackexchange.com/questions/431/what-is-the-physical-significance-of-negative-frequencies

Freq domain time resolution:
    http://electronics.stackexchange.com/questions/12407/what-is-the-relation-between-fft-length-and-frequency-resolution

IQ sampling explanation (complex signal):
    http://whiteboard.ping.se/SDR/IQ                        GREAT GREAT GREAT !!!
    https://www.youtube.com/watch?v=h_7d-m1ehoY

Very nice project about DSP and Software Defined Radio
    https://github.com/simonyiszk/openwebrx
    http://openwebrx.org/bsc-thesis.pdf

Capture and decode fm radio
    https://witestlab.poly.edu/blog/capture-and-decode-fm-radio/
    https://en.wikipedia.org/wiki/Digital_down_converter
    https://en.wikipedia.org/wiki/Detector_(radio)                 Used in first link: polar frequency discriminator

Nice online charts:
    http://fooplot.com/

Frequency response
    https://codepen.io/DonKarlssonSan/post/fun-with-web-audio-api

Simple checksum:
    http://stackoverflow.com/questions/811195/fast-open-source-checksum-for-small-strings

Nice article about FM radio demodulation via RTL-SDR
    http://aaronscher.com/wireless_com_SDR/RTL_SDR_AM_spectrum_demod.html

CRC checksum implementation
    http://stackoverflow.com/questions/21001659/crc32-algorithm-implementation-in-c-without-a-look-up-table-and-with-a-public-li

-----------------------

Harmonics of piano and violin
    http://stackoverflow.com/questions/10702942/note-synthesis-harmonics-violin-piano-guitar-bass-frequencies-midi

Why sounds from octaves sounds the same
    https://www.quora.com/Music-Theory-Why-do-pitches-separated-by-an-octave-sound-the-same

--------------------------

How to shift the frequency spectrum?
    http://dsp.stackexchange.com/questions/1991/how-to-shift-the-frequency-spectrum
    https://en.wikipedia.org/wiki/Heterodyne

```

## FFT

```
FFT FAQ
    http://dspguru.com/dsp/faqs/fft/

FFT explained (Decimation In Time) - REALLY GREAT!
    https://jakevdp.github.io/blog/2013/08/28/understanding-the-fft/
    
FFT explained (Decimation In Time and Decimation In Frequency) - REALLY GREAT!
    https://cnx.org/contents/JqoGchv3@3/Overview-of-Fast-Fourier-Trans     FFT Overview
    https://cnx.org/contents/zmcmahhR@7/Decimation-in-time-DIT-Radix-2     DIT
    https://cnx.org/contents/XaYDVUAS@6/Decimation-in-Frequency-DIF-Ra     DIF
    
FFT explained (Decimation In Time and Decimation In Frequency) - REALLY GREAT!!
    http://www.cmlab.csie.ntu.edu.tw/cml/dsp/training/coding/transform/fft.html
    
FFT very clean implementation in Java (FFT Decimation In Time)
    http://stackoverflow.com/questions/7821473/fft-in-javascript
    http://introcs.cs.princeton.edu/java/97data/FFT.java.html        < link from stackoverflow answer
    http://introcs.cs.princeton.edu/java/97data/Complex.java.html    < link from stackoverflow answer

FFT - Decimation In Time vs Decimation In Frequency
    https://www.quora.com/What-is-the-difference-between-decimation-in-time-and-decimation-in-frequency

FFT calculator:
    http://scistatcalc.blogspot.com/2013/12/fft-calculator.html

FFT output:
    http://stackoverflow.com/questions/6740545/need-help-understanding-fft-output

Intuitive Understanding of the Fourier Transform and FFTs
    https://www.youtube.com/watch?v=FjmwwDHT98c&t=1840s

FFT amplitudes:
    https://www.mathworks.com/matlabcentral/answers/162846-amplitude-of-signal-after-fft-operation

Great about Bins and freqyency location in FFT
    http://www.gaussianwaves.com/2015/11/interpreting-fft-results-complex-dft-frequency-bins-and-fftshift/

Why is the fft mirrored:
    http://dsp.stackexchange.com/questions/4825/why-is-the-fft-mirrored

How to get frequency from FFT index
    http://stackoverflow.com/questions/4364823/how-do-i-obtain-the-frequencies-of-each-value-in-an-fft
    http://stackoverflow.com/questions/14900459/symmetric-part-after-applying-fft-is-for-which-frequencies
    http://dsp.stackexchange.com/questions/282/complex-conjugate-and-ifft

FFT Zoom:
    http://www.arc.id.au/ZoomFFT.html

```

## FIR and IIR filters (Finite Impulse Response and Infinite Impulse Response)

```
    https://tomroelandts.com/articles/how-to-create-a-simple-high-pass-filter
    https://tomroelandts.com/articles/how-to-create-a-simple-low-pass-filter
    https://fiiir.com/
    http://dsp.stackexchange.com/questions/31066/how-many-taps-does-an-fir-filter-need?rq=1
```

## Time domain: convert real samples to complex samples

```
http://stackoverflow.com/questions/3780921/dsp-converting-a-sampled-signal-from-real-samples-to-complex-samples-and-vice

    Adding zeros as the imaginary is conceptually the first step in what you want
    to do. Initially you have a real only signal that looks like this in the frequency
    domain:
               [r0, r1, r2, r3, ...]

                               /-~--------\
                             DC            +Fs/2
    If you stuff it with zeros for the imaginary value, you'll see that you really
    have both positive and negative frequencies as mirror images:

               [r0 + 0i, r1 + 0i, r2 + 0i, r3 + 0i, ...]

                 /--------~-\  /-~--------\
              -Fs/2          DC            +Fs/2
    Next, you multiply that signal in the time domain by a complex tone at -Fs/4
    (tuning the signal). Your signal will look like

               ----~-\ /-~--------\ /------
                            DC
    So now, you filter out the center half and you get:

               ________/-~--------\________
                            DC
    Then you decimate by two and you end up with:

                       /-~--------\
    Which is what you want.

    All of these steps can be performed efficiently in the time domain. If you pay
    attention to all of the intermediate steps, you'll notice that there are many
    places where you're multiplying by 0, +1, -1, +i, or -i. Furthermore, the half
    band low pass filter will have a lot of zeros and some symmetry to exploit. Since
    you know you're going to decimate by 2, you only have to calculate the samples
    you intend to keep. If you work through the algebra, you'll find a lot of places
    to simplify it for a clean and fast implementation.

    Ultimately, this is all equivalent to a Hilbert transform, but I think it's
    much easier to understand when you decompose it into pieces like this.

    Converting back to real from complex is similar. You'll stuff it with zeroes
    for every other sample to undo the decimation. You'll filter the complex signal
    to remove an alias you just introduced. You'll tune it up by Fs/4, and then throw
    away the imaginary component. (Sorry, I'm all ascii-arted out... :-)

    Note that this conversion is lossy near the boundaries. You'd have to use an
    infinite length filter to do it perfectly.

    answered Sep 24 '10 at 6:19
    xscott
```

## Time domain: convert complex samples to real samples

```
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
```
