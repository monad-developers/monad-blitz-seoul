import React, { createContext, useContext, useState } from 'react';

// 타입 정의
interface EventData {
  id: number;
  eventName: string;
  startDate: string;
  startHour: string;
  startMinute: string;
  endDate: string;
  endHour: string;
  endMinute: string;
  capacity: string;
  customCapacity: number;
  csvFile: File | null;
  status: string;
}

interface Prize {
  id: number;
  rank: string;
  name: string;
  image: string;
  winners: number;
  description?: string;
}

interface Field {
  id: number;
  name: string;
  isRequired: boolean;
  isDefault?: boolean;
  isFixed?: boolean;
}

interface Entry {
  id: number;
  entryNumber: number;
  name: string;
  email: string;
  ethAddress: string;
  timestamp: string;
  isWinner: boolean;
  prizeRank: number | null;
}

interface EntryData {
  totalEntries: number;
  entries: Entry[];
}

interface Winner {
  number: number;
  name: string;
  ethAddress: string;
}

interface Result {
  rank: number;
  prizeName: string;
  prizeImage: string;
  winners: Winner[];
}

interface EventContextType {
  eventData: EventData;
  updateEventData: (newData: Partial<EventData>) => void;
  prizes: Prize[];
  updatePrizes: (newPrizes: Prize[]) => void;
  fields: Field[];
  updateFields: (newFields: Field[]) => void;
  customFields: Field[];
  updateCustomFields: (newCustomFields: Field[]) => void;
  entryData: EntryData;
  addEntry: (entry: Omit<Entry, 'id' | 'entryNumber' | 'timestamp' | 'isWinner' | 'prizeRank'>) => void;
  results: Result[];
  setResults: (results: Result[]) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvent = (): EventContextType => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [eventData, setEventData] = useState<EventData>({
    id: 1, // 실제 이벤트 생성 시 동적으로 할당 필요
    eventName: '2025년 신년 경품 이벤트',
    startDate: '2025-01-15',
    startHour: '10',
    startMinute: '00',
    endDate: '2025-01-15',
    endHour: '18',
    endMinute: '00',
    capacity: 'unlimited',
    customCapacity: 100,
    csvFile: null,
    status: 'active' // active, ended
  });

  const [prizes, setPrizes] = useState([
    {
      id: 1,
      rank: '1등 경품',
      name: 'iPhone 15 Pro Max',
      image: '/api/placeholder/400/300',
      winners: 1
    },
    {
      id: 2,
      rank: '2등 경품',
      name: 'AirPods Pro 2세대',
      image: '/api/placeholder/400/300',
      winners: 3
    },
    {
      id: 3,
      rank: '3등 경품',
      name: '스타벅스 기프트카드',
      image: '/api/placeholder/400/300',
      winners: 10
    }
  ]);

  const [fields, setFields] = useState<Field[]>([]);

  const [customFields, setCustomFields] = useState<Field[]>([]);

  // 더미 응모 데이터
  const [entryData, setEntryData] = useState({
    totalEntries: 147,
    entries: [
      {
        id: 1,
        entryNumber: 1,
        name: '김**',
        email: 'kim***@gmail.com',
        ethAddress: '0x742d35Cc6532C0532C175a0532C0532EcDa3fE6f',
        timestamp: '2025-01-15T10:15:23',
        isWinner: false,
        prizeRank: null
      },
      {
        id: 2,
        entryNumber: 45,
        name: '이**',
        email: 'lee***@naver.com',
        ethAddress: '0x8ba1f109551bD432803012645Hac42c9cb982BF23A',
        timestamp: '2025-01-15T11:23:45',
        isWinner: true,
        prizeRank: 1
      },
      {
        id: 3,
        entryNumber: 82,
        name: '박**',
        email: 'park***@hanmail.net',
        ethAddress: '0x9Cb982BF23A8ba1f109551bD432803012645Hac42c',
        timestamp: '2025-01-15T12:34:12',
        isWinner: true,
        prizeRank: 2
      },
      {
        id: 4,
        entryNumber: 103,
        name: '최**',
        email: 'choi***@gmail.com',
        ethAddress: '0x5Hac42c9cb982BF23A8ba1f109551bD432803012645',
        timestamp: '2025-01-15T13:45:33',
        isWinner: true,
        prizeRank: 2
      },
      {
        id: 5,
        entryNumber: 127,
        name: '정**',
        email: 'jung***@yahoo.com',
        ethAddress: '0x803012645Hac42c9cb982BF23A8ba1f109551bD432',
        timestamp: '2025-01-15T14:22:17',
        isWinner: true,
        prizeRank: 3
      }
    ]
  });

  // 당첨 결과 데이터
  const [results, setResults] = useState([
    {
      rank: 1,
      prizeName: 'iPhone 15 Pro Max',
      prizeImage: '/api/placeholder/400/300',
      winners: [
        { number: 45, name: '이*수', ethAddress: '0x8ba1f109551bD432803012645Hac42c9cb982BF23A' }
      ]
    },
    {
      rank: 2,
      prizeName: 'AirPods Pro 2세대',
      prizeImage: '/api/placeholder/400/300',
      winners: [
        { number: 82, name: '박*영', ethAddress: '0x9Cb982BF23A8ba1f109551bD432803012645Hac42c' },
        { number: 103, name: '최*민', ethAddress: '0x5Hac42c9cb982BF23A8ba1f109551bD432803012645' }
      ]
    },
    {
      rank: 3,
      prizeName: '스타벅스 기프트카드',
      prizeImage: '/api/placeholder/400/300',
      winners: [
        { number: 127, name: '정*호', ethAddress: '0x803012645Hac42c9cb982BF23A8ba1f109551bD432' },
        { number: 89, name: '김*지', ethAddress: '0x742d35Cc6532C0532C175a0532C0532EcDa3fE6f' },
        { number: 156, name: '송*아', ethAddress: '0x1234567890123456789012345678901234567890' }
      ]
    }
  ]);

  const updateEventData = (newData: Partial<EventData>) => {
    setEventData(prev => ({ ...prev, ...newData }));
  };

  const updatePrizes = (newPrizes: Prize[]) => {
    setPrizes(newPrizes);
  };

  const updateFields = (newFields: Field[]) => {
    setFields(newFields);
  };

  const updateCustomFields = (newCustomFields: Field[]) => {
    setCustomFields(newCustomFields);
  };

  const addEntry = (entry: Omit<Entry, 'id' | 'entryNumber' | 'timestamp' | 'isWinner' | 'prizeRank'>) => {
    const newEntry = {
      ...entry,
      id: entryData.entries.length + 1,
      entryNumber: entryData.totalEntries + 1,
      timestamp: new Date().toISOString(),
      isWinner: false,
      prizeRank: null
    };
    
    setEntryData(prev => ({
      totalEntries: prev.totalEntries + 1,
      entries: [...prev.entries, newEntry]
    }));
  };

  const value = {
    eventData,
    updateEventData,
    prizes,
    updatePrizes,
    fields,
    updateFields,
    customFields,
    updateCustomFields,
    entryData,
    addEntry,
    results,
    setResults
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};