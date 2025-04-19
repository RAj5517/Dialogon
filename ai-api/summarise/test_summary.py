from summarise import summarize_transcript

# Simulated transcription (like from your STT step)
transcript = """
Hello everyone, welcome to the Dialogon weekly meeting.
Yash completed the STT module, Subhan worked on the frontend UI design.
Hardik is testing the bot's ability to join Zoom calls.
Next sprint starts on Monday.
"""

# Call the summarizer
summary = summarize_transcript(transcript)

# Print the summary
print("📝 Summary:\n")
print(summary)
