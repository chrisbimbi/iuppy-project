import {useContext} from 'react'
import {IntlContext} from 'react-intl'

export function useLanguage() {
  const intlContext = useContext(IntlContext)
  return intlContext?.locale || 'pt-BR' // Valor padrão caso o contexto seja null
}

export function useLang(): 'en' | 'de' | 'es' | 'fr' | 'ja' | 'zh' | 'pt-BR' {
  return useLanguage() as 'en' | 'de' | 'es' | 'fr' | 'ja' | 'zh' | 'pt-BR'
}

export function setLanguage(lang: string) {
  localStorage.setItem('language', lang)
  window.location.reload()
}

const languages = [
  {
    lang: 'en',
    name: 'English',
    flag: '/media/flags/united-states.svg',
  },
  {
    lang: 'pt-BR',
    name: 'Português',
    flag: '/media/flags/brazil.svg',
  },
  // ... outros idiomas
]

export function getLanguage(lang: string) {
  return languages.find((l) => l.lang === lang)
}

export function getLanguages() {
  return languages
}