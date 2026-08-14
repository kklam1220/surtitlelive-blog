---
title: 'New Organization-Level Generative AI Controls in SurtitleLive'
description: 'Control generative AI across your SurtitleLive organization while keeping deterministic script tools and standard machine translation available.'
pubDate: '2026-08-13'
tags: ['Product Updates', 'Generative AI', 'Theatre Scripts', 'Translation', 'Privacy', 'SurtitleLive']
heroImage: './blog-16.png'
heroImageAlt: 'Weathered signs presenting the choice to disable or enable AI'
---

SurtitleLive now gives organization owners one place to control whether generative AI can be used across their organization.

The new organization-level setting applies to every member and supported workflow in that organization. It is designed for theatres, festivals, schools and production teams that need a clear, consistent policy for script processing and translation.

Turning generative AI off does not make the rest of SurtitleLive unusable. Deterministic script tools, manual editing and standard machine translation remain available, so teams can continue preparing and operating their surtitles within the policy they choose.

## Why SurtitleLive supports generative AI

Generative AI can help reduce repetitive work during script preparation. In supported workflows, SurtitleLive can use generative AI for tasks such as script analysis and structural refinement, translation, line rewriting, and review or correction. These tools can save time when preparing scripts and surtitles.

However, generative AI is not appropriate for every organization or every production. Theatres, festivals, schools and production teams may have different requirements for privacy, data processing and the external services that are allowed to process their material.

The organization-level control is designed to preserve both choices: teams that want to use generative AI can benefit from supported generative workflows, while organizations that prefer not to use it can disable those workflows consistently for everyone.

## One policy for the whole organization

AI policy is often an organizational decision rather than a personal preference. A production manager may need to follow a theatre's privacy policy. A school may restrict the services that can process uploaded material. A festival may need the same rule to apply across several collaborators and projects.

An individual account setting cannot reliably enforce those requirements. Different members could make different choices while working with the same scripts.

SurtitleLive therefore applies the setting at the organization level:

- The organization owner manages the policy.
- The same policy applies to every member of that organization.
- Supported generative AI workflows check the current organization policy before they run.
- Each organization can maintain its own policy.

If a user belongs to more than one organization, changing the setting in one organization does not change the others.

## What happens when generative AI is turned off

When an owner disables generative AI, SurtitleLive blocks supported features that send script or translation content to generative AI providers.

This includes generative stages used for tasks such as:

- AI-assisted script analysis and structural refinement
- Generative translation and generative translation fallbacks
- AI-assisted line rewriting or refinement
- AI-only review and correction steps

The policy is checked when work starts and during longer-running jobs. This helps ensure that an old browser session or an already queued job cannot silently bypass a newer organization decision.

If generative AI is disabled while a relevant job is still running, SurtitleLive stops that job from continuing under its previous permission. Turning the setting on again allows new work to begin, but does not automatically restore the authority of an older job.

## What remains available

The setting is intentionally specific to generative AI. It does not disable the complete SurtitleLive workflow.

Organizations can continue to use:

- Deterministic script parsing and analysis where available
- Script editing and manual review
- Previously saved scripts, translations and project data
- Standard Google Cloud Translation for supported translation workflows
- Language detection
- Simulation, deployment and live subtitle operation

This means a team can opt out of generative AI while retaining practical tools for preparing and presenting surtitles.

## An important distinction: generative AI and standard machine translation

The organization control is not a universal "disable all AI" switch.

When generative AI is off, standard Google Cloud Translation can remain available. Google describes its translation and language-detection services as machine-learning services, and selected text may still be sent to Google when a team chooses to use those features.

The setting should therefore be understood as a control over SurtitleLive's supported **generative AI** processing paths. It does not disable every external service, every automated language feature or every form of machine learning.

Organizations with stricter data-processing requirements should review their own policies before using any external translation service.

## How to change the setting

The control is available to the organization owner:

1. Sign in to SurtitleLive.
2. Open **Dashboard**.
3. Go to **Organization Settings**.
4. Find **Generative AI**.
5. Turn **Allow generative AI for this organization** on or off.
6. Save the change.

The new policy then applies across the organization. Other members can see the organization policy but cannot change it unless they are the owner.

For teams managing more than one organization, check that the correct organization is active before changing the setting.

## Existing content is not deleted

Disabling generative AI does not delete scripts, translations or other results that have already been saved in SurtitleLive.

The policy controls whether new generative processing can run. Team members can still open and review existing project content, subject to their normal organization permissions.

This separation helps an organization change its future processing policy without losing work it has already completed.

## Other improvements and fixes

This release also includes broader reliability and workflow improvements across SurtitleLive:

- More resilient saving and recovery in the script editor
- Clearer progress and state handling for translation jobs
- Better handling of scripts with limited formatting or structure
- Improved usage and credit information in supported workflows
- Stronger reconnection and synchronization behaviour during live operation
- Additional release safeguards and automated regression coverage

Together, these changes make script preparation and live operation more predictable for small teams and one-operator productions.

## Frequently asked questions

### Who can change the generative AI policy?

Only the organization owner can change it. The policy applies to all members working inside that organization.

### Is this an account-level preference?

No. It is an organization-level control. This ensures that collaborators working with the same organizational data follow the same policy.

### Does disabling generative AI disable all translation?

No. Standard Google Cloud Translation can remain available. Generative translation, generative fallbacks and other supported generative processing paths are blocked.

### Does the setting prevent all data from reaching external services?

No. It controls supported generative AI paths in SurtitleLive. Other services, including standard machine translation, may process selected content when a user chooses those features.

### What happens to a generative AI job that is already running?

SurtitleLive rechecks the organization policy during supported jobs. If the policy has been disabled, the job cannot continue under the earlier permission.

### Will turning generative AI back on resume an old job?

No. Re-enabling the setting permits new generative work. It does not automatically revive an older job whose permission is no longer valid.

### Are existing scripts or translations deleted?

No. Saved content remains available. The setting controls new generative processing rather than deleting previous results.

### Can different organizations use different policies?

Yes. Each organization has its own setting, so a user who belongs to several organizations may work under a different policy in each one.

## A clearer choice for every production

Generative AI can save time during script preparation, but it should remain a deliberate choice governed by the team responsible for the material.

By moving this control to the organization level, SurtitleLive gives production teams a clearer way to apply that decision consistently—without removing the non-generative tools they rely on to prepare, review and present surtitles.
