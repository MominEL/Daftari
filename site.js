// The Daftari website's only script. It sends nothing anywhere and stores nothing. It does three small things:
//
// 1. Light or dark. It follows the computer's setting; the sun/moon button switches it for this visit only.
// 2. A link to a question (for example "#report") opens that question.
// 3. The story. While you scroll through the five steps of a lecture, the drawn Daftari window shows the step in view:
//    the script only writes the step's name on the story (data-view="transcript"); the style sheet shows that view.
//    On a phone there is no pinned window: the script copies each view into its own step instead, so each step has a small
//    window under its text.
//    When the transcript step arrives, its lines come in one by one and the key words are marked, once.
//
// Without this script the page is complete: every step is readable and the window shows the finished notes.
// When the computer asks for less motion, the window still changes with the steps, but nothing slides or fades.
(function () {
  'use strict'
  var root = document.documentElement
  root.classList.add('js')
  var lessMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  // ---------- 1. light or dark ----------
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

    // ---------- 2. a link to a question opens it ----------
    function openTarget() {
      var id = location.hash.slice(1)
      var el = id ? document.getElementById(id) : null
      if (el && el.tagName === 'DETAILS') el.open = true
    }
    window.addEventListener('hashchange', openTarget)
    openTarget()


    // ---------- 4. the character blinks and wags its tongue now and then ----------
    // (A few moments, not a constant animation: the lines are drawn with a wobble filter, and a filter that is redrawn
    // every frame would use the battery. Only drawings that are on screen move, and not while the page is hidden.)
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

    // ---------- 3. the story ----------
    var story = document.querySelector('.story')
    var steps = story ? story.querySelectorAll('.step') : []
    var transcript = story ? story.querySelector('.v-transcript') : null
    if (!story || !steps.length || !('IntersectionObserver' in window)) return

    // Each step plays its own small moment when it arrives: the view gets the class "go" again, which restarts its animations.
    // (The recording clock really counts while the first step is in view.)
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
      void el.offsetWidth // let the browser notice, so the animations start again
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
      // the flashcard only turns while step 4 is in view
      var study = story.querySelector('.stage .v-study')
      if (study && view !== 'study') study.classList.remove('go')
      if (view !== 'transcript') replay(view)
      // the transcript plays in the first time it is shown (not when the computer asks for less motion)
      if (view === 'transcript' && !played && transcript && !lessMotion.matches) {
        played = true
        transcript.classList.add('play')
        // afterwards it is just shown, so coming back to this step does not play it again
        setTimeout(function () { transcript.classList.remove('play') }, 3400)
      }
    }
    // On a phone each step gets its own small window: the views are copied into the steps (the copies are only drawn on
    // narrow screens; the style sheet hides them elsewhere).
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

    // The step that crosses the middle of the window is the one in view (the stage is hidden on a phone, where this does nothing visible).
    var watcher = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) if (entries[i].isIntersecting) show(entries[i].target)
    }, { rootMargin: '-45% 0px -45% 0px' })
    for (var i = 0; i < steps.length; i++) watcher.observe(steps[i])
    // Before the first step reaches the middle, show the start of the lecture.
    story.setAttribute('data-view', 'record')
    steps[0].classList.add('on')
    markProgress('record')
    startClock('record')
    replay('record')
  })
})()
