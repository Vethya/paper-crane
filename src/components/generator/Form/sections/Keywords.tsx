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

export default function Keywords({
  name,
  label,
  placeholder,
  className
}: KeywordProps) {
  const { getValues } = useFormContext()
  const { fields, append, remove } = useFieldArray({ name })

  return (
    <div className={twMerge(clsx('min-w-0', className))}>
      <label className="mb-2 inline-block text-white">{label}</label>
      <FormInput onSubmit={append} />
      <div className="my-2 flex w-full min-w-0 max-w-full flex-wrap items-start gap-1 overflow-hidden">
        {fields.map((field, i) => (
          <Fragment key={field.id}>
            <div
              className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-full border px-4 py-2 pr-1"
              style={{ borderColor: '#4b5563' }}
            >
              <span className="block min-w-0 max-w-full truncate">
                {getValues(`${name}.${i}`)}
              </span>
              <IconButton
                type="button"
                onClick={() => remove(i)}
                className="shrink-0"
              >
                <MdClose />
              </IconButton>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
