import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  RELATIONSHIP_LABELS,
  RELATIONSHIP_OPTIONS,
  type RelationshipType,
} from '@/constants/personas';
import { useSettingsStore } from '@/store/settingsStore';

export default function PersonaScreen() {
  const router = useRouter();
  const { personas, selectedPersonaId, selectPersona, addPersona, deletePersona } =
    useSettingsStore();

  const [displayName, setDisplayName] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('friend');
  const [defaultTheme, setDefaultTheme] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedPersona = useMemo(
    () => personas.find((persona) => persona.id === selectedPersonaId),
    [personas, selectedPersonaId]
  );

  const handleAdd = () => {
    if (!displayName.trim()) {
      setError('Enter a display name.');
      return;
    }

    addPersona({
      displayName,
      relationshipType,
      defaultTheme: defaultTheme.trim() || undefined,
    });

    setDisplayName('');
    setRelationshipType('friend');
    setDefaultTheme('');
    setError(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </Pressable>
        <View>
          <Text style={styles.title}>Personas</Text>
          <Text style={styles.subtitle}>Pick who is calling</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Selected Persona</Text>
          <View style={styles.selectedCard}>
            <Text style={styles.selectedName}>
              {selectedPersona?.displayName ?? 'None'}
            </Text>
            <Text style={styles.selectedMeta}>
              {selectedPersona
                ? `${RELATIONSHIP_LABELS[selectedPersona.relationshipType]}`
                : 'Select a persona below'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>All Personas</Text>
          {personas.map((persona) => {
            const isSelected = persona.id === selectedPersonaId;
            return (
              <Pressable
                key={persona.id}
                onPress={() => selectPersona(persona.id)}
                style={[styles.personaCard, isSelected && styles.personaCardActive]}>
                <View>
                  <Text style={[styles.personaName, isSelected && styles.personaNameActive]}>
                    {persona.displayName}
                  </Text>
                  <Text style={styles.personaMeta}>
                    {RELATIONSHIP_LABELS[persona.relationshipType]}
                    {persona.defaultTheme ? ` • ${persona.defaultTheme}` : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => deletePersona(persona.id)}
                  style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </Pressable>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Add Persona</Text>
          <View style={styles.formField}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Strict Boss"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.inputLabel}>Relationship</Text>
            <View style={styles.relationshipRow}>
              {RELATIONSHIP_OPTIONS.map((option) => {
                const active = option === relationshipType;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setRelationshipType(option)}
                    style={[styles.relationshipChip, active && styles.relationshipChipActive]}>
                    <Text style={[styles.relationshipText, active && styles.relationshipTextActive]}>
                      {RELATIONSHIP_LABELS[option]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.inputLabel}>Default Theme (optional)</Text>
            <TextInput
              value={defaultTheme}
              onChangeText={setDefaultTheme}
              placeholder="urgent work update"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add Persona</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 68,
    paddingHorizontal: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  title: {
    color: '#0F172A',
    fontSize: 24,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  selectedCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  selectedName: {
    color: '#0F172A',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  selectedMeta: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginTop: 6,
  },
  personaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    marginBottom: 12,
  },
  personaCardActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  personaName: {
    color: '#0F172A',
    fontSize: 15,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  personaNameActive: {
    color: '#0F172A',
  },
  personaMeta: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginTop: 6,
  },
  deleteButton: {
    padding: 8,
  },
  formField: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  relationshipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    backgroundColor: '#FFFFFF',
  },
  relationshipChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38BDF8',
  },
  relationshipText: {
    color: '#334155',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
  relationshipTextActive: {
    color: '#0F172A',
  },
  error: {
    color: '#DC2626',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
});
