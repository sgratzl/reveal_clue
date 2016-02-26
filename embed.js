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

function inlineCLUE(url, app) {
  var nodes = [].slice.call(document.querySelectorAll('*[data-clue-ws]'));
  nodes.forEach(function(node) {
    var ws = node.dataset.clueWs;
    var curl = node.dataset.clueUrl || url;
    var capp = node.dataset.clueApp || app;
    var embed = embedCLUE(node, curl, capp, ws);
    var slide = node.dataset.clueSlide;
    var state = node.dataset.clueState;

    if (slide || state) {
      embed.then(function(e) {
        if (slide) {
          e.showSlide(parseInt(slide));
        } else if (state) {
          e.jumpToState(parseInt(state));
        }
      });
    }

    var fragments = [].slice.call(node.querySelectorAll('*[data-clue-slide], *[data-clue-state]'));
    if (fragments.length === 0) {
      return;
    }
    Reveal.addEventListener('fragmentshown', function (event) {
      if (fragments.indexOf(event.fragment) < 0) {
        return;
      }
      var slide = event.fragment.dataset.clueSlide;
      var state = event.fragment.dataset.clueState;
      embed.then(function (e) {
        if (slide === 'next') {
          e.nextSlide();
        } else if (slide === 'previous') {
          e.previousSlide();
        } else if (slide) {
          e.showSlide(parseInt(slide));
        } else if (state) {
          e.jumpToState(parseInt(state));
        }
      });
    });
    Reveal.addEventListener('fragmenthidden', function (event) {
      if (fragments.indexOf(event.fragment) < 0) {
        return;
      }
      var slide = event.fragment.dataset.clueSlide;
      var state = event.fragment.dataset.clueState;
      embed.then(function (e) {
        if (slide === 'next') {
          e.previousSlide();
        } else if (slide === 'previous') {
          e.nextSlide();
        } else if (slide) {
          e.showSlide(parseInt(slide));
        } else if (state) {
          e.jumpToState(parseInt(state));
        }
      });
    });
  });
}
