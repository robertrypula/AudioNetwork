# Internet sources:

Every time I found something interesting I was adding it the my YouTube list:
https://www.youtube.com/playlist?list=PLw1tfxH2oZ8OXnTSO6u6-hbgttynp1fo3

Additionally you can find a lot of articles in the links below:

TODO: This is direct copy of txt file. Reformat and make links clickable

## Not categoried (yet) update 2018.05.02

```
AngularJs Dependency Injection with TypeScript
!!!!!! https://codepen.io/martinmcwhorter/post/angularjs-1-x-with-typescript-or-es6-best-practices

Dependency Injection in Angular
!!!!!! https://blog.thoughtram.io/angular/2015/05/18/dependency-injection-in-angular-2.html

How to define static property in TypeScript Interface
https://stackoverflow.com/a/43674389
In general we shouldn't do it - move code to service

Solution for service inheritance:
https://stackoverflow.com/questions/39038791/inheritance-and-dependency-injection

Service or static method:
https://stackoverflow.com/questions/39011788/typescript-and-angularjs-static-methods-vs-services
The problem is the same in Java or other languages. Static method are hard to extends and mock that why you should use services instead of static method.

Abstract classes as Tokens in Angular
https://www.bennadel.com/blog/3327-using-abstract-classes-as-dependency-injection-tokens-for-swappable-behaviors-in-angular-4-2-3.htm

Interesting EntityManager that injects all dependencies in the base class:
https://stackoverflow.com/questions/38309481/angular-2-inject-service-into-class

Mocking ES6 modules
!!!!! https://railsware.com/blog/2017/01/10/mocking-es6-module-import-without-dependency-injection/

About TypeScript decorators in general
!!!!!!!! http://www.sparkbit.pl/typescript-decorators/

Decorators in TypeScript for DependencyInjection
!!!!!!!! http://source.coveo.com/2016/02/04/typescript-injection-decorator/
https://github.com/GermainBergeron/injector
https://github.com/GermainBergeron/dose

Decorators in TypeScript for DependencyInjection
!!!!!!!!! https://www.andrewmunsell.com/blog/dependency-injection-for-modern-javascript-using-es6-classes-and-es7-decorators/

Refactor AnglarJs into Es6
!!!!!! https://medium.com/@u_glow/upgrading-an-angular-es5-codebase-to-es6-85554288c08d

Get class name
https://stackoverflow.com/questions/29310530/get-the-class-name-of-es6-class-instance

Mocking in AnglarJs
https://www.sitepoint.com/mocking-dependencies-angularjs-tests/

About redux-ORM
http://blog.isquaredsoftware.com/2016/10/practical-redux-part-1-redux-orm-basics/

Angular Test Beds vs Dependency Injection: GREAT!!
https://kirjai.com/testing-angular-services-with-dependencies/

https://www.andrewmunsell.com/blog/dependency-injection-for-modern-javascript-using-es6-classes-and-es7-decorators/
http://blog.mgechev.com/2013/12/18/inheritance-services-controllers-in-angularjs/
https://code.tutsplus.com/tutorials/stop-nesting-functions-but-not-all-of-them--net-22315

--------------------
Nice links related to DSP
https://dsp.stackexchange.com/questions/42757/effects-of-linear-interpolation-of-a-time-series-on-its-frequency-spectrum/42761
https://math.stackexchange.com/questions/1372632/how-does-sinc-interpolation-work
http://aaronscher.com/wireless_com_SDR/RTL_SDR_AM_spectrum_demod.html
https://fas.org/man/dod-101/navy/docs/es310/FM.htm
http://jontio.zapto.org/hda1/paradise/QAM.htm

Great interactive article about complex numbers and fractals
http://acko.net/blog/how-to-fold-a-julia-fractal/

```

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

--------------------------

Find beginning of signal for BPSK Demodulation
    https://dsp.stackexchange.com/questions/12838/find-beginning-of-signal-for-bpsk-demodulation?noredirect=1&lq=1

--------------------------

About Window function:
    https://dsp.stackexchange.com/questions/208/what-should-be-considered-when-selecting-a-windowing-function-when-smoothing-a-t
    http://www.electronicdesign.com/analog/choose-right-fft-window-function-when-evaluating-precision-adcs
    http://www.edn.com/electronics-news/4383713/Windowing-Functions-Improve-FFT-Results-Part-I
    http://www.edn.com/electronics-news/4386852/Windowing-Functions-Improve-FFT-Results-Part-II

--------------------------

Great about Wifi with Barker codes
    http://ece.eng.wayne.edu/~smahmud/ECECourses/ECE5620/Notes/Wi-Fi-Lecture.pdf
    http://www.gummy-stuff.org/WiFi.htm

--------------------------

Great online book about DSP:
    http://www.dspguide.com/pdfbook.htm

```

### TCP

```
https://support.microsoft.com/pl-pl/help/172983/explanation-of-the-three-way-handshake-via-tcp-ip
http://www.cs.miami.edu/home/burt/learning/Csc524.032/notes/tcp_nutshell.html
http://www.masterraghu.com/subjects/np/introduction/unix_network_programming_v1.3/ch02lev1sec6.html
```

### OFDM

```

Symbol transition windowing
    https://books.google.pl/books?id=OgsbDgAAQBAJ&lpg=PA93&dq=ofdm%20symbol%20transition&hl=pl&pg=PA93#v=onepage&q&f=false
    http://rfmw.em.keysight.com/rfcomms/n4010a/n4010aWLAN/onlineguide/ofdm_raised_cosine_windowing.htm

WiFi explained
    http://rfmw.em.keysight.com/wireless/helpfiles/89600b/webhelp/subsystems/wlan-ofdm/content/ofdm_80211-overview.htm
    http://rfmw.em.keysight.com/wireless/helpfiles/89600b/webhelp/subsystems/wlan-ofdm/content/ofdm_basicprinciplesoverview.htm

Another great example
    http://www.sharetechnote.com/html/Communication_OFDM.html

Nice articles about OFDM
    http://www.skydsp.com/publications/index.htm

OFDM Symbols synchronization
    https://dsp.stackexchange.com/questions/7724/how-is-symbol-synchronization-with-ofdm-done
    https://dsp.stackexchange.com/questions/360/how-to-demodulate-an-ofdm-signal/368#368

OFDM pilot tones
    https://dsp.stackexchange.com/questions/15164/using-pilot-tones-to-estimate-carrier-frequency-offset-in-ofdm
```

## Audio Communication Systems

```
Complete Acoustic Communication System - 'Acoustic OFDM'   GREAT!!!!!!!
    https://www.nttdocomo.co.jp/english/binary/pdf/corporate/technology/rd/technical_journal/bn/vol8_2/vol8_2_004en.pdf

Nice project
    http://courses.cs.washington.edu/courses/cse561/10sp/project_files/FinalReport_FCI_YH.pdf
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

## Convolution, cross-correlation, auto-correlation

```
    https://dsp.stackexchange.com/questions/736/how-do-i-implement-cross-correlation-to-prove-two-audio-files-are-similar
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
