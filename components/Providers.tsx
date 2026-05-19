'use client'

import { type ReactNode } from 'react'
import UserContextProvider from '@/context/UserContextProvider'

export default function Providers({ children }: { children: ReactNode }) {
  return <UserContextProvider>{children}</UserContextProvider>
}
