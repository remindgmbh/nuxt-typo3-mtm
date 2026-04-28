import { useNuxtApp } from '#imports'
import type { MtmInstance } from '../types'

export function useMtm(): MtmInstance {
  return useNuxtApp().$mtm as MtmInstance
}
