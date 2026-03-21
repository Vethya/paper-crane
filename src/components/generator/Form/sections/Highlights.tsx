import { Fragment } from 'react'
import { useFieldArray } from 'react-hook-form'
import { MdClose, MdDragIndicator } from 'react-icons/md'
import { Input } from '../../../core/Input'
import { FormInput } from '../../../core/FormInput'
import { IconButton } from '../../../core/Button'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface HighlightsProps {
  label: string
  name: `work.${number}.highlights`
  placeholder: string
  className?: string
}

export default function Highlights({
  name,
  label,
  placeholder,
  className
}: HighlightsProps) {
  const { fields, append, remove } = useFieldArray({ name })

  return (
    <div className={twMerge(clsx("", className))}>
      <label className="block mb-2 text-white">{label}</label>
      <div className="grid grid-cols-[auto_1fr_auto] gap-1 my-2">
        {fields.map((field, i) => (
          <Fragment key={field.id}>
            <IconButton type="button" className="cursor-grab">
              <MdDragIndicator />
            </IconButton>
            <Input name={`${name}.${i}`} placeholder={placeholder} />
            <IconButton type="button" onClick={() => remove(i)}>
              <MdClose />
            </IconButton>
          </Fragment>
        ))}
        <FormInput className="col-start-2 col-end-3" onSubmit={append} />
      </div>
    </div>
  )
}
