import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  RELATIONSHIP_LABELS,
  RELATIONSHIP_OPTIONS,
  type RelationshipType,
} from '@/constants/personas';
import { useSettingsStore } from '@/store/settingsStore';

export default function PersonaScreen() {
  const router = useRouter();
  const { personas, selectedPersonaId, addPersona, deletePersona, selectPersona } =
    useSettingsStore();
  const [displayName, setDisplayName] = useState('');
  const [relationshipType, setRelationshipType] =
    useState<RelationshipType>('friend');
  const [defaultTheme, setDefaultTheme] = useState('');

  const canDelete = personas.length > 1;
  const canSubmit = displayName.trim().length > 0;
  const selectedLabel = useMemo(
    () => personas.find((persona) => persona.id === selectedPersonaId)?.displayName,
    [personas, selectedPersonaId]
  );

  const handleAdd = () => {
    if (!canSubmit) {
      return;
    }
    addPersona({
      displayName: displayName.trim(),
      relationshipType,
      defaultTheme: defaultTheme.trim() || undefined,
    });
    setDisplayName('');
    setDefaultTheme('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </Pressable>
        <View>
          <Text style={styles.title}>Personas</Text>
          <Text style={styles.subtitle}>
            Selected: {selectedLabel ?? 'None'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your personas</Text>
          {personas.map((persona) => {
            const isSelected = persona.id === selectedPersonaId;
            return (
              <Pressable
                key={persona.id}
                onPress={() => selectPersona(persona.id)}
                style={[styles.card, isSelected && styles.cardSelected]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{persona.displayName}</Text>
                  <Pressable
                    onPress={() => deletePersona(persona.id)}
                    disabled={!canDelete}
                    style={[
                      styles.deleteButton,
                      !canDelete && styles.deleteButtonDisabled,
                    ]}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </Pressable>
                </View>
                <Text style={styles.cardMeta}>
                  {RELATIONSHIP_LABELS[persona.relationshipType]}
                </Text>
                {persona.defaultTheme ? (
                  <Text style={styles.cardTheme}>Theme: {persona.defaultTheme}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add a persona</Text>
          <TextInput
            style={styles.input}
            placeholder="Display name (e.g., Strict Boss)"
            placeholderTextColor="#94A3B8"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Text style={styles.fieldLabel}>Relationship</Text>
          <View style={styles.chipRow}>
            {RELATIONSHIP_OPTIONS.map((option) => {
              const active = option === relationshipType;
              return (
                <Pressable
                  key={option}
                  onPress={() => setRelationshipType(option)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {RELATIONSHIP_LABELS[option]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Optional theme (e.g., urgent work)"
            placeholderTextColor="#94A3B8"
            value={defaultTheme}
            onChangeText={setDefaultTheme}
          />

          <Pressable
            style={[styles.addButton, !canSubmit && styles.addButtonDisabled]}
            onPress={handleAdd}
            disabled={!canSubmit}>
            <Text style={styles.addButtonText}>Add persona</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 64,
    paddingHorizontal: 20,
  },
  headerRow: {
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
    backgroundColor: '#E2E8F0',
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
    marginTop: 2,
  },
  content: {
    paddingBottom: 40,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardSelected: {
    borderColor: '#38BDF8',
    backgroundColor: '#F0F9FF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardName: {
    color: '#0F172A',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  cardMeta: {
    color: '#475569',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  cardTheme: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  deleteButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: '#0F172A',
  },
  fieldLabel: {
    color: '#475569',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5F5',
    backgroundColor: '#F8FAFC',
  },
  chipActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#E0F2FE',
  },
  chipText: {
    color: '#475569',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  chipTextActive: {
    color: '#0F172A',
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  addButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#38BDF8',
  },
  addButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  addButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
});
