import { StaffData, CSV_HEADERS, HEADER_KEY_MAP } from '../types';

export const parseCSV = (csv: string): StaffData[] => {
  // Normalize line endings
  const normalizedCsv = csv.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalizedCsv.split("\n");

  // The provided CSV has 2 header rows of title, then the actual headers on the 3rd row.
  // We look for the line starting with "BIL" to identify the header row.
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("BIL,NAMA")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) return [];

  const rawHeaders = splitCSVLine(lines[headerIndex]);
  const data: StaffData[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = splitCSVLine(line);
    const entry: any = {};

    // Map each value to our friendly keys based on the raw headers
    // We iterate through our defined keys and find the matching index in rawHeaders
    const keys = Object.keys(HEADER_KEY_MAP);
    
    keys.forEach(key => {
        const expectedHeader = HEADER_KEY_MAP[key];
        // Find index of this header in the parsed raw headers.
        // We do a loose check because splitCSVLine might handle newlines differently than exact string match
        const index = rawHeaders.findIndex(h => h.includes(expectedHeader.split('\n')[0])); // simplistic match
        
        // If simplistic match fails, try exact match or positional if we assume order
        // Since CSV order is fixed in the prompt, let's rely on index in CSV_HEADERS
        const fixedIndex = CSV_HEADERS.indexOf(expectedHeader);
        
        if (fixedIndex !== -1 && fixedIndex < values.length) {
            entry[key] = values[fixedIndex] || "";
        } else {
            entry[key] = "";
        }
    });
    
    // Add raw original line info if needed, but here we just construct the object
    data.push(entry as StaffData);
  }

  return data;
};

// Helper to handle CSV splitting with quoted values containing commas/newlines
const splitCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  // Clean up leading/trailing quotes from values if they exist
  return result.map(val => {
     if (val.startsWith('"') && val.endsWith('"')) {
         return val.substring(1, val.length - 1).replace(/""/g, '"'); // handle escaped quotes
     }
     return val;
  });
};

export const exportToCSV = (data: StaffData[]): string => {
  // Reconstruct the Top 2 Header Lines
  const headerLines = [
    "SK SRI AMAN,,,,,,,,,,,,,,,,,,,,,,,,,,",
    ",UPDATE ( SENARAI PPP DAN DIIKUTI AKP ),,,,,,,,,,,,,,,,,,,,,,,,,"
  ];

  // The Header Row
  // We must ensure the order matches CSV_HEADERS
  const headerRow = CSV_HEADERS.map(h => `"${h.replace(/"/g, '""')}"`).join(",");
  
  const bodyRows = data.map(staff => {
    return CSV_HEADERS.map(header => {
      // Find the key associated with this header
      const key = Object.keys(HEADER_KEY_MAP).find(k => HEADER_KEY_MAP[k] === header);
      if (!key) return "";
      const val = staff[key] || "";
      // Escape value
      if (val.includes(",") || val.includes("\n") || val.includes('"')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(",");
  });

  return [...headerLines, headerRow, ...bodyRows].join("\n");
};