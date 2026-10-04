import whisper

model = whisper.load_model("tiny")
result = model.transcribe("./examples/conversation.mp3")

print(result["text"])