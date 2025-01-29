import {
  Book,
  Brush,
  Building2,
  CircleHelp,
  Coffee,
  Cog,
  Dna,
  Dumbbell,
  FlaskConical,
  Globe,
  Globe2,
  GraduationCap,
  Hospital,
  LucideProps,
  Microscope,
  Monitor,
  Music,
  Palette,
  PieChart,
  Pill,
  Plane,
  Satellite,
  Scale,
  Sprout,
  VenetianMask,
} from "lucide-react";

type Props = {
  college: string;
};

// 더 적절한 아이콘이 있다면 변경 가능
const CollegeIconMap: Record<string, any> = {
  ["공과대학"]: Cog,
  ["전자정보대학"]: Satellite,
  ["소프트웨어융합대학"]: Monitor,
  ["응용과학대학"]: Microscope,
  ["생명과학대학"]: Dna,
  ["국제대학"]: Globe2,
  ["외국어대학"]: Globe,
  ["예술·디자인대학"]: Palette,
  ["체육대학"]: Dumbbell,
  ["간호과학대학"]: Hospital,
  ["경영대학"]: Building2,
  ["무용학부"]: VenetianMask,
  ["문과대학"]: Book,
  ["미술대학"]: Brush,
  ["법과대학"]: Scale,
  ["생활과학대학"]: Sprout,
  ["약학대학"]: Pill,
  ["음악대학"]: Music,
  ["의과대학"]: Hospital,
  ["이과대학"]: FlaskConical,
  ["자율전공학과"]: Plane,
  ["정경대학"]: PieChart,
  ["치과대학"]: Hospital,
  ["한의과대학"]: Hospital,
  ["호텔관광대학"]: Coffee,
  ["대학원"]: GraduationCap,
};

const UnknownCollegeIcon = CircleHelp;

export default function CollegeIcon({ college, ...rest }: Props & LucideProps) {
  const firstPart = college.split(" ")[0];

  const Icon = CollegeIconMap[firstPart] ?? UnknownCollegeIcon;

  return <Icon {...rest} />;
}
