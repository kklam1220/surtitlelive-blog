---
title: 'Protecting Theatre IP: How SurtitleLive Secures Your Scripts and Translations'
description: 'How SurtitleLive secures scripts and translations with encrypted runtime segments and controlled viewer access.'
pubDate: '2026-01-25'
heroImage: './blog-3.jpg'
tags: ['Security', 'Encryption', 'IP Protection', 'Tech Deep Dive']
---

At SurtitleLive, we understand that your scripts and translations are not just text files—they are production material that may carry copyright, licensing, and commercial sensitivity. One of our core design goals is to keep access limited to authorized audiences and staff while reducing casual copying.

Here is a look under the hood at how we secure your data, written in plain English.

> **Security at a Glance**
>
> *   **On-Demand Streaming:** The official viewer avoids loading a full plaintext script bundle up front.
> *   **Segmented Runtime Delivery:** Decrypted subtitle segments are intended to stay inside the authorized viewer session for display.
> *   **Dynamic Access Control:** Temporary tokens and server-side revocation limit post-show access.

## 1. The "Stream, Don't Download" Philosophy

In the past, many subtitle systems worked by sending the entire script file to the viewer’s phone as soon as they joined. This was efficient but risky: tech-savvy users could easily find that file and save a copy of your entire show.

**We changed that.**

SurtitleLive v2 uses a **"Fetch on Demand"** architecture. The Official Viewer loads encrypted subtitle segments on demand around the current cue instead of loading the full plaintext script into the UI up front.
*   **No Plaintext Full-Script Preload:** The Official Viewer avoids presenting the entire script as one readable browser payload at entry time.
*   **On-Demand Segments:** Subtitle segments are requested around show progress and decrypted in browser memory for display.
*   **Layered Runtime Access:** Valid runtime access still relies on temporary bearer tokens, encrypted segments, and revocation controls. A custom client with a valid token may be able to request additional permitted segments, so this design reduces casual copying rather than making copying impossible.

## 2. Encryption: The "Disappearing Ink" Method

Even when we send those small chunks of text to a viewer's phone, we don't send them as plain text.

*   **Encryption in Transit:** Connections use HTTPS/TLS, which helps protect traffic against passive network inspection on public Wi-Fi.
*   **Encryption at Rest & Packet Level:** Before your script leaves our secure cloud vault, it is chopped up and encrypted with a unique **AES-256** "lock" (key) generated specifically for that single performance.
*   **Segment-based viewer delivery:** The official viewer requests encrypted runtime segments and decrypts only the small window needed for playback. SurtitleLive does not send a full plaintext script bundle to the audience viewer. Browser and device behavior can vary, and no web system can prevent screenshots or custom clients, so this should be treated as risk reduction rather than absolute copy protection.

## 3. Short-Lived Access Passes

We know that links get shared. A QR code photo posted on social media could theoretically let anyone watch along. To combat this:

*   **One-Time Stage Door Pass:** Our digital tokens function like a temporary pass. Once the curtain falls, the pass expires, leaving no back-door entry for secondary sharing.
*   **Server-Side Revocation:** In the event of a security concern, runtime access can be revoked from the server side for new or renewed runtime requests.

## What We Can (and Cannot) Protect Against

Security is always a trade-off between protection and usability. We want to be honest about where that line is drawn.

### ✅ What We Reduce
*   **Casual Copying:** The Official Viewer does not load the full plaintext script into the UI up front, which reduces simple browser-based copying.
*   **Casual File Sharing:** There is no single plaintext script file exposed in the viewer UI to email to a friend.
*   **Uncontrolled Access After the Show:** Temporary bearer tokens and server-side revocation controls limit how long valid runtime access should remain useful.

### ❌ The "Analog Hole"
*   **Screen Recording / Cameras:** If a human eye can see it, a camera can record it. We cannot stop a user from taking a screenshot or using another phone to record the screen. Like all digital content delivery systems, SurtitleLive operates within the known limitations of display-based media.
*   **OCR (Optical Character Recognition):** A determined attacker could record the screen and use software to turn the video back into text.

## A Practical Note on Security

No digital delivery system can guarantee absolute protection against all forms of copying. SurtitleLive is designed to raise the technical and operational barriers high enough that unauthorized reproduction becomes impractical, while preserving a seamless experience for legitimate audiences and production teams.

## The Bottom Line

We have built a system that makes casual copying harder while preserving a practical audience experience. Network quality, device behavior, and the limits of screen-based media still matter, so sensitive productions should pair technical controls with clear audience terms and operational planning.

Your work is handled through controlled runtime access and appears to the audience through the approved viewer workflow when the production team makes it available.
