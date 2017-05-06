// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl

var Complex;

Complex = function (real, imag) {
    this.$$real = real;
    this.$$imag = imag;
};

Complex.$$_EPSILON = 0.000001;
Complex.$$_UNIT_RADIUS = 1;

Complex.prototype.clone = function () {
    return new Complex(
        this.$$real,
        this.$$imag
    );
};

Complex.polar = function (angle, radius) {
    radius = typeof radius === 'undefined'
        ? Complex.$$_UNIT_RADIUS
        : radius;

    angle = 2 * Math.PI * angle;

    return new Complex(
        radius * Math.cos(angle),
        radius * Math.sin(angle)
    );
};

Complex.prototype.add = function (b) {
    this.$$real += b.$$real;
    this.$$imag += b.$$imag;
};

Complex.prototype.subtract = function (b) {
    this.$$real += b.$$real;
    this.$$imag += b.$$imag;
};

Complex.prototype.multiply = function (b) {
    var
        real = this.$$real * b.$$real - this.$$imag * b.$$imag,
        imag = this.$$real * b.$$imag + this.$$imag * b.$$real;

    this.$$real = real;
    this.$$imag = imag;
};

Complex.prototype.conjugate = function (b) {
    this.$$imag *= -1;
};

Complex.prototype.multiplyScalar = function (b) {
    this.$$real *= b;
    this.$$imag *= b;
};

Complex.prototype.divideScalar = function (b) {
    this.$$real /= b;
    this.$$imag /= b;
};

Complex.prototype.getRadius = function () {
    return Math.sqrt(
        this.$$real * this.$$real +
        this.$$imag * this.$$imag
    );
};

Complex.prototype.getAngle = function () {
    var length, quarter, angle, x, y;

    x = this.$$real;
    y = this.$$imag;
    length = Math.sqrt(x * x + y * y);
    length = (length < Complex.$$_EPSILON)  // prevents from dividing by zero
        ? Complex.$$_EPSILON
        : length;

    //         ^             Legend:
    //  II     *     I        '!' = 0 degrees
    //         |              '*' = 90 degrees
    //  ----@--+--!---->      '@' = 180 degrees
    //         |              '%' = 270 degrees
    //  III    %     IV

    quarter = (y >= 0)
        ? (x >= 0 ? 1 : 2)
        : (x <= 0 ? 3 : 4);

    switch (quarter) {
        case 1:
            angle = Math.asin(y / length);
            break;
        case 2:
            angle = Math.asin(-x / length) + 0.5 * Math.PI;
            break;
        case 3:
            angle = Math.asin(-y / length) + Math.PI;
            break;
        case 4:
            angle = Math.asin(x / length) + 1.5 * Math.PI;
            break;
    }

    return angle / (2 * Math.PI);   // returns angle in range: <0, 1)
};

Complex.prototype.normalize = function () {
    this.divideScalar(
        this.getRadius()
    );
};
