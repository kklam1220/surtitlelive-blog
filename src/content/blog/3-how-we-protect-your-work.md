---
title: 'Protecting Theatre IP: How SurtitleLive Secures Your Scripts and Translations'
description: 'How SurtitleLive secures your scripts and translations with on-demand streaming and military-grade encryption.'
pubDate: '2026-01-25'
heroImage: './blog-3.jpg'
tags: ['Security', 'Encryption', 'IP Protection', 'Tech Deep Dive']
---

At SurtitleLive, we understand that your scripts and translations are not just text files—they are the intellectual property (IP) that drives your production. One of our core design goals is to ensure that your content remains **yours**, accessible only to your paying audience and staff, and protected against unauthorized copying.

Here is a look under the hood at how we secure your data, written in plain English.

> **Security at a Glance**
>
> *   **On-Demand Streaming:** No complete script files are persistently stored on user devices.
> *   **In-Memory Decryption:** Data vanishes as soon as the browser tab closes.
> *   **Dynamic Access Control:** Temporary tokens prevent unauthorized post-show access.

## 1. The "Stream, Don't Download" Philosophy

In the past, many subtitle systems worked by sending the entire script file to the viewer’s phone as soon as they joined. This was efficient but risky: tech-savvy users could easily find that file and save a copy of your entire show.

**We changed that.**

SurtitleLive v2 uses a **"Fetch on Demand"** architecture. Think of it like streaming a movie on Netflix versus downloading a video file.
*   **No Full Downloads:** The viewer's device never receives the whole script at once. It only requests small "chunks" of subtitles directly around the current cue.
*   **Just-in-Time Delivery:** If you are on Cue 10, the device might only know about Cues 8 through 15. The rest of the script literally does not exist on their device yet.
*   **Anti-Scraping:** Because the browser only requests text for the active cue, this architecture makes large-scale automated scraping impractical without replicating real-time viewing behavior.

## 2. Encryption: The "Disappearing Ink" Method

Even when we send those small chunks of text to a viewer's phone, we don't send them as plain text.

*   **Encryption in Transit:** All connections use **TLS 1.3 (HTTPS)**, the banking-grade security standard. This prevents anyone on a public Wi-Fi network from "sniffing" the traffic to see what is being sent.
*   **Encryption at Rest & Packet Level:** Before your script leaves our secure cloud vault, it is chopped up and encrypted with a unique **AES-256** "lock" (key) generated specifically for that single performance.
*   **The "Magic Ink" (In-Memory Decryption):** This is our strongest defense. When an encrypted chunk arrives on the viewer's phone, it is unlocked **only inside the device's temporary memory (RAM)**. It is never written to the phone's storage or cache. If the user refreshes the page or closes the tab, that data vanishes instantly. It’s like reading a message written in disappearing ink—there is no persistent file left behind that can be recovered through normal device storage or browser caching.

## 3. Short-Lived Access Passes

We know that links get shared. A QR code photo posted on social media could theoretically let anyone watch along. To combat this:

*   **One-Time Stage Door Pass:** Our digital tokens function like a temporary pass. Once the curtain falls, the pass expires, leaving no back-door entry for secondary sharing.
*   **Instant Revocation:** In the event of a security concern, we can revoke access to a specific show instantly from the server side, cutting off all connections immediately.

## What We Can (and Cannot) Protect Against

Security is always a trade-off between protection and usability. We want to be honest about where that line is drawn.

### ✅ What We Prevent
*   **Mass Scraping:** It is extremely difficult for a bot or user to "scrape" your entire script because they would have to simulate watching the entire show in real-time.
*   **Casual File Sharing:** There is no "file" to email to a friend. The URL works for now, but the content inside it is fleeting.
*   **Unauthorized "Peek Ahead":** Because the device doesn't have the future cues yet, a user cannot hack the webpage to read how the play ends before the actors get there.

### ❌ The "Analog Hole"
*   **Screen Recording / Cameras:** If a human eye can see it, a camera can record it. We cannot stop a user from taking a screenshot or using another phone to record the screen. Like all digital content delivery systems, SurtitleLive operates within the known limitations of display-based media.
*   **OCR (Optical Character Recognition):** A determined attacker could record the screen and use software to turn the video back into text.

## A Practical Note on Security

No digital delivery system can guarantee absolute protection against all forms of copying. SurtitleLive is designed to raise the technical and operational barriers high enough that unauthorized reproduction becomes impractical, while preserving a seamless experience for legitimate audiences and production teams.

## The Bottom Line

We have built a system that makes "stealing" your script significantly harder and more time-consuming than simply buying a ticket or license. We raise the bar high enough to deter piracy while ensuring legitimate audiences have a smooth, instant-loading experience on any device, even with poor network signals.

Your work stays safe in our vault, and only appears on screen exactly when—and where—you want it to.
