## Data transmission over sound in JavaScript from scratch - part 1 - Discrete Fourier Transform

JavaScript over the years has become a very powerful language. It provides many APIs to perform various useful 
tasks. For example we can draw 2D/3D graphics (with GPU acceleration) by using WebGL or use WebWorkers 
to improve performance of intense computations on multi core CPU. We can also access hardware like microphone 
or speakers via Web Audio API. [Here](https://developer.mozilla.org/en-US/docs/Web/API) you can find all interfaces 
that are just ready to use while developing web application.

Idea behind this article is to take advantage of Web Audio API and go back to old times. Do you remember sound 
of modem that was trying to initialize dial-up connection? It was quite noisy and it lasted for couple 
of seconds. After connection was initialized your data was transmitted and received via phone call. Actually 
you could 'hear' your data by picking phone connected to the same line as modem. Why sound? Because at 
old days lots of people already had phone line. It was just cheaper and easier to use modem and existing wiring.

But there is not rose without a thorn. Infrastructure at those times was designed to carry human voice only.
As Wikipedia says: 'In telephony, the usable voice frequency band ranges from approximately 300 Hz to 3400 Hz'.
It means that modems needed to work with very limited bandwidth (~3kHz) over quite noisy analog channel. 
First modem was released in 1958 and it was transmitting data with the speed of 100 bit/s. Over the years
speed was increasing and in late 90s it ended up at 56 kbit/sek.

Web Audio API allows us to generate and receive sound in JavaScript. We could use it to create application that 
acts like a modem. Air in our room would be our noisy telephone line. Important difference is that 
modern laptop/smartphone microphones work in wider frequency ranges (in theory 20Hz - 20kHz). It means that we have 
much more bandwidth to work with. Our goal is to send and receive binary data even there is loud in the room (white 
noise, music playing, conversation between people). What about the speed? Well, it could be even 8 bit/s as long 
as we do it on our own from scratch. Speeds around 64 bit/s will allows to send in few seconds phone number or 
URL between two machines without using any communicator or email. We could create simple chat that doesn't 
require any Internet connection.

To create such application we need to involve Digital Signal Processing. It means that first thing that is 
worth doing is to learn a bit about Discrete Fourier Transform.

### Introduction to DFT

Have you ever wondered how all of modern wireless digital devices could work on the same time without interfering? For
example we could use WiFi network (2.4GHz), LTE mobile phone (2100 MHz) and watch DVB-T TV (~500MHz) in parallel.
One of the answer is that they use different frequencies of electromagnetic waves. When we need to deal with
frequencies Fourier Transform will help us. To be more precise - when we need to deal with digital signal, Discrete 
Fourier Transform will help us. But what it actually does? It changes signal represented in `time domain` into 
`frequency domain`. In other words it is decomposing signal that varies over time into the frequencies that make it. 
That allows us for example to tune/pick only specific range of frequencies from full spectrum. 

Wait a minute... we supposed to talk about sound! You're right but in general it's all about frequencies. It doesn't 
matter if we talk about radio frequencies (around 3 kHz to 300 GHz) or sound waves frequencies that human hear 
(20Hz - 20kHz). At both cases signal could be digitized by sampling it over time. Principle is exactly the same.

Nowadays sound is very rarely used to transmit data but there are still plenty of other DFT applications. Output of
Discrete Fourier Transform is often showed on music player window or on radio LCD. Apart from nice looking bouncing 
bars we can also read from that output how loud each frequency range is. We can for example read without even 
listening to the song how fast is the bass beat (Figure 1).

[![Song and equalizer bars](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/01-song-and-equalizer-bars-v2.min.png)](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/01-song-and-equalizer-bars-v2.png)  
*Figure 1 - Song and equalizer bars*

### DFT in fast and slow way

Currently the fastest algorithm is called FFT - Fast Fourier Transform. If you are chatting on your smartphone,
using WiFi or watching TV from Terrestrial DVB transmitter FFT algorithm is running all the time. It's very fast but
unfortunately not that simple. Goal behind this article is to create relatively simple signal processing in
JavaScript **from scratch**. That's why we will focus on much simpler algorithm that in general will give same result.
There is only one disadvantage - this method is ultra slow. In JavaScript it's possible to compute only couple of
frequency bins (vertical 'bars' on frequency domain chart) in the real time without overloading the CPU. In 
comparison FFT will give us thousands of them.

### Basic DFT algorithm

Before we start lets change the way we express frequency of a sine wave. Instead of using frequency value we can
use samplePerPeriod value. This will allow us to drop frequency in our examples because it's always related to
additional parameter - sampling frequency. At the end we are working with arrays of samples so that would make it
simpler (Figure 2).

[![Two ways to express sine wave](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/02-two-ways-to-express-sine-wave.min.png)](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/02-two-ways-to-express-sine-wave.png)  
*Figure 2 - Two ways to express sine wave*

Let say we have signal that is made of 3 sine waves. Sine A has samplePerPeriod equal 28, Sine B has samplePerPeriod
equal 20, Sine C has samplePerPeriod equal 16. If you are really curious how much Hertz is that you can use formula 
`frequencyInHertz = sampleRate / samplePerPeriod`. It's 1575Hz, 2205Hz and 2756.25Hz respectively assuming 44100 
sampling rate (Figure 3). 

[![Sines that makes the signal](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/03-sines-that-makes-signal.min.png)](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/03-sines-that-makes-signal.png)  
*Figure 3 - Sines that makes the signal*

By looking at output signal it's really hard to say what are the frequencies that made that signal. It's even hard
to say how many sines are summed together. So how we can extract those frequencies? In first step we need to collect 
proper amount of samples that we will use for later computations. This step is called **windowing**. You can also treat 
it as a animation frame because it will show frequencies of the signal in this exact moment. We cannot compute DFT on 
all samples from the buffer at once. We need to split it into pieces and transform one by one. Often adjacent windows 
overlaps to not lose any part of the signal. Ok, lets set our window size to 1024 and pick this amount of samples 
from the signal buffer (Figure 4).

[![Windowed samples from buffer](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/04-windowed-samples-from-buffer.min.png)](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/04-windowed-samples-from-buffer.png)  
*Figure 4 - Windowed samples from buffer*

In next step we need to apply window function to our raw samples. The goal is to 'flatten' all samples at left
and right part of the window and keep the middle part in a 'gentle' way. That is important because we want to decompose
our signal to sines waves that make it. The problems is that not all frequencies that we want to see in frequency
domain chart fits in a window in a way that we will have integer multiply of wave period. In the Figure 5 only last 
sine fits the window fully.

[![How different sine waves fits the window](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/05-how-different-sine-waves-fits-the-window-v2.min.png)](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/05-how-different-sine-waves-fits-the-window-v2.png)  
*Figure 5 - How different sine waves fits the window*

Without window function those 'not complete' sines would produce effect called 'frequency leakage'. In result major 
sines waves that makes the signal will not be visible well as a peaks in frequency domain chart. Figure 6 shows 
how window function looks like (in the middle) and how our samples was changed after applying it.

[![Applying window function](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/06-applying-window-function.min.png)](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/06-applying-window-function.png)  
*Figure 6 - Applying window function*

Now all sines starts and ends in a gentle way.

In order to create frequency domain representation we need to create second chart (Figure 7). Each vertical bar on 
the chart is called frequency bin and tells how much of that frequency is inside our signal from the window. Let say 
we want to check frequencies in a range between 10 and 50 samplePerPeriod. To have nice resolution lets compute 160 
frequency bins. This means that frequency bins will be separated by 0.25 samplePerPeriod (50-10/160=0.25). 
Output of Discrete Fourier Transform gives values that varies a lot. Some bins could have value 0.1 since other
could have 0.000001. In order to see all variety of values vertical axis is showed in decibels. 0.1 will be showed
as -10 decibels and 0.000001 will be showed as -60 decibels.

>Decibel goes down to negative value. -60 decibels means much weaker signal than for example -5 decibels.

>All frequency charts have higher frequencies on the right side and lower frequencies on the left side. In our case
>lower samplePerPeriod means value higher frequency because sine have less samples in a period - it's more packed 
>so frequency is higher. That is the reason why we need to put highest samplePerPeriod value on the left and end
>with lowest samplePerPeriod on the right.

Again, if you are really curious about Hertz it will show frequencies between 882Hz and ~4302Hz (assuming sampling 
rate 44100).

>Using samplePerPeriod instead frequency will affect horizontal axis of the frequency domain chart. This conversion 
>is not linear so our frequency bins will not be spaced by equal amount of Hertz. They will be spaced by equal 
>amount of samplePerPeriod instead. For needs of this article it's ok.

[![Blank frequency domain chart with caption](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/07-blank-frequency-domain-chart-with-caption.min.png)](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/07-blank-frequency-domain-chart-with-caption.png)  
*Figure 7 - Blank frequency domain chart with caption*

Ok, let start the most interesting part. How to actually compute Discrete Fourier Transform? We need to perform same
algorithm per each bin which goes like this:

>To get **one** frequency bin data we need to iterate thought **all** samples in our window. At each iteration
>2 dimensional unit vector is produced. It starts always at origin and length is equal to one - only direction is 
>related to current iteration. When we would show those unit vectors on animation we will see that they are making 
>circles (like hands on the clock) with period equal to frequencyBin's samplePerPeriod parameter.
>At each iteration we need to multiply our unit vector by value of the sample. Since samples are between 0 and 1 
>this operation can shorten our vector. In case of negative values it could also change it's direction by 180 degrees.
>To get power value we need to add all of those multiplied vectors together and divide by number of samples 
>in a window. Length of final vector is power of wave related to that frequency bin. Additionally we can convert 
>that length into decibels.

Our 2d vectors are actually complex numbers represented on complex plane. X axis is real part and Y axis is imaginary
part of complex number. For simplicity we could treat it as normal 2d vector. 

Apart from length our final vector have direction. It's telling about other important property of the wave: 

>If we measure angle between final vector and positive Y axis clockwise it will be equal to phase of 
>that sine wave that we are examining.

In our frequency domain chart we decided to have 160 frequency bins. Window size was set earlier to 1024 sample. It
means that to create complete chart we need to do 163 840 iterations (1024 * 160). For better resolutions or bigger
window sizes this number goes up very fast. That's why this basic algorithm is ultra slow.

### Examples

Example is always better that a thousands words. Our sines have samplePerPeriods 28, 20 and 16. Let's take some 
'random' samplePerPeriod for example equal 18. This frequency **should not** be present in our signal window 
so our expectation is that we should get low decibel value.

We need to iterate thought all 1024 samples. Unfortunately this number is too big to show everything in details.
Let's show only 24 iterations from the middle of the window because there samples have highest amplitudes. Of course
under the hood we will compute all 1024 samples. Yellow marker shows that range - iterations between 401 and 424 
(Figure 8).

[![Part of the window that was explained in details](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/08-part-of-the-window-for-dft-details.min.png)](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/08-part-of-the-window-for-dft-details.png)  
*Figure 8 - Part of the window that was explained in details* 
 
After zooming in it's clearly visible how each sample value affects related unit vector length (Figure 9). 
     
[![DFT iteration details for samplePerPeriod 11](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/09-dft-iteration-details-for-sample-per-period-11.min.png)](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/09-dft-iteration-details-for-sample-per-period-11.png)  
*Figure 9 - DFT iteration details for samplePerPeriod 11*

Dark dot is end of unit vector that starts at origin. Line was omitted to not collide with blue vector which is more 
important. Blue vector is unit vector multiplied by sample value. At this frequency bin we are 
looking for wave with samplePerPeriod equal 11. As you can see dark dot made a full circle in exactly
11 iterations. In our window we have 1024 samples. It means that dark dot (unit vector/complex number) will do 
~93 rotations around origin (1024/11). In general more rotations we have the better results we get.
Even by looking at two full periods it's visible that their directions are pretty much random.   

>When frequency that we are examining **is not present** in the signal it will produce vectors that points to many 
>different directions. If we would sum them together they will all cancel each other and length of the final vector
>will be small.

Ok, but what happen if we pick samplePerPeriod value equal to one of ours sine waves? Let's pick value 16 (Figure 10).

[![DFT iteration details for samplePerPeriod 16](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/10-dft-iteration-details-for-sample-per-period-16.min.png)](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/10-dft-iteration-details-for-sample-per-period-16.png)  
*Figure 10 - DFT iteration details for samplePerPeriod 16*    
    
Now our unit vector (dark dot) is making full circle in 16 iterations. Inside our window we would have 64 full 
rotations (1024/16). Lets look again at two full periods. Now longest blue vectors seems to be pointing in the 
same directions (up or as you wish 12 o'clock). We can say that they 'picked' something from our signal.       

>When frequency that we are examining **is present** in the signal it will produce more and more vectors that points 
>to the same direction. It's like with swing on the playground. Small force with proper frequency will increase the 
>amplitude of the swing.

### Final Frequency Domain chart and constellation diagram

After iterating thought all bins we can finally visualize frequency domain chart. In the Figure 11 we can see that 
our three sines are clearly visible as peaks. 

[![Frequency domain chart](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/11-frequency-domain-chart.min.png)](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/11-frequency-domain-chart.png)  
*Figure 11 - Frequency domain chart*

This chart in most cases is enough. As we saw before in examples it shows length of the 2d vectors computed at each 
bin (or as you wish absolute value of the complex number) but we need to remember that this is 'flattened' version of
full DFT output. Each bin also have a phase information that came from sum of all related vectors. In this case 
Constellation Diagram is something that we need.   

>Constellation diagram shows two things at once - power in decibels and phase but only for **selected frequency bin**.
>If point is far away from chart origin it means that signal is strong, if near origin it means that signal is weak. 
>Position of point on the circle tells about phase. At the top (12 o'clock) we have phase offset equal to 0 degrees 
>(or 360 degrees since it's the same). Values goes clockwise so point on the far right side will have 90 degrees 
>phase offset (3 o'clock), point on the far bottom will have 180 degrees phase offset (6 o'clock) and so on.

If our sine doesn't have any phase offset our point on constellation diagram will be located at 12 o'clock. Yellow 
marker shows 'current' frequency bin that is showed on Constellation Diagram (Figure 12).

[![Constellation Diagram - Sine A without phase offset](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/12-constellation-diagram-sine-a-without-phase-offset.min.png)](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/12-constellation-diagram-sine-a-without-phase-offset.png)   
*Figure 12 - Constellation Diagram - Sine A without phase offset*

If we would add phase offset to our sine it will rotate our point on the constellation diagram (Figure 13). 

[![Constellation Diagram - Sine A with phase offset](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/13-constellation-diagram-sine-a-with-phase-offset.min.png)](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/13-constellation-diagram-sine-a-with-phase-offset.png)   
*Figure 13 - Constellation Diagram - Sine A with phase offset*
    
As you can see power doesn't change much when we changed phase. Only point on the constellation diagram was rotated
because in this case majority of vectors pointed to little different direction.

### Make some noise!

In real world our input signal will not be that perfect. It will be for sure noisy because of echos, interferences
or white noise. Let's check how white noise will affect our frequency domain chart (Figure 14). To emulate it we can 
just add some random values to each sample before applying DFT:

```javascript
whiteNoiseAmplitude = 0.3;
// ...
sample += (-1 + 2 * Math.random()) * whiteNoiseAmplitude;   // this will add/substract random number up to 0.3  
```

[![Clean and noisy signal comparison](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/14-clean-and-noisy-signal-comparison.min.png)](https://audio-network.rypula.pl/page/data-transmission-over-sound-in-javascript-from-scratch/part-01/image/14-clean-and-noisy-signal-comparison.png)  
*Figure 14 - Clean and noisy signal comparison*     
     
As we can see our time domain data is now very noisy. When we look at frequency domain we still see peaks but 
difference between peaks and background noise decreased a lot. 

### JavaScript implementation

Below you can find JavaScript implementation of all that was described above.

```javascript
function computeDiscreteFourierTransform(
    timeDomain, frequencyBinSamplePerPeriodMax, frequencyBinSamplePerPeriodMin, frequencyBinSize
    ) {
    var frequencyDomain, step, i, samplePerPeriod, frequencyBin;

    frequencyDomain = [];
    step = (frequencyBinSamplePerPeriodMax - frequencyBinSamplePerPeriodMin) / frequencyBinSize;
    for (i = 0; i < frequencyBinSize; i++) {
        samplePerPeriod = frequencyBinSamplePerPeriodMax - i * step;
        frequencyBin = getFrequencyBin(timeDomain, samplePerPeriod);
        frequencyDomain.push(frequencyBin);
    }

    return frequencyDomain;
}

function findUnitAngle(x, y) {
    var length, quarter, angle;

    length = Math.sqrt(x * x + y * y);
    length = (length < 0.000001) ? 0.000001 : length;    // prevents from dividing by zero
    quarter = (x >= 0) ? (y >= 0 ? 0 : 1) : (y < 0 ? 2 : 3);
    switch (quarter) {
        case 0:
            angle = Math.asin(x / length);
            break;
        case 1:
            angle = Math.asin(-y / length) + 0.5 * Math.PI;
            break;
        case 2:
            angle = Math.asin(-x / length) + Math.PI;
            break;
        case 3:
            angle = Math.asin(y / length) + 1.5 * Math.PI;
            break;
    }

    return angle / (2 * Math.PI);   // return angle in range: <0, 1)
}

function getFrequencyBin(timeDomain, samplePerPeriod) {
    var windowSize, real, imm, i, sample, r, power, powerDecibel, phase;

    windowSize = timeDomain.length;            // timeDomain array length is our window size
    real = 0;
    imm = 0;
    for (i = 0; i < windowSize; i++) {
        sample = timeDomain[i];
        r = 2 * Math.PI * i / samplePerPeriod; // compute radians for 'unit vector' sine/cosine
        real += -Math.cos(r) * sample;         // 'sample' value alters 'unit vector' length, it could also change
        imm += Math.sin(r) * sample;           // direction of vector in case of negative 'sample' values
    }
    real /= windowSize;                        // normalize final vector
    imm /= windowSize;                         // normalize final vector

    power = Math.sqrt(real * real + imm * imm);                 // compute length of the vector
    powerDecibel = 10 * Math.log(power) / Math.LN10;            // convert into decibels
    powerDecibel = powerDecibel < -100 ? -100 : powerDecibel;   // limit weak values to -100 decibels
    
    phase = findUnitAngle(real, imm);          // get angle between vector and positive Y axis clockwise

    return {
        powerDecibel: powerDecibel,            
        phase: phase                
    };
}

function blackmanNuttall(n, N) {
    return 0.3635819
        - 0.4891775 * Math.cos(2 * Math.PI * n / (N - 1))
        + 0.1365995 * Math.cos(4 * Math.PI * n / (N - 1))
        - 0.0106411 * Math.cos(6 * Math.PI * n / (N - 1));
}

function generateSineWave(samplePerPeriod, amplitude, degreesPhaseOffset, sample) {
    var unitPhaseOffset = degreesPhaseOffset / 360;

    return amplitude * Math.sin(2 * Math.PI * (sample / samplePerPeriod - unitPhaseOffset));
}
```

Code above should be more of less clear. Those 5 functions are enough to compute Discrete Fourier Transform. Magic 
formula at `blackmanNuttall` method was taken from Wikipedia article about 
[Window Function](https://en.wikipedia.org/wiki/Window_function). 

Ok, let's add few sines together and try to compute DFT:

```javascript
var i, timeDomain, sample, sampleProcessed, windowSize, frequencyDomain, whiteNoiseAmplitude,
    frequencyBinSamplePerPeriodMax, frequencyBinSamplePerPeriodMin, frequencyBinSize;

timeDomain = [];
windowSize = 1024;
whiteNoiseAmplitude = 0;
// fill array with time domain samples
for (i = 0; i < windowSize; i++) {
    sample = 0;
    sample += generateSineWave(28, 0.3, 0, i); // sine A: samplePerPeriod 28, amplitude 0.3, degreesPhaseOffset 0
    sample += generateSineWave(20, 0.3, 0, i); // sine B: samplePerPeriod 20, amplitude 0.3, degreesPhaseOffset 0
    sample += generateSineWave(16, 0.3, 0, i); // sine C: samplePerPeriod 16, amplitude 0.3, degreesPhaseOffset 0
    sample += (-1 + 2 * Math.random()) * whiteNoiseAmplitude;    // add white noise
    sampleProcessed = sample * blackmanNuttall(i, windowSize);   // apply window function
    timeDomain.push(sampleProcessed);                            // push processed sample to array
}
frequencyBinSamplePerPeriodMax = 50;   // horizontal axis of frequency domain chart - samplePerPeriod on the left 
frequencyBinSamplePerPeriodMin = 10;   // horizontal axis of frequency domain chart - samplePerPeriod on the right
frequencyBinSize = 160;                // number of bins at frequency domain chart 
frequencyDomain = computeDiscreteFourierTransform(
    timeDomain, frequencyBinSamplePerPeriodMax, frequencyBinSamplePerPeriodMin, frequencyBinSize
);

console.log(timeDomain.length);      // --> 1024
console.log(frequencyDomain.length); // --> 160
```

In example above **windowing** step was skip - we directly created final signal inside a time domain window.
Normally we would copy samples from some input buffer.

Lets look what are the power values that we have near our three sines. We expect to see 3 power peaks near 
28, 20 and 16 samplePerPeriod. First we need to know how to convert samplePerPeriod into array index. Below
required formulas:

```
step = (frequencyBinSamplePerPeriodMax - frequencyBinSamplePerPeriodMin) / frequencyBinSize
index = (frequencyBinSamplePerPeriodMax - samplePerPeriod) / step
samplePerPeriod = frequencyBinSamplePerPeriodMax - step * index
```

```javascript
function logPowerDecibel(index) {
    var powerDecibelTwoDecimalPlaces = Math.round(frequencyDomain[index].powerDecibel * 100) / 100;

    console.log(powerDecibelTwoDecimalPlaces);
}

logPowerDecibel(87); // -12.81 | index: (50-28.25)/0.25 = 87 | samplePerPeriod: 50-0.25*87 = 28.25
logPowerDecibel(88); // -12.64 | index: (50-28.00)/0.25 = 88 | samplePerPeriod: 50-0.25*88 = 28.00 | SINE A
logPowerDecibel(89); // -12.82 | index: (50-27.75)/0.25 = 89 | samplePerPeriod: 50-0.25*89 = 27.75
// ...
logPowerDecibel(104); // -61.48 | index: (50-24.00)/0.25 = 104 | samplePerPeriod: 50-0.25*104 = 24.00
// ...
logPowerDecibel(119); // -13.32 | index: (50-20.25)/0.25 = 119 | samplePerPeriod: 50-0.25*119 = 20.25
logPowerDecibel(120); // -12.64 | index: (50-20.00)/0.25 = 120 | samplePerPeriod: 50-0.25*120 = 20.00 | SINE B
logPowerDecibel(121); // -13.35 | index: (50-19.75)/0.25 = 121 | samplePerPeriod: 50-0.25*121 = 19.75
// ...
logPowerDecibel(128); // -63.55 | index: (50-18.00)/0.25 = 128 | samplePerPeriod: 50-0.25*128 = 18.00
// ...
logPowerDecibel(135); // -14.30 | index: (50-16.25)/0.25 = 135 | samplePerPeriod: 50-0.25*135 = 16.25
logPowerDecibel(136); // -12.64 | index: (50-16.00)/0.25 = 136 | samplePerPeriod: 50-0.25*136 = 16.00 | SINE C
logPowerDecibel(137); // -14.41 | index: (50-15.75)/0.25 = 137 | samplePerPeriod: 50-0.25*137 = 15.75
```

As we can see strongest bins are exactly where they should be. In contrast area between sine waves power is very weak 
(around -60 decibels). Let's check second parameter - phase:
 
```javascript
function logPhase(index) {
    var phaseInDegrees = Math.round(frequencyDomain[index].phase * 360);
    
    phaseInDegrees = phaseInDegrees % 360; // normalize  
    console.log(phaseInDegrees);
}

logPhase(88);  // 0 | it's because SINE A was created like this: sample += generateSineWave(28, 0.3, 0, i);
logPhase(120); // 0 | it's because SINE B was created like this: sample += generateSineWave(20, 0.3, 0, i);
logPhase(136); // 0 | it's because SINE C was created like this: sample += generateSineWave(16, 0.3, 0, i);
```

All sines returned phase offset equal to zero. Let's check what we would get if we add some phase offset to our sines.

```javascript
// fill array with time domain samples
for (i = 0; i < windowSize; i++) {
    // ...
    sample += generateSineWave(28, 0.3, 90, i); // sine A: samplePerPeriod 28, degreesPhaseOffset 90
    sample += generateSineWave(20, 0.3, 180, i); // sine B: samplePerPeriod 20, degreesPhaseOffset 180
    sample += generateSineWave(16, 0.3, 270, i); // sine C: samplePerPeriod 16, degreesPhaseOffset 270
    // ...
}
// ...
logPhase(88);  // 90 | sine A phase offset is now 90 degrees
logPhase(120); // 180 | sine B phase offset is now 180 degrees
logPhase(136); // 270 | sine C phase offset is now 270 degrees
```

Magic works as expected. Phase was also restored properly. Complete simple DFT implementation you can find here:

- [Discrete Fourier Transform SIMPLE](https://audio-network.rypula.pl/example/00-040-discrete-fourier-transform-simple/discrete-fourier-transform-simple.html)
- [Discrete Fourier Transform SIMPLE - source code](https://github.com/robertrypula/AudioNetwork/blob/master/example/00-040-discrete-fourier-transform-simple)

### Summary

Algorithm described above is maybe not optimal but relatively simple comparing to for example FFT which uses some 
mathematical tricks that are beyond the scope of this article. We can extract major frequencies that builds the 
signal even there is a lot of random noise.

Now you may ask - can we really do something useful with such slow algorithm? The answer is yes we can. We can easily 
improve performance by reducing number of frequency bins. We can just assume that our data is carried by some 
fixed frequency and compute only related frequency bin. We don't need other bins since they are not carrying 
our data. In case of our example (160 bins on frequency domain chart) it will increase the speed 160 times.

What about JavaScript - how to get samples? We can access them via Web Audio API from microphone connected to your 
machine. Samples are coming in chunks (1024, 2048, ...) in fixed time intervals that depends on chunk size. Similar
thing happens when we need to play sound. We need to fill array that came in the event and it will be played by the 
speakers.  

Other question may come - why we need to write everything from scratch? There should be plenty of DSP libraries 
that are just ready to use. The answer is **for fun**! :) It's like with car, you can enter it and just drive but 
if you additionally know how it works it's even better. There is one alternative - 
[AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode) from Web Audio API.
It uses FFT under the hood so it's fast. But there is one disadvantage - it doesn't return phase of frequency bin. 
Phase of the wave can be used in data transmission that is more resistant to the noise. Method described in this 
article give us more flexibility, we are not depended to any other code and it's still simple enough to understand. 
We can avoid black box which is doing magic and we have no idea how.

If you are interested in this topic an you want to play with different DFT settings by yourself please visit full 
DFT example hosted on [AudioNetwork](https://audio-network.rypula.pl) project website.

- [Discrete Fourier Transform FULL](https://audio-network.rypula.pl/example/00-041-discrete-fourier-transform-full/discrete-fourier-transform-full.html)
- [Discrete Fourier Transform FULL - source code](https://github.com/robertrypula/AudioNetwork/tree/master/example/00-041-discrete-fourier-transform-full)

In second part of this article we will look closer into Web Audio API.
