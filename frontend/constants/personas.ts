export type RelationshipType =
  | 'boss'
  | 'parent'
  | 'sibling'
  | 'friend'
  | 'landlord'
  | 'partner'
  | 'other';

export type PersonaProfile = {
  id: string;
  displayName: string;
  relationshipType: RelationshipType;
  defaultTheme?: string;
  voiceId?: string;
};

export const RELATIONSHIP_OPTIONS: RelationshipType[] = [
  'boss',
  'parent',
  'sibling',
  'friend',
  'landlord',
  'partner',
  'other',
];

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  boss: 'Boss',
  parent: 'Parent',
  sibling: 'Sibling',
  friend: 'Friend',
  landlord: 'Landlord',
  partner: 'Partner',
  other: 'Other',
};

export const DEFAULT_PERSONAS: PersonaProfile[] = [
  {
    id: '0a0f6e35-0b4b-4215-9c08-0c5d9bc7b709',
    displayName: 'Strict Boss',
    relationshipType: 'boss',
    defaultTheme: 'urgent work update',
    voiceId: 'en-US-Standard-B',
  },
  {
    id: '2c1e9c1b-6b9a-4e16-86fe-1b4dd6a04e8e',
    displayName: 'Panicked Roommate',
    relationshipType: 'friend',
    defaultTheme: 'locked out of the apartment',
    voiceId: 'en-US-Standard-C',
  },
  {
    id: '0e3b0f2a-94f2-49b5-8aa8-8d4cfd8434ac',
    displayName: 'The Landlord',
    relationshipType: 'landlord',
    defaultTheme: 'water leak at home',
    voiceId: 'en-US-Standard-D',
  },
  {
    id: 'f7f1d6a2-4c15-4b38-a147-41ac750c2db4',
    displayName: 'School Admin',
    relationshipType: 'parent',
    defaultTheme: 'child pickup',
    voiceId: 'en-US-Standard-E',
  },
];
