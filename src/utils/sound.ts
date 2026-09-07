const MOVE_SOUND_URL = `${import.meta.env.BASE_URL}move-sound.mp3`;

// A fresh Audio() per call rather than one shared/reused instance — moves
// can happen in quick succession (e.g. an opponent reply right after the
// trainee's own move), and reusing one instance would cut the previous
// sound off instead of letting both play.
export function playMoveSound(): void {
  try {
    const audio = new Audio(MOVE_SOUND_URL);
    void audio.play().catch(() => {
      // Playback can be blocked (autoplay policy, no user gesture yet) —
      // the move sound is a nice-to-have, not essential.
    });
  } catch {
    // Audio unsupported in this environment — ignore.
  }
}
