// site.js - sends nothing, saves nothing. dark mode, faq links n the scroll story. page works fine w/o it
(function () {
  'use strict'
  var root = document.documentElement
  root.classList.add('js')
  var lessMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  // light / dark
  var darkSetting = window.matchMedia('(prefers-color-scheme: dark)')
  var chosenTheme = null
  function applyTheme() {
    var theme = chosenTheme || (darkSetting.matches ? 'dark' : 'light')
    root.setAttribute('data-theme', theme)
    var colour = document.querySelector('meta[name="theme-color"]')
    if (colour) colour.setAttribute('content', theme === 'dark' ? '#111317' : '#ffffff')
    var button = document.querySelector('.theme-toggle')
    if (button) button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode')
  }
  applyTheme()
  if (darkSetting.addEventListener) darkSetting.addEventListener('change', applyTheme)

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme()
    var button = document.querySelector('.theme-toggle')
    if (button) button.addEventListener('click', function () {
      chosenTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
      applyTheme()
    })

    // headline highlight: put it just under the letters on every device (measures the baseline, not the font box)
    function placeSwipes() {
      var marks = document.querySelectorAll('.swipe')
      for (var i = 0; i < marks.length; i++) {
        var s = marks[i]
        var probe = document.createElement('i')
        probe.className = 'swipe-probe'
        s.appendChild(probe)
        var size = parseFloat(getComputedStyle(s).fontSize)
        var base = (probe.getBoundingClientRect().bottom - s.getBoundingClientRect().top) / size
        s.removeChild(probe)
        if (base > 0.3 && base < 2) s.style.setProperty('--swipe-top', (base + 0.04).toFixed(3) + 'em')
      }
    }
    placeSwipes()
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeSwipes)
    window.addEventListener('resize', placeSwipes)

    // #link to a question opens it
    function openTarget() {
      var id = location.hash.slice(1)
      var el = id ? document.getElementById(id) : null
      if (el && el.tagName === 'DETAILS') el.open = true
    }
    window.addEventListener('hashchange', openTarget)
    openTarget()


    // blinks + tongue now n then. only on screen stuff, not a loop (battery)
    var drawings = document.querySelectorAll('.ill')
    function onScreen(el) {
      var r = el.getBoundingClientRect()
      return r.bottom > 0 && r.top < window.innerHeight && r.width > 0
    }
    function forVisible(fn) {
      if (document.hidden || lessMotion.matches) return
      for (var i = 0; i < drawings.length; i++) if (onScreen(drawings[i])) fn(drawings[i])
    }
    function every(min, max, fn) {
      setTimeout(function () { fn(); every(min, max, fn) }, min + Math.random() * (max - min))
    }
    every(3500, 7500, function () {
      forVisible(function (d) { d.style.setProperty('--eyes', '0.08') })
      setTimeout(function () { forVisible(function (d) { d.style.setProperty('--eyes', '1') }); for (var i = 0; i < drawings.length; i++) drawings[i].style.setProperty('--eyes', '1') }, 160)
    })
    every(7000, 13000, function () {
      var steps = [['-9deg', 0], ['8deg', 160], ['-4deg', 320], ['0deg', 480]]
      steps.forEach(function (st) { setTimeout(function () { forVisible(function (d) { d.style.setProperty('--wag', st[0]) }) }, st[1]) })
    })

    // the story
    var story = document.querySelector('.story')
    var steps = story ? story.querySelectorAll('.step') : []
    var transcript = story ? story.querySelector('.v-transcript') : null
    if (!story || !steps.length || !('IntersectionObserver' in window)) return

    // replay each step's lil animation when u get there. the rec clock actually counts on step 1
    var clockTimer = null
    function startClock(view) {
      if (clockTimer) { clearInterval(clockTimer); clockTimer = null }
      var clock = story.querySelector('.stage .v-record .rec b')
      if (view !== 'record' || !clock || lessMotion.matches) return
      var seconds = 12
      clock.textContent = '0:' + String(seconds).padStart(2, '0')
      clockTimer = setInterval(function () { seconds++; clock.textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0') }, 1000)
    }
    function replay(view) {
      var el = story.querySelector('.stage .v-' + view)
      if (!el || lessMotion.matches) return
      el.classList.remove('go')
      void el.offsetWidth // restart the animation
      el.classList.add('go')
    }
    var progress = story.querySelectorAll('.progress a')
    function markProgress(view) {
      for (var i = 0; i < progress.length; i++) {
        if (progress[i].getAttribute('data-view') === view) progress[i].setAttribute('aria-current', 'step')
        else progress[i].removeAttribute('aria-current')
      }
    }
    var played = false
    function show(step) {
      var view = step.getAttribute('data-view')
      markProgress(view)
      for (var i = 0; i < steps.length; i++) steps[i].classList.toggle('on', steps[i] === step)
      if (story.getAttribute('data-view') === view) return
      story.setAttribute('data-view', view)
      startClock(view)
      // card only flips on step 4
      var study = story.querySelector('.stage .v-study')
      if (study && view !== 'study') study.classList.remove('go')
      if (view !== 'transcript') replay(view)
      // transcript plays once (not w/ reduced motion)
      if (view === 'transcript' && !played && transcript && !lessMotion.matches) {
        played = true
        transcript.classList.add('play')
        setTimeout(function () { transcript.classList.remove('play') }, 3400)
      }
    }
    // phones: copy each view under its step
    var stageWindow = story.querySelector('.stage .window')
    if (stageWindow) {
      for (var s = 0; s < steps.length; s++) {
        var original = stageWindow.querySelector('.v-' + steps[s].getAttribute('data-view'))
        if (!original) continue
        var figure = document.createElement('div')
        figure.className = 'step-window'
        figure.setAttribute('aria-hidden', 'true')
        var frame = document.createElement('div')
        frame.className = 'window'
        frame.appendChild(original.cloneNode(true))
        figure.appendChild(frame)
        steps[s].appendChild(figure)
      }
      story.classList.add('has-mini')
    }

    // whichever step crosses the middle is the active one
    var watcher = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) if (entries[i].isIntersecting) show(entries[i].target)
    }, { rootMargin: '-45% 0px -45% 0px' })
    for (var i = 0; i < steps.length; i++) watcher.observe(steps[i])
    story.setAttribute('data-view', 'record')
    steps[0].classList.add('on')
    markProgress('record')
    startClock('record')
    replay('record')
  })
})()

// the drawings only move while you can see them (saves battery)
;(function () {
  if (!('IntersectionObserver' in window)) return
  var watch = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) entries[i].target.classList.toggle('inview', entries[i].isIntersecting)
  }, { threshold: 0.15 })
  function hook() { var all = document.querySelectorAll('.ill'); for (var i = 0; i < all.length; i++) watch.observe(all[i]) }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { hook(); setTimeout(hook, 500) })
  else hook()
})()
