gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const blocs = gsap.utils.toArray('.bloc');
const DURADA_CANVI = 1;
const VOLUM_AMBIENT = 0.35; // 0 = silenci, 1 = volum original
let blocActiu = 0;
let enTransicio = false;

// ---------------------------------------------------------------------------
// SO
// ---------------------------------------------------------------------------
// Cada bloc té una llista de pistes: la locució i, quan hi sigui, el so ambient.
// html5: true fa que el so funcioni també obrint la web amb doble clic.
const pistes = blocs.map((bloc) => {
  const llista = [];
  if (bloc.dataset.locucio) {
    llista.push(new Howl({ src: [bloc.dataset.locucio], html5: true }));
  }
  if (bloc.dataset.ambient) {
    llista.push(new Howl({ src: [bloc.dataset.ambient], html5: true, loop: true, volume: VOLUM_AMBIENT }));
  }
  return llista;
});

// El navegador no deixa sonar res fins que l'usuari ha clicat a la pàgina
let iniciat = false;
let blocSonant = null;

function aturarSo() {
  if (blocSonant !== null) pistes[blocSonant].forEach((pista) => pista.stop());
  blocSonant = null;
}

function sonarBloc(i) {
  if (!iniciat || i === blocSonant) return;
  aturarSo();
  blocSonant = i;
  pistes[i].forEach((pista) => pista.play());
}

// ---------------------------------------------------------------------------
// NAVEGACIÓ
// ---------------------------------------------------------------------------
// Desplaçament animat fins a un bloc. Si n'hi ha un en marxa, el nou el substitueix.
// El so del bloc comença en arribar, per no sentir els blocs que es travessen.
function anarA(i) {
  const desti = gsap.utils.clamp(0, blocs.length - 1, i);
  iniciat = true;
  enTransicio = true;
  if (desti !== blocSonant) aturarSo();
  gsap.to(window, {
    scrollTo: { y: blocs[desti], autoKill: false },
    duration: DURADA_CANVI,
    ease: 'power2.inOut',
    overwrite: true,
    onComplete: () => {
      enTransicio = false;
      sonarBloc(desti);
    },
  });
}

document.getElementById('btn-comencar').addEventListener('click', () => anarA(1));
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
  if (!enTransicio) sonarBloc(i);
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
