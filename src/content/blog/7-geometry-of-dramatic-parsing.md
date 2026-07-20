---
title: 'Why Script Formatting Matters When Creating Theatre Surtitles'
description: 'A practical explanation of how spacing, styles, punctuation, and document regions help turn a Word theatre script into a reviewable surtitle cue draft.'
pubDate: '2026-03-11'
heroImage: './script-parsing-theatre-subtitles.png'
heroImageAlt: 'Word script formatting being interpreted as evidence for a theatre surtitle cue draft'
tags: ['Theatre Technology', 'Subtitle Systems', 'Script Parsing', 'DOCX', 'SurtitleLive']
---
The words in a theatre script are only part of the document.

A character name centred above a speech, a line indented beneath it, an italic direction, or a cast list before Act One can all change how the same words should be read. A performer sees those conventions almost without thinking. Software preparing a surtitle cue draft has to make the distinctions explicitly.

This is why turning a script into theatre surtitles is not simply a matter of extracting sentences. The system must preserve enough of the document to ask a more useful question:

> What evidence on the page suggests that this text is dialogue, a speaker label, a direction, a heading, or material that should remain uncertain?

The important word is **evidence**. Formatting can reveal structure, but it is not infallible. Scripts vary across writers, languages, companies, templates, and rehearsal versions. A responsible workflow uses layout to prepare a better draft, then keeps a human in charge of what reaches rehearsal and the audience.

## Plain text can erase part of the script

Consider a familiar layout:

> **HAMLET**  
> &nbsp;&nbsp;&nbsp;&nbsp;To be, or not to be: that is the question.
>
> *He turns away.*
>
> **OPHELIA**  
> &nbsp;&nbsp;&nbsp;&nbsp;My lord?

A reader can infer several relationships:

| Page signal | Possible meaning |
| :--- | :--- |
| A short, capitalised line | Speaker label |
| Indented text beneath it | Dialogue belonging to that speaker |
| A separate italic sentence | Stage direction |
| Repeated spacing between groups | Boundary between dramatic units |

Flatten the same passage into one plain-text stream and those relationships weaken:

```text
HAMLET To be, or not to be: that is the question. He turns away. OPHELIA My lord?
```

The words remain, but their arrangement no longer helps distinguish a spoken line from an instruction. Any later system must reconstruct information that the conversion discarded.

For surtitle preparation, that matters twice. A structural mistake can put the wrong text into a cue, and it can also attach the right line to the wrong speaker or dramatic moment.

## Formatting is a kind of stage-script grammar

Many theatre scripts use visual conventions as a working grammar. Useful signals can include:

- paragraph indentation and alignment
- spacing before and after paragraphs
- Word paragraph styles
- bold, italic, or other run-level formatting
- capitalisation, where the writing system makes it meaningful
- punctuation between a speaker and a line
- tabs, columns, and repeated block shapes
- the line's position within the document

No one signal should be treated as universal truth. Italics often indicate a stage direction, for example, but a playwright may use italics for emphasis inside dialogue. An all-caps line may be a character name, an act heading, a sound cue, or a note to the production team.

The safer question is not “Is italic text always a direction?” It is “Does this formatting, together with neighbouring paragraphs and the wider document pattern, provide enough evidence to classify the line?”

## The same words can play different roles

Near the beginning of a script, this may be a cast list:

```text
CAST

HAMLET
OPHELIA
HORATIO
```

Later, the same name may introduce speech:

```text
HAMLET
    The play's the thing.
```

The token `HAMLET` does not contain enough information on its own. Its role depends on where it appears, what surrounds it, and what follows.

This is one reason document regions matter. Title pages, cast lists, synopses, production notes, the performable body, and appendices can use similar typography for different purposes. Before treating a short line as a speaker cue, a parser should consider whether it is looking at the body of the play at all.

For a production team, the practical lesson is simple: preserving headings and document boundaries can be just as valuable as preserving the dialogue itself.

## Punctuation helps, but language does not determine layout

Some scripts place the speaker and dialogue in one paragraph:

```text
HAMLET: To be, or not to be.
```

The same broad convention may appear with full-width punctuation:

```text
張三：今天下雨。
```

A colon is a strong clue, not a guarantee. The line `Location: Backstage` is metadata, not necessarily dialogue. A synopsis may begin with a labelled paragraph. A character may also speak across several following paragraphs after only one explicit label.

It is therefore misleading to rank whole languages as easy or difficult to parse. Chinese, Cantonese, Japanese, English, French, German, and other scripts can each use several house styles. Capitalisation is useful in some writing systems and irrelevant in others. Quotation marks, brackets, colons, periods, dashes, indentation, and vertical spacing may all carry different weight from one document to the next.

A multilingual parser should adapt its signals without turning linguistic tendencies into fixed stereotypes. Strong punctuation can help. It does not remove the need to examine context.

## Why the original Word document is valuable

A Word `.docx` file contains structured document information that a plain-text copy does not. Its underlying OOXML can preserve paragraph properties, inherited styles, alignment, indentation, spacing, and text-run formatting.

