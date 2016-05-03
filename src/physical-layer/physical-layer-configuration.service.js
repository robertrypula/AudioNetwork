var PhysicalLayerConfiguration = (function () {
    'use strict';

    _PhysicalLayerConfiguration.$inject = [];

    function _PhysicalLayerConfiguration() {
        var INPUT = {
            MICROPHONE: 'MICROPHONE',                   // TODO move to some common config
            TX: 'TX',                                   // TODO move to some common config
            RECORDED_AUDIO: 'RECORDED_AUDIO'            // TODO move to some common config
        };

        function parseChannel(configuration, txRx) {
            var i, txChannel, result, channelDataExists, channelListSize;

            result = [];
            txChannel = AudioUtil.accessor(configuration, txRx + '.channel');
            channelDataExists = txChannel ? true : false;
            txChannel = txChannel ? txChannel : [];
            channelListSize = txChannel.length;

            for (i = 0; i < (channelDataExists ? channelListSize : 2); i++) {
                result.push({
                    baseFrequency: (
                        AudioUtil.accessor(txChannel[i], 'baseFrequency') ||
                        (i % 2 === 0 ? 1070 : 2025)                            // TODO move to some common config (frequencies)
                    ),
                    ofdmSize: AudioUtil.accessor(txChannel[i], 'ofdmSize') || 1,
                    ofdmFrequencySpacing: AudioUtil.accessor(txChannel[i], 'ofdmFrequencySpacing') || 100     // TODO move to some common config (default spacing basing on default symbol time)
                });
            }

            return result;
        }

        function parse(configuration) {
            var
                c = configuration,
                a = AudioUtil.accessor,
                finalConfiguration
            ;

            finalConfiguration = {
                tx: {
                    bufferSize: c && c.tx && (typeof c.tx.bufferSize !== 'undefined') ? c.tx.bufferSize : 0,
                    channel: parseChannel(c, 'tx')
                },
                rx: {
                    bufferSize: c && c.rx && (typeof c.rx.bufferSize !== 'undefined') ? c.rx.bufferSize : 0,
                    channel: parseChannel(c, 'rx'),
                    input: a(c, 'rx.input') || INPUT.MICROPHONE,
                    notificationPerSecond: a(c, 'rx.notificationPerSecond') || 20,
                    dftWindowTime: a(c, 'rx.dftWindowTime') || 0.1,
                    spectrum: {
                        elementId: a(c, 'rx.spectrum.elementId') || null,
                        color: {
                            axis: a(c, 'rx.spectrum.color.axis') || '#444',
                            data: a(c, 'rx.spectrum.color.data') || '#888888'
                        },
                        fftSize: a(c, 'rx.spectrum.fftSize') || 2048,
                        height: a(c, 'rx.spectrum.height') || 200
                    },
                    constellationDiagram: {
                        elementId: (
                            a(c, 'rx.constellationDiagram.elementId') || null
                        ),
                        color: {
                            historyPoint: {
                                red: {
                                    newest: a(c, 'rx.constellationDiagram.color.historyPoint.red.newest') || 0,
                                    tailNewest: a(c, 'rx.constellationDiagram.color.historyPoint.red.tailNewest') || 100,
                                    tailOldest: a(c, 'rx.constellationDiagram.color.historyPoint.red.tailOldest') || 180
                                },
                                green: {
                                    newest: a(c, 'rx.constellationDiagram.color.historyPoint.green.newest') || 0,
                                    tailNewest: a(c, 'rx.constellationDiagram.color.historyPoint.green.tailNewest') || 100,
                                    tailOldest: a(c, 'rx.constellationDiagram.color.historyPoint.green.tailOldest') || 200
                                },
                                blue: {
                                    newest: a(c, 'rx.constellationDiagram.color.historyPoint.blue.newest') || 0,
                                    tailNewest: a(c, 'rx.constellationDiagram.color.historyPoint.blue.tailNewest') || 100,
                                    tailOldest: a(c, 'rx.constellationDiagram.color.historyPoint.blue.tailOldest') || 150
                                }
                            },
                            axis: a(c, 'rx.constellationDiagram.color.axis') || 'green'
                        },
                        historyPointSize: a(c, 'rx.constellationDiagram.historyPointSize') || 20,
                        width: a(c, 'rx.constellationDiagram.width') || 200,
                        height: a(c, 'rx.constellationDiagram.height') || 200
                    }
                }
            };

            return finalConfiguration;
        }

        return {
            INPUT: INPUT,
            parse: parse
        };
    }

    return new _PhysicalLayerConfiguration();        // TODO change it to dependency injection

})();
