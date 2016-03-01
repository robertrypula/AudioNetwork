var AudioNetworkPhysicalLayerConfiguration = (function () {
    'use strict';

    _AudioNetworkPhysicalLayerConfiguration.$inject = [];

    function _AudioNetworkPhysicalLayerConfiguration() {
        var INPUT = {
            MICROPHONE: 'MICROPHONE',
            RX_LOOPBACK: 'RX_LOOPBACK',
            RECORDED_FILE: 'RECORDED_FILE'
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
                        (i % 2 === 0 ? 1070 : 2025)
                    ),
                    ofdmSize: AudioUtil.accessor(txChannel[i], 'ofdmSize') || 1,
                    ofdmFrequencySpacing: AudioUtil.accessor(txChannel[i], 'ofdmFrequencySpacing') || 100
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
                    channel: parseChannel(c, 'tx')
                },
                rx: {
                    channel: parseChannel(c, 'rx'),
                    input: a(c, 'rx.input') || INPUT.MICROPHONE,
                    notificationPerSecond: a(c, 'rx.notificationPerSecond') || 20,
                    dftTimeSpan: a(c, 'rx.dftTimeSpan') || 0.1,
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
                                    start: a(c, 'rx.constellationDiagram.color.historyPoint.red.start') || 128,
                                    end: a(c, 'rx.constellationDiagram.color.historyPoint.red.end') || 0
                                },
                                green: {
                                    start: a(c, 'rx.constellationDiagram.color.historyPoint.green.start') || 128,
                                    end: a(c, 'rx.constellationDiagram.color.historyPoint.green.end') || 0
                                },
                                blue: {
                                    start: a(c, 'rx.constellationDiagram.color.historyPoint.blue.start') || 0,
                                    end: a(c, 'rx.constellationDiagram.color.historyPoint.blue.end') || 0
                                }
                            },
                            axis: a(c, 'rx.constellationDiagram.color.axis') || 'green'
                        },
                        historyPointSize: a(c, 'rx.constellationDiagram.historyPointSize') || 50,
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

    return new _AudioNetworkPhysicalLayerConfiguration();        // TODO change it to dependency injection

})();
