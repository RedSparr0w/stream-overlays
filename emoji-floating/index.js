// #region Settings

// Our default settings
const Settings = {
  // Movement
  fps: 30,
  mspf: Math.floor(1000 / 30),
  velocity: { x: 0, y: -2 },
  gravity: { x: 0, y: -0.01 },
  // Display
  area: 'all',
  text: '❤❤xo',
  text_color: { r: 244, g: 0, b: 147 },
  size: { min: 30, max: 45 },
  amount: 300,
  max_age: 2500,
  fade: { min: 20, max: 80 },
  // Performance
  ms_per_frame: 0,
  // Output
  url_address: '',
};

// Get our user specified values
const PageParams = new URLSearchParams(window.location.search);
Object.keys(Settings).forEach(k => {
  try {
    const value = PageParams.get(k);
    if (value != undefined) Settings[k] = JSON.parse(PageParams.get(k));
  }catch(e){}
});

// Update the output URI
const UpdateURI = () => {
  const params = {};
  Object.keys(Settings).forEach(k => {
    if (typeof Settings[k] == 'function') return;
    params[k] = JSON.stringify(Settings[k]);
  });
  const uri = `${location.origin}${location.pathname}?${new URLSearchParams(params).toString()}`;
  Settings.url_address = uri;
};

// Create our settings GUI
const Pane = new Tweakpane.Pane({
  title: 'Settings',
  expanded: true,
});
Pane.registerPlugin(TweakpaneEssentialsPlugin);

Pane.on('change', (ev) => {
  UpdateURI();
});

// Movement settings
const Movement = Pane.addFolder({
  title: 'Movement',
  expanded: true,
});
const FPS = Movement.addInput(Settings, 'fps', { min: 10, max: 144, step: 1 });
FPS.on('change', (ev) => {
  Settings.mspf = Math.floor(1000 / ev.value);
});
Movement.addInput(Settings, 'velocity', {
  x: { min: -10, max: 10, step: 0.01 },
  y: { min: -10, max: 10, step: 0.01 },
});
Movement.addInput(Settings, 'gravity',  {
  x: { min: -10, max: 10, step: 0.01 },
  y: { min: -10, max: 10, step: 0.01 },
});

// Display settings
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

// Performance settings
const Performance = Pane.addFolder({
  title: 'Performance',
  expanded: true,
});
Performance.addMonitor(Settings, 'ms_per_frame', {
  view: 'graph',
  interval: 200,
  min: 0,
  max: 100,
});

// Output settings
const Output = Pane.addFolder({
  title: 'Output',
  expanded: true,
});
const uriComponent = Output.addMonitor(Settings, 'url_address', {
  interval: 1000,
});
const copyButton = Output.addButton({title: 'Copy URL'});
// Copy the output uri text when the button is clicked
copyButton.on('click', (ev) => {
  const input = uriComponent.controller_.view.valueElement.querySelector('input');
  input.select();
  input.setSelectionRange(0, 99999); /* For mobile devices */
  navigator.clipboard.writeText(input.value);
  ev.target.title = 'Copied!';
  setTimeout(() => ev.target.title = 'Copy URL', 1500);
});

// Update our uri string now
UpdateURI();

// #endregion Settings

// #region Adding the particles
// Wait until our document is ready
window.onload = () => {
  // Initialise an empty canvas and place it on the page
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  // Set up object to contain particles and set some default values
  const particles = {};
  let particleIndex = 0;

  // Set up our function to create particles
  function Particle(side = 'all') {
    // Calculate our text displayed
    this.text = [...Settings.text][Math.floor(Math.random() * [...Settings.text].length)];

    let x = 0;
    let y = 0;

    // calculate x
    switch (side) {
      case 'left':
        x = (Math.random() * Settings.size.max);
        break;
      case 'right':
        x = canvas.width - (Math.random() * Settings.size.max);
        break;
      case 'top':
      case 'bottom':
      default:
        x = Math.random() * canvas.width;
        break;
    }

    // calculate y
    switch (side) {
      case 'top':
        y = Settings.size.max + (Math.random() * Settings.size.max);
        break;
      case 'bottom':
        y = canvas.height + (Math.random() * Settings.size.max);
        break;
      case 'left':
      case 'right':
      default:
        y = Math.random() * canvas.height;
        break;
    }

    // Establish starting positions, velocities, size
    this.x = x;
    this.y = y;

    this.vx = Settings.velocity.x * Settings.mspf / 100;
    this.vy = Settings.velocity.y * Settings.mspf / 100;

    this.size = Settings.size.min + (Math.random() * (Settings.size.max - Settings.size.min));
    this.opacity = 0;
    this.fade_in = (Settings.max_age/100) * Settings.fade.min;
    this.fade_in_amount = 1 / (this.fade_in / Settings.mspf);
    this.fade_out = (Settings.max_age/100) * Settings.fade.max;
    this.fade_out_amount = 1 / ((Settings.max_age - this.fade_out) / Settings.mspf);

    this.id = particleIndex;
    this.age = 0;
    this.delay = Math.random() * Settings.max_age;

    // Add new particle to the index
    particles[particleIndex++] = this;
  }

  // Some prototype methods for the particle's "draw" function
  Particle.prototype.draw = function() {
    if (this.delay > 0) {
      this.delay -= Settings.mspf;
      return;
    }
    // Move the particle
    this.x += this.vx;
    this.y += this.vy;

    // Adjust for gravity
    this.vx += Settings.gravity.x / Settings.mspf;
    this.vy += Settings.gravity.y / Settings.mspf;

    // Age the particle
    this.age += Settings.mspf;

    // If Particle is old, delete it so we can get a new one
    if (this.age >= Settings.max_age || (this.y + this.size) < 0) {
      delete particles[this.id];
    }

    // Spawn the particle
    context.font = `${this.size}px Arial`;
    context.fillStyle = `rgba(${Settings.text_color.r}, ${Settings.text_color.g}, ${Settings.text_color.b}, ${this.age <= this.fade_in ? this.opacity += this.fade_in_amount : this.age >= this.fade_out ? this.opacity -= this.fade_out_amount : this.opacity})`;
    context.textAlign = 'center';
    context.fillText(this.text, this.x, this.y);
  };
  let prevTime = Date.now();
  let lastFrameTime = 0;  // the last frame time
  function update(time){
    if(time - lastFrameTime < Settings.mspf - 1){ //skip the frame if the call is too early
      return requestAnimationFrame(update);
    }
    lastFrameTime = time; // remember the time of the rendered frame

    // Set a transparent background
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Make sure we have enough particles
    while (Object.values(particles).length < Settings.amount) {
      for (const area of Settings.area.split(' ')) {
        new Particle(area);
      }
    }

    // Draw the particles
    for (const i in particles) {
      particles[i].draw();
    }

    const now = Date.now();
    Settings.ms_per_frame = now - prevTime;
    prevTime = now;
    requestAnimationFrame(update); // get next farme
  }
  requestAnimationFrame(update); // start animation
};

// #endregion Adding the particles
