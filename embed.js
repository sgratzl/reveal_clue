/**
 * Created by Samuel Gratzl on 25.02.2016.
 */
function clue_random_id(length) {
    if (length === void 0) { length = 8; }
    var id = '';
    while (id.length < length) {
        id += Math.random().toString(36).slice(-8);
    }
    return id.substr(0, length);
}
var EmbeddedCLUE = (function () {
    function EmbeddedCLUE(parent, url, readyCallback) {
        this.readyCallback = readyCallback;
        this.l = this.onMessage.bind(this);
        this.callbacks = {};
        this.ready = false;
        this.iframe = document.createElement('iframe');
        this.iframe.src = url;
        window.addEventListener('message', this.l);
        parent.appendChild(this.iframe);
    }
    EmbeddedCLUE.prototype.onMessage = function (event) {
        if (event.data.type !== 'caleydo' || !event.data.clue) {
            return;
        }
        this.onCLUEMessage(event.data.clue, event.data);
    };
    EmbeddedCLUE.prototype.send = function (type, msg) {
        var _this = this;
        msg.type = 'caleydo';
        msg.clue = type;
        msg.ref = clue_random_id();
        return new Promise(function (resolve, reject) {
            _this.callbacks[msg.ref] = {
                resolve: resolve,
                reject: reject,
                type: type
            };
            _this.iframe.contentWindow.postMessage(msg, '*');
        });
    };
    EmbeddedCLUE.prototype.showSlide = function (slide) {
        return this.send('show_slide', { slide: slide });
    };
    EmbeddedCLUE.prototype.jumpToState = function (state) {
        return this.send('jump_to', { state: state });
    };
    EmbeddedCLUE.prototype.nextSlide = function () {
        return this.send('next_slide', {});
    };
    EmbeddedCLUE.prototype.previousSlide = function () {
        return this.send('previous_slide', {});
    };
    EmbeddedCLUE.prototype.onCLUEMessage = function (type, data) {
        if (type === 'jumped_to_initial') {
            //ready
            this.ready = true;
            this.readyCallback(this);
            return;
        }
        var d = this.callbacks[data.ref];
        delete this.callbacks[data.ref];
        if (/.*_error/.test(type)) {
            d.reject(data);
        }
        else {
            d.resolve(data);
        }
    };
    return EmbeddedCLUE;
})();
function embedCLUE(parent, server, app, provenanceGraph) {
    var url = server + "/" + app + "/#clue_graph=" + provenanceGraph + "&clue_contained=T&clue=P";
    return new Promise(function (resolve) {
        new EmbeddedCLUE(parent, url, resolve);
    });
}