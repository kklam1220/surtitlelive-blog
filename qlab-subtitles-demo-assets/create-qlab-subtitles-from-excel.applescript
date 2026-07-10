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
--
-- This script uses robust scripting best practices:
-- 1. Decoupled app scopes: Excel data is read first, then QLab cues are built.
-- 2. Explicit object reference assignments instead of GUI selection tracking.

-- Helper function to format notes
on appendNote(existingNote, labelText, valueText)
	if valueText is "" then return existingNote
	if existingNote is "" then
		return labelText & valueText
	else
		return existingNote & linefeed & labelText & valueText
	end if
end appendNote

-- 1. Read all subtitle data from Excel worksheet 1 into an AppleScript list
set excelData to {}
tell application id "com.microsoft.Excel"
	tell worksheet 1 of active workbook
		set theRowCount to count of rows of used range
		
		-- Read rows starting from row 2 (skipping header)
		repeat with rowIndex from 2 to theRowCount
			set theCueNumber to ""
			set theSubtitleText to ""
			set theOperatorNote to ""
			set theLanguage to ""
			set theStageName to ""
			set theAlignment to ""
			
			try
				set rawVal to value of cell 1 of row rowIndex
				if rawVal is not missing value then set theCueNumber to rawVal as text
			end try
			try
				set rawVal to value of cell 2 of row rowIndex
				if rawVal is not missing value then set theSubtitleText to rawVal as text
			end try
			try
				set rawVal to value of cell 3 of row rowIndex
				if rawVal is not missing value then set theOperatorNote to rawVal as text
			end try
			try
				set rawVal to value of cell 4 of row rowIndex
				if rawVal is not missing value then set theLanguage to rawVal as text
			end try
			try
				set rawVal to value of cell 5 of row rowIndex
				if rawVal is not missing value then set theStageName to rawVal as text
			end try
			try
				set rawVal to value of cell 6 of row rowIndex
				if rawVal is not missing value then set theAlignment to rawVal as text
			end try
			
			-- Only process row if both cue number and text are populated
			if theCueNumber is not "" and theSubtitleText is not "" then
				copy {cueNum:theCueNumber, subText:theSubtitleText, opNote:theOperatorNote, langVal:theLanguage, stageVal:theStageName, alignVal:theAlignment, sourceRow:rowIndex} to end of excelData
			end if
		end repeat
	end tell
end tell

-- 2. Create the subtitle cues in QLab 5 using the extracted data
tell application id "com.figure53.QLab.5"
	tell front workspace
		-- Create a temporary import group container
		set importGroup to make type "group"
		set mode of importGroup to timeline
		set q number of importGroup to "SUBS"
		set q name of importGroup to "Generated subtitles from Excel"
		
		set lastTextCue to ""
		
		repeat with dataItem in excelData
			set theCueNumber to cueNum of dataItem
			set theSubtitleText to subText of dataItem
			set theOperatorNote to opNote of dataItem
			set theLanguage to langVal of dataItem
			set theStageName to stageVal of dataItem
			set theAlignment to alignVal of dataItem
			set rowIndex to sourceRow of dataItem
			
			-- Create a parent Group cue for this subtitle step
			set subGroup to make type "group"
			set mode of subGroup to timeline
			set q number of subGroup to theCueNumber
			set q name of subGroup to "Subtitle " & theCueNumber
			move cue subGroup to end of importGroup
			
			-- Create the Text cue
			set currentTextCue to make type "text"
			set q name of currentTextCue to "Text " & theCueNumber
			set text of currentTextCue to theSubtitleText
			move cue currentTextCue to end of subGroup
			
			-- Create a Fade cue to fade out the previous subtitle, if any
			if lastTextCue is not "" then
				set theFade to make type "fade"
				set q name of theFade to "Fade Out Previous"
				set cue target of theFade to lastTextCue
				set duration of theFade to 0.05
				set stop target when done of theFade to true
				set do opacity of theFade to true
				set opacity of theFade to 0
				move cue theFade to end of subGroup
				
				-- Delay new subtitle appearance so the fade out completes first
				set pre wait of currentTextCue to 0.05
			end if
			
			-- Optional: Apply stage assignment if the named stage exists in QLab
			if theStageName is not "" then
				try
					set stage name of currentTextCue to theStageName
				end try
			end if
			
			-- Build operator notes
			set theNotes to theOperatorNote
			set theNotes to my appendNote(theNotes, "Language: ", theLanguage)
			set theNotes to my appendNote(theNotes, "Source row: ", rowIndex as text)
			set notes of currentTextCue to theNotes
			
			-- Keep track of the current Text cue as the target for the next fade
			set lastTextCue to currentTextCue
		end repeat
	end tell
end tell
