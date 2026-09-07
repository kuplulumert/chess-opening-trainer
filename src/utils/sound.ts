const MOVE_SOUND_URL = `${import.meta.env.BASE_URL}move-sound.mp3`;

// Played through the Web Audio API rather than an <audio> element on
// purpose: on iOS, HTML media elements ignore the ring/silent switch and
// keep playing, whereas Web Audio output is muted by it — and a move click
// should behave like any other app sound and go quiet when the phone is
// on silent.
let context: AudioContext | null = null;
let bufferPromise: Promise<AudioBuffer> | null = null;

function getContext(): AudioContext | null {
  if (typeof AudioContext === "undefined") return null;
  context ??= new AudioContext();
  return context;
}

function loadBuffer(ctx: AudioContext): Promise<AudioBuffer> {
  bufferPromise ??= fetch(MOVE_SOUND_URL)
    .then((response) => response.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data));
  return bufferPromise;
}

// Fetch + decode ahead of time so the very first move isn't late by a
// network round-trip. Creating the context before any user gesture is
// fine — it just starts suspended until the first play() resumes it.
export function preloadMoveSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  loadBuffer(ctx).catch(() => {
    // Let the next play() retry the fetch.
    bufferPromise = null;
  });
}

export function playMoveSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  // iOS keeps a context suspended until it's resumed from a user gesture.
  // The trainee's own move is always a tap, so resuming here (synchronously
  // inside that tap's handler) unlocks it for the auto-played reply too.
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }
  loadBuffer(ctx)
    .then((buffer) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    })
    .catch(() => {
      // A move sound is a nice-to-have — retry the fetch next time.
      bufferPromise = null;
    });
}
