import Image from 'next/image'
import { useFormContext, Controller } from 'react-hook-form'
import clsx from 'clsx'

import { FormSection } from './FormSection'
import { TEMPLATES } from '../../../../lib/templates/constants'

import { FormValues } from '../../../../types'

export function TemplatesSection() {
  const { control } = useFormContext<FormValues>()

  return (
    <FormSection title="Choose a Template">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TEMPLATES.map((templateId) => (
          <Controller
            key={templateId}
            control={control}
            name="selectedTemplate"
            render={({ field }) => (
              <label className="relative block cursor-pointer rounded">
                <input
                  type="radio"
                  className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  onChange={() => field.onChange(templateId)}
                  value={templateId}
                  checked={field.value === templateId}
                />
                <div
                  className={clsx(
                    'overflow-hidden rounded border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-900',
                    field.value === templateId
                      ? 'border-primary'
                      : 'border-transparent'
                  )}
                >
                  <Image
                    src={`/templates/previews/template${templateId}.png`}
                    alt={`Template ${templateId}`}
                    width={400}
                    height={560}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                  <div className="bg-[#1e232d] text-white text-center py-3 text-sm tracking-wider">
                    Template {templateId}
                  </div>
                </div>
              </label>
            )}
          />
        ))}
      </div>
    </FormSection>
  )
}
