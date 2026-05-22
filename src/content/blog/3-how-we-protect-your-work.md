---
title: 'Reducing Theatre IP Risk: How SurtitleLive Handles Scripts and Translations'
description: 'How SurtitleLive reduces casual copying risk with encrypted runtime segments, scoped viewer access, expiry windows, and revocation controls.'
pubDate: '2026-01-25'
heroImage: './blog-3.jpg'
tags: ['Security', 'Encryption', 'IP Risk', 'Tech Deep Dive']
---

At SurtitleLive, we understand that your scripts and translations are not just text files—they are production material that may carry copyright, licensing, and commercial sensitivity. One of our core design goals is to keep access limited to authorized audiences and staff while reducing casual copying.

Here is a practical look at the runtime controls SurtitleLive uses to reduce copying and uncontrolled access, written in plain English.

> **Security at a Glance**
>
> *   **On-Demand Runtime Delivery:** The official viewer avoids loading a full plaintext script bundle up front.
> *   **Encrypted Runtime Segments:** Subtitle content is delivered as encrypted runtime segments and decrypted in browser memory for display.
> *   **Scoped Runtime Access:** Temporary bearer tokens, expiry windows, and server-side revocation controls help limit how long viewer access remains useful.
> *   **Realistic Boundaries:** These controls reduce casual copying risk. They are not a promise of absolute copy protection.

## 1. The "Stream, Don't Download" Philosophy

In the past, many subtitle systems worked by sending the entire script file to the viewer’s phone as soon as they joined. This was efficient but risky: tech-savvy users could easily find that file and save a copy of your entire show.

**We changed that.**

SurtitleLive v2 uses a **"Fetch on Demand"** architecture. The Official Viewer loads encrypted subtitle segments on demand around the current cue instead of loading the full plaintext script into the UI up front.
*   **No Plaintext Full-Script Preload:** The Official Viewer avoids presenting the entire script as one readable browser payload at entry time.
*   **On-Demand Segments:** Subtitle segments are requested around show progress and decrypted in browser memory for display.
*   **Layered Runtime Access:** Valid runtime access still relies on temporary bearer tokens, encrypted segments, and revocation controls. A custom client with a valid token may be able to request additional permitted segments, so this design reduces casual copying rather than making copying impossible.

## 2. Encrypted Runtime Segments

Even when we send those small chunks of text to a viewer's phone, we don't send them as plain text.

*   **Encryption in Transit:** Connections use HTTPS/TLS, which helps protect traffic against passive network inspection on public Wi-Fi.
*   **Application-Layer Segment Encryption:** Runtime subtitle content is split into encrypted segments. The runtime delivery flow uses AES-256-GCM for segment encryption and a key-exchange step before the viewer can decrypt display content.
*   **Segment-Based Viewer Delivery:** The official viewer requests encrypted runtime segments and decrypts only the small window needed for playback. SurtitleLive does not send a full plaintext script bundle to the audience viewer. Browser and device behavior can vary, and no web system can prevent screenshots or custom clients, so this should be treated as risk reduction rather than absolute copy protection.

## 3. Time-Bounded Runtime Access

We know that links get shared. A QR code photo posted on social media could theoretically let people outside the intended audience try to watch along. To reduce that risk:

*   **Time-Bounded Runtime Tokens:** Viewer access depends on temporary runtime credentials with configured expiry windows. A viewer link is not intended to be a durable public copy of the show.
*   **Server-Side Revocation:** In the event of a security concern, runtime access can be revoked from the server side for new or renewed runtime requests.

## What We Can (and Cannot) Protect Against

Security is always a trade-off between protection and usability. We want to be honest about where that line is drawn.

### What We Reduce
*   **Casual Copying:** The Official Viewer does not load the full plaintext script into the UI up front, which reduces simple browser-based copying.
*   **Casual File Sharing:** There is no single plaintext script file exposed in the viewer UI to email to a friend.
*   **Uncontrolled Access After the Show:** Temporary bearer tokens, expiry windows, and server-side revocation controls help limit how long valid runtime access remains useful.

### What We Cannot Prevent
*   **Screen Recording / Cameras:** If a human eye can see it, a camera can record it. We cannot stop a user from taking a screenshot or using another phone to record the screen. Like all digital content delivery systems, SurtitleLive operates within the known limitations of display-based media.
*   **OCR (Optical Character Recognition):** A determined attacker could record the screen and use software to turn the video back into text.
*   **Custom Clients With Valid Access:** A custom client that has valid runtime credentials may be able to request permitted runtime segments. Runtime credentials should be treated as access material and handled accordingly.

## A Practical Note on Security

No digital delivery system can guarantee absolute protection against all forms of copying. SurtitleLive is designed to reduce casual copying and uncontrolled access while preserving a practical experience for legitimate audiences and production teams.

## The Bottom Line

SurtitleLive is not DRM, and it is not a substitute for licensing terms, contracts, or clear audience conditions. It is a runtime delivery workflow that makes casual copying harder, avoids exposing a full plaintext script bundle up front, and gives production teams practical controls over viewer access.

For sensitive productions, technical controls should be paired with clear audience terms and operational planning. Your work appears to the audience through the approved viewer workflow when the production team makes it available.
