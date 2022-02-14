const addHearts = setInterval(function() {
  var size = Math.floor(Math.random() * 15) + 10;
  var left = Math.floor(Math.random() * 100) + 1;
  var color = Math.floor(Math.random() * 25) + 100;
  var time = Math.floor(Math.random() * 15) + 15;

  const heart = document.createElement('div');
  heart.className = 'heart';
  heart.style.width = `${size}px`;
  heart.style.height = `${size}px`;
  heart.style.left = `${left}%`;
  heart.style.background = `hotpink`;
  heart.style.animation = `love ${time}s ease`;

  document.body.appendChild(heart);

  setTimeout(() => heart.remove(), time * 1e3);
}, 250);