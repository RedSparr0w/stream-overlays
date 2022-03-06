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
  history.replaceState({}, undefined, uri);
};

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

// Update the GUi (force onchange events)
const updateGUI = (menu) => {
  menu.open();
  for(const folder in menu.__folders) {
    updateGUI(menu.__folders[folder]);
  }
  for(const controller of menu.__controllers) {
    controller.setValue(controller.getValue());
  }
};
updateGUI(GUI);
