import { Center, Spinner } from "@chakra-ui/react";
import { lazy, Suspense } from "react";

import type { TiptapEditorProps } from "./types";

const TiptapEditorContent = lazy(() => import("./TiptapEditorContent"));

export type { TiptapEditorProps } from "./types";

export default function TiptapEditor(props: TiptapEditorProps) {
  return (
    <Suspense fallback={<Center minH="320px" borderWidth="1px" borderRadius="md"><Spinner /></Center>}>
      <TiptapEditorContent {...props} />
    </Suspense>
  );
}
