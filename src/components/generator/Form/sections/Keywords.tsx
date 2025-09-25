import { Fragment } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { MdClose } from 'react-icons/md'
import { IconButton } from '../../../core/Button'
import { FormInput } from '../../../core/FormInput'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface KeywordProps {
  label: string
  name: `${'skills' | 'projects'}.${number}.keywords`
  placeholder: string
  className?: string
}

export default function Keywords({ name, label, placeholder, className }: KeywordProps) {
  const { getValues } = useFormContext()
  const { fields, append, remove } = useFieldArray({ name })

  return (
    <div className={twMerge(clsx("", className))}>
      <label className="inline-block text-white mb-2">{label}</label>
      <FormInput onSubmit={append} />
      <div className="flex gap-1 my-2 items-start flex-wrap">
        {fields.map((field, i) => (
          <Fragment key={field.id}>
            <div className="inline-flex border rounded-full px-4 py-2 pr-1 gap-1" style={{ borderColor: '#4b5563' }}>
              {getValues(`${name}.${i}`)}
              <IconButton type="button" onClick={() => remove(i)}>
                <MdClose />
              </IconButton>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
