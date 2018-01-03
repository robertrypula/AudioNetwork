// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

'use strict';

describe('Rewrite.Dsp.Fft', function () {
    var Fft = AudioNetwork.Rewrite.Dsp.Fft;
    var Complex = AudioNetwork.Rewrite.Dsp.Complex;

    it('should work', function () {
        var signal = Complex.fromReal([0, 1, 0, -1]);
        var fft = new Fft();

        console.log(signal);
        var output = Fft.compute(signal);

        console.log(output);

        //expect(fft).toBe(false);
    })

});
