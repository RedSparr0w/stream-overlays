// #region Settings

// Our default settings
const Settings = {
  // Movement
  velocity: { x: 0, y: -10 },
  gravity: { x: 0, y: -0.05 },
  // Display
  area: 'all',
  // Edge offsets
  eo_top: { min: 30, max: 75 },
  eo_right: { min: 0, max: 45 },
  eo_bottom: { min: -10, max: 35 },
  eo_left: { min: 0, max: 45 },
  text: '❤❤xo',
  text_color: { r: 244, g: 0, b: 147 },
  size: { min: 30, max: 45 },
  max_rotation: 15,
  rotate_speed: 0,
  amount: 300,
  max_age: 2500,
  fade: { min: 20, max: 80 },
  // Performance
  fps: 30,
};
const DefaultSettings = JSON.parse(JSON.stringify(Settings));
const Values = {
  mspf: Math.floor(1000 / Settings.fps) - 1,
  // Output
  url_address: '',
};

// Get our user specified values
const PageParams = new URLSearchParams(window.location.search);
Object.keys(Settings).forEach(k => {
  try {
    if (typeof Settings[k] == 'object') {
      for (const key in Settings[k]) {
        const value = PageParams.get(`${k}.${key}`);
        // If it doesn't exist, continue
        if (value == undefined) return;
        // Update our value
        Settings[k][key] = JSON.parse(value);
      }
      return;
    }
    // Get our value
    const value = PageParams.get(k);
    // If it doesn't exist, continue
    if (value == undefined) return;
    // Update our value
    Settings[k] = JSON.parse(PageParams.get(k));
  }catch(e){}
});

