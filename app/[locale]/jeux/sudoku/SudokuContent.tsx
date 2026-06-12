'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { useUserContext } from '@/context/UserContextProvider'

// ─────────────────────────────────────────────────────────────────────────────
// CSS du jeu — page-scopé .m-sudoku, variables remappées sur les tokens du site
// (suit la bascule clair/sombre via html[data-theme]). Palette « papier/encre »
// d'origine conservée comme intention, mais branchée sur la charte Moteurs.com.
// ─────────────────────────────────────────────────────────────────────────────
const SUDOKU_CSS = `
.m-sudoku{
  --paper:var(--color-bg-card);
  --paper-2:var(--color-bg-alt);
  --ink:var(--color-text);
  --ink-soft:var(--color-text-soft);
  --seal:var(--color-primary);
  --seal-soft:rgba(239,108,26,.16);
  --user:#2f7d6e;
  --line-thin:var(--color-border);
  --line-thick:var(--color-text);
  --cell-sel:rgba(239,108,26,.22);
  --cell-peer:rgba(128,128,128,.10);
  --cell-same:rgba(47,125,110,.16);
  --shadow:0 18px 40px -20px rgba(16,24,43,.35);
  --font-display:Georgia,"Times New Roman",serif;
  display:flex;flex-direction:column;align-items:center;
  padding:8px 16px 40px;color:var(--ink);
  -webkit-tap-highlight-color:transparent;
}
html[data-theme="dark"] .m-sudoku{
  --user:#5fd6bb;
  --cell-peer:rgba(255,255,255,.06);
  --cell-same:rgba(95,214,187,.16);
  --shadow:0 18px 40px -18px rgba(0,0,0,.6);
}
.m-sudoku *{box-sizing:border-box;margin:0;padding:0}
.m-sudoku .s-wrap{width:100%;max-width:480px}
.m-sudoku .s-head{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:18px;gap:12px}
.m-sudoku .brand{display:flex;align-items:center;gap:12px}
.m-sudoku .seal{
  width:46px;height:46px;border-radius:9px;flex:none;
  background:var(--seal);color:#fff;
  font-family:var(--font-display);font-size:26px;
  display:grid;place-items:center;
  box-shadow:0 6px 14px -6px rgba(239,108,26,.8);
  transform:rotate(-3deg);
}
.m-sudoku h1{font-family:var(--font-display);font-weight:600;font-size:34px;line-height:1;letter-spacing:.5px;color:var(--ink)}
.m-sudoku h1 small{display:block;font-family:inherit;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--ink-soft);margin-top:6px;font-weight:600}
.m-sudoku .timer{font-family:var(--font-display);font-size:22px;color:var(--ink);text-align:right;line-height:1}
.m-sudoku .timer small{display:block;font-family:inherit;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--ink-soft);margin-top:5px;font-weight:600}
.m-sudoku .levels{display:flex;gap:6px;margin-bottom:16px}
.m-sudoku .levels button{
  flex:1;border:1px solid var(--line-thin);background:transparent;
  color:var(--ink-soft);font-family:inherit;font-size:13px;font-weight:600;
  padding:9px 4px;border-radius:8px;cursor:pointer;transition:.15s;
}
.m-sudoku .levels button:hover{border-color:var(--ink)}
.m-sudoku .levels button[aria-pressed="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.m-sudoku .board{
  width:100%;aspect-ratio:1;background:var(--paper);
  border:2.5px solid var(--line-thick);border-radius:6px;
  display:grid;grid-template-columns:repeat(9,1fr);
  box-shadow:var(--shadow);overflow:hidden;touch-action:manipulation;
}
.m-sudoku .cell{
  position:relative;display:grid;place-items:center;
  font-weight:500;font-size:clamp(18px,5.4vw,26px);
  border-right:1px solid var(--line-thin);border-bottom:1px solid var(--line-thin);
  cursor:pointer;user-select:none;color:var(--user);transition:background .12s;
}
.m-sudoku .cell:nth-child(9n){border-right:none}
.m-sudoku .cell:nth-child(n+73){border-bottom:none}
.m-sudoku .cell.bx-r{border-right:2px solid var(--line-thick)}
.m-sudoku .cell.bx-b{border-bottom:2px solid var(--line-thick)}
.m-sudoku .cell.given{color:var(--ink);font-weight:700}
.m-sudoku .cell.peer{background:var(--cell-peer)}
.m-sudoku .cell.same{background:var(--cell-same)}
.m-sudoku .cell.sel{background:var(--cell-sel)}
.m-sudoku .cell.bad{color:var(--seal)}
.m-sudoku .cell.bad::after{content:"";position:absolute;inset:14% 14% auto auto;width:6px;height:6px;border-radius:50%;background:var(--seal)}
.m-sudoku .notes{position:absolute;inset:3px;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);font-size:9px;font-weight:500;color:var(--ink-soft);pointer-events:none}
.m-sudoku .notes span{display:grid;place-items:center;line-height:1}
.m-sudoku .pad{display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:16px}
.m-sudoku .pad button{
  aspect-ratio:1;border:1px solid var(--line-thin);background:var(--paper);
  color:var(--ink);font-family:var(--font-display);font-size:22px;
  border-radius:9px;cursor:pointer;transition:.12s;
}
.m-sudoku .pad button:hover{background:var(--paper-2);border-color:var(--ink)}
.m-sudoku .pad button:active{transform:translateY(1px)}
.m-sudoku .pad button .rem{display:block;font-family:inherit;font-size:9px;color:var(--ink-soft);font-weight:500;margin-top:-2px}
.m-sudoku .pad button.done{opacity:.32;pointer-events:none}
.m-sudoku .tools{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}
.m-sudoku .tools button{
  border:1px solid var(--line-thin);background:transparent;color:var(--ink);
  font-family:inherit;font-size:12px;font-weight:600;padding:11px 4px;
  border-radius:9px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;transition:.12s;
}
.m-sudoku .tools button:hover{border-color:var(--ink);background:var(--paper)}
.m-sudoku .tools button .ic{font-size:18px;line-height:1}
.m-sudoku .tools button[aria-pressed="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.m-sudoku .msg{text-align:center;margin-top:16px;min-height:22px;font-size:14px;font-weight:600;color:var(--seal);letter-spacing:.3px}
.m-sudoku .msg.win{color:var(--user);font-family:var(--font-display);font-size:18px}
.m-sudoku .s-foot{margin-top:24px;font-size:11px;color:var(--ink-soft);letter-spacing:1px;text-align:center}
@media (max-width:380px){
  .m-sudoku .tools button{font-size:11px}
  .m-sudoku .pad button{font-size:19px}
}
`

