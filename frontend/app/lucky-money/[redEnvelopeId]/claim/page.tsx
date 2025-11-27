import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { ClaimRedEnvelope } from '@/modules/lucky-money/components';
import { ClaimRedEnvelopeProvider } from '@/modules/lucky-money/context/ClaimRedEnvelopeContext';

export default function ClaimRedEnvelopePage() {
  return (
    <ProtectedRoute title="Claim Red Envelope">
      <ClaimRedEnvelopeProvider>
        <ClaimRedEnvelope />
      </ClaimRedEnvelopeProvider>
    </ProtectedRoute>
  );
}
