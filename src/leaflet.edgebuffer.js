(function (factory, window) {
  // define an AMD module that relies on 'leaflet'
  if (typeof define === 'function' && define.amd) {
    define(['leaflet'], factory);

  // define a Common JS module that relies on 'leaflet'
  } else if (typeof exports === 'object') {
    module.exports = factory(require('leaflet'));
  }

  // attach your plugin to the global 'L' variable
  if (typeof window !== 'undefined' && window.L && !window.L.EdgeBuffer) {
    factory(window.L);
  }
}(function (L) {
    L.EdgeBuffer = {
        _shouldExtend: true,
        _isBusy: false,
        previousMethods: {
            getTiledPixelBounds: L.GridLayer.prototype._getTiledPixelBounds
        }
    };
 
    L.TileLayer.include({
        _getTiledPixelBounds : function(center, zoom, tileZoom) {
        var pixelBounds = L.EdgeBuffer.previousMethods.getTiledPixelBounds.call(this, center, zoom, tileZoom);
        if (L.EdgeBuffer._shouldExtend && !L.EdgeBuffer._isBusy) {

            const edgeBufferTiles = this.options.edgeBufferTiles || 0;

            if (edgeBufferTiles > 0) {
                // console.log('using edgebuffer');

                var pixelEdgeBuffer = L.GridLayer.prototype.getTileSize.call(this).multiplyBy(edgeBufferTiles);
                pixelBounds =
                    new L.Bounds(pixelBounds.min.subtract(pixelEdgeBuffer), pixelBounds.max.add(pixelEdgeBuffer));
            }
        } else {
        //       console.log('skipping edgebuffer');
        }
        return pixelBounds;
    }
    });

    L.EdgeBufferHandler = L.Handler.extend({
        _self: this,

        _onZoomStart: function () {
            L.EdgeBuffer._isBusy = true;
        },
        _onZoomEnd: function () {
            L.EdgeBuffer._isBusy = false;
        },
        _onMoveStart: function () {
            L.EdgeBuffer._shouldExtend = true;
        },
        _onMoveEnd: function () {
            L.EdgeBuffer._shouldExtend = false;
        },
        initialize: function (map, options) {
            this._map = map;
        },
        addHooks: function () {
            if (this._map) {
                this._map.on('zoomstart', this._onZoomStart);
                this._map.on('zoomend', this._onZoomEnd);
                this._map.on('movestart', this._onMoveStart);
                this._map.on('moveend', this._onMoveEnd);
            }
        },
        removeHooks: function () {
            if (this._map) {
                this._map.off('zoomstart', this._onZoomStart);
                this._map.off('zoomend', this._onZoomEnd);
                this._map.off('movestart', this._onMoveStart);
                this._map.off('moveend', this._onMoveEnd);
            }
        }
    });
    L.edgeBufferHandler = function (opts) {
        return new L.EdgeBufferHandler(opts);
    }
    L.Map.addInitHook('addHandler', 'edgeBufferHandler', L.edgeBufferHandler);

}, window));