gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const blocs = gsap.utils.toArray('.bloc');
const DURADA_CANVI = 1;
const VOLUM_AMBIENT = 0.35; // 0 = silenci, 1 = volum original
const DURADA_FADE = 800; // mil·lisegons que triga el so a apagar-se en sortir d'un bloc
let blocActiu = 0;
let enTransicio = false;

// ---------------------------------------------------------------------------
// SO
// ---------------------------------------------------------------------------
// Cada bloc té una llista de pistes: la locució i, quan hi sigui, el so ambient.
// html5: true fa que el so funcioni també obrint la web amb doble clic.
const locucions = [];
const pistes = blocs.map((bloc, i) => {
  const llista = [];
  if (bloc.dataset.locucio) {
    locucions[i] = new Howl({ src: [bloc.dataset.locucio], html5: true });
    llista.push(locucions[i]);
  }
  if (bloc.dataset.ambient) {
    llista.push(new Howl({ src: [bloc.dataset.ambient], html5: true, loop: true, volume: VOLUM_AMBIENT }));
  }
  return llista;
});

// El navegador no deixa sonar res fins que l'usuari ha clicat a la pàgina
let iniciat = false;
let blocSonant = null;

// Cada pista recorda el seu volum per recuperar-lo després d'un fade out
pistes.flat().forEach((pista) => { pista.volumBase = pista.volume(); });

// Fade out d'una pista i, en acabar, l'atura i li torna el volum.
// El número de torn evita aturar-la si mentrestant ha tornat a sonar.
function fondre(pista) {
  pista.torn = (pista.torn || 0) + 1;
  if (!pista.playing()) {
    pista.stop();
    return;
  }
  const torn = pista.torn;
  pista.fade(pista.volume(), 0, DURADA_FADE);
  pista.once('fade', () => {
    if (pista.torn !== torn) return;
    pista.stop();
    pista.volume(pista.volumBase);
  });
}

function aturarSo() {
  if (blocSonant !== null) pistes[blocSonant].forEach(fondre);
  blocSonant = null;
}

function sonarBloc(i) {
  if (!iniciat || i === blocSonant) return;
  aturarSo();
  blocSonant = i;
  pistes[i].forEach((pista) => {
    pista.torn = (pista.torn || 0) + 1; // anul·la un fade out pendent
    pista.stop();
    pista.volume(pista.volumBase);
    pista.play();
  });
}

// ---------------------------------------------------------------------------
// SUBTÍTOLS
// ---------------------------------------------------------------------------
// Cada bloc carrega el seu fitxer WebVTT. Adaptat de llegirVTT del prototip (web_previa).
function llegirVTT(text) {
  const segons = (s) => s.split(':').reverse().reduce((acc, v, i) => acc + parseFloat(v) * 60 ** i, 0);
  return text.replace(/\r/g, '').split('\n\n').map((bloc) => {
    const linies = bloc.split('\n');
    const i = linies.findIndex((l) => l.includes('-->'));
    if (i < 0) return null;
    const [inici, fi] = linies[i].split('-->').map((t) => segons(t.trim().split(' ')[0]));
    return { inici, fi, text: linies.slice(i + 1).join('\n') };
  }).filter(Boolean);
}

const subtitols = document.querySelector('.subtitols');
const cues = blocs.map(() => []);

blocs.forEach((bloc, i) => {
  if (!bloc.dataset.subtitols) return;
  fetch(bloc.dataset.subtitols)
    .then((resposta) => resposta.text())
    .then((text) => { cues[i] = llegirVTT(text); })
    .catch(() => console.warn(`No s'han pogut carregar els subtítols: ${bloc.dataset.subtitols}`));
});

let textActual = '';
let subtitolsActius = true; // els subtítols surten per defecte

function mostrarSubtitol(text) {
  const visible = subtitolsActius && Boolean(text);
  if (text === textActual && subtitols.hidden === !visible) return;
  textActual = text;
  subtitols.textContent = text;
  subtitols.hidden = !visible;
}

// Botó per mostrar o amagar els subtítols
const btnSubtitols = document.getElementById('btn-subtitols');
btnSubtitols.addEventListener('click', () => {
  subtitolsActius = !subtitolsActius;
  btnSubtitols.textContent = subtitolsActius ? 'Amaga els subtítols' : 'Mostra els subtítols';
});

// Botó per silenciar o activar tot el so (locucions i ambients)
const btnSo = document.getElementById('btn-so');
let silenciat = false;
btnSo.addEventListener('click', () => {
  silenciat = !silenciat;
  Howler.mute(silenciat);
  btnSo.textContent = silenciat ? 'Activa el so' : 'Silencia el so';
});

// A cada fotograma es mostra el subtítol que correspon al temps de la locució
gsap.ticker.add(() => {
  const locucio = blocSonant !== null ? locucions[blocSonant] : null;
  let text = '';
  if (locucio && locucio.playing()) {
    const t = locucio.seek();
    const cue = cues[blocSonant].find((c) => t >= c.inici && t < c.fi);
    if (cue) text = cue.text;
  }
  mostrarSubtitol(text);
});

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

document.getElementById('btn-comencar').addEventListener('click', () => anarA(1)); // 1 = Avui
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

// Cada vídeo de fons només es reprodueix quan el seu bloc és l'actiu
function activarBloc(i) {
  blocActiu = i;
  punts.forEach((boto, j) => boto.setAttribute('aria-current', j === i));
  blocs.forEach((bloc, j) => {
    const video = bloc.querySelector('.video-fons');
    if (!video) return;
    if (j === i) video.play().catch(() => {});
    else video.pause();
  });
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
