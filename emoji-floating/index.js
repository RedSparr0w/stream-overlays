// Our default settings
const Settings = {
  // Movement
  render_time: 20,
  velocity_x: 0,
  velocity_y: -3,
  gravity: -0.02,
  // Display
  text: '❤❤xo',
  color: [244, 0, 147],
  size: 40,
  size_variance: 15,
  amount: 200,
  max_age: 3000,
  fade_in: 20,
  fade_out: 80,
}

// To get our user specified values
const PageParams = new URLSearchParams(window.location.search);
Object.keys(Settings).forEach(k => {
  try {
    const value = PageParams.get(k);
    if (value != undefined) Settings[k] = JSON.parse(PageParams.get(k));
  }catch(e){}
});

// Update the current URI
UpdateURI = () => {
  const params = {};
  Object.keys(Settings).forEach(k => {
    if (typeof Settings[k] == 'function') return;
    params[k] = JSON.stringify(Settings[k]);
  });
  const uri = `${location.origin}${location.pathname}?${new URLSearchParams(params).toString()}`;
  history.replaceState({}, undefined, uri);
}

// Creating a GUI with our settings
const GUI = new dat.GUI({name: 'Particles controls'});

const Movement = GUI.addFolder('Movement');
Movement.add(Settings, 'render_time', 1, 50).onChange(UpdateURI);
Movement.add(Settings, 'velocity_x', -10, 10, 0.01).onChange(UpdateURI);
Movement.add(Settings, 'velocity_y', -10, 10, 0.01).onChange(UpdateURI);
Movement.add(Settings, 'gravity', -1, 1, 0.01).onChange(UpdateURI);

const Display = GUI.addFolder('Display');
Display.add(Settings, 'text').onChange(UpdateURI);
Display.addColor(Settings, 'color').onChange(UpdateURI);
Display.add(Settings, 'size', 5, 100).onChange(UpdateURI);
Display.add(Settings, 'size_variance', 0, 50).onChange(UpdateURI);
Display.add(Settings, 'amount', 1, 1000).onChange(UpdateURI);
Display.add(Settings, 'max_age', 500, 10000).onChange(UpdateURI);
Display.add(Settings, 'fade_in', 0, 100).onChange(v => {
  if (v > Settings.fade_out) Settings.fade_out = v;
  GUI.updateDisplay();
  UpdateURI();
});
Display.add(Settings, 'fade_out', 0, 100).onChange(v => {
  if (v < Settings.fade_in) Settings.fade_in = v;
  GUI.updateDisplay();
  UpdateURI();
});


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
  let particles = {},
      particleIndex = 0;

  // Set up a function to create multiple particles
  function Particle() {
    this.text = Settings.text.split('')[Math.floor(Math.random() * Settings.text.length)];

    // Establish starting positions and velocities
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;

    this.vx = Settings.velocity_x * Settings.render_time / 100;
    this.vy = Settings.velocity_y * Settings.render_time / 100;

    this.size = Settings.size + (Math.random() - 0.5) * (Settings.size_variance * 2);
    this.opacity = 0;
    this.fade_in = (Settings.max_age/100) * Settings.fade_in;
    this.fade_in_amount = 1 / (this.fade_in / Settings.render_time);
    this.fade_out = (Settings.max_age/100) * Settings.fade_out;
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
    context.fillStyle = `rgba(${Settings.color[0]}, ${Settings.color[1]}, ${Settings.color[2]}, ${this.age <= this.fade_in ? this.opacity += this.fade_in_amount : this.age >= this.fade_out ? this.opacity -= this.fade_out_amount : this.opacity})`;
    context.textAlign = 'center';
    context.fillText(this.text, this.x, this.y);
  }

  drawCanvas = () => {
    // Fill the backgorund
    // context.fillStyle = "rgba(20,20,20,0.8)";
    // context.fillRect(0, 0, canvas.width, canvas.height);
    // Transparent background
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the particles
    while (Object.values(particles).length < Settings.amount) {
      new Particle();
    }

    for (var i in particles) {
      particles[i].draw();
    }
    setTimeout(drawCanvas, Settings.render_time);
  }
  drawCanvas();
};
