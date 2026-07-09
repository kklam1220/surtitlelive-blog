# QLab subtitles demo assets

This pack supports the blog article "How to Make QLab Subtitles Fast from Excel, CSV, or TXT".

Files:

- `blog-13-xlsx.xlsx` — sample Excel source with columns: `cue_number`, `subtitle_text`, `operator_note`, `language`, `stage`, `alignment`.
- `blog-13-2.png` — screenshot of the sample spreadsheet.
- `create-qlab-subtitles-from-excel.applescript` — companion AppleScript that reads worksheet 1 and generates QLab 5 Text cues.

Recommended use:

1. Open `blog-13-xlsx.xlsx` in Microsoft Excel.
2. Open QLab 5 with a copy of a workspace.
3. Make sure the video stage named in the `stage` column exists, or leave the stage cells blank.
4. Run the AppleScript from Script Editor.
5. Review the generated `Generated subtitles from Excel` group in QLab before moving cues into a production show file.

This AppleScript is not an official QLab script. It is a subtitle-specific companion example based on QLab's official AppleScript and Cookbook patterns.