// Update the output URI
const UpdateURI = () => {
  const params = {};
  Object.keys(Settings).forEach(k => {
    if (typeof Settings[k] == 'function') return;
    if (JSON.stringify(Settings[k]) == JSON.stringify(DefaultSettings[k])) return;
    if (typeof Settings[k] == 'object') {
      for (const key in Settings[k]) {
        params[`${k}.${key}`] = JSON.stringify(Settings[k][key]);
      }
      return;
    }
    params[k] = JSON.stringify(Settings[k]);
  });
  const uri = `${location.origin}${location.pathname}?${new URLSearchParams(params).toString()}`;
  Values.url_address = uri;
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
Movement.addInput(Settings, 'velocity', {
  x: { min: -100, max: 100, step: 0.1 },
  y: { min: -100, max: 100, step: 0.1 },
});
Movement.addInput(Settings, 'gravity',  {
  x: { min: -1, max: 1, step: 0.01 },
  y: { min: -1, max: 1, step: 0.01 },
});

// Display settings
const Display = Pane.addFolder({
  title: 'Display',
  expanded: true,
});
const Area = Display.addInput(Settings, 'area', {
  options: {
    All: 'all',
    Edges: 'top top right bottom bottom left',
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
  },
});
const EdgeOffsets = Display.addFolder({
  title: 'Edge Offsets',
  expanded: true,
  hidden: Settings.area == 'all',
});
Area.on('change', (ev) => {
  EdgeOffsets.hidden = ev.value == 'all';
});
EdgeOffsets.addInput(Settings, 'eo_top', { label: 'Top', min: -200, max: 200, step: 1 });
EdgeOffsets.addInput(Settings, 'eo_right', { label: 'Right', min: -200, max: 200, step: 1 });
EdgeOffsets.addInput(Settings, 'eo_bottom', { label: 'Bottom', min: -200, max: 200, step: 1 });
EdgeOffsets.addInput(Settings, 'eo_left', { label: 'Left', min: -200, max: 200, step: 1 });
Display.addInput(Settings, 'text');
Display.addInput(Settings, 'text_color');
Display.addInput(Settings, 'size', { min: 1, max: 100, step: 1 });
Display.addInput(Settings, 'max_rotation', { min: 0, max: 180, step: 1 });
Display.addInput(Settings, 'rotate_speed', { min: 0, max: 2, step: 0.01 });
Display.addInput(Settings, 'amount', { min: 1, max: 1000, step: 1 });
Display.addInput(Settings, 'max_age', { min: 500, max: 10000, step: 50 });
Display.addInput(Settings, 'fade', { min: 0, max: 100, step: 1 });

// Performance settings
const Performance = Pane.addFolder({
  title: 'Performance',
  expanded: true,
});
const FPS = Performance.addInput(Settings, 'fps', { min: 10, max: 144, step: 1 });
FPS.on('change', (ev) => {
  Values.mspf = Math.floor(1000 / ev.value) - 1;
});
const fpsGraph = Performance.addBlade({
  view: 'fpsgraph',
  label: 'current',
  lineCount: 3,
});

// Output settings
const Output = Pane.addFolder({
  title: 'Output',
  expanded: true,
});
const uriComponent = Output.addMonitor(Values, 'url_address', {
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

    // calculate starting positions
    // calculate x
    switch (side) {
      case 'left':
        this.x = Math.random() * (Settings.eo_left.max - Settings.eo_left.min) + Settings.eo_left.min;
        break;
      case 'right':
        this.x = canvas.width - (Math.random() * (Settings.eo_right.max - Settings.eo_right.min) + Settings.eo_right.min);
        break;
      case 'top':
      case 'bottom':
      default:
        this.x = Math.random() * canvas.width;
        break;
    }

    // calculate y
    switch (side) {
      case 'top':
        this.y = Math.random() * (Settings.eo_top.max - Settings.eo_top.min) + Settings.eo_top.min;
        break;
      case 'bottom':
        this.y = canvas.height - (Math.random() * (Settings.eo_bottom.max - Settings.eo_bottom.min) + Settings.eo_bottom.min);
        break;
      case 'left':
      case 'right':
      default:
        this.y = Math.random() * canvas.height;
        break;
    }

    // Establish velocities, gravity, size etc.
    this.vel_x = Settings.velocity.x / 500;
    this.vel_y = Settings.velocity.y / 500;

    this.grav_x = Settings.gravity.x / 5000;
    this.grav_y = Settings.gravity.y / 5000;

    this.size = Settings.size.min + (Math.random() * (Settings.size.max - Settings.size.min));
    this.opacity = 0;
    // Calculate at what time we should be fully faded in
    this.fade_in_time = Settings.max_age * (Settings.fade.min / 100);
    this.fade_in_amount = 1 / this.fade_in_time;
    this.fade_out_time = Settings.max_age * (Settings.fade.max / 100);
    this.fade_out_amount = 1 / (Settings.max_age - this.fade_out_time);

    this.id = particleIndex;
    this.age = 0;
    this.delay = Math.random() * Settings.max_age;

    this.angle = (Math.random() * (Settings.max_rotation * 2) - Settings.max_rotation) * (Math.PI / 180);
    this.rotation = this.angle / (Settings.max_age / Settings.rotate_speed);

    // Add new particle to the index
    particles[particleIndex++] = this;
  }

  // Some prototype methods for the particle's "draw" function
  Particle.prototype.draw = function(delta) {
    if (this.delay > 0) {
      this.delay -= delta;
      return;
    }
    // Move the particle
    this.x += this.vel_x * delta;
    this.y += this.vel_y * delta;

    // Adjust for gravity
    this.vel_x += this.grav_x * delta;
    this.vel_y += this.grav_y * delta;

    
    this.angle -= this.rotation * delta;

    // Age the particle
    this.age += delta;

    // If Particle is old, delete it so we can get a new one
    if (this.age >= Settings.max_age || (this.y + this.size) < 0) {
      delete particles[this.id];
    }

    // calculate opacity
    if (this.age <= this.fade_in_time)
      this.opacity += this.fade_in_amount * delta;
    else if (this.age >= this.fade_out_time)
      this.opacity -= this.fade_out_amount * delta;
    else this.opacity = 1;

    // Spawn the particle
    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.angle);
    context.font = `${this.size}px Arial`;
    context.fillStyle = `rgba(${Settings.text_color.r}, ${Settings.text_color.g}, ${Settings.text_color.b}, ${this.opacity})`;
    context.textAlign = 'center';
    context.fillText(this.text, 0, 0);
    context.restore();
  };

  // the last frame time
  let lastFrameTime = 0;
  function update(time){
    fpsGraph.begin();
    const delta = time - lastFrameTime;
    //skip the frame if the call is too early
    if(delta < Values.mspf){
      return requestAnimationFrame(update);
    }
  
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
      particles[i].draw(delta);
    }

    fpsGraph.end();
    // Update last frame time
    lastFrameTime = time;
    // start next frame
    requestAnimationFrame(update);
  }
  // start animation
  requestAnimationFrame(update);

  // Update the canvas size when window resized
  let rt;
  window.onresize = () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }, 50);
  };
};

// #endregion Adding the particles
