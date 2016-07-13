## Discrete Fourier Transform in a nutshell

Have you ever wondered how all of modern wireless devices could work on the same time without interfering? For
example we could use WiFi network (2.4GHz), LTE mobile phone (2100 MHz) and watch DVB-T TV (~500MHz) in parallel.
One of the answer is that they use different frequencies of electromagnetic waves. When we need to deal with
frequencies Fourier Transform will help us. But what it actually does? It changes signal represented in `time domain` 
into `frequency domain`. In other words it is decomposing signal that varies over time into the frequencies
that make it. That allows us for example to tune/pick only specific range of frequencies from full spectrum.
In case of sound waves output of Discrete Fourier Transform is often showed on music player window or on radio
LCD. Apart from nice looking bouncing bars we can also read from that output how loud each frequency range is.
We can for example read without even listening to the song how fast is the bass beat.

    IMAGE: 1 seconds of song and few ranges that overlaps

### DFT in fast and slow way

Currently the fastest algorithm for doing that is FFT - Fast Fourier Transform. If you are chatting on your smartphone,
using WiFi or watching TV from Terrestrial DVB transmitter FFT algorithm is running all the time. It's very fast but
unfortunately not that simple. Goal behind this article is to create relatively simple signal processing in
JavaScript from scratch. That's why we will focus on much simpler algorithm that in general will give same result.
There is only one disadvantage - this method is ultra slow. In JavaScript it's possible to compute only couple of
frequency bins (vertical 'bars' on frequency domain chart) in the real time. In comparison FFT will give us thousands
of them.

    IMAGE: speed comparison table?

### Basic DFT algorithm

Before we start lets change the way we express frequency of a sine wave. Instead of using frequency value we can
use samplePerPeriod value. This will allow us to drop frequency in our examples because it's always related to
additional parameter - sampling frequency. At the end we are working with arrays of samples so that would make it
simpler

    IMAGE: show few sines with different sampling>

Let say we have signal that is made of 3 sine waves. Sine A has samplePerPeriod equal 16, Sine B has samplePerPeriod
equal 20, Sine C has samplePerPeriod equal 28.

    IMAGE: 3 sines alone and summed

By looking at output signal it's really hard to say what are the frequencies that made that signal. It's even hard
to say how many sines are summed together. So how we can extract those frequencies? First step is to collect proper
amount of samples that we will use for later computations. This step is called windowing. Lets pick 1024 samples
from the final signal.

    IMAGE: windowed raw samples

In next step we need to apply window function to our raw samples. The goal is to 'flatten' all samples at left
and right part of the window and keep the middle part in a 'gentle' way. That is important because we want to decompose
our signal to sines waves that make it. The problems is that not all frequencies that we want to see in frequency
domain chart fits in a window in a way that we will have integer multiply of wave period.

    IMAGE: show how sine waves fits the window size

Without window function we would have 'frequency leakage' and main sines waves that makes the signal will not be
visible well as a peaks in frequency domain chart. Image below shows how window function looks like and how
our samples was changed after applying it.

    IMAGE: window function and final samples

In order to create frequency domain representation we need to create second chart. Each vertical bar on the chart is
called frequency bin and tells how much of that frequency is inside our signal from the window. Let say we want to
check frequencies in a range between 10 and 50 samplePerPeriod. To have nice resolution lets compute 160 frequency bins.
This means that frequency bins will be separated by 0.25 samplePerPeriod (50-10/160=0.25).
Output of Discrete Fourier Transform gives values that varies a lot. Some bins could have value 0.1 since other
could have 0.000001. In order to see all variety of values vertical axis is showed in decibels. 0.1 will be showed
as -10 decibels and 0.000001 will be showed as -60 decibels.

>Decibel goes down to negative value, -60 decibels means much weaker signal than for example -5 decibels.

    IMAGE: clean frequency domain chart with labels and scale

Ok, let start the most interesting part. How to actually compute Discrete Fourier Transform? We need to perform same
algorithm per each bin which goes like this:

>To get one frequency bin data we need to iterate thought all samples in our window. At each iteration value of the
>sample is multiplied by 2 dimensional unit vector. When we would show that vector from each iteration on 2D chart
>we will see that it's making circles which have period equal to frequencyBin's samplePerPeriod parameter.
>To get power of frequency bin we need to add all of those unit vectors together, divide by number of samples in a
>window and compute length of that final vector. Additionally we can convert that length into decibels.

In our frequency domain chart we decided to have 160 frequency bins. Window size was set earlier to 1024 sample. It
means that to create complete chart we need to do 163 840 iterations (1024 * 160). For better resolutions or bigger
window sizes this number goes up very fast. That's why this basic algorithm is ultra slow.

Let's pick one bin as an example. Our sines have samplePerPeriods 16, 20 and 28. To not cheat lets take 'random'
samplePerPeriod for example equal to 18. This frequency should not be present in our signal window so our expectation
is that we should get small decibel value.

[....]

>When our frequency is present in a signal it will produce more and more vectors that points to the same direction.
>It's like with swing on the playground. Small force with proper frequency will increase the amplitude of the swing.

[....]

Below you can find simple JavaScript implementation of all that was described above.

