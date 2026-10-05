/* Pétanque Atout — pointage des parties et statistiques.
   Source de l'application : ce fichier est préparé par « npm run build » (voir build.mjs),
   qui produit app.js et app.css. Ne pas modifier app.js à la main. */

const { useState, useEffect, useMemo, useRef } = React;

/* ═══════════════════════════════════════════════
   UTILITAIRES
   ═══════════════════════════════════════════════ */

const STORAGE_KEY = 'carteAppData';
const GH_KEY = 'petanqueGitHub';
const GH_PENDING_KEY = 'petanqueGitHubEnAttente';
const GH_LAST_KEY = 'petanqueGitHubDerniere';
const FANTOME = 'Fantôme';
const PKS = ['partie1', 'partie2'];
const PLABEL = { partie1: 'Partie 1', partie2: 'Partie 2' };

function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtDate(iso) {
  if (!iso) return '';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function fmtHeure(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtDateHeure(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const day = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return `${fmtDate(day)} à ${fmtHeure(iso)}`;
}

function fmt1(n) { return n.toFixed(1).replace('.', ','); }

/* Comparaison de noms sans accents ni majuscules (« fantome » = « Fantôme ») */
const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const EMPTY_SCORE = () => ({ pique:null, trefle:null, carreau:null, coeur:null, toutAtout:null, nb15:null });

const SUITS = [
  { key:'pique',    label:'♠ Pique',    mid:'Pique',   sym:'♠', color:'text-gray-300'  },
  { key:'trefle',   label:'♣ Trèfle',   mid:'Trèfle',  sym:'♣', color:'text-green-400' },
  { key:'carreau',  label:'♦ Carreau',  mid:'Carreau', sym:'♦', color:'text-blue-400'  },
  { key:'coeur',    label:'♥ Cœur',     mid:'Cœur',    sym:'♥', color:'text-red-400'   },
  { key:'toutAtout',label:'✦ T. Atout', mid:'T.Atout', sym:'✦', color:'text-yellow-400'},
];

/* Le Fantôme équilibre les équipes quand le nombre de joueurs est impair ;
   les autres joueurs jouent un tour chacun à sa place. Il est toujours dans la liste
   et a ses propres statistiques. */
const isFantome = (j) => !!j && (j.fantome || j.nom === FANTOME);
/* Joueur effacé de la liste : son nom et ses données restent partout ailleurs */
const isRetire = (j) => !!j && !!j.retire && !isFantome(j);

const sumSuits = (s) => SUITS.reduce((a, su) => a + ((s && s[su.key]) || 0), 0);

/* Le Fantôme est toujours placé en dernier dans son équipe */
function orderTeam(ids, joueurs) {
  const ghost = (id) => isFantome(joueurs.find(j => j.id === id));
  return [...ids.filter(id => !ghost(id)), ...ids.filter(id => ghost(id))];
}

/* Une partie (feuille) est considérée jouée si au moins une manche a été saisie */
function partiePlayed(partie, pk) {
  const sc = partie.scores?.[pk] || {};
  return Object.values(sc).some(s => SUITS.some(su => s?.[su.key] != null));
}

const teamIds = (p) => [...(p.equipe1 || []), ...(p.equipe2 || [])];

/* Feuille complète : toutes les manches de tous les joueurs sont saisies */
function pkComplete(partie, pk) {
  const sc = partie.scores?.[pk] || {};
  return teamIds(partie).every(id => SUITS.every(su => sc[id]?.[su.key] != null));
}
const partieComplete = (p) => PKS.every(pk => pkComplete(p, pk));

/* Moment de création d'une partie (les anciennes données n'ont que la date) */
const partieTime = (p) => {
  const t = Date.parse(p.createdAt || `${p.date}T12:00:00`);
  return Number.isNaN(t) ? 0 : t;
};

const cellKey = (pk, id, suit) => `${pk}|${id}|${suit}`;

/* Lecture d'un pointage saisi : les nombres négatifs sont permis (trous à −5) */
function parseScore(v) {
  if (v === '' || v == null) return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

/* ── Planche : 2 trous par couleur, 1 trou à 15, 2 trous à −5 ──
   Tous les trous comptent dans toutes les manches ; les trous de la couleur de la manche
   valent le double, et tout vaut le double au Tout atout. Un trou ne reçoit qu'une boule par tour. */
const HOLES = [
  { k:'pique', v:4 },   { k:'pique', v:4 },
  { k:'trefle', v:6 },  { k:'trefle', v:6 },
  { k:'carreau', v:8 }, { k:'carreau', v:8 },
  { k:'coeur', v:10 },  { k:'coeur', v:10 },
  { k:'quinze', v:15 },
  { k:'moins5', v:-5 }, { k:'moins5', v:-5 },
];
const BOULES = 3;

/* Pour chaque manche : totaux possibles avec le 15 et sans le 15 (3 boules, trous distincts) */
const QUINZE = Object.fromEntries(SUITS.map(su => {
  const val = (h) => h.v * (su.key === 'toutAtout' || h.k === su.key ? 2 : 1);
  const avec = new Set(), sans = new Set();
  const explore = (debut, restantes, total, a15) => {
    (a15 ? avec : sans).add(total);
    if (restantes === 0) return;
    for (let i = debut; i < HOLES.length; i++) {
      explore(i + 1, restantes - 1, total + val(HOLES[i]), a15 || HOLES[i].k === 'quinze');
    }
  };
  explore(0, BOULES, 0, false);
  return [su.key, { avec, sans }];
}));

/* Le total est-il possible dans cette manche ? */
function totalPossible(suit, val) {
  const q = QUINZE[suit];
  return val == null || !q || q.avec.has(val) || q.sans.has(val);
}

/* 'oui' : le total exige un 15 ; 'non' : il l'exclut ; 'peut-etre' : il faut demander */
function quinzeKind(suit, val) {
  const q = QUINZE[suit];
  if (val == null || !q) return 'non';
  const a = q.avec.has(val), b = q.sans.has(val);
  if (a && b) return 'peut-etre';
  return a ? 'oui' : 'non';
}

/* Le 15 d'une manche est mémorisé par case (highlight15Fields) ; Nb 15 en est déduit.
   nb15Extra conserve les 15 ajoutés à la main dans les anciennes données. */
function syncNb15(s) {
  s.nb15 = (s.highlight15Fields || []).length + (s.nb15Extra || 0);
}

/* ── Saisons : d'octobre à mai-juin ; une nouvelle saison commence avec le bouton ── */
function saisonNom(debutIso) {
  const d = new Date(debutIso);
  const y = d.getFullYear();
  return d.getMonth() >= 6 ? `Saison ${y}-${y + 1}` : `Saison ${y - 1}-${y}`;
}

function saisonsTriees(data) {
  return [...(data.saisons || [])].sort((a, b) => Date.parse(a.debut) - Date.parse(b.debut));
}

/* Saison d'une partie : la dernière saison commencée avant la partie */
function saisonDe(saisons, partie) {
  const t = partieTime(partie);
  let s = saisons[0];
  saisons.forEach(x => { if (Date.parse(x.debut) <= t) s = x; });
  return s?.id;
}

/* ── Mise à niveau des données enregistrées par les versions précédentes ── */

function migrateScores(data) {
  (data.parties || []).forEach(p => PKS.forEach(pk => {
    Object.values(p.scores?.[pk] || {}).forEach(s => {
      if (!s) return;
      const hl = s.highlight15Fields || (s.highlight15Field ? [s.highlight15Field] : []);
      s.highlight15Fields = [...new Set(hl)];
      delete s.highlight15Field;
      if (s.nb15Extra == null) {
        const extra = (s.nb15 || 0) - s.highlight15Fields.length;
        if (extra > 0) s.nb15Extra = extra;
      }
      syncNb15(s);
    });
  }));
  return data;
}

/* Joueurs supprimés par une ancienne version : leurs pointages existent encore dans les parties.
   On les recrée (effacés de la liste) pour qu'ils réapparaissent dans les statistiques. */
function recoverPlayers(data) {
  const known = new Set(data.joueurs.map(j => j.id));
  let n = data.joueurs.filter(j => /^Joueur supprimé \d+$/.test(j.nom)).length;
  data.parties.forEach(p => teamIds(p).forEach(id => {
    if (known.has(id)) return;
    known.add(id);
    data.joueurs.push({ id, nom: `Joueur supprimé ${++n}`, retire: true });
  }));
  return data;
}

/* Le Fantôme existe toujours dans la liste des joueurs */
function ensureFantome(data) {
  const g = data.joueurs.find(j => j.fantome || j.nom === FANTOME);
  if (g) { g.fantome = true; g.nom = FANTOME; delete g.retire; }
  else data.joueurs.push({ id: uid(), nom: FANTOME, fantome: true });
  return data;
}

/* Première saison : toutes les parties déjà enregistrées */
function ensureSaisons(data) {
  if (data.saisons && data.saisons.length) return data;
  const first = data.parties.length ? Math.min(...data.parties.map(partieTime)) : Date.now();
  const d = new Date(first); d.setHours(0, 0, 0, 0);
  const debut = d.toISOString();
  data.saisons = [{ id: uid(), debut, nom: saisonNom(debut) }];
  return data;
}

function migrateData(d) {
  const data = { joueurs: d.joueurs || [], parties: d.parties || [], presences: d.presences || {}, saisons: d.saisons || [], supprimees: d.supprimees || [] };
  return ensureSaisons(ensureFantome(recoverPlayers(migrateScores(data))));
}

/* ═══════════════════════════════════════════════
   FUSION DES DONNÉES DE PLUSIEURS APPAREILS
   Chaque appareil (Patrice, un ami…) enregistre dans le même fichier du dépôt privé.
   Avant d'envoyer, on fusionne avec ce qui s'y trouve déjà : rien n'est écrasé.
   ═══════════════════════════════════════════════ */

/* Remplace des identifiants de joueurs (doublons d'un appareil à l'autre) partout */
function remapIds(d, map) {
  if (!Object.keys(map).length) return d;
  const m = (id) => map[id] || id;
  const remapObj = (o) => { const n = {}; Object.entries(o || {}).forEach(([k, v]) => { n[m(k)] = v; }); return n; };
  d.parties.forEach(p => {
    p.equipe1 = (p.equipe1 || []).map(m);
    p.equipe2 = (p.equipe2 || []).map(m);
    PKS.forEach(pk => { if (p.scores?.[pk]) p.scores[pk] = remapObj(p.scores[pk]); });
  });
  Object.keys(d.presences || {}).forEach(date => { d.presences[date] = remapObj(d.presences[date]); });
  return d;
}

const partieModif = (p) => Date.parse(p.modifie || p.createdAt || `${p.date}T12:00:00`) || 0;

function mergeData(localIn, remoteIn) {
  const L = migrateData(JSON.parse(JSON.stringify(localIn)));
  const R = migrateData(JSON.parse(JSON.stringify(remoteIn)));

  /* Joueurs : réunis par identifiant (la version de cet appareil l'emporte), puis les doublons
     (même nom, ou le Fantôme de chaque appareil) sont fusionnés sous un seul identifiant. */
  const byId = new Map();
  R.joueurs.forEach(j => byId.set(j.id, { ...j }));
  L.joueurs.forEach(j => byId.set(j.id, { ...(byId.get(j.id) || {}), ...j, retire: !!j.retire }));
  const groups = {};
  [...byId.values()].forEach(j => { const k = isFantome(j) ? '\u0000fantome' : norm(j.nom); (groups[k] = groups[k] || []).push(j); });
  const map = {};
  const joueurs = [];
  Object.values(groups).forEach(g => {
    g.sort((a, b) => (a.id < b.id ? -1 : 1));
    const keep = { ...g[0] };
    if (!keep.retire || g.some(j => !isRetire(j))) delete keep.retire;
    g.slice(1).forEach(j => { map[j.id] = keep.id; });
    joueurs.push(keep);
  });
  remapIds(L, map); remapIds(R, map);

  /* Parties : réunion ; si une partie existe des deux côtés, la plus récemment modifiée l'emporte.
     Une partie supprimée sur un appareil est supprimée partout. */
  const supprimees = [...new Set([...(L.supprimees || []), ...(R.supprimees || [])])];
  const parties = new Map();
  R.parties.forEach(p => parties.set(p.id, p));
  L.parties.forEach(p => { const r = parties.get(p.id); if (!r || partieModif(p) >= partieModif(r)) parties.set(p.id, p); });

  /* Présences : réunies par date */
  const presences = { ...R.presences };
  Object.entries(L.presences || {}).forEach(([date, rec]) => { presences[date] = { ...(presences[date] || {}), ...rec }; });

  /* Saisons : réunies ; même nom → une seule saison (la plus ancienne date de début) */
  const saisons = [];
  [...R.saisons, ...L.saisons].forEach(s => {
    const same = saisons.find(x => x.id === s.id || x.nom === s.nom);
    if (!same) saisons.push({ ...s });
    else if (Date.parse(s.debut) < Date.parse(same.debut)) same.debut = s.debut;
  });

  return migrateData({
    joueurs,
    parties: [...parties.values()].filter(p => !supprimees.includes(p.id)),
    presences, saisons, supprimees,
  });
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrateData(JSON.parse(raw));
  } catch (e) { console.error(e); }
  return migrateData({});
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.error(e); }
}

/* ═══════════════════════════════════════════════
   SAUVEGARDE SUR GITHUB (dépôt privé de données)
   ═══════════════════════════════════════════════ */

const GH_DEFAULT = { token: '', repo: 'patricecouillard-code/PetanqueAtout-Data', path: 'petanque-atout.json' };

function ghConfig() {
  try { return { ...GH_DEFAULT, ...JSON.parse(localStorage.getItem(GH_KEY) || '{}') }; }
  catch (e) { return { ...GH_DEFAULT }; }
}
function ghSetConfig(c) { try { localStorage.setItem(GH_KEY, JSON.stringify(c)); } catch (e) {} }
function ghPending() { try { return localStorage.getItem(GH_PENDING_KEY) === '1'; } catch (e) { return false; } }
function ghSetPending(v) { try { v ? localStorage.setItem(GH_PENDING_KEY, '1') : localStorage.removeItem(GH_PENDING_KEY); } catch (e) {} }
function ghLast() { try { return localStorage.getItem(GH_LAST_KEY); } catch (e) { return null; } }

class GhError extends Error {
  constructor(kind, message) { super(message); this.kind = kind; }
}

function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function ghFetch(cfg, url, opts = {}) {
  try {
    return await fetch(url, {
      ...opts,
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${cfg.token.trim()}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  } catch (e) {
    throw new GhError('offline', "Pas de connexion Internet.");
  }
}

const ghAuthError = () => new GhError('auth', "GitHub refuse le jeton : il est peut-être expiré, ou n'a pas accès au dépôt de données.");

function fromBase64(b64) {
  const bin = atob((b64 || '').replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function ghUrl(cfg) {
  return `https://api.github.com/repos/${cfg.repo.trim()}/contents/${cfg.path.trim().split('/').map(encodeURIComponent).join('/')}`;
}

function ghReady() {
  const cfg = ghConfig();
  if (!cfg.token.trim()) throw new GhError('config', "La sauvegarde GitHub n'est pas configurée.");
  if (navigator.onLine === false) throw new GhError('offline', "Pas de connexion Internet.");
  return cfg;
}

/* Lit le fichier du dépôt : { sha, data } ou null s'il n'existe pas encore */
async function ghRead(cfg) {
  const r = await ghFetch(cfg, ghUrl(cfg));
  if (r.status === 404) return null;
  if (r.status === 401 || r.status === 403) throw ghAuthError();
  if (!r.ok) throw new GhError('autre', `GitHub a répondu ${r.status}.`);
  const info = await r.json();
  let data = null;
  try { data = JSON.parse(fromBase64(info.content)); } catch (e) { data = null; }
  return { sha: info.sha, data };
}

/* Récupère les données des autres appareils, sans rien envoyer */
async function ghPull() {
  const cfg = ghReady();
  const f = await ghRead(cfg);
  return f && f.data && Array.isArray(f.data.joueurs) ? f.data : null;
}

/* Fusionne avec le fichier du dépôt puis l'envoie ; retourne les données fusionnées */
async function ghPush(data) {
  const cfg = ghReady();
  const url = ghUrl(cfg);
  const message = `Sauvegarde du ${fmtDateHeure(new Date().toISOString())}`;
  for (let essai = 0; essai < 3; essai++) {
    const f = await ghRead(cfg);
    const merged = f && f.data && Array.isArray(f.data.joueurs) ? mergeData(data, f.data) : data;
    const content = toBase64(JSON.stringify(merged, null, 2));
    const r = await ghFetch(cfg, url, { method: 'PUT', body: JSON.stringify({ message, content, ...(f ? { sha: f.sha } : {}) }) });
    if (r.ok) return merged;
    /* Un autre appareil vient d'enregistrer : on relit et on refusionne */
    if ((r.status === 409 || r.status === 422) && essai < 2) continue;
    if (r.status === 401 || r.status === 403) throw ghAuthError();
    if (r.status === 404) throw new GhError('auth', "Dépôt introuvable : vérifiez le nom du dépôt et les droits du jeton.");
    throw new GhError('autre', `GitHub a répondu ${r.status}.`);
  }
  throw new GhError('autre', "Conflit avec GitHub : réessayez.");
}

/* Vérifie le jeton et le dépôt sans rien modifier */
async function ghTest() {
  const cfg = ghConfig();
  if (!cfg.token.trim()) throw new GhError('config', "Entrez d'abord le jeton.");
  const r = await ghFetch(cfg, `https://api.github.com/repos/${cfg.repo.trim()}`);
  if (r.status === 401 || r.status === 403) throw ghAuthError();
  if (r.status === 404) throw new GhError('auth', "Dépôt introuvable : vérifiez le nom du dépôt et les droits du jeton.");
  if (!r.ok) throw new GhError('autre', `GitHub a répondu ${r.status}.`);
  const info = await r.json();
  if (info.permissions && !info.permissions.push) throw new GhError('auth', "Le jeton peut lire le dépôt mais pas y écrire (droit « Contents : Read and write »).");
  return info;
}

/* ═══════════════════════════════════════════════
   COMPOSANTS PARTAGÉS
   ═══════════════════════════════════════════════ */

const BTN_V = {
  primary:   'bg-neon text-main font-bold hover:bg-neon/80',
  secondary: 'bg-gray-700 hover:bg-gray-600 font-medium',
  success:   'bg-emerald-600 hover:bg-emerald-500 text-white font-bold',
  danger:    'bg-red-700 hover:bg-red-600 text-white font-bold',
};

/* Boîte de dialogue : Tab/Maj+Tab circulent entre les boutons, Entrée valide le bouton actif, Échap annule */
function Modal({ open, title, message, buttons, initialFocus = 0, onEscape, confirmText, cancelText, onConfirm, onCancel }) {
  const boxRef = useRef(null);
  const btns = buttons || [
    ...(onCancel  ? [{ label: cancelText  || 'Annuler',   onClick: onCancel,  v: 'secondary' }] : []),
    ...(onConfirm ? [{ label: confirmText || 'Confirmer', onClick: onConfirm, v: 'primary'   }] : []),
  ];

  useEffect(() => {
    if (!open) return;
    const list = boxRef.current?.querySelectorAll('button');
    if (list && list[initialFocus]) list[initialFocus].focus();
  }, [open]);

  if (!open) return null;

  const onKey = (e) => {
    const list = [...boxRef.current.querySelectorAll('button')];
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!list.length) return;
      const i = list.indexOf(document.activeElement);
      const n = ((i < 0 ? 0 : i) + (e.shiftKey ? -1 : 1) + list.length) % list.length;
      list[n].focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      const esc = onEscape || onCancel;
      if (esc) esc();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 anim-fade"
      role="dialog" aria-modal="true" onKeyDown={onKey}>
      <div ref={boxRef} className="bg-card rounded-2xl p-6 max-w-md w-full shadow-2xl border border-accent">
        {title && <h3 className="text-lg font-bold text-neon mb-3">{title}</h3>}
        <p className="text-gray-300 mb-6 leading-relaxed whitespace-pre-line">{message}</p>
        {btns.length > 0 && (
          <div className="flex flex-wrap gap-3 justify-end">
            {btns.map((b, i) => (
              <button key={i} onClick={b.onClick}
                className={`px-5 py-2.5 rounded-xl transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-card ${BTN_V[b.v || 'secondary']}`}>
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* Message en bas de l'écran, avec éventuellement un bouton (ex. « Annuler ») */
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, toast.duration || 4000);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  const tone = toast.type === 'error' ? 'border-red-500 bg-red-950' : 'border-neon/60 bg-card';
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[min(92vw,30rem)] anim-fade" role="status" aria-live="polite">
      <div className={`flex items-center gap-3 rounded-xl border ${tone} px-4 py-3 shadow-2xl`}>
        <span className="flex-1 text-gray-100">{toast.message}</span>
        {toast.action && (
          <button onClick={() => { toast.action.onClick(); onClose(); }}
            className="px-3 py-1.5 rounded-lg bg-neon text-main font-bold hover:bg-neon/80">{toast.action.label}</button>
        )}
      </div>
    </div>
  );
}

function Btn({ onClick, children, v='primary', className='' }) {
  const base = 'w-full min-h-[48px] px-6 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.97]';
  const variants = {
    primary:   'bg-gradient-to-r from-accent to-neon/20 border border-neon/40 text-neon hover:border-neon hover:shadow-lg hover:shadow-neon/20',
    secondary: 'bg-card border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white',
    danger:    'bg-red-900/30 border border-red-500/40 text-red-400 hover:border-red-400 hover:bg-red-900/50',
    success:   'bg-emerald-900/30 border border-emerald-500/40 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-900/50',
  };
  return <button onClick={onClick} className={`${base} ${variants[v]} ${className}`}>{children}</button>;
}

/* En-tête de manche : libellé complet, nom seul (tablette) ou symbole seul (petit écran),
   pour que les en-têtes tiennent toujours sur une seule ligne */
function SuitTh({ s, className='' }) {
  return (
    <th className={`text-center ${s.color} ${className}`} title={s.label}>
      <span className="lbl-long">{s.label}</span><span className="lbl-mid">{s.mid}</span><span className="lbl-short">{s.sym}</span>
    </th>
  );
}

/* Libellé d'en-tête avec version courte pour petit écran */
function Lbl({ long, short }) {
  return <><span className="lbl-long">{long}</span><span className="lbl-mid">{long}</span><span className="lbl-short">{short}</span></>;
}

const nomJoueur = (joueurs, id) => joueurs.find(x => x.id === id)?.nom || '?';
const nomsEquipe = (joueurs, ids, joueursAll) => orderTeam(ids || [], joueursAll || joueurs).map(id => nomJoueur(joueurs, id)).join(', ');

/* ═══════════════════════════════════════════════
   PAGE : ACCUEIL
   ═══════════════════════════════════════════════ */

function Accueil({ data, setPage, enCours, openPartie, onSaveQuit, ghStatus }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 anim-fade">
      <div className="text-center mb-10">
        <div className="text-7xl mb-4 card-float">🃏</div>
        <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-neon via-cyan-300 to-neon bg-clip-text text-transparent leading-tight">
          Pointage Pétanque Atout
        </h1>
        <p className="text-gray-500 mt-3 text-sm tracking-widest uppercase">Parties &amp; statistiques</p>
      </div>
      <div className="w-full max-w-sm flex flex-col gap-4">
        {enCours && (
          <div className="flex flex-col gap-1">
            <Btn onClick={() => openPartie(enCours.id)} v="primary" className="glow">▶ Continuer la partie en cours</Btn>
            <p className="text-xs text-gray-400 text-center">
              Commencée à {fmtHeure(enCours.createdAt || `${enCours.date}T12:00:00`)} · {nomsEquipe(data.joueurs, enCours.equipe1)} contre {nomsEquipe(data.joueurs, enCours.equipe2)}
            </p>
          </div>
        )}
        <Btn onClick={() => setPage('joueurs')} v={enCours ? 'secondary' : 'primary'} className={enCours ? '' : 'glow'}>🃏 Nouvelle partie</Btn>
        {data.parties.length > 0 && <Btn onClick={() => setPage('parties')} v="secondary">📋 Liste des parties</Btn>}
        <Btn onClick={() => setPage('statistiques')} v="secondary">📊 Statistiques</Btn>
        <Btn onClick={onSaveQuit} v="danger">💾 Sauvegarder et quitter</Btn>
        <button onClick={() => setPage('reglages')} className="text-sm text-gray-500 hover:text-neon mt-1">
          ⚙️ Sauvegarde GitHub {ghStatus && <span className="text-gray-600">· {ghStatus}</span>}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE : JOUEURS
   ═══════════════════════════════════════════════ */

function Joueurs({ data, setData, setPage, onGenerate, notify, undoable }) {
  const today = todayISO();
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  /* Présences du jour : reprises de l'enregistrement du jour s'il existe, sinon « présent » par défaut */
  const [pres, setPres] = useState(() => {
    const rec = data.presences?.[today] || {};
    const p = {};
    data.joueurs.forEach(j => { p[j.id] = j.id in rec ? rec[j.id] : true; });
    return p;
  });
  const inputRef = useRef(null);
  const actifs = data.joueurs.filter(j => !isRetire(j));
  /* Le Fantôme est toujours affiché en dernier */
  const liste = [...actifs.filter(j => !isFantome(j)), ...actifs.filter(isFantome)];

  useEffect(() => {
    setPres(prev => {
      const u = { ...prev };
      data.joueurs.forEach(j => { if (!(j.id in u)) u[j.id] = true; });
      return u;
    });
  }, [data.joueurs.length]);

  const storePresence = (id, v) => {
    setData(d => ({ ...d, presences: { ...d.presences, [today]: { ...(d.presences?.[today] || {}), [id]: v } } }));
  };

  /* Vérifie un nom ; retourne un message d'erreur ou null */
  const nameError = (n, selfId) => {
    if (norm(n) === norm(FANTOME)) return `Le nom « ${FANTOME} » est réservé.`;
    const same = data.joueurs.find(j => j.id !== selfId && norm(j.nom) === norm(n));
    if (same && !isRetire(same)) return 'Ce nom est déjà utilisé par un autre joueur.';
    if (same && selfId) return 'Ce nom appartient à un joueur effacé de la liste : ajoutez-le plutôt pour le faire revenir.';
    return null;
  };

  const add = () => {
    const n = newName.trim();
    if (!n) return;
    const err = nameError(n, null);
    if (err) { notify(err, { type: 'error' }); return; }
    /* Un joueur effacé de la liste revient automatiquement avec toutes ses statistiques */
    const back = data.joueurs.find(j => isRetire(j) && norm(j.nom) === norm(n));
    if (back) {
      setData(p => ({ ...p, joueurs: p.joueurs.map(j => j.id === back.id ? { ...j, retire: false } : j) }));
      setPres(p => ({ ...p, [back.id]: true }));
      notify(`« ${back.nom} » est de retour avec ses statistiques.`);
    } else {
      const id = uid();
      setData(p => ({ ...p, joueurs: [...p.joueurs, { id, nom: n }] }));
      setPres(p => ({ ...p, [id]: true }));
    }
    setNewName('');
    inputRef.current?.focus();
  };

  /* Effacer de la liste : le nom et les données restent dans les statistiques */
  const effacer = (j) => {
    undoable(d => ({ ...d, joueurs: d.joueurs.map(x => x.id === j.id ? { ...x, retire: true } : x) }),
      `« ${j.nom} » est effacé de la liste.`);
  };

  const startEdit = (j) => { setEditId(j.id); setEditName(j.nom); };
  const saveEdit = () => {
    const n = editName.trim();
    if (!n) { setEditId(null); return; }
    const err = nameError(n, editId);
    if (err) { notify(err, { type: 'error' }); return; }
    setData(p => ({ ...p, joueurs: p.joueurs.map(j => j.id === editId ? { ...j, nom: n } : j) }));
    setEditId(null);
  };

  const toggle = (id) => {
    const v = !pres[id];
    setPres(p => ({ ...p, [id]: v }));
    storePresence(id, v);
  };
  const presentCount = actifs.filter(j => !isFantome(j) && pres[j.id]).length;

  /* Générer les équipes crée toujours une nouvelle partie ; les parties existantes sont conservées */
  const doGen = () => {
    const reels = actifs.filter(j => !isFantome(j));
    const ids = reels.filter(j => pres[j.id]).map(j => j.id);
    if (ids.length < 2) { notify('Il faut au moins 2 joueurs présents.', { type: 'error' }); return; }
    const ghost = data.joueurs.find(isFantome);
    if (ids.length % 2 !== 0) ids.push(ghost.id);

    const sh = shuffle(ids);
    const mid = Math.ceil(sh.length / 2);
    const e1 = orderTeam(sh.slice(0, mid), data.joueurs), e2 = orderTeam(sh.slice(mid), data.joueurs);
    const np = { id: uid(), date: today, createdAt: new Date().toISOString(), equipe1: e1, equipe2: e2, scores: { partie1: {}, partie2: {} } };
    [...e1, ...e2].forEach(id => { np.scores.partie1[id] = EMPTY_SCORE(); np.scores.partie2[id] = EMPTY_SCORE(); });

    /* Enregistre les présences / absences du jour pour chaque joueur */
    const presRec = {};
    reels.forEach(j => { presRec[j.id] = !!pres[j.id]; });

    setData(d => ({ ...d, parties: [...d.parties, np], presences: { ...(d.presences || {}), [today]: presRec } }));
    onGenerate(np.id);
  };

  return (
    <div className="min-h-screen p-4 pb-8 anim-fade">
      <div className="max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-neon mb-1 text-center">👥 Gestion des joueurs</h2>
        <p className="text-gray-500 text-center text-sm mb-6">{liste.length - 1} joueur{liste.length - 1 !== 1 ? 's' : ''} · {presentCount} présent{presentCount !== 1 ? 's' : ''}</p>

        <div className="bg-card rounded-2xl border border-accent/50 overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-accent/60 text-xs uppercase tracking-wider text-gray-400">
                <th className="text-left py-3 px-4 whitespace-nowrap">Nom du joueur</th>
                <th className="text-center py-3 px-2 w-20 whitespace-nowrap">Présent</th>
                <th className="text-center py-3 px-2 w-24 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((j, i) => (
                <tr key={j.id} className={`border-t border-gray-700/50 ${i%2===0?'bg-card':'bg-main/30'} hover:bg-accent/20 transition-colors`}>
                  <td className="py-3 px-4">
                    {editId === j.id ? (
                      <div className="flex gap-2">
                        <input type="text" value={editName} onChange={e=>setEditName(e.target.value)}
                          onKeyDown={e=>{if(e.key==='Enter')saveEdit();if(e.key==='Escape')setEditId(null);}}
                          className="flex-1 bg-main border border-neon rounded-lg px-3 py-1.5 text-base focus:outline-none" autoFocus />
                        <button onClick={saveEdit} className="text-emerald-400 hover:text-emerald-300 text-lg px-1">✓</button>
                        <button onClick={()=>setEditId(null)} className="text-gray-400 hover:text-gray-300 text-lg px-1">✕</button>
                      </div>
                    ) : isFantome(j) ? (
                      <span className="text-gray-400">👻 {j.nom}</span>
                    ) : (
                      <span onDoubleClick={()=>startEdit(j)} className="cursor-pointer hover:text-neon transition-colors">{j.nom}</span>
                    )}
                  </td>
                  <td className="text-center py-3 px-2">
                    {isFantome(j) ? (
                      <span className="text-xs text-gray-500" title="Ajouté automatiquement si le nombre de joueurs est impair">auto</span>
                    ) : (
                      <input type="checkbox" checked={!!pres[j.id]} onChange={()=>toggle(j.id)}
                        className="w-6 h-6 rounded accent-neon cursor-pointer" />
                    )}
                  </td>
                  <td className="text-center py-3 px-2">
                    {!isFantome(j) && (
                      <div className="flex gap-2 justify-center">
                        <button onClick={()=>startEdit(j)} className="text-gray-400 hover:text-neon transition-colors p-1" title="Modifier">✏️</button>
                        <button onClick={()=>effacer(j)} className="text-gray-400 hover:text-red-400 transition-colors p-1" title="Effacer de la liste">🗑️</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-gray-700/50 p-4 flex gap-2">
            <input ref={inputRef} type="text" value={newName} onChange={e=>setNewName(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter')add();}}
              placeholder="Nom du nouveau joueur..."
              className="flex-1 bg-main border border-gray-600 rounded-xl px-4 py-2.5 text-base placeholder-gray-500 focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon/30 transition-colors" />
            <button onClick={add} className="px-5 py-2.5 bg-neon text-main font-bold rounded-xl hover:bg-neon/80 transition-colors active:scale-95">Ajouter</button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Btn onClick={doGen} v="success">⚡ Générer les équipes ({presentCount} joueurs)</Btn>
          <Btn onClick={()=>setPage('accueil')} v="secondary">← Retour à l'accueil</Btn>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPOSANT : TABLEAU DE PARTIE (9 colonnes)
   ═══════════════════════════════════════════════ */

function PartieTable({ title, pKey, partie, e1, e2, joueurs, onChange, cellProps }) {
  const scores = partie.scores[pKey] || {};
  const gs = (id, f) => scores[id]?.[f] ?? null;
  const pt = (id) => sumSuits(scores[id]);

  const inputCls = "cell-in bg-main/80 border border-gray-600 text-gray-100 focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/50 transition-colors";
  const inputHl  = "cell-in bg-amber-900/40 border border-amber-400 text-amber-300 font-bold focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-colors";
  /* Total impossible selon les règles : case encadrée en rouge jusqu'à la correction */
  const inputBad = "cell-in bg-red-900/50 border-2 border-red-500 text-red-200 font-bold focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/60 transition-colors";
  const cls = (id, k) => !totalPossible(k, gs(id, k)) ? inputBad : isHl(id, k) ? inputHl : inputCls;

  /* Cellules de manche où un 15 a été fait */
  const isHl = (id, suitKey) => (scores[id]?.highlight15Fields || []).includes(suitKey);

  const t1 = e1.reduce((a,id)=>a+pt(id),0);
  const t2 = e2.reduce((a,id)=>a+pt(id),0);

  const teamRows = (ids, label, clr, bgLabel, teamTotal, isBest) => {
    let cum = 0;
    const rows = ids.map((id, i) => {
      const j = joueurs.find(x=>x.id===id);
      const tot = pt(id);
      cum += tot;
      return (
        <tr key={id} className={`border-b border-gray-700/30 ${i%2===0?'bg-card':'bg-main/40'}`}>
          <td className="font-medium" title={j?.nom || '?'}>
            {i===0 && <span className={`text-[11px] uppercase tracking-wider ${clr} block -mb-0.5 font-semibold`}>{label}</span>}
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${bgLabel}`}></span>
            {j?.nom || '?'}
          </td>
          {SUITS.map(s => (
            <td key={s.key} className={`in text-center ${isHl(id,s.key) ? 'bg-amber-500/20' : ''}`}>
              <input type="number" className={cls(id, s.key)} aria-invalid={!totalPossible(s.key, gs(id, s.key))}
                value={gs(id,s.key) == null ? '' : gs(id,s.key)}
                onChange={e=>onChange(pKey,id,s.key,parseScore(e.target.value))}
                {...cellProps(cellKey(pKey,id,s.key))} />
            </td>
          ))}
          <td className="text-center bg-calc/60 font-bold text-neon">{tot}</td>
          <td className="text-center bg-calc/80 font-bold text-white">{cum}</td>
          {/* Nb 15 : calculé à partir des manches où un 15 a été fait (cases orange) */}
          <td className="text-center font-bold text-amber-400">{gs(id,'nb15') || ''}</td>
        </tr>
      );
    });
    /* Ligne « Total » de l'équipe : total d'équipe, en rouge et gras s'il est le plus élevé */
    rows.push(
      <tr key="total" className="bg-accent/70 border-t border-neon/30">
        <td className={`font-bold uppercase text-xs tracking-wide ${clr}`}>Total</td>
        <td colSpan={5}></td>
        <td colSpan={2} className={`text-center ${isBest ? 'text-red-500 font-extrabold' : 'text-white font-bold'}`}>{teamTotal}</td>
        <td></td>
      </tr>
    );
    return rows;
  };

  return (
    <div className="bg-card rounded-2xl border border-accent/50 overflow-hidden">
      <h3 className="text-lg font-bold px-4 py-3 bg-accent/40">{title}</h3>
      <div className="sheet">
        <table className="sheet-t">
          <colgroup>
            <col style={{width:'22%'}} />
            {SUITS.map(s=><col key={s.key} style={{width:'10.5%'}} />)}
            <col style={{width:'8.5%'}} /><col style={{width:'8.5%'}} /><col style={{width:'8.5%'}} />
          </colgroup>
          <thead>
            <tr className="bg-accent/60">
              <th className="text-left text-gray-400">Joueur</th>
              {SUITS.map(s=><SuitTh key={s.key} s={s} />)}
              <th className="text-center text-neon bg-calc/40"><Lbl long="Total" short="Tot" /></th>
              <th className="text-center text-white bg-calc/60"><Lbl long="T. Éq." short="Éq." /></th>
              <th className="text-center text-amber-400"><Lbl long="Nb 15" short="15" /></th>
            </tr>
          </thead>
          <tbody>
            {teamRows(e1, 'Équipe 1', 'text-cyan-400', 'bg-cyan-400', t1, t1 > t2)}
            <tr><td colSpan="9" style={{padding:0}} className="h-[3px] bg-gradient-to-r from-transparent via-neon/40 to-transparent"></td></tr>
            {teamRows(e2, 'Équipe 2', 'text-amber-400', 'bg-amber-400', t2, t2 > t1)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPOSANT : STATISTIQUES DE LA PARTIE
   ═══════════════════════════════════════════════ */

function DayStats({ partie, e1, e2, joueurs }) {
  const ids = [...e1, ...e2];

  const ps = (id) => {
    const s1=partie.scores.partie1?.[id]||{}, s2=partie.scores.partie2?.[id]||{};
    const r={};
    SUITS.forEach(su=>{ r[su.key]=(s1[su.key]||0)+(s2[su.key]||0); });
    r.total = sumSuits(r);
    r.nb15 = (s1.nb15||0)+(s2.nb15||0);
    return r;
  };

  return (
    <div className="bg-card rounded-2xl border border-accent/50 overflow-hidden">
      <div className="sheet">
        <table className="sheet-t">
          <colgroup>
            <col style={{width:'24%'}} />
            {SUITS.map(s=><col key={s.key} style={{width:'11%'}} />)}
            <col style={{width:'11%'}} /><col style={{width:'10%'}} />
          </colgroup>
          <thead>
            <tr className="bg-accent/60">
              <th className="text-left text-gray-400">Joueur</th>
              {SUITS.map(s=><SuitTh key={s.key} s={s} />)}
              <th className="text-center text-neon bg-calc/40">Total</th>
              <th className="text-center text-amber-400"><Lbl long="Nb 15" short="15" /></th>
            </tr>
          </thead>
          <tbody>
            {ids.map((id,i)=>{
              const j=joueurs.find(x=>x.id===id);
              const s=ps(id);
              const isE1 = e1.includes(id);
              return (
                <tr key={id} className={`border-b border-gray-700/40 ${i%2===0?'bg-card':'bg-main/40'}`}>
                  <td className="font-medium" title={j?.nom||'?'}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isE1?'bg-cyan-400':'bg-amber-400'}`}></span>
                    {j?.nom||'?'}
                  </td>
                  {SUITS.map(su=><td key={su.key} className="text-center text-gray-300">{s[su.key]}</td>)}
                  <td className="text-center font-bold text-neon bg-calc/40">{s.total}</td>
                  <td className="text-center text-amber-400">{s.nb15}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE : FEUILLE DE POINTAGE
   ═══════════════════════════════════════════════ */

function Scoreboard({ data, setData, partie, setPage, onSaveQuit, onRestart, onDelete, notify }) {
  const [modal15, setModal15] = useState(null);
  const cellRefs = useRef({});
  /* Cellule ayant le focus et sa valeur au moment où elle l'a reçu */
  const focusInfo = useRef(null);

  const e1 = useMemo(() => partie ? orderTeam(partie.equipe1 || [], data.joueurs) : [], [partie, data.joueurs]);
  const e2 = useMemo(() => partie ? orderTeam(partie.equipe2 || [], data.joueurs) : [], [partie, data.joueurs]);

  /* Séquence du curseur : manche par manche, en alternant J1 Éq.1, J1 Éq.2, J2 Éq.1, J2 Éq.2…
     (les positions inexistantes sont sautées), Partie 1 puis Partie 2 */
  const sequence = useMemo(() => {
    const seq = [];
    const n = Math.max(e1.length, e2.length);
    PKS.forEach(pk => SUITS.forEach(s => {
      for (let i = 0; i < n; i++) {
        if (e1[i]) seq.push(cellKey(pk, e1[i], s.key));
        if (e2[i]) seq.push(cellKey(pk, e2[i], s.key));
      }
    }));
    return seq;
  }, [e1, e2]);

  if (!partie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 anim-fade">
        <p className="text-gray-400 text-lg mb-6">Aucune partie sélectionnée.</p>
        <div className="w-full max-w-sm flex flex-col gap-3">
          <Btn onClick={()=>setPage('joueurs')} v="primary">🃏 Créer une nouvelle partie</Btn>
          <Btn onClick={()=>setPage('accueil')} v="secondary">🏠 Retour à l'accueil</Btn>
        </div>
      </div>
    );
  }

  const handleChange = (pKey, joueurId, field, val) => {
    setData(prev => {
      const nd = JSON.parse(JSON.stringify(prev));
      const p = nd.parties.find(x=>x.id===partie.id);
      if (!p) return prev;
      if (!p.scores[pKey]) p.scores[pKey] = {};
      if (!p.scores[pKey][joueurId]) p.scores[pKey][joueurId] = EMPTY_SCORE();
      p.scores[pKey][joueurId][field] = val;
      p.modifie = new Date().toISOString();
      return nd;
    });
  };

  const focusCell = (key) => {
    const el = key && cellRefs.current[key];
    if (el) el.focus();
  };

  /* Marque (ou retire) le 15 d'une manche pour un joueur ; Nb 15 est recalculé */
  const set15 = (pk, id, suit, on) => {
    setData(prev => {
      const nd = JSON.parse(JSON.stringify(prev));
      const p = nd.parties.find(x => x.id === partie.id);
      if (!p) return prev;
      if (!p.scores[pk]) p.scores[pk] = {};
      if (!p.scores[pk][id]) p.scores[pk][id] = EMPTY_SCORE();
      const s = p.scores[pk][id];
      const hl = new Set(s.highlight15Fields || []);
      if (on) hl.add(suit); else hl.delete(suit);
      s.highlight15Fields = [...hl];
      syncNb15(s);
      p.modifie = new Date().toISOString();
      return nd;
    });
  };

  /* Validation d'une cellule de manche (Entrée, Tab, Maj+Tab ou perte du focus).
     - total impossible selon les règles → « Total erroné », le curseur reste sur la case ;
     - total impossible sans le 15 → 15 compté automatiquement ;
     - total impossible avec le 15 → pas de 15 ;
     - total possible dans les deux cas → on demande. */
  const commit = (key, el, dir) => {
    const val = parseScore(el.value);
    const fi = focusInfo.current;
    const changed = !fi || fi.key !== key || fi.val !== val;
    const [pk, id, suit] = key.split('|');
    const idx = sequence.indexOf(key);
    const next = dir === 0 || idx < 0 ? null : (sequence[idx + dir] || null);

    if (!totalPossible(suit, val)) {
      notify('Total erroné', { type: 'error' });
      if (dir !== 0) el.select();
      return;
    }
    if (fi && fi.key === key) fi.val = val;

    if (changed) {
      const kind = quinzeKind(suit, val);
      if (kind === 'peut-etre') {
        const su = SUITS.find(s => s.key === suit);
        setModal15({ key, pk, id, suit, val, next, nom: nomJoueur(data.joueurs, id), suitLabel: su?.label || suit, pLabel: PLABEL[pk] });
        return;
      }
      set15(pk, id, suit, kind === 'oui');
    }
    if (next) focusCell(next);
  };

  /* L'ordre des cases (tabIndex) suit la convention de jeu : la touche « Suivant » du clavier
     d'Android et la touche Tab avancent ainsi dans le bon ordre, pas de gauche à droite. */
  const cellProps = (key) => ({
    tabIndex: sequence.indexOf(key) + 1,
    enterKeyHint: 'next',
    ref: (el) => { if (el) cellRefs.current[key] = el; else delete cellRefs.current[key]; },
    onFocus: (e) => {
      focusInfo.current = { key, val: parseScore(e.target.value) };
      e.target.select();
    },
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        commit(key, e.target, e.shiftKey ? -1 : 1);
      }
    },
    onBlur: (e) => commit(key, e.target, 0),
  });

  const handleConfirm15 = (confirmed) => {
    const m = modal15;
    if (!m) return;
    /* Un seul trou à 15 : au plus un 15 par joueur et par manche, jamais compté deux fois */
    set15(m.pk, m.id, m.suit, confirmed);
    setModal15(null);
    /* Reprise de la séquence normale après la fermeture du modal */
    setTimeout(() => {
      if (m.next) focusCell(m.next);
      else if (focusInfo.current && focusInfo.current.key !== m.key) focusCell(focusInfo.current.key);
    }, 0);
  };

  const quand = `${fmtDate(partie.date)}${partie.createdAt ? ` — ${fmtHeure(partie.createdAt)}` : ''}`;

  return (
    <div className="min-h-screen p-4 pb-8 anim-fade">
      <div className="max-w-[1600px] mx-auto">
        {/* Section 1 — Parties */}
        <h2 className="text-xl md:text-2xl font-bold text-center text-neon mb-6">
          🃏 Parties du {quand}
        </h2>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
          <PartieTable title="Partie 1" pKey="partie1" partie={partie} e1={e1} e2={e2} joueurs={data.joueurs} onChange={handleChange} cellProps={cellProps} />
          <PartieTable title="Partie 2" pKey="partie2" partie={partie} e1={e1} e2={e2} joueurs={data.joueurs} onChange={handleChange} cellProps={cellProps} />
        </div>

        {/* Séparateur double */}
        <div className="my-8 mx-4">
          <div className="border-t-[3px] border-double border-neon/30 mb-1.5"></div>
          <div className="border-t-[3px] border-double border-neon/30"></div>
        </div>

        {/* Section 2 — Statistiques de cette partie */}
        <h2 className="text-xl md:text-2xl font-bold text-center text-neon mb-6">
          📊 Statistiques du {quand}
        </h2>
        <div className="max-w-5xl mx-auto">
          <DayStats partie={partie} e1={e1} e2={e2} joueurs={data.joueurs} />
        </div>

        {/* Boutons */}
        <div className="mt-8 max-w-sm mx-auto flex flex-col gap-3">
          <Btn onClick={()=>setPage('statistiques')} v="primary">📊 Statistiques avancées</Btn>
          <Btn onClick={()=>setPage('parties')} v="secondary">📋 Liste des parties</Btn>
          <Btn onClick={()=>setPage('accueil')} v="secondary">🏠 Retour à l'accueil</Btn>
          <Btn onClick={onSaveQuit} v="danger">💾 Sauvegarder et quitter</Btn>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Btn onClick={()=>onRestart(partie.id)} v="secondary" className="text-sm px-3">↺ Recommencer</Btn>
            <Btn onClick={()=>onDelete(partie.id)} v="danger" className="text-sm px-3">🗑️ Supprimer</Btn>
          </div>
        </div>
      </div>

      {/* Modal Nb 15 (seulement si le total ne permet pas de trancher) : focus sur « Oui », Tab alterne Oui / Non, Entrée valide */}
      <Modal open={!!modal15} title="🏆 15 points ?"
        message={`${modal15?.nom} a inscrit ${modal15?.val} points en ${modal15?.suitLabel} (${modal15?.pLabel}). Ce total est possible avec ou sans le 15 : y a-t-il eu une boule dans le 15 ?`}
        initialFocus={1}
        onEscape={() => handleConfirm15(false)}
        buttons={[
          { label: 'Non',   onClick: () => handleConfirm15(false), v: 'secondary' },
          { label: 'Oui ✓', onClick: () => handleConfirm15(true),  v: 'primary'   },
        ]} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE : LISTE DES PARTIES
   ═══════════════════════════════════════════════ */

function Parties({ data, openPartie, setPage }) {
  const saisons = saisonsTriees(data);
  const list = [...data.parties].sort((a, b) => partieTime(b) - partieTime(a));
  const teamTotal = (p, pk, ids) => ids.reduce((a, id) => a + sumSuits(p.scores?.[pk]?.[id]), 0);
  let lastSaison = null;

  return (
    <div className="min-h-screen p-4 pb-8 anim-fade">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-neon mb-6 text-center">📋 Liste des parties</h2>
        {list.length === 0 && <p className="text-center text-gray-500 mb-6">Aucune partie enregistrée.</p>}
        <div className="flex flex-col gap-3 mb-8">
          {list.map(p => {
            const sid = saisonDe(saisons, p);
            const head = sid !== lastSaison ? saisons.find(s => s.id === sid)?.nom : null;
            lastSaison = sid;
            const complete = partieComplete(p);
            const p1 = pkComplete(p, 'partie1');
            const status = complete ? ['Terminée', 'text-emerald-400 border-emerald-500/40']
              : p1 ? ['Partie 1 terminée', 'text-cyan-300 border-cyan-500/40']
              : ['En cours', 'text-amber-300 border-amber-500/40'];
            return (
              <React.Fragment key={p.id}>
                {head && <h3 className="text-sm uppercase tracking-widest text-gray-500 mt-4">{head}</h3>}
                <button onClick={() => openPartie(p.id)}
                  className="text-left bg-card rounded-2xl border border-accent/50 hover:border-neon/60 p-4 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold">{fmtDate(p.date)}{p.createdAt ? ` · ${fmtHeure(p.createdAt)}` : ''}</span>
                    <span className={`text-xs border rounded-full px-2 py-0.5 ${status[1]}`}>{status[0]}</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    <span className="text-cyan-400">Éq. 1 :</span> {nomsEquipe(data.joueurs, p.equipe1)}
                  </div>
                  <div className="text-sm text-gray-300">
                    <span className="text-amber-400">Éq. 2 :</span> {nomsEquipe(data.joueurs, p.equipe2)}
                  </div>
                  <div className="text-sm text-gray-400 mt-2 flex flex-wrap gap-x-4">
                    {PKS.filter(pk => partiePlayed(p, pk)).map(pk => (
                      <span key={pk}>{PLABEL[pk]} : {teamTotal(p, pk, p.equipe1 || [])} – {teamTotal(p, pk, p.equipe2 || [])}</span>
                    ))}
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div className="max-w-sm mx-auto flex flex-col gap-3">
          <Btn onClick={() => setPage('joueurs')} v="primary">🃏 Nouvelle partie</Btn>
          <Btn onClick={() => setPage('accueil')} v="secondary">🏠 Retour à l'accueil</Btn>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE : STATISTIQUES AVANCÉES
   ═══════════════════════════════════════════════ */

function Section({ title, subtitle, children }) {
  return (
    <div className="bg-card rounded-2xl border border-accent/50 overflow-hidden mb-6">
      <div className="px-4 py-3 bg-accent/40">
        <h3 className="text-lg font-bold">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="sheet">{children}</div>
    </div>
  );
}

function Stats({ data, setData, setPage, enCours, openPartie, onSaveQuit, undoable, notify }) {
  const saisons = saisonsTriees(data);
  const courante = saisons[saisons.length - 1];
  const [saisonId, setSaisonId] = useState(courante?.id);
  useEffect(() => { if (!saisons.some(s => s.id === saisonId)) setSaisonId(courante?.id); }, [data.saisons]);
  const saison = saisons.find(s => s.id === saisonId) || courante;

  /* Statistiques de la saison choisie, par joueur (le Fantôme a les siennes) */
  const season = useMemo(() => {
    const players = {};
    data.joueurs.forEach(j => {
      players[j.id] = { id: j.id, nom: j.nom, fantome: isFantome(j), parties: 0, nb15: 0, total: 0, presences: 0, absences: 0, history: [],
                        ...Object.fromEntries(SUITS.map(s => [s.key, 0])) };
    });

    const sessions = data.parties.filter(p => saisonDe(saisons, p) === saison?.id).sort((a, b) => partieTime(a) - partieTime(b));
    /* Regroupement par date : il peut y avoir plusieurs parties dans une même journée */
    const dates = [...new Set(sessions.map(p => p.date))];
    dates.forEach(date => {
      const duJour = sessions.filter(p => p.date === date);
      const presRec = data.presences?.[date];
      Object.values(players).forEach(r => {
        const miennes = duJour.filter(p => teamIds(p).includes(r.id));
        if (miennes.length) {
          r.presences += 1;
          const parts = [];
          miennes.forEach(partie => PKS.filter(pk => partiePlayed(partie, pk)).forEach(pk => {
            const s = partie.scores[pk]?.[r.id] || {};
            const tot = sumSuits(s);
            SUITS.forEach(su => { r[su.key] += s[su.key] || 0; });
            r.nb15 += s.nb15 || 0;
            r.total += tot;
            parts.push({ key: partie.id + pk, s, total: tot, nb15: s.nb15 || 0 });
          }));
          r.parties += parts.length;
          r.history.push({ date, present: true, parts });
        } else if (presRec && r.id in presRec) {
          r.absences += 1;
          r.history.push({ date, present: false, parts: [] });
        }
      });
    });

    const list = Object.values(players);
    const actifs = list.filter(r => r.parties > 0);
    const maxTotal = Math.max(0, ...actifs.map(r => r.total));
    const leaders = new Set(maxTotal > 0 ? actifs.filter(r => r.total === maxTotal).map(r => r.id) : []);
    const bestSuit = {};
    SUITS.forEach(s => { bestSuit[s.key] = Math.max(0, ...actifs.map(r => r[s.key])); });

    return {
      list, actifs, leaders, bestSuit, nbSessions: sessions.length,
      brut: [...actifs].sort((a, b) => b.total - a.total),
      moyenne: actifs.map(r => ({ ...r, avg: r.total / r.parties })).sort((a, b) => b.avg - a.avg),
    };
  }, [data, saison?.id]);

  const [ficheId, setFicheId] = useState(() => season.brut[0]?.id || season.list[0]?.id || '');
  const fiche = season.list.find(r => r.id === ficheId) || null;

  const nouvelleSaison = () => {
    const debut = new Date().toISOString();
    let nom = saisonNom(debut);
    if ((data.saisons || []).some(s => s.nom === nom)) nom = `${nom} (${(data.saisons || []).filter(s => s.nom.startsWith(nom)).length + 1})`;
    const ns = { id: uid(), debut, nom };
    undoable(d => ({ ...d, saisons: [...(d.saisons || []), ns] }), `${nom} commencée.`);
    setSaisonId(ns.id);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `cartes_pointage_${todayISO()}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imp = JSON.parse(ev.target.result);
        if (imp.joueurs && Array.isArray(imp.joueurs) && imp.parties && Array.isArray(imp.parties)) {
          setData(migrateData(imp));
          notify('Données importées avec succès !');
        } else { notify('Format de fichier invalide.', { type: 'error' }); }
      } catch (err) { notify("Erreur lors de l'importation.", { type: 'error' }); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const medals = ['🏆','🥈','🥉'];
  const leaderRow = (id) => season.leaders.has(id) ? 'bg-yellow-400/15 shadow-[inset_4px_0_0_#facc15]' : '';
  const nom = (r) => <>{r.fantome && <span className="mr-1">👻</span>}{r.nom}</>;
  const nameCell = (r, i) => (
    <td className="font-medium" title={r.nom}>
      {season.leaders.has(r.id) ? <span className="mr-1">👑</span> : (i < 3 && <span className="mr-1">{medals[i]}</span>)}
      {nom(r)}
    </td>
  );
  const leaderNames = season.brut.filter(r => season.leaders.has(r.id));

  return (
    <div className="min-h-screen p-4 pb-8 anim-fade">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-center text-neon mb-3">📊 Statistiques avancées</h2>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
          <select value={saison?.id || ''} onChange={e => setSaisonId(e.target.value)}
            className="bg-main border border-gray-600 rounded-xl px-4 py-2.5 text-base focus:border-neon focus:outline-none">
            {[...saisons].reverse().map(s => (
              <option key={s.id} value={s.id}>{s.nom}{s.id === courante?.id ? ' (en cours)' : ''}</option>
            ))}
          </select>
        </div>
        <p className="text-gray-500 text-center text-sm mb-6">
          {season.nbSessions} partie{season.nbSessions!==1?'s':''} enregistrée{season.nbSessions!==1?'s':''} · depuis le {fmtDateHeure(saison?.debut).split(' à ')[0]}
        </p>

        {season.actifs.length === 0 ? (
          <div className="bg-card rounded-2xl border border-accent/50 p-8 text-center text-gray-500 mb-6">
            <p className="text-4xl mb-3">📭</p><p>Aucune donnée statistique pour cette saison.</p>
          </div>
        ) : (
          <>
            {leaderNames.length > 0 && (
              <div className="bg-yellow-400/15 border border-yellow-400/60 rounded-2xl px-4 py-3 mb-6 text-center">
                <span className="text-yellow-300 font-bold">👑 Meneur de la saison : </span>
                <span className="font-bold text-white">{leaderNames.map(r => r.nom).join(', ')}</span>
                <span className="text-gray-300"> — {leaderNames[0].total} points</span>
              </div>
            )}

            {/* 1. Meilleur pointage brut */}
            <Section title="🥇 Meilleur pointage brut" subtitle="Pointage cumulé de la saison">
              <table className="sheet-t">
                <colgroup>
                  <col style={{width:'40%'}} /><col style={{width:'20%'}} /><col style={{width:'20%'}} /><col style={{width:'20%'}} />
                </colgroup>
                <thead>
                  <tr className="bg-accent/60">
                    <th className="text-left text-gray-400">Joueur</th>
                    <th className="text-center text-gray-400">Parties</th>
                    <th className="text-center text-amber-400"><Lbl long="Nb 15" short="15" /></th>
                    <th className="text-center text-neon bg-calc/40">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {season.brut.map((r,i)=>(
                    <tr key={r.id} className={`border-b border-gray-700/40 ${i%2===0?'bg-card':'bg-main/40'} ${leaderRow(r.id)}`}>
                      {nameCell(r, i)}
                      <td className="text-center text-gray-400">{r.parties}</td>
                      <td className="text-center text-amber-400">{r.nb15}</td>
                      <td className="text-center font-bold text-neon bg-calc/40">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            {/* 2. Meilleur pointage par partie */}
            <Section title="🎯 Meilleur pointage par partie" subtitle="Moyenne = pointage cumulé ÷ nombre de parties">
              <table className="sheet-t">
                <colgroup>
                  <col style={{width:'40%'}} /><col style={{width:'20%'}} /><col style={{width:'20%'}} /><col style={{width:'20%'}} />
                </colgroup>
                <thead>
                  <tr className="bg-accent/60">
                    <th className="text-left text-gray-400">Joueur</th>
                    <th className="text-center text-gray-400">Parties</th>
                    <th className="text-center text-gray-400">Total</th>
                    <th className="text-center text-neon bg-calc/40">Moyenne</th>
                  </tr>
                </thead>
                <tbody>
                  {season.moyenne.map((r,i)=>(
                    <tr key={r.id} className={`border-b border-gray-700/40 ${i%2===0?'bg-card':'bg-main/40'} ${leaderRow(r.id)}`}>
                      {nameCell(r, i)}
                      <td className="text-center text-gray-400">{r.parties}</td>
                      <td className="text-center text-gray-300">{r.total}</td>
                      <td className="text-center font-bold text-neon bg-calc/40">{fmt1(r.avg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            {/* 3. Meilleur par manche */}
            <Section title="🃏 Meilleur par manche" subtitle="Cumul de la saison par manche — le meilleur de chaque colonne est surligné en orange">
              <table className="sheet-t">
                <colgroup>
                  <col style={{width:'30%'}} />
                  {SUITS.map(s=><col key={s.key} style={{width:'14%'}} />)}
                </colgroup>
                <thead>
                  <tr className="bg-accent/60">
                    <th className="text-left text-gray-400">Joueur</th>
                    {SUITS.map(s=><SuitTh key={s.key} s={s} />)}
                  </tr>
                </thead>
                <tbody>
                  {season.brut.map((r,i)=>(
                    <tr key={r.id} className={`border-b border-gray-700/40 ${i%2===0?'bg-card':'bg-main/40'} ${leaderRow(r.id)}`}>
                      <td className="font-medium" title={r.nom}>
                        {season.leaders.has(r.id) && <span className="mr-1">👑</span>}{nom(r)}
                      </td>
                      {SUITS.map(s => {
                        const best = season.bestSuit[s.key] > 0 && r[s.key] === season.bestSuit[s.key];
                        return <td key={s.key} className={`text-center ${best ? 'bg-orange-500 text-white font-bold' : 'text-gray-300'}`}>{r[s.key]}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            {/* Fiche joueur : détail regroupé par date */}
            <Section title="🗓️ Fiche du joueur" subtitle="Présences, absences et pointage de chaque manche, regroupés par date">
              <div className="p-4 flex flex-col gap-4">
                <select value={ficheId} onChange={e=>setFicheId(e.target.value)}
                  className="bg-main border border-gray-600 rounded-xl px-4 py-2.5 text-base focus:border-neon focus:outline-none">
                  {[...season.list].sort((a,b)=>a.nom.localeCompare(b.nom,'fr')).map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                </select>
                {fiche && (
                  <div className={`grid grid-cols-3 sm:grid-cols-6 gap-2 text-center ${season.leaders.has(fiche.id) ? 'ring-2 ring-yellow-400 rounded-xl p-2' : ''}`}>
                    {[
                      ['Présences', fiche.presences],
                      ['Absences', fiche.absences],
                      ['Parties', fiche.parties],
                      ['Nb 15', fiche.nb15],
                      ['Total', fiche.total],
                      ['Moyenne', fiche.parties ? fmt1(fiche.total / fiche.parties) : '–'],
                    ].map(([l, v]) => (
                      <div key={l} className="bg-main/60 rounded-xl py-2">
                        <div className="text-[11px] text-gray-400 whitespace-nowrap">{l}</div>
                        <div className="font-bold text-neon">{v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {fiche && fiche.history.length > 0 && (
                <table className="sheet-t">
                  <colgroup>
                    <col style={{width:'16%'}} /><col style={{width:'12%'}} />
                    {SUITS.map(s=><col key={s.key} style={{width:'10.5%'}} />)}
                    <col style={{width:'10.5%'}} /><col style={{width:'9%'}} />
                  </colgroup>
                  <thead>
                    <tr className="bg-accent/60">
                      <th className="text-left text-gray-400">Date</th>
                      <th className="text-center text-gray-400"><Lbl long="Partie" short="P." /></th>
                      {SUITS.map(s=><SuitTh key={s.key} s={s} />)}
                      <th className="text-center text-neon bg-calc/40"><Lbl long="Total" short="Tot" /></th>
                      <th className="text-center text-amber-400"><Lbl long="Nb 15" short="15" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...fiche.history].reverse().map(h => {
                      if (!h.present || h.parts.length === 0) {
                        return (
                          <tr key={h.date} className="border-b border-gray-700/40">
                            <td className="text-gray-300">{fmtDate(h.date)}</td>
                            <td colSpan={8} className={`text-center italic ${h.present ? 'text-gray-400' : 'text-red-400'}`}>
                              {h.present ? 'Présent — aucune manche saisie' : 'Absent'}
                            </td>
                          </tr>
                        );
                      }
                      return h.parts.map((p, k) => (
                        <tr key={p.key} className={`${k === h.parts.length - 1 ? 'border-b border-gray-700/60' : ''}`}>
                          {k === 0 && <td rowSpan={h.parts.length} className="text-gray-300 align-top">{fmtDate(h.date)}</td>}
                          <td className="text-center text-gray-400">{k + 1}</td>
                          {SUITS.map(su => <td key={su.key} className="text-center text-gray-300">{p.s[su.key] ?? '–'}</td>)}
                          <td className="text-center font-bold text-neon bg-calc/40">{p.total}</td>
                          <td className="text-center text-amber-400">{p.nb15}</td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              )}
            </Section>
          </>
        )}

        <div className="max-w-sm mx-auto flex flex-col gap-3">
          {enCours && (
            <Btn onClick={()=>openPartie(enCours.id)} v="primary">▶ Retour à la partie en cours</Btn>
          )}
          <Btn onClick={exportJSON} v="secondary">📥 Exporter les données (JSON)</Btn>
          <label className="w-full cursor-pointer">
            <input type="file" accept=".json" onChange={importJSON} className="hidden" />
            <div className="w-full min-h-[48px] px-6 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.97] bg-card border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white">
              📤 Importer des données (JSON)
            </div>
          </label>
          <Btn onClick={nouvelleSaison} v="secondary">🗓️ Nouvelle saison</Btn>
          <Btn onClick={()=>setPage('accueil')} v="secondary">🏠 Retour à l'accueil</Btn>
          <Btn onClick={onSaveQuit} v="danger">💾 Sauvegarder et quitter</Btn>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE : RÉGLAGES DE LA SAUVEGARDE GITHUB
   ═══════════════════════════════════════════════ */

function Reglages({ setPage, onSaveNow, notify, ghStatus }) {
  const [cfg, setCfg] = useState(() => ghConfig());
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const field = 'w-full bg-main border border-gray-600 rounded-xl px-4 py-2.5 text-base focus:border-neon focus:outline-none';

  const enregistrer = () => { ghSetConfig({ ...cfg, token: cfg.token.trim(), repo: cfg.repo.trim(), path: cfg.path.trim() }); notify('Réglages enregistrés.'); };
  const tester = async () => {
    enregistrer();
    setBusy(true);
    try { await ghTest(); notify('✔ Connexion à GitHub réussie : le dépôt est accessible en écriture.'); }
    catch (e) { notify(e.message, { type: 'error', duration: 7000 }); }
    finally { setBusy(false); }
  };
  const maintenant = async () => { enregistrer(); setBusy(true); await onSaveNow(); setBusy(false); };

  return (
    <div className="min-h-screen p-4 pb-8 anim-fade">
      <div className="max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-neon mb-2 text-center">⚙️ Sauvegarde GitHub</h2>
        <p className="text-gray-400 text-center text-sm mb-6">
          « Sauvegarder et quitter » envoie toutes les données dans le fichier partagé de votre dépôt privé. Les parties saisies sur les autres appareils (un ami, la tablette…) sont ajoutées automatiquement, sans rien écraser.
          {ghStatus && <><br />{ghStatus}</>}
        </p>
        <div className="bg-card rounded-2xl border border-accent/50 p-4 flex flex-col gap-4 mb-6">
          <label className="flex flex-col gap-1 text-sm text-gray-300">Jeton GitHub (commence par github_pat_)
            <div className="flex gap-2">
              <input type={show ? 'text' : 'password'} value={cfg.token} autoComplete="off" spellCheck="false"
                onChange={e => setCfg({ ...cfg, token: e.target.value })} className={field} placeholder="github_pat_…" />
              <button onClick={() => setShow(!show)} className="px-3 rounded-xl border border-gray-600 text-gray-300" title="Afficher ou cacher">{show ? '🙈' : '👁️'}</button>
            </div>
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-300">Dépôt de données
            <input type="text" value={cfg.repo} onChange={e => setCfg({ ...cfg, repo: e.target.value })} className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-300">Fichier
            <input type="text" value={cfg.path} onChange={e => setCfg({ ...cfg, path: e.target.value })} className={field} />
          </label>
          <p className="text-xs text-gray-500 leading-relaxed">
            Le jeton reste uniquement sur cet appareil. Il se crée sur github.com : Settings → Developer settings →
            Personal access tokens → Fine-grained tokens, limité au dépôt de données, avec le droit « Contents : Read and write ».
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Btn onClick={enregistrer} v="primary">✓ Enregistrer</Btn>
          <Btn onClick={tester} v="secondary">{busy ? '…' : '🔌 Tester la connexion'}</Btn>
          <Btn onClick={maintenant} v="success">{busy ? '…' : '☁️ Synchroniser maintenant'}</Btn>
          <Btn onClick={() => setPage('accueil')} v="secondary">🏠 Retour à l'accueil</Btn>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   APP PRINCIPAL
   ═══════════════════════════════════════════════ */

function App() {
  const [page, setPage] = useState('accueil');
  const [data, setData] = useState(() => load());
  const [partieId, setPartieId] = useState(null);
  const [toast, setToast] = useState(null);
  const [quitModal, setQuitModal] = useState(null);
  const [ghTick, setGhTick] = useState(0);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Enregistrement automatique sur l'appareil
  useEffect(() => { save(data); }, [data]);

  // Demande au navigateur de ne jamais effacer automatiquement les données locales
  useEffect(() => {
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  }, []);

  // Téléphone : application installée → écran verrouillé en paysage (Android)
  useEffect(() => {
    try {
      const installed = window.matchMedia('(display-mode: standalone)').matches;
      if (installed && Math.min(screen.width, screen.height) < 600 && screen.orientation?.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (e) {}
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  const notify = (message, opts = {}) => setToast({ message, ...opts, id: Date.now() });

  /* Modification avec possibilité d'annuler (au lieu de poser une question) */
  const undoable = (fn, message, after) => {
    const before = dataRef.current;
    setData(d => fn(d));
    notify(message, { duration: 7000, action: { label: 'Annuler', onClick: () => { setData(before); if (after) after(); } } });
  };

  const curPartie = useMemo(() => data.parties.find(p => p.id === partieId) || null, [data, partieId]);
  /* Partie en cours : la plus récente partie d'aujourd'hui qui n'est pas terminée */
  const enCours = useMemo(() => {
    const today = todayISO();
    return [...data.parties].filter(p => p.date === today && !partieComplete(p)).sort((a, b) => partieTime(b) - partieTime(a))[0] || null;
  }, [data]);

  const openPartie = (id) => { setPartieId(id); setPage('scoreboard'); };

  const onDelete = (id) => {
    undoable(d => ({ ...d, parties: d.parties.filter(p => p.id !== id), supprimees: [...(d.supprimees || []), id] }), 'Partie supprimée.', () => openPartie(id));
    setPage('accueil');
  };
  const onRestart = (id) => {
    undoable(d => ({
      ...d,
      parties: d.parties.map(p => {
        if (p.id !== id) return p;
        const scores = { partie1: {}, partie2: {} };
        teamIds(p).forEach(pid => { scores.partie1[pid] = EMPTY_SCORE(); scores.partie2[pid] = EMPTY_SCORE(); });
        return { ...p, scores, modifie: new Date().toISOString() };
      }),
    }), 'Pointages effacés.');
  };

  /* ── Sauvegarde sur GitHub (un seul envoi à la fois) ── */
  const pushing = useRef(null);
  const pushNow = () => {
    if (!pushing.current) pushing.current = pushOnce().finally(() => { pushing.current = null; });
    return pushing.current;
  };
  const pushOnce = async () => {
    ghSetPending(true);
    try {
      const merged = await ghPush(dataRef.current);
      /* On garde aussi ce qui a pu être saisi pendant l'envoi */
      setData(cur => mergeData(cur, merged));
      ghSetPending(false);
      try { localStorage.setItem(GH_LAST_KEY, new Date().toISOString()); } catch (e) {}
      return { ok: true };
    } catch (e) {
      if (e.kind === 'config') ghSetPending(false);
      return { ok: false, error: e };
    } finally {
      setGhTick(t => t + 1);
    }
  };

  /* Au démarrage et au retour d'Internet : envoi en attente, sinon simple récupération
     des parties saisies sur les autres appareils */
  useEffect(() => {
    const retry = async () => {
      if (!ghConfig().token) return;
      if (ghPending()) {
        const r = await pushNow();
        if (r.ok) notify('✔ Sauvegarde en attente envoyée sur GitHub.');
        return;
      }
      try {
        const remote = await ghPull();
        if (remote) setData(cur => mergeData(cur, remote));
      } catch (e) { /* sans Internet ou sans accès : on continue avec les données de l'appareil */ }
    };
    retry();
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, []);

  const onSaveQuit = async () => {
    if (!ghConfig().token) {
      notify("Configurez d'abord la sauvegarde GitHub (une seule fois par appareil).", { type: 'error', duration: 6000 });
      setPage('reglages');
      return;
    }
    setQuitModal({ title: '☁️ Sauvegarde…', message: 'Envoi des données sur GitHub.', buttons: [] });
    const r = await pushNow();
    const ok = { label: 'OK', onClick: () => setQuitModal(null), v: 'primary' };
    if (r.ok) {
      setQuitModal({ title: '✔ Sauvegardé sur GitHub', message: "Toutes les données sont sauvegardées.\nVous pouvez fermer l'application.", buttons: [ok] });
      setTimeout(() => { try { window.close(); } catch (e) {} }, 800);
    } else if (r.error.kind === 'offline') {
      setQuitModal({ title: '📴 Pas de connexion', message: "Les données restent sur cet appareil. La sauvegarde sera envoyée automatiquement à la prochaine ouverture de l'application avec Internet.\nVous pouvez fermer l'application.", buttons: [ok] });
    } else {
      setQuitModal({ title: '⚠️ Sauvegarde impossible', message: `${r.error.message}\nLes données restent sur cet appareil.`, buttons: [
        { label: 'Réglages', onClick: () => { setQuitModal(null); setPage('reglages'); }, v: 'secondary' }, ok] });
    }
  };

  const onSaveNow = async () => {
    const r = await pushNow();
    if (r.ok) notify('✔ Synchronisé avec GitHub.');
    else notify(r.error.kind === 'offline' ? "Pas de connexion : la sauvegarde sera envoyée dès que possible." : r.error.message, { type: 'error', duration: 7000 });
  };

  const ghStatus = useMemo(() => {
    if (!ghConfig().token) return 'non configurée';
    if (ghPending()) return 'envoi en attente';
    const last = ghLast();
    return last ? `dernière : ${fmtDateHeure(last)}` : 'jamais envoyée';
  }, [ghTick, page]);

  let content;
  switch (page) {
    case 'joueurs':
      content = <Joueurs data={data} setData={setData} setPage={setPage} onGenerate={openPartie} notify={notify} undoable={undoable} />; break;
    case 'scoreboard':
      content = <Scoreboard data={data} setData={setData} partie={curPartie} setPage={setPage} onSaveQuit={onSaveQuit}
        onRestart={onRestart} onDelete={onDelete} notify={notify} />; break;
    case 'parties':
      content = <Parties data={data} openPartie={openPartie} setPage={setPage} />; break;
    case 'statistiques':
      content = <Stats data={data} setData={setData} setPage={setPage} enCours={enCours} openPartie={openPartie}
        onSaveQuit={onSaveQuit} undoable={undoable} notify={notify} />; break;
    case 'reglages':
      content = <Reglages setPage={setPage} onSaveNow={onSaveNow} notify={notify} ghStatus={ghStatus} />; break;
    default:
      content = <Accueil data={data} setPage={setPage} enCours={enCours} openPartie={openPartie} onSaveQuit={onSaveQuit} ghStatus={ghStatus} />;
  }

  return (
    <>
      {content}
      <Modal open={!!quitModal} title={quitModal?.title} message={quitModal?.message} buttons={quitModal?.buttons}
        onEscape={() => setQuitModal(null)} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

/* ═══════════════════════════════════════════════
   RENDU
   ═══════════════════════════════════════════════ */

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
