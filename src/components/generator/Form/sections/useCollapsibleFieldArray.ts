import { useState } from 'react'
import { FieldArray, FieldArrayPath, useFieldArray } from 'react-hook-form'

import { FormValues } from '../../../../types'

export function useCollapsibleFieldArray<
  TName extends FieldArrayPath<FormValues>
>(name: TName) {
  const { fields, append, insert, move, remove } = useFieldArray<
    FormValues,
    TName
  >({
    name
  })
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const appendAndExpand = (value: FieldArray<FormValues, TName>) => {
    append(value)
    setExpandedIndex(fields.length)
  }

  const insertAndExpand = (
    index: number,
    value: FieldArray<FormValues, TName>
  ) => {
    insert(index, value)
    setExpandedIndex(index)
  }

  const removeAndAdjustExpanded = (index: number) => {
    remove(index)
    setExpandedIndex((current) => {
      if (fields.length <= 1) return null
      if (current === null) return null
      if (current === index) return Math.max(0, index - 1)
      if (current > index) return current - 1
      return current
    })
  }

  const moveAndPreserveExpanded = (from: number, to: number) => {
    move(from, to)
    setExpandedIndex((current) => {
      if (current === null) return null
      if (current === from) return to
      if (from < current && current <= to) return current - 1
      if (to <= current && current < from) return current + 1
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
    insertAndExpand,
    moveAndPreserveExpanded,
    removeAndAdjustExpanded,
    setExpandedIndex,
    toggleExpanded
  }
}
