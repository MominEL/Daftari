<img src="img/og.jpg" alt="Daftari (دفتري): a free notes app for students, with AI built in. For Windows and Mac." width="760">

# Daftari

A free notes app for students. Record a lecture, get notes written from it, and revise from them.

**[Download it from the website](https://mominel.github.io/Daftari/)** – Windows 10/11 and Macs with Apple silicon (M1 or newer).

Made by Momin. I'm a student and built it for my own lectures.

## What it does

- Records the lecture from your mic, your computer's sound (Teams, online lectures), or both. Saves every 30 seconds, so a crash or a flat battery loses almost nothing.
- Turns the speech into text on your own computer (Whisper). Nothing is uploaded for that.
- An AI of your choice writes notes from it while you listen. You check them before anything is saved.
- Flashcards with spaced repetition and quizzes, by hand or made by the AI.
- A proper editor: headings, lists, tables, code, images, PDFs, maths in LaTeX, a `/` menu.
- Search inside every page.
- Your notes are plain files in a folder you pick. Put it in OneDrive, iCloud or Dropbox, or sync with your own private GitHub repo.

## Installing

Grab the file from the [website](https://mominel.github.io/Daftari/) or the [latest release](https://github.com/MominEL/Daftari/releases/latest):

- Windows: `Daftari-Windows-Setup.exe`
- Mac: `Daftari-Mac-AppleSilicon.dmg`

Daftari isn't registered with Microsoft or Apple (that costs money every year), so both warn you the first time:

- **Windows:** if "Windows protected your PC" shows up, click **More info**, then **Run anyway**.
- **Mac:** drag Daftari into Applications and open it from there. When macOS says it can't verify it, click **Done** (not "Move to Bin"). Then go to System Settings → Privacy & Security, scroll down, click **Open Anyway** and enter your password.

Only do this for a file you got from here or the website. To check a download, compare its SHA-256 with `SHA256SUMS.txt` in the release:

- Windows (PowerShell): `Get-FileHash .\Daftari-Windows-Setup.exe -Algorithm SHA256`
- Mac (Terminal): `shasum -a 256 Daftari-Mac-AppleSilicon.dmg`

## Your data

Notes stay in your folder. Lecture audio never leaves your computer. The AI is optional and uses your own key, kept encrypted on your computer. No accounts, no analytics. Daftari only checks this repo for new versions (you can turn that off in Settings → About).

## Problems and ideas

Open an [issue](https://github.com/MominEL/Daftari/issues) and say what happened and your Daftari version (Settings → About). **Report a problem** in Settings → About copies the useful details for you, and shows you everything first.

Found a security problem? Please report it privately: see [SECURITY.md](SECURITY.md).

---

The source code is not public. © 2026 Momin. All rights reserved. The open-source parts Daftari uses are listed in the app under Settings → About.
