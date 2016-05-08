var ConstellationDiagramTemplateMain = (function () {
  'use strict';

  _ConstellationDiagramTemplateMain.$inject = [];

  function _ConstellationDiagramTemplateMain() {
    var html =
      '<div' +
      '    class="constellation-diagram-container"' +
      '    style="' +
      '        overflow: hidden;' +
      '        width: {{ width }}px;' +
      '        height: {{ height }}px;' +
      '        position: relative;' +
      '    "' +
      '    >' +
      '    <canvas ' +
      '        class="constellation-diagram"' +
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

  return new _ConstellationDiagramTemplateMain();        // TODO change it to dependency injection

})();
