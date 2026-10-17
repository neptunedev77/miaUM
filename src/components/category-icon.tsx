import {
  Backpack, BookOpen, Dumbbell, Gem, Glasses, IdCard, KeyRound, Laptop, Milk, Package, Shirt, Wallet, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  eletronica: Laptop,
  chaves: KeyRound,
  carteiras: Wallet,
  documentos: IdCard,
  malas: Backpack,
  roupa: Shirt,
  oculos: Glasses,
  garrafas: Milk,
  livros: BookOpen,
  acessorios: Gem,
  desporto: Dumbbell,
  outros: Package,
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Package;
  return <Icon aria-hidden className={className} />;
}
