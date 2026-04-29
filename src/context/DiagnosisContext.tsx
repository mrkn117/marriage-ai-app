'use client';

import React, { createContext, useContext, useState } from 'react';
import type { DiagnosisResult, FashionSuggestion, DatePlan, UploadedImage } from '@/types';

interface DiagnosisContextValue {
  uploadedImages: UploadedImage[];
  setUploadedImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
  currentDiagnosis: DiagnosisResult | null;
  setCurrentDiagnosis: React.Dispatch<React.SetStateAction<DiagnosisResult | null>>;
  currentFashion: FashionSuggestion | null;
  setCurrentFashion: React.Dispatch<React.SetStateAction<FashionSuggestion | null>>;
  currentDatePlan: DatePlan | null;
  setCurrentDatePlan: React.Dispatch<React.SetStateAction<DatePlan | null>>;
}

const DiagnosisContext = createContext<DiagnosisContextValue | null>(null);

export function DiagnosisProvider({ children }: { children: React.ReactNode }) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [currentDiagnosis, setCurrentDiagnosis] = useState<DiagnosisResult | null>(null);
  const [currentFashion, setCurrentFashion] = useState<FashionSuggestion | null>(null);
  const [currentDatePlan, setCurrentDatePlan] = useState<DatePlan | null>(null);

  return (
    <DiagnosisContext.Provider
      value={{
        uploadedImages,
        setUploadedImages,
        currentDiagnosis,
        setCurrentDiagnosis,
        currentFashion,
        setCurrentFashion,
        currentDatePlan,
        setCurrentDatePlan,
      }}
    >
      {children}
    </DiagnosisContext.Provider>
  );
}

export function useDiagnosis() {
  const ctx = useContext(DiagnosisContext);
  if (!ctx) throw new Error('useDiagnosis must be used within DiagnosisProvider');
  return ctx;
}
