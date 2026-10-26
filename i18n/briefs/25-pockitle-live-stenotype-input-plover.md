# Blog25 editorial and localization brief — stenotype text input

English source: `blog/src/content/blog/25-pockitle-live-stenotype-input-plover.md`

## Input and review boundary

The operator supplied the complete English plus 17-locale article bundle and
selected two real English-interface screenshots. Reuse those editions rather
than rerunning a translation provider. The supplied locales are AI-assisted
editorial drafts, not native-speaker human sign-off. The new GEO blocks are
manually prepared from the article; no provider generation was invoked.

The ZIP uses the raw English-file SHA-256 in its sourceHash fields. Repository
integration must instead calculate the normalized slug/frontmatter/body hash
with `blog/scripts/blog-i18n-utils.cjs` after image integration. Preserve the
supplied translatedAt provenance and record the actual integration in updatedAt.

## Product truth

- This is Pockitle Live operator-written text, not prepared Pockitle Cue cues
  and not speech-recognition output. Ordinary keyboard input works; Plover is
  one option, without a special plugin, raw-stroke interpretation or a private
  dictionary upload requirement.
- A text session has one source language. Additional translations are automatic
  and may be late or wrong; a human-written source does not imply human-reviewed
  translations.
- Auto uses sentence boundaries and bounded waiting/length rules. By line
  requires a newline; punctuation or a pause alone does not submit that line.
- Keep unsent editable draft, submitted/pending text and confirmed publication
  distinct. Later Backspace cannot rewrite accepted captions.
- Clear test text before Start. Pause stops new submissions, but in-flight
  segments can finish. Draft retention requires the page to remain open; End
  attempts to send the remainder. Do not promise reload or offline recovery.
- Audience access is browser-based through a link or QR code; no audience app
  is required. The free professional trial is arranged individually through
  `info@pockitle.com`, without invented time, credit or device-certification terms.
- Basic implementation/testing and a screenshot do not establish universal
  Plover/device compatibility, professional certification or a long-show trial.

## Images and localized presentation

- Hero: `blog-25.png`, original 1759 × 850 user-selected console screenshot.
- Body: `blog-25-stenotype-by-line.png`, original 923 × 703 user-selected detail;
  place it after the By line paragraph, before draft-editing limits.
- Keep both originals unchanged and share them across editions. Localize alt
  text/captions, not the English UI pixels. Preserve whole-frame hero/card fit so
  the mode controls and output monitor are not cropped.
- Captions describe the English interface and its published language rows;
  they do not certify translation quality or establish use of a physical writer.
- Match quoted control labels to the current locale catalogs. The integration
  makes only targeted label corrections and a French adjective-agreement fix;
  preserve the supplied article's argument and five main sections.
- Keep Key Takeaways, FAQ, Glossary and related product/operation-guide links in
  the existing per-locale GEO JSON, not duplicate headings inside the body.
- Preserve the native emphasis. Prefer `<strong>` where CJK/Thai boundaries
  would otherwise expose raw Markdown asterisks; verify the actual rendered page.

This is local editorial preparation only. Publishing still requires the
independent Blog process and explicit operator approval; no main-system release
or updates change is part of this slice.
