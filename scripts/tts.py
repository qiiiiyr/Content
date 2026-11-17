"""Voiceover: reads {"voice", "rate", "items": [{"text", "out"}]} as JSON on stdin and writes
<out>.mp3 plus <out>.json word timings [{"t": seconds, "w": word}] for each item.

To sound less like one flat read-out, each scene is spoken sentence by sentence: the hook is a little faster and
higher, questions rise, the last sentence settles lower and slower, and each sentence is followed by a short pause that
fits its punctuation. Then the pieces are joined and the word timings are shifted to match.
shortcut: uses Microsoft Edge's free online voices (unofficial, may break); swap this file for a paid TTS once it earns."""
import asyncio, json, os, re, subprocess, sys, tempfile
import edge_tts

PAUSE = {".": 0.22, "!": 0.22, "?": 0.3, ":": 0.14, ",": 0.08}  # seconds after a chunk, by its last character


def pct(base, delta):
    return f"{int(base.rstrip('%')) + delta:+d}%"


def chunks(text):
    """Sentences, with long ones also cut at colons and commas so each piece is one breath."""
    out = []
    for s in re.split(r"(?<=[.!?])\s+", text.strip()):
        if len(s.split()) <= 12:
            out.append(s)
        else:
            out += [p for p in re.split(r"(?<=[,:])\s+", s) if p]
    return out


def prosody(i, n, text, base_rate):
    """(rate, pitch) for chunk i of n."""
    rate, pitch = base_rate, 0
    if i == 0:
        rate, pitch = pct(base_rate, 4), 3
    elif i == n - 1:
        rate, pitch = pct(base_rate, -4), -3
    else:
        pitch = 1 if i % 2 else -1
    if text.endswith("?"):
        pitch += 4
    return rate, f"{pitch or 1:+d}Hz"  # a literal +0Hz is rejected by the service


async def speak_chunk(text, voice, rate, pitch, out):
    for attempt in range(4):
        try:
            c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary", proxy=os.environ.get("HTTPS_PROXY"))
            words = []
            with open(out, "wb") as f:
                async for ch in c.stream():
                    if ch["type"] == "audio":
                        f.write(ch["data"])
                    elif ch["type"] == "WordBoundary":
                        words.append({"t": ch["offset"] / 1e7, "w": ch["text"]})
            return words
        except Exception as e:  # the free service drops connections now and then
            if attempt == 3:
                raise
            print(f"tts retry {attempt + 1}: {e}", file=sys.stderr)
            await asyncio.sleep(2 * (attempt + 1))


def seconds(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).decode())


async def speak(text, voice, rate, out):
    parts = chunks(text)
    words, t, listing = [], 0.0, []
    with tempfile.TemporaryDirectory() as tmp:
        for i, part in enumerate(parts):
            r, p = prosody(i, len(parts), part, rate)
            f = f"{tmp}/c{i}.mp3"
            for w in await speak_chunk(part, voice, r, p, f):
                words.append({"t": round(t + w["t"], 3), "w": w["w"]})
            listing.append(f)
            t += seconds(f)
            gap = PAUSE.get(part[-1], 0.1) if i < len(parts) - 1 else 0
            if gap:
                s = f"{tmp}/s{i}.mp3"
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", str(gap), "-c:a", "libmp3lame", s], check=True)
                listing.append(s)
                t += gap
        with open(f"{tmp}/list.txt", "w") as f:
            f.write("".join(f"file '{p}'\n" for p in listing))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{tmp}/list.txt", "-c:a", "libmp3lame", "-b:a", "96k", "-ar", "24000", out + ".mp3"], check=True)
    with open(out + ".json", "w") as f:
        json.dump(words, f, ensure_ascii=False)


async def main():
    job = json.load(sys.stdin)
    for item in job["items"]:
        os.makedirs(os.path.dirname(item["out"]), exist_ok=True)
        await speak(item["text"], job["voice"], job["rate"], item["out"])


if __name__ == "__main__":
    asyncio.run(main())
