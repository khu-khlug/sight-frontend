import { Box, Grid, GridItem } from "@chakra-ui/react";
import RecentDamsoPosts from "../RecentDamsoPosts";
import IdeaCloud from "../IdeaCloud";

export default function DamsoAndIdea() {
  return (
    <Box marginTop="24px">
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="24px">
        <GridItem>
          <RecentDamsoPosts noMargin />
        </GridItem>
        <GridItem>
          <IdeaCloud noMargin />
        </GridItem>
      </Grid>
    </Box>
  );
}
