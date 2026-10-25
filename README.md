
# SafeBrowse — Website Safety Checker

SafeBrowse is a browser extension project that checks the current website URL for basic security indicators and potentially suspicious patterns.

## Features

- Checks whether a website uses HTTPS or HTTP.
- Identifies selected unusual URL patterns.
- Displays the current hostname.
- Provides a simple safety report.
- Uses a browser popup with a dark cybersecurity interface.
- Performs checks locally in the browser.

## Technologies Used

- HTML
- CSS
- JavaScript
- Chrome Extensions Manifest V3

## Installation and Testing

1. Download or clone this repository.
2. Open Chrome or Brave.
3. Navigate to `chrome://extensions` in Chrome or `brave://extensions` in Brave.
4. Enable Developer mode.
5. Click Load unpacked.
6. Select the folder containing `manifest.json`.
7. Open a website in a normal tab.
8. Click the SafeBrowse extension icon.
9. Click Analyze website.

## Limitations

SafeBrowse uses basic URL heuristics. It does not connect to a threat-intelligence database and cannot detect every phishing or malicious website.

HTTPS indicates an encrypted connection, not that a website is trustworthy. Results should not replace browser security warnings or other security tools.

## Project Purpose

This project demonstrates introductory browser-extension development and basic website URL security analysis for educational purposes.
