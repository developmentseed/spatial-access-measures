"use client";

import { ChakraProvider } from "@chakra-ui/react";
import {
  ColorModeProvider,
} from "./color-mode";
import { ThemeProviderProps } from "next-themes";
import { system } from "./theme";

export function Provider(props: ThemeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  );
}