```javascript
function computeDiscreteFourierTransform(timeDomain, frequencyBinSamplePerPeriodFirst, frequencyBinSamplePerPeriodLast, frequencyBinSize) {
    var frequencyDomain, step, i, samplePerPeriod, frequencyBin;

    frequencyDomain = [];
    step = (frequencyBinSamplePerPeriodLast - frequencyBinSamplePerPeriodFirst) / frequencyBinSize;
    for (i = 0; i < frequencyBinSize; i++) {
        samplePerPeriod = frequencyBinSamplePerPeriodFirst + i * step;
        frequencyBinPowerDecibel = getFrequencyBinPowerDecibel(timeDomain, samplePerPeriod);
        frequencyDomain.push(frequencyBinPowerDecibel);
    }

    return frequencyDomain;
}

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
    real /= windowSize;                                         // normalize final vector
    imm /= windowSize;                                          // normalize final vector

    power = Math.sqrt(real * real + imm * imm);                 // compute length of the vector
    powerDecibel = 10 * Math.log(power) / Math.LN10;            // convert into decibels
    powerDecibel = powerDecibel < -80 ? -80 : powerDecibel;     // limit weak values to -80 decibels

    return powerDecibel;
}

function blackmanNuttall(n, N) {
    return 0.3635819
        - 0.4891775 * Math.cos(2 * Math.PI * n / (N - 1))
        + 0.1365995 * Math.cos(4 * Math.PI * n / (N - 1))
        - 0.0106411 * Math.cos(6 * Math.PI * n / (N - 1));
}
```

Example usage:

```javascript
var i, timeDomain, sample, windowSize, frequencyDomain;

timeDomain = [];
windowSize = 1024;
// fill array with time domain samples
for (i = 0; i < windowSize; i++) {
    sample = 0;
    sample += 0.3 * Math.sin(2 * Math.PI * i / 16);           // sine A with samplePerPeriod 16
    sample += 0.3 * Math.sin(2 * Math.PI * i / 20);           // sine B with samplePerPeriod 20
    sample += 0.3 * Math.sin(2 * Math.PI * i / 28);           // sine C with samplePerPeriod 28
    timeDomain.push(sample * blackmanNuttall(i, windowSize)); // apply window function and push processed sample to array
}
frequencyDomain = computeDiscreteFourierTransform(timeDomain, 10, 50, 160);  // will give 160 powerDecibel values
                                                                             // starting from samplePerPeriod 10
                                                                             // ending at samplePerPeriod 49.75
                                                                             // with samplePerPeriod step of 0.25

console.log(timeDomain.length);      // output: 1024 (or any other depending on windowSize)
console.log(frequencyDomain.length); // output: 160
```

You can easily convert `frequencyDomain` array index into `samplePerPeriod`. In our example indexes are separated
by 0.25 ((50 - 10) / 160 = 0.25) and first index is showing power in decibels of 10 `samplePerPeriod` wave. We just
need to add first bin `samplePerPeriod` value to `step` multiplied by `array index`.
Lets look what power values we have near our three sines

```javascript
console.log(frequencyDomain[21]);    // output: -33.334 -> powerDecibel of 15.25 samplePerPeriod wave (10 + 0.25 * 21 = 15.25)
console.log(frequencyDomain[22]);    // output: -20.398 -> powerDecibel of 15.50 samplePerPeriod wave (10 + 0.25 * 22 = 15.50)
console.log(frequencyDomain[23]);    // output: -14.411 -> powerDecibel of 15.75 samplePerPeriod wave (10 + 0.25 * 23 = 15.75)
console.log(frequencyDomain[24]);    // output: -12.637 -> powerDecibel of 16.00 samplePerPeriod wave (10 + 0.25 * 24 = 16.00) PEAK POWER (sine A)
console.log(frequencyDomain[25]);    // output: -14.302 -> powerDecibel of 16.25 samplePerPeriod wave (10 + 0.25 * 25 = 16.25)
console.log(frequencyDomain[26]);    // output: -19.420 -> powerDecibel of 16.50 samplePerPeriod wave (10 + 0.25 * 26 = 16.50)
console.log(frequencyDomain[27]);    // output: -28.981 -> powerDecibel of 16.75 samplePerPeriod wave (10 + 0.25 * 27 = 16.75)
// ...
console.log(frequencyDomain[32]);    // output: -63.552
// ...
console.log(frequencyDomain[39]);    // output: -13.352
console.log(frequencyDomain[40]);    // output: -12.637 PEAK POWER (sine B)
console.log(frequencyDomain[41]);    // output: -13.317
// ...
console.log(frequencyDomain[56]);    // output: -61.482
// ...
console.log(frequencyDomain[71]);    // output: -12.821
console.log(frequencyDomain[72]);    // output: -12.637 PEAK POWER (sine C)
console.log(frequencyDomain[73]);    // output: -12.815
```

-----------

DELETE THIS (?) begin

For simplicity and without
entering into details let say that for best results we need to create window that takes integer number of periods
of each sines. In other words window width should be integer multiply of final signal period (our summed 3 sines).
In case of our three sines (5, 8, 10) smallest common multiple is 40.

    IMAGE: show periods and when sum starts from the beginning>
    
Let say we picked 2 periods of final signal. It means that we have 80 samples in our window. Those samples represents
our signal in time domain.

DELETE THIS (?) end

### TODO:

+ [done] much simpler than FFT but ultra slow
+ [done] explain frequency domain and time domain, frequency bin [IMAGE]
+ [done] tell about samplesPerPeriod -> a way to skip sampling frequency
+ [done] add couple of sine waves together [CHART separate and sum]
- describe algorithm, running circle [CHART]
- show that we collect vectors per each sample [CHART]
- when input signal contains that frequency it will produce lots of vectors that points to the same direction
- sum of vectors is power of sin wave frequency that we are looking at, direction is phase of that sine wave
- we don't need to loop through all frequency bins in the know that is the frequency of our signal
- say magic at the end :P
- tell also that in the example page we can change window site to experiment with other values