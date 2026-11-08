gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const blocs = gsap.utils.toArray('.bloc');
const DURADA_CANVI = 1;
let blocActiu = 0;

// Desplaçament animat fins a un bloc. Si n'hi ha un en marxa, el nou el substitueix
function anarA(i) {
  const desti = gsap.utils.clamp(0, blocs.length - 1, i);
  gsap.to(window, {
    scrollTo: { y: blocs[desti], autoKill: false },
    duration: DURADA_CANVI,
    ease: 'power2.inOut',
    overwrite: true,
  });
}

document.getElementById('btn-amunt').addEventListener('click', () => anarA(blocActiu - 1));
document.getElementById('btn-avall').addEventListener('click', () => anarA(blocActiu + 1));

// Un botó per a cada bloc, amb el mateix número que el seu títol
const llistaPunts = document.querySelector('.punts');

const punts = blocs.map((bloc, i) => {
  const li = document.createElement('li');
  const boto = document.createElement('button');
  boto.type = 'button';
  boto.textContent = i;
  boto.setAttribute('aria-label', `Anar a ${bloc.querySelector('h1, h2').textContent}`);
  boto.addEventListener('click', () => anarA(i));
  li.appendChild(boto);
  llistaPunts.appendChild(li);
  return boto;
});

function activarBloc(i) {
  blocActiu = i;
  punts.forEach((boto, j) => boto.setAttribute('aria-current', j === i));
}

// El bloc actiu és el que travessa el centre de la pantalla
blocs.forEach((bloc, i) => {
  ScrollTrigger.create({
    trigger: bloc,
    start: 'top center',
    end: 'bottom center',
    onToggle: (self) => { if (self.isActive) activarBloc(i); },
  });
});

activarBloc(0);
