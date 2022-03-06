// #region Settings

// Our default settings
const Settings = {
  // Movement
  fps: 30,
};
const DefaultSettings = JSON.parse(JSON.stringify(Settings));
const Values = {
  mspf: Math.floor(1000 / Settings.fps),
  // Performance
  ms_per_frame: 0,
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
const FPS = Movement.addInput(Settings, 'fps', { min: 10, max: 144, step: 1 });
FPS.on('change', (ev) => {
  Values.mspf = Math.floor(1000 / ev.value);
});

// Performance settings
const Performance = Pane.addFolder({
  title: 'Performance',
  expanded: true,
});
Performance.addMonitor(Values, 'ms_per_frame', {
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

// #region Canvas
// Wait until our document is ready
window.onload = () => {
  // Initialise an empty canvas and place it on the page
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  // the last frame time
  let lastFrameTime = 0;
  function update(time){
    //skip the frame if the call is too early
    if(time - lastFrameTime < Values.mspf - 1){
      return requestAnimationFrame(update);
    }

    // Set a transparent background
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw to our canvas

    // calculate how long it took between frames
    Values.ms_per_frame = time - lastFrameTime;
    lastFrameTime = time;

    // get next frame
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update); // start animation
};

// #endregion Canvas
