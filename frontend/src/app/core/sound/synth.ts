import { SILENT_VOLUME } from './sound.constants';

// The building blocks of the game's 8-bit sounds. Each one is planned on the audio context's
// clock at `start` (in seconds), fades out and stops by itself after `duration` seconds.

export function tone(
  context: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  wave: OscillatorType,
  volume: number,
): void {
  slide(context, [frequency], start, duration, wave, volume);
}

// The notes one after another, each ringing until the next one starts.
export function jingle(
  context: AudioContext,
  frequencies: number[],
  start: number,
  gapSeconds: number,
  wave: OscillatorType,
  volume: number,
): void {
  frequencies.forEach((frequency, i) =>
    tone(context, frequency, start + i * gapSeconds, gapSeconds, wave, volume),
  );
}

// One tone whose pitch glides through the frequencies, like [400, 900, 400] for a boing.
export function slide(
  context: AudioContext,
  frequencies: number[],
  start: number,
  duration: number,
  wave: OscillatorType,
  volume: number,
): void {
  const oscillator = glidingOscillator(context, frequencies, start, duration, wave);
  oscillator.connect(fadeOut(context, start, duration, volume));
  playFor(oscillator, start, duration);
}

// A slide whose volume swings up and down `wobbles` times a second: slowly it rumbles, quickly
// it shimmers.
export function tremolo(
  context: AudioContext,
  frequencies: number[],
  start: number,
  duration: number,
  wave: OscillatorType,
  volume: number,
  wobbles: number,
): void {
  const oscillator = glidingOscillator(context, frequencies, start, duration, wave);
  const swing = swingingGain(context, wobbles, start, duration);
  oscillator.connect(swing).connect(fadeOut(context, start, duration, volume));
  playFor(oscillator, start, duration);
}

// A burst of hiss through a filter: lowpass sounds like a splat, bandpass like a whoosh.
export function noise(
  context: AudioContext,
  filterType: BiquadFilterType,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
): void {
  const hiss = context.createBufferSource();
  hiss.buffer = whiteNoise(context, duration);
  const filter = context.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = frequency;
  hiss.connect(filter).connect(fadeOut(context, start, duration, volume));
  playFor(hiss, start, duration);
}

// The pitch moves from each frequency to the next in equal steps over the duration.
function glidingOscillator(
  context: AudioContext,
  frequencies: number[],
  start: number,
  duration: number,
  wave: OscillatorType,
): OscillatorNode {
  const oscillator = context.createOscillator();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequencies[0], start);
  for (let i = 1; i < frequencies.length; i++) {
    const reachedAt = start + (duration * i) / (frequencies.length - 1);
    oscillator.frequency.exponentialRampToValueAtTime(frequencies[i], reachedAt);
  }
  return oscillator;
}

// Starts at the volume and fades to silence, so a sound never ends with a click.
function fadeOut(context: AudioContext, start: number, duration: number, volume: number): GainNode {
  const gain = context.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(SILENT_VOLUME, start + duration);
  gain.connect(context.destination);
  return gain;
}

// A slow oscillator moves the gain between 0 and 1: it sits at 0.5 and swings 0.5 each way.
function swingingGain(
  context: AudioContext,
  wobbles: number,
  start: number,
  duration: number,
): GainNode {
  const gain = context.createGain();
  gain.gain.value = 0.5;
  const swing = context.createGain();
  swing.gain.value = 0.5;
  const wobbler = context.createOscillator();
  wobbler.frequency.value = wobbles;
  wobbler.connect(swing).connect(gain.gain);
  playFor(wobbler, start, duration);
  return gain;
}

// Random samples between -1 and 1, enough for the whole sound.
function whiteNoise(context: AudioContext, duration: number): AudioBuffer {
  const length = Math.ceil(context.sampleRate * duration);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    samples[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function playFor(source: AudioScheduledSourceNode, start: number, duration: number): void {
  source.start(start);
  source.stop(start + duration);
}
