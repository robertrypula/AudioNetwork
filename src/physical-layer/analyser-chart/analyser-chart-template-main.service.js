var AnalyserChartTemplateMain = (function () {
  'use strict';

  _AnalyserChartTemplateMain.$inject = [];

  function _AnalyserChartTemplateMain() {
    var html =
      '<div' +
      '    class="analyser-container"' +
      '    style="' +
      '        overflow: hidden;' +
      '        width: {{ width }}px;' +
      '        height: {{ height }}px;' +
      '        position: relative;' +
      '    "' +
      '    >' +
      '    <canvas' +
      '        class="analyser-chart"' +
      '        style="' +
      '            width: {{ width }}px;' +
      '            height: {{ height }}px;' +
      '            position: absolute;' +
      '        "' +
      '        width="{{ width }}"' +
      '        height="{{ height }}"' +
      '        ></canvas>' +
      '    <div' +
      '        class="analyser-action"' +
      '        style="' +
      '            position: absolute;' +
      '        "' +
      '        >' +
      '        <a href="javascript:void(0)" class="analyser-action-fft256">FFT256</a>' +
      '        <a href="javascript:void(0)" class="analyser-action-fft512">FFT512</a>' +
      '        <a href="javascript:void(0)" class="analyser-action-fft1024">FFT1024</a>' +
      '        <a href="javascript:void(0)" class="analyser-action-fft2048">FFT2048</a>' +
      '        <a href="javascript:void(0)" class="analyser-action-fft4096">FFT4096</a>' +
      '        <a href="javascript:void(0)" class="analyser-action-fft8192">FFT8192</a>' +
      '        <a href="javascript:void(0)" class="analyser-action-fft16384">FFT16384</a>' +
      '        <a href="javascript:void(0)" class="analyser-action-freq-timedomain">Freq/TimeDomain</a>' +
      '        <a href="javascript:void(0)" class="analyser-action-freeze">Freeze</a>' +
      '    </div>' +
      '    <div ' +
      '        class="analyser-axis-x" ' +
      '        style="' +
      '            position: absolute;' +
      '            bottom: 0px;' +
      '            left: 0px;' +
      '            width: {{ width }}px;' +
      '        "' +
      '        ></div>' +
      '</div>'
    ;

    return {
      html: html
    };
  }

  return new _AnalyserChartTemplateMain();        // TODO change it to dependency injection

})();
