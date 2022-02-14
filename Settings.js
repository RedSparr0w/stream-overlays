// To get our user specified values
const PageParams = new URLSearchParams(window.location.search);

/* Changing css variables */
const rootStyle = document.querySelector(':root').style;
const setCSS = (property, value) => {
  rootStyle.setProperty(property, value);
}

// Basic settings class
class Setting {
  constructor(label, name, value, options = {}) {
    this.label = label;
    this.name = name;
    this.value = value;
    this.options = options;
    Settings.add(this);
    this.load();
    this.setup();
  }

  setup() {
    // We only want it displayed if we have a label
    if (!this.label) return;

    this.elements = {
      container: document.createElement('div'),
      label: document.createElement('label'),
      input: document.createElement('input'),
    }

    // label
    this.elements.label.innerText = `${this.label}:`;
    this.elements.label.className = 'form-label';
    this.elements.label.attributes.for = this.name;
    this.elements.container.appendChild(this.elements.label);

    // input
    this.elements.input.className = 'form-control';
    this.elements.input.value = this.value;
    this.elements.input.oninput = () => this.update(this.elements.input.value);
    this.elements.container.appendChild(this.elements.input);

    document.querySelector('#controls form').appendChild(this.elements.container);
  }

  update(value) {
    if (value) this.value = value;
    setCSS(`--${this.name}`, `${this.options.prefix ?? ''}${this.value}${this.options.suffix ?? ''}`);
    Settings.updateURI();
    this.run();
  }

  load(value) {
    if (!value) {
      value = PageParams.get(this.name);
    }
    if (value) {
      this.value = value;
      this.update();
    }
  }

  run() {
    // User functions defined here
  }
}

// Setting types
class BooleanSetting extends Setting {
  setup() {
    super.setup();

    if (!this.elements) return;
    this.elements.input.className = 'form-check-input float-end';
    this.elements.input.type = 'checkbox';
    this.elements.input.oninput = () => this.update(this.elements.input.checked);
  }
  load() {
    let value = PageParams.get(this.name);
    value = !value || ['false', '0', '', undefined].includes(value.toLowerCase()) ? false : true;
    this.value = value;
    this.update();
  }
}

class RangeSetting extends Setting {
  setup() {
    super.setup();
    this.elements.label.innerText = `${this.label}: ${this.options.prefix ?? ''}${this.value}${this.options.suffix ?? ''}`;
    this.elements.input.className = 'form-range';
    this.elements.input.type = 'range';
    this.elements.input.min = this.options.min || 1;
    this.elements.input.max = this.options.max || 100;
    this.elements.input.step = this.options.step || 1;
  }
  update(value) {
    super.update(value);
    if (this.elements && this.elements.label) {
      this.elements.label.innerText = `${this.label}: ${this.options.prefix ?? ''}${this.value}${this.options.suffix ?? ''}`;
    }
  }
  load() {
    let value = parseFloat(PageParams.get(this.name));
    if (!isNaN(value)) {
      this.value = value;
    }
    this.update();
  }
}

class NumberSetting extends Setting {
  setup() {
    super.setup();
    this.elements.input.type = 'number';
  }
  load() {
    let value = parseFloat(PageParams.get(this.name));
    if (!isNaN(value)) {
      this.value = value;
    }
    this.update();
  }
}

class TextSetting extends Setting {}

class ColorSetting extends Setting {
  setup() {
    super.setup();
    this.elements.input.className = 'form-control form-control-color w-100';
    this.elements.input.type = 'color';
  }
}

// Main settings class
class Settings {
  static items = [];

  static add(setting) {
    this.items.push(setting);
  }

  static load() {
    this.items.forEach(setting => {
      setting.update(PageParams.get(setting.name));
    });
  }

  static updateURI() {
    const outputEl = document.getElementById('overlay-uri');
    if (!outputEl) return;
    const params = {};
    this.items.forEach(setting => {
      params[setting.name] = setting.value;
    });
    const uri = `${location.origin}${location.pathname}?${new URLSearchParams(params).toString()}`;
    outputEl.value = uri;
  }
}