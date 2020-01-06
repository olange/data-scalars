/*
Automatic representation of a scalar value as Polymer Elements (Iron and Paper) – in either read-only or editing mode.

‹data-scalars› elements consume an immutable data egg data structure and produce suitable Polymer elements to represent that value. The data egg is a simple structure, which contains the scalar value, its type and logical formatting hints.

Designed to work hand-in-hand with data nuggets data structures delivered by ‹data-pipes›, although both can be used independently.

### Example of usage:

```
<data-scalars data="{{dataEgg}}"></data-scalars>
```

### Example of dataEgg:

```
let dataEgg = {
  data: { …someData… },
  schema: {
    type: 'number',
    variant: 'financial',
    …
  },
  error: "An error message"
}

```

### Schema
The schema let you customize the look and feel of the scalar. Here is a basic
example of schema:

```
let schema = {
  name: "My column field 1",
  type: "text"
}
```

### Schema fields
Here are all the fields that can be used in the schema:

- **name**: The name of the scalar to be displayed when the value is empty.
- **type**: The type of the scalar. Check the `Types` section for more
  information (default: `text`)
- **variant**: The variant type. Please check the `Variants`
  section for more information (default `default`)
- **disabled**: If set to true, the scalar edition mode is disabled.
  This will prevent the user from editing the value (default: `false`).
- **suggestions**: Used when the type is `dropdown`, `icon` or `text` (default:
  `undefined`). Check the `Types` section for more information.
- **style**: The CSS style of the scalar. It can also either an object or a
  function. Please check the `Styling` section for more information.
- **decimal**: the number of decimals in case the type is `number` and the
  `variant` is either `percentage` or `financial` (default: `2`).

### Types
The type (by default it is `text`) field tells this module how to present the
data. The type can be one of those:

- **text**: a simple string. You can use the `suggestions` field to replace some
  matching text, eg:
```
suggestions: {
    "a value": "by another", // will replace `a value` with `by another`
    "cat": "dog"             // will replace `cat` by `dog`
}
```
- **number**: an integer or decimal number
- **dropdown**: a dropdown letting you search and select a single value in
  editable mode. The `suggestions` field should be filled:
```
suggestions: [
    {label: "Choice 1", value: 1},{label: "Choice 2", value: 2}, … ]
```
- **date**: a date that can be choose from a date-picker in editable mode
- **datetime-local**: as for date but with the time
- **timestamp**: a unix timestamp that will be converted to a datetime-local
- **boolean**: a true or false value
- **icon**: an icon from your iconset.

### Example of how to use icons
```
type: 'icon',
suggestions: [
    {label: "Submitted", value: "your-iconset:check"},
    {label: "IsPending", value: "your-iconset:refresh"},
]
```

Your iconset using ‹iron-iconset-svg›:
```
<iron-iconset-svg size="24" name="your-iconset">
  <svg><defs>
  <g id="add"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></g>
  <g id="menu"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path></g>
  <g id="more-vert"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-   ...>

  <!-- More SVG icons here -->

</iron-iconset-svg>
```

### Variants
Some types such as `text` and `icon` has some available variants that can be
used. Here are the variants for each types:

- **number**
    - **financial**: convert a number (eg: `1000`) to a financial number (eg:
      `1'000.00`). The number of decimals can be set using the decimal field of
      the schema.
    - **financial-locale**: same as of `financial` variant but apply the locale
      format (eg: in the use 10000 will be converted to `10,000.00` while for
      Switzerland it will be `10'000.00`).
    - **percentage**: converts a floating value (eg: `0.04`) to its
      corresponding percentage value (eg: `4%`). The number of decimals can be
      set using the decimal field of the schema.
- **icon**:
    - **flag** will automatically convert the currency/country code to a flag
      (eg: `CH` value will be converted to the Swiss flag)

### Styling
There are three ways to style a data scalar:

- Style the cells of the column statically:
```
"style": "background-color: indianred"
```
- Style the cells by matching the text content:
```
"style": {
    "matching text": "background-color: orange",
    "other text": "background-color: yellowgreen"
}
```

### Errors

Specifying an error will add a background-color to the input and will display the
message content when hovering it with the mouse.


### TODO

- [ ] Explain how to correctly style a data-scalar
- [ ] Check to bring back immutability

*/

