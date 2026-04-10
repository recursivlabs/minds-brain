import * as React from 'react';
import { View, ScrollView, Pressable, Platform, Modal, TextInput as RNTextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { Text, Card, Button, Input } from '../../components';
import { StatCard } from '../../components/StatCard';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { Deal, DealStage, STAGES, listDeals, createDeal, updateDeal, deleteDeal, seedIfEmpty } from '../../lib/pipeline';

// ── Stage badge ────────────────────────────────────────────────────────────

function StageBadge({ stage }: { stage: DealStage }) {
  const s = STAGES.find(x => x.key === stage);
  if (!s) return null;
  return (
    <View style={{
      paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full,
      backgroundColor: s.color + '18',
    }}>
      <Text variant="caption" color={s.color}>{s.label}</Text>
    </View>
  );
}

// ── Priority indicator ─────────────────────────────────────────────────────

function PriorityDot({ priority }: { priority: number }) {
  const c = priority <= 1 ? colors.error : priority <= 2 ? colors.warning : colors.textMuted;
  return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />;
}

// ── Format currency ────────────────────────────────────────────────────────

function fmt(v: number | null): string {
  if (v == null) return 'TBD';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

// ── Deal row ───────────────────────────────────────────────────────────────

function DealRow({ deal, onPress }: { deal: Deal; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
        borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle,
        backgroundColor: pressed ? colors.surfaceHover : 'transparent',
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      })}
    >
      <PriorityDot priority={deal.priority} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="bodyMedium" numberOfLines={1}>{deal.name}</Text>
        <Text variant="caption" color={colors.textMuted} numberOfLines={1}>{deal.company}</Text>
      </View>
      <View style={{ minWidth: 80, alignItems: 'flex-end' }}>
        <Text variant="bodyMedium" color={deal.deal_value ? colors.text : colors.textMuted}>
          {fmt(deal.deal_value)}
        </Text>
      </View>
      <StageBadge stage={deal.stage} />
      <View style={{ minWidth: 100, alignItems: 'flex-end' }}>
        <Text variant="caption" color={colors.textSecondary}>
          {deal.last_contact ? new Date(deal.last_contact).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--'}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Deal detail modal ──────────────────────────────────────────────────────

function DealModal({ deal, visible, onClose, onSave, onDelete }: {
  deal: Deal | null;
  visible: boolean;
  onClose: () => void;
  onSave: (fields: Partial<Deal>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [stage, setStage] = React.useState<DealStage>('lead');
  const [dealValue, setDealValue] = React.useState('');
  const [contactName, setContactName] = React.useState('');
  const [contactRole, setContactRole] = React.useState('');
  const [nextStep, setNextStep] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [priority, setPriority] = React.useState(3);

  React.useEffect(() => {
    if (deal) {
      setName(deal.name);
      setCompany(deal.company);
      setStage(deal.stage);
      setDealValue(deal.deal_value != null ? String(deal.deal_value) : '');
      setContactName(deal.contact_name);
      setContactRole(deal.contact_role);
      setNextStep(deal.next_step);
      setNotes(deal.notes);
      setPriority(deal.priority);
    } else {
      setName(''); setCompany(''); setStage('lead'); setDealValue('');
      setContactName(''); setContactRole(''); setNextStep(''); setNotes(''); setPriority(3);
    }
  }, [deal, visible]);

  const activeStages = STAGES.filter(s => s.key !== 'closed_lost');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{
        flex: 1, backgroundColor: colors.overlay,
        justifyContent: 'center', alignItems: 'center',
      }} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 520, maxHeight: '90%',
            backgroundColor: colors.surface, borderRadius: radius.lg,
            borderWidth: 0.5, borderColor: colors.borderSubtle,
            ...(Platform.OS === 'web' ? { boxShadow: '0 24px 48px rgba(0,0,0,0.5)' } as any : {}),
          }}
        >
          <ScrollView contentContainerStyle={{ padding: spacing['2xl'] }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl }}>
              <Text variant="h2">{deal ? 'Edit Deal' : 'New Deal'}</Text>
              <Pressable onPress={onClose} style={Platform.OS === 'web' ? { cursor: 'pointer' } : {}}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <Input label="Deal Name" value={name} onChangeText={setName} placeholder="e.g. Solix Cloud Partnership" />
            <Input label="Company" value={company} onChangeText={setCompany} placeholder="e.g. Solix" />

            {/* Stage selector */}
            <Text variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>Stage</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md }}>
              {activeStages.map(s => (
                <Pressable
                  key={s.key}
                  onPress={() => setStage(s.key)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
                    backgroundColor: stage === s.key ? s.color + '30' : colors.glass,
                    borderWidth: 0.5,
                    borderColor: stage === s.key ? s.color + '60' : colors.glassBorder,
                    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
                  }}
                >
                  <Text variant="caption" color={stage === s.key ? s.color : colors.textSecondary}>{s.label}</Text>
                </Pressable>
              ))}
            </View>

            <Input label="Deal Value ($)" value={dealValue} onChangeText={setDealValue} placeholder="e.g. 75000" keyboardType="numeric" />
            <Input label="Contact Name" value={contactName} onChangeText={setContactName} placeholder="e.g. Akshay Kumar" />
            <Input label="Contact Role" value={contactRole} onChangeText={setContactRole} placeholder="e.g. VP of Alliances" />
            <Input label="Next Step" value={nextStep} onChangeText={setNextStep} placeholder="What needs to happen next?" />

            {/* Priority selector */}
            <Text variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>Priority</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
              {[1, 2, 3, 4, 5].map(p => (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  style={{
                    width: 36, height: 36, borderRadius: radius.sm,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: priority === p ? colors.accentMuted : colors.glass,
                    borderWidth: 0.5,
                    borderColor: priority === p ? colors.accent + '40' : colors.glassBorder,
                    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
                  }}
                >
                  <Text variant="bodyMedium" color={priority === p ? colors.accent : colors.textSecondary}>{p}</Text>
                </Pressable>
              ))}
            </View>

            {/* Notes */}
            <Text variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>Notes</Text>
            <RNTextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              placeholder="Deal context, risks, history..."
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.glass,
                borderWidth: 0.5, borderColor: colors.glassBorder,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md, paddingVertical: spacing.md,
                color: colors.text, minHeight: 100, textAlignVertical: 'top',
                ...typography.body,
                ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
                marginBottom: spacing.xl,
              }}
            />

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              {deal && (
                <Button variant="ghost" onPress={onDelete} style={{ marginRight: 'auto' as any }}>
                  Delete
                </Button>
              )}
              <View style={{ flex: 1 }} />
              <Button variant="secondary" onPress={onClose}>Cancel</Button>
              <Button onPress={() => {
                onSave({
                  name, company, stage,
                  deal_value: dealValue ? Number(dealValue) : null,
                  contact_name: contactName, contact_role: contactRole,
                  next_step: nextStep, notes, priority,
                });
              }}>
                {deal ? 'Save' : 'Create'}
              </Button>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function PipelineScreen() {
  const { sdk } = useAuth();
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalDeal, setModalDeal] = React.useState<Deal | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);

  const loadDeals = React.useCallback(async () => {
    if (!sdk) return;
    try {
      await seedIfEmpty(sdk);
      const rows = await listDeals(sdk);
      setDeals(rows);
    } catch (err) {
      console.warn('Failed to load pipeline:', err);
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  React.useEffect(() => { loadDeals(); }, [loadDeals]);

  // Stats
  const activeDeals = deals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost');
  const totalValue = activeDeals.reduce((sum, d) => sum + (d.deal_value ?? 0), 0);
  const wonDeals = deals.filter(d => d.stage === 'closed_won');
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.deal_value ?? 0), 0);

  // Group by stage for the stage breakdown
  const stageCounts = STAGES.map(s => ({
    ...s,
    count: deals.filter(d => d.stage === s.key).length,
    value: deals.filter(d => d.stage === s.key).reduce((sum, d) => sum + (d.deal_value ?? 0), 0),
  })).filter(s => s.count > 0);

  const handleSave = async (fields: Partial<Deal>) => {
    if (!sdk) return;
    try {
      if (modalDeal) {
        await updateDeal(sdk, modalDeal.id, fields);
      } else {
        await createDeal(sdk, fields as any);
      }
      setModalVisible(false);
      setModalDeal(null);
      await loadDeals();
    } catch (err) {
      console.warn('Failed to save deal:', err);
    }
  };

  const handleDelete = async () => {
    if (!sdk || !modalDeal) return;
    try {
      await deleteDeal(sdk, modalDeal.id);
      setModalVisible(false);
      setModalDeal(null);
      await loadDeals();
    } catch (err) {
      console.warn('Failed to delete deal:', err);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: spacing.xl,
        maxWidth: 960,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing['3xl'] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <MaterialCommunityIcons name="handshake-outline" size={24} color={colors.accent} />
          <Text variant="h1">Pipeline</Text>
        </View>
        <Button size="sm" onPress={() => { setModalDeal(null); setModalVisible(true); }}>
          Add Deal
        </Button>
      </View>

      {/* Auto-sync note */}
      <Card variant="ghost" padding="md" style={{ marginBottom: spacing['2xl'], flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <MaterialCommunityIcons name="sync" size={16} color={colors.accent} />
        <Text variant="caption" color={colors.textSecondary}>
          This pipeline syncs automatically from your conversations with Claude.
        </Text>
      </Card>

      {/* Key metrics */}
      <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md }}>PIPELINE OVERVIEW</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing['3xl'] }}>
        <StatCard label="Active Deals" value={String(activeDeals.length)} />
        <StatCard label="Pipeline Value" value={fmt(totalValue)} size="hero" />
        <StatCard label="Won" value={fmt(wonValue)} />
      </View>

      {/* Stage breakdown */}
      <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md }}>BY STAGE</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing['3xl'] }}>
        {stageCounts.map(s => (
          <Card key={s.key} variant="default" padding="md" style={{ minWidth: 120 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
              <Text variant="caption" color={colors.textSecondary}>{s.label}</Text>
            </View>
            <Text variant="h3">{s.count} deal{s.count !== 1 ? 's' : ''}</Text>
            {s.value > 0 && <Text variant="caption" color={colors.textMuted}>{fmt(s.value)}</Text>}
          </Card>
        ))}
      </View>

      {/* Deals list */}
      <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md }}>ALL DEALS</Text>
      <Card variant="default" padding="xs" style={{ marginBottom: spacing['3xl'] }}>
        {/* Table header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: spacing.md,
          paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
          borderBottomWidth: 0.5, borderBottomColor: colors.border,
        }}>
          <View style={{ width: 8 }} />
          <View style={{ flex: 1 }}>
            <Text variant="label" color={colors.textMuted}>Deal</Text>
          </View>
          <View style={{ minWidth: 80, alignItems: 'flex-end' }}>
            <Text variant="label" color={colors.textMuted}>Value</Text>
          </View>
          <View style={{ minWidth: 80 }}>
            <Text variant="label" color={colors.textMuted}>Stage</Text>
          </View>
          <View style={{ minWidth: 100, alignItems: 'flex-end' }}>
            <Text variant="label" color={colors.textMuted}>Last Contact</Text>
          </View>
        </View>

        {loading ? (
          <View style={{ paddingVertical: spacing['3xl'], alignItems: 'center' }}>
            <Text variant="body" color={colors.textMuted}>Loading pipeline...</Text>
          </View>
        ) : deals.length === 0 ? (
          <View style={{ paddingVertical: spacing['3xl'], alignItems: 'center' }}>
            <MaterialCommunityIcons name="handshake-outline" size={32} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
            <Text variant="body" color={colors.textMuted}>No deals yet</Text>
            <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
              Tell Claude about a prospect and it will appear here
            </Text>
          </View>
        ) : (
          deals.map(deal => (
            <DealRow
              key={deal.id}
              deal={deal}
              onPress={() => { setModalDeal(deal); setModalVisible(true); }}
            />
          ))
        )}
      </Card>

      {/* Next actions */}
      {activeDeals.length > 0 && (
        <>
          <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md }}>NEXT ACTIONS</Text>
          <View style={{ gap: spacing.sm, marginBottom: spacing['3xl'] }}>
            {activeDeals.filter(d => d.next_step).map(deal => (
              <Card key={deal.id} variant="default" padding="md">
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
                  <PriorityDot priority={deal.priority} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                      <Text variant="label" color={colors.text}>{deal.company}</Text>
                      <StageBadge stage={deal.stage} />
                    </View>
                    <Text variant="body" color={colors.textSecondary}>{deal.next_step}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </>
      )}

      <DealModal
        deal={modalDeal}
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setModalDeal(null); }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </ScrollView>
  );
}
