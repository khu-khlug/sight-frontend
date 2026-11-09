import { Badge, Text } from "@chakra-ui/react";
import { Building2 } from "lucide-react";

import { SpecialOrganization, SpecialOrganizationLabel } from "../../constant";
import AppTooltip from "../AppTooltip";

type Props = {
  organization: SpecialOrganization;
};

export default function GroupSpecialOrganizationBadge({ organization }: Props) {
  const label = SpecialOrganizationLabel[organization];
  return (
    <AppTooltip content={label}>
      <Badge colorPalette="teal" size="sm" maxW="100%">
        <Building2 size={16} />
        <Text as="span" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
          {label}
        </Text>
      </Badge>
    </AppTooltip>
  );
}
