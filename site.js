// The Daftari website's only script. It does two things and sends nothing anywhere:
//
// 1. Steps. The two scenes (the notebook, the lecture) are pinned while you scroll past them. The script only works out
//    which step you have reached and writes it on the scene as data-step="2"; the style sheet then plays that step as a
//    short animation that always finishes. So wherever you stop scrolling, the picture is complete, never half-turned.
// 2. Smooth wheel. A mouse wheel moves the page in jumps of about 100 pixels; here the page glides to where the wheel
//    asked for instead. Trackpads, keyboards and the scroll bar work as usual.
//
// Without this script (or with "reduce motion" switched on) the page is still complete: everything is shown at once.
(function () {
  'use strict'
  var root = document.documentElement
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
    var header = document.querySelector('.top')
    var y = place === header || id === 'top' ? 0 : place.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0)
    history.pushState(null, '', '#' + id)
    glideTo(y)
    if (!place.hasAttribute('tabindex')) place.setAttribute('tabindex', '-1')
    place.focus({ preventScroll: true })
  })

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
    clock = document.querySelector('.rec-time')
    measure()
    window.addEventListener('scroll', queueSteps, { passive: true })
    window.addEventListener('resize', measure)
    window.addEventListener('load', measure) // (again once the fonts have arrived)
    setInterval(tick, 1000)
  })
})()
