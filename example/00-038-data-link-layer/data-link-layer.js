var dataLinkLayer;

function init() {
    dataLinkLayer = new DataLinkLayer();
}

function compute16bit(data) {
    var
        sum1 = 0,
        sum2 = 0,
        i;

    for (i = 0; i < data.length; i++) {
        sum1 = (sum1 + data[i]) % 255;
        sum2 = (sum2 + sum1) % 255;
    }

    return [
        sum2,
        sum1
    ];
}

function compute8bit(data) {
    var
        sum1 = 0,
        sum2 = 0,
        i,
        value;

    console.log(data.length);

    for (i = 0; i < 2 * data.length; i++) {
        value = i % 2 === 0
            ? (data[i >>> 1] >>> 4) & 0xF
            : data[i >>> 1] & 0xF;

        console.log(i, value.toString(16));

        sum1 = (sum1 + value) % 15;
        sum2 = (sum2 + sum1) % 15;
    }

    return [
        sum2,
        sum1
    ];
}

