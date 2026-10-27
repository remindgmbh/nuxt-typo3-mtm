import type { MtmInstance } from '../types'
import { useNuxtApp } from '#imports'

export function useMtm(): MtmInstance {
  return useNuxtApp().$mtm as MtmInstance
}
