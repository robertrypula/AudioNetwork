// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

function getValue(selector, parseAs) {
    var element, resultRaw, result;

    element = document.querySelectorAll(selector);
    switch (element.length) {
        case 1:
            resultRaw = element[0].value;
            break;
        case 0:
            return undefined;
            break;
        default:
            throw 'Selector found more than one element';
    }

    switch (parseAs) {
        case 'int':
            result = parseInt(resultRaw);
            break;
        case 'float':
            result = parseFloat(resultRaw);
            break;
        default:
            result = resultRaw;
    }

    return result;
}

function setValue(selector, value) {
    var element, i;

    element = document.querySelectorAll(selector);
    for (i = 0; i < element.length; i++) {
        if (element[i].value) {
            element[i].value = value;
        }
    }
}

function html(selector, html) {
    var element, i;

    element = document.querySelectorAll(selector);
    for (i = 0; i < element.length; i++) {
        element[i].innerHTML = html;
    }
}

function addClass(selector, className) {
    var element, i;

    element = document.querySelectorAll(selector);
    for (i = 0; i < element.length; i++) {
        element[i].classList.add(className);
    }
}

function removeClass(selector, className) {
    var element, i;

    element = document.querySelectorAll(selector);
    for (i = 0; i < element.length; i++) {
        element[i].classList.remove(className);
    }
}

function hasClass(selector, className) {
    var element, i, result;

    result = false;
    element = document.querySelectorAll(selector);
    for (i = 0; i < element.length; i++) {
        if (element[i].classList.contains(className)) {
            result = true;
            break;
        }
    }

    return result;
}
