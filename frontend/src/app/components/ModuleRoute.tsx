// src/app/components/ModuleRoute.tsx
import React, { ReactElement } from 'react'
import { ModuleKey } from '@shared/types'
import { RequireModule } from 'src/app/components/RequireModule'

// Observação: Auth já é garantido pelo PrivateRoutes/MasterLayout.
// Aqui só compomos o guard de MÓDULO.
type Props = {
  moduleKey: ModuleKey
  element: ReactElement
}

export function ModuleRoute({ moduleKey, element }: Props) {
  return <RequireModule moduleKey={moduleKey}>{element}</RequireModule>
}