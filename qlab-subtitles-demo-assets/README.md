# QLab subtitles demo assets

This pack supports the blog article "How to Make QLab Subtitles Fast from Excel, CSV, or TXT".

Files:

- `blog-13-xlsx.xlsx` — sample Excel source with columns: `cue_number`, `subtitle_text`, `operator_note`, `language`, `stage`, `alignment`.
- `blog-13-2.png` — screenshot of the sample spreadsheet.
- `create-qlab-subtitles-from-excel.applescript` — companion AppleScript that reads worksheet 1 and generates QLab 5 Text cues.

Recommended use:

1. Confirm QLab 5 has an active Video License or Bundle License. QLab Text cues require a Video License.
2. Open `blog-13-xlsx.xlsx` in Microsoft Excel.
3. Open QLab 5 with a copy of a workspace.
4. Connect the projector, then open QLab Workspace Settings > Video.
5. In Output Routing, confirm a route uses the projector as its device. In Video Outputs, confirm the default stage uses that route.
6. Make and run one manual Text cue on that stage. Continue only after the text appears on the projector.
7. Leave Excel's `stage` column blank to use QLab's default stage. A named stage is optional; an unknown name falls back to the default and is recorded in the cue notes.
8. Run the AppleScript from Script Editor.
9. Review the generated top-level Timeline Groups in QLab before using them in a production show file. If QLab reports broken Text cues, confirm the Video License and Workspace Settings > Video, then reuse the existing cues instead of importing them again.

Each subtitle is a top-level Timeline Group in the active QLab cue list, so the operator can insert Sound, Light, Video, Wait, and other show cues between subtitle steps. Each spreadsheet `cue_number` becomes a QLab cue number, while `subtitle_text` becomes the visible Group name. Inside each step, `CLEAR PREVIOUS` fades and stops the preceding Text cue before `DISPLAY en` shows the new subtitle. A final top-level `CLEAR LAST SUBTITLE` step clears the final line. The script does not wrap the show cues in an extra import Group.

This AppleScript is not an official QLab script. It is a subtitle-specific companion example based on QLab's official AppleScript and Cookbook patterns.
