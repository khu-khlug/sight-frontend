import { Grid, GridItem } from "@chakra-ui/react";
import RecentDamsoPosts from "../RecentDamsoPosts";
import IdeaCloud from "../IdeaCloud";

export default function DamsoAndIdea() {
  return (
    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="24px">
      <GridItem minWidth="0">
        <RecentDamsoPosts />
      </GridItem>
      <GridItem minWidth="0">
        <IdeaCloud />
      </GridItem>
    </Grid>
  );
}
