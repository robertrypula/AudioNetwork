## Roadmap
  - 1.x.x finish all PhysicalLayer stuff (Web Audio API, raw packets)
  - 2.x.x finish all DataLinkLayer stuff (frames with correction codes and SRC and DEST addresses)
  - 3.x.x finish all NetworkLayer stuff (similar to IP datagrams with ability to route data somewhere)
  - 4.x.x finish all TransportLayer stuff (similar to TPC segments to give ability to create reliable connection)
  - 5.x.x finalization of the project, some example applications like p2p file exchange, web server etc

## Backlog for future 1.x.x releases

TODO list:
  - move audio service to separate namespace 'audio'
  - create new chart 'SampleChart', create new example when CarrierGenerate will be demonstrated
  - rename example directories (000 for basic demos, 100 for physical layer demos, ...) and add htaccess redirection
  - start writing article
  - fix last templates issues in ultra-simple demo, rename to some nicer name
  - move common code of all canvas drawing to abstract class
  - create wrapper classes for audio nodes
  - create sine/cosine cache service + tests in jasmine

  - use setTimeout instead setInterval UPDATE: remove checking in a loop, just schedule function call for the future via setTimeout
  - wrap with dedicated class JS methods like requestAnimationFrame, setTimeout, setInterval and create dedicated namespace
  - refactor DOM helpers (move to service)
  - change adapter parameter order or move all adapter initialization
  - introduce handlers similar to existing setPacketReceiveHandler
  - ReceiveAdapter should register own rx handler inside Adapter class
  - move all adapter logic to dedicated namespace (???)
  - refactor manager code to pass whole array to/from channel instead single sample
    - receive-manager
    - receive-channel
    - receive-channel-carrier           adds phase correction, handles notify intervals
    - receive-carrier-recovery-worker   just handles block of samples and computes carrier details for given sample numbers
  - CHECK THIS: filter constellation points to show only strongest symbol samples used in packet
  - do not redraw constellation if queue wasn't changed
  - ability to add hooks at sample generation and receive (inject some changes to signal)
  - fix carrier.html example (use dedicated constellation class)

  - Receive Adapter: [8.5h or 16.0h remaining]
    + [~1.5h] add events for frequency update and phase update to notify hosting code
    + [~2.0h] refactor 'collecting arrays' to dedicated collectors
    - [~2.0h] refactor data/packet collection to dedicates collectors classes
      - change SYMBOL state name to PILOT_SIGNAL
      - change ERROR state name to SYNC_TO_LONG
      - phaseOffsetCollector -> frequencyErrorCollector
      - introduce some phaseErrorCollector ?
    - [~3.0h] test and fix multiple OFDM support, first ofdm index would be pilot signal
    - OPTIONAL [~1.5h] adaptive threshold based on arriving packets (add history to Signal/Guard Collectors based on Queue class)
    - OPTIONAL [~4.0h] add auto tuning feature with ability to align phase offset (improve phase-offset-collector class)
    - OPTIONAL [~1.0h] Signal Strength like in cell phones
    - OPTIONAL [~1.0h] add new state: INTERPACKET_GAP

  - Power chart: [~10.5h remaining]
    - [~4.0h] integrate with rest of the code (pass configuration to receive adapter constructor), config: elementId, colors, ...?
    - [~3.0h] ability to show other OFDMs than pilot
    - [~1.0h] increase bar width
    - [~1.5h] mark states ranges
    - [~1.0h] show important power level (threshold, min/max, etc)

  - How it works section (this will be used in the article 'Data transmission over sound waves in JavaScript / Digital Signal Processing in JavaScript from scratch')
    - introduction
      - sound representation in computer memory
      - all from scratch to really understand internals of DSP
      - how to pick proper frequency?
    - how to record/play raw samples using Web Audio API
      - context initialization, abstraction service from AudioNetwork library (all filters disabled)
      - gain node
      - show audio processing event
      - connect all together
    - discrete fourier transform in a nutshell
      - much simpler than FFT but ultra slow
      - explain frequency domain and time domain, frequency bin [IMAGE]
      - tell about samplesPerPeriod -> a way to skip sampling frequency
      - add couple of sine waves together [CHART separate and sum]
      - describe algorithm, running circle  [CHART]
      - show that we collect vectors per each sample [CHART]
      - when input signal contains that frequency it will produce lots of vectors that points to the same direction
      - sum of vectors is power of sin wave frequency that we are looking at, direction is phase of that sine wave
    - carrier generate and receive
      - describe simple classes from AudioNetwork's lib
    - simple transmitter and receiver app
      - show symbol details, zero is only pilot, one is pilot and symbol, guard internal between adjacent bits
      - OFDM to avoid interference between carriers [just show the rule]
      - 2 carriers (1 pilot, 1 symbol)
      - list all files that were used
    - summary
      - put a link to AudioNetwork lib (it uses little different packet structure based on carrier phase - PSK modulation)

