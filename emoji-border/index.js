// Our default settings
const Settings = {
  // Movement
  render_time: 25,
  velocity: { x: 0, y: -2 },
  gravity: -0.01,
  // Display
  area: 'top top right bottom bottom left',
  text: '❤❤xo',
  text_color: { r: 244, g: 0, b: 147 },
  size: { min: 30, max: 45 },
  amount: 300,
  max_age: 2500,
  fade: { min: 20, max: 80 },
  // Performance
  render_time_ms: 0,
  url_address: '',
};

// To get our user specified values
const PageParams = new URLSearchParams(window.location.search);
Object.keys(Settings).forEach(k => {
  try {
    const value = PageParams.get(k);
    if (value != undefined) Settings[k] = JSON.parse(PageParams.get(k));
  }catch(e){}
});

// Update the current URI
const UpdateURI = () => {
  const params = {};
  Object.keys(Settings).forEach(k => {
    if (typeof Settings[k] == 'function') return;
    params[k] = JSON.stringify(Settings[k]);
  });
  const uri = `${location.origin}${location.pathname}?${new URLSearchParams(params).toString()}`;
  // history.replaceState({}, undefined, uri);
  Settings.url_address = uri;
};

// Creating a GUI with our settings
const Pane = new Tweakpane.Pane({
  title: 'Settings',
  expanded: true,
});
Pane.registerPlugin(TweakpaneEssentialsPlugin);

Pane.on('change', (ev) => {
  UpdateURI();
});
const Movement = Pane.addFolder({
  title: 'Movement',
  expanded: true,
});
Movement.addInput(Settings, 'render_time', {min: 10, max: 100, step: 1});
Movement.addInput(Settings, 'velocity', {
  x: { min: -5, max: 5, step: 0.01 },
  y: { min: -5, max: 5, step: 0.01 },
});
Movement.addInput(Settings, 'gravity', {min: -1, max: 1, step: 0.01});

const Display = Pane.addFolder({
  title: 'Display',
  expanded: true,
});
Display.addInput(Settings, 'area', {
  options: {
    All: 'all',
    Edges: 'top top right bottom bottom left',
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
  },
});
Display.addInput(Settings, 'text');
Display.addInput(Settings, 'text_color');
Display.addInput(Settings, 'size', { min: 1, max: 100, step: 1 });
Display.addInput(Settings, 'amount', { min: 1, max: 1000, step: 1 });
Display.addInput(Settings, 'max_age', { min: 500, max: 10000, step: 50 });
Display.addInput(Settings, 'fade', { min: 0, max: 100, step: 1 });

const Performance = Pane.addFolder({
  title: 'Performance',
  expanded: true,
});
Performance.addMonitor(Settings, 'render_time_ms', {
  view: 'graph',
  interval: 200,
  min: 0,
  max: 100,
});

const Output = Pane.addFolder({
  title: 'Output',
  expanded: true,
});
const uriComponent = Output.addMonitor(Settings, 'url_address', {
  interval: 1000,
});
const copyButton = Output.addButton({title: 'Copy URL'});
copyButton.on('click', (ev) => {
  const input = uriComponent.controller_.view.valueElement.querySelector('input');
  input.select();
  input.setSelectionRange(0, 99999); /* For mobile devices */
  navigator.clipboard.writeText(input.value);
  ev.target.title = 'Copied!';
  setTimeout(() => ev.target.title = 'Copy URL', 1500);
});
UpdateURI();


// Adding the particles
window.onload = () => {
  // Initialise an empty canvas and place it on the page
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  // No longer setting velocites as they will be random
  // Set up object to contain particles and set some default values
  const particles = {};
  let particleIndex = 0;

  // Set up a function to create multiple particles
  function Particle(side = 'all') {
    this.text = [...Settings.text][Math.floor(Math.random() * [...Settings.text].length)];

    let x = 0;
    let y = 0;
    switch (side) {
      case 'top':
      case 'bottom':
        x = Math.random() * canvas.width;
        break;
      case 'left':
      case 'right':
        y = Math.random() * canvas.height;
        break;
      default:
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
    }

    switch (side) {
      case 'top':
        y = Settings.size.min + (Math.random() * Settings.size.min);
        break;
      case 'bottom':
        y = canvas.height - (Math.random() * 10);
        break;
      case 'left':
        x = Settings.size.min + (Math.random() * Settings.size.min);
        break;
      case 'right':
        x = canvas.width - (Math.random() * 50);
        break;
    }

    // Establish starting positions and velocities
    this.x = x;
    this.y = y;

    this.vx = Settings.velocity.x * Settings.render_time / 100;
    this.vy = Settings.velocity.y * Settings.render_time / 100;

    this.size = Settings.size.min + (Math.random() * (Settings.size.max - Settings.size.min));
    this.opacity = 0;
    this.fade_in = (Settings.max_age/100) * Settings.fade.min;
    this.fade_in_amount = 1 / (this.fade_in / Settings.render_time);
    this.fade_out = (Settings.max_age/100) * Settings.fade.max;
    this.fade_out_amount = 1 / ((Settings.max_age - this.fade_out) / Settings.render_time);

    this.id = particleIndex;
    this.age = 0;
    this.delay = Math.random() * Settings.max_age;

    // Add new particle to the index
    particles[particleIndex++] = this;
  }

  // Some prototype methods for the particle's "draw" function
  Particle.prototype.draw = function() {
    if (this.delay > 0) {
      this.delay -= Settings.render_time;
      return;
    }
    this.x += this.vx;
    this.y += this.vy;
    
    // // Give the particle some bounce
    // if ((this.y - this.size) < 0) {
    //   this.vy *= -0.8;
    //   this.y = this.size;
    // }

    // Adjust for gravity
    this.vy += Settings.gravity * Settings.render_time / 100;

    // Age the particle
    this.age += Settings.render_time;

    // If Particle is old, it goes in the chamber for renewal
    if (this.age >= Settings.max_age || (this.y + this.size) < 0) {
      delete particles[this.id];
    }

    // // Create the shapes
    // context.beginPath();
    // context.fillStyle="#0000ff";
    // // Draws a circle of radius 20 at the coordinates 100,100 on the canvas
    // context.arc(this.x, this.y, this.size, 0, Math.PI*2, true);
    // context.closePath();
    // context.fill();
    context.font = `${this.size}px Arial`;
    context.fillStyle = `rgba(${Settings.text_color.r}, ${Settings.text_color.g}, ${Settings.text_color.b}, ${this.age <= this.fade_in ? this.opacity += this.fade_in_amount : this.age >= this.fade_out ? this.opacity -= this.fade_out_amount : this.opacity})`;
    context.textAlign = 'center';
    context.fillText(this.text, this.x, this.y);
  };
  let prevTime = Date.now();
  const drawCanvas = () => {
    // Fill the backgorund
    // context.fillStyle = "rgba(20,20,20,0.8)";
    // context.fillRect(0, 0, canvas.width, canvas.height);
    // Transparent background
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the particles
    while (Object.values(particles).length < Settings.amount) {
      for (const area of Settings.area.split(' ')) {
        new Particle(area);
      }
    }

    for (const i in particles) {
      particles[i].draw();
    }
    const now = Date.now();
    Settings.render_time_ms = now - prevTime;
    prevTime = now;
    setTimeout(drawCanvas, Settings.render_time);
  };
  drawCanvas();
};
