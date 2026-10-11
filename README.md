# Daftari (دفتري)

**A calm, free notebook for lectures, with built-in AI.** For Windows and Mac. Made by Momin.

<p align="center"><img src="img/shot-page.png" width="420" alt="A Daftari page of notes on modular arithmetic, with headings, a bulleted list, a formula and two flashcards."></p>

Daftari records a lecture, turns the speech into text **on your own computer**, and writes structured notes from it. Pages are plain files in a folder you choose, with a block editor, nested pages, search, flashcards and quizzes, and maths.

## ⬇ Download

### **[Download Daftari from the website →](https://mominel.github.io/Daftari/)**

The website has the download buttons, install help and the checksums. Or take the files straight from the **[latest release](https://github.com/MominEL/Daftari/releases/latest)**:

| System | File |
|---|---|
| Windows 10 or 11 (64-bit) | `Daftari-Windows-Setup.exe` |
| Mac with Apple silicon (M1 or newer), macOS 12 or later | `Daftari-Mac-AppleSilicon.dmg` |

**Requirements:** Windows 10/11 64-bit, or macOS 12+ on Apple silicon; about 400 MB of disk, plus 150 MB to 1.6 GB for the optional speech-to-text model. Intel Macs and Linux: coming soon.

## Check what you downloaded

Each release lists a SHA-256 checksum for every file (`SHA256SUMS.txt`). The checksum of your file must match.

- Windows (PowerShell): `Get-FileHash .\Daftari-Windows-Setup.exe -Algorithm SHA256`
- Mac (Terminal): `shasum -a 256 Daftari-Mac-AppleSilicon.dmg`

## The first time you open it

The installers are **not signed** (a signature costs money every year), so Windows and macOS warn you once. The website explains exactly what to click:

- Windows: "Windows protected your PC" → **More info** → **Run anyway**.
- Mac: open the app, then System Settings → **Privacy & Security** → **Open Anyway**.

## Privacy

- Your notes stay in a folder on your computer. Nothing is uploaded unless you choose a cloud folder or turn on sync with your own GitHub repository.
- Lecture audio never leaves your computer and is never synced; it is transcribed on your computer.
- The AI features are optional and use a key you provide (stored encrypted on your computer); the text you ask about is sent to the AI service you choose, and to nobody else.
- No accounts, no analytics, no tracking. Daftari checks this repository's releases for a newer version a little after it starts (you can turn that off in Settings → About).

## Found a bug or have an idea?

Open an [issue](https://github.com/MominEL/Daftari/issues): say what you did, what happened, and your Daftari version (Settings → About).

**Found a security problem?** Please report it privately instead: **Security** tab → **Report a vulnerability**. See [SECURITY.md](SECURITY.md).

The source code is not public. © 2026 Momin. All rights reserved.
