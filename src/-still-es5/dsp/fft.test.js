// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

describe('Rewrite.Dsp.Fft', function () {
    var
        Fft = AudioNetwork.Rewrite.Dsp.Fft,
        Complex = AudioNetwork.Rewrite.Dsp.Complex;

    it('should work', function () {
        var
            input = [
                new Complex(0, 0),
                new Complex(1, 0),
                new Complex(0, 0),
                new Complex(-1, 0)
            ],
            inputInverse = [
                new Complex(0, 0),
                new Complex(0, -2),
                new Complex(0, 0),
                new Complex(0, 2)
            ],
            fft = new Fft();

        console.log(input);
        console.log(Fft.forward(input));
        console.log(Fft.inverse(Fft.forward(input)));
        console.log(Fft.inverse(inputInverse));

        /*
        signal.fromReal([1, 2, 3]);
        signal.mix(Signal.complexSpiral(cyclesInLength, length));
        signal.lowPass(0.5, );
        */

        expect(false).toBe(false);
    })

});
