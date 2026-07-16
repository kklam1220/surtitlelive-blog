-- Excel columns: cue_number, subtitle_text, operator_note, language, stage, alignment.
-- Open the XLSX in Excel and a disposable/copy QLab 5 workspace, then run this script.
-- QLab's official move pattern:
-- https://qlab.app/docs/v5/scripting/examples/#create-and-move-a-new-cue

property fadeSeconds : 0.05
property subtitleWidth : 1600

on plainText(theValue)
	if theValue is missing value then return ""
	return theValue as text
end plainText

-- QLab requires a cue to be moved by uniqueID relative to its current parent.
on makeCueInGroup(cueType, destinationContainer)
	tell application id "com.figure53.QLab.5" to tell front workspace
		make type cueType
		set newCue to last item of (selected as list)
		set q number of newCue to ""
		set newCueID to uniqueID of newCue
		set sourceList to parent of newCue
		move cue id newCueID of sourceList to end of destinationContainer
		return cue id newCueID of destinationContainer
	end tell
end makeCueInGroup

tell application id "com.microsoft.Excel"
	if (count of workbooks) is 0 then error "Open the subtitle XLSX in Microsoft Excel before running this script."
	set rowCount to count of rows of used range of worksheet 1 of active workbook
	if rowCount < 2 then error "The active worksheet has no subtitle rows."
	set excelRows to value of range ("A2:F" & rowCount) of worksheet 1 of active workbook
end tell

tell application id "com.figure53.QLab.5" to tell front workspace
	set destinationCueList to current cue list
	if destinationCueList is missing value then error "Open the QLab cue list that should receive the subtitles, then run this script again."

	repeat with rowData in excelRows
		set cueNumber to my plainText(item 1 of rowData)
		if cueNumber is not "" then
			try
				set existingCue to cue cueNumber
				error "Cue number '" & cueNumber & "' already exists in this QLab workspace. Use a new/copy workspace or remove the earlier test import first."
			on error errorMessage number errorNumber
				if errorNumber is not -1728 then error errorMessage number errorNumber
			end try
		end if
	end repeat

	set lastTextCue to missing value
	set hasBrokenTextCue to false

	repeat with rowData in excelRows
		set cueNumber to my plainText(item 1 of rowData)
		set subtitleText to my plainText(item 2 of rowData)
		if cueNumber is not "" and subtitleText is not "" then
			set operatorNote to my plainText(item 3 of rowData)
			set languageCode to my plainText(item 4 of rowData)
			set stageName to my plainText(item 5 of rowData)
			set alignmentName to my plainText(item 6 of rowData)

			set subtitleGroup to my makeCueInGroup("group", destinationCueList)
			set mode of subtitleGroup to timeline
			set q number of subtitleGroup to cueNumber
			set q name of subtitleGroup to subtitleText

			if lastTextCue is not missing value then
				set fadeCue to my makeCueInGroup("fade", subtitleGroup)
				set q name of fadeCue to "CLEAR PREVIOUS"
				set cue target of fadeCue to lastTextCue
				set duration of fadeCue to fadeSeconds
				set stop target when done of fadeCue to true
				set do opacity of fadeCue to true
				set opacity of fadeCue to 0
			end if

			set textCue to my makeCueInGroup("text", subtitleGroup)
			if languageCode is "" then
				set q name of textCue to "DISPLAY"
			else
				set q name of textCue to "DISPLAY " & languageCode
			end if
			set text of textCue to subtitleText
			set fixed width of textCue to subtitleWidth
			if alignmentName is not "" then set text alignment of textCue to alignmentName
			if stageName is not "" then
				try
					set stage name of textCue to stageName
				on error
					if operatorNote is not "" then set operatorNote to operatorNote & linefeed
					set operatorNote to operatorNote & "Stage '" & stageName & "' not found; using QLab's default stage."
				end try
			end if
			if languageCode is not "" then
				if operatorNote is not "" then set operatorNote to operatorNote & linefeed
				set operatorNote to operatorNote & "Language: " & languageCode
			end if
			set notes of textCue to operatorNote
			if broken of textCue then set hasBrokenTextCue to true

			if lastTextCue is not missing value then set pre wait of textCue to fadeSeconds
			set lastTextCue to textCue
		end if
	end repeat

	if lastTextCue is not missing value then
		set clearGroup to my makeCueInGroup("group", destinationCueList)
		set mode of clearGroup to timeline
		set q name of clearGroup to "CLEAR LAST SUBTITLE"
		set clearFade to my makeCueInGroup("fade", clearGroup)
		set q name of clearFade to "CLEAR LAST SUBTITLE"
		set cue target of clearFade to lastTextCue
		set duration of clearFade to fadeSeconds
		set stop target when done of clearFade to true
		set do opacity of clearFade to true
		set opacity of clearFade to 0
	end if

	if hasBrokenTextCue then display dialog "Subtitles were created, but QLab marks the Text cues as broken. QLab Text cues require a Video License. Confirm a Video or Bundle License is active, then check Workspace Settings > Video and test the existing cues again." with title "QLab Video License or output required" buttons {"OK"} default button "OK" with icon caution
end tell
