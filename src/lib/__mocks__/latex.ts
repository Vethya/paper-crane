import { fn } from 'storybook/test'
import type { EngineDownload } from '../latex'

export default fn(async () => '/blank.pdf?resume-fixture')
export const prewarm = fn(async () => {})
export const getEngineDownload = fn((): EngineDownload => null)
export const subscribeEngineDownload = fn(() => () => {})
