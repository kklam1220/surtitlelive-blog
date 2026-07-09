-- create-qlab-subtitles-from-excel.applescript
-- Demo companion script for the SurtitleLive blog article:
-- "How to Make QLab Subtitles Fast from Excel, CSV, or TXT"
--
-- Expected Excel columns on worksheet 1:
-- A: cue_number
-- B: subtitle_text
-- C: operator_note
-- D: language
-- E: stage
-- F: alignment
--
-- Requirements:
-- 1. Microsoft Excel is open with the subtitle spreadsheet active.
-- 2. QLab 5 is open with the target workspace frontmost.
-- 3. If you use the `stage` column, the stage name must already exist in the QLab workspace.
--
-- This script is intentionally simple and readable. Test in a copy of your QLab workspace first.

on cellText(columnIndex, rowIndex)
  tell application id "com.microsoft.Excel" to tell worksheet 1
    try
      set rawValue to value of cell columnIndex of row rowIndex
      if rawValue is missing value then return ""
      return rawValue as text
    on error
      return ""
    end try
  end tell
end cellText

on appendNote(existingNote, labelText, valueText)
  if valueText is "" then return existingNote
  if existingNote is "" then
    return labelText & valueText
  else
    return existingNote & linefeed & labelText & valueText
  end if
end appendNote

tell application id "com.microsoft.Excel" to tell worksheet 1
  set theRowCount to count of rows of used range
end tell

tell application id "com.figure53.QLab.5" to tell front workspace
  -- Create a temporary import group so generated cues are easy to review, move, or delete.
  make type "group"
  set importGroup to last item of (selected as list)
  set mode of importGroup to timeline
  set q number of importGroup to "SUBS"
  set q name of importGroup to "Generated subtitles from Excel"

  set lastTextCue to ""
  repeat with rowIndex from 2 to theRowCount
    set theCueNumber to my cellText(1, rowIndex)
    set theSubtitleText to my cellText(2, rowIndex)
    set theOperatorNote to my cellText(3, rowIndex)
    set theLanguage to my cellText(4, rowIndex)
    set theStageName to my cellText(5, rowIndex)
    set theAlignment to my cellText(6, rowIndex)

    -- Skip blank rows.
    if theCueNumber is not "" and theSubtitleText is not "" then
      -- Create a Group cue (Timeline mode) for this subtitle step
      make type "group"
      set subGroup to last item of (selected as list)
      set mode of subGroup to timeline
      set q number of subGroup to theCueNumber
      set q name of subGroup to "Subtitle " & theCueNumber

      -- Move the group into the import container immediately to keep order
      move subGroup to end of importGroup

      make type "text"
      set currentTextCue to last item of (selected as list)
      set q name of currentTextCue to "Text " & theCueNumber
      set text of currentTextCue to theSubtitleText
      move currentTextCue to end of subGroup

      -- If there is a previous subtitle, create a Fade cue to fade it out
      if lastTextCue is not "" then
        make type "fade"
        set theFade to last item of (selected as list)
        set q name of theFade to "Fade Out Previous"
        set cue target of theFade to lastTextCue
        set duration of theFade to 0.05
        set stop target when done of theFade to true
        set do opacity of theFade to true
        set opacity of theFade to 0
        move theFade to end of subGroup
        
        -- Current text cue waits 0.05s for the previous one to fade out
        set pre wait of currentTextCue to 0.05
      end if

      -- Apply layout settings to the Text cue
      set theCue to currentTextCue
      if theAlignment is "" then set theAlignment to "center"
      try
        set text alignment of theCue to theAlignment
      end try

      -- Keep a predictable text box width for projected subtitle checks.
      -- Adjust this to match your video stage resolution and house style.
      try
        set fixed width of theCue to 1600
      end try

      -- Stage assignment only works when the named stage already exists.
      if theStageName is not "" then
        try
          set stage name of theCue to theStageName
        end try
      end if

      set theNotes to theOperatorNote
      set theNotes to my appendNote(theNotes, "Language: ", theLanguage)
      set theNotes to my appendNote(theNotes, "Source row: ", rowIndex as text)
      set notes of theCue to theNotes

      set lastTextCue to currentTextCue
    end if
  end repeat
end tell
