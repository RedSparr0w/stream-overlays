let content, speed, color, multiplier;

const createParticle = (x, y, type, value) => {
  const particle = document.createElement('particle');
  document.body.appendChild(particle);
  let destinationX = 0;
  let destinationY = -((Math.random() * 25) + 25);
  let rotation = (Math.random() - 0.5) * 90;
  let delay = Math.random() * 1e3;
  
  particle.innerHTML = type.split('')[Math.floor(Math.random() * type.length)];
  particle.style.fontSize = `${Math.random() * 20 + 15}px`;
  const animation = particle.animate([
    {
      transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${-rotation}deg)`,
      opacity: 0,
    },
    {
      offset: 0.2,
      opacity: 1,
    },
    {
      offset: 0.5,
      opacity: 1,
    },
    {
      transform: `translate(-50%, -50%) translate(${x + destinationX}px, ${y + destinationY}px) rotate(${rotation}deg)`,
      opacity: 0,
    }
  ], {
    duration: (speed.value * 500) + (Math.random() * speed.value * 500),
    delay: delay
  });
  animation.onfinish = (e) =>{
    // createParticle(x, y, type, value);
    removeParticle(e);
  }
}
function removeParticle (e) {
  e.srcElement.effect.target.remove();
}
document.addEventListener("DOMContentLoaded", function(event) {// Our settings
  content = new TextSetting('Symbols', 'content', '♥xo', {prefix: '"', suffix: '"'});
  speed = new RangeSetting('Speed', 'speed', 5, {min: 0.5, max: 10, step: 0.1, suffix: 's'});
  multiplier = new RangeSetting('Multiplier', 'multiplier', 10, {min: 1, max: 100, step: 1, suffix: '×'});
  color = new ColorSetting('Color', 'color', '#ff69b4');
  // Hide the controls
  const hideControls = new BooleanSetting(undefined, 'hide-controls', true);
  hideControls.value ? document.getElementById('controls').remove() : document.getElementById('controls').style.opacity = '1';
  setTimeout(() => hideControls.update(true), 1);

  /* Adding hearts */
  const addHearts = (side) => {
    let x = 0;
    let y = 0;
    switch (side) {
      case 'top':
      case 'bottom':
        x = Math.random() * window.innerWidth;
        break;
      case 'left':
      case 'right':
        y = Math.random() * window.innerHeight;
        break;
    }

    switch (side) {
      case 'top':
        y = 20 + (Math.random() * 20);
        break;
      case 'bottom':
        y = window.innerHeight - (Math.random() * 10);
        break;
      case 'left':
        x = Math.random() * 50;
        break;
      case 'right':
        x = window.innerWidth - (Math.random() * 50);
        break;
    }

    createParticle(x, y, content.value);
  }

  setInterval(() => {
    for (let i = 0; i < multiplier.value; i++) {
      setTimeout(() => {
        addHearts('top')
        addHearts('top')
        addHearts('bottom')
        addHearts('bottom')
        addHearts('left')
        addHearts('right')
      }, i);
    }
  }, 1000);

});