// ─────────────────────────────────────────────────────────────────────────────
// Markup du jeu (injecté ; les IDs sont pilotés par runSudoku).
// ─────────────────────────────────────────────────────────────────────────────
const SUDOKU_HTML = `
<div class="s-wrap">
  <div class="s-head">
    <div class="brand">
      <div class="seal">数</div>
      <h1>Sudoku<small>Grille du jour</small></h1>
    </div>
    <div class="timer" id="s-timer">00:00<small>Temps</small></div>
  </div>

  <div class="levels" id="s-levels">
    <button data-d="facile" aria-pressed="true">Facile</button>
    <button data-d="moyen">Moyen</button>
    <button data-d="difficile">Difficile</button>
    <button data-d="expert">Expert</button>
  </div>

  <div class="board" id="s-board"></div>

  <div class="pad" id="s-pad"></div>

  <div class="tools">
    <button id="s-btnNotes" aria-pressed="false"><span class="ic">✎</span>Notes</button>
    <button id="s-btnErase"><span class="ic">⌫</span>Effacer</button>
    <button id="s-btnHint"><span class="ic">☆</span>Indice</button>
    <button id="s-btnNew"><span class="ic">↻</span>Nouvelle</button>
  </div>

  <div class="msg" id="s-msg"></div>
  <div class="s-foot">Cliquez une case · tapez 1–9 · N = notes · ⌫ = effacer</div>
</div>
`

