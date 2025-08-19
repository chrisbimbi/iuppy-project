import React, { createContext, useContext, useState } from 'react'

interface SurveyContextProps {
  selectedSurveyId: string | null
  setSelectedSurveyId: (id: string | null) => void
}

const SurveyContext = createContext<SurveyContextProps>({
  selectedSurveyId: null,
  setSelectedSurveyId: () => { },
})

export const useSurveyContext = () => useContext(SurveyContext)

export const SurveyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)

  return (
    <SurveyContext.Provider value={{ selectedSurveyId, setSelectedSurveyId }}>
      {children}
    </SurveyContext.Provider>
  )
}