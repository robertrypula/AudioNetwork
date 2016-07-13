## Discrete Fourier Transform in a nutshell

Have you ever wondered how all of modern wireless devices could work on the same time without interfering? For
example we could use WiFi network (2.4GHz), LTE mobile phone (2100 MHz) and watch DVB-T TV (~500MHz) in parallel.
One of the answer is that they use different frequencies of electromagnetic waves. When we need to deal with
frequencies, Fourier Transform will help us. But what it actually does? It changes signal represented in time
domain into frequency domain. In other words it is decomposing signal that varies over time into the frequencies
that make it. That allows us for example to tune/pick only specific range of frequencies from full spectrum.
In case of sound waves output of Discrete Fourier Transform is often showed on music player window or on radio
LCD. Apart from nice looking bouncing bars we can also read from that output how loud each frequency range is.
We can for example read without even listening to the song how fast is the bass beat.

    <IMAGE: 1 seconds of song and few ranges that overlaps>

### DFT in fast and slow way

Currently the fastest algorithm for doing that is FFT - Fast Fourier Transform. If you are chatting on your smartphone,
using WiFi or watching TV from Terrestrial DVB transmitter FFT algorithm is running all the time. It's very fast but
unfortunately not that simple. Goal behind this article is to create relatively simple signal processing in
JavaScript from scratch. That's why we will focus on much simpler algorithm that in general will give same result.
There is only one disadvantage - this method is ultra slow. In JavaScript it's possible to compute only couple of
frequency bins (vertical 'bars' on frequency domain chart) in the real time. In comparison FFT will give us thousands
of them.

    <IMAGE: speed comparison table?>

### Basic DFT algorithm

Before we start lets change the way we express frequency of a sine wave. Instead of using frequency value we can
use samplePerPeriod value. This will allow us to drop frequency in our examples because it's always related to
additional parameter - sampling frequency. At the end we are working with arrays of samples so that would make it
simpler

    <IMAGE: show few sines with different sampling>

Let say we have signal that is made of 3 sine waves. Sine A has samplePerPeriod equal 16, Sine B has samplePerPeriod
equal 20, Sine C has samplePerPeriod equal 28.

    <IMAGE: 3 sines alone and summed>

By looking at output signal it's really hard to say what are the frequencies that made that signal. It's even hard
to say how many sines are summed together. So how we can extract those frequencies? First step is to collect proper
amount of samples that we will use for later computations. This step is called windowing. Lets pick 1024 samples
from the final signal.

    <IMAGE: windowed raw samples>

In next step we need to apply window function to our raw samples. The goal is to 'flatten' all samples at left
and right part of the window and keep the middle part in a 'gentle' way. That is important because we want to decompose
our signal to sines waves that make it. The problems is that not all frequencies that we want to see in frequency
domain chart fits in a window in a way that we will have integer multiply of wave period.

    <IMAGE: show how sine waves fits the window size>

Without window function we would have 'frequency leakage' and main sines waves that makes the signal will not be
visible well as a peaks in frequency domain chart. Image below shows how window function looks like and how
our samples was changed after applying it.

    <IMAGE: window function and final samples>

In order to create frequency domain representation we need to create second chart. Each vertical bar on the chart is
called frequency bin and tells how much of that frequency is inside our signal from the window. Let say we want to
check frequencies in a range between 10 and 50 samplePerPeriod. To have nice resolution lets compute 160 frequency bins.
This means that frequency bins will be separated by 0.25 samplePerPeriod (50-10/160=0.25).
Output of Discrete Fourier Transform gives values that varies a lot. Some bins could have value 0.1 since other
could have 0.000001. In order to see all variety of values vertical axis is showed in decibels. 0.1 will be showed
as -10 decibels and 0.000001 will be showed as -60 decibels. REMEMBER: it goes down to negative value, -60 decibels
means much weaker signal than for example -5 decibels.

    <IMAGE: clean frequency domain chart with labels and scale>

Ok, let start the most interesting part. How to actually compute Discrete Fourier Transform? We need to perform same
algorithm per each bin. Let's pick one bin as an example. Our sines have samplePerPeriods 16, 20 and 28. To not cheat
lets take 'random' samplePerPeriod for example equal to 18. This frequency should not be present in our signal window
so our expectation is that we should get small decibel value.

[...]

>When our frequency is present in a signal it will produce more and more vectors that points to the same direction.
>It's like with swing on the playground. Small force with proper frequency will increase the amplitude of the swing.

```
function getFrequencyBinPowerDecibel(timeDomain, samplePerPeriod) {
    var windowSize, real, imm, i, sample, r, power, powerDecibel;

    windowSize = timeDomain.length;            // timeDomain array length is our window size
    real = 0;
    imm = 0;
    for (i = 0; i < windowSize; i++) {
        sample = timeDomain[i];
        r = 2 * Math.PI * i / samplePerPeriod; // compute radians for 'unit vector'
        real += Math.cos(r) * sample;          // 'sample' value alters 'unit vector' length, it could also change
        imm += Math.sin(r) * sample;           // direction of vector in case of negative 'sample' values
    }
    real /= windowSize;
    imm /= windowSize;

    power = Math.sqrt(real * real + imm * imm);
    powerDecibel = 10 * Math.log(power) / Math.LN10;
    powerDecibel = powerDecibel < -80 ? -80 : powerDecibel;     // weak values only down to -80 decibels

    return powerDecibel;
}
```



-----------
DELETE THIS: (?)
For simplicity and without
entering into details let say that for best results we need to create window that takes integer number of periods
of each sines. In other words window width should be integer multiply of final signal period (our summed 3 sines).
In case of our three sines (5, 8, 10) smallest common multiple is 40.
<IMAGE: show periods and when sum starts from the beginning>
Let say we picked 2 periods of final signal. It means that we have 80 samples in our window. Those samples represents
our signal in time domain.

0 periodPerWindow                 1 periodPerWindow               10 periodPerWindow              40 periodPerWindow
80/0prw = +INF samplePerPeriod    80/1prw = 80 samplePerPeriod    80/10prw = 8 samplePerPeriod    80/40prw = 2 samplePerPeriod
80/+INFspp = 0 periodPerWindow    80/80spp = 1 periodPerWindow    80/8spp = 10 periodPerWindow    80/2ssp = 40 periodPerWindow
-----------



+ much simpler than FFT but ultra slow
+ explain frequency domain and time domain, frequency bin [IMAGE]
+ tell about samplesPerPeriod -> a way to skip sampling frequency
+ add couple of sine waves together [CHART separate and sum]
- describe algorithm, running circle [CHART]
- show that we collect vectors per each sample [CHART]
- when input signal contains that frequency it will produce lots of vectors that points to the same direction
- sum of vectors is power of sin wave frequency that we are looking at, direction is phase of that sine wave
- we don't need to loop through all frequency bins in the know that is the frequency of our signal
- say magic at the end :P
- tell also that in the example page we can change window site to experiment with other values