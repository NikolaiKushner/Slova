// Text-to-speech via the browser's Web Speech API — no keys, no network.
// The language is guessed from the script: Cyrillic reads as Russian,
// anything else as English (the platform's default learning language).
export function useSpeech() {
  function speak(text: string) {
    if (!import.meta.client || !("speechSynthesis" in window) || !text) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = /[а-яё]/i.test(text) ? "ru-RU" : "en-US";
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  }
  return { speak };
}
