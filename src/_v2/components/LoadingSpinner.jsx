import { Spinner } from '@radix-ui/themes';

export default function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
      <Spinner />
    </div>
  );
}
