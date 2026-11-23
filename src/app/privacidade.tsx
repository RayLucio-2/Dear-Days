import { Legal } from '@/components/Legal';
import { PRIVACIDADE } from '@/lib/legal';

export default function Privacidade() {
  return <Legal titulo="Política de privacidade" secoes={PRIVACIDADE} />;
}
