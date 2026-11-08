const blocs = document.querySelectorAll('.bloc');

// El bloc actual és el que té la part superior més a prop de la posició de la pàgina
function blocActual() {
  return Math.round(window.scrollY / 1000);
}

function anarA(i) {
  const desti = Math.min(Math.max(i, 0), blocs.length - 1);
  blocs[desti].scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('btn-amunt').addEventListener('click', () => anarA(blocActual() - 1));
document.getElementById('btn-avall').addEventListener('click', () => anarA(blocActual() + 1));

// Un botó per a cada bloc, amb el mateix número que el seu títol
const llistaPunts = document.querySelector('.punts');

blocs.forEach((bloc, i) => {
  const li = document.createElement('li');
  const boto = document.createElement('button');
  boto.type = 'button';
  boto.textContent = i;
  boto.setAttribute('aria-label', `Anar a ${bloc.querySelector('h1, h2').textContent}`);
  boto.addEventListener('click', () => anarA(i));
  li.appendChild(boto);
  llistaPunts.appendChild(li);
});
