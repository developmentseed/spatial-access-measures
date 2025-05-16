import { FormEvent } from "react";
import { Box, Text, Stack } from "@chakra-ui/react";
import { createListCollection } from "@chakra-ui/react";
import { cityList } from "../data/cities";
import Legend from "./Legend";
import useColorScale from "../hooks/useColorScale";
import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "./ui/select";
import { Table } from "apache-arrow";

const access_categories = createListCollection({
  items: [
    {label:"Employment", value:"acs_idx_emp"},
    {label:"Healthcare Facilities", value:"acs_idx_hf"},
    {label:"Primary and Secondary Education", value:"acs_idx_ef"},
    {label:"Post-secondary Education", value:"acs_idx_psef"},
    {label:"Sport and Recreation Facilities", value:"acs_idx_srf"},
    {label:"Cultural and Arts Facilities", value:"acs_idx_caf"}
  ],
});

const access_types = createListCollection({
  items: [
    {label:"Public Transit (Peak)", value:"acs_public_transit_peak"},
    {label:"Public Transit (Off Peak)", value:"acs_public_transit_offpeak"},
    {label:"Cycling", value:"acs_cycling"},
    {label:"Walking", value:"acs_walking"},
  ],
});

interface SidebarProps {
  city: string;
  access: string;
  access_class: string;
  table: Table | undefined;
  onCityChange: (e: FormEvent<HTMLDivElement>) => void;
  onAccessChange: (e: FormEvent<HTMLDivElement>) => void;
  onAccessTypeChange: (e: FormEvent<HTMLDivElement>) => void;
}

export default function Sidebar({ 
  city, 
  access, 
  access_class, 
  table,
  onCityChange,
  onAccessChange,
  onAccessTypeChange
}: SidebarProps) {
  const citiesCollection = createListCollection({
    items: cityList.map(name => ({ label: name, value: name }))
  });

  const { min, max, scale } = useColorScale(table, access, access_class);

  return (
    <Box bg="#fffcf5" w="23rem" p="5" position="absolute" top="4" left="4" boxShadow="lg" zIndex={1000}>
      <Text textStyle="5xl" fontWeight="bold" lineHeight="1">Spatial Access Measures </Text>

      <Text textStyle="sm" py="4" lineHeight="1.3" color="gray.700">
        Spatial Access Measures is a <a href="https://www150.statcan.gc.ca/n1/pub/27-26-0001/272600012023001-eng.htm" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Statistics Canada dataset</a> that shows how easy it is to reach essential places like jobs, schools, healthcare, 
        and stores using public transit, cycling, or walking. High accessibility means many destinations are easy to reach, 
        while low accessibility means it's harder or takes longer to get to the places people need.
      </Text>

      <Stack gap="3">
        <SelectRoot key="cities" size="sm" collection={citiesCollection} onChange={onCityChange}>
          <SelectLabel fontWeight="extrabold" letterSpacing="-0.3px">City</SelectLabel>
          <SelectTrigger>
            <SelectValueText placeholder={city} />
          </SelectTrigger>
          <SelectContent p="1">
            {citiesCollection.items.map((item) => (
              <SelectItem item={item} key={item.value} fontSize="sm" _hover={{ bg: 'yellow.200' }} color="gray.700">
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>

        <SelectRoot key="access_type" size="sm" collection={access_types} onChange={onAccessTypeChange}>
          <SelectLabel fontWeight="extrabold" letterSpacing="-0.3px">Travel Mode</SelectLabel>
          <SelectTrigger>
            <SelectValueText placeholder="Public Transit (Peak)" />
          </SelectTrigger>
          <SelectContent p="1">
            {access_types.items.map((item) => (
              <SelectItem item={item} key={item.value} fontSize="sm" _hover={{ bg: 'yellow.200' }} color="gray.700">
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>

        <SelectRoot key="access" size="sm" mb="1" collection={access_categories} onChange={onAccessChange}>
          <SelectLabel fontWeight="extrabold" letterSpacing="-0.3px">Access Measure</SelectLabel>
          <SelectTrigger>
            <SelectValueText placeholder="Employment" />
          </SelectTrigger>
          <SelectContent p="1">
            {access_categories.items.map((item) => (
              <SelectItem item={item} key={item.value} fontSize="sm" _hover={{ bg: 'yellow.200' }} color="gray.700">
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      </Stack>

      <Box mt="4">
        <Text fontSize="sm" fontWeight="extrabold" letterSpacing="-0.3px" mb="1">
          Accessibility Index
        </Text>
        <Legend min={min} max={max} scale={scale} />
      </Box>

      <Text textStyle="xs" py="4" color="gray.700">
        See how this data was created by Statistics Canada in the <a href="https://publications.gc.ca/site/eng/9.939806/publication.html" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>methodology report</a>.
      </Text>
    </Box>
  );
} 