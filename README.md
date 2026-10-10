# Daftari (دفتري)

A calm notebook for your computer, with built-in AI. Pages are plain files in a folder you choose, with a block editor, nested pages, search, flashcards and quizzes, maths, and lecture recording that is transcribed on your own computer.

Made by Momin.

## Download

**https://mominel.github.io/Daftari/** has the download buttons, install help and the checksums.

Or take the latest files straight from [Releases](../../releases/latest):

| System | File |
|---|---|
| Windows 10 or 11 | `Daftari-Windows-Setup.exe` |
| Mac with Apple silicon (M1 or newer) | `Daftari-Mac-AppleSilicon.dmg` |

## Check what you downloaded

Each release lists a SHA-256 checksum for every file (`SHA256SUMS.txt`). The checksum of your file must match.

- Windows (PowerShell): `Get-FileHash .\Daftari-Windows-Setup.exe -Algorithm SHA256`
- Mac (Terminal): `shasum -a 256 Daftari-Mac-AppleSilicon.dmg`

## The first time you open it

The installers are **not signed** (a signature costs money every year), so Windows and macOS warn you once. The website explains exactly what to click:

- Windows: "Windows protected your PC" → **More info** → **Run anyway**.
- Mac: open the app, then System Settings → **Privacy & Security** → **Open Anyway**.

## Privacy

- Your notes stay in a folder on your computer. Nothing is uploaded unless you turn on sync with your own GitHub repository.
- Lecture audio never leaves your computer and is never synced; it is transcribed on your computer.
- The AI features are optional and use a key you provide; the text you ask about is sent to the AI service you choose, and to nobody else.
- Daftari checks this page's releases for a newer version a little after it starts (you can turn that off in Settings → About). Nothing else is sent.

## Found a problem?

Please read [SECURITY.md](SECURITY.md).

The source code is not public. © 2026 Momin. All rights reserved.
