export type VoiceOption = {
  id: string;
  label: string;
  name: string;
  languageCode: string;
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
};

export const VOICES: VoiceOption[] = [
  {
    id: 'en-US-Standard-B',
    label: 'US Standard B (Male)',
    name: 'en-US-Standard-B',
    languageCode: 'en-US',
    ssmlGender: 'MALE',
  },
  {
    id: 'en-US-Standard-C',
    label: 'US Standard C (Female)',
    name: 'en-US-Standard-C',
    languageCode: 'en-US',
    ssmlGender: 'FEMALE',
  },
  {
    id: 'en-US-Standard-D',
    label: 'US Standard D (Male)',
    name: 'en-US-Standard-D',
    languageCode: 'en-US',
    ssmlGender: 'MALE',
  },
  {
    id: 'en-US-Standard-E',
    label: 'US Standard E (Female)',
    name: 'en-US-Standard-E',
    languageCode: 'en-US',
    ssmlGender: 'FEMALE',
  },
  {
    id: 'en-US-Wavenet-D',
    label: 'US WaveNet D (Male)',
    name: 'en-US-Wavenet-D',
    languageCode: 'en-US',
    ssmlGender: 'MALE',
  },
  {
    id: 'en-US-Wavenet-F',
    label: 'US WaveNet F (Female)',
    name: 'en-US-Wavenet-F',
    languageCode: 'en-US',
    ssmlGender: 'FEMALE',
  },
];
