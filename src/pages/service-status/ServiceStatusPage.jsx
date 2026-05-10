/**
 * Page État du Service
 * 
 * Analyse de l'état du service : charge, fragmentation, capacité de pilotage.
 * 
 * @module pages/service-status/ServiceStatusPage
 */

import { useState } from 'react';
import { Container } from '@radix-ui/themes';

import PageHeader from '@/components/layout/PageHeader';
import ServiceStatusTab from '@/components/service-status/tabs/ServiceStatusTab';

/**
 * Page État du Service
 */
export default function ServiceStatusPage() {
  const [startDate, setStartDate] = useState(() => new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(() => new Date());

  const handleDateRangeChange = ({ range }) => {
    if (range) {
      setStartDate(range.start);
      setEndDate(range.end);
    } else {
      // "Toutes" - on prend une plage large
      setStartDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));
      setEndDate(new Date());
    }
  };

  return (
    <>
      <PageHeader
        title="État du service"
        subtitle="Charge, fragmentation, capacité réelle"
        timeSelection={{
          enabled: true,
          mode: 'popover',
          component: 'daterange',
          onFilterChange: handleDateRangeChange
        }}
      />
      <Container size="4">
        <ServiceStatusTab startDate={startDate} endDate={endDate} />
      </Container>
    </>
  );
}

