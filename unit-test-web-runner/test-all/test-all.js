function onLoad() {
    setTimeout(moveJasmineOutput, 2000);
}

function moveJasmineOutput() {
    var
        unitTestOutputElement = document.getElementById('unit-test-output'),
        jasmineElement = document.getElementsByClassName('jasmine_html-reporter')[0];

    unitTestOutputElement.innerHTML = '';
    unitTestOutputElement.appendChild(jasmineElement);
    disableJasmineResultHref();
}

function disableJasmineResultHref() {
    var
        allJasmineResultLink = document.querySelectorAll('.jasmine-results a'),
        i;

    for (i = 0; i < allJasmineResultLink.length; i++) {
        allJasmineResultLink[i].href = 'javascript:void(0)';
    }
}
