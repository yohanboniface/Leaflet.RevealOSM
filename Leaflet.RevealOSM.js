L.Control.RevealOSM = L.Control.extend({
    includes: L.Mixin.Events,

    options: {
        position: 'topleft',
        apiUrl: 'http://overpass-api.de/api/interpreter?data=',
        queryTemplate: '[out:json];node(around:{radius},{lat},{lng})[name];out body qt 1;',
        helpText: "Click on names to get more infos",
        excludeKeys: [/source/, /^ref\:/ ] //
    },

    onAdd: function (map) {
        this._map = map;
        this.popup = this.getPopup();
        var className = 'leaflet-control-reveal-osm',
            container = this._container = L.DomUtil.create('div', className);
        var link = L.DomUtil.create('a', "", container);
        link.href = '#';
        link.title = this.getHelpText();
        var tooltip = this._tootip = L.DomUtil.create('span', '', container);
        tooltip.innerHTML = this.getHelpText();
        L.DomEvent
            .on(link, "click", this.toggle, this)
            .on(link, "click", L.DomEvent.stop);
        return container;
    },

    toggle: function () {
        if (L.DomUtil.hasClass(this._map._container, "reveal-osm")) {
            this.deactivate();
        }
        else {
            this.activate();
        }
    },

    activate: function () {
        this._map.on('click', this._onClick, this);
        this._map.on("preclick", this._preventCallOnClickToClose, this);
        L.DomUtil.addClass(this._map._container, "reveal-osm");
    },

    deactivate: function () {
        this._map.off('click', this._onClick, this);
        this._map.off("preclick", this._preventCallOnClickToClose, this);
        L.DomUtil.removeClass(this._map._container, "reveal-osm");
        L.DomUtil.removeClass(this._map._container, "loading");
    },

    _preventCallOnClickToClose: function (e) {
        if (e.target._popup == this.popup) {
            this._abortNextClick = true;
        }
    },

    getPopup: function () {
        return L.popup();
    },

    isAllowedKey: function (key) {
        for(var i=0, l=this.options.excludeKeys.length; i<l; i++) {
            if (key.match(this.options.excludeKeys[i])) {
                return false;
            }
        }
        return true;
    },

    formatContent: function (element) {
        var content = "",
            title = this.formatTitle(element);
        for (var tag in element.tags) {
            if (!this.isAllowedKey(tag)) { continue;}
            content += this.formatKey(element, tag);
        }
        content = title + '<ul>' + content + '</ul>';
        content = '<div class="reveal-osm-popup">' + content + '</div>';
        return content;
    },

    formatTitle: function (element) {
        var title;
        if (element.tags.name) {
            title = "<h4>" + element.tags.name + "</h4>";
        }
        return title;
    },

    formatKey: function (element, key) {
        return '<li><strong>' + key + "</strong> " + this.formatValue(element, key, element.tags[key]) + "</li>";
    },

    formatValue: function (element, key, value) {
        if (value.match(/^http(s)?\:\/\//)) {
            value = '<a href="' + value + '">' + value + '</a>';
        }
        return value;
    },

    getUrl: function (query) {
        return this.options.apiUrl + encodeURIComponent(query);
    },

    getQueryTemplate: function () {
        return this.options.queryTemplate;
    },

    getQuery: function () {
        var lat = this._latlng.lat,
            lng = this._latlng.lng,
            kwargs = {lat:lat, lng:lng, radius: this.getRadius()};
        return L.Util.template(this.getQueryTemplate(), kwargs);
    },

    getRadius: function () {
        return this.options.radius || 100 - (5 * this._map.getZoom());
    },

    getHelpText: function () {
        return this.options.helpText;
    },

    _onClick: function (e) {
        this._latlng = e.latlng;
        if (this._abortNextClick) {
            this._abortNextClick = false;
            return;
        }
        this.onClick(e);
    },

    onClick: function (e) {
        var query = this.getQuery(),
            url = this.getUrl(query);
        this._requestAPI(url);
    },

    error: function (msg) {
        if (this.options.errorCallback) {
            this.options.errorCallback(msg);
        }
        else {
            console.error(msg);
        }
    },

    _requestAPI: function (uri, options) {
        var self = this;

        var xhr = new XMLHttpRequest();
        xhr.open("GET", uri, true);

        xhr.onload = function(e) {
            L.DomUtil.removeClass(self._map._container, "loading");
            if (this.status == 200) {
                var data;
                try {
                    data = JSON.parse(this.response);
                }
                catch (err) {
                    self.error(err);
                }
                self.handleResponse(data);
            }
            else {
                self.error("Problem in the response");
            }
        };

        L.DomUtil.addClass(this._map._container, "loading");
        xhr.send();
    },

    openPopup: function (latlng, content) {
        this.popup
            .setLatLng(latlng)
            .setContent(content)
            .openOn(this._map);
    },

    handleResponse: function (data) {
        if (this.options.debug) {
            console.log(data);
        }
        if (data.elements.length) {
            var element = data.elements[0];
            if (element.type === "node") {
                this.handleNode(element);
            }
            else if (element.type === "way") {
                this.handleWay(element);
            }
        }
    },

    handleNode: function (element) {
        var latlng = L.latLng(element.lat, element.lon);
        var content = this.formatContent(element);
        this.openPopup(latlng, content);
    },

    handleWay: function (element) {
        var content = this.formatContent(element);
        // No nodes nor latlng in way data, so use click latlng for now
        // Another option is to request nodes by adding recurse on request
        // but it's heavier, and avoid limiting results...
        this.openPopup(this._latlng, content);
    }

});

L.Map.addInitHook(function () {
    if (this.options.revealOSMControl) {
        var options = this.options.revealOSMControlOptions || {};
        this.revealOSMControl = (new L.Control.RevealOSM(options)).addTo(this);
    }
});
