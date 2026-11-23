import { Legal } from '@/components/Legal';
import { TERMOS } from '@/lib/legal';

export default function Termos() {
  return <Legal titulo="Termos de uso" secoes={TERMOS} />;
}
