"""Voiceover: reads {"voice", "rate", "items": [{"text", "out"}]} as JSON on stdin and writes
<out>.mp3 plus <out>.json word timings [{"t": seconds, "w": word}] for each item.
shortcut: uses Microsoft Edge's free online voices (unofficial, may break); swap this file for a paid TTS once it earns."""
import asyncio, json, os, sys
import edge_tts


async def speak(text, voice, rate, out):
    for attempt in range(4):
        try:
            c = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary", proxy=os.environ.get("HTTPS_PROXY"))
            words = []
            with open(out + ".mp3", "wb") as f:
                async for ch in c.stream():
                    if ch["type"] == "audio":
                        f.write(ch["data"])
                    elif ch["type"] == "WordBoundary":
                        words.append({"t": round(ch["offset"] / 1e7, 3), "w": ch["text"]})
            with open(out + ".json", "w") as f:
                json.dump(words, f, ensure_ascii=False)
            return
        except Exception as e:  # the free service drops connections now and then
            if attempt == 3:
                raise
            print(f"tts retry {attempt + 1}: {e}", file=sys.stderr)
            await asyncio.sleep(2 * (attempt + 1))


async def main():
    job = json.load(sys.stdin)
    for item in job["items"]:
        os.makedirs(os.path.dirname(item["out"]), exist_ok=True)
        await speak(item["text"], job["voice"], job["rate"], item["out"])


asyncio.run(main())
