import { Container } from '@radix-ui/themes';
import PageHeader from '@/components/layout/PageHeader';
import TasksTab from '@/components/tasks/tabs/TasksTab';

export default function TasksPage() {
  return (
    <Container>
      <PageHeader title="Taches" subtitle="Pilotage des taches intervention" />
      <TasksTab />
    </Container>
  );
}
