// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var IoTraffic;

IoTraffic = function (domElement) {
    this.$$id = 'io-traffic-' + Math.round(Math.random() * 1000000);
    this.$$domElement = domElement;
    this.$$domIoTrafficElement = undefined;
    this.$$typeOfLastItem = undefined;
    this.$$initializeHtml();
};

IoTraffic.TX = 'tx';
IoTraffic.RX = 'rx';
IoTraffic.NONE = '';
IoTraffic.PROGRESS_BAR_A = 'PROGRESS_BAR_A';
IoTraffic.PROGRESS_BAR_B = 'PROGRESS_BAR_B';

IoTraffic.prototype.addTxItem = function (id, itemHtml) {
    switch (this.$$typeOfLastItem) {
        case IoTraffic.NONE:
        case IoTraffic.RX:
            this.$$insertToNewSection(IoTraffic.TX, id, itemHtml);
            break;
        case IoTraffic.TX:
            this.$$insertToExistingSection(IoTraffic.TX, id, itemHtml);
            break;
    }
};

IoTraffic.prototype.addRxItem = function (id, itemHtml) {
    switch (this.$$typeOfLastItem) {
        case IoTraffic.NONE:
        case IoTraffic.TX:
            this.$$insertToNewSection(IoTraffic.RX, id, itemHtml);
            break;
        case IoTraffic.RX:
            this.$$insertToExistingSection(IoTraffic.RX, id, itemHtml);
            break;
    }
};

IoTraffic.prototype.addClass = function (id, cssClass) {
    var existingItem = this.$$getExistingItem(id);

    if (existingItem) {
        existingItem.classList.add(cssClass);
    }
};

IoTraffic.prototype.removeClass = function (id, cssClass) {
    var existingItem = this.$$getExistingItem(id);

    if (existingItem) {
        existingItem.classList.remove(cssClass);
    }
};

IoTraffic.prototype.updateProgressBar = function (id, unitProgress, progressBar) {
    var
        progressBarSelector = progressBar === IoTraffic.PROGRESS_BAR_B ? 'last-child' : 'first-child',
        selector = '#' + this.$$id + ' #' + id + ' > div:first-child > div:' + progressBarSelector,
        domProgressBar = document.querySelector(selector);

    if (domProgressBar) {
        unitProgress = unitProgress < 0 ? 0 : unitProgress;
        unitProgress = unitProgress > 1 ? 1 : unitProgress;
        domProgressBar.style.width = (unitProgress * 100).toFixed(3) + '%';
    }
};

IoTraffic.prototype.updateHtml = function (id, itemHtml) {
    var
        selector = '#' + this.$$id + ' #' + id + ' > div:last-child',
        domContent = document.querySelector(selector),
        isScrollAtBottom;

    if (domContent) {
        isScrollAtBottom = IoTraffic.isScrollAtBottom(this.$$domIoTrafficElement);

        domContent.innerHTML = itemHtml;

        if (isScrollAtBottom) {
            IoTraffic.scrollToBottom(this.$$domIoTrafficElement);
        }
    }
};

IoTraffic.prototype.alreadyExists = function (id) {
    var existingItem = this.$$getExistingItem(id);

    return !!existingItem;
};

IoTraffic.prototype.forceNewRow = function () {
    this.$$typeOfLastItem = IoTraffic.NONE;
};

IoTraffic.prototype.$$initializeHtml = function () {
    var html;

    html = '' +
        '<div class="io-traffic" id="' + this.$$id + '">' +
        '</div>';
    this.$$domElement.innerHTML = html;
    this.$$domIoTrafficElement = document.getElementById(this.$$id);
    this.$$typeOfLastItem = IoTraffic.NONE;
};

IoTraffic.prototype.$$getExistingItem = function (id) {
    var
        selector = '#' + this.$$id + ' #' + id,
        item = document.querySelector(selector);

    return item;
};

IoTraffic.prototype.$$insertToNewSection = function (type, id, itemHtml) {
    var
        itemParentSelectorEnd = type === IoTraffic.RX ? '' : ' > div',
        section = this.$$getSection(type),
        item = this.$$getItem(type, id, itemHtml),
        isScrollAtBottom = IoTraffic.isScrollAtBottom(this.$$domIoTrafficElement),
        itemParent;

    this.$$domIoTrafficElement.appendChild(section);
    itemParent = document.querySelector('#' + this.$$id + ' > div:last-child > div' + itemParentSelectorEnd);
    itemParent.appendChild(item);

    if (isScrollAtBottom) {
        IoTraffic.scrollToBottom(this.$$domIoTrafficElement);
    }
    this.$$typeOfLastItem = type;
};

IoTraffic.prototype.$$insertToExistingSection = function (type, id, itemHtml) {
    var
        itemParentSelectorEnd = type === IoTraffic.RX ? '' : ' > div',
        itemParent = document.querySelector('#' + this.$$id + ' > div:last-child > div' + itemParentSelectorEnd),
        isScrollAtBottom = IoTraffic.isScrollAtBottom(this.$$domIoTrafficElement),
        item = this.$$getItem(type, id, itemHtml);

    itemParent.appendChild(item);

    if (isScrollAtBottom) {
        IoTraffic.scrollToBottom(this.$$domIoTrafficElement);
    }
    this.$$typeOfLastItem = type;
};

IoTraffic.prototype.$$getSection = function (type) {
    var sectionOuter, sectionInner1, sectionInner2;

    sectionOuter = document.createElement('div');
    sectionOuter.className = 'clearfix';

    sectionInner1 = document.createElement('div');
    sectionInner1.className = type + '-item-container clearfix';

    sectionOuter.appendChild(sectionInner1);

    if (type === IoTraffic.TX) {
        sectionInner2 = document.createElement('div');
        sectionInner2.className = type + '-item-pull-right clearfix';
        sectionInner1.appendChild(sectionInner2);
    }

    return sectionOuter;
};

IoTraffic.prototype.$$getItem = function (type, id, itemHtml) {
    var item, itemContent, itemProgress, itemProgressBarA, itemProgressBarB;

    item = document.createElement('div');
    item.className = type + '-item';
    item.setAttribute('id', id);

    itemProgress = document.createElement('div');
    itemProgress.className = type + '-item-progress';

    itemProgressBarA = document.createElement('div');
    itemProgressBarA.className = type + '-item-progress-bar-a';
    itemProgressBarB = document.createElement('div');
    itemProgressBarB.className = type + '-item-progress-bar-b';

    itemProgress.appendChild(itemProgressBarA);
    itemProgress.appendChild(itemProgressBarB);

    itemContent = document.createElement('div');
    itemContent.className = type + '-item-content';
    itemContent.innerHTML = itemHtml === ' ' ? '&nbsp' : itemHtml;

    item.appendChild(itemProgress);
    item.appendChild(itemContent);

    return item;
};

IoTraffic.isScrollAtBottom = function (domElement) {
    var
        scrollTop = Math.abs(domElement.scrollTop),
        heightDiff = Math.abs(domElement.scrollHeight - domElement.offsetHeight);

    return Math.abs(scrollTop - heightDiff) < 5;
};

IoTraffic.scrollToBottom = function (domElement) {
    domElement.scrollTop = domElement.scrollHeight;
};
