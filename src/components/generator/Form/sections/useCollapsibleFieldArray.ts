import { useEffect, useState } from 'react'
import { FieldArray, FieldArrayPath, useFieldArray } from 'react-hook-form'

import { FormValues } from '../../../../types'

export function useCollapsibleFieldArray<
  TName extends FieldArrayPath<FormValues>
>(
  name: TName,
  focusedReviewEntry?: { entryIndex: number; editId: string } | null
) {
  const { fields, append, remove } = useFieldArray<FormValues, TName>({ name })
  const focusedEntryIndex = focusedReviewEntry?.entryIndex
  const focusedEditId = focusedReviewEntry?.editId
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    focusedEntryIndex ?? 0
  )

  useEffect(() => {
    if (focusedEntryIndex === undefined) return
    setExpandedIndex(focusedEntryIndex)
  }, [focusedEntryIndex, focusedEditId])

  const appendAndExpand = (value: FieldArray<FormValues, TName>) => {
    append(value)
    setExpandedIndex(fields.length)
  }

  const removeAndAdjustExpanded = (index: number) => {
    remove(index)
    setExpandedIndex((current) => {
      if (current === null) return null
      if (current === index) return Math.max(0, index - 1)
      if (current > index) return current - 1
      return current
    })
  }

  const toggleExpanded = (index: number) => {
    setExpandedIndex((current) => (current === index ? null : index))
  }

  return {
    fields,
    expandedIndex,
    appendAndExpand,
    removeAndAdjustExpanded,
    toggleExpanded
  }
}