Some Word measurements are stored in **twips**, a document-layout unit equal to one twentieth of a point. The unit itself is less important to a theatre team than what it preserves: two paragraphs that look differently indented on the page can remain measurably different during analysis.

Those values should not become rigid global rules. An indentation value from one template says little about another template. The useful pattern is relational:

- Does a short label repeatedly precede more deeply indented text?
- Do italic paragraphs form a consistent class within this document?
- Does the layout change after the front matter?
- Does one region use colons while another places speakers on separate lines?

This turns page geometry into document-specific evidence rather than a universal theatre-format specification.

## From document evidence to a cue draft

A script parser does not determine the final timing of a performance. Its immediate job is to help transform source material into an editable sequence that a human can inspect.

A careful preparation path looks like this:

1. Preserve the source `.docx` and its version.
2. Extract text together with useful document structure.
3. Group related paragraphs into likely dramatic blocks.
4. Distinguish front matter, body text, headings, dialogue, and directions where the evidence supports it.
5. Keep ambiguous material visible instead of silently forcing a confident answer.
6. Open the result as an editable cue draft.
7. Review the cue boundaries, speaker attribution, translation, and omissions.
8. Rehearse the cues against the live performance.

The parser can reduce repetitive preparation. It cannot know every artistic intention, late cut, improvised pause, or change introduced in rehearsal.

## Uncertainty is a feature of honest preparation

There are two tempting but unsafe outcomes when a line is ambiguous:

- discard it because it does not match a familiar template
- classify it confidently because it resembles dialogue

Both can hide important work from the person preparing the show.

A better system distinguishes between strong structural evidence and material that needs review. In a named-character script, an unattributed passage may need to remain visibly unresolved. In a monologue or speakerless text, the absence of character labels may be an intentional document-level pattern rather than an error on every line.

That distinction matters for accessibility as well as translation. Missing text, a stage direction accidentally shown as speech, or an incorrect speaker attribution can all change the audience's understanding. Yet script parsing alone does not create an accessible performance. Same-language captions may also need relevant non-speech information, careful placement, readable presentation, and an audience delivery plan.

Structure is the beginning of that work, not the completion certificate.

## What theatre teams can do before import

A production does not need to redesign its script around software. A few document habits can nevertheless make both human and machine review clearer:

- keep character labels consistent where the production permits
- use paragraph styles consistently instead of aligning text with repeated spaces
- distinguish headings, dialogue, and directions with more than one signal
- avoid flattening the working script into plain text before import
- remove obsolete rehearsal notes or label them clearly
- confirm that the uploaded file is the current approved version
- retain the original script so every cue can be checked against its source

Consistency helps, but unusual dramatic form should not be “corrected” merely to satisfy a parser. The workflow should serve the work, not make the work imitate a template.

## Layout can prepare a draft; people prepare the performance

The deepest value of layout-aware parsing is not that geometry replaces language. It is that the system wastes less of the information already present in the script.

Words, punctuation, typography, neighbouring blocks, and document regions each contribute evidence. Deterministic rules can handle clear patterns; bounded AI assistance may help with genuinely ambiguous regions; human reviewers decide what is accurate, appropriate, and ready to rehearse.

That balance is especially important in live theatre. A cue draft is useful because it remains editable. A translation is trustworthy because someone is accountable for it. A show file becomes ready because the team has reviewed and rehearsed it—not because a parser returned a confident label.

To see how these ideas continue into deterministic parsing, body zoning, and selective AI review, read [Why Theatre Subtitle Software Should Parse Scripts Before Using AI](/blog/8-from-layout-to-archetype-detection/).

---

## FAQ

**Q: Why is script formatting important for theatre surtitles?**

**A:** Formatting can show relationships that words alone do not: who is speaking, which paragraphs belong together, where a direction begins, and whether a line sits in front matter or the body of the play. Preserving that evidence can produce a cleaner cue draft for human review.

**Q: Does SurtitleLive support PDF script analysis?**

**A:** The supported script-analysis input is an original Word `.docx` file. PDF and other non-DOCX formats are not part of the current analysis workflow because they may not preserve the document structure needed for reliable preparation.

**Q: Are italics always treated as stage directions?**

**A:** No. Italics are one signal among several. Their meaning depends on surrounding text, paragraph structure, styles, and patterns elsewhere in the document.

**Q: Are colon-formatted scripts easier to parse?**

**A:** A consistent `Speaker: Dialogue` pattern can provide strong evidence, but colons also appear in metadata, headings, and prose. The parser still needs document and regional context.

**Q: What is a twip?**

**A:** A twip is a Word document-layout unit equal to one twentieth of a point. It can help preserve fine-grained differences in indentation and spacing; it is not a theatre-specific measurement or a guarantee of what a paragraph means.

**Q: Does layout-aware parsing remove the need for human review?**

**A:** No. It helps prepare an editable draft. The production team should still check cue boundaries, speakers, omissions, translations, presentation, and timing, then rehearse the result before the show.
