import { createSystem, defineConfig, defaultConfig } from "@chakra-ui/react"

const customConfig = defineConfig({
  theme: {
    textStyles:{
      body: {
        value: {
          fontFamily: "monospace",
        },
      },
      heading:{
        value:{
          fontFamily: "monospace",
        }
      }
    }
  },
})

export const system = createSystem(defaultConfig, customConfig)