import { PolymerElement } from "@polymer/polymer/polymer-element.js";
import { html } from "@polymer/polymer/lib/utils/html-tag.js";

import "@polymer/iron-input/iron-input.js";
import "@vaadin/vaadin-combo-box/vaadin-combo-box-light.js";
import "flag-cc/flag-cc.js";

const $_documentContainer = document.createElement("template");

$_documentContainer.innerHTML = `<dom-module id="custom-vaadin-combo-box-item" theme-for="vaadin-combo-box-item">
  <template>
    <style>
      :host {
        padding: 0;
        margin: 0;
        max-height: 32px;
      }
      [part="content"] {
        padding: 0;
        margin: 0;
      }
      :host::before {
        display: none !important; /* Remove the blue-checkmark */
      }
    </style>
  </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
/**
 * `data-scalars`
 * Automatic representation of a scalar value
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
let DataScalars = class DataScalars extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: row;
        }

        div.content {
          border: 1px dotted transparent;
          font-size: 12px;
          color: inherit;
          width: 100%;
          display: flex;
          position: relative;
          box-sizing: border-box;
          align-items: center;
          padding: var(--data-scalar-padding, 0);
          min-height: 18px;
        }

        div.content[editing] {
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px dotted gray;
        }

        div.content .element {
          background-color: transparent;
          width: 100%;
        }
        div.content:not([editing]) .element.number {
          text-align: right;
        }
        div.content .element.financial {
          /** Nothing yet */
        }

        /** TODO: check this */
        div[hidden] {
          display: none;
        }

        select,
        select option,
        input,
        iron-input,
        vaadin-combo-box-light {
          padding: 0px;
          color: inherit;
          font-family: inherit;
          width: 100%;
          font-weight: inherit;
          font-size: inherit;
          display: flex;
          border: none;
          box-sizing: border-box;
          outline: none;
        }

        /** Hack to remove the forced padding from the browser */
        select,
        input {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          padding: 0px;
        }

        /**
         * Hack to fix the height of the date display. For whatever reason the
         * <input type=date> has a height of 18px, so to avoid flickering when
         * toggling the editing mode, we set the display to be the same size.
         */
        div.element.date {
          min-height: 18px;
        }

        vaadin-combo-box-light {
          min-width: 100px !important;
        }

        /** Turn off input[type=number] arrows/spiner */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
        }

        /** Used for vaadin dropdown where the inner input shouldn't choose its background-color */
        iron-input input {
          background-color: transparent;
        }

        div.content[disabled],
        input[disabled],
        select[disabled] {
          background: transparent;
          border: none !important;
        }

        div.content.error {
          border: 1px solid rgb(255, 41, 41);
          background-color: rgba(248, 183, 183, 0.5);
        }
        div.content[disabled].error {
          border: 1px solid transparent;
        }

        iron-icon {
          min-width: 20px;
          min-height: 20px;
        }

        .flag-cc-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1px;
        }
        flag-cc {
          width: 100%;
          height: 100%;
        }
      </style>
      <div
        id="scalar"
        class$="content [[_getErrorClass(data)]]"
        editing$="[[editing]]"
        disabled$="[[_disabled]]"
        title="[[_title]]"
      >
        <!-- Icon -->
        <template is="dom-if" if="[[_isDataOfType(data, 'icon')]]">
          <template is="dom-if" if="[[editing]]">
            <input
              class$="input element [[_elementType]] [[_elementVariant]]"
              value$="[[_value]]"
              title="[[_title]]"
              disabled="[[_disabled]]"
              placeholder="[[placeholder]]"
              on-change="_onChange"
              on-keyup="_onKeyup"
              on-keydown="_onKeydown"
            />
          </template>
          <template is="dom-if" if="[[!editing]]">
            <template is="dom-if" if="[[__equals(_elementVariant, 'default')]]">
              <iron-icon
                icon$="[[_getIconName(_suggestionsByLabel, _value)]]"
              ></iron-icon>
            </template>
            <template is="dom-if" if="[[__equals(_elementVariant, 'flag')]]">
              <div class="flag-cc-wrapper">
                <flag-cc currency="[[_value]]"></flag-cc>
              </div>
            </template>
          </template>
        </template>

        <!-- Text value -->
        <template is="dom-if" if="[[_shouldShowValue(data)]]">
          <span style="display: none">[[_value]]</span>
          <!-- In order to correctly us the DOM sort (eg: vaadin grid) -->
          <template is="dom-if" if="[[!editing]]">
            <div
              style="[[_getTextStyle(data, metaData, _value)]]"
              title="[[_title]]"
              class$="element [[_elementType]] [[_elementVariant]]"
            >
              [[_formatValue(data, _value, _suggestions)]]
            </div>
          </template>
        </template>

        <!-- EDITING MODE -->
        <template is="dom-if" if="[[editing]]">
          <!-- Editing primitive value -->
          <template is="dom-if" if="[[_isDataOfTypePrimitive(data)]]">
            <template is="dom-if" if="[[!_disabled]]">
              <input
                class$="input element [[_elementType]] [[_elementVariant]]"
                type$="[[_getType(data)]]"
                value$="[[_value]]"
                title="[[_title]]"
                disabled="[[_disabled]]"
                placeholder="[[placeholder]]"
                on-change="_onChange"
                on-keyup="_onKeyup"
                on-keydown="_onKeydown"
              />
            </template>
            <template is="dom-if" if="[[_disabled]]">
              [[_formatValue(data, _value, _suggestions)]]
            </template>
          </template>

          <!-- Editing date and timestamp value -->
          <template is="dom-if" if="[[_isDataOfTypeDate(data)]]">
            <template is="dom-if" if="[[!_disabled]]">
              <input
                class$="input element [[_elementType]] [[_elementVariant]]"
                type$="[[_parseHTMLDateType(data)]]"
                value$="[[_formatDatetime(data, _value, 'true')]]"
                title="[[_title]]"
                disabled="[[_disabled]]"
                placeholder="[[placeholder]]"
                on-change="_onChange"
                on-keyup="_onKeyup"
                on-keydown="_onKeydown"
              />
            </template>
            <template is="dom-if" if="[[_disabled]]">
              [[_formatValue(data, _value, _suggestions)]]
            </template>
          </template>

          <!-- Editing dropdown -->
          <template is="dom-if" if="[[_isDataOfType(data, 'dropdown')]]">
            <template is="dom-if" if="[[!_disabled]]">
              <vaadin-combo-box-light
                class$="input element dropdown [[_elementType]] [[_elementVariant]]"
                placeholder="[[placeholder]]"
                items="[[_suggestions]]"
                value="[[_getLabelFromValue(_suggestions, _value)]]"
                attr-for-value="bind-value"
                disabled="[[_disabled]]"
                allow-custom-value="[[_allowCustomValue]]"
                selected-item="{{_dropdownSelectedItem}}"
              >
                <template>
                  <div style="font-size: 10px; font-family:'Roboto';">
                    [[item.label]] ([[item.value]])
                  </div>
                </template>
                <iron-input>
                  <input
                    placeholder="[[placeholder]]"
                    disabled$="[[_disabled]]"
                    on-keyup="_onKeyup"
                    on-keydown="_onKeydown"
                  />
                </iron-input>
              </vaadin-combo-box-light>
            </template>
          </template>

          <!-- Editing checkbox -->
          <template is="dom-if" if="[[_isDataOfType(data, 'checkbox')]]">
            <template is="dom-if" if="[[!_disabled]]">
              <select
                class$="input element checkbox [[_elementType]] [[_elementVariant]]"
                disabled="[[_disabled]]"
                on-change="_onTick"
                value="[[_value]]"
                on-keyup="_onKeyup"
              >
                <option>unset</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </template>
            <template is="dom-if" if="[[_disabled]]">
              [[_value]]
            </template>
          </template>
        </template>
      </div>
    `;
  }

  static get is() {
    return "data-scalars";
  }
  static get properties() {
    return {
      /**
       * The given `dataEgg`. A `dataEgg` is one element of the `dataNugget`.
       * Example:
       *
       * ```
       *    dataEgg = {value: …, schema: …, format: … [, metadata: …]}
       *
       *    schema = {
       *      editing: true|false,
       *      type:       text|number|date|boolean|dropdown,
       *      hidden:     true|false,
       *      disabled:   true|false
       *      variant:    ... see bellow ...,
       *      decimals:   a positive number
       *
       *    Variants:
       *      if the type is text:   default
       *      if the type is date:   default
       *      if the type is number: financial|percentage|default;
       * ```
       */
      data: {
        type: Object,
        notify: true
      },

      /* Name of the data-scalar */
      name: {
        type: String
      },

      title: String,
      /** A custom function to compute the title tooltip. This overwrites the title */
      tooltip: Function,
      /** Internal computed tooltip title */
      _title: {
        type: String,
        computed: "_computeTitle(data, name, title, tooltip)"
      },


      /** Defines if the data-scalar is in editing mode or not */
      editing: {
        type: Boolean,
        notify: true,
        value: false,
        reflectToAttribute: true
      },

      /** The new value that is set while editing */
      newValue: {
        type: String,
        notify: true
      },

      /**
       * The input field will be disabled when the editing mode is
       * activated
       */
      disabled: {
        type: Boolean,
        notify: true,
        reflectToAttribute: true
      },
      _disabled: {
        type: Boolean,
        notify: true,
        observer: "_disabledChanged",
        computed: "_computeDisabled(data, disabled)"
      },

      /** Placeholder for the field */
      placeholder: {
        type: String
      },

      /** Internal computed element type */
      _elementType: {
        type: String,
        value: "text",
        computed: "_computeElementType(data)"
      },

      /** Internal computed element variant type */
      _elementVariant: {
        type: String,
        value: "default",
        computed: "_computeElementVariant(data)"
      },

      /**
       * Used to know if the dropdown can have custom values.
       * To disable custom values set the variant to "no-custom-value".
       */
      _allowCustomValue: {
        type: Boolean,
        value: true,
        computed: "_computeAllowCustomValue(_elementType, _elementVariant)"
      },

      /**
       * Suggestions that are computed from the schema
       * eg: [{label: …, value:…}, …]
       */
      _suggestions: {
        type: Array,
        computed: "_computeSuggestions( data)"
      },

      /**
       * Suggestions object structured by `label`
       * eg: {"label1": "value1", "label2": "value2", …}
       */
      _suggestionsByLabel: {
        type: Object,
        computed: "_computeSuggestionsByLabel( _suggestions)"
      },

      /** Internal computed value */
      _value: {
        type: String,
        computed: "_computeValue( data)"
      },

      __previousOnChangeValue: {
        type: String,
        value: ""
      },

      _dropdownSelectedItem: {
        type: Object,
        observer: "_dropdownSelectedItemChanged"
      },

      metaData: Object
    };
  }

  ready() {
    super.ready();
  }

  /** Compute the `_value` and update its input field to make sure it is correct */
  _computeValue(data) {
    if (!data) {
      return;
    }
    var value = data.get("value");

    // Translate undefined to empty string
    if (value == undefined) {
      value = "";
    }

    this._forceValue(value);

    return value;
  }

  /** Computes the disable option from the schema */
  _computeDisabled(data, disabled) {
    if (disabled != undefined) {
      return disabled;
    }
    if (data.get("schema")) {
      return data.get("schema").get("disabled") || false;
    }
    return false;
  }

  /** Computes the suggestions from the schema */
  _computeSuggestions(data) {
    if (!data) {
      return;
    }
    if (data.get("schema") && data.get("schema").get("suggestions")) {
      return data
        .get("schema")
        .get("suggestions")
        .toJS();
    }
  }

  /** Computes the suggestions scrutured by 'label' */
  _computeSuggestionsByLabel(_suggestions) {
    var result = {};
    if (_suggestions) {
      _suggestions.forEach(sug => {
        result[sug.label] = sug.value;
      });
    }
    return result;
  }

  /**
   * Computes the title that is display when hovering a field. If there is a specific error
   * in the schema, the error will be shown.
   */
  _computeTitle(data, name, title, tooltip) {
    if (!tooltip || title != undefined) {
      return title;
    }
    if (!data) {
      return undefined;
    }
    if (tooltip) {
      return tooltip(data, name);
    }
    if (data.get("error")) {
      return "Error: " + data.get("error");
    }
    return data.get("value");
  }

  /** Computes the element type from the schema */
  _computeElementType(data) {
    return this._getType(data);
  }

  /** Computes the element variant type from the schema */
  _computeElementVariant(data) {
    return this._getVariant(data);
  }

  _computeAllowCustomValue(type, variant) {
    return type == "dropdown" && variant != "no-custom-value" ? true : false;
  }

  /** Helpers */

  /** When `disabled` is changed, update the value to make sure it's correct in the input field */
  _disabledChanged(disabled) {
    if (!this.data) {
      return;
    }
    if (this._value) {
      // Make sure the value is updated when editing
      this._computeValue(this.data);
    }
  }

  /* Make sure that the user edition is deleted and replaced by the default value */
  _forceValue(value) {
    var type = this._getType(this.data);
    var scalar = this.$.scalar;
    if (scalar) {
      var input = scalar.querySelector(".input");
      if (input) {
        input.value = value;
      }
    }
    this._value = value;

    // Make sure to detect futher changes. Reseting previous change.
    // TODO: this should be in an observer when the `editing` attribute
    // changes.
    if (type == "dropdown") {
      // this is because the default vaadin value is an empty string instead of undefined.
      // Thus, going to the 'edit' mode will trigger a change from undefined to empty string.
      // We do not want to trigger the initial on-change event.
      this.__previousOnChangeValue = "";
    } else {
      this.__previousOnChangeValue = undefined;
    }
  }

  /** If there is an error, the `error` class is returned to the input field */
  _getErrorClass(data) {
    if (!data || !data.get("error")) {
      return;
    }
    if (data.get("error")) {
      return "error";
    }
  }

  /** Dispatch the 'change' event with the name and value of the component */
  _dispatchChangeEvent(value) {
    var event = new CustomEvent("change", {
      detail: { name: this.name, value: value }
    });
    this.dispatchEvent(event);
  }

  /**
   * Dispatch a custom event 'change' when the input changes.
   * The event carries the name and value of the input in its details.
   *   {'detail': {name: "the name", value: "the value"}}
   */
  _onChange(e) {
    var value = e.currentTarget.value;
    if (e.currentTarget.type == "datetime-local") {
      value = value.replace("T", " ");
    }

    // We need to make sure that the onChange was triggered twice.
    // After the user has finished doing an edition, the event is resent
    // to notify about the latest value.
    if (this.__previousOnChangeValue != value) {
      this._dispatchChangeEvent(value);
      this.__previousOnChangeValue = value;
    }
    this.newValue = value;
  }

  _dropdownSelectedItemChanged(_dropdownSelectedItem) {
    if (_dropdownSelectedItem) {
      var e = { currentTarget: { value: _dropdownSelectedItem.value } };
      this._onChange(e);
    }
  }

  _onKeyup(e) {
    this._onChange(e); // Make sure we capture the last onchange event
  }

  /**
   * Dispatch an event when some special keys are used.
   * Eg:
   *     - Escape key will dispatch the 'cancel' event
   *     - Enter key will dispatch the 'validate' event
   */
  _onKeydown(e) {
    if (!e.ctrlKey && e.keyCode == 13) {
      e.stopPropagation();
      e.preventDefault();
      let event = new Event("validate");
      this.dispatchEvent(event);
    } else if (e.code == "Escape") {
      let event = new Event("cancel");
      this.dispatchEvent(event);
    }
  }

  /** Dispatch a custom event 'change' when the checkbox attribut has changed */
  _onTick(e) {
    let elem = e.currentTarget;
    let value = elem.options[elem.selectedIndex].value;
    let checked = "";
    if (value == "true") {
      checked = true;
    } else if (value == "false") {
      checked = false;
    }
    this._dispatchChangeEvent(checked);
    this.newValue = checked;
  }

  /** Retrieves the type from the schema */
  _getType(data) {
    if (data && data.get("schema") && data.get("schema").get("type")) {
      return data
        .get("schema")
        .get("type")
        .toLowerCase();
    } else {
      return "text";
    }
  }

  /** Retrieves the style from the schema */
  _getStyle(data, metaData) {
    if (data && data.get("schema") && data.get("schema").get("style")) {
      let style = data.get("schema").get("style");
      if (typeof style === "function") {
        style = style(data, metaData);
      }
      return style;
    } else {
      return "";
    }
  }

  /** Return the parsed HTML date type */
  _parseHTMLDateType(data) {
    let type = this._getType(data);
    if (type == "date") {
      return "date";
    } else if (["datetime", "datetime-local", "timestamp"].indexOf(type) > -1) {
      return "datetime-local";
    }
    return "text";
  }

  /** Returns the schema type variant */
  _getVariant(data) {
    if (data && data.get("schema") && data.get("schema").get("variant")) {
      return data
        .get("schema")
        .get("variant")
        .toLowerCase();
    } else {
      return "default";
    }
  }

  /** Returns the schema decimals information */
  _getDecimals(data) {
    if (
      data &&
      data.get("schema") &&
      data.get("schema").get("decimals") != undefined
    ) {
      return data.get("schema").get("decimals");
    } else {
      return undefined;
    }
  }

  /**
   * Checks if the type, given from the schema, is an HTML primitive type.
   * This is used to know if we can use an HTML tag instead of a custom component
   * to present the data value.
   */
  _isDataOfTypePrimitive(data) {
    var primitiveTypes = ["text", "number"];
    var type = this._getType(data);
    if (type) {
      return primitiveTypes.indexOf(type) > -1;
    } else {
      return true;
    }
  }

  /** Returns true if the data type is a `date` type */
  _isDataOfTypeDate(data) {
    var dateTypes = ["date", "datetime", "datetime-local", "timestamp"];
    var type = this._getType(data);
    return dateTypes.indexOf(type) > -1;
  }

  /**
   * Returns true if the data is of type `elType`.
   * By default and if the type is not specified, it will return true as if `elType` == 'text'
   */
  _isDataOfType(data, typeToCheck) {
    var type = this._getType(data);
    if (["bool", "checkbox", "boolean"].indexOf(type) > -1) {
      type = "checkbox";
    }

    if (type) {
      return type == typeToCheck;
    } else {
      return typeToCheck == "text";
    }
  }

  /**
   * Should display the data value. Eg: the icon should not display its string
   */
  _shouldShowValue(data) {
    var type = this._getType(data);
    if (type != "icon") {
      return true;
    }
    return false;
  }

  _getIconName(_suggestionsByLabel, _value) {
    var icon = _value;
    if (_suggestionsByLabel && _suggestionsByLabel[_value]) {
      icon = _suggestionsByLabel[_value];
    }
    return icon;
  }

  _getFlagName(_suggestionsByLabel, _value) {
    var flag = _value;
    if (_suggestionsByLabel && _suggestionsByLabel[_value]) {
      flag = _suggestionsByLabel[_value];
    }
    return flag;
  }

  _formatValue(data, _value, _suggestions) {
    let value = this._getLabelFromValue(_suggestions, _value);
    if (value === undefined || value === null || value === "") {
      return "";
    }
    let type = this._getType(data);
    let variant = this._getVariant(data);
    if (type == "number") {
      let decimals = this._getDecimals(data);
      switch (variant) {
        case "financial":
          return this._financialNumber(value, decimals);
        case "financial-locale":
          return this._financialNumber(value, decimals, true);
        case "percentage":
          return this._percentageNumber(value, decimals);
        default:
          return decimals !== undefined ? value.toFixed(decimals) : value;
      }
    } else if (
      ["date", "datetime-local", "timestamp"].indexOf(type) > -1 &&
      _value
    ) {
      return this._formatDatetime(data, _value);
    }
    return value;
  }

  _formatDatetime(data, _value, html = false) {
    let string = "";
    if (_value) {
      let type = this._getType(data);
      let date = new Date(_value);
      let month = date.getMonth() + 1 + "";
      month = month.length > 1 ? month : "0" + month;
      let day =
        (date.getDate() + "").length > 1
          ? date.getDate()
          : "0" + date.getDate();
      var year = date.getFullYear();
      var hours =
        (date.getHours() + "").length > 1
          ? date.getHours()
          : "0" + date.getHours();
      var minutes =
        (date.getMinutes() + "").length > 1
          ? date.getMinutes()
          : "0" + date.getMinutes();
      string = html
        ? year + "-" + month + "-" + day
        : day + "." + month + "." + year;
      if (type != "date") {
        string += html ? "T" : " ";
        string += hours + ":" + minutes;
      }
    }
    return string;
  }

  _financialNumber(x, decimals = 2, isLocale) {
    x = Math.round(x * Math.pow(10, decimals)) / Math.pow(10, decimals); // Round to the decimals number. This avoids having 19999.9999999 formatted to 19'999.00 which is wrong
    if (isLocale) {
      return x.toLocaleString(undefined, { minimumFractionDigits: decimals });
    }
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    parts[1] =
      parseFloat("0." + parts[1])
        .toFixed(decimals)
        .split(".")[1] || "00";
    return parts.join(".");
  }

  _percentageNumber(x, decimals = 2) {
    return (parseFloat(x) * 100).toFixed(decimals) + " %";
  }

  __equals(a, b) {
    return a == b;
  }

  /**
   * Retrieves the suggestion label from the value if exists.
   * Else it returns the value
   */
  _getLabelFromValue(_suggestions, _value) {
    var label = _value;
    if (_suggestions) {
      _suggestions.forEach(s => {
        if (s.value == _value) {
          label = s.label;
        }
      });
    }
    return label;
  }

  _getTextStyle(data, metaData, _value) {
    if (_value == undefined) {
      return "";
    }
    var style = this._getStyle(data, metaData);
    var type = this._getType(data);
    var variant = this._getVariant(data);
    if (
      type == "number" &&
      ["financial", "financial-locale"].indexOf(variant) > -1
    ) {
      if (_value > 0) {
        style = "color: yellowgreen;" + style;
      } else if (_value < 0) {
        style = "color: indianred;" + style;
      }
    }
    return style;
  }

  empty() {
    this.data = this.data.set("value", "");
    this._forceValue("");
  }

  getValue() {
    return this._value;
  }
};
window.customElements.define(DataScalars.is, DataScalars);

export default DataScalars;
