## Roadmap
  - 1.1.0 Last update for old PSK code
  - 1.2.x Completely rewritten Physical Layer with FSK support. Old PSK code marked as deprecated
  - 1.3.x Data link layer with frames and checksums
  - 1.4.x Transport layer that supports simplified TCP protocol
  - 1.5.x Application layer with simple text exchange protocol
  - 1.x.x move to webpack
  - 2.0.0 Old PSK code removed from the project.
  - 2.x.x ?? OFDM
  - 2.x.x ?? Move to TypeScript

## v1.2.0 (2017-12-28)
  - Completely rewritten Physical Layer core based on Frequency-Shift Keying
  - special "sync" sequence for symbol synchronization based on correlation technique
  - many new examples
  - old FSK code marked as deprecated
  - volume control issue on mobile devices solved by detaching from microphone
  - Injector aliases again enabled by default

## v1.1.0 (2017-11-12) Last update for old PSK code
  + Dynamic dev files loading
  + Boot config added
  + Env variables added (isBrowser, isNode, isWebWorker)
  + NodeJs export added - you can now use AudioNetwork in NodeJs applications! 
  + ActiveAudioContext abstraction
  + CarrierGenerate and CarrierRecovery refactor
  + Constellation diagram: do not redraw constellation if queue wasn't changed
  + Constellation diagram: queue elements approach changed (only one item per constellation point now)
  + WindowFunction service with blackmanNuttall method
  + Visualizer abstract classes (Abstract2DVisualizer, AbstractVisualizer)
  + Visualizer code refactor
  + rename audio-network-begin to audio-network-boot
  + WebWorker basic functionality added

## v1.0.4 (2016-07-04)
  + new example where only CarrierRecovery/CarrierGenerate were used to send data using Amplitude Modulation (without PhysicalLayer module)
  + expand class names - this allows easier debug in dev tools (for example CTM is now ChannelTransmitManager)
  + introduce SimplePromise class (idea is to have code as less dependent to browser as possible in order to port it easily to other languages)
  + move all charts to dedicated namespace 'visualizer'
  + move CarrierRecovery and CarrierGenerate to 'common' namespace
  + move audio service to separate namespace 'audio' and change name of the service to ActiveAudioContext
  + move adapter classes to 'physical-layer-adapter'
  + move current audio service logic to factory and connect it to ActiveAudioContext
  + AudioContext class was renamed to SimpleAudioContext in order to avoid collision with real window.AudioContext
  + addToQueue is now taking object as a parameter instead array of objects
  + Jasmine unit test web runner added (currently still without tests but at least running environment was prepared)
  + rename example directories (000 for basic demos, 100 for physical layer demos, ...)
  + add htaccess redirection to renamed examples
  + create new chart 'SampleChart', create new example where CarrierGenerate will be demonstrated

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