// ─────────────────────────────────────────────────────────────────────────────
// Moteur du jeu, scopé au conteneur (aucune fuite globale, cleanup retourné).
// Garantit l'unicité de la solution (countSolutions limité à 2).
// ─────────────────────────────────────────────────────────────────────────────
function runSudoku(root: HTMLElement): () => void {
  const HOLES: Record<string, number> = { facile: 40, moyen: 48, difficile: 54, expert: 58 }

  const q = (id: string) => root.querySelector(id) as HTMLElement
  const boardEl = q('#s-board')
  const padEl = q('#s-pad')
  const msgEl = q('#s-msg')
  const timerEl = q('#s-timer')
  const levelsEl = q('#s-levels')
  const btnNotes = q('#s-btnNotes')
  const btnErase = q('#s-btnErase')
  const btnHint = q('#s-btnHint')
  const btnNew = q('#s-btnNew')

  let solution: number[] = []
  let puzzle: number[] = []
  let given: boolean[] = []
  let notes: Set<number>[] = []
  let sel = -1
  let notesMode = false
  let difficulty = 'facile'
  let startTime = 0
  let timerId: ReturnType<typeof setInterval> | null = null
  let solved = false

  /* ---------- generator ---------- */
  function shuffled<T>(a: T[]): T[] {
    a = a.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  function fullGrid(): number[] {
    const g = new Array(81).fill(0)
    function ok(p: number, v: number) {
      const r = (p / 9) | 0, c = p % 9, br = r - (r % 3), bc = c - (c % 3)
      for (let i = 0; i < 9; i++) {
        if (g[r * 9 + i] === v || g[i * 9 + c] === v) return false
        if (g[(br + ((i / 3) | 0)) * 9 + (bc + (i % 3))] === v) return false
      }
      return true
    }
    function fill(p: number): boolean {
      if (p === 81) return true
      if (g[p]) return fill(p + 1)
      for (const v of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (ok(p, v)) { g[p] = v; if (fill(p + 1)) return true; g[p] = 0 }
      }
      return false
    }
    fill(0)
    return g
  }

  function countSolutions(g: number[], limit: number): number {
    let count = 0
    function ok(p: number, v: number) {
      const r = (p / 9) | 0, c = p % 9, br = r - (r % 3), bc = c - (c % 3)
      for (let i = 0; i < 9; i++) {
        if (g[r * 9 + i] === v || g[i * 9 + c] === v) return false
        if (g[(br + ((i / 3) | 0)) * 9 + (bc + (i % 3))] === v) return false
      }
      return true
    }
    function solve(p: number) {
      if (count >= limit) return
      if (p === 81) { count++; return }
      if (g[p]) { solve(p + 1); return }
      for (let v = 1; v <= 9; v++) {
        if (ok(p, v)) { g[p] = v; solve(p + 1); g[p] = 0; if (count >= limit) return }
      }
    }
    solve(0)
    return count
  }

  function makePuzzle(holes: number) {
    solution = fullGrid()
    const p = solution.slice()
    const order = shuffled([...Array(81).keys()])
    let removed = 0
    for (const idx of order) {
      if (removed >= holes) break
      if (p[idx] === 0) continue
      const backup = p[idx]
      p[idx] = 0
      const test = p.slice()
      if (countSolutions(test, 2) !== 1) { p[idx] = backup }
      else removed++
    }
    puzzle = p
    given = p.map((v) => v !== 0)
    notes = Array.from({ length: 81 }, () => new Set<number>())
  }

  /* ---------- render ---------- */
  function build() {
    boardEl.innerHTML = ''
    for (let i = 0; i < 81; i++) {
      const c = document.createElement('div')
      c.className = 'cell'
      const col = i % 9, row = (i / 9) | 0
      if (col % 3 === 2 && col !== 8) c.classList.add('bx-r')
      if (row % 3 === 2 && row !== 8) c.classList.add('bx-b')
      c.dataset.i = String(i)
      c.addEventListener('click', () => select(i))
      boardEl.appendChild(c)
    }
    padEl.innerHTML = ''
    for (let v = 1; v <= 9; v++) {
      const b = document.createElement('button')
      b.dataset.v = String(v)
      b.innerHTML = v + '<span class="rem"></span>'
      b.addEventListener('click', () => place(v))
      padEl.appendChild(b)
    }
  }

  function render() {
    const cells = boardEl.children
    const selVal = sel >= 0 ? puzzle[sel] : 0
    const selRow = sel >= 0 ? ((sel / 9) | 0) : -1, selCol = sel >= 0 ? sel % 9 : -1
    const selBr = sel >= 0 ? selRow - (selRow % 3) : -1, selBc = sel >= 0 ? selCol - (selCol % 3) : -1

    for (let i = 0; i < 81; i++) {
      const c = cells[i] as HTMLElement, v = puzzle[i]
      c.className = 'cell' + ((i % 9) % 3 === 2 && i % 9 !== 8 ? ' bx-r' : '') + (((i / 9) | 0) % 3 === 2 && ((i / 9) | 0) !== 8 ? ' bx-b' : '')
      if (given[i]) c.classList.add('given')

      if (sel >= 0) {
        const r = (i / 9) | 0, col = i % 9
        const sameBox = r >= selBr && r < selBr + 3 && col >= selBc && col < selBc + 3
        if (r === selRow || col === selCol || sameBox) c.classList.add('peer')
        if (v && v === selVal) c.classList.add('same')
        if (i === sel) c.classList.add('sel')
      }
      if (v && !given[i] && conflicts(i)) c.classList.add('bad')

      c.innerHTML = ''
      if (v) { c.textContent = String(v) }
      else if (notes[i].size) {
        const nn = document.createElement('div'); nn.className = 'notes'
        for (let k = 1; k <= 9; k++) {
          const s = document.createElement('span')
          s.textContent = notes[i].has(k) ? String(k) : ''
          nn.appendChild(s)
        }
        c.appendChild(nn)
      }
    }
    const counts: Record<number, number> = {}
    for (let v = 1; v <= 9; v++) counts[v] = 0
    for (let i = 0; i < 81; i++) if (puzzle[i]) counts[puzzle[i]]++
    for (const b of Array.from(padEl.children) as HTMLElement[]) {
      const v = +(b.dataset.v as string), rem = 9 - counts[v]
      ;(b.querySelector('.rem') as HTMLElement).textContent = rem > 0 ? String(rem) : ''
      b.classList.toggle('done', rem <= 0)
    }
  }

  function conflicts(i: number): boolean {
    const v = puzzle[i]; if (!v) return false
    const r = (i / 9) | 0, col = i % 9, br = r - (r % 3), bc = col - (col % 3)
    for (let k = 0; k < 9; k++) {
      const a = r * 9 + k, b = k * 9 + col, c = (br + ((k / 3) | 0)) * 9 + (bc + (k % 3))
      if (a !== i && puzzle[a] === v) return true
      if (b !== i && puzzle[b] === v) return true
      if (c !== i && puzzle[c] === v) return true
    }
    return false
  }

  /* ---------- interaction ---------- */
  function select(i: number) { sel = i; render() }

  function place(v: number) {
    if (sel < 0 || given[sel] || solved) return
    if (notesMode) {
      if (puzzle[sel]) return
      notes[sel].has(v) ? notes[sel].delete(v) : notes[sel].add(v)
    } else {
      puzzle[sel] = puzzle[sel] === v ? 0 : v
      notes[sel].clear()
      if (puzzle[sel]) {
        const r = (sel / 9) | 0, col = sel % 9, br = r - (r % 3), bc = col - (col % 3)
        for (let k = 0; k < 9; k++) {
          notes[r * 9 + k].delete(v); notes[k * 9 + col].delete(v)
          notes[(br + ((k / 3) | 0)) * 9 + (bc + (k % 3))].delete(v)
        }
      }
    }
    render(); checkWin()
  }

  function erase() {
    if (sel < 0 || given[sel] || solved) return
    puzzle[sel] = 0; notes[sel].clear(); render()
  }

  function hint() {
    if (solved) return
    const empties: number[] = []
    for (let i = 0; i < 81; i++) if (!puzzle[i]) empties.push(i)
    if (!empties.length) return
    const i = sel >= 0 && !puzzle[sel] && !given[sel] ? sel : empties[(Math.random() * empties.length) | 0]
    puzzle[i] = solution[i]; given[i] = true; notes[i].clear(); sel = i
    flash('Indice placé', false); render(); checkWin()
  }

  function checkWin() {
    for (let i = 0; i < 81; i++) if (puzzle[i] !== solution[i]) return
    solved = true; if (timerId) clearInterval(timerId)
    flash('Terminé ! ' + (timerEl.firstChild?.textContent || '').trim() + ' — bravo 🎉', true)
  }

  function flash(t: string, win: boolean) { msgEl.textContent = t; msgEl.className = 'msg' + (win ? ' win' : '') }

  /* ---------- timer ---------- */
  function startTimer() {
    if (timerId) clearInterval(timerId)
    startTime = Date.now()
    timerId = setInterval(() => {
      const s = ((Date.now() - startTime) / 1000) | 0
      const mm = String((s / 60) | 0).padStart(2, '0'), ss = String(s % 60).padStart(2, '0')
      if (timerEl.childNodes[0]) timerEl.childNodes[0].nodeValue = mm + ':' + ss
    }, 500)
  }

  /* ---------- new game ---------- */
  function newGame() {
    solved = false; sel = -1; notesMode = false
    btnNotes.setAttribute('aria-pressed', 'false')
    flash('Génération…', false)
    setTimeout(() => {
      makePuzzle(HOLES[difficulty])
      flash('', false)
      render(); startTimer()
    }, 20)
  }

  /* ---------- wiring ---------- */
  const onLevels = (e: Event) => {
    const b = (e.target as HTMLElement).closest('button') as HTMLElement | null
    if (!b) return
    difficulty = b.dataset.d as string
    ;(Array.from(levelsEl.children) as HTMLElement[]).forEach((x) => x.setAttribute('aria-pressed', String(x === b)))
    newGame()
  }
  const onNotes = () => { notesMode = !notesMode; btnNotes.setAttribute('aria-pressed', String(notesMode)) }
  const onErase = () => erase()
  const onHint = () => hint()
  const onNew = () => newGame()

  const onKey = (e: KeyboardEvent) => {
    if (e.key >= '1' && e.key <= '9') { place(+e.key) }
    else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { erase() }
    else if (e.key === 'n' || e.key === 'N') { notesMode = !notesMode; btnNotes.setAttribute('aria-pressed', String(notesMode)) }
    else if (sel >= 0) {
      const r = (sel / 9) | 0, c = sel % 9
      if (e.key === 'ArrowUp' && r > 0) sel -= 9
      else if (e.key === 'ArrowDown' && r < 8) sel += 9
      else if (e.key === 'ArrowLeft' && c > 0) sel -= 1
      else if (e.key === 'ArrowRight' && c < 8) sel += 1
      else return
      e.preventDefault()
      render()
    }
  }

  levelsEl.addEventListener('click', onLevels)
  btnNotes.addEventListener('click', onNotes)
  btnErase.addEventListener('click', onErase)
  btnHint.addEventListener('click', onHint)
  btnNew.addEventListener('click', onNew)
  document.addEventListener('keydown', onKey)

  build(); newGame()

  return () => {
    if (timerId) clearInterval(timerId)
    levelsEl.removeEventListener('click', onLevels)
    btnNotes.removeEventListener('click', onNotes)
    btnErase.removeEventListener('click', onErase)
    btnHint.removeEventListener('click', onHint)
    btnNew.removeEventListener('click', onNew)
    document.removeEventListener('keydown', onKey)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Textes UI par locale (auth gate + share button)
// ─────────────────────────────────────────────────────────────────────────────
const AUTH_STRINGS: Record<string, { title: string; desc: string; cta: string; back: string; shareBtn: string; shareCopied: string }> = {
  fr: {
    title: 'Jeu réservé aux membres',
    desc: "Le Sudoku de Moteurs.com est accessible gratuitement aux membres connectés. Connectez-vous ou créez un compte en 30 secondes — puis partagez le lien à un ami (il lui suffira d'être connecté pour jouer).",
    cta: "Se connecter / s'inscrire →",
    back: '← Tous les jeux',
    shareBtn: '🔗 Partager à un ami',
    shareCopied: 'Lien copié — envoyez-le à un ami ✓',
  },
  en: {
    title: 'Members-only game',
    desc: 'The Moteurs.com Sudoku is free for logged-in members. Sign in or create an account in 30 seconds — then share the link with a friend (they only need to be logged in to play).',
    cta: 'Sign in / create account →',
    back: '← All games',
    shareBtn: '🔗 Share with a friend',
    shareCopied: 'Link copied — send it to a friend ✓',
  },
  nl: {
    title: 'Enkel voor leden',
    desc: 'De Sudoku van Moteurs.com is gratis voor ingelogde leden. Meld u aan of maak in 30 seconden een account aan — deel dan de link met een vriend (hij hoeft alleen ingelogd te zijn om te spelen).',
    cta: 'Aanmelden / account aanmaken →',
    back: '← Alle spellen',
    shareBtn: '🔗 Delen met een vriend',
    shareCopied: 'Link gekopieerd — stuur het naar een vriend ✓',
  },
  de: {
    title: 'Nur für Mitglieder',
    desc: 'Das Sudoku von Moteurs.com ist kostenlos für eingeloggte Mitglieder. Melden Sie sich an oder erstellen Sie in 30 Sekunden ein Konto — teilen Sie dann den Link mit einem Freund (er muss nur eingeloggt sein, um zu spielen).',
    cta: 'Anmelden / Konto erstellen →',
    back: '← Alle Spiele',
    shareBtn: '🔗 Mit einem Freund teilen',
    shareCopied: 'Link kopiert — senden Sie ihn an einen Freund ✓',
  },
  es: {
    title: 'Juego solo para miembros',
    desc: 'El Sudoku de Moteurs.com es gratuito para los miembros registrados. Inicia sesión o crea una cuenta en 30 segundos — y comparte el enlace con un amigo (solo necesita estar conectado para jugar).',
    cta: 'Iniciar sesión / registrarse →',
    back: '← Todos los juegos',
    shareBtn: '🔗 Compartir con un amigo',
    shareCopied: 'Enlace copiado — envíalo a un amigo ✓',
  },
  it: {
    title: 'Gioco riservato ai membri',
    desc: 'Il Sudoku di Moteurs.com è gratuito per i membri registrati. Accedi o crea un account in 30 secondi — poi condividi il link con un amico (gli basta essere connesso per giocare).',
    cta: 'Accedi / registrati →',
    back: '← Tutti i giochi',
    shareBtn: '🔗 Condividi con un amico',
    shareCopied: 'Link copiato — invialo a un amico ✓',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant : gate auth + barre de partage + jeu.
// ─────────────────────────────────────────────────────────────────────────────
export default function SudokuContent() {
  const { isReady, isBootstrapped, userId } = useUserContext()
  const pathname = usePathname()
  const locale = useLocale()
  const [mounted, setMounted] = useState(false)
  const [shareMsg, setShareMsg] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const s = AUTH_STRINGS[locale] || AUTH_STRINGS['fr']

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || !userId) return
    const root = rootRef.current
    if (!root) return
    const cleanup = runSudoku(root)
    return cleanup
  }, [mounted, userId])

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://moteurs.com/jeux/sudoku'
    const titre = 'Sudoku — Moteurs.com'
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({ title: titre, url })
        return
      }
    } catch { /* partage natif annulé */ }
    try {
      await navigator.clipboard.writeText(url)
      setShareMsg(s.shareCopied)
      setTimeout(() => setShareMsg(''), 3500)
    } catch {
      setShareMsg(url)
    }
  }

  if (!mounted || !isReady) {
    return <div style={{ minHeight: '60vh' }} />
  }

  if (!isBootstrapped) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>Chargement…</span>
      </div>
    )
  }

  if (!userId) {
    return (
      <section style={{ maxWidth: 560, margin: '0 auto', padding: '64px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.6rem', marginBottom: 14 }}>🔒</div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 12, color: 'var(--color-text)' }}>
          {s.title}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 26 }}>
          {s.desc}
        </p>
        <Link
          href={`/espace-membres?next=${encodeURIComponent(pathname)}`}
          style={{
            display: 'inline-block', background: 'var(--color-primary)', color: '#fff',
            fontWeight: 700, padding: '12px 26px', borderRadius: 10, textDecoration: 'none',
          }}
        >
          {s.cta}
        </Link>
        <div style={{ marginTop: 18 }}>
          <Link href="/jeux" style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
            {s.back}
          </Link>
        </div>
      </section>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SUDOKU_CSS }} />
      <div style={{
        maxWidth: 480, margin: '0 auto', padding: '18px 16px 0',
        display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/jeux" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}>
          {s.back}
        </Link>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {shareMsg && (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>{shareMsg}</span>
          )}
          <button
            type="button"
            onClick={handleShare}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              background: 'var(--color-primary)', color: '#fff', border: 'none',
              fontWeight: 700, fontSize: '0.88rem', padding: '9px 18px', borderRadius: 999,
            }}
          >
            {s.shareBtn}
          </button>
        </div>
      </div>
      <main className="m-sudoku" ref={rootRef} dangerouslySetInnerHTML={{ __html: SUDOKU_HTML }} />
    </>
  )
}
