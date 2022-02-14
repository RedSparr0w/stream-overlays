document.addEventListener("DOMContentLoaded", function(event) {
  /* Adding hearts */
  const addHearts = (side) => {
    var size = Math.floor(Math.random() * 20) + 20;
    var offset = Math.random() * 100;
    const rotation = (Math.random() * 30) - 15;

    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.style.fontSize = `${size}px`;
    heart.style.transform = `rotate(${rotation}deg)`;

    switch (side) {
      case 'top':
      case 'bottom':
        heart.style.left = `${offset}%`;
        break;
      case 'left':
      case 'right':
        heart.style.top = `${offset}%`;
        break;
    }

    switch (side) {
      case 'top':
        heart.style.top = '0px';
        break;
      case 'bottom':
        heart.style.bottom = '10px';
        break;
      case 'left':
        heart.style.left = `${Math.random() * 25}px`;
        break;
      case 'right':
        heart.style.right = `${Math.random() * 25}px`;
        break;
    }

    document.body.appendChild(heart);
  }

  const density = 1;
  for (let i = 0; i < (window.innerWidth / 25) * density; i++) {
    setTimeout(() => addHearts('top'), i * 66);
  }
  for (let i = 0; i < (window.innerWidth / 25) * density; i++) {
    setTimeout(() => addHearts('bottom'), i * 66);
  }
  for (let i = 0; i < (window.innerHeight / 35) * density; i++) {
    setTimeout(() => addHearts('left'), i * 66);
  }
  for (let i = 0; i < (window.innerHeight / 35) * density; i++) {
    setTimeout(() => addHearts('right'), i * 66);
  }

  new TextSetting('Symbol', 'content', '♥', {prefix: '"', suffix: '"'});
  new RangeSetting('Speed', 'speed', 5, {min: 0.5, max: 10, step: 0.1, suffix: 's'});
  new ColorSetting('Color', 'color', '#ff69b4');

  // Hide the controls
  const hideControls = new BooleanSetting(undefined, 'hide-controls', true);
  hideControls.value ? document.getElementById('controls').remove() : document.getElementById('controls').style.opacity = '1';
  hideControls.update(true);
});