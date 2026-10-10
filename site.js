// The Daftari website's only script. It does two things and sends nothing anywhere:
//
// 1. Steps. The two scenes (the notebook, the lecture) are pinned while you scroll past them. The script only works out
//    which step you have reached and writes it on the scene as data-step="2"; the style sheet then plays that step as a
//    short animation that always finishes. So wherever you stop scrolling, the picture is complete, never half-turned.
// 2. Smooth wheel. A mouse wheel moves the page in jumps of about 100 pixels; here the page glides to where the wheel
//    asked for instead. Trackpads, keyboards and the scroll bar work as usual.
// 3. The questions open and close smoothly, and a link to a question opens it.
// 4. The desk lamp in the top-left corner that lights what you are reading (see its own part at the end).
// And: light or dark. It follows the computer's setting; the sun/moon button switches it for this visit (nothing is stored).
//
// Without this script (or with "reduce motion" switched on) the page is still complete: everything is shown at once.
(function () {
  'use strict'
  var root = document.documentElement
  root.classList.add('js')

  // Light or dark: the computer's setting, unless the sun/moon button was used on this visit (nothing is stored).
  var lightSetting = window.matchMedia('(prefers-color-scheme: light)')
  var chosenTheme = null
  function applyTheme() {
    var theme = chosenTheme || (lightSetting.matches ? 'light' : 'dark')
    root.setAttribute('data-theme', theme)
    var button = document.querySelector('.theme-toggle')
    if (button) button.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode')
  }
  applyTheme()
  if (lightSetting.addEventListener) lightSetting.addEventListener('change', applyTheme)
  document.addEventListener('DOMContentLoaded', function () {
    var button = document.querySelector('.theme-toggle')
    if (!button) return
    applyTheme()
    button.addEventListener('click', function () {
      chosenTheme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'
      applyTheme()
    })
  })

  // A link to a question (for example "#report") opens that question, with or without motion.
  function openTarget(id) {
    var el = id ? document.getElementById(id) : null
    if (el && el.tagName === 'DETAILS') el.open = true
  }
  window.addEventListener('hashchange', function () { openTarget(location.hash.slice(1)) })
  document.addEventListener('DOMContentLoaded', function () { openTarget(location.hash.slice(1)) })

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  root.classList.add('motion')

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)) }

  // ---------- 1. steps ----------
  var scenes = []
  var stepQueued = false

  function updateSteps() {
    stepQueued = false
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i]
      var box = s.el.getBoundingClientRect()
      var stage = s.stage.getBoundingClientRect()
      // While the scene is pinned its stage slides down inside the (taller) scene: from its top (0) to its bottom (1).
      var pinned = box.height - stage.height
      var p = pinned > 0 ? clamp((stage.top - box.top) / pinned, 0, 1) : 0
      // The first step changes soon after the scene is pinned; the last one holds for a while before the scene leaves.
      var step = clamp(Math.floor(p * (s.count - 1) + 0.75), 0, s.count - 1)
      if (step !== s.step) { s.step = step; s.el.setAttribute('data-step', String(step)) }
      // "live": on screen (the sound bars move, the clock ticks). "entered": well in view, so its opening can play.
      var live = box.bottom > 0 && box.top < window.innerHeight
      if (live !== s.live) { s.live = live; s.el.classList.toggle('live', live) }
      var entered = box.bottom > 0 && box.top < window.innerHeight * 0.45
      if (entered !== s.entered) { s.entered = entered; s.el.classList.toggle('entered', entered) }
    }
  }
  function queueSteps() { if (!stepQueued) { stepQueued = true; requestAnimationFrame(updateSteps) } }

  // The pinned scenes sit just under the header; tell the style sheet how tall the header really is (it wraps on some widths).
  function measure() {
    var header = document.querySelector('.top')
    if (header) root.style.setProperty('--top-h', Math.round(header.getBoundingClientRect().height) + 'px')
    queueSteps()
  }

  // ---------- 2. smooth wheel ----------
  var target = 0, current = 0, lastSet = -1, gliding = false, lastTime = 0
  var GLIDE_MS = 110 // how long the page takes to catch up with the wheel (bigger = softer, but feels slower)

  function maxScroll() { return root.scrollHeight - window.innerHeight }

  function glide(now) {
    if (!gliding) return
    // Someone else moved the page (scroll bar, keyboard, a link): stop and let them.
    if (lastSet >= 0 && Math.abs(window.scrollY - lastSet) > 2) { gliding = false; return }
    var dt = Math.min(64, now - (lastTime || now))
    lastTime = now
    current += (target - current) * (1 - Math.exp(-dt / GLIDE_MS))
    if (Math.abs(target - current) < 0.5) { current = target; gliding = false }
    window.scrollTo(0, current)
    lastSet = window.scrollY
    if (gliding) requestAnimationFrame(glide)
  }

  function glideTo(y) {
    target = clamp(y, 0, maxScroll())
    if (!gliding) { current = window.scrollY; lastSet = -1; lastTime = 0; gliding = true; requestAnimationFrame(glide) }
  }

  function scrollsItself(el) {
    for (; el && el !== document.body && el !== root; el = el.parentElement) {
      if (el.scrollHeight > el.clientHeight + 1) {
        var oy = getComputedStyle(el).overflowY
        if (oy === 'auto' || oy === 'scroll') return true
      }
    }
    return false
  }

  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.defaultPrevented) return // Ctrl + wheel zooms the page
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
    if (scrollsItself(e.target)) return
    var d = e.deltaY
    if (e.deltaMode === 1) d *= 40
    else if (e.deltaMode === 2) d *= window.innerHeight
    // Trackpads send many small, already smooth movements: leave those to the browser.
    if (!gliding && Math.abs(d) < 40 && e.deltaMode === 0) return
    e.preventDefault()
    glideTo((gliding ? target : window.scrollY) + d)
  }, { passive: false })

  // Links to places on this page glide there too (the header's height is left free above the heading).
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]')
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return
    var id = a.getAttribute('href').slice(1)
    var place = id ? document.getElementById(id) : null
    if (!place) return
    e.preventDefault()
    openTarget(id)
    var header = document.querySelector('.top')
    var y = place === header || id === 'top' ? 0 : place.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0)
    history.pushState(null, '', '#' + id)
    glideTo(y)
    if (!place.hasAttribute('tabindex')) place.setAttribute('tabindex', '-1')
    place.focus({ preventScroll: true })
  })

  // ---------- 3. the questions open and close smoothly ----------
  // The answer's height slides open (or shut) instead of jumping; a second click in the middle turns it round from where it is.
  function animateQuestion(d) {
    var summary = d.querySelector('summary')
    var body = d.querySelector('.answer')
    if (!summary || !body || !body.animate) return
    var running = null
    summary.addEventListener('click', function (e) {
      e.preventDefault()
      var from = body.getBoundingClientRect().height
      var opening = !d.open || d.classList.contains('closing')
      if (running) running.cancel()
      d.classList.toggle('closing', !opening)
      if (opening) d.open = true
      var full = body.scrollHeight
      var start = running ? from : opening ? 0 : full
      body.style.overflow = 'hidden'
      running = body.animate(
        opening
          ? [{ height: start + 'px', opacity: start ? 1 : 0, transform: start ? 'none' : 'translateY(-6px)' }, { height: full + 'px', opacity: 1, transform: 'none' }]
          : [{ height: start + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
        { duration: opening ? 340 : 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      )
      var mine = running
      mine.onfinish = function () {
        if (running !== mine) return
        running = null
        body.style.overflow = ''
        if (!opening) { d.open = false; d.classList.remove('closing') }
      }
    })
  }

  // ---------- the recording clock in the lecture scene ticks while you can see it ----------
  var clock = null, seconds = 48 * 60 + 7
  function tick() {
    var lecture = document.querySelector('.lecture')
    if (clock && lecture && lecture.classList.contains('live')) {
      seconds++
      clock.textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0')
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var els = document.querySelectorAll('[data-steps]')
    for (var i = 0; i < els.length; i++) {
      scenes.push({ el: els[i], stage: els[i].querySelector('[data-stage]'), count: Number(els[i].getAttribute('data-steps')), step: -1, live: null, entered: null })
    }
    var questions = document.querySelectorAll('.faq details')
    for (var q = 0; q < questions.length; q++) animateQuestion(questions[q])
    clock = document.querySelector('.rec-time')
    measure()
    window.addEventListener('scroll', queueSteps, { passive: true })
    window.addEventListener('resize', measure)
    window.addEventListener('load', measure) // (again once the fonts have arrived)
    setInterval(tick, 1000)
  })
})()

// ---------- 4. the desk lamp ----------
// A desk lamp hangs from the top-left corner and lights what you are reading through the notebook and the lecture: one soft
// pool of light over the words (never over single lines), with faint dust in the beam. It stays in the empty strip beside
// the text, so it never covers words; it re-aims a little when the words change and drifts slowly while you read. Past the
// lecture it "dies" (the bulb sputters out and it sags); scroll back and it wakes with a few shakes. Only on screens wide
// enough to have room beside the text, and never with "reduce motion". Everything eases (no swing), the same on any screen.
;(function () {
  'use strict'
  var root = document.documentElement
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  var SVG = 'http://www.w3.org/2000/svg'
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)) }
  var ease = function (from, to, dt, seconds) { return from + (to - from) * (1 - Math.exp(-dt / seconds)) }
  var easeAngle = function (from, to, dt, seconds) { return from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * (1 - Math.exp(-dt / seconds)) }
  var q = function (s) { return document.querySelector(s) }
  var CAPTIONS = ['.cH', '.c0', '.c1', '.c2', '.c3']
  // each step of the page gets its own small aim, so the lamp adjusts a little when the words change in the same place
  var AIMS = [[0, 0], [26, -14], [-18, 18], [22, 22], [-24, -10], [14, 26], [-12, -22]]
  function aimFor(key) { var h = 0; for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0; return AIMS[h % AIMS.length] }
  // the bulb: a dying sputter (dimmer each time), a waking one, and the jolt of a fast scroll
  var DIE = [[0, 1], [70, 0.35], [130, 0.85], [210, 0.2], [290, 0.6], [350, 0.08], [470, 0.4], [520, 0.03], [680, 0.18], [730, 0]]
  var WAKE = [[0, 0], [90, 0.5], [140, 0.05], [230, 0.8], [290, 0.25], [380, 1]]
  var JOLT = [[0, 0.3], [60, 1], [110, 0.5], [180, 1], [260, 0.7], [310, 0.95], [420, 1]]
  function level(pattern, since, end, otherwise) {
    if (since < 0 || since >= end) return otherwise
    var v = otherwise
    for (var i = 0; i < pattern.length; i++) if (since >= pattern[i][0]) v = pattern[i][1]
    return v
  }

  // what is being read: the caption beside the notebook, the lecture's words, or the visible part of the section in the middle
  function readingArea(headerH, column) {
    var mid = innerHeight * 0.5, left = column.left + 28
    var story = q('.story'), lecture = q('.lecture')
    var scenes = [[story, function () { return '.story .caption' + CAPTIONS[clamp(Number(story.getAttribute('data-step') || 0), 0, 4)] }], [lecture, function () { return '.lecture-words' }]]
    for (var i = 0; i < scenes.length; i++) {
      var scene = scenes[i][0]
      if (!scene) continue
      var r = scene.getBoundingClientRect()
      if (r.top < mid && r.bottom > mid) {
        var w = q(scenes[i][1]()).getBoundingClientRect()
        return { x: left, y: Math.max(w.top, headerH + 30), w: Math.max(w.width, 420), h: clamp(w.height, 200, innerHeight * 0.6), key: scene.id + (scene.getAttribute('data-step') || '') }
      }
    }
    var sections = document.querySelectorAll('main > section.plain')
    for (var j = 0; j < sections.length; j++) {
      var s = sections[j].getBoundingClientRect()
      if (s.top < mid && s.bottom > mid) {
        var top = Math.max(s.top + 40, headerH + 30), bottom = Math.min(s.bottom - 40, innerHeight - 30)
        return { x: left, y: top, w: Math.min(column.width - 56, 860), h: Math.max(bottom - top, 160), key: sections[j].id }
      }
    }
    return { x: left, y: innerHeight * 0.3, w: 640, h: innerHeight * 0.4, key: 'none' }
  }

  // ---------- building the lamp (plain elements; nothing is written as HTML text) ----------
  var L = {}
  function el(tag, cls, parent, attrs) {
    var e = tag === 'div' || tag === 'canvas' ? document.createElement(tag) : document.createElementNS(SVG, tag)
    if (cls) e.setAttribute('class', cls)
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k])
    if (parent) parent.appendChild(e)
    return e
  }
  function build() {
    var fx = el('div', 'deskfx', document.body, { 'aria-hidden': 'true' })
    var light = el('div', 'desk-light', fx)
    L.spot = el('div', 'desk-spot', light)
    L.beam = el('div', 'desk-beam', light)
    L.canvas = el('canvas', 'desk-dust', light)
    var svg = el('svg', 'desk-lamp', fx)
    var grad = el('radialGradient', null, el('defs', null, svg), { id: 'desk-bulb' })
    el('stop', null, grad, { offset: '0', 'stop-color': '#fff6dc' })
    el('stop', null, grad, { offset: '0.45', 'stop-color': '#ffd98f' })
    el('stop', null, grad, { offset: '1', 'stop-color': '#ffd98f', 'stop-opacity': '0' })
    L.bracket = el('rect', 'bracket', svg, { width: '30', height: '52', rx: '6' })
    L.spring = el('line', 'spring', svg)
    L.a1 = el('line', 'arm', svg); L.a1b = el('line', 'arm thin', svg)
    L.a2 = el('line', 'arm', svg); L.a2b = el('line', 'arm thin', svg)
    L.j0 = el('circle', 'joint', svg, { r: '11' }); L.j1 = el('circle', 'joint', svg, { r: '8' }); L.j2 = el('circle', 'joint', svg, { r: '7' })
    L.head = el('g', null, svg)
    el('path', 'shade', L.head, { d: 'M-8 -12 L56 -36 Q66 0 56 36 L-8 12 Z' })
    el('path', 'rim', L.head, { d: 'M56 -36 Q66 0 56 36' })
    L.bulb = el('g', null, L.head)
    el('ellipse', 'bulb', L.bulb, { cx: '56', cy: '0', rx: '10', ry: '31', fill: 'url(#desk-bulb)' })
    L.fx = fx; L.light = light
  }

  // ---------- dust drifting in the beam (faint, only inside the light) ----------
  var dust = [], ctx = null
  function sizeCanvas() {
    var dpr = Math.min(2, window.devicePixelRatio || 1)
    L.canvas.width = innerWidth * dpr; L.canvas.height = innerHeight * dpr
    ctx = L.canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    dust.length = 0
    for (var i = 0; i < 170; i++) dust.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: 0.5 + Math.random() * 1.5, vx: (Math.random() - 0.5) * 0.1, vy: -0.03 - Math.random() * 0.08, ph: Math.random() * 6.28 })
  }
  function drawDust(time, scrolled, ox, oy, ang, half, reach, lit) {
    ctx.clearRect(0, 0, innerWidth, innerHeight)
    if (root.getAttribute('data-theme') === 'light' || lit < 0.02) return
    for (var i = 0; i < dust.length; i++) {
      var d = dust[i]
      d.x += d.vx + Math.sin(time / 2000 + d.ph) * 0.06
      d.y += d.vy - scrolled * 0.25
      if (d.y < -10) d.y += innerHeight + 20; if (d.y > innerHeight + 10) d.y -= innerHeight + 20
      if (d.x < -10) d.x += innerWidth + 20; if (d.x > innerWidth + 10) d.x -= innerWidth + 20
      var dx = d.x - ox, dy = d.y - oy, dist = Math.hypot(dx, dy)
      var a = Math.atan2(dy, dx) - ang
      var diff = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)))
      if (diff > half || dist > reach) continue
      var alpha = (1 - diff / half) * (1 - dist / reach) * (0.5 + 0.5 * Math.sin(time / 700 + d.ph)) * lit
      ctx.fillStyle = 'rgba(255, 228, 176, ' + (alpha * 0.95).toFixed(3) + ')'
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill()
    }
  }

  // ---------- every frame ----------
  var area = null, shoulder = null, elbow = null, shade = null, last = 0, scrollLast = 0
  var alive = true, changedAt = -1e9, slump = 0
  var speed = 0, joltAt = -1e9, calmUntil = 0
  var shiftX = 0, shiftY = 0
  var MOUTH = 58
  function set(e, attrs) { for (var n in attrs) e.setAttribute(n, attrs[n]) }

  function frame(time) {
    requestAnimationFrame(frame)
    var dt = last ? Math.min(0.05, (time - last) / 1000) : 1
    last = time
    var column = q('main').getBoundingClientRect()
    var textLeft = column.left + 28
    // no room beside the text (phones, narrow windows): no lamp
    var room = innerWidth >= 900
    root.classList.toggle('lamp-none', !room)
    if (!room) return
    var header = q('.top'), headerH = header ? header.getBoundingClientRect().height : 74

    var want = readingArea(headerH, column)
    var scrolled = scrollY - scrollLast
    scrollLast = scrollY
    speed = ease(speed, Math.abs(scrolled) / Math.max(dt, 0.001), dt, 0.08) // pixels a second
    if (speed > 2600 && time > calmUntil && alive && time - changedAt > 900) { joltAt = time; calmUntil = time + 1500 }
    if (!area) area = { x: want.x, y: want.y, w: want.w, h: want.h }
    area.x = ease(area.x, want.x, dt, 0.35); area.y = ease(area.y, want.y, dt, 0.35)
    area.w = ease(area.w, want.w, dt, 0.35); area.h = ease(area.h, want.h, dt, 0.35)
    // a small re-aim when the words change, and a slow drift over the words as if someone were reading under it
    var aim = aimFor(want.key)
    shiftX = ease(shiftX, aim[0], dt, 0.7); shiftY = ease(shiftY, aim[1], dt, 0.7)
    var driftX = Math.sin(time / 5300) * Math.min(area.w * 0.06, 28)
    var driftY = Math.sin(time / 3900 + 1.3) * Math.min(area.h * 0.08, 18)
    var cx = area.x + area.w * 0.42 + shiftX + driftX, cy = area.y + area.h * 0.45 + shiftY + driftY

    // past the lecture the lamp dies; back up, it wakes (a gap between the two points, so it does not flip back and forth)
    var features = q('#features')
    var featuresTop = features ? features.getBoundingClientRect().top : Infinity
    if (alive && featuresTop < innerHeight * 0.45) { alive = false; changedAt = time }
    else if (!alive && featuresTop > innerHeight * 0.62) { alive = true; changedAt = time }
    var since = time - changedAt
    var lit = alive ? level(WAKE, since, 900, 1) : level(DIE, since, 900, 0)
    slump = ease(slump, alive ? 0 : 1, dt, alive ? 0.35 : 0.6)
    var t = since / 1000
    var shake = alive && t < 0.9 ? 0.09 * Math.sin(t * Math.PI * 2 * 6.5) * Math.exp(-t * 4.2) : 0

    // the head: in the empty strip left of the words (only the shade peeks in where the strip is narrow); the arm lifts and
    // lowers it with each re-aim and the slow drift, never towards the words; dead, it sags
    var headX = clamp(textLeft - 125, -50, 260) + Math.min(0, shiftX * 0.5 + driftX * 0.6) - slump * 14
    var headY = headerH + 130 + clamp((cy - innerHeight * 0.45) * 0.16, -48, 48) + shiftY * 1.3 + driftY * 1.6 + slump * 46
    var base = { x: -6, y: headerH + 14 }
    var span = Math.hypot(headX - base.x, headY - base.y)
    var L1 = clamp(span * 0.62, 140, 300), L2 = L1 * 0.85
    var d = clamp(span, 40, L1 + L2 - 4)
    var toHead = Math.atan2(headY - base.y, headX - base.x)
    // (the elbow bends down and out, so the arm hangs from the corner instead of poking up under the header)
    var wantShoulder = toHead + Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1))
    var wantElbow = Math.atan2(headY - (base.y + L1 * Math.sin(wantShoulder)), headX - (base.x + L1 * Math.cos(wantShoulder)))
    if (shoulder === null) { shoulder = wantShoulder; elbow = wantElbow }
    var sway = Math.sin(time / 4200) * 0.022
    var flex = Math.sin(time / 3100 + 0.8) * 0.04 // the elbow bends and straightens slowly
    shoulder = easeAngle(shoulder, wantShoulder + sway, dt, 0.5)
    elbow = easeAngle(elbow, wantElbow - sway * 0.6 + flex, dt, 0.5)
    var el2 = elbow + shake * 0.35
    var e = { x: base.x + L1 * Math.cos(shoulder), y: base.y + L1 * Math.sin(shoulder) }
    var h = { x: e.x + L2 * Math.cos(el2), y: e.y + L2 * Math.sin(el2) }
    var wantShade = Math.atan2(cy - h.y, cx - h.x)
    wantShade += Math.atan2(Math.sin(Math.PI * 0.6 - wantShade), Math.cos(Math.PI * 0.6 - wantShade)) * slump * 0.75 // dead, it hangs down
    if (shade === null) shade = wantShade
    shade = easeAngle(shade, wantShade, dt, 0.4)
    var shown = shade + shake

    set(L.bracket, { x: -10, y: base.y - 26 })
    set(L.a1, { x1: base.x, y1: base.y, x2: e.x, y2: e.y })
    set(L.a1b, { x1: base.x + 6 * Math.sin(shoulder), y1: base.y - 6 * Math.cos(shoulder), x2: e.x + 6 * Math.sin(shoulder), y2: e.y - 6 * Math.cos(shoulder) })
    set(L.a2, { x1: e.x, y1: e.y, x2: h.x, y2: h.y })
    set(L.a2b, { x1: e.x + 6 * Math.sin(el2), y1: e.y - 6 * Math.cos(el2), x2: h.x + 6 * Math.sin(el2), y2: h.y - 6 * Math.cos(el2) })
    set(L.spring, { x1: base.x + 30 * Math.cos(shoulder + 0.5), y1: base.y + 30 * Math.sin(shoulder + 0.5), x2: base.x + L1 * 0.55 * Math.cos(shoulder), y2: base.y + L1 * 0.55 * Math.sin(shoulder) })
    set(L.j0, { cx: base.x, cy: base.y }); set(L.j1, { cx: e.x, cy: e.y }); set(L.j2, { cx: h.x, cy: h.y })
    var deg = (shown * 180) / Math.PI
    set(L.head, { transform: 'translate(' + h.x.toFixed(1) + ' ' + h.y.toFixed(1) + ') rotate(' + deg.toFixed(2) + ')' })

    // one broad, soft beam over the reading area, and the pool where it lands (stretched along the beam)
    var ox = h.x + MOUTH * Math.cos(shown), oy = h.y + MOUTH * Math.sin(shown)
    var dist = Math.hypot(cx - ox, cy - oy)
    var len = Math.max(dist * 1.5, 600)
    var half = clamp(Math.atan2(Math.max(area.w * 0.5, area.h * 0.55), Math.max(dist, 1)), 0.25, 0.75)
    L.beam.style.width = len + 'px'
    L.beam.style.height = len * 2 + 'px'
    L.beam.style.transform = 'translate(' + ox + 'px, ' + (oy - len) + 'px) rotate(' + deg + 'deg)'
    L.beam.style.setProperty('--half', ((half * 180) / Math.PI).toFixed(1) + 'deg')
    var along = Math.hypot(area.w, area.h) * 0.8 + 160, across = Math.max(area.h * 1.15, area.w * 0.55) + 120
    var px = cx - Math.cos(shown) * along * 0.05, py = cy - Math.sin(shown) * along * 0.05
    L.spot.style.width = along + 'px'; L.spot.style.height = across + 'px'
    L.spot.style.transform = 'translate(' + (px - along / 2) + 'px, ' + (py - across / 2) + 'px) rotate(' + deg + 'deg)'
    // a very faint filament flicker, and the jolt of a fast scroll
    var flicker = 1 - 0.05 * (0.5 + 0.5 * (Math.sin(time / 173) * 0.5 + Math.sin(time / 417) * 0.3 + Math.sin(time / 1131) * 0.2))
    var jolt = level(JOLT, time - joltAt, 420, 1)
    L.light.style.opacity = (lit * flicker * jolt).toFixed(3)
    L.bulb.setAttribute('opacity', (lit * (0.9 + 0.1 * flicker) * (0.4 + 0.6 * jolt)).toFixed(3))
    drawDust(time, scrolled, ox, oy, shown, half, len, lit)
  }

  document.addEventListener('DOMContentLoaded', function () {
    build()
    sizeCanvas()
    window.addEventListener('resize', sizeCanvas)
    scrollLast = scrollY
    requestAnimationFrame(frame)
    requestAnimationFrame(function () { L.fx.classList.add('on') })
  })
})()
