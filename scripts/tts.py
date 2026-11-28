"""Voiceover: reads {"voice", "rate", "items": [{"text", "out"}]} as JSON on stdin and writes
<out>.mp3 plus <out>.json word timings [{"t": seconds, "w": word}] for each item.

Each scene is spoken in one request, so the voice keeps its own natural flow and intonation across sentences (cutting
it into sentences and gluing them back made it sound stiff). The voice and speed come from scripts/build.ts voiceFor.
shortcut: uses Microsoft Edge's free online voices (unofficial, may break); swap this file for a paid TTS (ElevenLabs
returns word timings too) once the channels earn."""
import asyncio, json, os, sys
import edge_tts


def to_words(events):
    """Word timings from the service's WordBoundary events (offsets in 100-nanosecond units)."""
    return [{"t": round(e["offset"] / 1e7, 3), "w": e["text"]} for e in events if e["type"] == "WordBoundary"]


async def speak(text, voice, rate, out):
    for attempt in range(5):
        try:
            c = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary", proxy=os.environ.get("HTTPS_PROXY"))
            events = []
            with open(out + ".mp3", "wb") as f:
                async for ch in c.stream():
                    if ch["type"] == "audio":
                        f.write(ch["data"])
                    else:
                        events.append(ch)
            break
        except Exception as e:  # the free service drops connections now and then
            if attempt == 4:
                raise
            print(f"tts retry {attempt + 1}: {e}", file=sys.stderr)
            await asyncio.sleep(3 * (attempt + 1))
    with open(out + ".json", "w") as f:
        json.dump(to_words(events), f, ensure_ascii=False)


def fallback(voice):
    """The same narrator's older voice: the Multilingual ones answer "No audio was received" for hours at a time."""
    return voice.replace("MultilingualNeural", "Neural") if "MultilingualNeural" in voice else None


async def main():
    job = json.load(sys.stdin)
    for item in job["items"]:
        os.makedirs(os.path.dirname(item["out"]), exist_ok=True)
    try:
        for item in job["items"]:
            await speak(item["text"], job["voice"], job["rate"], item["out"])
    except Exception as e:
        alt = fallback(job["voice"])
        if not alt:
            raise
        # the whole episode in one voice, never a mix
        print(f"tts: {job['voice']} kept failing ({e}); using {alt} for every scene", file=sys.stderr)
        for item in job["items"]:
            await speak(item["text"], alt, job["rate"], item["out"])


def self_check():
    """Offline check of the word-timing conversion (run by npm test)."""
    events = [{"type": "WordBoundary", "offset": 1_250_000, "text": "Honda"}, {"type": "SentenceBoundary", "offset": 0, "text": "x"}, {"type": "WordBoundary", "offset": 7_000_000, "text": "scooters"}]
    assert to_words(events) == [{"t": 0.125, "w": "Honda"}, {"t": 0.7, "w": "scooters"}]
    assert fallback("en-US-AndrewMultilingualNeural") == "en-US-AndrewNeural" and fallback("id-ID-ArdiNeural") is None
    print("tts self-check OK")


if __name__ == "__main__":
    self_check() if "--self-check" in sys.argv else asyncio.run(main())
