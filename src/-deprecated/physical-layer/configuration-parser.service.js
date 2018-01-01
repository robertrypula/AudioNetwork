// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.ConfigurationParser', _ConfigurationParser);

    _ConfigurationParser.$inject = [
        'Common.MathUtil',
        'Common.Util',
        'PhysicalLayer.DefaultConfig'
    ];

    function _ConfigurationParser(
        MathUtil,
        Util,
        DefaultConfig
    ) {

        function parseChannel(configuration, txRx) {
            var i, txChannel, result, channelDataExists, channelListSize;

            result = [];
            txChannel = Util.accessor(configuration, txRx + '.channel');
            channelDataExists = txChannel ? true : false;
            txChannel = txChannel ? txChannel : [];
            channelListSize = txChannel.length;

            for (i = 0; i < (channelDataExists ? channelListSize : 2); i++) {
                result.push({
                    baseFrequency: (
                        Util.accessor(txChannel[i], 'baseFrequency') ||
                        (i % 2 === 0 ? DefaultConfig.CHANNEL_1_FREQUENCY : DefaultConfig.CHANNEL_2_FREQUENCY)
                    ),
                    ofdmSize: Util.accessor(txChannel[i], 'ofdmSize') || DefaultConfig.OFDM_SIZE,
                    ofdmFrequencySpacing: (
                        Util.accessor(txChannel[i], 'ofdmFrequencySpacing') || DefaultConfig.OFDM_FREQUENCY_SPACING
                    )
                });
            }

            return result;
        }

        function parse(configuration) {
            var
                c = configuration,
                a = Util.accessor,
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
                    input: a(c, 'rx.input') || DefaultConfig.RX_INPUT,
                    notificationPerSecond: a(c, 'rx.notificationPerSecond') || DefaultConfig.RX_NOTIFICATION_PER_SECOND,
                    dftWindowTime: a(c, 'rx.dftWindowTime') || DefaultConfig.RX_DFT_WINDOW_TIME,
                    spectrum: {
                        elementId: a(c, 'rx.spectrum.elementId') || null,
                        color: {
                            axis: a(c, 'rx.spectrum.color.axis') || '#444',
                            data: a(c, 'rx.spectrum.color.data') || '#888888'
                        },
                        fftSize: a(c, 'rx.spectrum.fftSize') || DefaultConfig.RX_SPECTRUM_FFT_SIZE,
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
                        historyPointSize: MathUtil.round(a(c, 'rx.constellationDiagram.historyPointSize') || DefaultConfig.RX_HISTORY_POINT_SIZE),
                        width: a(c, 'rx.constellationDiagram.width') || 200,
                        height: a(c, 'rx.constellationDiagram.height') || 200
                    }
                }
            };

            return finalConfiguration;
        }

        return {
            parse: parse
        };
    }

})();
