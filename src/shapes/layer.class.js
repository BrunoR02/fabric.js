(function (global) {

  'use strict';

  var fabric = global.fabric || (global.fabric = {});

  if (fabric.Layer) {
    fabric.warn('fabric.Layer is already defined');
    return;
  }

  /**
   * Layer class
   * @class fabric.Layer
   * @extends fabric.Group
   * @mixes fabric.Collection
   * @see {@link fabric.Layer#initialize} for constructor definition
   */
  fabric.Layer = fabric.util.createClass(fabric.Group, /** @lends fabric.Group.prototype */ {

    /**
     * @default
     * @type string
     */
    type: 'layer',

    /**
     * @override
     * @default
     */
    layout: 'auto',

    /**
     * @override
     * @default
     */
    objectCaching: false,

    /**
     * @override
     * @default
     */
    strokeWidth: 0,

    /**
     * @override
     * @default
     */
    hasControls: false,

    /**
     * @override
     * @default
     */
    hasBorders: false,

    /**
     * @override
     * @default
     */
    lockMovementX: true,

    /**
     * @override
     * @default
     */
    lockMovementY: true,

    /**
     * we don't want to int with the layer, only with it's objects
     * this makes group selection possible over a layer
     * @override
     * @default
     */
    selectable: false,

    /**
     * Constructor
     *
     * @param {fabric.Object[]} [objects] instance objects
     * @param {Object} [options] Options object
     * @return {fabric.Group} thisArg
     */
    initialize: function (objects, options) {
      this.callSuper('initialize', objects, options);
      this.__canvasMonitor = this.__canvasMonitor.bind(this);
    },

    /**
     *
     * @param {string} key
     * @param {*} value
     */
    _set: function (key, value) {
      var settingCanvas = key === 'canvas';
      if (settingCanvas) {
        if (!value && this.canvas) {
          //  detach canvas resize handler
          this.canvas.off('resize', this.__canvasMonitor);
        }
        else if (value && (!this.canvas || this.canvas !== value)) {
          //  attach canvas resize handler, make sure we listen to the resize event only once
          this.canvas && this.canvas.off('resize', this.__canvasMonitor);
          value.off('resize', this.__canvasMonitor);
          value.on('resize', this.__canvasMonitor);
        }
      }
      this.callSuper('_set', key, value);
      //  apply layout after canvas is set
      if (settingCanvas) {
        this._applyLayoutStrategy({ type: 'canvas' });
      }
    },

    /**
     * we do not need to invalidate layout because layer fills the entire canvas
     * @override
     * @private
     */
    __objectMonitor: function () {
      //  noop
    },

    /**
     * @private
     */
    __canvasMonitor: function () {
      this._applyLayoutStrategy({ type: 'canvas_resize' });
    },

    /**
     * Override this method to customize layout
     * @public
     * @param {string} layoutDirective
     * @param {fabric.Object[]} objects
     * @param {object} context object with data regarding what triggered the call
     * @param {'initializion'|'canvas'|'canvas_resize'|'layout_change'} context.type
     * @param {fabric.Object[]} context.path array of objects starting from the object that triggered the call to the current one
     * @returns {Object} options object
     */
    getLayoutStrategyResult: function (layoutDirective, objects, context) {  // eslint-disable-line no-unused-vars
      if ((context.type === 'canvas' || context.type === 'canvas_resize') && this.canvas && !this.group) {
        return {
          centerX: this.canvas.width / 2,
          centerY: this.canvas.height / 2,
          width: this.canvas.width,
          height: this.canvas.height
        };
      }
    },

    toString: function () {
      return '#<fabric.Layer: (' + this.complexity() + ')>';
    },

    dispose: function () {
      this.canvas && this.canvas.off('resize', this.__canvasMonitor);
      this.callSuper('dispose');
    }

  });

  /**
   * Returns fabric.Layer instance from an object representation
   * @static
   * @memberOf fabric.Layer
   * @param {Object} object Object to create an instance from
   * @returns {Promise<fabric.Layer>}
   */
  fabric.Layer.fromObject = function (object) {
    var objects = object.objects || [],
        options = fabric.util.object.clone(object, true);
    delete options.objects;
    return Promise.all([
      fabric.util.enlivenObjects(objects),
      fabric.util.enlivenObjectEnlivables(options)
    ]).then(function (enlivened) {
      return new fabric.Layer(enlivened[0], Object.assign(options, enlivened[1]), true);
    });
  };

})(typeof exports !== 'undefined' ? exports : this);
