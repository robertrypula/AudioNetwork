## Discrete Fourier Transform in a nutshell

Without Discrete Fourier Transform none of the modern digital communication techniques like LTE, WiFi, DVB could
not exist. What it actually does? It changes signal represented in time domain into frequency domain. In other
words it is decomposing signal that varies over time into the frequencies that make it. That allows us to
tune/pick only specific range of frequencies from full spectrum.
Output of Discrete Fourier Transform is often showed on music player window or on radio LCD. Apart from nice looking
bouncing bars we can also read from that output how loud each frequency range is. We can for example read without even
listening to the song how fast is the bass beat.

    <IMAGE: 1 seconds of song and few ranges that overlaps>

### DFT in fast and slow way

Currently the fastest algorithm for doing that is FFT - Fast Fourier Transform. If you are chatting on your smartphone,
using WiFi or watching TV from Terrestrial DVB transmitter FFT algorithm is running all the time. It's very fast but
unfortunately quite hard to understand. Goal behind this article is to create relatively simple signal processing in
JavaScript from scratch. That's why we will focus on much simpler algorithm that in general will give same result.
There is only one disadvantage - this method is ultra slow. In JavaScript it's possible to compute only couple of
frequency bins (vertical 'bars' on frequency domain chart) in the real time. In comparison FFT will give us thousands
of them.

    <IMAGE: speed comparison table?>

### Basic DFT algorithm

Before we start lets change the way we express frequency of a sine wave. Instead of using frequency value we can
use samplePerPeriod value. This will allow us to drop frequency in our examples because it's always related to
additional parameter - sampling frequency. At the end it's all about samples and it doesn't matter how fast is the
sampling frequency.

    <IMAGE: show few sines with different sampling>

Let say we have signal that is made of 3 sine waves. Sine A has samplePerPeriod equal 5, Sine B has samplePerPeriod
equal 8, Sine C has samplePerPeriod equal 10.

    <IMAGE: 3 sines alone and summed>

By looking at output signal it's really hard to say what are the frequencies that made that signal. It's even hard
to say how many sines are summed together. So how we can extract those frequencies? First step is to collect proper
amount of samples that we will use for later computations. This step is called windowing. For simplicity and without
entering into details let say that for best results we need to create window that takes integer number of periods
of each sines. In other words window width should be integer multiply of final signal period (our summed 3 sines).
In case of our three sines (5, 8, 10) smallest common multiple is 40.

    <IMAGE: show periods and when sum starts from the beginning>

Let say we picked 2 periods of final signal. It means that we have 80 samples in our window. Those samples represents
our signal in time domain. In order to create frequency domain representation we need to create second chart. Each
column on the chart is called frequency bin and tells how much [??of each frequency??]

?? To avoid fractional samplePerPeriod's let use the same size for second chart.

0 periodPerWindow                 1 periodPerWindow               10 periodPerWindow              40 periodPerWindow
80/0prw = +INF samplePerPeriod    80/1prw = 80 samplePerPeriod    80/10prw = 8 samplePerPeriod    80/40prw = 2 samplePerPeriod
80/+INFspp = 0 periodPerWindow    80/80spp = 1 periodPerWindow    80/8spp = 10 periodPerWindow    80/2ssp = 40 periodPerWindow



[...]



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