## v1.0.4 (2016-0?-??)
  + new example where only CarrierRecovery/CarrierGenerate were used to send data using Amplitude Modulation (without PhysicalLayer module)
  + expand class names - this allows easier debug in dev tools (for example CTM is now ChannelTransmitManager)
  + introduce SimplePromise class (idea is to have code as less dependent to browser as possible in order to port it easily to other languages)
  + move all charts to dedicated namespace 'visualizer'
  + move CarrierRecovery and CarrierGenerate to 'common' namespace

## v1.0.3 (2016-05-30)
  + fix transition from FIRST_SYNC_INIT -> IDLE, currently there are some SYMBOL/GUARD states which are not right at this point
  + default settings update (symbol duration vs guard interval, sync duration reduced from 3 sec to 2 sec, notification per seconds increased)
  + gulp 'serve' task for serving the app locally
  + add YouTube movie with demo
  + move common css away of example
  + readme moved to index.html, styles and pages structure refactored
  + simple demo added
  + updates at README.md
  + added CHANGELOG.md
  + licence moved to MIT
  + SEO updates to whole page

## v1.0.2 (2016-05-16)
  + huge readme update, npm keywords update

## v1.0.1 (2016-05-10)
  + Carrier example bug fix. Versioning information added for main example

## v1.0.0 (2016-05-10)
  + fix typo: physial-layer into physical-layer
  + keep view type after reinitialization
  + remove audio-network prefix from main classes names
  + change name: dftTimeSpan -> dftWindowTimeSpan
  + move general configuration to some common service
  + refactor NO_SIGNAL state
  + change input TX to LOOPBACK
  + move templates code to dedicated files
  + introduce Dependency Injection
  + prepare release version + some code minification
  + measure CPU load by measuring times before and after execution

## Finished stuff before release was even planned
  + BUG FIXED for some dftWindowTime after converting it to numbers of samples CarrierRecovery queue size is fractional
  + real/imm delete
  + compute at getCarrierDetail
  + index passed into handler
  + decibel power/amplitude check
  + load wav file
  + add getOutput* methods
  + add outputTxEnable/outputTxDisable methods
  + check inverse phase shift issue
  + add script node sample to config
  + rewrite main API
    + move code to factory
    + cleanup inside main service
    + internal notifyHandler for constellation update, external for user purposes
    + add rx method outside the factory
    + destroy constellation
    + ability to change frequency
    + fix recorded file loading logic
    + fix history point colors
    + add ability to choose destination source
  + move script processor node to receive manager
  + move sin/cos to internal Math service (to give ability to quickly add lookup tables)
  + fix layout
  + add phase offset input to align symbol '0'
  + add html generation as js + ofdm support
  + change send logic (add amplitude, symbolCount, symbol to each OFDM block)
  + change send sequence logic (use format: '5.5.2.0 1.2.4.1')
  + add DFT time span to config
  + internal loop for notifications
    + add script node block time (from audiocontext)
    + add sample offset time from script node block time
  + add symbol config to rx
  + prefill amplitude value basing on ofdm size at channel tx
  + add symbol detection to rx
  + move example code related to html generation to separate file with comment
  + add buttons for symbols (TX)
  + add squares with symbol number (RX)
  + update sequence textarea after pskSize change
  + rename delay-loop-handler
  + after psk change only related tx/rx should be updated
  + add rx/tx to channel headers
  + change 'frame' to 'packet'
  + add 'Send sync signal' to TX
  + ability to hide some of the widgets: 'Easy' and 'Advanced' view
  + fix styles
    + add source button active class
    + improve responsive design
  + add margin to sections
  + use first symbol of each packet to fine tune phase offset (add checkbox for that feature)
  + add inter-packet gap duration
  + add quick configs like: 'baud-5, ofdm-1, psk-2' or 'baud-20, ofdm-16, psk-2' or ...
    + add checkbox for tx/rx config
    + add callback to destroy
    + add bit speed information at UI
  + refactor all transmit and receive logic (move it to physical layer internals)
    + [TX] remove symbol generation from template-util
    + [TX] symbol shouldn't have any guard interval or/and interpacket gap
    + [RX] add setTimes* methods (maybe it's worth to add some error margin - times inside are for internal adapter use)
    + [RX] add setSyncPreamble(true/false) method
    + [RX] add packet receive handler packetReceived(data)
    + [RX] add multiple channels support (introduce new class in the middle)
    + set threshold to very low value (-100 dB) to force idle state for a while
    + compute average noise level power at idle state
    + after noise level is set raise threshold xx dB above noise level
    + so far do not collect symbol and packet data (wait for sync)
    + run sync on the TX side
    + sync state will be detected - grab average max signal strength
    + subtract 10 decibels from max signal and enable symbol/packet collecting
    + [RX] add method to reset receiver state machine (to follow steps above again)
    + [RX] double check state times at receive adapter
      + move sync time to main adapter class
      + check symbol, guard times
      + average sample sizes should be config dependent (mostly for samplesPerSecond setting)
    + [RX] grab/clean packet data and notify packet handler
