document.addEventListener("DOMContentLoaded", function(event) {
  // Overlay contents here

  // Hide the controls
  const hideControls = new BooleanSetting(undefined, 'hide-controls', true);
  hideControls.value ? document.getElementById('controls').remove() : document.getElementById('controls').style.opacity = '1';
  hideControls.update(true);
});