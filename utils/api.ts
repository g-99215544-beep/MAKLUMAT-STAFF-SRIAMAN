import { StaffData, HEADER_KEY_MAP } from '../types';

// Helper to flip the mapping: { "NO_IC": "NO IC" } -> { "NO IC": "NO_IC" }
const getReverseKeyMap = () => {
  const reverseMap: Record<string, string> = {};
  Object.keys(HEADER_KEY_MAP).forEach(internalKey => {
    const csvHeader = HEADER_KEY_MAP[internalKey];
    // In the CSV helper, we sometimes handle multi-line headers. 
    // The sheet usually returns the full string or simplified.
    // For exact matching with sheet data, we use the value from HEADER_KEY_MAP.
    reverseMap[csvHeader] = internalKey;
    
    // Also map the single line version just in case getDisplayValues simplifies it
    reverseMap[csvHeader.replace(/\n/g, " ")] = internalKey;
    reverseMap[csvHeader.split('\n')[0]] = internalKey;
  });
  return reverseMap;
};

export const fetchGoogleSheetData = async (url: string): Promise<StaffData[]> => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow'
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const rawData = await response.json();
    
    if (!Array.isArray(rawData)) {
        throw new Error("Invalid data format from Sheet");
    }

    // MAP RAW SHEET DATA TO INTERNAL TYPES
    // Sheet returns: { "NO KAD PENGENALAN": "123" }
    // App needs: { "NO_KAD_PENGENALAN": "123" }
    
    const reverseMap = getReverseKeyMap();
    const headers = Object.keys(HEADER_KEY_MAP); // List of all internal keys we care about

    const mappedData: StaffData[] = rawData.map((row: any) => {
        const newEntry: any = {};
        
        // Loop through our known internal keys (BIL, NAMA, etc)
        headers.forEach(internalKey => {
            const sheetHeader = HEADER_KEY_MAP[internalKey];
            
            // Try to find the value in the raw row using the exact header string
            // or variants (handling potential newline diffs between code and sheet)
            let val = row[sheetHeader];
            
            // If undefined, try looking for the key in raw row that *contains* the header part
            // This helps if Sheet has "Title\nSubtitle" but JSON returns "Title Subtitle"
            if (val === undefined) {
               const rawRowKey = Object.keys(row).find(k => k.includes(sheetHeader.split('\n')[0]));
               if (rawRowKey) val = row[rawRowKey];
            }

            newEntry[internalKey] = val !== undefined ? String(val) : "";
        });

        // Ensure critical fields exist
        if (!newEntry.BIL) newEntry.BIL = row["BIL"] || "";
        
        return newEntry as StaffData;
    });

    return mappedData;

  } catch (error) {
    console.error("Error fetching sheet data:", error);
    throw error;
  }
};

export const saveToGoogleSheet = async (url: string, staffData: StaffData): Promise<boolean> => {
  try {
    // We send both the data AND the key map.
    // This allows the Apps Script to know which Sheet Column corresponds to which Data Key.
    
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', 
      },
      body: JSON.stringify({
        action: 'update',
        data: staffData,
        keyMap: HEADER_KEY_MAP // Send the translation map to the backend
      })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error("Error saving to sheet:", error);
    return false;
  }
};
