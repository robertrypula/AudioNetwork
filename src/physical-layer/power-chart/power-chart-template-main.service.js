var PowerChartTemplateMain = (function () {
  'use strict';

  _PowerChartTemplateMain.$inject = [];

  function _PowerChartTemplateMain() {
    var html =
      '<div' +
      '    class="power-chart-container"' +
      '    style="' +
      '        overflow: hidden;' +
      '        width: {{ width }}px;' +
      '        height: {{ height }}px;' +
      '        position: relative;' +
      '    "' +
      '    >' +
      '    <canvas ' +
      '        class="power-chart"' +
      '        style="' +
      '            width: {{ width }}px;' +
      '            height: {{ height }}px;' +
      '            position: absolute;' +
      '        "' +
      '        width="{{ width }}"' +
      '        height="{{ height }}"' +
      '        ></canvas>' +
      '</div>'
    ;

    return {
      html: html
    };
  }

  return new _PowerChartTemplateMain();        // TODO change it to dependency injection

})();
