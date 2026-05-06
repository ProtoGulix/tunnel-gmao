import { useState } from 'react';
import { Flex, Heading, Text, Button } from '@radix-ui/themes';
import { Home, ShoppingCart } from 'lucide-react';
import { PlanningPane } from '@/components/home/PlanningPane';
import { BriefingPane } from '@/components/home/BriefingPane';
import SpontaneousPurchaseRequestModal from '@/components/home/SpontaneousPurchaseRequestModal';

export default function HomeSplit() {
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--gray-1) 0%, var(--gray-2) 100%)',
          borderBottom: '1px solid var(--gray-6)',
          padding: '14px 24px',
          flexShrink: 0,
        }}
      >
        <Flex justify="between" align="center">
          <Flex align="center" gap="3">
            <Home size={28} strokeWidth={1.5} aria-hidden="true" />
            <Flex direction="column" gap="0">
              <Heading size="5" weight="bold">Accueil</Heading>
              <Text size="1" color="gray" style={{ textTransform: 'capitalize' }}>
                {dateLabel}
              </Text>
            </Flex>
          </Flex>

          <Button size="2" onClick={() => setPurchaseModalOpen(true)}>
            <ShoppingCart size={16} />
            Demande d&apos;achat
          </Button>
        </Flex>
      </div>

      {/* ── Split planning / briefing ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Colonne gauche — Planning */}
        <div
          style={{
            width: '50%',
            borderRight: '1px solid var(--gray-5)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <PlanningPane />
        </div>

        {/* Colonne droite — Briefing */}
        <div
          style={{
            width: '50%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <BriefingPane />
        </div>
      </div>

      <SpontaneousPurchaseRequestModal
        open={purchaseModalOpen}
        onOpenChange={setPurchaseModalOpen}
      />
    </div>
  );
}
